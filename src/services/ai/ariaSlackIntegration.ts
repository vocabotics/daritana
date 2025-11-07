/**
 * ARIA Slack Integration
 * Comprehensive Slack workspace integration for team notifications and bot interactions
 */

import { AI_CONFIG } from './config'
import { openRouterClient } from './openRouterClient'
import { usageMonitor } from './usageMonitor'

export interface SlackMessage {
  id: string
  channel: string
  user: string
  text: string
  timestamp: string
  threadTimestamp?: string
  messageType: 'message' | 'app_mention' | 'direct_message'
  isBot: boolean
  metadata?: Record<string, any>
}

export interface SlackChannel {
  id: string
  name: string
  isPrivate: boolean
  topic?: string
  purpose?: string
  memberCount: number
  isArchived: boolean
  lastActivity?: Date
}

export interface SlackUser {
  id: string
  email?: string
  name: string
  realName?: string
  displayName?: string
  avatar?: string
  timezone?: string
  isActive: boolean
  isBot: boolean
  profile?: {
    phone?: string
    title?: string
    department?: string
  }
}

export interface SlackWorkspace {
  id: string
  name: string
  domain: string
  channels: SlackChannel[]
  users: SlackUser[]
  botUserId: string
}

export interface SlackNotificationConfig {
  channel?: string
  user?: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  format: 'simple' | 'rich' | 'interactive'
  threadReply?: boolean
  mentionUsers?: string[]
  includeActions?: boolean
}

class ARIASlackIntegration {
  private botToken: string
  private signingSecret: string
  private appToken: string
  private workspace: SlackWorkspace | null = null
  private messageQueue: Array<{
    config: SlackNotificationConfig
    message: string
    blocks?: any[]
    retryCount: number
  }> = []

  constructor() {
    this.botToken = import.meta.env.VITE_SLACK_BOT_TOKEN || ''
    this.signingSecret = import.meta.env.VITE_SLACK_SIGNING_SECRET || ''
    this.appToken = import.meta.env.VITE_SLACK_APP_TOKEN || ''
    
    // Disabled in development due to CORS - requires backend proxy
    // if (this.botToken) {
    //   this.initializeWorkspace()
    // }
  }

  /**
   * Initialize Slack workspace data
   */
  private async initializeWorkspace(): Promise<void> {
    try {
      const [authTest, channelsList, usersList] = await Promise.all([
        this.apiCall('auth.test'),
        this.apiCall('conversations.list', { types: 'public_channel,private_channel' }),
        this.apiCall('users.list'),
      ])

      this.workspace = {
        id: authTest.team_id,
        name: authTest.team,
        domain: authTest.url?.replace('https://', '').replace('.slack.com/', '') || '',
        botUserId: authTest.user_id,
        channels: channelsList.channels?.map((ch: any) => ({
          id: ch.id,
          name: ch.name,
          isPrivate: ch.is_private || false,
          topic: ch.topic?.value,
          purpose: ch.purpose?.value,
          memberCount: ch.num_members || 0,
          isArchived: ch.is_archived || false,
        })) || [],
        users: usersList.members?.map((user: any) => ({
          id: user.id,
          email: user.profile?.email,
          name: user.name,
          realName: user.real_name,
          displayName: user.profile?.display_name,
          avatar: user.profile?.image_72,
          timezone: user.tz,
          isActive: !user.deleted && user.is_active,
          isBot: user.is_bot,
          profile: {
            phone: user.profile?.phone,
            title: user.profile?.title,
            department: user.profile?.fields?.department?.value,
          },
        })) || [],
      }

      console.log(`Slack workspace initialized: ${this.workspace.name}`)
      console.log(`Channels: ${this.workspace.channels.length}, Users: ${this.workspace.users.length}`)

    } catch (error) {
      console.error('Failed to initialize Slack workspace:', error)
    }
  }

  /**
   * Send message to Slack
   */
  async sendMessage(
    config: SlackNotificationConfig,
    message: string,
    blocks?: any[]
  ): Promise<void> {
    const payload: any = {
      text: message,
      ...(config.channel && { channel: config.channel }),
      ...(config.user && { channel: `@${config.user}` }),
      ...(config.threadReply && { thread_ts: config.threadReply }),
      ...(blocks && { blocks }),
    }

    // Add mentions if specified
    if (config.mentionUsers?.length) {
      const mentions = config.mentionUsers.map(userId => `<@${userId}>`).join(' ')
      payload.text = `${mentions} ${payload.text}`
    }

    // Set message styling based on priority
    if (config.format === 'rich' || config.priority === 'urgent') {
      payload.attachments = [{
        color: this.getPriorityColor(config.priority),
        fallback: message,
        pretext: config.priority === 'urgent' ? '🚨 *URGENT*' : undefined,
        title: this.getPriorityTitle(config.priority),
        text: message,
        footer: 'ARIA Assistant',
        footer_icon: 'https://daritana.com/aria-icon.png',
        ts: Math.floor(Date.now() / 1000),
      }]
    }

    // Add interactive elements if requested
    if (config.includeActions) {
      payload.blocks = [
        ...(blocks || []),
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: 'View Details' },
              value: 'view_details',
              action_id: 'aria_view_details',
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: 'Mark Complete' },
              value: 'mark_complete',
              action_id: 'aria_mark_complete',
              style: 'primary',
            },
          ],
        },
      ]
    }

    try {
      await this.apiCall('chat.postMessage', payload)
      
      // Track usage
      await usageMonitor.recordUsage({
        service: 'slack',
        operation: 'send_message',
        model: 'slack-api',
        tokens: { input: message.length, output: 0 },
        cost: 0.001,
        latency: 1000,
        success: true,
      })

      console.log(`Slack message sent to ${config.channel || config.user}`)
    } catch (error) {
      console.error('Failed to send Slack message:', error)
      // Add to retry queue
      this.messageQueue.push({ config, message, blocks, retryCount: 0 })
      throw error
    }
  }

  /**
   * Send task reminder to Slack
   */
  async sendTaskReminder(
    config: SlackNotificationConfig,
    taskData: {
      taskName: string
      assignee: string
      dueDate: string
      priority: string
      projectName: string
      taskId: string
    }
  ): Promise<void> {
    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `⏰ *Task Reminder*\n\n*${taskData.taskName}*\nProject: ${taskData.projectName}\nAssigned to: <@${taskData.assignee}>\nDue: ${taskData.dueDate}\nPriority: ${taskData.priority}`
        },
        accessory: {
          type: 'button',
          text: { type: 'plain_text', text: 'View Task' },
          value: taskData.taskId,
          action_id: 'view_task_details',
          url: `https://daritana.com/tasks/${taskData.taskId}`,
        },
      },
    ]

    await this.sendMessage(
      { ...config, format: 'rich', mentionUsers: [taskData.assignee] },
      `Task reminder: ${taskData.taskName} is due ${taskData.dueDate}`,
      blocks
    )
  }

  /**
   * Send project update to Slack
   */
  async sendProjectUpdate(
    config: SlackNotificationConfig,
    projectData: {
      projectName: string
      status: string
      progress: number
      completedTasks: number
      totalTasks: number
      nextMilestone: string
      projectId: string
      teamMembers: string[]
    }
  ): Promise<void> {
    const progressBar = this.createProgressBar(projectData.progress)
    
    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `🏗️ *Project Update: ${projectData.projectName}*\n\n*Status:* ${projectData.status}\n*Progress:* ${progressBar} ${projectData.progress}%\n*Tasks:* ${projectData.completedTasks}/${projectData.totalTasks} completed\n*Next Milestone:* ${projectData.nextMilestone}`
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Team: ${projectData.teamMembers.map(id => `<@${id}>`).join(' ')}`
          }
        ]
      }
    ]

    await this.sendMessage(
      { ...config, format: 'rich', mentionUsers: projectData.teamMembers },
      `Project update: ${projectData.projectName} is ${projectData.progress}% complete`,
      blocks
    )
  }

  /**
   * Send compliance alert to Slack
   */
  async sendComplianceAlert(
    config: SlackNotificationConfig,
    alertData: {
      title: string
      severity: 'low' | 'medium' | 'high' | 'critical'
      description: string
      projectName: string
      requiredActions: string[]
      deadline: string
      alertId: string
      responsibleUsers: string[]
    }
  ): Promise<void> {
    const severityEmoji = {
      low: '🟡',
      medium: '🟠', 
      high: '🔴',
      critical: '🚨'
    }[alertData.severity]

    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${severityEmoji} *COMPLIANCE ALERT*\n\n*${alertData.title}*\nProject: ${alertData.projectName}\nSeverity: ${alertData.severity.toUpperCase()}\nDeadline: ${alertData.deadline}`
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Description:*\n${alertData.description}`
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Required Actions:*\n${alertData.requiredActions.map(action => `• ${action}`).join('\n')}`
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Responsible: ${alertData.responsibleUsers.map(id => `<@${id}>`).join(' ')}`
          }
        ]
      }
    ]

    await this.sendMessage(
      {
        ...config,
        priority: alertData.severity === 'critical' ? 'urgent' : 'high',
        format: 'rich',
        mentionUsers: alertData.responsibleUsers,
        includeActions: true
      },
      `Compliance alert: ${alertData.title}`,
      blocks
    )
  }

  /**
   * Process incoming Slack messages and mentions
   */
  async processIncomingMessage(messageData: any): Promise<void> {
    try {
      const { type, user, text, channel, ts } = messageData

      // Ignore bot messages and our own messages
      if (messageData.bot_id || user === this.workspace?.botUserId) {
        return
      }

      // Check if ARIA was mentioned or it's a DM
      const isDirectMessage = channel?.startsWith('D')
      const isMention = text?.includes(`<@${this.workspace?.botUserId}>`)
      
      if (!isDirectMessage && !isMention) {
        return
      }

      console.log(`Processing Slack message from user ${user}: ${text}`)

      // Process with ARIA AI
      const response = await this.processMessageWithARIA(user, text, channel)
      
      if (response) {
        await this.apiCall('chat.postMessage', {
          channel,
          text: response,
          thread_ts: ts, // Reply in thread
        })
      }

    } catch (error) {
      console.error('Error processing Slack message:', error)
    }
  }

  /**
   * Process message with ARIA AI
   */
  private async processMessageWithARIA(
    userId: string, 
    message: string, 
    channel: string
  ): Promise<string | null> {
    try {
      // Get user info
      const user = this.workspace?.users.find(u => u.id === userId)
      const userName = user?.realName || user?.name || 'there'
      
      // Get channel info
      const channelInfo = this.workspace?.channels.find(c => c.id === channel)
      const channelName = channelInfo?.name || 'direct message'

      // Clean message (remove mentions, etc.)
      const cleanMessage = message
        .replace(/<@[A-Z0-9]+>/g, '') // Remove user mentions
        .replace(/<#[A-Z0-9]+\|[^>]+>/g, '') // Remove channel mentions
        .trim()

      // Generate response using OpenRouter
      const response = await openRouterClient.chat([
        {
          role: 'system',
          content: `You are ARIA, the AI assistant for Daritana Architecture Platform. You're responding to a Slack message from ${userName} in ${channelName}. Be helpful, professional, and concise.

Available capabilities:
- Project management and status updates
- Task assignments and reminders
- Compliance checking and UBBL guidance
- Design suggestions and architectural advice
- Team coordination and meeting scheduling
- Document management and approvals

Keep responses under 2000 characters. Use Slack formatting (markdown) when appropriate. If you need to perform actions, explain what you'll do and offer to help.`
        },
        {
          role: 'user',
          content: cleanMessage
        }
      ], {
        model: AI_CONFIG.models.fast,
        temperature: 0.7,
        maxTokens: 400,
      })

      return response.choices[0]?.message?.content || null

    } catch (error) {
      console.error('Error processing message with ARIA:', error)
      return "I'm having trouble processing your request right now. Please try again later or reach out through the Daritana platform."
    }
  }

  /**
   * Handle Slack interactive components (buttons, etc.)
   */
  async handleInteractiveComponent(payload: any): Promise<void> {
    const { user, actions, response_url } = payload
    const action = actions?.[0]

    if (!action) return

    try {
      let responseText = ''

      switch (action.action_id) {
        case 'aria_view_details':
          responseText = '🔍 Opening detailed view...'
          break
        case 'aria_mark_complete':
          responseText = '✅ Marked as complete!'
          break
        case 'view_task_details':
          responseText = `📋 Opening task details for task ${action.value}...`
          break
        default:
          responseText = '👍 Action received'
      }

      // Send response back to Slack
      if (response_url) {
        await fetch(response_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: responseText,
            replace_original: false,
            response_type: 'ephemeral',
          }),
        })
      }

    } catch (error) {
      console.error('Error handling interactive component:', error)
    }
  }

  /**
   * Get workspace information
   */
  getWorkspaceInfo(): SlackWorkspace | null {
    return this.workspace
  }

  /**
   * Find user by email
   */
  findUserByEmail(email: string): SlackUser | null {
    return this.workspace?.users.find(user => user.email === email) || null
  }

  /**
   * Find channel by name
   */
  findChannelByName(name: string): SlackChannel | null {
    return this.workspace?.channels.find(channel => 
      channel.name === name || channel.name === name.replace('#', '')
    ) || null
  }

  /**
   * Send daily standup summary
   */
  async sendStandupSummary(
    channelName: string,
    standupData: {
      date: string
      participants: Array<{
        userId: string
        yesterday: string[]
        today: string[]
        blockers: string[]
      }>
      teamMetrics: {
        velocity: number
        burndownRate: number
        completionRate: number
      }
    }
  ): Promise<void> {
    const channel = this.findChannelByName(channelName)
    if (!channel) {
      throw new Error(`Channel '${channelName}' not found`)
    }

    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `📅 *Daily Standup Summary - ${standupData.date}*`
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Team Velocity:* ${standupData.teamMetrics.velocity}`
          },
          {
            type: 'mrkdwn',
            text: `*Completion Rate:* ${standupData.teamMetrics.completionRate}%`
          }
        ]
      },
      {
        type: 'divider'
      }
    ]

    // Add participant summaries
    standupData.participants.forEach(participant => {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*<@${participant.userId}>*\n✅ *Yesterday:* ${participant.yesterday.join(', ')}\n🎯 *Today:* ${participant.today.join(', ')}${participant.blockers.length ? `\n🚫 *Blockers:* ${participant.blockers.join(', ')}` : ''}`
        }
      })
    })

    await this.sendMessage(
      { channel: channel.id, format: 'rich', priority: 'normal' },
      `Daily standup summary for ${standupData.date}`,
      blocks
    )
  }

  /**
   * Private helper methods
   */
  private async apiCall(method: string, params: any = {}): Promise<any> {
    const response = await fetch(`https://slack.com/api/${method}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })

    const data = await response.json()
    
    if (!data.ok) {
      throw new Error(`Slack API error: ${data.error}`)
    }

    return data
  }

  private getPriorityColor(priority: string): string {
    const colors = {
      low: '#36a64f',      // green
      normal: '#2196F3',   // blue  
      high: '#ff9800',     // orange
      urgent: '#f44336',   // red
    }
    return colors[priority as keyof typeof colors] || colors.normal
  }

  private getPriorityTitle(priority: string): string {
    const titles = {
      low: 'Low Priority',
      normal: 'Notification',
      high: 'High Priority', 
      urgent: 'URGENT',
    }
    return titles[priority as keyof typeof titles] || titles.normal
  }

  private createProgressBar(percentage: number): string {
    const totalBars = 10
    const filledBars = Math.round((percentage / 100) * totalBars)
    const emptyBars = totalBars - filledBars
    
    return '█'.repeat(filledBars) + '░'.repeat(emptyBars)
  }

  /**
   * Process message queue for retries
   */
  private async processMessageQueue(): Promise<void> {
    if (this.messageQueue.length === 0) return

    const messagesToRetry = this.messageQueue.splice(0, 5) // Process 5 at a time

    for (const item of messagesToRetry) {
      if (item.retryCount >= 3) {
        console.error('Max retries reached for Slack message, dropping')
        continue
      }

      try {
        await this.sendMessage(item.config, item.message, item.blocks)
      } catch (error) {
        item.retryCount++
        this.messageQueue.push(item) // Re-queue for retry
      }
    }
  }

  /**
   * Start message processing
   */
  startMessageProcessor(): void {
    setInterval(() => {
      this.processMessageQueue()
    }, 30000) // Every 30 seconds
  }
}

// Export singleton instance - disabled to prevent CORS errors
// export const ariaSlack = new ARIASlackIntegration()
export const ariaSlack = null as any

// Helper functions
export async function sendSlackTaskReminder(
  channel: string,
  taskData: {
    taskName: string
    assignee: string
    dueDate: string
    priority: string
    projectName: string
    taskId: string
  }
): Promise<void> {
  return ariaSlack.sendTaskReminder(
    { channel, priority: 'high', format: 'rich' },
    taskData
  )
}

export async function sendSlackProjectUpdate(
  channel: string,
  projectData: {
    projectName: string
    status: string
    progress: number
    completedTasks: number
    totalTasks: number
    nextMilestone: string
    projectId: string
    teamMembers: string[]
  }
): Promise<void> {
  return ariaSlack.sendProjectUpdate(
    { channel, priority: 'normal', format: 'rich' },
    projectData
  )
}

export async function sendSlackComplianceAlert(
  channel: string,
  alertData: {
    title: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
    projectName: string
    requiredActions: string[]
    deadline: string
    alertId: string
    responsibleUsers: string[]
  }
): Promise<void> {
  return ariaSlack.sendComplianceAlert(
    { channel, priority: 'urgent', format: 'rich' },
    alertData
  )
}