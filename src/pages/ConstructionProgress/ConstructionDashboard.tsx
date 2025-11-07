import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Activity, TrendingUp, AlertCircle, CheckCircle, Clock, Calendar,
  DollarSign, Users, MessageSquare, FileText, Building, Briefcase,
  Camera, Upload, Eye, ArrowUp, ArrowDown, MoreVertical, HardHat,
  Truck, Package, Shield, AlertTriangle, Thermometer, CloudRain,
  MapPin, Timer, BarChart3, Zap, Wifi, WifiOff, RefreshCw,
  ChevronRight, Phone, Mail, Navigation, Hammer, Wrench,
  Building2, Layers, Home, Factory, Milestone, Flag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, RadialBarChart, RadialBar
} from 'recharts';
import { constructionService } from '@/services/construction.service';
import { projectService } from '@/services/project.service';

interface ConstructionSite {
  id: string;
  name: string;
  location: string;
  projectId: string;
  startDate: Date;
  expectedEndDate: Date;
  currentPhase: string;
  overallProgress: number;
  status: 'active' | 'on_hold' | 'completed' | 'delayed';
  managerName: string;
  managerContact: string;
  totalWorkers: number;
  activeWorkers: number;
  weather: {
    condition: string;
    temperature: number;
    humidity: number;
    windSpeed: number;
  };
  safetyScore: number;
  lastUpdated: Date;
}

interface ProgressUpdate {
  id: string;
  timestamp: Date;
  phase: string;
  progress: number;
  description: string;
  author: string;
  mediaCount: number;
  aiVerified: boolean;
}

interface MaterialDelivery {
  id: string;
  material: string;
  quantity: number;
  unit: string;
  deliveredAt: Date;
  supplier: string;
  status: 'pending' | 'delivered' | 'inspected' | 'rejected';
}

interface WorkerActivity {
  id: string;
  name: string;
  role: string;
  checkIn: Date;
  checkOut?: Date;
  hoursWorked: number;
  productivity: number;
  safetyCompliant: boolean;
}

export function ConstructionDashboard() {
  const { siteId } = useParams();
  const [site, setSite] = useState<ConstructionSite | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [progressUpdates, setProgressUpdates] = useState<ProgressUpdate[]>([]);
  const [recentDeliveries, setRecentDeliveries] = useState<MaterialDelivery[]>([]);
  const [workerActivities, setWorkerActivities] = useState<WorkerActivity[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get a valid project ID if none provided
        let effectiveSiteId = siteId;
        if (!effectiveSiteId || effectiveSiteId === '1') {
          const firstProject = await projectService.getFirstProject();
          if (firstProject) {
            effectiveSiteId = firstProject.id;
            console.log('Using first project as construction site:', firstProject.name, effectiveSiteId);
          } else {
            console.log('No projects found in database');
            throw new Error('No projects available');
          }
        }
        
        // Fetch site data
        const siteResponse = await constructionService.getSite(effectiveSiteId);
        console.log('Site data received:', siteResponse);
        if (siteResponse?.data) {
          setSite(siteResponse.data);
        }
        
        // Fetch progress updates
        const progressResponse = await constructionService.getProgressUpdates(effectiveSiteId);
        console.log('Progress updates received:', progressResponse);
        if (progressResponse?.data) {
          setProgressUpdates(progressResponse.data);
        }
        
        // Fetch material deliveries
        const materialsResponse = await constructionService.getMaterialDeliveries(effectiveSiteId);
        console.log('Material deliveries received:', materialsResponse);
        if (materialsResponse?.data) {
          setRecentDeliveries(materialsResponse.data);
        }
        
        // Fetch worker activities
        const workersResponse = await constructionService.getWorkerActivities(effectiveSiteId);
        console.log('Worker activities received:', workersResponse);
        if (workersResponse?.data) {
          setWorkerActivities(workersResponse.data);
        }
        
        // Data loaded successfully, exit early
        setLoading(false);
        return;
      } catch (error) {
        console.error('Error fetching construction data:', error);
        // Don't use mock data - show error state instead
        toast.error('Failed to load construction data. Please check your connection.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [siteId]);

  const handleImageUpload = async (file: File) => {
    setSelectedImage(file);
    setIsAnalyzing(true);
    
    try {
      const result = await constructionService.analyzeImage(siteId || '1', file);
      if (result.success) {
        toast.success(`AI Analysis Complete: Progress verified at ${result.data.progressDetected.toFixed(1)}%`);
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast.error('Failed to analyze image');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const progressData = [
    { name: 'Week 1', planned: 38, actual: 35 },
    { name: 'Week 2', planned: 40, actual: 38 },
    { name: 'Week 3', planned: 42, actual: 40 },
    { name: 'Week 4', planned: 44, actual: 42 },
    { name: 'Current', planned: 46, actual: 42 }
  ];

  const phaseData = [
    { name: 'Foundation', value: 100, fill: '#10b981' },
    { name: 'Structure', value: 42, fill: '#3b82f6' },
    { name: 'MEP', value: 28, fill: '#f59e0b' },
    { name: 'Finishing', value: 5, fill: '#8b5cf6' }
  ];

  const workerData = [
    { category: 'Present', value: 142, fill: '#10b981' },
    { category: 'Absent', value: 14, fill: '#ef4444' }
  ];

  const toolbar = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-900">Construction Progress Monitor</h2>
        <Badge variant={site?.status === 'active' ? 'default' : 'secondary'}>
          {site?.status || 'Loading'}
        </Badge>
        <Badge variant="outline" className="text-xs">
          <Wifi className="h-3 w-3 mr-1" />
          Live
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          <Camera className="h-4 w-4 mr-2" />
          Capture Progress
        </Button>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Upload Photos
        </Button>
        <Button size="sm">
          <FileText className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Layout toolbar={toolbar}>
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </Layout>
    );
  }

  // Show empty state if no site data
  if (!site) {
    return (
      <Layout toolbar={toolbar}>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <AlertCircle className="h-12 w-12 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">No Construction Data Available</h3>
          <p className="text-sm text-gray-600">Unable to load construction site information.</p>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout toolbar={toolbar}>
      <div className="p-6 space-y-6">
        {/* Site Header */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-lg">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{site?.name}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {site?.location}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Started {site?.startDate && format(site.startDate, 'MMM d, yyyy')}
                </span>
                <span className="flex items-center gap-1">
                  <Flag className="h-4 w-4" />
                  Target {site?.expectedEndDate && format(site.expectedEndDate, 'MMM d, yyyy')}
                </span>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-2xl font-bold text-blue-600">{site?.overallProgress}%</span>
                </div>
                <Progress value={site?.overallProgress} className="h-3" />
                <p className="text-xs text-gray-500 mt-1">
                  Current Phase: <span className="font-medium">{site?.currentPhase}</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Site Manager</p>
              <p className="font-medium">{site?.managerName}</p>
              <p className="text-sm text-gray-500">{site?.managerContact}</p>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Active Workers</p>
                  <p className="text-2xl font-bold">{site?.activeWorkers}</p>
                  <p className="text-xs text-gray-500">of {site?.totalWorkers} total</p>
                </div>
                <HardHat className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Safety Score</p>
                  <p className="text-2xl font-bold text-green-600">{site?.safetyScore}%</p>
                  <p className="text-xs text-gray-500">Excellent</p>
                </div>
                <Shield className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Weather</p>
                  <p className="text-lg font-bold">{site?.weather.temperature}°C</p>
                  <p className="text-xs text-gray-500">{site?.weather.condition}</p>
                </div>
                <CloudRain className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Materials Today</p>
                  <p className="text-2xl font-bold">170</p>
                  <p className="text-xs text-gray-500">tons delivered</p>
                </div>
                <Truck className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Equipment</p>
                  <p className="text-2xl font-bold">28/32</p>
                  <p className="text-xs text-gray-500">operational</p>
                </div>
                <Wrench className="h-8 w-8 text-indigo-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Productivity</p>
                  <p className="text-2xl font-bold">92%</p>
                  <p className="text-xs text-green-600 flex items-center">
                    <ArrowUp className="h-3 w-3" />
                    +5% today
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="workers">Workers</TabsTrigger>
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="safety">Safety</TabsTrigger>
            <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Progress Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Progress: Planned vs Actual</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={progressData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="planned" 
                        stroke="#94a3b8" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="actual" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Phase Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Phase Completion</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="90%" data={phaseData}>
                      <RadialBar dataKey="value" cornerRadius={10} fill="#3b82f6" />
                      <Tooltip />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {phaseData.map((phase) => (
                      <div key={phase.name} className="flex items-center gap-2">
                        <div className={cn("h-3 w-3 rounded-full")} style={{ backgroundColor: phase.fill }} />
                        <span className="text-xs">{phase.name}: {phase.value}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Updates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Progress Updates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {progressUpdates.map((update) => (
                  <div key={update.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={cn(
                      "p-2 rounded-lg",
                      update.aiVerified ? "bg-green-100" : "bg-gray-100"
                    )}>
                      {update.aiVerified ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{update.phase}</p>
                          <p className="text-sm text-gray-600 mt-1">{update.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>{update.author}</span>
                            <span>{formatDistanceToNow(update.timestamp, { addSuffix: true })}</span>
                            {update.mediaCount > 0 && (
                              <span className="flex items-center gap-1">
                                <Camera className="h-3 w-3" />
                                {update.mediaCount} photos
                              </span>
                            )}
                            {update.aiVerified && (
                              <Badge variant="outline" className="text-xs">
                                AI Verified
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">{update.progress}%</p>
                          <p className="text-xs text-gray-500">Progress</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Activity Feed */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Live Activity Feed</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="font-medium">Concrete Truck #3</span>
                  <span className="text-gray-600">arrived at site</span>
                  <span className="text-xs text-gray-500 ml-auto">2 min ago</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-2 w-2 bg-blue-500 rounded-full" />
                  <span className="font-medium">Tower Crane A</span>
                  <span className="text-gray-600">lifting steel beams to Floor 16</span>
                  <span className="text-xs text-gray-500 ml-auto">5 min ago</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-2 w-2 bg-orange-500 rounded-full" />
                  <span className="font-medium">Safety Inspector</span>
                  <span className="text-gray-600">completed Zone B inspection</span>
                  <span className="text-xs text-gray-500 ml-auto">15 min ago</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="mt-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Detailed Progress Tracking</h3>
                  <p className="text-gray-600">Phase-by-phase progress analysis coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workers" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Worker Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {workerActivities.map((worker) => (
                    <div key={worker.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{worker.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{worker.name}</p>
                          <p className="text-xs text-gray-600">{worker.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm font-medium">{worker.hoursWorked}h</p>
                          <p className="text-xs text-gray-500">Today</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{worker.productivity}%</p>
                          <p className="text-xs text-gray-500">Productivity</p>
                        </div>
                        {worker.safetyCompliant ? (
                          <Badge variant="outline" className="text-xs bg-green-50">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Compliant
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs bg-red-50">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Review
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="materials" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Material Deliveries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentDeliveries.map((delivery) => (
                    <div key={delivery.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          delivery.status === 'delivered' ? "bg-blue-100" :
                          delivery.status === 'inspected' ? "bg-green-100" :
                          delivery.status === 'rejected' ? "bg-red-100" :
                          "bg-gray-100"
                        )}>
                          <Package className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{delivery.material}</p>
                          <p className="text-xs text-gray-600">{delivery.supplier}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">{delivery.quantity} {delivery.unit}</p>
                          <p className="text-xs text-gray-500">
                            {formatDistanceToNow(delivery.deliveredAt, { addSuffix: true })}
                          </p>
                        </div>
                        <Badge variant={
                          delivery.status === 'delivered' ? 'default' :
                          delivery.status === 'inspected' ? 'outline' :
                          delivery.status === 'rejected' ? 'destructive' :
                          'secondary'
                        }>
                          {delivery.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="safety" className="mt-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Safety & Compliance</h3>
                  <p className="text-gray-600">Safety metrics and incident tracking</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-insights" className="mt-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">AI-Powered Insights</h3>
                  <p className="text-gray-600">Predictive analytics and recommendations</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}