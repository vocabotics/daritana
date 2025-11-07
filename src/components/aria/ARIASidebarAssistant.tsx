import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain,
  Sparkles,
  MessageSquare,
  Mic,
  MicOff,
  Minimize2,
  Maximize2,
  Send,
  X,
  Settings,
  Zap,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useARIA } from './ARIAProvider'
import { cn } from '@/lib/utils'

interface ChatMessage {
  id: string
  type: 'user' | 'aria' | 'system'
  content: string
  timestamp: Date
  thinking?: boolean
}

export const ARIASidebarAssistant: React.FC = () => {
  const { askARIA, contextualInsights } = useARIA()
  const [mode, setMode] = useState<'compact' | 'chat' | 'minimized'>('compact')
  const [isListening, setIsListening] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'aria',
      content: "👋 Hi there! I'm ARIA, your AI assistant. I'm here to help with your architecture projects, tasks, and anything else you need. What can I do for you today?",
      timestamp: new Date(),
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [chatMessages])

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    }

    setChatMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsThinking(true)

    try {
      const response = await askARIA(inputValue)
      
      const ariaMessage: ChatMessage = {
        id: `aria_${Date.now()}`,
        type: 'aria',
        content: response.message,
        timestamp: new Date(),
      }
      
      setChatMessages(prev => [...prev, ariaMessage])
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        type: 'system',
        content: "I'm having trouble processing your request right now. Please try again in a moment.",
        timestamp: new Date(),
      }
      setChatMessages(prev => [...prev, errorMessage])
    } finally {
      setIsThinking(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const toggleVoice = () => {
    setIsListening(!isListening)
    // Voice recognition implementation would go here
  }

  const escapeToFloat = () => {
    // Trigger the floating assistant
    window.dispatchEvent(new CustomEvent('aria-escape-to-float'))
    setMode('minimized')
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  }

  const urgentInsights = contextualInsights.filter(i => i.priority === 'high' || i.priority === 'urgent').slice(0, 2)

  if (mode === 'minimized') {
    return (
      <div className="p-2 border-t border-gray-200 bg-gradient-to-r from-violet-50 to-indigo-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMode('compact')}
          className="w-full justify-start text-violet-700 hover:bg-violet-100"
        >
          <Brain className="h-4 w-4 mr-2" />
          <span className="text-xs">ARIA (minimized)</span>
        </Button>
      </div>
    )
  }

  return (
    <div className="border-t border-gray-200 bg-gradient-to-br from-violet-50 via-white to-indigo-50">
      {/* Header */}
      <div className="p-3 border-b border-violet-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Brain className="h-5 w-5 text-violet-600" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -top-1 -right-1"
              >
                <Sparkles className="h-3 w-3 text-yellow-500" />
              </motion.div>
            </div>
            <div>
              <p className="text-sm font-semibold text-violet-700">ARIA</p>
              <p className="text-xs text-violet-500">AI Assistant</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMode(mode === 'compact' ? 'chat' : 'compact')}
              className="h-6 w-6 p-0 hover:bg-violet-100"
            >
              {mode === 'compact' ? (
                <MessageSquare className="h-3 w-3 text-violet-600" />
              ) : (
                <Minimize2 className="h-3 w-3 text-violet-600" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={escapeToFloat}
              className="h-6 w-6 p-0 hover:bg-violet-100"
              title="Let ARIA float around"
            >
              <Maximize2 className="h-3 w-3 text-violet-600" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMode('minimized')}
              className="h-6 w-6 p-0 hover:bg-violet-100"
            >
              <X className="h-3 w-3 text-violet-600" />
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {mode === 'compact' && (
          <motion.div
            key="compact"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3"
          >
            <p className="text-xs text-gray-600 mb-3">
              {getGreeting()}! I'm ready to help with your projects.
            </p>
            
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => handleSendMessage()}
              >
                <Zap className="h-3 w-3 mr-1" />
                Quick Help
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => window.location.href = '/aria'}
              >
                <Settings className="h-3 w-3 mr-1" />
                Command Center
              </Button>
            </div>

            {/* Urgent Insights */}
            {urgentInsights.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-700">Urgent:</p>
                {urgentInsights.map(insight => (
                  <div key={insight.id} className="p-2 bg-red-50 border border-red-200 rounded text-xs">
                    <p className="font-medium text-red-700">{insight.title}</p>
                    <p className="text-red-600 truncate">{insight.message}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Switch to Chat */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMode('chat')}
              className="w-full justify-start h-8 text-xs text-violet-700 hover:bg-violet-100 mt-2"
            >
              <MessageSquare className="h-3 w-3 mr-2" />
              Switch to Chat Mode
            </Button>
          </motion.div>
        )}

        {mode === 'chat' && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col"
          >
            {/* Chat Messages */}
            <ScrollArea className="h-64 p-3" ref={chatScrollRef}>
              <div className="space-y-3">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.type === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] p-2 rounded-lg text-xs",
                        message.type === 'user'
                          ? 'bg-violet-600 text-white rounded-br-none'
                          : message.type === 'aria'
                          ? 'bg-gray-100 text-gray-900 rounded-bl-none'
                          : 'bg-yellow-50 text-yellow-800 rounded-none border border-yellow-200'
                      )}
                    >
                      {message.type === 'aria' && (
                        <div className="flex items-center gap-1 mb-1">
                          <Brain className="h-3 w-3 text-violet-600" />
                          <span className="font-medium text-violet-700">ARIA</span>
                        </div>
                      )}
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <p className={cn(
                        "text-xs opacity-70 mt-1",
                        message.type === 'user' ? 'text-violet-200' : 'text-gray-500'
                      )}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                
                {isThinking && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 p-2 rounded-lg rounded-bl-none">
                      <div className="flex items-center gap-1 mb-1">
                        <Brain className="h-3 w-3 text-violet-600" />
                        <span className="font-medium text-violet-700 text-xs">ARIA</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="flex gap-1">
                          <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                            className="w-1.5 h-1.5 bg-violet-400 rounded-full"
                          />
                          <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                            className="w-1.5 h-1.5 bg-violet-400 rounded-full"
                          />
                          <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                            className="w-1.5 h-1.5 bg-violet-400 rounded-full"
                          />
                        </div>
                        <span className="text-xs text-gray-500">thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Chat Input */}
            <div className="p-3 border-t border-violet-100">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask ARIA anything..."
                    className="text-xs pr-8"
                    disabled={isThinking}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isThinking}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  >
                    <Send className="h-3 w-3" />
                  </Button>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleVoice}
                  className={cn(
                    "h-8 w-8 p-0",
                    isListening ? "bg-red-100 text-red-600" : "text-gray-600"
                  )}
                >
                  {isListening ? (
                    <MicOff className="h-3 w-3" />
                  ) : (
                    <Mic className="h-3 w-3" />
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMuted(!isMuted)}
                  className="h-8 w-8 p-0 text-gray-600"
                >
                  {isMuted ? (
                    <VolumeX className="h-3 w-3" />
                  ) : (
                    <Volume2 className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}