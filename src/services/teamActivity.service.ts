import { apiClient } from './api'

export interface TeamActivity {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  action: string
  target: string
  timestamp: Date
  type: 'project' | 'task' | 'document' | 'login' | 'meeting' | 'comment'
  metadata?: any
}

export interface TeamStats {
  teamMembers: {
    total: number
    active: number
    activityRate: number
  }
  projects: {
    total: number
    active: number
    activityRate: number
  }
  tasks: {
    total: number
    completed: number
    completionRate: number
    pending: number
  }
  documents: {
    total: number
  }
  meetings: {
    total: number
    upcoming: number
  }
  overview: {
    productivityScore: number
    weeklyGrowth: number
    monthlyGrowth: number
  }
}

export interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  department?: string
  avatar?: string
  status: 'online' | 'away' | 'busy' | 'offline'
  lastSeen?: Date
  metrics: {
    tasksCompleted: number
    tasksAssigned: number
    taskCompletionRate: number
    documentsUploaded: number
    productivityScore: number
  }
}

class TeamActivityService {
  async getActivity(limit: number = 20): Promise<TeamActivity[]> {
    try {
      const response = await apiClient.get(`/api/team-activity/activity?limit=${limit}`)
      if (response.data.success) {
        return response.data.data.map((activity: any) => ({
          ...activity,
          timestamp: new Date(activity.timestamp)
        }))
      }
      return []
    } catch (error) {
      console.error('Error fetching team activity:', error)
      return []
    }
  }

  async getStats(): Promise<TeamStats | null> {
    try {
      const response = await apiClient.get('/api/team-activity/stats')
      if (response.data.success) {
        return response.data.data
      }
      return null
    } catch (error) {
      console.error('Error fetching team stats:', error)
      return null
    }
  }

  async getMembers(): Promise<TeamMember[]> {
    try {
      const response = await apiClient.get('/api/team-activity/members')
      if (response.data.success) {
        return response.data.data.map((member: any) => ({
          ...member,
          lastSeen: member.lastSeen ? new Date(member.lastSeen) : undefined
        }))
      }
      return []
    } catch (error) {
      console.error('Error fetching team members:', error)
      return []
    }
  }

  formatActivity(activity: TeamActivity): string {
    const actions: Record<string, string> = {
      'updated_project': 'updated project',
      'created_project': 'created project',
      'completed_task': 'completed task',
      'updated_task': 'updated task',
      'uploaded_document': 'uploaded',
      'logged_in': 'logged into',
      'joined_meeting': 'joined meeting',
      'left_comment': 'commented on'
    }

    const action = actions[activity.action] || activity.action
    return `${activity.userName} ${action} ${activity.target}`
  }

  getActivityIcon(type: string): string {
    const icons: Record<string, string> = {
      'project': 'Briefcase',
      'task': 'CheckSquare',
      'document': 'FileText',
      'login': 'LogIn',
      'meeting': 'Video',
      'comment': 'MessageSquare'
    }
    return icons[type] || 'Activity'
  }

  getRelativeTime(date: Date): string {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (seconds < 60) return 'just now'
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`
    
    return date.toLocaleDateString()
  }
}

export const teamActivityService = new TeamActivityService()