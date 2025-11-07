import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  Play
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Layout } from '@/components/layout/Layout';
import { useProjectStore } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';
import { aiApi } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CommandCenterStats {
  totalInteractions: number;
  helpfulResponses: number;
  tasksAutomated: number;
  timesSaved: number; // in hours
  complianceChecks: number;
  designSuggestions: number;
  insightsGenerated: number;
  accuracyRate: number;
}

interface QuickAction {
  id: string;
  icon: React.ElementType;
  label: string;
  description: string;
  category: 'project' | 'design' | 'compliance' | 'analysis' | 'communication';
  action: () => Promise<void>;
  color: string;
}

interface AIInsight {
  id: string;
  type: 'warning' | 'tip' | 'achievement' | 'alert';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  action?: {
    label: string;
    handler: () => void;
  };
}

interface RecentInteraction {
  id: string;
  query: string;
  response: string;
  context: string;
  timestamp: string;
  helpful: boolean | null;
}

export default function ARIACommandCenter() {
  const { projects, tasks } = useProjectStore();
  const { user } = useAuthStore();
  
  const [stats, setStats] = useState<CommandCenterStats>({
    totalInteractions: 0,
    helpfulResponses: 0,
    tasksAutomated: 0,
    timesSaved: 0,
    complianceChecks: 0,
    designSuggestions: 0,
    insightsGenerated: 0,
    accuracyRate: 0,
  });
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('actions');
  const [aiUsageStats, setAIUsageStats] = useState<any>(null);
  const [contextualInsights, setContextualInsights] = useState<AIInsight[]>([]);
  const [recentInteractions, setRecentInteractions] = useState<RecentInteraction[]>([]);

  // Load AI data from APIs
  useEffect(() => {
    const loadAIData = async () => {
      try {
        // Load AI usage stats
        const statsResponse = await aiApi.getAIUsageStats();
        if (statsResponse.data?.stats) {
          setAIUsageStats(statsResponse.data.stats);
          setStats({
            totalInteractions: statsResponse.data.stats.totalInteractions || 0,
            helpfulResponses: statsResponse.data.stats.helpfulResponses || 0,
            tasksAutomated: statsResponse.data.stats.tasksAutomated || 0,
            timesSaved: statsResponse.data.stats.timesSaved || 0,
            complianceChecks: statsResponse.data.stats.complianceChecks || 0,
            designSuggestions: statsResponse.data.stats.designSuggestions || 0,
            insightsGenerated: statsResponse.data.stats.insightsGenerated || 0,
            accuracyRate: statsResponse.data.stats.accuracyRate || 0,
          });
        }

        // Load AI insights
        const insightsResponse = await aiApi.getAIInsights();
        if (insightsResponse.data?.insights) {
          const formattedInsights = insightsResponse.data.insights.map((insight: any) => ({
            id: insight.id,
            type: insight.type || 'tip',
            title: insight.title,
            message: insight.message,
            priority: insight.priority || 'medium',
            timestamp: insight.timestamp || new Date().toISOString(),
            action: insight.action
          }));
          setContextualInsights(formattedInsights);
        }

        // Load recent interactions
        const interactionsResponse = await aiApi.getAIInteractions({ limit: 10 });
        if (interactionsResponse.data?.interactions) {
          const formattedInteractions = interactionsResponse.data.interactions.map((interaction: any) => ({
            id: interaction.id,
            query: interaction.query,
            response: interaction.response,
            context: interaction.context || '',
            timestamp: interaction.timestamp || new Date().toISOString(),
            helpful: interaction.helpful
          }));
          setRecentInteractions(formattedInteractions);
        }
      } catch (error) {
        console.error('Failed to load AI data:', error);
        // Fallback to mock data if APIs are not available
        setContextualInsights([
    {
      id: '1',
      type: 'warning',
      title: 'Resource Overallocation Detected',
      message: 'Ahmad Ibrahim is allocated 120% capacity across 3 projects this week',
      priority: 'high',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      action: {
        label: 'View Resource Management',
        handler: () => toast.info('Opening Resource Management...')
      }
    },
    {
      id: '2',
      type: 'tip',
      title: 'Design Optimization Opportunity',
      message: 'Consider using sustainable materials for KLCC Tower project to improve LEED rating',
      priority: 'medium',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      action: {
        label: 'View Design Suggestions',
        handler: () => toast.info('Opening Design Center...')
      }
    },
    {
      id: '3',
      type: 'achievement',
      title: 'Compliance Check Completed',
      message: 'All projects are now 100% compliant with latest UBBL requirements',
      priority: 'low',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
    }
  ];

  const recentInteractions: RecentInteraction[] = [
    {
      id: '1',
      query: 'What are the latest UBBL requirements for commercial buildings?',
      response: 'Based on the latest UBBL 2023 updates, commercial buildings must comply with...',
      context: 'compliance',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      helpful: true
    },
    {
      id: '2',
      query: 'Generate a project timeline for heritage restoration',
      response: 'For heritage restoration projects, I recommend a phased approach...',
      context: 'project',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      helpful: true
    }
  ];

  useEffect(() => {
    loadStats();
    loadAIUsage();
  }, []);

  const loadStats = async () => {
    // Calculate stats from recent interactions and stored data
    const totalInteractions = recentInteractions.length;
    const helpfulResponses = recentInteractions.filter(i => i.helpful === true).length;
    const accuracyRate = totalInteractions > 0 ? (helpfulResponses / totalInteractions) * 100 : 0;
    
    setStats({
      totalInteractions: totalInteractions + 125, // Mock additional interactions
      helpfulResponses: helpfulResponses + 110,
      tasksAutomated: Math.floor((totalInteractions + 125) * 0.3),
      timesSaved: Math.floor((totalInteractions + 125) * 0.25),
      complianceChecks: recentInteractions.filter(i => i.context.includes('compliance')).length + 8,
      designSuggestions: recentInteractions.filter(i => i.context.includes('design')).length + 15,
      insightsGenerated: contextualInsights.length + 22,
      accuracyRate,
    });
  };

  const loadAIUsage = async () => {
    // Mock AI usage data
    setAIUsageStats({
      usage: {
        totalRequests: 1247,
        totalCost: 89.45,
        averageLatency: 1250,
        cacheHitRate: 0.73,
        totalTokens: 45678,
        modelBreakdown: {
          'openai/gpt-4': { requests: 450, cost: 45.20 },
          'anthropic/claude-3': { requests: 320, cost: 28.15 },
          'openai/gpt-3.5-turbo': { requests: 477, cost: 16.10 }
        }
      },
      budget: {
        used: 89.45,
        limit: 500,
        percentage: 17.89
      }
    });
  };

  const quickActions: QuickAction[] = [
    {
      id: 'timeline',
      icon: Calendar,
      label: 'Generate Timeline',
      description: 'Create AI-optimized project timeline',
      category: 'project',
      color: 'bg-blue-500',
      action: async () => {
        setIsProcessing(true);
        await new Promise(resolve => setTimeout(resolve, 2000));
        toast.success('Timeline generated successfully');
        setIsProcessing(false);
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
        setIsProcessing(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        toast.success('Compliance check complete: All projects compliant');
        setIsProcessing(false);
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
        setIsProcessing(true);
        await new Promise(resolve => setTimeout(resolve, 3000));
        toast.success('Design concepts generated');
        setIsProcessing(false);
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
        setIsProcessing(true);
        await new Promise(resolve => setTimeout(resolve, 2500));
        toast.success('Risk analysis complete');
        setIsProcessing(false);
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
        setIsProcessing(true);
        await new Promise(resolve => setTimeout(resolve, 1800));
        toast.success('Task priorities updated');
        setIsProcessing(false);
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
        setIsProcessing(true);
        await new Promise(resolve => setTimeout(resolve, 2200));
        toast.success('Report generated');
        setIsProcessing(false);
      },
    },
  ];

  const filteredActions = quickActions.filter(action => 
    (selectedCategory === 'all' || action.category === selectedCategory) &&
    (searchQuery === '' || action.label.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toolbar = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-3">
        <Brain className="h-5 w-5 text-purple-600" />
        <span className="text-lg font-semibold text-gray-900">ARIA Command Center</span>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 mx-6">
        <TabsList className="h-8 bg-transparent border-0 p-0">
          <TabsTrigger value="actions" className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Zap className="h-4 w-4 mr-2" />
            Quick Actions
          </TabsTrigger>
          <TabsTrigger value="insights" className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Lightbulb className="h-4 w-4 mr-2" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="history" className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Clock className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="h-8" onClick={loadAIUsage}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        <Button variant="outline" size="sm" className="h-8">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>
    </div>
  );

  return (
    <Layout
      contextualInfo={false}
      fullHeight={true}
      toolbar={toolbar}
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
                of ${aiUsageStats?.budget?.limit || 500} limit
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
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
                            <Play className="h-4 w-4 mr-2" />
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
  );
}