import React, { useState, useEffect } from 'react';
import { Users, Database, Activity, AlertTriangle, FileText, Settings, Shield, TrendingUp, Server, Clock, Building2, Globe, CreditCard, MessageSquare, Bell, Zap, Eye, UserPlus, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { CompanyManagement } from './CompanyManagement';
import { UserSupport } from './UserSupport';
import { SystemMonitoring } from './SystemMonitoring';

interface Company {
  id: string;
  name: string;
  status: 'active' | 'suspended' | 'pending' | 'trial';
  plan: string;
  userCount: number;
  projectCount: number;
  createdAt: string;
  lastActive: string;
  country: string;
  businessType: string;
}

interface SystemAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
  resolved: boolean;
}

interface SystemMetric {
  name: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
}

export const AdminDashboard: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);
  const [announcementData, setAnnouncementData] = useState({
    title: '',
    message: '',
    type: 'info',
    target: 'all'
  });

  // Mock data - in production, this would come from API
  useEffect(() => {
    setCompanies([
      {
        id: '1',
        name: 'Architect Studio Malaysia',
        status: 'active',
        plan: 'Professional',
        userCount: 15,
        projectCount: 23,
        createdAt: '2024-01-15',
        lastActive: '2025-01-17',
        country: 'Malaysia',
        businessType: 'Architecture'
      },
      {
        id: '2',
        name: 'Design Hub Singapore',
        status: 'trial',
        plan: 'Basic',
        userCount: 3,
        projectCount: 5,
        createdAt: '2025-01-10',
        lastActive: '2025-01-17',
        country: 'Singapore',
        businessType: 'Interior Design'
      },
      {
        id: '3',
        name: 'Construction Pro Indonesia',
        status: 'active',
        plan: 'Enterprise',
        userCount: 45,
        projectCount: 67,
        createdAt: '2024-06-20',
        lastActive: '2025-01-17',
        country: 'Indonesia',
        businessType: 'Construction'
      }
    ]);

    setAlerts([
      {
        id: '1',
        type: 'warning',
        message: 'Storage usage approaching 80% limit',
        timestamp: '2025-01-17T10:30:00Z',
        resolved: false
      },
      {
        id: '2',
        type: 'info',
        message: 'New company registration: Design Hub Singapore',
        timestamp: '2025-01-17T09:15:00Z',
        resolved: true
      }
    ]);

    setMetrics([
      {
        name: 'Total Users',
        value: '1,247',
        change: '+12%',
        trend: 'up'
      },
      {
        name: 'Active Projects',
        value: '89',
        change: '+7',
        trend: 'up'
      },
      {
        name: 'System Uptime',
        value: '99.9%',
        change: '+0.1%',
        trend: 'up'
      },
      {
        name: 'Revenue',
        value: 'RM 45,230',
        change: '+8%',
        trend: 'up'
      }
    ]);
  }, []);

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-50 text-green-700 border-green-200',
      suspended: 'bg-red-50 text-red-700 border-red-200',
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      trial: 'bg-blue-50 text-blue-700 border-blue-200'
    };
    return variants[status as keyof typeof variants] || variants.pending;
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'info': return <CheckCircle className="h-4 w-4 text-blue-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const sendAnnouncement = async () => {
    try {
      // In production, this would call the backend API
      console.log('Sending announcement:', announcementData);
      toast.success('Announcement sent successfully to all users');
      setShowAnnouncementDialog(false);
      setAnnouncementData({ title: '', message: '', type: 'info', target: 'all' });
    } catch (error) {
      toast.error('Failed to send announcement');
    }
  };

  const resolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ));
    toast.success('Alert resolved');
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Daritana Admin Portal</h1>
          <p className="text-muted-foreground">
            Platform-wide administration and monitoring dashboard
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setShowAnnouncementDialog(true)}>
            <Bell className="h-4 w-4 mr-2" />
            Send Announcement
          </Button>
          <Button variant="outline">
            <Zap className="h-4 w-4 mr-2" />
            Emergency Mode
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companies.length}</div>
            <p className="text-xs text-muted-foreground">
              +2 new this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">
              +7 new this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.9%</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">System Overview</TabsTrigger>
          <TabsTrigger value="companies">Company Management</TabsTrigger>
          <TabsTrigger value="monitoring">System Monitoring</TabsTrigger>
          <TabsTrigger value="support">User Support</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* System Status and Recent Activities */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Current status of system components</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Server className="h-4 w-4" />
                    <span className="text-sm">Database</span>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Operational
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm">Authentication</span>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Operational
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">File Storage</span>
                  </div>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    Warning
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm">Analytics</span>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Operational
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>Latest system administrative actions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">User backup completed successfully</p>
                    <p className="text-xs text-muted-foreground">2 minutes ago</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">New company registered: Design Hub Singapore</p>
                    <p className="text-xs text-muted-foreground">15 minutes ago</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">System maintenance scheduled for tomorrow</p>
                    <p className="text-xs text-muted-foreground">1 hour ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="companies" className="space-y-4">
          <CompanyManagement />
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <SystemMonitoring />
        </TabsContent>

        <TabsContent value="support" className="space-y-4">
          <UserSupport />
        </TabsContent>
      </Tabs>

      {/* Announcement Dialog */}
      <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Send System Announcement</DialogTitle>
            <DialogDescription>
              Send a message to all users or specific groups
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={announcementData.title}
                onChange={(e) => setAnnouncementData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Announcement title"
              />
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={announcementData.message}
                onChange={(e) => setAnnouncementData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Announcement message"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={announcementData.type} onValueChange={(value) => setAnnouncementData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Information</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="target">Target</Label>
                <Select value={announcementData.target} onValueChange={(value) => setAnnouncementData(prev => ({ ...prev, target: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="admins">Admins Only</SelectItem>
                    <SelectItem value="trial">Trial Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAnnouncementDialog(false)}>
              Cancel
            </Button>
            <Button onClick={sendAnnouncement}>
              Send Announcement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};