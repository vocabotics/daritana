/**
 * ARIA WhatsApp Business API Integration
 * Enables ARIA to send and receive messages through WhatsApp Business
 */

import { AI_CONFIG } from './config'
import { openRouterClient } from './openRouterClient'
import { usageMonitor } from './usageMonitor'

export interface WhatsAppMessage {
  id: string
  from: string
  to: string
  message: string
  timestamp: Date
  messageType: 'text' | 'image' | 'document' | 'audio' | 'template'
  status: 'sent' | 'delivered' | 'read' | 'failed'
  metadata?: {
    templateName?: string
    templateParams?: string[]
    mediaUrl?: string
    fileName?: string
  }
}

export interface WhatsAppContact {
  phoneNumber: string
  name: string
  profileName?: string
  isBusinessVerified?: boolean
  lastInteraction?: Date
  preferences: {
    language: 'en' | 'ms' | 'zh'
    notificationTypes: string[]
    timezone: string
  }
}

export interface WhatsAppBusinessTemplate {
  name: string
  category: 'marketing' | 'utility' | 'authentication'
  language: string
  components: Array<{
    type: 'header' | 'body' | 'footer' | 'button'
    text?: string
    parameters?: string[]
  }>
}

class ARIAWhatsAppIntegration {
  private businessPhoneId: string
  private accessToken: string
  private webhookVerifyToken: string
  private contacts: Map<string, WhatsAppContact> = new Map()
  private messageQueue: WhatsAppMessage[] = []
  private templates: Map<string, WhatsAppBusinessTemplate> = new Map()
  private rateLimitTracker = {
    lastMinute: new Date(),
    messagesThisMinute: 0,
    dailyLimit: 1000,
    messagesToday: 0,
  }

  constructor() {
    this.businessPhoneId = import.meta.env.VITE_WHATSAPP_BUSINESS_PHONE_ID || ''
    this.accessToken = import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN || ''
    this.webhookVerifyToken = import.meta.env.VITE_WHATSAPP_WEBHOOK_VERIFY_TOKEN || ''
    
    this.initializeTemplates()
    this.startMessageProcessor()
  }

  /**
   * Initialize WhatsApp Business message templates
   */
  private initializeTemplates() {
    // Task Reminder Template
    this.templates.set('task_reminder', {
      name: 'task_reminder',
      category: 'utility',
      language: 'en',
      components: [
        {
          type: 'header',
          text: '⏰ Task Reminder from ARIA',
        },
        {
          type: 'body',
          text: 'Hi {{1}},\n\nThis is a friendly reminder about your task: "{{2}}"\n\nDue: {{3}}\nPriority: {{4}}\n\nPlease update the status when complete.',
          parameters: ['name', 'taskName', 'dueDate', 'priority']
        },
        {
          type: 'footer',
          text: 'Powered by Daritana Architecture Platform'
        }
      ]
    })

    // Project Update Template
    this.templates.set('project_update', {
      name: 'project_update',
      category: 'utility',
      language: 'en',
      components: [
        {
          type: 'header',
          text: '🏗️ Project Update',
        },
        {
          type: 'body',
          text: 'Project: {{1}}\nStatus: {{2}}\n\n{{3}}\n\nNext Action: {{4}}',
          parameters: ['projectName', 'status', 'details', 'nextAction']
        },
      ]
    })

    // Compliance Alert Template
    this.templates.set('compliance_alert', {
      name: 'compliance_alert',
      category: 'utility',
      language: 'en',
      components: [
        {
          type: 'header',
          text: '🚨 Compliance Alert',
        },
        {
          type: 'body',
          text: 'URGENT: {{1}}\n\nIssue: {{2}}\nSeverity: {{3}}\n\nImmediate action required. Please review and respond.',
          parameters: ['alertTitle', 'issue', 'severity']
        },
      ]
    })

    // Meeting Reminder Template  
    this.templates.set('meeting_reminder', {
      name: 'meeting_reminder',
      category: 'utility',
      language: 'en',
      components: [
        {
          type: 'header',
          text: '📅 Meeting Reminder',
        },
        {
          type: 'body',
          text: 'Meeting: {{1}}\nTime: {{2}}\nLocation: {{3}}\n\nAgenda: {{4}}\n\nSee you there!',
          parameters: ['meetingTitle', 'time', 'location', 'agenda']
        },
      ]
    })

    console.log('WhatsApp Business templates initialized')
  }

  /**
   * Send WhatsApp message
   */
  async sendMessage(
    to: string,
    message: string,
    type: 'text' | 'template' = 'text',
    templateOptions?: {
      templateName: string
      parameters: string[]
    }
  ): Promise<WhatsAppMessage> {
    // Check rate limits
    if (!this.checkRateLimit()) {
      throw new Error('WhatsApp rate limit exceeded')
    }

    const whatsAppMessage: WhatsAppMessage = {
      id: `wa_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      from: this.businessPhoneId,
      to: to.replace(/\D/g, ''), // Clean phone number
      message,
      timestamp: new Date(),
      messageType: type,
      status: 'sent',
      metadata: templateOptions ? {
        templateName: templateOptions.templateName,
        templateParams: templateOptions.parameters,
      } : undefined,
    }

    try {
      let payload: any

      if (type === 'text') {
        payload = {
          messaging_product: 'whatsapp',
          to: whatsAppMessage.to,
          type: 'text',
          text: {
            body: message
          }
        }
      } else if (type === 'template' && templateOptions) {
        const template = this.templates.get(templateOptions.templateName)
        if (!template) {
          throw new Error(`Template ${templateOptions.templateName} not found`)
        }

        payload = {
          messaging_product: 'whatsapp',
          to: whatsAppMessage.to,
          type: 'template',
          template: {
            name: templateOptions.templateName,
            language: {
              code: template.language
            },
            components: [
              {
                type: 'body',
                parameters: templateOptions.parameters.map(param => ({
                  type: 'text',
                  text: param
                }))
              }
            ]
          }
        }
      }

      // Send to WhatsApp Business API
      const response = await this.sendToWhatsAppAPI(payload)
      
      if (response.messages?.[0]?.id) {
        whatsAppMessage.id = response.messages[0].id
        whatsAppMessage.status = 'delivered'
      }

      // Track usage
      await usageMonitor.recordUsage({
        service: 'whatsapp',
        operation: 'send_message',
        model: 'whatsapp-business-api',
        tokens: { input: message.length, output: 0 },
        cost: 0.005, // Approximate cost per message
        latency: 1000,
        success: true,
      })

      console.log(`WhatsApp message sent to ${to}:`, whatsAppMessage.id)
      return whatsAppMessage

    } catch (error) {
      console.error('Failed to send WhatsApp message:', error)
      whatsAppMessage.status = 'failed'
      throw error
    }
  }

  /**
   * Send task reminder via WhatsApp
   */
  async sendTaskReminder(
    phoneNumber: string,
    taskData: {
      userFirstName: string
      taskName: string
      dueDate: string
      priority: string
    }
  ): Promise<void> {
    await this.sendMessage(
      phoneNumber,
      '', // Template message doesn't need body text
      'template',
      {
        templateName: 'task_reminder',
        parameters: [
          taskData.userFirstName,
          taskData.taskName,
          taskData.dueDate,
          taskData.priority
        ]
      }
    )
  }

  /**
   * Send project update via WhatsApp
   */
  async sendProjectUpdate(
    phoneNumber: string,
    projectData: {
      projectName: string
      status: string
      details: string
      nextAction: string
    }
  ): Promise<void> {
    await this.sendMessage(
      phoneNumber,
      '',
      'template',
      {
        templateName: 'project_update',
        parameters: [
          projectData.projectName,
          projectData.status,
          projectData.details,
          projectData.nextAction
        ]
      }
    )
  }

  /**
   * Send compliance alert via WhatsApp
   */
  async sendComplianceAlert(
    phoneNumber: string,
    alertData: {
      alertTitle: string
      issue: string
      severity: string
    }
  ): Promise<void> {
    await this.sendMessage(
      phoneNumber,
      '',
      'template',
      {
        templateName: 'compliance_alert',
        parameters: [
          alertData.alertTitle,
          alertData.issue,
          alertData.severity
        ]
      }
    )
  }

  /**
   * Process incoming WhatsApp messages
   */
  async processIncomingMessage(messageData: any): Promise<void> {
    try {
      if (!messageData.entry?.[0]?.changes?.[0]?.value?.messages) {
        return
      }

      const messages = messageData.entry[0].changes[0].value.messages
      
      for (const msg of messages) {
        const phoneNumber = msg.from
        const messageText = msg.text?.body || ''
        const messageId = msg.id

        console.log(`Received WhatsApp message from ${phoneNumber}: ${messageText}`)

        // Process message with ARIA
        const ariaResponse = await this.processMessageWithARIA(phoneNumber, messageText)
        
        if (ariaResponse) {
          await this.sendMessage(phoneNumber, ariaResponse)
        }

        // Mark message as read
        await this.markMessageAsRead(messageId)
      }
    } catch (error) {
      console.error('Error processing incoming WhatsApp message:', error)
    }
  }

  /**
   * Process message with ARIA AI
   */
  private async processMessageWithARIA(phoneNumber: string, message: string): Promise<string | null> {
    try {
      // Get contact information
      const contact = this.contacts.get(phoneNumber)
      const userName = contact?.name || 'there'

      // Create context for ARIA
      const context = `WhatsApp conversation with ${userName} (${phoneNumber})`

      // Generate response using OpenRouter
      const response = await openRouterClient.chat([
        {
          role: 'system',
          content: `You are ARIA, the AI assistant for Daritana Architecture Platform. You're responding to a WhatsApp message from a user. Be helpful, concise, and professional. Keep responses under 1600 characters (WhatsApp limit). 

Current context: ${context}

Available actions:
- Answer questions about projects, tasks, and architecture
- Provide compliance guidance
- Schedule meetings or reminders
- Check project status
- Provide design suggestions

If the user needs complex assistance, suggest they use the full platform or schedule a call.`
        },
        {
          role: 'user',
          content: message
        }
      ], {
        model: AI_CONFIG.models.fast, // Use fast model for quick responses
        temperature: 0.7,
        maxTokens: 300,
      })

      return response.choices[0]?.message?.content || null

    } catch (error) {
      console.error('Error processing message with ARIA:', error)
      return "I'm having trouble processing your message right now. Please try again later or use the Daritana platform directly."
    }
  }

  /**
   * Verify webhook from WhatsApp
   */
  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe' && token === this.webhookVerifyToken) {
      console.log('WhatsApp webhook verified successfully')
      return challenge
    }
    console.log('WhatsApp webhook verification failed')
    return null
  }

  /**
   * Add or update contact
   */
  addContact(phoneNumber: string, contactData: Partial<WhatsAppContact>): void {
    const existingContact = this.contacts.get(phoneNumber) || {
      phoneNumber,
      name: '',
      preferences: {
        language: 'en',
        notificationTypes: ['task-reminder', 'project-update'],
        timezone: 'Asia/Kuala_Lumpur'
      }
    }

    this.contacts.set(phoneNumber, {
      ...existingContact,
      ...contactData,
      lastInteraction: new Date()
    })
  }

  /**
   * Get contact by phone number
   */
  getContact(phoneNumber: string): WhatsAppContact | null {
    return this.contacts.get(phoneNumber) || null
  }

  /**
   * Send to WhatsApp Business API
   */
  private async sendToWhatsAppAPI(payload: any): Promise<any> {
    const response = await fetch(`https://graph.facebook.com/v18.0/${this.businessPhoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`WhatsApp API error: ${errorData.error?.message || 'Unknown error'}`)
    }

    return response.json()
  }

  /**
   * Mark message as read
   */
  private async markMessageAsRead(messageId: string): Promise<void> {
    try {
      await fetch(`https://graph.facebook.com/v18.0/${this.businessPhoneId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId,
        }),
      })
    } catch (error) {
      console.error('Failed to mark message as read:', error)
    }
  }

  /**
   * Check rate limits
   */
  private checkRateLimit(): boolean {
    const now = new Date()
    const oneMinuteAgo = new Date(now.getTime() - 60000)
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Reset minute counter if needed
    if (this.rateLimitTracker.lastMinute < oneMinuteAgo) {
      this.rateLimitTracker.messagesThisMinute = 0
      this.rateLimitTracker.lastMinute = now
    }

    // Reset daily counter if needed
    if (this.rateLimitTracker.messagesToday === 0) {
      // Assume reset at start of each day
      this.rateLimitTracker.messagesToday = 0
    }

    // Check limits
    if (this.rateLimitTracker.messagesThisMinute >= 80) { // WhatsApp limit: 80 msgs/min
      return false
    }

    if (this.rateLimitTracker.messagesToday >= this.rateLimitTracker.dailyLimit) {
      return false
    }

    // Increment counters
    this.rateLimitTracker.messagesThisMinute++
    this.rateLimitTracker.messagesToday++

    return true
  }

  /**
   * Start message processor (for queued messages)
   */
  private startMessageProcessor(): void {
    setInterval(() => {
      this.processMessageQueue()
    }, 5000) // Process every 5 seconds
  }

  /**
   * Process message queue
   */
  private async processMessageQueue(): Promise<void> {
    if (this.messageQueue.length === 0) return

    const messagesToProcess = this.messageQueue.splice(0, 5) // Process 5 at a time

    for (const message of messagesToProcess) {
      try {
        if (message.status === 'sent') {
          // Message already processed
          continue
        }

        await this.sendMessage(
          message.to,
          message.message,
          message.messageType,
          message.metadata ? {
            templateName: message.metadata.templateName!,
            parameters: message.metadata.templateParams!,
          } : undefined
        )

      } catch (error) {
        console.error('Failed to process queued message:', error)
        // Put message back in queue for retry
        message.status = 'failed'
        this.messageQueue.push(message)
      }
    }
  }

  /**
   * Queue message for later sending
   */
  queueMessage(message: WhatsAppMessage): void {
    this.messageQueue.push(message)
  }

  /**
   * Get messaging statistics
   */
  getMessagingStats(): {
    messagesSentToday: number
    messagesThisMinute: number
    queueLength: number
    activeContacts: number
  } {
    return {
      messagesSentToday: this.rateLimitTracker.messagesToday,
      messagesThisMinute: this.rateLimitTracker.messagesThisMinute,
      queueLength: this.messageQueue.length,
      activeContacts: this.contacts.size,
    }
  }

  /**
   * Bulk send messages to multiple contacts
   */
  async bulkSendMessage(
    contacts: string[],
    message: string,
    templateName?: string,
    templateParams?: string[]
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = { success: 0, failed: 0, errors: [] as string[] }

    for (const phoneNumber of contacts) {
      try {
        if (templateName && templateParams) {
          await this.sendMessage(phoneNumber, '', 'template', {
            templateName,
            parameters: templateParams
          })
        } else {
          await this.sendMessage(phoneNumber, message)
        }
        results.success++
      } catch (error) {
        results.failed++
        results.errors.push(`${phoneNumber}: ${error}`)
      }

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    return results
  }
}

// Export singleton instance
export const ariaWhatsApp = new ARIAWhatsAppIntegration()

// Helper function to send quick WhatsApp message
export async function sendWhatsAppMessage(
  phoneNumber: string, 
  message: string
): Promise<WhatsAppMessage> {
  return ariaWhatsApp.sendMessage(phoneNumber, message)
}

// Helper function to send WhatsApp template
export async function sendWhatsAppTemplate(
  phoneNumber: string,
  templateName: string,
  parameters: string[]
): Promise<WhatsAppMessage> {
  return ariaWhatsApp.sendMessage(phoneNumber, '', 'template', {
    templateName,
    parameters
  })
}