import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Server, 
  Database, 
  HardDrive, 
  Cpu, 
  MemoryStick, 
  Network, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Play, 
  Pause, 
  Settings,
  Calendar
} from 'lucide-react';

interface SystemHealth {
  component: string;
  status: 'healthy' | 'warning' | 'error';
  usage: number;
  description: string;
  icon: React.ReactNode;
}

const systemHealth: SystemHealth[] = [
  {
    component: 'CPU Usage',
    status: 'healthy',
    usage: 23,
    description: 'Low CPU utilization',
    icon: <Cpu className="h-4 w-4" />
  },
  {
    component: 'Memory',
    status: 'warning',
    usage: 78,
    description: 'High memory usage',
    icon: <MemoryStick className="h-4 w-4" />
  },
  {
    component: 'Disk Space',
    status: 'healthy',
    usage: 45,
    description: 'Adequate storage available',
    icon: <HardDrive className="h-4 w-4" />
  },
  {
    component: 'Database',
    status: 'healthy',
    usage: 12,
    description: 'Database performing well',
    icon: <Database className="h-4 w-4" />
  },
  {
    component: 'Network',
    status: 'healthy',
    usage: 34,
    description: 'Network connectivity stable',
    icon: <Network className="h-4 w-4" />
  }
];

interface MaintenanceTask {
  id: string;
  name: string;
  description: string;
  frequency: string;
  lastRun: string;
  nextRun: string;
  status: 'completed' | 'running' | 'scheduled' | 'failed';
  duration: string;
}

const maintenanceTasks: MaintenanceTask[] = [
  {
    id: '1',
    name: 'Database Optimization',
    description: 'Optimize database tables and rebuild indexes',
    frequency: 'Weekly',
    lastRun: '2024-01-14 03:00:00',
    nextRun: '2024-01-21 03:00:00',
    status: 'completed',
    duration: '23 minutes'
  },
  {
    id: '2',
    name: 'Log Cleanup',
    description: 'Clean up old log files and system logs',
    frequency: 'Daily',
    lastRun: '2024-01-15 04:00:00',
    nextRun: '2024-01-16 04:00:00',
    status: 'completed',
    duration: '5 minutes'
  },
  {
    id: '3',
    name: 'Cache Refresh',
    description: 'Clear and rebuild application cache',
    frequency: 'Weekly',
    lastRun: '2024-01-13 02:30:00',
    nextRun: '2024-01-20 02:30:00',
    status: 'scheduled',
    duration: '12 minutes'
  },
  {
    id: '4',
    name: 'Security Scan',
    description: 'Run security vulnerability scan',
    frequency: 'Monthly',
    lastRun: '2024-01-01 01:00:00',
    nextRun: '2024-02-01 01:00:00',
    status: 'scheduled',
    duration: '45 minutes'
  }
];

export const SystemMaintenance: React.FC = () => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [runningTasks, setRunningTasks] = useState<string[]>([]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-50 text-green-700 border-green-200';
      case 'warning': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'error': return 'bg-red-50 text-red-700 border-red-200';
      case 'completed': return 'bg-green-50 text-green-700 border-green-200';
      case 'running': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'scheduled': return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'failed': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getUsageColor = (usage: number) => {
    if (usage < 50) return 'text-green-600';
    if (usage < 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const runMaintenanceTask = (taskId: string) => {
    setRunningTasks(prev => [...prev, taskId]);
    // Simulate task execution
    setTimeout(() => {
      setRunningTasks(prev => prev.filter(id => id !== taskId));
    }, 3000);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Maintenance</h1>
          <p className="text-muted-foreground">
            Monitor system health and manage maintenance tasks
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Maintenance
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule Maintenance</DialogTitle>
                <DialogDescription>
                  Schedule a maintenance window for system updates
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="maintenance-title">Maintenance Title</Label>
                  <Input id="maintenance-title" placeholder="System update and optimization" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maintenance-date">Scheduled Date & Time</Label>
                  <Input id="maintenance-date" type="datetime-local" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maintenance-duration">Expected Duration (minutes)</Label>
                  <Input id="maintenance-duration" type="number" defaultValue="60" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maintenance-description">Description</Label>
                  <Textarea id="maintenance-description" placeholder="Describe the maintenance activities..." rows={3} />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline">Cancel</Button>
                <Button>Schedule Maintenance</Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button 
            variant={isMaintenanceMode ? "destructive" : "default"}
            onClick={() => setIsMaintenanceMode(!isMaintenanceMode)}
          >
            {isMaintenanceMode ? (
              <>
                <Play className="mr-2 h-4 w-4" />
                Exit Maintenance Mode
              </>
            ) : (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Enter Maintenance Mode
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Maintenance Mode Alert */}
      {isMaintenanceMode && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800">Maintenance Mode Active</AlertTitle>
          <AlertDescription className="text-orange-700">
            The system is currently in maintenance mode. Users may experience limited functionality.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="health" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="health">System Health</TabsTrigger>
          <TabsTrigger value="tasks">Maintenance Tasks</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="space-y-6">
          {/* System Health Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {systemHealth.map((item, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{item.component}</CardTitle>
                  {item.icon}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">
                    <span className={getUsageColor(item.usage)}>{item.usage}%</span>
                  </div>
                  <Progress value={item.usage} className="mb-2" />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                    <Badge variant="outline" className={getStatusColor(item.status)}>
                      {item.status === 'healthy' && <CheckCircle className="mr-1 h-3 w-3" />}
                      {item.status === 'warning' && <AlertTriangle className="mr-1 h-3 w-3" />}
                      {item.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>Overall system health and component status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div>
                      <h4 className="font-medium text-green-800">System Overall Status</h4>
                      <p className="text-sm text-green-600">All critical systems are operational</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Healthy
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h5 className="font-medium">Services Status</h5>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Web Server</span>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Running
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Database Server</span>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Running
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Email Service</span>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Running
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-medium">Resource Usage</h5>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">CPU Load (5m avg)</span>
                        <span className="text-sm font-mono">0.23</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Memory Usage</span>
                        <span className="text-sm font-mono">3.2 GB / 8 GB</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Active Connections</span>
                        <span className="text-sm font-mono">247</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Maintenance Tasks</CardTitle>
              <CardDescription>Automated and manual maintenance operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {maintenanceTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Settings className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{task.name}</h4>
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                          <span>Frequency: {task.frequency}</span>
                          <span>Last run: {task.lastRun}</span>
                          <span>Duration: {task.duration}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="text-right mr-4">
                        <p className="text-sm font-medium">Next Run</p>
                        <p className="text-xs text-muted-foreground">{task.nextRun}</p>
                      </div>
                      
                      <Badge variant="outline" className={getStatusColor(
                        runningTasks.includes(task.id) ? 'running' : task.status
                      )}>
                        {runningTasks.includes(task.id) ? (
                          <>
                            <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                            Running
                          </>
                        ) : (
                          task.status
                        )}
                      </Badge>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => runMaintenanceTask(task.id)}
                        disabled={runningTasks.includes(task.id)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common maintenance operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Button variant="outline" className="h-auto flex-col items-center p-6 space-y-2">
                  <Database className="h-8 w-8" />
                  <span>Optimize Database</span>
                </Button>
                
                <Button variant="outline" className="h-auto flex-col items-center p-6 space-y-2">
                  <RefreshCw className="h-8 w-8" />
                  <span>Clear Cache</span>
                </Button>
                
                <Button variant="outline" className="h-auto flex-col items-center p-6 space-y-2">
                  <HardDrive className="h-8 w-8" />
                  <span>Cleanup Logs</span>
                </Button>
                
                <Button variant="outline" className="h-auto flex-col items-center p-6 space-y-2">
                  <Server className="h-8 w-8" />
                  <span>Restart Services</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">248ms</div>
                <p className="text-xs text-muted-foreground">
                  Average response time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Throughput</CardTitle>
                <Network className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,247</div>
                <p className="text-xs text-muted-foreground">
                  Requests per minute
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0.1%</div>
                <p className="text-xs text-muted-foreground">
                  Last 24 hours
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">99.9%</div>
                <p className="text-xs text-muted-foreground">
                  Last 30 days
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>System performance metrics over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                [Performance Charts Would Be Rendered Here]
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};