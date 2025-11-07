import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useProjectStore } from '@/store/projectStore'
import { aria } from '@/services/ai/ariaAssistant'
import { ariaTeamManager, startARIATeamMonitoring } from '@/services/ai/ariaTeamManager'
import { ariaNotifications } from '@/services/ai/ariaNotifications'
import { ariaDailyStandup, scheduleTeamStandup } from '@/services/ai/ariaDailyStandup'
import { toast } from 'sonner'

interface ARIAContextType {
  // State
  isActive: boolean
  isVisible: boolean
  currentMode: 'floating' | 'docked' | 'fullscreen' | 'minimized'
  contextualInsights: ARIAInsight[]
  recentInteractions: ARIAInteraction[]
  userPreferences: ARIAPreferences
  
  // Actions
  toggleARIA: () => void
  setMode: (mode: ARIAContextType['currentMode']) => void
  askARIA: (question: string) => Promise<string>
  getContextualHelp: () => Promise<ARIAInsight[]>
  updatePreferences: (prefs: Partial<ARIAPreferences>) => void
  triggerProactiveHelp: (context: string) => void
}

interface ARIAInsight {
  id: string
  type: 'tip' | 'warning' | 'suggestion' | 'achievement' | 'alert'
  title: string
  message: string
  priority: 'high' | 'medium' | 'low'
  context: string
  action?: {
    label: string
    handler: () => void
  }
  timestamp: Date
}

interface ARIAInteraction {
  id: string
  query: string
  response: string
  context: string
  helpful: boolean | null
  timestamp: Date
}

interface ARIAPreferences {
  proactiveHelp: boolean
  voiceEnabled: boolean
  autoSuggest: boolean
  insightFrequency: 'always' | 'smart' | 'minimal' | 'never'
  preferredTone: 'professional' | 'friendly' | 'concise'
  keyboardShortcuts: boolean
  floatingPosition: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

const ARIAContext = createContext<ARIAContextType | undefined>(undefined)

export const useARIA = () => {
  const context = useContext(ARIAContext)
  if (!context) {
    throw new Error('useARIA must be used within ARIAProvider')
  }
  return context
}

export const ARIAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation()
  const { user } = useAuthStore()
  const { projects, tasks } = useProjectStore()
  
  const [isActive, setIsActive] = useState(true)
  const [isVisible, setIsVisible] = useState(true)
  const [currentMode, setCurrentMode] = useState<ARIAContextType['currentMode']>('floating')
  const [contextualInsights, setContextualInsights] = useState<ARIAInsight[]>([])
  const [recentInteractions, setRecentInteractions] = useState<ARIAInteraction[]>([])
  const [userPreferences, setUserPreferences] = useState<ARIAPreferences>({
    proactiveHelp: true,
    voiceEnabled: false,
    autoSuggest: true,
    insightFrequency: 'smart',
    preferredTone: 'professional',
    keyboardShortcuts: true,
    floatingPosition: 'bottom-right',
  })

  // Initialize ARIA team management
  useEffect(() => {
    if (user?.role === 'project_lead' || user?.role === 'admin') {
      // Start team monitoring for managers
      // Temporarily disabled to prevent API overload
      // startARIATeamMonitoring(30) // Check every 30 minutes
      
      // Schedule daily standup if enabled
      scheduleTeamStandup('default-team', {
        participants: ['user1', 'user2', 'user3'], // Would come from team data
        time: '09:00',
        enabled: true,
      })
    }
  }, [user])

  // Monitor user activity for proactive insights
  useEffect(() => {
    if (!userPreferences.proactiveHelp) return
    
    const analyzeUserBehavior = async () => {
      const insights: ARIAInsight[] = []
      const currentPath = location.pathname
      const currentTime = new Date()
      const hour = currentTime.getHours()
      
      // Time-based insights
      if (hour === 9 && currentPath === '/dashboard') {
        insights.push({
          id: `morning_${Date.now()}`,
          type: 'tip',
          title: 'Good morning!',
          message: 'Here are your priorities for today. Would you like me to create a focused work plan?',
          priority: 'medium',
          context: 'dashboard',
          action: {
            label: 'Create work plan',
            handler: () => handleWorkPlan(),
          },
          timestamp: currentTime,
        })
      }
      
      // Team management insights for leaders
      if ((user?.role === 'project_lead' || user?.role === 'admin') && hour === 9) {
        insights.push({
          id: `team_check_${Date.now()}`,
          type: 'suggestion',
          title: 'Team Check-in',
          message: 'Would you like me to check on overdue tasks and team performance?',
          priority: 'medium',
          context: 'team-management',
          action: {
            label: 'Check team status',
            handler: () => handleTeamCheck(),
          },
          timestamp: currentTime,
        })
      }
      
      // Project-based insights
      if (currentPath.includes('/projects')) {
        const upcomingDeadlines = (tasks || []).filter(t => {
          if (!t.dueDate) return false
          const dueDate = new Date(t.dueDate)
          const daysUntilDue = (dueDate.getTime() - currentTime.getTime()) / (1000 * 60 * 60 * 24)
          return daysUntilDue <= 3 && daysUntilDue > 0 && t.status !== 'completed'
        })
        
        if (upcomingDeadlines.length > 0) {
          insights.push({
            id: `deadline_${Date.now()}`,
            type: 'warning',
            title: 'Upcoming Deadlines',
            message: `${upcomingDeadlines.length} tasks due in the next 3 days. Shall I help prioritize?`,
            priority: 'high',
            context: 'projects',
            action: {
              label: 'Review deadlines',
              handler: () => handleDeadlineReview(upcomingDeadlines),
            },
            timestamp: currentTime,
          })
        }
      }
      
      // Performance insights
      if (tasks && tasks.length > 0) {
        const completionRate = tasks.filter(t => t.status === 'completed').length / tasks.length
        if (completionRate > 0.8) {
          insights.push({
            id: `achievement_${Date.now()}`,
            type: 'achievement',
            title: 'Great Progress!',
            message: `You've completed ${(completionRate * 100).toFixed(0)}% of your tasks. Keep up the excellent work!`,
            priority: 'low',
            context: 'performance',
            timestamp: currentTime,
          })
        }
      }
      
      // Compliance reminders
      if (currentPath.includes('/projects') && projects.length > 0) {
        const projectsNeedingCompliance = projects.filter(p => 
          p.status === 'active' && 
          !p.complianceChecked // Assuming this field exists
        )
        
        if (projectsNeedingCompliance.length > 0) {
          insights.push({
            id: `compliance_${Date.now()}`,
            type: 'alert',
            title: 'Compliance Check Required',
            message: `${projectsNeedingCompliance.length} projects need compliance verification`,
            priority: 'high',
            context: 'compliance',
            action: {
              label: 'Check compliance',
              handler: () => handleComplianceCheck(projectsNeedingCompliance[0].id),
            },
            timestamp: currentTime,
          })
        }
      }
      
      setContextualInsights(prev => [...prev, ...insights].slice(-10))
    }
    
    analyzeUserBehavior()
    
    // Re-analyze every 5 minutes
    const interval = setInterval(analyzeUserBehavior, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [location.pathname, projects, tasks, userPreferences.proactiveHelp])

  // Keyboard shortcuts
  useEffect(() => {
    if (!userPreferences.keyboardShortcuts) return
    
    const handleKeyPress = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K: Toggle ARIA
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        toggleARIA()
      }
      
      // Cmd/Ctrl + Shift + K: Fullscreen ARIA
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'K') {
        e.preventDefault()
        setMode('fullscreen')
      }
      
      // Cmd/Ctrl + /: Quick question
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        setIsVisible(true)
        setMode('floating')
        // Focus on input (handled in component)
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [userPreferences.keyboardShortcuts])

  const toggleARIA = useCallback(() => {
    setIsVisible(prev => !prev)
  }, [])

  const setMode = useCallback((mode: ARIAContextType['currentMode']) => {
    setCurrentMode(mode)
    if (mode !== 'minimized') {
      setIsVisible(true)
    }
  }, [])

  const askARIA = useCallback(async (question: string): Promise<string> => {
    try {
      const response = await aria.chat(question, {
        userId: user?.id,
        role: user?.role,
        preferences: {
          tone: userPreferences.preferredTone,
          responseLength: 'detailed',
        },
      })
      
      // Track interaction
      const interaction: ARIAInteraction = {
        id: `interaction_${Date.now()}`,
        query: question,
        response: response.message,
        context: location.pathname,
        helpful: null,
        timestamp: new Date(),
      }
      
      setRecentInteractions(prev => [...prev, interaction].slice(-20))
      
      return response.message
    } catch (error) {
      console.error('ARIA query failed:', error)
      toast.error('Failed to get response from ARIA')
      return 'I apologize, but I encountered an error. Please try again.'
    }
  }, [user, location.pathname, userPreferences.preferredTone])

  const getContextualHelp = useCallback(async (): Promise<ARIAInsight[]> => {
    const currentPath = location.pathname
    const insights: ARIAInsight[] = []
    
    try {
      // Get AI-powered contextual help
      const response = await aria.chat(
        `What are the most important things I should know about ${currentPath} page? Provide 3 actionable tips.`,
        {
          userId: user?.id,
          role: user?.role,
        }
      )
      
      // Parse response into insights
      const lines = response.message.split('\n').filter(l => l.trim())
      lines.forEach((line, idx) => {
        if (line.match(/^\d+\.|^[-•]/)) {
          insights.push({
            id: `help_${Date.now()}_${idx}`,
            type: 'tip',
            title: 'Contextual Help',
            message: line.replace(/^\d+\.|^[-•]\s*/, ''),
            priority: 'medium',
            context: currentPath,
            timestamp: new Date(),
          })
        }
      })
    } catch (error) {
      console.error('Failed to get contextual help:', error)
    }
    
    return insights
  }, [location.pathname, user])

  const updatePreferences = useCallback((prefs: Partial<ARIAPreferences>) => {
    setUserPreferences(prev => ({ ...prev, ...prefs }))
    
    // Save to localStorage
    const updated = { ...userPreferences, ...prefs }
    localStorage.setItem('aria_preferences', JSON.stringify(updated))
    
    toast.success('ARIA preferences updated')
  }, [userPreferences])

  const triggerProactiveHelp = useCallback((context: string) => {
    if (!userPreferences.proactiveHelp) return
    
    // Trigger context-specific help
    const insight: ARIAInsight = {
      id: `proactive_${Date.now()}`,
      type: 'suggestion',
      title: 'Need help?',
      message: `I noticed you're working on ${context}. I can help with that!`,
      priority: 'medium',
      context,
      action: {
        label: 'Get help',
        handler: () => {
          setIsVisible(true)
          setMode('floating')
        },
      },
      timestamp: new Date(),
    }
    
    setContextualInsights(prev => [...prev, insight].slice(-10))
  }, [userPreferences.proactiveHelp])

  // Helper handlers
  const handleWorkPlan = async () => {
    const response = await askARIA('Create a focused work plan for today based on my tasks and priorities')
    toast.success('Work plan created')
  }

  const handleTeamCheck = async () => {
    const report = await ariaTeamManager.getTeamPerformanceReport()
    const overdueCount = (tasks || []).filter(t => 
      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
    ).length
    
    toast.info(`Team Status: ${overdueCount} overdue tasks found. Performance report generated.`)
  }

  const handleDeadlineReview = async (tasks: any[]) => {
    const response = await askARIA(`Help me prioritize these ${tasks.length} tasks with upcoming deadlines`)
    toast.info('Deadline review ready')
  }

  const handleComplianceCheck = async (projectId: string) => {
    const response = await askARIA(`Check compliance status for project ${projectId}`)
    toast.info('Compliance check initiated')
  }

  // Load preferences from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('aria_preferences')
    if (stored) {
      try {
        const prefs = JSON.parse(stored)
        setUserPreferences(prefs)
      } catch (error) {
        console.error('Failed to load ARIA preferences:', error)
      }
    }
  }, [])

  const value: ARIAContextType = {
    isActive,
    isVisible,
    currentMode,
    contextualInsights,
    recentInteractions,
    userPreferences,
    toggleARIA,
    setMode,
    askARIA,
    getContextualHelp,
    updatePreferences,
    triggerProactiveHelp,
  }

  return <ARIAContext.Provider value={value}>{children}</ARIAContext.Provider>
}