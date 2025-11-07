import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import { 
  MessageCircle, 
  Minimize2, 
  Maximize2, 
  X, 
  Sparkles,
  Mic,
  MicOff,
  Send,
  Command,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  Brain,
  Zap,
  Volume2,
  VolumeX,
  MoreVertical,
  BookOpen,
  Target,
  TrendingUp,
  Shield,
  HelpCircle
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAuthStore } from '@/store/authStore'
import { useProjectStore } from '@/store/projectStore'
import { aria, ARIAResponse } from '@/services/ai/ariaAssistant'
import { usageMonitor } from '@/services/ai/usageMonitor'
import { toast } from 'sonner'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  suggestions?: string[]
  actions?: Array<{ type: string; data: any }>
  confidence?: number
}

interface ARIAState {
  mode: 'floating' | 'docked' | 'fullscreen' | 'minimized'
  position: { x: number; y: number }
  size: { width: number; height: number }
  isListening: boolean
  isSpeaking: boolean
  isThinking: boolean
  currentContext: string
  suggestions: string[]
  insights: Array<{
    type: 'info' | 'warning' | 'success' | 'tip'
    message: string
    action?: () => void
  }>
}

export const ARIAFloatingAssistant: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { projects, tasks } = useProjectStore()
  
  const [isVisible, setIsVisible] = useState(false) // Start hidden - only show when escaped from sidebar
  const [state, setState] = useState<ARIAState>({
    mode: 'floating',
    position: { x: window.innerWidth - 380, y: window.innerHeight - 600 },
    size: { width: 350, height: 500 },
    isListening: false,
    isSpeaking: false,
    isThinking: false,
    currentContext: '',
    suggestions: [],
    insights: [],
  })

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I'm ARIA, your AI project assistant. I'm here to help you with:
• Project planning and timelines
• Design suggestions
• Compliance checking
• Task management
• And much more!

How can I assist you today?`,
      timestamp: new Date(),
      suggestions: [
        'Show me today\'s priorities',
        'Check project compliance',
        'Suggest design improvements',
        'Analyze project risks',
      ],
    },
  ])

  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragRef = useRef<HTMLDivElement>(null)
  const controls = useAnimation()

  // Proactive context awareness
  useEffect(() => {
    analyzeCurrentContext()
  }, [location.pathname, projects, tasks])

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Listen for escape from sidebar event
  useEffect(() => {
    const handleEscapeToFloat = () => {
      setIsVisible(true)
      setState(prev => ({ ...prev, mode: 'floating' }))
      toast.success('ARIA is now floating around to help you!')
    }

    const handleOpenChat = () => {
      setIsVisible(true)
      setState(prev => ({ ...prev, mode: 'docked' }))
    }

    window.addEventListener('aria-escape-to-float', handleEscapeToFloat)
    window.addEventListener('aria-open-chat', handleOpenChat)
    
    return () => {
      window.removeEventListener('aria-escape-to-float', handleEscapeToFloat)
      window.removeEventListener('aria-open-chat', handleOpenChat)
    }
  }, [])

  // Analyze current context and provide proactive insights
  const analyzeCurrentContext = useCallback(async () => {
    const path = location.pathname
    const insights: typeof state.insights = []
    const suggestions: string[] = []

    // Page-specific insights
    if (path.includes('/projects')) {
      const activeProjects = (projects || []).filter(p => p.status === 'active')
      if (activeProjects.length > 0) {
        insights.push({
          type: 'info',
          message: `You have ${activeProjects.length} active projects. Would you like a status summary?`,
          action: () => handleSuggestion('Summarize active projects'),
        })
      }

      // Check for overdue tasks
      const overdueTasks = (tasks || []).filter(t => 
        t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
      )
      if (overdueTasks.length > 0) {
        insights.push({
          type: 'warning',
          message: `${overdueTasks.length} tasks are overdue`,
          action: () => handleSuggestion('Show overdue tasks'),
        })
      }

      suggestions.push(
        'Create project timeline',
        'Check compliance status',
        'Analyze resource allocation',
      )
    } else if (path.includes('/design-brief')) {
      suggestions.push(
        'Generate design concepts',
        'Suggest color palettes',
        'Recommend materials',
        'Create mood board',
      )
      
      insights.push({
        type: 'tip',
        message: 'I can help you create culturally-appropriate design concepts',
      })
    } else if (path.includes('/kanban')) {
      const todoTasks = tasks.filter(t => t.status === 'todo')
      if (todoTasks.length > 10) {
        insights.push({
          type: 'warning',
          message: 'High number of pending tasks. Shall I help prioritize?',
          action: () => handleSuggestion('Help me prioritize tasks'),
        })
      }

      suggestions.push(
        'Suggest task priorities',
        'Identify bottlenecks',
        'Balance workload',
      )
    } else if (path.includes('/dashboard')) {
      // Dashboard insights
      const budgetStatus = usageMonitor.getBudgetStatus()
      if (budgetStatus.percentage > 80) {
        insights.push({
          type: 'warning',
          message: `AI usage at ${budgetStatus.percentage.toFixed(0)}% of monthly budget`,
        })
      }

      suggestions.push(
        'Show today\'s priorities',
        'Generate weekly report',
        'Analyze team performance',
      )
    }

    setState(prev => ({
      ...prev,
      currentContext: path,
      suggestions,
      insights,
    }))
  }, [location.pathname, projects, tasks])

  // Handle user input
  const handleSend = async () => {
    if (!input.trim() || isTyping) return

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)
    setState(prev => ({ ...prev, isThinking: true }))

    try {
      // Get current context
      const context = {
        userId: user?.id,
        role: user?.role,
        projectId: getCurrentProjectId(),
        preferences: {
          tone: 'professional' as const,
          responseLength: 'detailed' as const,
        },
      }

      // Get AI response
      const response: ARIAResponse = await aria.chat(input, context)

      const assistantMessage: Message = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        suggestions: response.suggestions,
        actions: response.actions,
        confidence: response.metadata?.confidence,
      }

      setMessages(prev => [...prev, assistantMessage])

      // Process any actions
      if (response.actions) {
        processActions(response.actions)
      }

      // Show confidence indicator
      if (response.metadata?.confidence && response.metadata.confidence < 0.7) {
        toast.info('Low confidence response - consider verifying information')
      }
    } catch (error) {
      console.error('ARIA chat error:', error)
      const errorMessage: Message = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
      setState(prev => ({ ...prev, isThinking: false }))
    }
  }

  // Handle suggestion click
  const handleSuggestion = (suggestion: string) => {
    setInput(suggestion)
    inputRef.current?.focus()
  }

  // Process AI actions
  const processActions = (actions: Array<{ type: string; data: any }>) => {
    actions.forEach(action => {
      switch (action.type) {
        case 'navigate':
          navigate(action.data.path)
          break
        case 'create_task':
          // TODO: Implement task creation
          toast.success('Task created successfully')
          break
        case 'update_project':
          // TODO: Implement project update
          toast.success('Project updated')
          break
        case 'show_notification':
          toast.info(action.data.message)
          break
        default:
          console.log('Unknown action:', action)
      }
    })
  }

  // Get current project ID from context
  const getCurrentProjectId = (): string | undefined => {
    const path = location.pathname
    const match = path.match(/projects\/([^/]+)/)
    return match ? match[1] : undefined
  }

  // Toggle modes
  const toggleMode = (newMode: ARIAState['mode']) => {
    setState(prev => ({ ...prev, mode: newMode }))
    
    // Animate transition
    if (newMode === 'fullscreen') {
      controls.start({
        x: 0,
        y: 0,
        width: '100vw',
        height: '100vh',
        transition: { duration: 0.3 },
      })
    } else if (newMode === 'docked') {
      controls.start({
        x: window.innerWidth - 400,
        y: 0,
        width: 400,
        height: '100vh',
        transition: { duration: 0.3 },
      })
    }
  }

  // Voice input handling
  const toggleVoiceInput = () => {
    if (!state.isListening) {
      // Start listening
      if ('webkitSpeechRecognition' in window) {
        const recognition = new (window as any).webkitSpeechRecognition()
        recognition.continuous = false
        recognition.interimResults = false
        recognition.lang = 'en-US'

        recognition.onstart = () => {
          setState(prev => ({ ...prev, isListening: true }))
        }

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          setInput(transcript)
          setState(prev => ({ ...prev, isListening: false }))
        }

        recognition.onerror = () => {
          setState(prev => ({ ...prev, isListening: false }))
          toast.error('Voice recognition failed')
        }

        recognition.start()
      } else {
        toast.error('Voice recognition not supported in this browser')
      }
    } else {
      setState(prev => ({ ...prev, isListening: false }))
    }
  }

  // Quick action buttons
  const quickActions = [
    { icon: Target, label: 'Goals', action: () => handleSuggestion('Show project goals') },
    { icon: TrendingUp, label: 'Analytics', action: () => handleSuggestion('Show analytics') },
    { icon: Shield, label: 'Compliance', action: () => handleSuggestion('Check compliance') },
    { icon: BookOpen, label: 'Learn', action: () => handleSuggestion('Explain UBBL requirements') },
  ]

  if (state.mode === 'minimized') {
    return (
      <motion.div
        className="fixed bottom-4 right-4 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
      >
        <Button
          onClick={() => setState(prev => ({ ...prev, mode: 'floating' }))}
          className="h-14 w-14 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg"
        >
          <Brain className="h-6 w-6 text-white" />
        </Button>
        {state.insights.length > 0 && (
          <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center bg-red-500">
            {state.insights.length}
          </Badge>
        )}
      </motion.div>
    )
  }

  // Only show when escaped from sidebar
  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        ref={dragRef}
        className={cn(
          "fixed z-50 bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col",
          state.mode === 'fullscreen' && "inset-0 rounded-none",
          state.mode === 'docked' && "right-0 top-0 h-screen rounded-l-lg",
          state.mode === 'floating' && "resize overflow-hidden"
        )}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          x: state.position.x,
          y: state.position.y,
          width: state.mode === 'fullscreen' ? '100vw' : state.mode === 'docked' ? 400 : state.size.width,
          height: state.mode === 'fullscreen' ? '100vh' : state.mode === 'docked' ? '100vh' : state.size.height,
        }}
        exit={{ opacity: 0, scale: 0.9 }}
        drag={state.mode === 'floating'}
        dragMomentum={false}
        dragElastic={0}
        onDragEnd={(_, info) => {
          setState(prev => ({
            ...prev,
            position: { x: info.point.x, y: info.point.y },
          }))
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Brain className="h-6 w-6 text-violet-600 dark:text-violet-400" />
              {state.isThinking && (
                <motion.div
                  className="absolute inset-0"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="h-6 w-6 text-yellow-500" />
                </motion.div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-sm">ARIA Assistant</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {state.isThinking ? 'Thinking...' : 'Always here to help'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {state.mode === 'floating' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => toggleMode('docked')}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
            )}
            {state.mode === 'docked' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => toggleMode('floating')}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => toggleMode('fullscreen')}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setState(prev => ({ ...prev, mode: 'minimized' }))}
              title="Minimize"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsVisible(false)}
              title="Return to Sidebar"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Insights Bar */}
        {state.insights.length > 0 && (
          <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="space-y-1">
              {state.insights.slice(0, 2).map((insight, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex items-start gap-2 p-2 rounded text-xs cursor-pointer hover:bg-white dark:hover:bg-gray-800",
                    insight.type === 'warning' && "bg-yellow-50 dark:bg-yellow-900/20",
                    insight.type === 'success' && "bg-green-50 dark:bg-green-900/20",
                    insight.type === 'tip' && "bg-blue-50 dark:bg-blue-900/20"
                  )}
                  onClick={insight.action}
                >
                  {insight.type === 'warning' && <AlertCircle className="h-3 w-3 text-yellow-600 mt-0.5" />}
                  {insight.type === 'success' && <CheckCircle className="h-3 w-3 text-green-600 mt-0.5" />}
                  {insight.type === 'tip' && <Lightbulb className="h-3 w-3 text-blue-600 mt-0.5" />}
                  {insight.type === 'info' && <HelpCircle className="h-3 w-3 text-gray-600 mt-0.5" />}
                  <span className="flex-1">{insight.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions (Fullscreen mode) */}
        {state.mode === 'fullscreen' && (
          <div className="flex items-center gap-2 p-3 border-b border-gray-200 dark:border-gray-700">
            {quickActions.map((action, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={action.action}
              >
                <action.icon className="h-4 w-4" />
                {action.label}
              </Button>
            ))}
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === 'user' && "justify-end"
                )}
              >
                {message.role === 'assistant' && (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Brain className="h-4 w-4 text-white" />
                  </div>
                )}
                
                <div className={cn(
                  "max-w-[80%] space-y-2",
                  message.role === 'user' && "items-end"
                )}>
                  <div
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm",
                      message.role === 'user'
                        ? "bg-violet-600 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                  
                  {message.confidence && message.confidence < 0.7 && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                      Confidence: {(message.confidence * 100).toFixed(0)}%
                    </p>
                  )}
                  
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {message.suggestions.map((suggestion, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => handleSuggestion(suggestion)}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
                
                {message.role === 'user' && (
                  <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold">
                      {user?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                )}
              </div>
            ))}
            
            {isTyping && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 flex items-center justify-center">
                  <Brain className="h-4 w-4 text-white" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
                  <motion.div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="h-2 w-2 bg-gray-400 rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{
                          duration: 0.5,
                          repeat: Infinity,
                          delay: i * 0.1,
                        }}
                      />
                    ))}
                  </motion.div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Suggestions */}
        {state.suggestions.length > 0 && (
          <div className="p-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-1 overflow-x-auto">
              {state.suggestions.map((suggestion, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="text-xs whitespace-nowrap flex-shrink-0"
                  onClick={() => handleSuggestion(suggestion)}
                >
                  <Zap className="h-3 w-3 mr-1" />
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="flex-shrink-0"
              onClick={toggleVoiceInput}
            >
              {state.isListening ? (
                <MicOff className="h-4 w-4 text-red-500" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
            
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask ARIA anything..."
              className="flex-1"
              disabled={isTyping || state.isListening}
            />
            
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {state.mode === 'fullscreen' ? 'Full Command Center' : 'Press Cmd+K for quick actions'}
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Powered
              </Badge>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}