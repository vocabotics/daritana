import React from 'react'
import { motion } from 'framer-motion'
import { Brain, Sparkles, Zap, AlertCircle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useARIA } from './ARIAProvider'
import { Badge } from '@/components/ui/badge'

interface ARIAIndicatorProps {
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  position?: 'inline' | 'fixed'
  className?: string
}

export const ARIAIndicator: React.FC<ARIAIndicatorProps> = ({
  size = 'sm',
  showLabel = false,
  position = 'inline',
  className,
}) => {
  const { isActive, contextualInsights } = useARIA()
  
  const hasInsights = contextualInsights.length > 0
  const hasWarnings = contextualInsights.some(i => i.type === 'warning')
  const hasAlerts = contextualInsights.some(i => i.type === 'alert')
  
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }
  
  const containerClasses = {
    sm: 'h-6 px-1',
    md: 'h-8 px-2',
    lg: 'h-10 px-3',
  }
  
  if (!isActive) return null
  
  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-100 to-indigo-100 dark:from-violet-900/20 dark:to-indigo-900/20",
        containerClasses[size],
        position === 'fixed' && "fixed top-4 right-4 z-40",
        className
      )}
    >
      <div className="relative">
        <Brain className={cn(sizeClasses[size], "text-violet-600 dark:text-violet-400")} />
        
        {/* Thinking animation */}
        <motion.div
          className="absolute inset-0"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Sparkles className={cn(sizeClasses[size], "text-yellow-500")} />
        </motion.div>
        
        {/* Status indicator */}
        {hasAlerts && (
          <div className="absolute -top-1 -right-1">
            <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
          </div>
        )}
        {hasWarnings && !hasAlerts && (
          <div className="absolute -top-1 -right-1">
            <div className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse" />
          </div>
        )}
        {hasInsights && !hasWarnings && !hasAlerts && (
          <div className="absolute -top-1 -right-1">
            <div className="h-2 w-2 bg-blue-500 rounded-full" />
          </div>
        )}
      </div>
      
      {showLabel && (
        <span className={cn(
          "font-medium text-violet-700 dark:text-violet-300",
          size === 'sm' && "text-xs",
          size === 'md' && "text-sm",
          size === 'lg' && "text-base"
        )}>
          ARIA
        </span>
      )}
      
      {hasInsights && (
        <Badge 
          variant="secondary" 
          className={cn(
            "rounded-full",
            size === 'sm' && "h-4 px-1 text-xs",
            size === 'md' && "h-5 px-1.5 text-xs",
            size === 'lg' && "h-6 px-2 text-sm"
          )}
        >
          {contextualInsights.length}
        </Badge>
      )}
    </div>
  )
}

// Micro indicator for inline use
export const ARIAMicroIndicator: React.FC<{ className?: string }> = ({ className }) => {
  const { isActive } = useARIA()
  
  if (!isActive) return null
  
  return (
    <motion.div
      className={cn("relative inline-block", className)}
      whileHover={{ scale: 1.1 }}
    >
      <Zap className="h-3 w-3 text-violet-600 dark:text-violet-400" />
      <motion.div
        className="absolute inset-0"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.5, 0, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Sparkles className="h-3 w-3 text-yellow-500" />
      </motion.div>
    </motion.div>
  )
}

// Status bar for showing ARIA activity
export const ARIAStatusBar: React.FC<{ className?: string }> = ({ className }) => {
  const { isActive, contextualInsights } = useARIA()
  
  if (!isActive || contextualInsights.length === 0) return null
  
  const latestInsight = contextualInsights[0]
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/10 dark:to-indigo-900/10 rounded-lg border border-violet-200 dark:border-violet-800",
        className
      )}
    >
      <ARIAMicroIndicator />
      <span className="text-xs text-gray-600 dark:text-gray-400">
        {latestInsight.message}
      </span>
      {latestInsight.action && (
        <button
          onClick={latestInsight.action.handler}
          className="text-xs text-violet-600 dark:text-violet-400 hover:underline"
        >
          {latestInsight.action.label}
        </button>
      )}
    </motion.div>
  )
}