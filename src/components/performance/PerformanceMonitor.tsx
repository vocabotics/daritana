import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { 
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  HardDrive
} from 'lucide-react';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PerformanceMonitorProps {
  metrics: any;
}

export function PerformanceMonitor({ metrics }: PerformanceMonitorProps) {
  const [realtimeMetrics, setRealtimeMetrics] = useState<any[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);

  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      const newMetric = {
        timestamp: new Date().toLocaleTimeString(),
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        fps: 55 + Math.random() * 10,
        latency: 10 + Math.random() * 50
      };

      setRealtimeMetrics(prev => [...prev.slice(-19), newMetric]);
    }, 1000);

    return () => clearInterval(interval);
  }, [isMonitoring]);

  const chartData = {
    labels: realtimeMetrics.map(m => m.timestamp),
    datasets: [
      {
        label: 'CPU Usage (%)',
        data: realtimeMetrics.map(m => m.cpu),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4
      },
      {
        label: 'Memory Usage (%)',
        data: realtimeMetrics.map(m => m.memory),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4
      }
    ]
  };

  const webVitals = [
    {
      name: 'Largest Contentful Paint',
      abbr: 'LCP',
      value: 2.1,
      target: 2.5,
      unit: 's',
      status: 'good'
    },
    {
      name: 'First Input Delay',
      abbr: 'FID',
      value: 45,
      target: 100,
      unit: 'ms',
      status: 'good'
    },
    {
      name: 'Cumulative Layout Shift',
      abbr: 'CLS',
      value: 0.12,
      target: 0.1,
      unit: '',
      status: 'warning'
    },
    {
      name: 'Time to First Byte',
      abbr: 'TTFB',
      value: 320,
      target: 600,
      unit: 'ms',
      status: 'good'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Real-time Monitoring */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <CardTitle>Real-time Performance</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isMonitoring ? 'default' : 'secondary'}>
                {isMonitoring ? 'Monitoring' : 'Paused'}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsMonitoring(!isMonitoring)}
              >
                {isMonitoring ? 'Pause' : 'Resume'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Line 
            data={chartData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'bottom' as const,
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100
                }
              }
            }}
          />
        </CardContent>
      </Card>

      {/* Web Vitals */}
      <Card>
        <CardHeader>
          <CardTitle>Core Web Vitals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {webVitals.map(vital => (
              <div key={vital.abbr} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold">{vital.abbr}</span>
                  {vital.status === 'good' ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                  )}
                </div>
                <p className="text-sm text-gray-500 mb-1">{vital.name}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-semibold">
                    {vital.value}{vital.unit}
                  </span>
                  <span className="text-sm text-gray-400">
                    / {vital.target}{vital.unit}
                  </span>
                </div>
                <Badge 
                  variant={vital.status === 'good' ? 'success' : 'warning'}
                  className="mt-2"
                >
                  {vital.status === 'good' ? 'Good' : 'Needs Improvement'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Resource Timing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">DNS Lookup</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '20%' }} />
                  </div>
                  <span className="text-sm font-medium">45ms</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">TCP Connection</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '30%' }} />
                  </div>
                  <span className="text-sm font-medium">67ms</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">SSL Handshake</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '25%' }} />
                  </div>
                  <span className="text-sm font-medium">56ms</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Server Response</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: '60%' }} />
                  </div>
                  <span className="text-sm font-medium">134ms</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Content Download</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: '80%' }} />
                  </div>
                  <span className="text-sm font-medium">178ms</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>JavaScript Execution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Long tasks detected: 3 tasks blocking main thread for {'>'}50ms
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Main Bundle</span>
                    <span className="text-sm text-gray-500">523ms</span>
                  </div>
                  <div className="text-xs text-gray-400">Parse: 120ms • Compile: 403ms</div>
                </div>
                
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Vendor Bundle</span>
                    <span className="text-sm text-gray-500">234ms</span>
                  </div>
                  <div className="text-xs text-gray-400">Parse: 67ms • Compile: 167ms</div>
                </div>
                
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">React Hydration</span>
                    <span className="text-sm text-gray-500">156ms</span>
                  </div>
                  <div className="text-xs text-gray-400">Components: 47 • Events: 234</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}