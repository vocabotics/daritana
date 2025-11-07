import React, { useState, useEffect } from 'react';
import { Server, Database, Shield, Activity, AlertTriangle, CheckCircle, Clock, TrendingUp, TrendingDown, Cpu, HardDrive, Network, Users, Zap, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  trend: 'up' | 'down' | 'stable';
  change: number;
  threshold: {
    warning: number;
    critical: number;
  };
}

interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  component: string;
  message: string;
  timestamp: string;
  resolved: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface PerformanceMetric {
  name: string;
  current: number;
  average: number;
  peak: number;
  unit: string;
}

export const SystemMonitoring: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [performance, setPerformance] = useState<PerformanceMetric[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Mock data - in production, this would come from real-time monitoring APIs
  useEffect(() => {
    const mockMetrics: SystemMetric[] = [
      {
        name: 'CPU Usage',
        value: 45,
        unit: '%',
        status: 'healthy',
        trend: 'stable',
        change: 2,
        threshold: { warning: 70, critical: 90 }
      },
      {
        name: 'Memory Usage',
        value: 68,
        unit: '%',
        status: 'warning',
        trend: 'up',
        change: 5,
        threshold: { warning: 70, critical: 90 }
      },
      {
        name: 'Disk Usage',
        value: 82,
        unit: '%',
        status: 'warning',
        trend: 'up',
        change: 3,
        threshold: { warning: 80, critical: 95 }
      },
      {
        name: 'Network I/O',
        value: 23,
        unit: 'MB/s',
        status: 'healthy',
        trend: 'down',
        change: -8,
        threshold: { warning: 50, critical: 100 }
      },
      {
        name: 'Database Connections',
        value: 156,
        unit: 'connections',
        status: 'healthy',
        trend: 'stable',
        change: 0,
        threshold: { warning: 200, critical: 300 }
      },
      {
        name: 'Active Users',
        value: 1247,
        unit: 'users',
        status: 'healthy',
        trend: 'up',
        change: 12,
        threshold: { warning: 2000, critical: 3000 }
      }
    ];

    const mockAlerts: SystemAlert[] = [
      {
        id: '1',
        type: 'warning',
        component: 'Storage',
        message: 'Disk usage approaching 80% threshold',
        timestamp: '2025-01-17T16:30:00Z',
        resolved: false,
        severity: 'medium'
      },
      {
        id: '2',
        type: 'warning',
        component: 'Memory',
        message: 'Memory usage above 65% for extended period',
        timestamp: '2025-01-17T16:15:00Z',
        resolved: false,
        severity: 'medium'
      },
      {
        id: '3',
        type: 'info',
        component: 'Database',
        message: 'Scheduled maintenance completed successfully',
        timestamp: '2025-01-17T15:45:00Z',
        resolved: true,
        severity: 'low'
      }
    ];

    const mockPerformance: PerformanceMetric[] = [
      {
        name: 'Response Time',
        current: 245,
        average: 180,
        peak: 450,
        unit: 'ms'
      },
      {
        name: 'Throughput',
        current: 1250,
        average: 1100,
        peak: 1800,
        unit: 'req/s'
      },
      {
        name: 'Error Rate',
        current: 0.8,
        average: 0.5,
        peak: 2.1,
        unit: '%'
      },
      {
        name: 'Uptime',
        current: 99.97,
        average: 99.95,
        peak: 100,
        unit: '%'
      }
    ];

    setMetrics(mockMetrics);
    setAlerts(mockAlerts);
    setPerformance(mockPerformance);
  }, []);

  const getStatusBadge = (status: string) => {
    const variants = {
      healthy: 'bg-green-50 text-green-700 border-green-200',
      warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      critical: 'bg-red-50 text-red-700 border-red-200',
      offline: 'bg-gray-50 text-gray-700 border-gray-200'
    };
    return variants[status as keyof typeof variants] || variants.healthy;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'offline': return <Server className="h-4 w-4 text-gray-600" />;
      default: return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'stable': return <Activity className="h-4 w-4 text-blue-600" />;
      default: return <Activity className="h-4 w-4 text-blue-600" />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'info': return <CheckCircle className="h-4 w-4 text-blue-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      low: 'bg-gray-50 text-gray-700 border-gray-200',
      medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      high: 'bg-orange-50 text-orange-700 border-orange-200',
      critical: 'bg-red-50 text-red-700 border-red-200'
    };
    return variants[severity as keyof typeof variants] || variants.low;
  };

  const refreshMetrics = async () => {
    setIsRefreshing(true);
    try {
      // In production, this would call real monitoring APIs
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLastUpdate(new Date());
      toast.success('System metrics refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh metrics');
    } finally {
      setIsRefreshing(false);
    }
  };

  const resolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ));
    toast.success('Alert resolved successfully');
  };

  const getProgressColor = (value: number, warning: number, critical: number) => {
    if (value >= critical) return 'bg-red-500';
    if (value >= warning) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time system health and performance monitoring
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </span>
          <Button variant="outline" onClick={refreshMetrics} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
              <div className="flex items-center space-x-2">
                {getStatusIcon(metric.status)}
                {getTrendIcon(metric.trend)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metric.value}{metric.unit}
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">
                  {metric.change > 0 ? '+' : ''}{metric.change}{metric.unit} from last check
                </p>
                <Badge variant="outline" className={getStatusBadge(metric.status)}>
                  {metric.status}
                </Badge>
              </div>
              <div className="mt-3">
                <Progress 
                  value={metric.value} 
                  className="h-2"
                  style={{
                    '--progress-color': getProgressColor(metric.value, metric.threshold.warning, metric.threshold.critical)
                  } as React.CSSProperties}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0{metric.unit}</span>
                  <span>{metric.threshold.warning}{metric.unit}</span>
                  <span>{metric.threshold.critical}{metric.unit}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {performance.map((metric) => (
              <div key={metric.name} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{metric.name}</p>
                  <p className="text-xs text-gray-500">
                    Avg: {metric.average}{metric.unit} | Peak: {metric.peak}{metric.unit}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{metric.current}{metric.unit}</p>
                  <p className={`text-xs ${
                    metric.current > metric.average ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.current > metric.average ? '+' : ''}
                    {((metric.current - metric.average) / metric.average * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Component health status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Server className="h-4 w-4" />
                <span className="text-sm">Web Server</span>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Operational
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Database className="h-4 w-4" />
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
                <HardDrive className="h-4 w-4" />
                <span className="text-sm">File Storage</span>
              </div>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                Warning
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Network className="h-4 w-4" />
                <span className="text-sm">CDN</span>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Operational
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>System Alerts</CardTitle>
          <CardDescription>Active system notifications and warnings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getAlertIcon(alert.type)}
                  <div>
                    <p className="font-medium">{alert.component}</p>
                    <p className="text-sm text-gray-600">{alert.message}</p>
                    <p className="text-xs text-gray-500">{new Date(alert.timestamp).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className={getSeverityBadge(alert.severity)}>
                    {alert.severity}
                  </Badge>
                  {!alert.resolved && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => resolveAlert(alert.id)}
                    >
                      Resolve
                    </Button>
                  )}
                  <Badge variant={alert.resolved ? "secondary" : "destructive"}>
                    {alert.resolved ? 'Resolved' : 'Active'}
                  </Badge>
                </div>
              </div>
            ))}
            {alerts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p>All systems operational</p>
                <p className="text-sm">No active alerts</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common system management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto flex-col items-center p-6 space-y-2">
              <Database className="h-8 w-8" />
              <span>Database Backup</span>
            </Button>
            
            <Button variant="outline" className="h-auto flex-col items-center p-6 space-y-2">
              <Server className="h-8 w-8" />
              <span>Restart Services</span>
            </Button>
            
            <Button variant="outline" className="h-auto flex-col items-center p-6 space-y-2">
              <Shield className="h-8 w-8" />
              <span>Security Scan</span>
            </Button>
            
            <Button variant="outline" className="h-auto flex-col items-center p-6 space-y-2">
              <Zap className="h-8 w-8" />
              <span>Emergency Mode</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
