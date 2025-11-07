import { Router } from 'express'
import { body, query, param } from 'express-validator'
import { authenticate, authorize } from '../middleware/auth'
import { validationResult } from 'express-validator'
import { PrismaClient } from '@prisma/client'
import nodemailer from 'nodemailer'
import { readFileSync } from 'fs'
import { join } from 'path'
import handlebars from 'handlebars'

const router = Router()
const prisma = new PrismaClient()

// Email transporter configuration
const createTransporter = () => {
  if (process.env.NODE_ENV === 'production') {
    // Production email configuration (e.g., SendGrid, AWS SES)
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
  } else {
    // Development configuration
    return nodemailer.createTransporter({
      host: 'localhost',
      port: 1025,
      ignoreTLS: true
    })
  }
}

const transporter = createTransporter()

// Validation middleware
const validate = (req: any, res: any, next: any) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation error', details: errors.array() })
  }
  next()
}

// Email template compiler
const compileTemplate = (templateName: string, data: any) => {
  try {
    const templatePath = join(__dirname, '..', 'templates', 'email', `${templateName}.hbs`)
    const templateSource = readFileSync(templatePath, 'utf8')
    const template = handlebars.compile(templateSource)
    return template(data)
  } catch (error) {
    // Fallback to simple text if template not found
    return JSON.stringify(data, null, 2)
  }
}

// All routes require authentication
router.use(authenticate)

// Send project invitation email
router.post('/invite/project', [
  body('email').isEmail().normalizeEmail(),
  body('projectId').isUUID(),
  body('role').isIn(['viewer', 'member', 'lead']),
  body('message').optional().isString(),
  validate
], async (req: any, res: any) => {
  try {
    const { email, projectId, role, message } = req.body
    const senderId = req.user.id
    const organizationId = req.user.organizationId

    // Get project details
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId
      }
    })

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      })
    }

    // Get sender details
    const sender = await prisma.user.findUnique({
      where: { id: senderId }
    })

    // Create invitation token
    const invitationToken = Buffer.from(JSON.stringify({
      projectId,
      email,
      role,
      organizationId,
      invitedBy: senderId,
      timestamp: Date.now()
    })).toString('base64')

    // Prepare email data
    const emailData = {
      projectName: project.name,
      inviterName: `${sender?.firstName} ${sender?.lastName}`,
      role,
      message,
      acceptUrl: `${process.env.FRONTEND_URL}/invitations/accept?token=${invitationToken}`,
      organizationName: req.user.organizationName
    }

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@daritana.com',
      to: email,
      subject: `You've been invited to join ${project.name}`,
      html: compileTemplate('project-invitation', emailData),
      text: `You've been invited to join ${project.name} as a ${role}. Click here to accept: ${emailData.acceptUrl}`
    }

    await transporter.sendMail(mailOptions)

    // Log email activity
    await prisma.emailLog.create({
      data: {
        organizationId,
        recipientEmail: email,
        senderUserId: senderId,
        subject: mailOptions.subject,
        template: 'project-invitation',
        status: 'SENT',
        metadata: {
          projectId,
          role
        }
      }
    })

    res.json({
      success: true,
      message: 'Invitation email sent successfully'
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to send invitation email',
      message: error.message
    })
  }
})

// Send task notification email
router.post('/notify/task', [
  body('taskId').isUUID(),
  body('recipientId').isUUID(),
  body('type').isIn(['assigned', 'completed', 'commented', 'due_soon', 'overdue']),
  validate
], async (req: any, res: any) => {
  try {
    const { taskId, recipientId, type } = req.body
    const organizationId = req.user.organizationId

    // Get task details
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        organizationId
      },
      include: {
        project: true,
        assignee: true,
        creator: true
      }
    })

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      })
    }

    // Get recipient details
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId }
    })

    if (!recipient) {
      return res.status(404).json({
        success: false,
        error: 'Recipient not found'
      })
    }

    // Check notification preferences
    const preferences = await prisma.notificationPreference.findFirst({
      where: {
        userId: recipientId,
        organizationId
      }
    })

    if (preferences && !preferences.emailEnabled) {
      return res.json({
        success: true,
        message: 'Email notifications disabled for user'
      })
    }

    // Prepare email based on type
    let subject = ''
    let templateName = ''
    const emailData: any = {
      taskTitle: task.title,
      projectName: task.project.name,
      taskUrl: `${process.env.FRONTEND_URL}/projects/${task.projectId}/tasks/${task.id}`,
      recipientName: `${recipient.firstName} ${recipient.lastName}`
    }

    switch (type) {
      case 'assigned':
        subject = `New task assigned: ${task.title}`
        templateName = 'task-assigned'
        emailData.assignedBy = `${task.creator?.firstName} ${task.creator?.lastName}`
        emailData.dueDate = task.dueDate
        break

      case 'completed':
        subject = `Task completed: ${task.title}`
        templateName = 'task-completed'
        emailData.completedBy = req.user.name
        break

      case 'commented':
        subject = `New comment on: ${task.title}`
        templateName = 'task-commented'
        emailData.commenterName = req.user.name
        break

      case 'due_soon':
        subject = `Task due soon: ${task.title}`
        templateName = 'task-due-soon'
        emailData.dueDate = task.dueDate
        emailData.hoursRemaining = Math.round((new Date(task.dueDate!).getTime() - Date.now()) / (1000 * 60 * 60))
        break

      case 'overdue':
        subject = `Task overdue: ${task.title}`
        templateName = 'task-overdue'
        emailData.dueDate = task.dueDate
        emailData.daysOverdue = Math.round((Date.now() - new Date(task.dueDate!).getTime()) / (1000 * 60 * 60 * 24))
        break
    }

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@daritana.com',
      to: recipient.email,
      subject,
      html: compileTemplate(templateName, emailData),
      text: `${subject}. View task: ${emailData.taskUrl}`
    }

    await transporter.sendMail(mailOptions)

    // Log email
    await prisma.emailLog.create({
      data: {
        organizationId,
        recipientEmail: recipient.email,
        senderUserId: req.user.id,
        subject,
        template: templateName,
        status: 'SENT',
        metadata: {
          taskId,
          type
        }
      }
    })

    res.json({
      success: true,
      message: 'Notification email sent successfully'
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to send notification email',
      message: error.message
    })
  }
})

// Send weekly digest
router.post('/digest/weekly', authorize(['ORG_ADMIN']), async (req: any, res: any) => {
  try {
    const organizationId = req.user.organizationId

    // Get all active members with email notifications enabled
    const members = await prisma.organizationMember.findMany({
      where: {
        organizationId,
        status: 'ACTIVE'
      },
      include: {
        user: true
      }
    })

    const emailPromises = members.map(async (member) => {
      // Check preferences
      const preferences = await prisma.notificationPreference.findFirst({
        where: {
          userId: member.userId,
          organizationId
        }
      })

      if (preferences && (!preferences.emailEnabled || !preferences.weeklyDigest)) {
        return null
      }

      // Gather weekly stats
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

      const [
        tasksCompleted,
        newTasks,
        projectUpdates,
        upcomingDeadlines
      ] = await Promise.all([
        prisma.task.count({
          where: {
            organizationId,
            assigneeId: member.userId,
            status: 'DONE',
            updatedAt: { gte: weekAgo }
          }
        }),
        prisma.task.count({
          where: {
            organizationId,
            assigneeId: member.userId,
            createdAt: { gte: weekAgo }
          }
        }),
        prisma.project.count({
          where: {
            organizationId,
            updatedAt: { gte: weekAgo },
            OR: [
              { projectLeadId: member.userId },
              { teamMembers: { some: { userId: member.userId } } }
            ]
          }
        }),
        prisma.task.findMany({
          where: {
            organizationId,
            assigneeId: member.userId,
            status: { not: 'DONE' },
            dueDate: {
              gte: new Date(),
              lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
          },
          take: 5,
          orderBy: { dueDate: 'asc' }
        })
      ])

      const emailData = {
        recipientName: `${member.user.firstName} ${member.user.lastName}`,
        weekStart: weekAgo.toLocaleDateString(),
        weekEnd: new Date().toLocaleDateString(),
        tasksCompleted,
        newTasks,
        projectUpdates,
        upcomingDeadlines,
        dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@daritana.com',
        to: member.user.email,
        subject: 'Your Weekly Daritana Digest',
        html: compileTemplate('weekly-digest', emailData)
      }

      await transporter.sendMail(mailOptions)

      await prisma.emailLog.create({
        data: {
          organizationId,
          recipientEmail: member.user.email,
          senderUserId: req.user.id,
          subject: mailOptions.subject,
          template: 'weekly-digest',
          status: 'SENT'
        }
      })

      return member.user.email
    })

    const results = await Promise.all(emailPromises)
    const sentEmails = results.filter(Boolean)

    res.json({
      success: true,
      message: `Weekly digest sent to ${sentEmails.length} members`
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to send weekly digest',
      message: error.message
    })
  }
})

// Get email templates
router.get('/templates', authorize(['ORG_ADMIN']), async (req: any, res: any) => {
  try {
    const templates = await prisma.emailTemplate.findMany({
      where: {
        OR: [
          { organizationId: req.user.organizationId },
          { organizationId: null } // System templates
        ]
      },
      orderBy: { name: 'asc' }
    })

    res.json({
      success: true,
      templates
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch email templates',
      message: error.message
    })
  }
})

// Update notification preferences
router.put('/preferences', [
  body('emailEnabled').optional().isBoolean(),
  body('pushEnabled').optional().isBoolean(),
  body('smsEnabled').optional().isBoolean(),
  body('weeklyDigest').optional().isBoolean(),
  body('instantNotifications').optional().isBoolean(),
  body('taskReminders').optional().isBoolean(),
  body('projectUpdates').optional().isBoolean(),
  validate
], async (req: any, res: any) => {
  try {
    const userId = req.user.id
    const organizationId = req.user.organizationId
    const updates = req.body

    // Find or create preferences
    let preferences = await prisma.notificationPreference.findFirst({
      where: {
        userId,
        organizationId
      }
    })

    if (preferences) {
      preferences = await prisma.notificationPreference.update({
        where: { id: preferences.id },
        data: updates
      })
    } else {
      preferences = await prisma.notificationPreference.create({
        data: {
          userId,
          organizationId,
          ...updates
        }
      })
    }

    res.json({
      success: true,
      preferences
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to update notification preferences',
      message: error.message
    })
  }
})

// Get email logs
router.get('/logs', [
  query('status').optional().isIn(['PENDING', 'SENT', 'FAILED', 'BOUNCED']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  validate
], authorize(['ORG_ADMIN']), async (req: any, res: any) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query
    const organizationId = req.user.organizationId

    const where: any = { organizationId }
    if (status) where.status = status

    const [logs, total] = await Promise.all([
      prisma.emailLog.findMany({
        where,
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
        orderBy: { createdAt: 'desc' },
        include: {
          senderUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      }),
      prisma.emailLog.count({ where })
    ])

    res.json({
      success: true,
      logs,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch email logs',
      message: error.message
    })
  }
})

// Test email configuration
router.post('/test', [
  body('email').isEmail().normalizeEmail(),
  validate
], authorize(['ORG_ADMIN']), async (req: any, res: any) => {
  try {
    const { email } = req.body

    const testMail = {
      from: process.env.EMAIL_FROM || 'noreply@daritana.com',
      to: email,
      subject: 'Daritana Email Configuration Test',
      html: '<h1>Test Email</h1><p>If you received this email, your email configuration is working correctly!</p>',
      text: 'Test Email - If you received this email, your email configuration is working correctly!'
    }

    await transporter.sendMail(testMail)

    res.json({
      success: true,
      message: 'Test email sent successfully'
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to send test email',
      message: error.message,
      details: error.stack
    })
  }
})

export default router