/**
 * ARIA Team Manager
 * Proactive task monitoring and team management system
 */

import { aria } from './ariaAssistant'
import { openRouterClient } from './openRouterClient'
import { promptTemplates } from './promptTemplates'
import { ragService } from './ragService'

export interface TaskStatus {
  id: string
  title: string
  assignee: {
    id: string
    name: string
    email: string
    role: string
  }
  dueDate: Date
  status: 'todo' | 'in_progress' | 'review' | 'completed' | 'blocked'
  priority: 'critical' | 'high' | 'medium' | 'low'
  projectId: string
  projectName: string
  daysOverdue: number
  lastFollowUp?: Date
  followUpCount: number
  escalationLevel: 0 | 1 | 2 | 3 // 0=none, 1=reminder, 2=manager, 3=executive
  blockers?: string[]
  dependencies?: string[]
}

export interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  currentWorkload: number
  tasksCompleted: number
  tasksOverdue: number
  averageCompletionTime: number // in days
  performanceScore: number // 0-100
  lastActive: Date
  timezone: string
  preferredContactMethod: 'email' | 'slack' | 'whatsapp' | 'in-app'
}

export interface FollowUpAction {
  type: 'reminder' | 'check-in' | 'escalation' | 'reassignment' | 'deadline-extension'
  taskId: string
  targetUserId: string
  message: string
  priority: 'urgent' | 'high' | 'normal'
  scheduledTime: Date
  channel: 'email' | 'slack' | 'whatsapp' | 'in-app'
  metadata?: Record<string, any>
}

export interface TeamInsight {
  type: 'performance' | 'risk' | 'opportunity' | 'bottleneck' | 'achievement'
  title: string
  description: string
  severity: 'info' | 'warning' | 'critical'
  affectedMembers: string[]
  recommendedActions: string[]
  metrics?: Record<string, number>
}

class ARIATeamManager {
  private monitoringInterval: NodeJS.Timer | null = null
  private followUpQueue: FollowUpAction[] = []
  private teamMetrics: Map<string, TeamMember> = new Map()
  private taskHistory: Map<string, TaskStatus[]> = new Map()

  /**
   * Start proactive team monitoring
   */
  startMonitoring(intervalMinutes: number = 30) {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
    }

    // Initial check
    this.performTeamCheck()

    // Set up recurring checks
    this.monitoringInterval = setInterval(
      () => this.performTeamCheck(),
      intervalMinutes * 60 * 1000
    )

    console.log(`ARIA Team Manager: Started monitoring every ${intervalMinutes} minutes`)
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
  }

  /**
   * Perform comprehensive team check
   */
  private async performTeamCheck() {
    try {
      // 1. Check for overdue tasks
      const overdueTasks = await this.checkOverdueTasks()
      
      // 2. Analyze team performance
      const teamInsights = await this.analyzeTeamPerformance()
      
      // 3. Identify bottlenecks
      const bottlenecks = await this.identifyBottlenecks()
      
      // 4. Generate follow-up actions
      const followUps = await this.generateFollowUps(overdueTasks, teamInsights)
      
      // 5. Process follow-up queue
      await this.processFollowUpQueue(followUps)
      
      // 6. Update team metrics
      await this.updateTeamMetrics()
      
      // 7. Generate daily summary if needed
      if (this.shouldGenerateDailySummary()) {
        await this.generateDailySummary()
      }
    } catch (error) {
      console.error('ARIA Team Manager: Error during team check', error)
    }
  }

  /**
   * Check for overdue tasks
   */
  private async checkOverdueTasks(): Promise<TaskStatus[]> {
    // This would integrate with your task management system
    // For now, returning mock data structure
    const tasks: TaskStatus[] = []
    const now = new Date()
    
    // Example: Check tasks from project store
    // const projectTasks = await getProjectTasks()
    
    // Filter and map overdue tasks
    // ...
    
    return tasks
  }

  /**
   * Analyze team performance
   */
  private async analyzeTeamPerformance(): Promise<TeamInsight[]> {
    const insights: TeamInsight[] = []
    
    // Use AI to analyze team patterns
    const analysisPrompt = `Analyze team performance based on:
- Task completion rates
- Overdue task patterns
- Workload distribution
- Collaboration effectiveness

Identify potential issues and opportunities for improvement.`

    const response = await aria.chat(analysisPrompt, {
      role: 'project_manager',
      preferences: { tone: 'professional', responseLength: 'detailed' },
    })

    // Parse AI response for insights
    // ...

    return insights
  }

  /**
   * Identify bottlenecks in workflow
   */
  private async identifyBottlenecks(): Promise<TeamInsight[]> {
    const bottlenecks: TeamInsight[] = []
    
    // Analyze task dependencies and blockers
    const prompt = `Identify workflow bottlenecks based on:
- Tasks blocked for more than 3 days
- Dependencies causing delays
- Resource constraints
- Approval delays

Suggest solutions for each bottleneck.`

    const response = await aria.chat(prompt, {
      role: 'project_manager',
    })

    // Process response
    // ...

    return bottlenecks
  }

  /**
   * Generate follow-up actions based on analysis
   */
  private async generateFollowUps(
    overdueTasks: TaskStatus[],
    insights: TeamInsight[]
  ): Promise<FollowUpAction[]> {
    const followUps: FollowUpAction[] = []
    
    for (const task of overdueTasks) {
      const followUp = await this.createFollowUpForTask(task)
      if (followUp) {
        followUps.push(followUp)
      }
    }
    
    return followUps
  }

  /**
   * Create appropriate follow-up for a task
   */
  private async createFollowUpForTask(task: TaskStatus): Promise<FollowUpAction | null> {
    // Determine follow-up strategy based on task status
    const strategy = this.determineFollowUpStrategy(task)
    
    // Generate personalized message using AI
    const messagePrompt = `Create a ${strategy.tone} follow-up message for an overdue task:
Task: ${task.title}
Assignee: ${task.assignee.name}
Days Overdue: ${task.daysOverdue}
Priority: ${task.priority}
Previous Follow-ups: ${task.followUpCount}

The message should be:
- ${strategy.tone} in tone
- Action-oriented
- Offer support if needed
- Include deadline reminder
- Be encouraging, not punitive`

    const response = await openRouterClient.chat(
      [
        { role: 'system', content: 'You are ARIA, a helpful project management assistant.' },
        { role: 'user', content: messagePrompt },
      ],
      { temperature: 0.7, maxTokens: 200 }
    )
    
    const message = response.choices[0]?.message?.content || ''
    
    return {
      type: strategy.type,
      taskId: task.id,
      targetUserId: strategy.targetUserId,
      message,
      priority: strategy.priority,
      scheduledTime: strategy.scheduledTime,
      channel: task.assignee.preferredContactMethod || 'in-app',
      metadata: {
        taskTitle: task.title,
        daysOverdue: task.daysOverdue,
        escalationLevel: task.escalationLevel,
      },
    }
  }

  /**
   * Determine follow-up strategy based on task history
   */
  private determineFollowUpStrategy(task: TaskStatus): {
    type: FollowUpAction['type']
    targetUserId: string
    tone: 'friendly' | 'professional' | 'urgent'
    priority: FollowUpAction['priority']
    scheduledTime: Date
  } {
    const now = new Date()
    let type: FollowUpAction['type'] = 'reminder'
    let targetUserId = task.assignee.id
    let tone: 'friendly' | 'professional' | 'urgent' = 'friendly'
    let priority: FollowUpAction['priority'] = 'normal'
    let scheduledTime = new Date(now.getTime() + 5 * 60 * 1000) // 5 minutes from now
    
    // Escalation logic
    if (task.daysOverdue <= 1 && task.followUpCount === 0) {
      // First reminder - friendly
      type = 'reminder'
      tone = 'friendly'
      priority = 'normal'
    } else if (task.daysOverdue <= 3 && task.followUpCount <= 2) {
      // Check-in - professional
      type = 'check-in'
      tone = 'professional'
      priority = 'high'
    } else if (task.daysOverdue > 3 || task.followUpCount > 2) {
      // Escalation - urgent
      type = 'escalation'
      tone = 'urgent'
      priority = 'urgent'
      
      // May need to notify manager
      if (task.escalationLevel >= 2) {
        // Get manager ID (would come from org structure)
        // targetUserId = getManagerId(task.assignee.id)
      }
    }
    
    // Critical tasks get immediate attention
    if (task.priority === 'critical') {
      priority = 'urgent'
      scheduledTime = now // Immediate
    }
    
    return { type, targetUserId, tone, priority, scheduledTime }
  }

  /**
   * Process follow-up queue
   */
  private async processFollowUpQueue(followUps: FollowUpAction[]) {
    for (const followUp of followUps) {
      await this.sendFollowUp(followUp)
    }
  }

  /**
   * Send a follow-up message
   */
  private async sendFollowUp(followUp: FollowUpAction) {
    // This would integrate with your notification system
    console.log(`ARIA Team Manager: Sending ${followUp.type} to user ${followUp.targetUserId}`)
    
    // Track follow-up
    this.trackFollowUp(followUp)
    
    // In production, this would:
    // 1. Send via appropriate channel (email, Slack, etc.)
    // 2. Create in-app notification
    // 3. Log the action
    // 4. Update task follow-up count
  }

  /**
   * Track follow-up actions for analytics
   */
  private trackFollowUp(followUp: FollowUpAction) {
    // Store follow-up history for learning
    const taskHistory = this.taskHistory.get(followUp.taskId) || []
    // Add to history...
    this.taskHistory.set(followUp.taskId, taskHistory)
  }

  /**
   * Update team metrics
   */
  private async updateTeamMetrics() {
    // Calculate performance metrics for each team member
    // This would integrate with your user and task systems
  }

  /**
   * Check if daily summary should be generated
   */
  private shouldGenerateDailySummary(): boolean {
    const now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes()
    
    // Generate at 9 AM and 5 PM
    return (hours === 9 || hours === 17) && minutes < 30
  }

  /**
   * Generate daily team summary
   */
  private async generateDailySummary() {
    const prompt = `Generate a daily team summary including:
1. Tasks completed today
2. Tasks still overdue
3. Upcoming deadlines (next 3 days)
4. Team members who may need support
5. Key achievements
6. Recommended focus areas for tomorrow

Make it motivating and action-oriented.`

    const response = await aria.chat(prompt, {
      role: 'project_manager',
      preferences: { tone: 'professional', responseLength: 'detailed' },
    })
    
    // Send summary to team leads
    await this.distributeDailySummary(response.message)
  }

  /**
   * Distribute daily summary to relevant stakeholders
   */
  private async distributeDailySummary(summary: string) {
    console.log('ARIA Team Manager: Daily Summary Generated', summary)
    // In production, this would send to team leads and project managers
  }

  /**
   * Get team performance report
   */
  async getTeamPerformanceReport(): Promise<{
    overview: {
      totalTasks: number
      completedOnTime: number
      overdue: number
      averageDelay: number
    }
    teamMembers: TeamMember[]
    insights: TeamInsight[]
    recommendations: string[]
  }> {
    // Analyze team performance and generate report
    const prompt = `Analyze team performance and provide:
1. Key metrics and trends
2. Individual performance highlights
3. Areas of concern
4. Specific recommendations for improvement
5. Team morale indicators`

    const response = await aria.chat(prompt, {
      role: 'project_manager',
    })
    
    // Return structured report
    return {
      overview: {
        totalTasks: 0,
        completedOnTime: 0,
        overdue: 0,
        averageDelay: 0,
      },
      teamMembers: Array.from(this.teamMetrics.values()),
      insights: [],
      recommendations: [],
    }
  }

  /**
   * Suggest task reassignment for better workload balance
   */
  async suggestTaskReassignment(taskId: string): Promise<{
    currentAssignee: string
    suggestedAssignee: string
    reason: string
    expectedImprovement: string
  } | null> {
    // Analyze workload and suggest optimal reassignment
    const prompt = `Analyze task assignment and suggest if reassignment would help:
- Consider team member workload
- Skills matching
- Availability
- Past performance on similar tasks`

    const response = await aria.chat(prompt, {
      role: 'project_manager',
    })
    
    // Parse and return suggestion
    return null
  }

  /**
   * Predict task completion likelihood
   */
  async predictTaskCompletion(taskId: string): Promise<{
    likelihood: number // 0-100
    estimatedCompletionDate: Date
    risks: string[]
    recommendations: string[]
  }> {
    // Use historical data and AI to predict completion
    const prompt = `Based on historical patterns and current status, predict:
1. Likelihood of on-time completion (percentage)
2. Most probable completion date
3. Key risks to completion
4. Actions to improve likelihood`

    const response = await aria.chat(prompt, {
      role: 'project_manager',
    })
    
    return {
      likelihood: 75,
      estimatedCompletionDate: new Date(),
      risks: [],
      recommendations: [],
    }
  }
}

// Export singleton instance
export const ariaTeamManager = new ARIATeamManager()

// Helper function to start team monitoring
export function startARIATeamMonitoring(intervalMinutes = 30) {
  ariaTeamManager.startMonitoring(intervalMinutes)
}

// Helper function to get team insights
export async function getTeamInsights(): Promise<TeamInsight[]> {
  const report = await ariaTeamManager.getTeamPerformanceReport()
  return report.insights
}