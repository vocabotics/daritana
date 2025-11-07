/**
 * ARIA Email Integration System
 * Comprehensive email delivery and processing for notifications and communications
 */

import { AI_CONFIG } from './config'
import { openRouterClient } from './openRouterClient'
import { usageMonitor } from './usageMonitor'

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  htmlTemplate: string
  textTemplate: string
  variables: string[]
  category: 'notification' | 'reminder' | 'report' | 'marketing' | 'transactional'
}

export interface EmailMessage {
  id: string
  to: string | string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  htmlContent?: string
  textContent?: string
  templateId?: string
  templateData?: Record<string, any>
  attachments?: Array<{
    filename: string
    content: string | Buffer
    contentType: string
  }>
  priority: 'low' | 'normal' | 'high' | 'urgent'
  sendAt?: Date
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced'
  createdAt: Date
  sentAt?: Date
  deliveredAt?: Date
  openedAt?: Date
  clickedAt?: Date
  metadata?: Record<string, any>
}

export interface EmailContact {
  email: string
  firstName?: string
  lastName?: string
  company?: string
  role?: string
  preferences: {
    language: 'en' | 'ms' | 'zh'
    timezone: string
    notifications: {
      taskReminders: boolean
      projectUpdates: boolean
      complianceAlerts: boolean
      weeklyReports: boolean
      marketingEmails: boolean
    }
  }
  tags: string[]
  subscribeDate?: Date
  lastEmailSent?: Date
  emailStats: {
    sent: number
    opened: number
    clicked: number
    bounced: number
  }
}

class ARIAEmailIntegration {
  private smtpConfig = {
    host: import.meta.env.VITE_SMTP_HOST || 'smtp.gmail.com',
    port: Number(import.meta.env.VITE_SMTP_PORT) || 587,
    secure: import.meta.env.VITE_SMTP_SECURE === 'true',
    user: import.meta.env.VITE_SMTP_USER || '',
    password: import.meta.env.VITE_SMTP_PASSWORD || '',
  }

  private sendGridConfig = {
    apiKey: import.meta.env.VITE_SENDGRID_API_KEY || '',
    fromEmail: import.meta.env.VITE_FROM_EMAIL || 'noreply@daritana.com',
    fromName: import.meta.env.VITE_FROM_NAME || 'Daritana ARIA Assistant',
  }

  private emailQueue: EmailMessage[] = []
  private contacts: Map<string, EmailContact> = new Map()
  private templates: Map<string, EmailTemplate> = new Map()
  private processingInterval: NodeJS.Timer | null = null

  constructor() {
    this.initializeEmailTemplates()
    this.startEmailProcessor()
  }

  /**
   * Initialize email templates
   */
  private initializeEmailTemplates(): void {
    // Task Reminder Template
    this.templates.set('task_reminder', {
      id: 'task_reminder',
      name: 'Task Reminder',
      subject: '⏰ Task Reminder: {{taskName}}',
      htmlTemplate: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Task Reminder</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Task Reminder</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Your ARIA Assistant</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p>Hi {{firstName}},</p>
            
            <p>This is a friendly reminder about your upcoming task:</p>
            
            <div style="background: #f8f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #667eea;">{{taskName}}</h3>
              <p style="margin: 5px 0;"><strong>Due:</strong> {{dueDate}}</p>
              <p style="margin: 5px 0;"><strong>Priority:</strong> {{priority}}</p>
              <p style="margin: 5px 0;"><strong>Project:</strong> {{projectName}}</p>
            </div>
            
            {{#if description}}
            <p><strong>Description:</strong></p>
            <p>{{description}}</p>
            {{/if}}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{platformUrl}}/tasks/{{taskId}}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Task</a>
            </div>
            
            <p>Best regards,<br>Your ARIA Assistant</p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; padding: 20px; color: #666; font-size: 12px;">
            <p>Powered by <strong>Daritana Architecture Platform</strong></p>
            <p>You're receiving this because you have notifications enabled. <a href="{{unsubscribeUrl}}">Unsubscribe</a></p>
          </div>
        </body>
        </html>
      `,
      textTemplate: `Task Reminder: {{taskName}}

Hi {{firstName}},

This is a friendly reminder about your upcoming task:

Task: {{taskName}}
Due: {{dueDate}}
Priority: {{priority}}
Project: {{projectName}}

{{#if description}}Description: {{description}}{{/if}}

View task: {{platformUrl}}/tasks/{{taskId}}

Best regards,
Your ARIA Assistant

---
Powered by Daritana Architecture Platform
Unsubscribe: {{unsubscribeUrl}}`,
      variables: ['firstName', 'taskName', 'dueDate', 'priority', 'projectName', 'description', 'platformUrl', 'taskId', 'unsubscribeUrl'],
      category: 'reminder'
    })

    // Project Status Report Template
    this.templates.set('project_report', {
      id: 'project_report',
      name: 'Project Status Report',
      subject: '📊 Weekly Project Report - {{projectName}}',
      htmlTemplate: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Project Status Report</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 700px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Project Status Report</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">{{reportDate}}</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #4CAF50; margin-top: 0;">{{projectName}}</h2>
            
            <div style="display: flex; flex-wrap: wrap; gap: 20px; margin: 20px 0;">
              <div style="flex: 1; min-width: 200px; background: #f0f8f0; padding: 15px; border-radius: 8px;">
                <h4 style="margin: 0 0 10px 0; color: #4CAF50;">Overall Progress</h4>
                <div style="background: #e0e0e0; height: 10px; border-radius: 5px; overflow: hidden;">
                  <div style="background: #4CAF50; height: 100%; width: {{progressPercentage}}%;"></div>
                </div>
                <p style="margin: 5px 0 0 0; font-weight: bold;">{{progressPercentage}}% Complete</p>
              </div>
              
              <div style="flex: 1; min-width: 200px; background: #f0f8ff; padding: 15px; border-radius: 8px;">
                <h4 style="margin: 0 0 10px 0; color: #2196F3;">Tasks This Week</h4>
                <p style="margin: 0;"><span style="color: #4CAF50; font-weight: bold;">{{tasksCompleted}}</span> Completed</p>
                <p style="margin: 0;"><span style="color: #FF9800; font-weight: bold;">{{tasksInProgress}}</span> In Progress</p>
                <p style="margin: 0;"><span style="color: #f44336; font-weight: bold;">{{tasksOverdue}}</span> Overdue</p>
              </div>
            </div>
            
            <h3 style="color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">Key Achievements</h3>
            <ul style="padding-left: 20px;">
              {{#each achievements}}
              <li style="margin: 8px 0;">{{this}}</li>
              {{/each}}
            </ul>
            
            {{#if risks}}
            <h3 style="color: #f44336; border-bottom: 2px solid #f44336; padding-bottom: 10px;">Risks & Issues</h3>
            <ul style="padding-left: 20px;">
              {{#each risks}}
              <li style="margin: 8px 0; color: #f44336;">{{this}}</li>
              {{/each}}
            </ul>
            {{/if}}
            
            <h3 style="color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">Next Week's Focus</h3>
            <ul style="padding-left: 20px;">
              {{#each nextWeekFocus}}
              <li style="margin: 8px 0;">{{this}}</li>
              {{/each}}
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{platformUrl}}/projects/{{projectId}}" style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-right: 10px;">View Project</a>
              <a href="{{platformUrl}}/reports/{{reportId}}" style="background: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Full Report</a>
            </div>
            
            <p>Generated by your ARIA Assistant with ❤️</p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; padding: 20px; color: #666; font-size: 12px;">
            <p>Powered by <strong>Daritana Architecture Platform</strong></p>
          </div>
        </body>
        </html>
      `,
      textTemplate: `Project Status Report - {{projectName}}
Report Date: {{reportDate}}

OVERALL PROGRESS: {{progressPercentage}}% Complete

TASKS THIS WEEK:
- Completed: {{tasksCompleted}}
- In Progress: {{tasksInProgress}} 
- Overdue: {{tasksOverdue}}

KEY ACHIEVEMENTS:
{{#each achievements}}
- {{this}}
{{/each}}

{{#if risks}}
RISKS & ISSUES:
{{#each risks}}
- {{this}}
{{/each}}
{{/if}}

NEXT WEEK'S FOCUS:
{{#each nextWeekFocus}}
- {{this}}
{{/each}}

View Project: {{platformUrl}}/projects/{{projectId}}
Full Report: {{platformUrl}}/reports/{{reportId}}

Generated by your ARIA Assistant

---
Powered by Daritana Architecture Platform`,
      variables: ['projectName', 'reportDate', 'progressPercentage', 'tasksCompleted', 'tasksInProgress', 'tasksOverdue', 'achievements', 'risks', 'nextWeekFocus', 'platformUrl', 'projectId', 'reportId'],
      category: 'report'
    })

    // Compliance Alert Template
    this.templates.set('compliance_alert', {
      id: 'compliance_alert',
      name: 'Compliance Alert',
      subject: '🚨 URGENT: Compliance Issue - {{alertTitle}}',
      htmlTemplate: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Compliance Alert</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ COMPLIANCE ALERT</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Immediate Action Required</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <div style="background: #ffebee; padding: 20px; border-radius: 8px; border-left: 4px solid #f44336; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #f44336;">{{alertTitle}}</h3>
              <p style="margin: 5px 0;"><strong>Severity:</strong> <span style="color: #f44336;">{{severity}}</span></p>
              <p style="margin: 5px 0;"><strong>Project:</strong> {{projectName}}</p>
              <p style="margin: 5px 0;"><strong>Detected:</strong> {{detectedAt}}</p>
            </div>
            
            <h4 style="color: #f44336;">Issue Description:</h4>
            <p>{{issueDescription}}</p>
            
            <h4 style="color: #f44336;">Required Actions:</h4>
            <ul style="padding-left: 20px;">
              {{#each requiredActions}}
              <li style="margin: 8px 0;">{{this}}</li>
              {{/each}}
            </ul>
            
            <h4 style="color: #f44336;">Potential Impact:</h4>
            <p>{{potentialImpact}}</p>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h4 style="margin: 0 0 10px 0; color: #856404;">⏰ Deadline for Resolution:</h4>
              <p style="margin: 0; font-weight: bold; color: #856404;">{{resolutionDeadline}}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{platformUrl}}/compliance/alerts/{{alertId}}" style="background: #f44336; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-right: 10px;">View Alert</a>
              <a href="{{platformUrl}}/projects/{{projectId}}" style="background: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Project</a>
            </div>
            
            <p>Please address this issue immediately to avoid delays or regulatory issues.</p>
            <p>Your ARIA Assistant is monitoring this situation.</p>
          </div>
        </body>
        </html>
      `,
      textTemplate: `🚨 URGENT COMPLIANCE ALERT: {{alertTitle}}

ALERT DETAILS:
- Severity: {{severity}}
- Project: {{projectName}}
- Detected: {{detectedAt}}

ISSUE DESCRIPTION:
{{issueDescription}}

REQUIRED ACTIONS:
{{#each requiredActions}}
- {{this}}
{{/each}}

POTENTIAL IMPACT:
{{potentialImpact}}

DEADLINE FOR RESOLUTION: {{resolutionDeadline}}

View Alert: {{platformUrl}}/compliance/alerts/{{alertId}}
View Project: {{platformUrl}}/projects/{{projectId}}

Please address this issue immediately to avoid delays or regulatory issues.
Your ARIA Assistant is monitoring this situation.

---
Powered by Daritana Architecture Platform`,
      variables: ['alertTitle', 'severity', 'projectName', 'detectedAt', 'issueDescription', 'requiredActions', 'potentialImpact', 'resolutionDeadline', 'platformUrl', 'alertId', 'projectId'],
      category: 'notification'
    })

    console.log('Email templates initialized:', this.templates.size)
  }

  /**
   * Send email using template
   */
  async sendTemplateEmail(
    to: string | string[],
    templateId: string,
    data: Record<string, any>,
    options?: {
      cc?: string[]
      bcc?: string[]
      priority?: EmailMessage['priority']
      sendAt?: Date
      attachments?: EmailMessage['attachments']
    }
  ): Promise<EmailMessage> {
    const template = this.templates.get(templateId)
    if (!template) {
      throw new Error(`Email template '${templateId}' not found`)
    }

    // Process template data
    const processedSubject = this.processTemplate(template.subject, data)
    const processedHtml = this.processTemplate(template.htmlTemplate, data)
    const processedText = this.processTemplate(template.textTemplate, data)

    return this.sendEmail({
      to,
      cc: options?.cc,
      bcc: options?.bcc,
      subject: processedSubject,
      htmlContent: processedHtml,
      textContent: processedText,
      templateId,
      templateData: data,
      priority: options?.priority || 'normal',
      sendAt: options?.sendAt,
      attachments: options?.attachments,
    })
  }

  /**
   * Send plain email
   */
  async sendEmail(emailData: Omit<EmailMessage, 'id' | 'status' | 'createdAt'>): Promise<EmailMessage> {
    const email: EmailMessage = {
      ...emailData,
      id: `email_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      status: 'pending',
      createdAt: new Date(),
    }

    // Add to queue for processing
    this.emailQueue.push(email)

    // If high priority or urgent, process immediately
    if (email.priority === 'high' || email.priority === 'urgent') {
      await this.processEmail(email)
    }

    return email
  }

  /**
   * Process template with data
   */
  private processTemplate(template: string, data: Record<string, any>): string {
    let processed = template

    // Simple template processing (replace {{variable}} with data)
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      processed = processed.replace(regex, String(value || ''))
    })

    // Process arrays with {{#each array}} syntax
    const eachRegex = /{{#each (\w+)}}([\s\S]*?){{\/each}}/g
    processed = processed.replace(eachRegex, (match, arrayName, content) => {
      const array = data[arrayName]
      if (!Array.isArray(array)) return ''
      
      return array.map(item => {
        if (typeof item === 'string') {
          return content.replace(/{{this}}/g, item)
        } else if (typeof item === 'object') {
          let itemContent = content
          Object.entries(item).forEach(([itemKey, itemValue]) => {
            itemContent = itemContent.replace(new RegExp(`{{${itemKey}}}`, 'g'), String(itemValue))
          })
          return itemContent
        }
        return content
      }).join('')
    })

    // Process conditionals {{#if variable}} syntax
    const ifRegex = /{{#if (\w+)}}([\s\S]*?){{\/if}}/g
    processed = processed.replace(ifRegex, (match, varName, content) => {
      const value = data[varName]
      return (value && (Array.isArray(value) ? value.length > 0 : true)) ? content : ''
    })

    return processed
  }

  /**
   * Process email queue
   */
  private startEmailProcessor(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
    }

    // Process every 30 seconds
    this.processingInterval = setInterval(() => {
      this.processEmailQueue()
    }, 30000)

    console.log('Email processor started')
  }

  /**
   * Process pending emails in queue
   */
  private async processEmailQueue(): Promise<void> {
    const pendingEmails = this.emailQueue.filter(email => 
      email.status === 'pending' && 
      (!email.sendAt || email.sendAt <= new Date())
    )

    // Process up to 10 emails at a time
    const emailsToProcess = pendingEmails.slice(0, 10)

    for (const email of emailsToProcess) {
      await this.processEmail(email)
      // Small delay to avoid overwhelming the SMTP server
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  /**
   * Process individual email
   */
  private async processEmail(email: EmailMessage): Promise<void> {
    try {
      // Send via SendGrid API (preferred) or SMTP
      if (this.sendGridConfig.apiKey) {
        await this.sendViaSendGrid(email)
      } else {
        await this.sendViaSMTP(email)
      }

      email.status = 'sent'
      email.sentAt = new Date()

      // Track usage
      await usageMonitor.recordUsage({
        service: 'email',
        operation: 'send_email',
        model: 'email-delivery',
        tokens: { 
          input: (email.htmlContent || email.textContent || '').length, 
          output: 0 
        },
        cost: 0.001, // Approximate cost per email
        latency: 2000,
        success: true,
      })

      console.log(`Email sent successfully: ${email.id}`)

    } catch (error) {
      console.error(`Failed to send email ${email.id}:`, error)
      email.status = 'failed'
      email.metadata = { ...email.metadata, error: String(error) }
    }
  }

  /**
   * Send email via SendGrid API
   */
  private async sendViaSendGrid(email: EmailMessage): Promise<void> {
    const payload = {
      personalizations: [
        {
          to: Array.isArray(email.to) 
            ? email.to.map(addr => ({ email: addr }))
            : [{ email: email.to }],
          ...(email.cc && { cc: email.cc.map(addr => ({ email: addr })) }),
          ...(email.bcc && { bcc: email.bcc.map(addr => ({ email: addr })) }),
        }
      ],
      from: {
        email: this.sendGridConfig.fromEmail,
        name: this.sendGridConfig.fromName,
      },
      subject: email.subject,
      content: [
        ...(email.textContent ? [{ type: 'text/plain', value: email.textContent }] : []),
        ...(email.htmlContent ? [{ type: 'text/html', value: email.htmlContent }] : []),
      ],
      ...(email.attachments && {
        attachments: email.attachments.map(att => ({
          content: typeof att.content === 'string' 
            ? att.content 
            : Buffer.from(att.content).toString('base64'),
          filename: att.filename,
          type: att.contentType,
          disposition: 'attachment',
        }))
      }),
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.sendGridConfig.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`SendGrid API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`)
    }
  }

  /**
   * Send email via SMTP (fallback)
   */
  private async sendViaSMTP(email: EmailMessage): Promise<void> {
    // Note: In a real implementation, you would use a library like nodemailer
    // This is a simplified mock implementation
    console.log(`SMTP Email would be sent to: ${email.to}`)
    console.log(`Subject: ${email.subject}`)
    
    // Simulate sending
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  /**
   * Add email contact
   */
  addContact(email: string, contactData: Partial<EmailContact>): void {
    const existingContact = this.contacts.get(email) || {
      email,
      preferences: {
        language: 'en',
        timezone: 'Asia/Kuala_Lumpur',
        notifications: {
          taskReminders: true,
          projectUpdates: true,
          complianceAlerts: true,
          weeklyReports: true,
          marketingEmails: false,
        }
      },
      tags: [],
      emailStats: { sent: 0, opened: 0, clicked: 0, bounced: 0 }
    }

    this.contacts.set(email, {
      ...existingContact,
      ...contactData,
    })
  }

  /**
   * Get email statistics
   */
  getEmailStats(): {
    totalContacts: number
    emailsInQueue: number
    emailsSentToday: number
    deliveryRate: number
    openRate: number
  } {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const sentToday = this.emailQueue.filter(email => 
      email.sentAt && email.sentAt >= today
    ).length

    const totalSent = this.emailQueue.filter(email => email.status === 'sent').length
    const totalDelivered = this.emailQueue.filter(email => email.status === 'delivered').length
    const totalOpened = this.emailQueue.filter(email => email.openedAt).length

    return {
      totalContacts: this.contacts.size,
      emailsInQueue: this.emailQueue.filter(email => email.status === 'pending').length,
      emailsSentToday: sentToday,
      deliveryRate: totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0,
      openRate: totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0,
    }
  }

  /**
   * Get email template by ID
   */
  getTemplate(templateId: string): EmailTemplate | null {
    return this.templates.get(templateId) || null
  }

  /**
   * Get all templates
   */
  getAllTemplates(): EmailTemplate[] {
    return Array.from(this.templates.values())
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmails(
    contacts: string[],
    templateId: string,
    commonData: Record<string, any>,
    personalizedData?: Record<string, Record<string, any>>
  ): Promise<{
    success: number
    failed: number
    queued: number
  }> {
    const results = { success: 0, failed: 0, queued: 0 }

    for (const email of contacts) {
      try {
        const contactData = personalizedData?.[email] || {}
        const mergedData = { ...commonData, ...contactData }

        await this.sendTemplateEmail(email, templateId, mergedData, {
          priority: 'normal' // Bulk emails are normal priority
        })
        
        results.queued++
      } catch (error) {
        console.error(`Failed to queue email for ${email}:`, error)
        results.failed++
      }

      // Small delay to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    return results
  }
}

// Export singleton instance
export const ariaEmail = new ARIAEmailIntegration()

// Helper functions
export async function sendTaskReminderEmail(
  email: string,
  taskData: {
    firstName: string
    taskName: string
    dueDate: string
    priority: string
    projectName: string
    description?: string
    platformUrl: string
    taskId: string
    unsubscribeUrl: string
  }
): Promise<EmailMessage> {
  return ariaEmail.sendTemplateEmail(email, 'task_reminder', taskData, {
    priority: 'high'
  })
}

export async function sendProjectReportEmail(
  email: string,
  reportData: {
    projectName: string
    reportDate: string
    progressPercentage: number
    tasksCompleted: number
    tasksInProgress: number
    tasksOverdue: number
    achievements: string[]
    risks?: string[]
    nextWeekFocus: string[]
    platformUrl: string
    projectId: string
    reportId: string
  }
): Promise<EmailMessage> {
  return ariaEmail.sendTemplateEmail(email, 'project_report', reportData)
}

export async function sendComplianceAlertEmail(
  email: string,
  alertData: {
    alertTitle: string
    severity: string
    projectName: string
    detectedAt: string
    issueDescription: string
    requiredActions: string[]
    potentialImpact: string
    resolutionDeadline: string
    platformUrl: string
    alertId: string
    projectId: string
  }
): Promise<EmailMessage> {
  return ariaEmail.sendTemplateEmail(email, 'compliance_alert', alertData, {
    priority: 'urgent'
  })
}