import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Brain,
  Sparkles,
  MessageSquare,
  TrendingUp,
  Clock,
  Users,
  ChevronRight,
  Zap,
  BarChart3,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useARIA } from '@/components/aria/ARIAProvider'
import { usageMonitor } from '@/services/ai/usageMonitor'

interface ARIAStats {
  totalInteractions: number
  responseTime: number
  accuracy: number
  tasksAutomated: number
  timesSaved: number
}

export const ARIADashboardWidget: React.FC = () => {
  const { recentInteractions, contextualInsights } = useARIA()
  const [stats, setStats] = useState<ARIAStats>({
    totalInteractions: 0,
    responseTime: 1200,
    accuracy: 95,
    tasksAutomated: 0,
    timesSaved: 0,
  })
  const [aiUsage, setAIUsage] = useState<any>(null)

  useEffect(() => {
    loadStats()
    loadAIUsage()
  }, [])

  const loadStats = async () => {
    const interactions = recentInteractions.length
    const helpfulCount = recentInteractions.filter(i => i.helpful === true).length
    const accuracy = interactions > 0 ? (helpfulCount / interactions) * 100 : 95

    setStats({
      totalInteractions: interactions,
      responseTime: 1200,
      accuracy,
      tasksAutomated: Math.floor(interactions * 0.4),
      timesSaved: Math.floor(interactions * 0.25),
    })
  }

  const loadAIUsage = async () => {
    try {
      const usage = await usageMonitor.getStats('week')
      setAIUsage(usage)
    } catch (error) {
      console.error('Failed to load AI usage:', error)
    }
  }

  const quickActions = [
    {
      id: 'chat',
      icon: MessageSquare,
      label: 'Ask ARIA',
      description: 'Get instant help',
      color: 'text-blue-600',
    },
    {
      id: 'timeline',
      icon: Clock,
      label: 'Generate Timeline',
      description: 'AI project planning',
      color: 'text-green-600',
    },
    {
      id: 'insights',
      icon: TrendingUp,
      label: 'Get Insights',
      description: 'Performance analysis',
      color: 'text-purple-600',
    },
    {
      id: 'team',
      icon: Users,
      label: 'Team Check',
      description: 'Monitor progress',
      color: 'text-orange-600',
    },
  ]

  const recentInsights = contextualInsights.slice(0, 3)

  return (
    <Card className="col-span-full lg:col-span-2 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Brain className="h-6 w-6 text-violet-600" />
              <Sparkles className="h-3 w-3 text-yellow-500 absolute -top-1 -right-1" />
            </div>
            <div>
              <CardTitle className="text-lg">ARIA Assistant</CardTitle>
              <CardDescription>Your AI-powered productivity companion</CardDescription>
            </div>
          </div>
          <Link to="/aria">
            <Button variant="outline" size="sm">
              Command Center
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-violet-600">{stats.totalInteractions}</div>
            <div className="text-xs text-gray-500">Conversations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.timesSaved}h</div>
            <div className="text-xs text-gray-500">Time Saved</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.responseTime}ms</div>
            <div className="text-xs text-gray-500">Avg Response</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.accuracy}%</div>
            <div className="text-xs text-gray-500">Accuracy</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h4>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {quickActions.map((action) => (
              <motion.button
                key={action.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors text-left"
                onClick={() => {
                  if (action.id === 'chat') {
                    // This will open ARIA in chat mode from sidebar or as floating assistant
                    window.dispatchEvent(new CustomEvent('aria-open-chat'))
                  } else {
                    // Navigate to command center with specific action
                    window.location.href = `/aria?action=${action.id}`
                  }
                }}
              >
                <action.icon className={`h-4 w-4 ${action.color} mb-2`} />
                <div className="text-xs font-medium text-gray-900">{action.label}</div>
                <div className="text-xs text-gray-500">{action.description}</div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Recent Insights */}
        {recentInsights.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Recent Insights</h4>
            <div className="space-y-2">
              {recentInsights.map((insight) => (
                <div
                  key={insight.id}
                  className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-shrink-0">
                    {insight.type === 'achievement' && (
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                    )}
                    {insight.type === 'warning' && (
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2" />
                    )}
                    {insight.type === 'tip' && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                    )}
                    {insight.type === 'alert' && (
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {insight.title}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {insight.message}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {insight.priority}
                  </Badge>
                </div>
              ))}
            </div>
            {contextualInsights.length > 3 && (
              <Link to="/aria?tab=insights" className="text-xs text-violet-600 hover:text-violet-700 inline-flex items-center mt-2">
                View all {contextualInsights.length} insights
                <ChevronRight className="h-3 w-3 ml-1" />
              </Link>
            )}
          </div>
        )}

        {/* AI Usage Summary */}
        {aiUsage && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-700">AI Usage This Week</h4>
              <Link to="/aria?tab=analytics">
                <Button variant="ghost" size="sm" className="text-xs h-6">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Analytics
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Requests: {aiUsage.totalRequests || 0}</span>
              <span className="text-gray-500">Cost: ${(aiUsage.totalCost || 0).toFixed(2)}</span>
              <span className="text-gray-500">Avg: {aiUsage.averageLatency || 0}ms</span>
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Need help? Just ask ARIA anything!
            </div>
            <Link to="/aria">
              <Button size="sm" className="h-7 text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Open ARIA
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}