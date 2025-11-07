import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Clock,
  Building,
  Users,
  Calendar,
  PieChart,
  Activity,
  Target,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Filter,
  Eye,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  progress: number;
  budget?: number;
  startDate: Date;
  endDate?: Date;
  location: string;
  client: string;
  team: string[];
  image?: string;
  priority?: 'low' | 'medium' | 'high';
  type: string;
}

interface ProjectAnalyticsLayoutProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
}

interface AnalyticsMetric {
  title: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'flat';
  icon: React.ElementType;
  color: string;
}

interface ChartData {
  name: string;
  value: number;
  color: string;
}

export const ProjectAnalyticsLayout: React.FC<ProjectAnalyticsLayoutProps> = ({
  projects,
  onProjectClick
}) => {
  const [timeRange, setTimeRange] = useState('3m');
  const [selectedMetric, setSelectedMetric] = useState('all');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate analytics metrics
  const analytics = useMemo(() => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const overdueProjects = projects.filter(p => {
      if (!p.endDate) return false;
      return p.endDate < new Date() && p.status !== 'completed';
    }).length;

    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const avgProgress = projects.reduce((sum, p) => sum + p.progress, 0) / totalProjects || 0;
    
    const completionRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;
    const onTimeProjects = projects.filter(p => {
      if (!p.endDate || p.status !== 'completed') return false;
      // Assume project was completed on time if it's completed (simplified)
      return true;
    }).length;
    
    const onTimeRate = completedProjects > 0 ? (onTimeProjects / completedProjects) * 100 : 0;

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      overdueProjects,
      totalBudget,
      avgProgress,
      completionRate,
      onTimeRate
    };
  }, [projects]);

  // Generate metrics cards
  const metrics: AnalyticsMetric[] = [
    {
      title: 'Total Projects',
      value: analytics.totalProjects,
      change: 12,
      trend: 'up',
      icon: Building,
      color: 'text-blue-600'
    },
    {
      title: 'Active Projects',
      value: analytics.activeProjects,
      change: 8,
      trend: 'up',
      icon: Activity,
      color: 'text-green-600'
    },
    {
      title: 'Completion Rate',
      value: `${analytics.completionRate.toFixed(1)}%`,
      change: 5.2,
      trend: 'up',
      icon: Target,
      color: 'text-purple-600'
    },
    {
      title: 'On-Time Delivery',
      value: `${analytics.onTimeRate.toFixed(1)}%`,
      change: -2.1,
      trend: 'down',
      icon: Clock,
      color: 'text-orange-600'
    },
    {
      title: 'Total Budget',
      value: formatCurrency(analytics.totalBudget),
      change: 15.3,
      trend: 'up',
      icon: DollarSign,
      color: 'text-emerald-600'
    },
    {
      title: 'Overdue Projects',
      value: analytics.overdueProjects,
      change: -18,
      trend: analytics.overdueProjects === 0 ? 'flat' : 'down',
      icon: AlertTriangle,
      color: 'text-red-600'
    }
  ];

  // Project status distribution
  const statusDistribution: ChartData[] = [
    { 
      name: 'Active', 
      value: projects.filter(p => p.status === 'active').length,
      color: 'bg-green-500'
    },
    { 
      name: 'Planning', 
      value: projects.filter(p => p.status === 'planning').length,
      color: 'bg-blue-500'
    },
    { 
      name: 'On Hold', 
      value: projects.filter(p => p.status === 'on_hold').length,
      color: 'bg-yellow-500'
    },
    { 
      name: 'Completed', 
      value: projects.filter(p => p.status === 'completed').length,
      color: 'bg-gray-500'
    },
    { 
      name: 'Cancelled', 
      value: projects.filter(p => p.status === 'cancelled').length,
      color: 'bg-red-500'
    }
  ].filter(item => item.value > 0);

  // Project type distribution
  const typeDistribution: ChartData[] = [
    { name: 'Residential', value: projects.filter(p => p.type.toLowerCase().includes('residential')).length, color: 'bg-blue-500' },
    { name: 'Commercial', value: projects.filter(p => p.type.toLowerCase().includes('commercial')).length, color: 'bg-green-500' },
    { name: 'Renovation', value: projects.filter(p => p.type.toLowerCase().includes('renovation')).length, color: 'bg-purple-500' },
    { name: 'Other', value: projects.filter(p => !p.type.toLowerCase().includes('residential') && !p.type.toLowerCase().includes('commercial') && !p.type.toLowerCase().includes('renovation')).length, color: 'bg-gray-500' }
  ].filter(item => item.value > 0);

  // Budget analysis by status
  const budgetByStatus = [
    { name: 'Active', value: projects.filter(p => p.status === 'active').reduce((sum, p) => sum + (p.budget || 0), 0), color: 'bg-green-500' },
    { name: 'Planning', value: projects.filter(p => p.status === 'planning').reduce((sum, p) => sum + (p.budget || 0), 0), color: 'bg-blue-500' },
    { name: 'Completed', value: projects.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.budget || 0), 0), color: 'bg-gray-500' }
  ].filter(item => item.value > 0);

  // Top performing projects (by progress)
  const topProjects = [...projects]
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 5);

  // Projects at risk (overdue or low progress)
  const riskProjects = projects
    .filter(p => {
      if (p.status === 'completed') return false;
      const isOverdue = p.endDate && p.endDate < new Date();
      const lowProgress = p.progress < 50 && p.status === 'active';
      return isOverdue || lowProgress;
    })
    .slice(0, 5);

  const getTrendIcon = (trend: 'up' | 'down' | 'flat') => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <ArrowDown className="h-4 w-4 text-red-500" />;
      case 'flat':
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'flat') => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      case 'flat':
        return 'text-gray-600';
    }
  };

  const ChartBar: React.FC<{ data: ChartData[]; title: string; showValues?: boolean }> = ({ 
    data, 
    title, 
    showValues = false 
  }) => {
    const maxValue = Math.max(...data.map(d => d.value));
    
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span>{item.name}</span>
                <span className="font-medium">
                  {showValues ? formatCurrency(item.value) : item.value}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className={`h-2 rounded-full ${item.color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.value / maxValue) * 100}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="w-full space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Project Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive insights into your project portfolio performance
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">Last Month</SelectItem>
              <SelectItem value="3m">Last 3 Months</SelectItem>
              <SelectItem value="6m">Last 6 Months</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg bg-gray-50 ${metric.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(metric.trend)}
                      <span className={`text-xs font-medium ${getTrendColor(metric.trend)}`}>
                        {metric.change > 0 ? '+' : ''}{metric.change}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="text-2xl font-bold">{metric.value}</div>
                    <div className="text-sm text-muted-foreground">{metric.title}</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartBar 
          data={statusDistribution}
          title="Project Status Distribution"
        />
        
        <ChartBar 
          data={typeDistribution}
          title="Project Type Distribution"
        />
        
        <ChartBar 
          data={budgetByStatus}
          title="Budget by Status"
          showValues={true}
        />
      </div>

      {/* Detailed Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Projects */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Top Performing Projects
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onProjectClick(project)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <Building className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{project.name}</div>
                    <div className="text-xs text-muted-foreground">{project.client}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-medium">{project.progress}%</div>
                    <div className="text-xs text-muted-foreground">Progress</div>
                  </div>
                  <div className="w-16">
                    <Progress value={project.progress} className="h-1.5" />
                  </div>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        {/* Projects at Risk */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Projects at Risk
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {riskProjects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500 opacity-50" />
                <div className="text-sm">All projects are on track!</div>
                <div className="text-xs mt-1">No projects require immediate attention</div>
              </div>
            ) : (
              riskProjects.map((project, index) => {
                const isOverdue = project.endDate && project.endDate < new Date();
                const risk = isOverdue ? 'Overdue' : 'Low Progress';
                
                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-lg border-l-4 border-l-orange-500 bg-orange-50 hover:bg-orange-100 cursor-pointer transition-colors"
                    onClick={() => onProjectClick(project)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                        <Building className="h-4 w-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{project.name}</div>
                        <div className="text-xs text-muted-foreground">{project.client}</div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800 border-orange-200">
                        {risk}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {project.progress}% complete
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Portfolio Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div className="p-4">
              <div className="text-2xl font-bold text-blue-600">{analytics.avgProgress.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Average Progress</div>
            </div>
            <div className="p-4">
              <div className="text-2xl font-bold text-green-600">{analytics.completionRate.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Completion Rate</div>
            </div>
            <div className="p-4">
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(analytics.totalBudget / analytics.totalProjects || 0)}</div>
              <div className="text-sm text-muted-foreground">Avg. Project Value</div>
            </div>
            <div className="p-4">
              <div className="text-2xl font-bold text-orange-600">{analytics.onTimeRate.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">On-Time Delivery</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectAnalyticsLayout;