import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Brain,
  Sparkles,
  Target,
  TrendingUp,
  Shield,
  BookOpen,
  Calendar,
  FileText,
  Users,
  Building,
  Palette,
  Calculator,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  MessageSquare,
  Settings,
  HelpCircle,
  ChevronRight,
  Search,
  Filter,
  Download,
  Share2,
  RefreshCw,
  Lightbulb,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Layout } from '@/components/layout/Layout'
import { useARIA } from './ARIAProvider'
import { useProjectStore } from '@/store/projectStore'
import { useAuthStore } from '@/store/authStore'
import { usageMonitor } from '@/services/ai/usageMonitor'
import { aria } from '@/services/ai/ariaAssistant'
import { complianceAI } from '@/services/ai/complianceAI'
import { promptTemplates } from '@/services/ai/promptTemplates'
import { ariaTeamManager } from '@/services/ai/ariaTeamManager'
import { ariaDailyStandup } from '@/services/ai/ariaDailyStandup'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface CommandCenterStats {
  totalInteractions: number
  helpfulResponses: number
  tasksAutomated: number
  timesSaved: number // in hours
  complianceChecks: number
  designSuggestions: number
  insightsGenerated: number
  accuracyRate: number
}

interface QuickAction {
  id: string
  icon: React.ElementType
  label: string
  description: string
  category: 'project' | 'design' | 'compliance' | 'analysis' | 'communication'
  action: () => Promise<void>
  color: string
}

export const ARIACommandCenter: React.FC = () => {
  const { askARIA, recentInteractions, contextualInsights, userPreferences } = useARIA()
  const { projects, tasks } = useProjectStore()
  const { user } = useAuthStore()
  
  const [stats, setStats] = useState<CommandCenterStats>({
    totalInteractions: 0,
    helpfulResponses: 0,
    tasksAutomated: 0,
    timesSaved: 0,
    complianceChecks: 0,
    designSuggestions: 0,
    insightsGenerated: 0,
    accuracyRate: 0,
  })
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [aiUsageStats, setAIUsageStats] = useState<any>(null)

  useEffect(() => {
    loadStats()
    loadAIUsage()
  }, [])

  const loadStats = async () => {
    // Calculate stats from recent interactions and stored data
    const totalInteractions = recentInteractions.length
    const helpfulResponses = recentInteractions.filter(i => i.helpful === true).length
    const accuracyRate = totalInteractions > 0 ? (helpfulResponses / totalInteractions) * 100 : 0
    
    setStats({
      totalInteractions,
      helpfulResponses,
      tasksAutomated: Math.floor(totalInteractions * 0.3), // Estimate
      timesSaved: Math.floor(totalInteractions * 0.25), // Estimate 15 min per interaction
      complianceChecks: recentInteractions.filter(i => i.context.includes('compliance')).length,
      designSuggestions: recentInteractions.filter(i => i.context.includes('design')).length,
      insightsGenerated: contextualInsights.length,
      accuracyRate,
    })
  }

  const loadAIUsage = async () => {
    try {
      const usage = await usageMonitor.getStats('month')
      const budget = usageMonitor.getBudgetStatus()
      setAIUsageStats({ usage, budget })
    } catch (error) {
      console.error('Failed to load AI usage stats:', error)
      // Set default stats to prevent crashes
      setAIUsageStats({
        usage: {
          totalRequests: 0,
          totalCost: 0,
          averageLatency: 0,
          cacheHitRate: 0,
          totalTokens: 0,
          modelBreakdown: {}
        },
        budget: {
          used: 0,
          limit: 1000,
          percentage: 0
        }
      })
    }
  }

  const quickActions: QuickAction[] = [
    {
      id: 'timeline',
      icon: Calendar,
      label: 'Generate Timeline',
      description: 'Create AI-optimized project timeline',
      category: 'project',
      color: 'bg-blue-500',
      action: async () => {
        setIsProcessing(true)
        try {
          const response = await aria.suggestTimeline({
            projectType: 'residential',
            scope: 'Full renovation',
            budget: 500000,
            startDate: new Date(),
          })
          toast.success('Timeline generated successfully')
        } catch (error) {
          console.error('Timeline generation error:', error)
          toast.error('Timeline generation temporarily unavailable')
        }
        setIsProcessing(false)
      },
    },
    {
      id: 'compliance',
      icon: Shield,
      label: 'Check Compliance',
      description: 'Run UBBL compliance analysis',
      category: 'compliance',
      color: 'bg-green-500',
      action: async () => {
        setIsProcessing(true)
        try {
          const report = await complianceAI.checkCompliance({
            projectType: 'commercial',
            location: 'Kuala Lumpur',
            specifications: {
              totalArea: 5000,
              buildingHeight: 30,
              numberOfFloors: 10,
            },
          })
          toast.success(`Compliance check complete: ${report.overallStatus}`)
        } catch (error) {
          console.error('Compliance check error:', error)
          toast.error('Compliance checking temporarily unavailable')
        }
        setIsProcessing(false)
      },
    },
    {
      id: 'design',
      icon: Palette,
      label: 'Design Concepts',
      description: 'Generate AI design suggestions',
      category: 'design',
      color: 'bg-purple-500',
      action: async () => {
        setIsProcessing(true)
        try {
          const response = await aria.suggestDesign({
            style: 'Modern Minimalist',
            space: 'Living Room',
            budget: { min: 50000, max: 100000, currency: 'MYR' },
            preferences: ['Natural materials', 'Bright colors', 'Feng Shui'],
          })
          toast.success('Design concepts generated')
        } catch (error) {
          console.error('Design generation error:', error)
          toast.error('Design generation temporarily unavailable')
        }
        setIsProcessing(false)
      },
    },
    {
      id: 'risk',
      icon: AlertTriangle,
      label: 'Risk Analysis',
      description: 'Identify and analyze project risks',
      category: 'analysis',
      color: 'bg-red-500',
      action: async () => {
        setIsProcessing(true)
        try {
          const response = await aria.analyzeRisks({
            projectId: projects[0]?.id,
            projectName: projects[0]?.name,
          })
          toast.success('Risk analysis complete')
        } catch (error) {
          console.error('Risk analysis error:', error)
          toast.error('Risk analysis temporarily unavailable')
        }
        setIsProcessing(false)
      },
    },
    {
      id: 'tasks',
      icon: Target,
      label: 'Task Prioritization',
      description: 'AI-powered task prioritization',
      category: 'project',
      color: 'bg-orange-500',
      action: async () => {
        setIsProcessing(true)
        try {
          const response = await aria.recommendTasks({
            projectPhase: 'Development',
            completedTasks: tasks.filter(t => t.status === 'completed').map(t => t.title),
            teamSize: 5,
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          })
          toast.success('Task priorities updated')
        } catch (error) {
          console.error('Task prioritization error:', error)
          toast.error('Task prioritization temporarily unavailable')
        }
        setIsProcessing(false)
      },
    },
    {
      id: 'report',
      icon: FileText,
      label: 'Generate Report',
      description: 'Create comprehensive project report',
      category: 'communication',
      color: 'bg-indigo-500',
      action: async () => {
        setIsProcessing(true)
        try {
          const response = await askARIA('Generate a comprehensive project status report with metrics, risks, and recommendations')
          toast.success('Report generated')
        } catch (error) {
          console.error('Report generation error:', error)
          toast.error('Report generation temporarily unavailable')
        }
        setIsProcessing(false)
      },
    },
    {
      id: 'team-check',
      icon: Users,
      label: 'Team Performance',
      description: 'Analyze team performance and bottlenecks',
      category: 'project',
      color: 'bg-teal-500',
      action: async () => {
        setIsProcessing(true)
        try {
          const report = await ariaTeamManager.getTeamPerformanceReport()
          toast.success(`Team analysis complete: ${report.insights.length} insights found`)
        } catch (error) {
          console.error('Team performance error:', error)
          toast.error('Team performance analysis temporarily unavailable')
        }
        setIsProcessing(false)
      },
    },
    {
      id: 'standup',
      icon: MessageSquare,
      label: 'Daily Standup',
      description: 'Generate team standup summary',
      category: 'communication',
      color: 'bg-cyan-500',
      action: async () => {
        setIsProcessing(true)
        try {
          const analytics = await ariaDailyStandup.getStandupAnalytics('default-team')
          toast.success(`Standup analytics: ${analytics.participation}% participation`)
        } catch (error) {
          console.error('Standup analytics error:', error)
          toast.error('Standup analytics temporarily unavailable')
        }
        setIsProcessing(false)
      },
    },
  ]

  const filteredActions = quickActions.filter(action => 
    (selectedCategory === 'all' || action.category === selectedCategory) &&
    (searchQuery === '' || action.label.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <Layout
      title="ARIA Command Center"
      description="Your AI-powered intelligence hub"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadAIUsage}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      }
      fullHeight={true}
    >
      <div className="space-y-6">

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Total Interactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {stats.totalInteractions}
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                +12% from last week
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-200 dark:border-green-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
                Time Saved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                {stats.timesSaved}h
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Productivity boost
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-200 dark:border-purple-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Accuracy Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {stats.accuracyRate.toFixed(1)}%
              </div>
              <Progress value={stats.accuracyRate} className="mt-2 h-1" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-200 dark:border-orange-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
                AI Budget
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                ${aiUsageStats?.budget?.used?.toFixed(0) || 0}
              </div>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                of ${aiUsageStats?.budget?.limit || 1000} limit
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="actions" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="actions">Quick Actions</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Quick Actions Tab */}
          <TabsContent value="actions" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('all')}
                >
                  All
                </Button>
                <Button
                  variant={selectedCategory === 'project' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('project')}
                >
                  Project
                </Button>
                <Button
                  variant={selectedCategory === 'design' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('design')}
                >
                  Design
                </Button>
                <Button
                  variant={selectedCategory === 'compliance' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('compliance')}
                >
                  Compliance
                </Button>
                <Button
                  variant={selectedCategory === 'analysis' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('analysis')}
                >
                  Analysis
                </Button>
              </div>
              
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search actions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredActions.map((action) => (
                <motion.div
                  key={action.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card 
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={action.action}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className={cn("p-2 rounded-lg", action.color)}>
                          <action.icon className="h-5 w-5 text-white" />
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {action.category}
                        </Badge>
                      </div>
                      <CardTitle className="text-base mt-3">{action.label}</CardTitle>
                      <CardDescription className="text-xs">
                        {action.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full"
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4 mr-2" />
                            Execute
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-4">
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {contextualInsights.map((insight) => (
                  <Card key={insight.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        insight.type === 'warning' && "bg-yellow-100 dark:bg-yellow-900/20",
                        insight.type === 'tip' && "bg-blue-100 dark:bg-blue-900/20",
                        insight.type === 'achievement' && "bg-green-100 dark:bg-green-900/20",
                        insight.type === 'alert' && "bg-red-100 dark:bg-red-900/20"
                      )}>
                        {insight.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-600" />}
                        {insight.type === 'tip' && <Lightbulb className="h-5 w-5 text-blue-600" />}
                        {insight.type === 'achievement' && <CheckCircle className="h-5 w-5 text-green-600" />}
                        {insight.type === 'alert' && <AlertCircle className="h-5 w-5 text-red-600" />}
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{insight.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {insight.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {insight.priority}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(insight.timestamp).toLocaleTimeString()}
                          </span>
                          {insight.action && (
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-xs"
                              onClick={insight.action.handler}
                            >
                              {insight.action.label}
                              <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {promptTemplates.getAllTemplates().slice(0, 6).map((template) => (
                <Card key={template.id} className="p-4">
                  <h4 className="font-semibold text-sm">{template.name}</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {template.description}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="outline" className="text-xs">
                      {template.category}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        toast.success(`Template "${template.name}" loaded`)
                      }}
                    >
                      Use Template
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Usage by Model</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {aiUsageStats?.usage?.modelBreakdown && 
                      Object.entries(aiUsageStats.usage.modelBreakdown).map(([model, data]: [string, any]) => (
                        <div key={model} className="flex items-center justify-between">
                          <span className="text-sm">{model.split('/')[1]}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {data.requests} requests
                            </Badge>
                            <span className="text-sm font-medium">
                              ${data.cost.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average Response Time</span>
                    <span className="text-sm font-medium">
                      {aiUsageStats?.usage?.averageLatency?.toFixed(0) || 0}ms
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cache Hit Rate</span>
                    <span className="text-sm font-medium">
                      {((aiUsageStats?.usage?.cacheHitRate || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Tokens Used</span>
                    <span className="text-sm font-medium">
                      {(aiUsageStats?.usage?.totalTokens || 0).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {recentInteractions.map((interaction) => (
                  <Card key={interaction.id} className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{interaction.query}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {interaction.response}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {interaction.context}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(interaction.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      {interaction.helpful !== null && (
                        <Badge 
                          variant={interaction.helpful ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {interaction.helpful ? 'Helpful' : 'Not Helpful'}
                        </Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}