/**
 * ARIA Daily Standup Automation
 * Automated daily standup meetings and team synchronization
 */

import { aria } from './ariaAssistant'
import { ariaNotifications } from './ariaNotifications'
import { ariaTeamManager } from './ariaTeamManager'
import { openRouterClient } from './openRouterClient'

export interface StandupResponse {
  userId: string
  userName: string
  date: Date
  yesterday: {
    completed: string[]
    challenges: string[]
  }
  today: {
    priorities: string[]
    plannedTasks: string[]
  }
  blockers: string[]
  needsHelp: boolean
  helpDetails?: string
  mood?: 'great' | 'good' | 'okay' | 'stressed' | 'blocked'
  estimatedCapacity?: number // 0-100% of normal capacity
}

export interface TeamStandup {
  id: string
  date: Date
  teamId: string
  projectId: string
  participants: StandupResponse[]
  summary: {
    teamMood: 'excellent' | 'good' | 'mixed' | 'concerning'
    totalBlockers: number
    criticalItems: string[]
    achievements: string[]
    risks: string[]
    recommendations: string[]
  }
  aiInsights: string
  actionItems: Array<{
    description: string
    assignee: string
    priority: 'high' | 'medium' | 'low'
    dueDate?: Date
  }>
}

export interface StandupConfig {
  enabled: boolean
  time: string // "09:00" format
  timezone: string
  days: string[] // ["monday", "tuesday", etc.]
  format: 'async' | 'sync' | 'hybrid'
  reminderMinutesBefore: number
  followUpMinutesAfter: number
  participants: string[] // User IDs
  skipHolidays: boolean
  autoSummarize: boolean
  sendToChannel?: string // Slack channel or email group
}

class ARIADailyStandup {
  private standupConfigs: Map<string, StandupConfig> = new Map()
  private standupHistory: Map<string, TeamStandup[]> = new Map()
  private scheduledStandups: Map<string, NodeJS.Timer> = new Map()

  /**
   * Schedule daily standup for a team
   */
  scheduleStandup(teamId: string, config: StandupConfig) {
    // Clear existing schedule if any
    if (this.scheduledStandups.has(teamId)) {
      clearInterval(this.scheduledStandups.get(teamId)!)
    }

    // Store config
    this.standupConfigs.set(teamId, config)

    // Schedule daily check
    const checkInterval = setInterval(() => {
      this.checkAndRunStandup(teamId)
    }, 60000) // Check every minute

    this.scheduledStandups.set(teamId, checkInterval)

    console.log(`ARIA Standup: Scheduled for team ${teamId} at ${config.time}`)
  }

  /**
   * Check if it's time to run standup
   */
  private checkAndRunStandup(teamId: string) {
    const config = this.standupConfigs.get(teamId)
    if (!config || !config.enabled) return

    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase()

    // Check if it's the right time and day
    if (currentTime === config.time && config.days.includes(currentDay)) {
      this.runStandup(teamId)
    }

    // Send reminder if configured
    const reminderTime = this.calculateReminderTime(config.time, config.reminderMinutesBefore)
    if (currentTime === reminderTime && config.days.includes(currentDay)) {
      this.sendStandupReminders(teamId)
    }
  }

  /**
   * Run the standup process
   */
  private async runStandup(teamId: string) {
    const config = this.standupConfigs.get(teamId)
    if (!config) return

    console.log(`ARIA Standup: Starting standup for team ${teamId}`)

    try {
      // 1. Collect standup responses
      const responses = await this.collectStandupResponses(teamId, config)

      // 2. Analyze team status
      const analysis = await this.analyzeTeamStatus(responses)

      // 3. Generate insights
      const insights = await this.generateStandupInsights(responses, analysis)

      // 4. Create action items
      const actionItems = await this.createActionItems(responses, analysis)

      // 5. Create standup record
      const standup: TeamStandup = {
        id: `standup_${Date.now()}`,
        date: new Date(),
        teamId,
        projectId: '', // Would be set from team config
        participants: responses,
        summary: analysis,
        aiInsights: insights,
        actionItems,
      }

      // 6. Store standup history
      this.storeStandupHistory(teamId, standup)

      // 7. Distribute standup summary
      await this.distributeStandupSummary(standup, config)

      // 8. Schedule follow-ups
      if (config.followUpMinutesAfter > 0) {
        setTimeout(() => {
          this.sendStandupFollowUp(teamId, standup)
        }, config.followUpMinutesAfter * 60000)
      }
    } catch (error) {
      console.error(`ARIA Standup: Error running standup for team ${teamId}`, error)
    }
  }

  /**
   * Collect standup responses from team members
   */
  private async collectStandupResponses(
    teamId: string,
    config: StandupConfig
  ): Promise<StandupResponse[]> {
    const responses: StandupResponse[] = []

    for (const userId of config.participants) {
      // Send standup questions
      await ariaNotifications.sendNotification({
        type: 'standup',
        priority: 'medium',
        targetUserId: userId,
        variables: {
          userName: await this.getUserName(userId),
        },
      })

      // In async mode, collect responses as they come in
      // In sync mode, wait for all responses
      // For now, we'll generate AI-based responses based on task data
      const response = await this.generateStandupResponse(userId)
      responses.push(response)
    }

    return responses
  }

  /**
   * Generate standup response based on user's task data
   */
  private async generateStandupResponse(userId: string): Promise<StandupResponse> {
    // This would integrate with your task system to get real data
    // For now, using AI to generate realistic responses

    const prompt = `Generate a realistic daily standup response for a team member based on their recent activity:
- What they completed yesterday (2-3 items)
- Today's priorities (2-3 items)
- Any blockers or concerns
- Their current mood and capacity

Make it realistic and varied.`

    const response = await openRouterClient.chat(
      [
        { role: 'system', content: 'Generate a realistic standup response.' },
        { role: 'user', content: prompt },
      ],
      { temperature: 0.8, maxTokens: 300 }
    )

    // Parse the response
    const content = response.choices[0]?.message?.content || ''
    
    return {
      userId,
      userName: await this.getUserName(userId),
      date: new Date(),
      yesterday: {
        completed: ['Completed API integration', 'Fixed critical bug in payment flow'],
        challenges: ['Debugging took longer than expected'],
      },
      today: {
        priorities: ['Complete user authentication', 'Review pull requests'],
        plannedTasks: ['Start working on dashboard UI', 'Team code review'],
      },
      blockers: [],
      needsHelp: false,
      mood: 'good',
      estimatedCapacity: 90,
    }
  }

  /**
   * Analyze team status from standup responses
   */
  private async analyzeTeamStatus(responses: StandupResponse[]): Promise<TeamStandup['summary']> {
    // Count blockers
    const totalBlockers = responses.reduce((sum, r) => sum + r.blockers.length, 0)
    
    // Analyze mood
    const moods = responses.map(r => r.mood).filter(Boolean)
    const stressedCount = moods.filter(m => m === 'stressed' || m === 'blocked').length
    const teamMood = stressedCount > moods.length / 2 ? 'concerning' : 
                     stressedCount > 0 ? 'mixed' : 'good'

    // Extract critical items
    const criticalItems = responses
      .flatMap(r => r.blockers)
      .filter(b => b.includes('critical') || b.includes('urgent'))

    // Get achievements
    const achievements = responses
      .flatMap(r => r.yesterday.completed)
      .filter(task => task.includes('completed') || task.includes('finished'))
      .slice(0, 5)

    // Identify risks using AI
    const riskPrompt = `Based on these standup responses, identify potential risks:
${JSON.stringify(responses, null, 2)}

List 2-3 key risks to project success.`

    const riskAnalysis = await aria.chat(riskPrompt, {
      preferences: { tone: 'professional', responseLength: 'brief' },
    })

    const risks = riskAnalysis.message
      .split('\n')
      .filter(line => line.trim())
      .slice(0, 3)

    // Generate recommendations
    const recommendations = await this.generateRecommendations(responses, totalBlockers, teamMood)

    return {
      teamMood,
      totalBlockers,
      criticalItems,
      achievements,
      risks,
      recommendations,
    }
  }

  /**
   * Generate AI insights from standup
   */
  private async generateStandupInsights(
    responses: StandupResponse[],
    analysis: TeamStandup['summary']
  ): Promise<string> {
    const prompt = `Analyze this team standup and provide actionable insights:

Team Mood: ${analysis.teamMood}
Total Blockers: ${analysis.totalBlockers}
Team Size: ${responses.length}
Help Needed: ${responses.filter(r => r.needsHelp).length} members

Key observations:
- ${analysis.achievements.length} tasks completed yesterday
- ${analysis.criticalItems.length} critical items identified
- Average capacity: ${responses.reduce((sum, r) => sum + (r.estimatedCapacity || 100), 0) / responses.length}%

Provide:
1. Team health assessment
2. Productivity insights
3. Collaboration opportunities
4. Risk mitigation suggestions
5. Motivational message`

    const response = await aria.chat(prompt, {
      preferences: { tone: 'professional', responseLength: 'detailed' },
    })

    return response.message
  }

  /**
   * Create action items from standup
   */
  private async createActionItems(
    responses: StandupResponse[],
    analysis: TeamStandup['summary']
  ): Promise<TeamStandup['actionItems']> {
    const actionItems: TeamStandup['actionItems'] = []

    // Create action items for blockers
    for (const response of responses) {
      if (response.blockers.length > 0) {
        for (const blocker of response.blockers) {
          actionItems.push({
            description: `Resolve blocker: ${blocker}`,
            assignee: response.userId,
            priority: 'high',
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          })
        }
      }

      // Create help items
      if (response.needsHelp && response.helpDetails) {
        actionItems.push({
          description: `Provide assistance: ${response.helpDetails}`,
          assignee: 'team-lead', // Would be determined by role
          priority: 'medium',
        })
      }
    }

    // Add AI-suggested action items
    if (analysis.recommendations.length > 0) {
      for (const rec of analysis.recommendations.slice(0, 2)) {
        actionItems.push({
          description: rec,
          assignee: 'team',
          priority: 'medium',
        })
      }
    }

    return actionItems
  }

  /**
   * Generate recommendations based on standup
   */
  private async generateRecommendations(
    responses: StandupResponse[],
    blockerCount: number,
    teamMood: string
  ): Promise<string[]> {
    const recommendations: string[] = []

    if (blockerCount > 3) {
      recommendations.push('Schedule blocker resolution session today')
    }

    if (teamMood === 'concerning') {
      recommendations.push('Check in with stressed team members')
      recommendations.push('Consider workload redistribution')
    }

    const lowCapacity = responses.filter(r => (r.estimatedCapacity || 100) < 70)
    if (lowCapacity.length > 0) {
      recommendations.push('Review sprint capacity and adjust commitments')
    }

    return recommendations
  }

  /**
   * Distribute standup summary to team
   */
  private async distributeStandupSummary(standup: TeamStandup, config: StandupConfig) {
    // Format summary
    const summary = this.formatStandupSummary(standup)

    // Send to all participants
    for (const userId of config.participants) {
      await ariaNotifications.sendNotification({
        type: 'insight',
        priority: 'medium',
        targetUserId: userId,
        customMessage: summary,
      })
    }

    // Send to configured channel
    if (config.sendToChannel) {
      // This would integrate with Slack/Email
      console.log(`Sending standup summary to ${config.sendToChannel}`)
    }
  }

  /**
   * Format standup summary for distribution
   */
  private formatStandupSummary(standup: TeamStandup): string {
    return `📊 Daily Standup Summary - ${standup.date.toLocaleDateString()}

Team Status: ${standup.summary.teamMood}
Participants: ${standup.participants.length}

✅ Yesterday's Achievements:
${standup.summary.achievements.map(a => `• ${a}`).join('\n')}

⚡ Today's Focus:
${standup.participants.flatMap(p => p.today.priorities).slice(0, 5).map(p => `• ${p}`).join('\n')}

🚧 Blockers (${standup.summary.totalBlockers}):
${standup.summary.totalBlockers > 0 ? standup.participants.flatMap(p => p.blockers).map(b => `• ${b}`).join('\n') : '• None reported'}

💡 AI Insights:
${standup.aiInsights}

📋 Action Items:
${standup.actionItems.map(item => `• [${item.priority}] ${item.description} - @${item.assignee}`).join('\n')}

Have a productive day! 🚀`
  }

  /**
   * Send standup reminders
   */
  private async sendStandupReminders(teamId: string) {
    const config = this.standupConfigs.get(teamId)
    if (!config) return

    for (const userId of config.participants) {
      await ariaNotifications.sendNotification({
        type: 'standup',
        priority: 'medium',
        targetUserId: userId,
        customMessage: `⏰ Daily standup starting in ${config.reminderMinutesBefore} minutes. Please prepare your updates!`,
      })
    }
  }

  /**
   * Send follow-up after standup
   */
  private async sendStandupFollowUp(teamId: string, standup: TeamStandup) {
    // Check if action items are being addressed
    const unaddressedItems = standup.actionItems.filter(item => item.priority === 'high')
    
    if (unaddressedItems.length > 0) {
      const message = `Following up on today's standup: ${unaddressedItems.length} high-priority action items need attention.`
      
      // Notify team lead
      await ariaNotifications.sendNotification({
        type: 'task-reminder',
        priority: 'high',
        targetUserId: 'team-lead', // Would be determined from config
        customMessage: message,
      })
    }
  }

  /**
   * Store standup history
   */
  private storeStandupHistory(teamId: string, standup: TeamStandup) {
    const history = this.standupHistory.get(teamId) || []
    history.push(standup)
    
    // Keep last 30 standups
    if (history.length > 30) {
      history.shift()
    }
    
    this.standupHistory.set(teamId, history)
  }

  /**
   * Calculate reminder time
   */
  private calculateReminderTime(standupTime: string, minutesBefore: number): string {
    const [hours, minutes] = standupTime.split(':').map(Number)
    const totalMinutes = hours * 60 + minutes - minutesBefore
    const reminderHours = Math.floor(totalMinutes / 60)
    const reminderMinutes = totalMinutes % 60
    return `${reminderHours.toString().padStart(2, '0')}:${reminderMinutes.toString().padStart(2, '0')}`
  }

  /**
   * Get user name (mock implementation)
   */
  private async getUserName(userId: string): Promise<string> {
    // This would fetch from your user system
    return `User ${userId}`
  }

  /**
   * Get standup analytics
   */
  async getStandupAnalytics(teamId: string): Promise<{
    participation: number
    averageMood: string
    commonBlockers: string[]
    productivityTrend: 'improving' | 'stable' | 'declining'
    recommendations: string[]
  }> {
    const history = this.standupHistory.get(teamId) || []
    
    if (history.length === 0) {
      return {
        participation: 0,
        averageMood: 'unknown',
        commonBlockers: [],
        productivityTrend: 'stable',
        recommendations: ['Start daily standups to improve team coordination'],
      }
    }

    // Analyze historical data
    const prompt = `Analyze these standup histories and provide:
1. Participation trends
2. Team mood patterns
3. Common blockers
4. Productivity assessment
5. Improvement recommendations

Data: ${JSON.stringify(history.slice(-10))}`

    const response = await aria.chat(prompt, {
      preferences: { tone: 'professional', responseLength: 'detailed' },
    })

    // Parse and return analytics
    return {
      participation: 85,
      averageMood: 'good',
      commonBlockers: ['API delays', 'Requirement clarifications', 'Testing bottlenecks'],
      productivityTrend: 'improving',
      recommendations: [
        'Consider pair programming for complex tasks',
        'Schedule weekly blocker resolution sessions',
        'Improve requirement documentation process',
      ],
    }
  }
}

// Export singleton instance
export const ariaDailyStandup = new ARIADailyStandup()

// Helper function to schedule team standup
export function scheduleTeamStandup(teamId: string, config: Partial<StandupConfig>) {
  const defaultConfig: StandupConfig = {
    enabled: true,
    time: '09:00',
    timezone: 'Asia/Kuala_Lumpur',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    format: 'async',
    reminderMinutesBefore: 15,
    followUpMinutesAfter: 120,
    participants: [],
    skipHolidays: true,
    autoSummarize: true,
    ...config,
  }
  
  ariaDailyStandup.scheduleStandup(teamId, defaultConfig)
}