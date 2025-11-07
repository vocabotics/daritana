import { Request, Response } from 'express'
import { prisma } from '../server'
import { MultiTenantRequest } from '../middleware/multi-tenant-auth'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import jwt from 'jsonwebtoken'

// Email transporter configuration
const getTransporter = () => {
  if (process.env.NODE_ENV === 'production') {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
  }
  
  // Development: Use Ethereal Email for testing
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: 'ethereal.user@ethereal.email',
      pass: 'ethereal.pass'
    }
  })
}

/**
 * Send invitation to join organization
 */
export const inviteToOrganization = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { email, role, message, projects } = req.body
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    // Check if user has permission to invite
    if (!req.user?.permissions?.includes('members.invite')) {
      return res.status(403).json({ error: 'No permission to invite members' })
    }

    // Check organization limits
    const memberCount = await prisma.organizationMember.count({
      where: { organizationId }
    })

    if (req.organization?.limits && memberCount >= req.organization.limits.maxUsers) {
      return res.status(403).json({ 
        error: 'Organization member limit reached',
        limit: req.organization.limits.maxUsers,
        current: memberCount
      })
    }

    // Check if user already exists and is a member
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: {
        organizations: {
          where: { organizationId }
        }
      }
    })

    if (existingUser?.organizations.length > 0) {
      return res.status(400).json({ error: 'User is already a member of this organization' })
    }

    // Check for pending invitation
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email,
        organizationId,
        status: 'PENDING'
      }
    })

    if (existingInvitation) {
      return res.status(400).json({ error: 'Invitation already sent to this email' })
    }

    // Generate invitation token
    const inviteToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

    // Create invitation record
    const invitation = await prisma.invitation.create({
      data: {
        email,
        role,
        token: inviteToken,
        organizationId,
        invitedById: req.user.id,
        message,
        projectIds: projects || [],
        expiresAt,
        status: 'PENDING'
      },
      include: {
        organization: true,
        invitedBy: true
      }
    })

    // Send invitation email
    const transporter = getTransporter()
    const inviteUrl = `${process.env.FRONTEND_URL}/invite/${inviteToken}`

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@daritana.com',
      to: email,
      subject: `Invitation to join ${invitation.organization.name} on Daritana`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>You're invited to join ${invitation.organization.name}</h2>
          <p>${invitation.invitedBy.name || invitation.invitedBy.email} has invited you to join their organization on Daritana.</p>
          ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
          <p>You'll be joining as: <strong>${role}</strong></p>
          <div style="margin: 30px 0;">
            <a href="${inviteUrl}" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              Accept Invitation
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            This invitation will expire in 7 days.<br>
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
      `
    })

    res.status(201).json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt
      }
    })
  } catch (error) {
    console.error('Invitation error:', error)
    res.status(500).json({ error: 'Failed to send invitation' })
  }
}

/**
 * Accept invitation and join organization
 */
export const acceptInvitation = async (req: Request, res: Response) => {
  try {
    const { token } = req.params
    const { password, name } = req.body

    // Find valid invitation
    const invitation = await prisma.invitation.findFirst({
      where: {
        token,
        status: 'PENDING',
        expiresAt: { gt: new Date() }
      },
      include: {
        organization: true
      }
    })

    if (!invitation) {
      return res.status(404).json({ error: 'Invalid or expired invitation' })
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: invitation.email }
    })

    if (!user) {
      // Create new user
      const bcrypt = require('bcrypt')
      const hashedPassword = await bcrypt.hash(password, 10)

      user = await prisma.user.create({
        data: {
          email: invitation.email,
          password: hashedPassword,
          name: name || invitation.email.split('@')[0],
          username: invitation.email.split('@')[0],
          isActive: true,
          emailVerified: true
        }
      })
    }

    // Add user to organization
    const membership = await prisma.organizationMember.create({
      data: {
        userId: user.id,
        organizationId: invitation.organizationId,
        role: invitation.role,
        joinedAt: new Date(),
        isActive: true
      }
    })

    // Add to invited projects if specified
    if (invitation.projectIds.length > 0) {
      await prisma.projectMember.createMany({
        data: invitation.projectIds.map(projectId => ({
          projectId,
          userId: user.id,
          role: 'MEMBER',
          permissions: ['view', 'comment']
        }))
      })
    }

    // Update invitation status
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date()
      }
    })

    // Create session for new user
    const sessionToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        username: user.username,
        organizationId: invitation.organizationId,
        organizationRole: invitation.role
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    await prisma.session.create({
      data: {
        token: sessionToken,
        userId: user.id,
        organizationId: invitation.organizationId,
        expiresAt
      }
    })

    res.json({
      success: true,
      token: sessionToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: invitation.role
      },
      organization: {
        id: invitation.organization.id,
        name: invitation.organization.name
      }
    })
  } catch (error) {
    console.error('Accept invitation error:', error)
    res.status(500).json({ error: 'Failed to accept invitation' })
  }
}

/**
 * List pending invitations for organization
 */
export const listInvitations = async (req: MultiTenantRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    const invitations = await prisma.invitation.findMany({
      where: {
        organizationId,
        status: 'PENDING'
      },
      include: {
        invitedBy: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(invitations)
  } catch (error) {
    console.error('List invitations error:', error)
    res.status(500).json({ error: 'Failed to list invitations' })
  }
}

/**
 * Cancel invitation
 */
export const cancelInvitation = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { id } = req.params
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    const invitation = await prisma.invitation.findFirst({
      where: {
        id,
        organizationId,
        status: 'PENDING'
      }
    })

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' })
    }

    await prisma.invitation.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledById: req.user?.id
      }
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Cancel invitation error:', error)
    res.status(500).json({ error: 'Failed to cancel invitation' })
  }
}

/**
 * Resend invitation email
 */
export const resendInvitation = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { id } = req.params
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    const invitation = await prisma.invitation.findFirst({
      where: {
        id,
        organizationId,
        status: 'PENDING'
      },
      include: {
        organization: true,
        invitedBy: true
      }
    })

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' })
    }

    // Extend expiry
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    await prisma.invitation.update({
      where: { id },
      data: { expiresAt }
    })

    // Resend email
    const transporter = getTransporter()
    const inviteUrl = `${process.env.FRONTEND_URL}/invite/${invitation.token}`

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@daritana.com',
      to: invitation.email,
      subject: `Reminder: Invitation to join ${invitation.organization.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Reminder: You're invited to join ${invitation.organization.name}</h2>
          <p>This is a reminder that ${invitation.invitedBy.name || invitation.invitedBy.email} has invited you to join their organization.</p>
          <div style="margin: 30px 0;">
            <a href="${inviteUrl}" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              Accept Invitation
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            This invitation will expire in 7 days.
          </p>
        </div>
      `
    })

    res.json({ success: true, expiresAt })
  } catch (error) {
    console.error('Resend invitation error:', error)
    res.status(500).json({ error: 'Failed to resend invitation' })
  }
}