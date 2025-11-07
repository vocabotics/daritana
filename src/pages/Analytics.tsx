import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AIInsights } from '@/components/analytics/AIInsights';
import { PredictiveAnalytics } from '@/components/analytics/PredictiveAnalytics';
import { PerformanceMetrics } from '@/components/analytics/PerformanceMetrics';
import { TrendAnalysis } from '@/components/analytics/TrendAnalysis';
import { AutomatedRecommendations } from '@/components/analytics/AutomatedRecommendations';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  BarChart3,
  PieChart,
  LineChart,
  Brain,
  Zap,
  Target,
  AlertTriangle,
  CheckCircle,
  Download,
  RefreshCw
} from 'lucide-react';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { useProjectStore } from '@/store/projectStore';
import { motion } from 'framer-motion';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const { projects } = useProjectStore();

  // Calculate real metrics from projects
  const metrics = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'in_progress').length,
    completedProjects: projects.filter(p => p.status === 'completed').length,
    overallProgress: Math.round(
      projects.reduce((acc, p) => acc + p.progress, 0) / projects.length
    ),
    totalBudget: projects.reduce((acc, p) => acc + (p.budget || 0), 0),
    totalTasks: projects.reduce((acc, p) => acc + (p.tasks?.length || 0), 0)
  };

  const refreshData = async () => {
    setIsLoading(true);
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
  };

  return (
    <Layout>
      <div className="container max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Advanced Analytics</h1>
            <p className="text-gray-500 mt-1">AI-powered insights and predictive analytics</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="icon"
              onClick={refreshData}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Project Efficiency
                  </CardTitle>
                  <Activity className="h-4 w-4 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">92.5%</div>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-500">+5.2%</span>
                  <span className="text-sm text-gray-500 ml-1">vs last period</span>
                </div>
                <Progress value={92.5} className="mt-2" />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Resource Utilization
                  </CardTitle>
                  <PieChart className="h-4 w-4 text-purple-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">78.3%</div>
                <div className="flex items-center mt-2">
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  <span className="text-sm text-red-500">-2.1%</span>
                  <span className="text-sm text-gray-500 ml-1">needs attention</span>
                </div>
                <Progress value={78.3} className="mt-2" />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    On-Time Delivery
                  </CardTitle>
                  <Target className="h-4 w-4 text-green-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">88.9%</div>
                <div className="flex items-center mt-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-gray-500">Above target</span>
                </div>
                <Progress value={88.9} className="mt-2" />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Cost Performance
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-orange-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1.08</div>
                <div className="flex items-center mt-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500 mr-1" />
                  <span className="text-sm text-gray-500">CPI slightly over</span>
                </div>
                <Progress value={54} className="mt-2" />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Analytics Tabs */}
        <Tabs defaultValue="ai-insights" className="space-y-4">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="ai-insights" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Insights
            </TabsTrigger>
            <TabsTrigger value="predictive" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Predictive
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <LineChart className="h-4 w-4" />
              Trends
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Recommendations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai-insights" className="space-y-4">
            <AIInsights projects={projects} timeRange={timeRange} />
          </TabsContent>

          <TabsContent value="predictive" className="space-y-4">
            <PredictiveAnalytics projects={projects} timeRange={timeRange} />
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <PerformanceMetrics projects={projects} timeRange={timeRange} />
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <TrendAnalysis projects={projects} timeRange={timeRange} />
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <AutomatedRecommendations projects={projects} metrics={metrics} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}