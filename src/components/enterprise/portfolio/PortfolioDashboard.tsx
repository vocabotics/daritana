import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, Calendar, AlertTriangle, 
  Target, Activity, PieChart, BarChart3, ArrowUpRight, ArrowDownRight,
  CheckCircle2, Clock, XCircle, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, Line, BarChart, Bar, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Treemap, Area, AreaChart
} from 'recharts';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  health: 'green' | 'yellow' | 'red';
  budget: number;
  spent: number;
  progress: number;
  startDate: Date;
  endDate: Date;
  roi: number;
  npv: number;
  irr: number;
  riskScore: number;
  strategicAlignment: number;
  teamSize: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

interface PortfolioDashboardProps {
  projects: Project[];
  totalBudget: number;
  strategicGoals: Array<{ name: string; weight: number; score: number }>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const PortfolioDashboard: React.FC<PortfolioDashboardProps> = ({
  projects = [],
  totalBudget = 0,
  strategicGoals = []
}) => {
  const [selectedView, setSelectedView] = useState<'overview' | 'financial' | 'risk' | 'strategic'>('overview');
  const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year'>('quarter');

  // Calculate portfolio metrics
  const portfolioMetrics = useMemo(() => {
    if (!projects || projects.length === 0) {
      return {
        totalSpent: 0,
        remainingBudget: totalBudget,
        budgetUtilization: 0,
        avgProgress: 0,
        totalROI: 0,
        totalNPV: 0,
        avgIRR: 0,
        avgRisk: 0,
        statusCounts: {
          planning: 0,
          active: 0,
          onHold: 0,
          completed: 0,
          cancelled: 0
        },
        healthCounts: {
          green: 0,
          yellow: 0,
          red: 0
        },
        totalProjects: 0,
        totalTeamMembers: 0
      };
    }
    
    const totalSpent = projects.reduce((sum, p) => sum + (p.spent || 0), 0);
    const avgProgress = projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length;
    const totalROI = totalBudget > 0 ? projects.reduce((sum, p) => sum + ((p.roi || 0) * (p.budget || 0)), 0) / totalBudget : 0;
    const totalNPV = projects.reduce((sum, p) => sum + (p.npv || 0), 0);
    const avgIRR = projects.reduce((sum, p) => sum + (p.irr || 0), 0) / projects.length;
    const avgRisk = projects.reduce((sum, p) => sum + (p.riskScore || 0), 0) / projects.length;
    
    const statusCounts = {
      planning: projects.filter(p => p.status === 'planning').length,
      active: projects.filter(p => p.status === 'active').length,
      onHold: projects.filter(p => p.status === 'on-hold').length,
      completed: projects.filter(p => p.status === 'completed').length,
      cancelled: projects.filter(p => p.status === 'cancelled').length
    };
    
    const healthCounts = {
      green: projects.filter(p => p.health === 'green').length,
      yellow: projects.filter(p => p.health === 'yellow').length,
      red: projects.filter(p => p.health === 'red').length
    };
    
    return {
      totalSpent,
      remainingBudget: totalBudget - totalSpent,
      budgetUtilization: (totalSpent / totalBudget) * 100,
      avgProgress,
      totalROI,
      totalNPV,
      avgIRR,
      avgRisk,
      statusCounts,
      healthCounts,
      totalProjects: projects.length,
      totalTeamMembers: projects.reduce((sum, p) => sum + p.teamSize, 0)
    };
  }, [projects, totalBudget]);

  // Prepare chart data
  const budgetAllocationData = projects.map(p => ({
    name: p.name,
    value: p.budget,
    spent: p.spent
  }));

  const riskVsValueData = projects.map(p => ({
    name: p.name,
    x: p.riskScore,
    y: p.roi,
    z: p.budget / 1000000, // Size in millions
    priority: p.priority
  }));

  const strategicAlignmentData = (strategicGoals || []).map(goal => ({
    subject: goal.name,
    score: goal.score,
    weight: goal.weight * 100,
    fullMark: 100
  }));

  const timelineData = projects.map(p => ({
    name: p.name,
    start: p.startDate instanceof Date ? p.startDate.getTime() : new Date(p.startDate).getTime(),
    end: p.endDate instanceof Date ? p.endDate.getTime() : new Date(p.endDate).getTime(),
    progress: p.progress || 0,
    health: p.health || 'green'
  }));

  // Render KPI Card
  const renderKPICard = (
    title: string, 
    value: string | number, 
    change?: number, 
    icon: React.ReactNode,
    color: string = 'blue'
  ) => (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            `bg-${color}-100`
          )}>
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <p className="text-2xl font-bold">{value}</p>
          {change !== undefined && (
            <div className={cn(
              "flex items-center text-sm",
              change >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Render Overview Tab
  const renderOverview = () => (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {renderKPICard(
          "Portfolio Value",
          `$${(portfolioMetrics.totalNPV / 1000000).toFixed(1)}M`,
          12.5,
          <DollarSign className="w-4 h-4 text-blue-600" />,
          'blue'
        )}
        {renderKPICard(
          "ROI",
          `${(portfolioMetrics.totalROI * 100).toFixed(1)}%`,
          8.3,
          <TrendingUp className="w-4 h-4 text-green-600" />,
          'green'
        )}
        {renderKPICard(
          "Avg Progress",
          `${portfolioMetrics.avgProgress.toFixed(0)}%`,
          5.2,
          <Activity className="w-4 h-4 text-purple-600" />,
          'purple'
        )}
        {renderKPICard(
          "Risk Score",
          portfolioMetrics.avgRisk.toFixed(1),
          -3.1,
          <AlertTriangle className="w-4 h-4 text-orange-600" />,
          'orange'
        )}
      </div>

      {/* Portfolio Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Portfolio Health Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm">Healthy</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{portfolioMetrics.healthCounts.green}</span>
                  <Progress 
                    value={(portfolioMetrics.healthCounts.green / portfolioMetrics.totalProjects) * 100} 
                    className="w-32 h-2"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-sm">At Risk</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{portfolioMetrics.healthCounts.yellow}</span>
                  <Progress 
                    value={(portfolioMetrics.healthCounts.yellow / portfolioMetrics.totalProjects) * 100} 
                    className="w-32 h-2"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm">Critical</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{portfolioMetrics.healthCounts.red}</span>
                  <Progress 
                    value={(portfolioMetrics.healthCounts.red / portfolioMetrics.totalProjects) * 100} 
                    className="w-32 h-2"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <RePieChart>
                <Pie
                  data={[
                    { name: 'Active', value: portfolioMetrics.statusCounts.active },
                    { name: 'Planning', value: portfolioMetrics.statusCounts.planning },
                    { name: 'On Hold', value: portfolioMetrics.statusCounts.onHold },
                    { name: 'Completed', value: portfolioMetrics.statusCounts.completed }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Projects */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Top Projects by Strategic Value</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                console.log('Viewing all projects...');
                // TODO: Navigate to detailed projects view
                alert('View All Projects feature coming soon!');
              }}
            >
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...projects]
              .sort((a, b) => (b.roi * b.strategicAlignment) - (a.roi * a.strategicAlignment))
              .slice(0, 5)
              .map(project => (
                <div key={project.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-2 h-12 rounded",
                      project.health === 'green' && "bg-green-500",
                      project.health === 'yellow' && "bg-yellow-500",
                      project.health === 'red' && "bg-red-500"
                    )} />
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>ROI: {(project.roi * 100).toFixed(0)}%</span>
                        <span>Risk: {project.riskScore.toFixed(1)}</span>
                        <span>Progress: {project.progress}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      project.priority === 'critical' ? 'destructive' :
                      project.priority === 'high' ? 'default' :
                      'secondary'
                    }>
                      {project.priority}
                    </Badge>
                    <Progress value={project.progress} className="w-24 h-2" />
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render Financial Tab
  const renderFinancial = () => (
    <div className="space-y-6">
      {/* Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${(totalBudget / 1000000).toFixed(1)}M</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">
              ${(portfolioMetrics.totalSpent / 1000000).toFixed(1)}M
            </p>
            <Progress value={portfolioMetrics.budgetUtilization} className="mt-2 h-1" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">NPV</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              ${(portfolioMetrics.totalNPV / 1000000).toFixed(1)}M
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg IRR</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{(portfolioMetrics.avgIRR * 100).toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Allocation Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Allocation by Project</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <Treemap
              data={budgetAllocationData}
              dataKey="value"
              aspectRatio={4 / 3}
              stroke="#fff"
              fill="#3b82f6"
            >
              <Tooltip 
                content={({ payload }) => {
                  if (payload && payload[0]) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-2 border rounded shadow">
                        <p className="font-medium">{data.name}</p>
                        <p className="text-sm">Budget: ${(data.value / 1000000).toFixed(1)}M</p>
                        <p className="text-sm">Spent: ${(data.spent / 1000000).toFixed(1)}M</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </Treemap>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ROI Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>ROI Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[...projects].sort((a, b) => b.roi - a.roi)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="roi" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );

  // Render Risk Tab
  const renderRisk = () => (
    <div className="space-y-6">
      {/* Risk Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Risk vs Value Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative h-96 border-2 border-gray-200 rounded">
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
              <div className="bg-green-50 flex items-center justify-center text-sm text-gray-600">
                Low Risk / High Value
              </div>
              <div className="bg-yellow-50 flex items-center justify-center text-sm text-gray-600">
                High Risk / High Value
              </div>
              <div className="bg-yellow-50 flex items-center justify-center text-sm text-gray-600">
                Low Risk / Low Value
              </div>
              <div className="bg-red-50 flex items-center justify-center text-sm text-gray-600">
                High Risk / Low Value
              </div>
            </div>
            {riskVsValueData.map(project => (
              <div
                key={project.name}
                className={cn(
                  "absolute w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold",
                  project.priority === 'critical' && "bg-red-500",
                  project.priority === 'high' && "bg-orange-500",
                  project.priority === 'medium' && "bg-yellow-500",
                  project.priority === 'low' && "bg-green-500"
                )}
                style={{
                  left: `${(project.x / 10) * 100}%`,
                  bottom: `${(project.y * 100)}%`,
                  transform: `scale(${0.5 + project.z / 10})`
                }}
                title={project.name}
              >
                {project.name.charAt(0)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Risk Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>High Risk Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...projects]
                .filter(p => p.riskScore > 7)
                .sort((a, b) => b.riskScore - a.riskScore)
                .map(project => (
                  <div key={project.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <p className="text-sm text-gray-500">
                        Budget: ${(project.budget / 1000000).toFixed(1)}M
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">
                        Risk: {project.riskScore.toFixed(1)}
                      </Badge>
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Mitigation Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded bg-yellow-50">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm">5 projects need risk review</span>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    console.log('Reviewing risk projects...');
                    alert('Risk Review functionality coming soon!');
                  }}
                >
                  Review
                </Button>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-red-50">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm">2 projects exceed risk threshold</span>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    console.log('Taking action on high-risk projects...');
                    alert('Risk Action functionality coming soon!');
                  }}
                >
                  Action
                </Button>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-blue-50">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">3 mitigation plans pending</span>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    console.log('Viewing mitigation plans...');
                    alert('Mitigation Plans view coming soon!');
                  }}
                >
                  View
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Render Strategic Tab
  const renderStrategic = () => (
    <div className="space-y-6">
      {/* Strategic Alignment Radar */}
      <Card>
        <CardHeader>
          <CardTitle>Strategic Goal Alignment</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={strategicAlignmentData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar name="Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              <Radar name="Weight" dataKey="weight" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Strategic Initiatives */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {strategicGoals.map((goal, index) => (
          <Card key={goal.name}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{goal.name}</CardTitle>
                <Badge>{(goal.weight * 100).toFixed(0)}% Weight</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Alignment Score</span>
                    <span className="font-medium">{goal.score}%</span>
                  </div>
                  <Progress value={goal.score} className="h-2" />
                </div>
                <div className="text-sm text-gray-500">
                  {projects.filter(p => p.strategicAlignment > 0.7).length} projects aligned
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-full bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">Portfolio Dashboard</h1>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setTimeRange(timeRange === 'month' ? 'quarter' : timeRange === 'quarter' ? 'year' : 'month')}
            >
              <Calendar className="w-4 h-4 mr-2" />
              {timeRange === 'month' ? 'Monthly' : timeRange === 'quarter' ? 'Quarterly' : 'Yearly'}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                console.log('Exporting portfolio data...');
                // TODO: Implement export functionality
                alert('Export feature coming soon!');
              }}
            >
              Export
            </Button>
            <Button
              onClick={() => {
                console.log('Adding new project...');
                // TODO: Implement add project functionality
                alert('Add Project feature coming soon!');
              }}
            >
              Add Project
            </Button>
          </div>
        </div>
        <p className="text-gray-500">
          Managing {portfolioMetrics.totalProjects} projects with {portfolioMetrics.totalTeamMembers} team members
        </p>
      </div>

      {/* Main Content */}
      <Tabs value={selectedView} onValueChange={(v) => setSelectedView(v as any)}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="risk">Risk</TabsTrigger>
          <TabsTrigger value="strategic">Strategic</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">{renderOverview()}</TabsContent>
        <TabsContent value="financial">{renderFinancial()}</TabsContent>
        <TabsContent value="risk">{renderRisk()}</TabsContent>
        <TabsContent value="strategic">{renderStrategic()}</TabsContent>
      </Tabs>
    </div>
  );
};