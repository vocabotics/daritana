import React, { useState, useMemo } from 'react';
import { 
  BarChart3, PieChart, LineChart, Table, FileText, Calendar, 
  Download, Share, Settings, Filter, Search, Plus, Play,
  TrendingUp, Users, Clock, DollarSign, AlertTriangle, Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import {
  LineChart as ReLineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart as RePieChart, Pie, Cell,
  AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { cn } from '@/lib/utils';
import type { Report, Dashboard } from '@/types/enterprise-pm';

interface AdvancedReportingProps {
  onRunReport?: (reportId: string) => void;
  onExportReport?: (reportId: string, format: 'pdf' | 'excel' | 'csv') => void;
}

const reportTemplates = [
  {
    id: 'project-status',
    name: 'Project Status Report',
    description: 'Complete project health and progress overview',
    category: 'project',
    icon: BarChart3,
    color: 'blue',
    featured: true
  },
  {
    id: 'resource-utilization',
    name: 'Resource Utilization',
    description: 'Team capacity and allocation analysis',
    category: 'resource',
    icon: Users,
    color: 'green',
    featured: true
  },
  {
    id: 'financial-dashboard',
    name: 'Financial Performance',
    description: 'Budget vs actual and cost analysis',
    category: 'financial',
    icon: DollarSign,
    color: 'purple',
    featured: true
  },
  {
    id: 'risk-assessment',
    name: 'Risk Assessment Report',
    description: 'Risk identification and mitigation status',
    category: 'risk',
    icon: AlertTriangle,
    color: 'orange',
    featured: false
  },
  {
    id: 'milestone-tracker',
    name: 'Milestone Tracker',
    description: 'Key deliverables and timeline tracking',
    category: 'project',
    icon: Target,
    color: 'red',
    featured: false
  },
  {
    id: 'team-performance',
    name: 'Team Performance',
    description: 'Individual and team productivity metrics',
    category: 'resource',
    icon: TrendingUp,
    color: 'indigo',
    featured: false
  },
  {
    id: 'time-tracking',
    name: 'Time Tracking Summary',
    description: 'Hours logged and time allocation analysis',
    category: 'resource',
    icon: Clock,
    color: 'cyan',
    featured: false
  },
  {
    id: 'earned-value',
    name: 'Earned Value Management',
    description: 'EVM metrics and performance indices',
    category: 'financial',
    icon: LineChart,
    color: 'emerald',
    featured: true
  }
];

const mockReportData = {
  projectProgress: [
    { month: 'Jan', planned: 10, actual: 8 },
    { month: 'Feb', planned: 25, actual: 22 },
    { month: 'Mar', planned: 40, actual: 35 },
    { month: 'Apr', planned: 55, actual: 48 },
    { month: 'May', planned: 70, actual: 65 },
    { month: 'Jun', planned: 85, actual: 75 },
  ],
  
  resourceUtilization: [
    { name: 'Ahmad Ibrahim', utilization: 85, capacity: 100, efficiency: 92 },
    { name: 'Sarah Tan', utilization: 78, capacity: 100, efficiency: 88 },
    { name: 'Raj Kumar', utilization: 92, capacity: 100, efficiency: 95 },
    { name: 'Construction Team', utilization: 65, capacity: 400, efficiency: 82 },
  ],
  
  financialData: [
    { category: 'Design', budgeted: 500000, spent: 425000, remaining: 75000 },
    { category: 'Permits', budgeted: 200000, spent: 185000, remaining: 15000 },
    { category: 'Construction', budgeted: 4300000, spent: 3200000, remaining: 1100000 },
    { category: 'Management', budgeted: 300000, spent: 180000, remaining: 120000 },
  ],
  
  riskMatrix: [
    { name: 'Weather Delays', probability: 70, impact: 60, score: 4200 },
    { name: 'Material Shortage', probability: 40, impact: 80, score: 3200 },
    { name: 'Permit Delays', probability: 30, impact: 70, score: 2100 },
    { name: 'Budget Overrun', probability: 50, impact: 90, score: 4500 },
  ],
  
  evmMetrics: [
    { date: 'Jan', pv: 1000000, ev: 950000, ac: 980000 },
    { date: 'Feb', pv: 2200000, ev: 2100000, ac: 2150000 },
    { date: 'Mar', pv: 3500000, ev: 3300000, ac: 3420000 },
    { date: 'Apr', pv: 4800000, ev: 4600000, ac: 4750000 },
    { date: 'May', pv: 6000000, ev: 5800000, ac: 6100000 },
  ]
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const AdvancedReporting: React.FC<AdvancedReportingProps> = ({
  onRunReport,
  onExportReport
}) => {
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);

  const filteredTemplates = useMemo(() => {
    return reportTemplates.filter(template => {
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           template.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const renderReportTemplate = (template: any) => (
    <Card 
      key={template.id}
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        selectedReport === template.id && "ring-2 ring-blue-500",
        template.featured && "border-2 border-blue-200"
      )}
      onClick={() => setSelectedReport(template.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              `bg-${template.color}-100`
            )}>
              <template.icon className={cn("w-5 h-5", `text-${template.color}-600`)} />
            </div>
            <div>
              <CardTitle className="text-base">{template.name}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">{template.description}</p>
            </div>
          </div>
          {template.featured && (
            <Badge variant="default" className="bg-blue-500">Featured</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="capitalize">
            {template.category}
          </Badge>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={(e) => {
              e.stopPropagation();
              onRunReport?.(template.id);
            }}>
              <Play className="w-3 h-3 mr-1" />
              Run
            </Button>
            <Button size="sm" onClick={(e) => {
              e.stopPropagation();
              onExportReport?.(template.id, 'pdf');
            }}>
              <Download className="w-3 h-3 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderDashboards = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Project Progress Tracking</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ReLineChart data={mockReportData.projectProgress}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="planned" stroke="#3b82f6" name="Planned %" />
                <Line type="monotone" dataKey="actual" stroke="#10b981" name="Actual %" />
              </ReLineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RePieChart>
                <Pie
                  data={mockReportData.financialData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="budgeted"
                  label={(entry) => entry.category}
                >
                  {mockReportData.financialData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Budget']} />
              </RePieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resource Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockReportData.resourceUtilization}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="utilization" fill="#3b82f6" name="Utilization %" />
                <Bar dataKey="efficiency" fill="#10b981" name="Efficiency %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Earned Value Management</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={mockReportData.evmMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, '']} />
                <Legend />
                <Area type="monotone" dataKey="pv" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Planned Value" />
                <Area type="monotone" dataKey="ev" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Earned Value" />
                <Area type="monotone" dataKey="ac" stackId="3" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} name="Actual Cost" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">SPI (Schedule)</p>
                <p className="text-2xl font-bold text-orange-600">0.92</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">CPI (Cost)</p>
                <p className="text-2xl font-bold text-red-600">0.88</p>
              </div>
              <DollarSign className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">EAC</p>
                <p className="text-2xl font-bold">$6.8M</p>
              </div>
              <Target className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">VAC</p>
                <p className="text-2xl font-bold text-green-600">-$0.3M</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderCustomBuilder = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Custom Report Builder</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Data Sources</label>
                <div className="space-y-2">
                  {[
                    { name: 'Projects', checked: true },
                    { name: 'Tasks', checked: true },
                    { name: 'Resources', checked: false },
                    { name: 'Financial', checked: false },
                    { name: 'Time Tracking', checked: false }
                  ].map(source => (
                    <label key={source.name} className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked={source.checked} className="rounded" />
                      <span className="text-sm">{source.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Chart Types</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: BarChart3, name: 'Bar Chart' },
                    { icon: LineChart, name: 'Line Chart' },
                    { icon: PieChart, name: 'Pie Chart' },
                    { icon: Table, name: 'Table' }
                  ].map(chart => (
                    <Button key={chart.name} variant="outline" className="justify-start gap-2">
                      <chart.icon className="w-4 h-4" />
                      {chart.name}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Filters</label>
                <div className="space-y-3">
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Date Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="last-30">Last 30 days</SelectItem>
                      <SelectItem value="last-90">Last 90 days</SelectItem>
                      <SelectItem value="ytd">Year to date</SelectItem>
                      <SelectItem value="custom">Custom range</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Project Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Projects</SelectItem>
                      <SelectItem value="active">Active Only</SelectItem>
                      <SelectItem value="completed">Completed Only</SelectItem>
                      <SelectItem value="on-hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Team Members" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Members</SelectItem>
                      <SelectItem value="ahmad">Ahmad Ibrahim</SelectItem>
                      <SelectItem value="sarah">Sarah Tan</SelectItem>
                      <SelectItem value="raj">Raj Kumar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Export Options</label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">PDF</Button>
                  <Button variant="outline" size="sm">Excel</Button>
                  <Button variant="outline" size="sm">PowerPoint</Button>
                  <Button variant="outline" size="sm">CSV</Button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
            <Button variant="outline">Preview</Button>
            <Button>Generate Report</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Advanced Reporting & Analytics</h2>
          <div className="flex items-center gap-2">
            <Dialog open={showCustomBuilder} onOpenChange={setShowCustomBuilder}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Custom Report
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Custom Report Builder</DialogTitle>
                  <DialogDescription>
                    Create custom reports with drag-and-drop functionality
                  </DialogDescription>
                </DialogHeader>
                {renderCustomBuilder()}
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" size="sm">
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="project">Project Reports</SelectItem>
              <SelectItem value="resource">Resource Reports</SelectItem>
              <SelectItem value="financial">Financial Reports</SelectItem>
              <SelectItem value="risk">Risk Reports</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Advanced Filters
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mx-4 mt-4">
            <TabsTrigger value="templates">Report Templates</TabsTrigger>
            <TabsTrigger value="dashboards">Live Dashboards</TabsTrigger>
            <TabsTrigger value="custom">Custom Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map(renderReportTemplate)}
            </div>
          </TabsContent>

          <TabsContent value="dashboards" className="p-4">
            {renderDashboards()}
          </TabsContent>

          <TabsContent value="custom" className="p-4">
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Custom Reports Yet</h3>
              <p className="text-gray-500 mb-4">Create your first custom report to get started</p>
              <Button onClick={() => setShowCustomBuilder(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Custom Report
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};