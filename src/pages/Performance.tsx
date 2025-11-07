import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PerformanceMonitor } from '@/components/performance/PerformanceMonitor';
import { CacheManager } from '@/components/performance/CacheManager';
import { LazyLoadConfig } from '@/components/performance/LazyLoadConfig';
import { ImageOptimizer } from '@/components/performance/ImageOptimizer';
import { VirtualScrollConfig } from '@/components/performance/VirtualScrollConfig';
import { 
  Zap,
  Gauge,
  HardDrive,
  Image,
  List,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
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

export default function Performance() {
  const [metrics, setMetrics] = useState({
    pageLoadTime: 1.2,
    firstContentfulPaint: 0.8,
    timeToInteractive: 1.5,
    memoryUsage: 45,
    cacheHitRate: 78,
    bundleSize: 2.3
  });

  const [performanceScore, setPerformanceScore] = useState(0);

  useEffect(() => {
    // Calculate performance score
    const score = Math.round(
      ((100 - metrics.pageLoadTime * 20) +
      (100 - metrics.firstContentfulPaint * 30) +
      (100 - metrics.timeToInteractive * 15) +
      metrics.cacheHitRate +
      (100 - metrics.memoryUsage)) / 5
    );
    setPerformanceScore(Math.max(0, Math.min(100, score)));
  }, [metrics]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Needs Improvement';
    return 'Poor';
  };

  return (
    <Layout>
      <div className="container max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Performance Center</h1>
            <p className="text-gray-500 mt-1">Monitor and optimize application performance</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(performanceScore)}`}>
                {performanceScore}
              </div>
              <Badge variant="outline" className="mt-1">
                {getScoreLabel(performanceScore)}
              </Badge>
            </div>
            <Button>
              <RefreshCw className="h-4 w-4 mr-2" />
              Run Analysis
            </Button>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-gray-500">Page Load</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{metrics.pageLoadTime}s</div>
                <Progress value={100 - metrics.pageLoadTime * 20} className="mt-2 h-1" />
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
                <CardTitle className="text-xs text-gray-500">First Paint</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{metrics.firstContentfulPaint}s</div>
                <Progress value={100 - metrics.firstContentfulPaint * 30} className="mt-2 h-1" />
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
                <CardTitle className="text-xs text-gray-500">Interactive</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{metrics.timeToInteractive}s</div>
                <Progress value={100 - metrics.timeToInteractive * 15} className="mt-2 h-1" />
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
                <CardTitle className="text-xs text-gray-500">Memory</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{metrics.memoryUsage}%</div>
                <Progress value={100 - metrics.memoryUsage} className="mt-2 h-1" />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-gray-500">Cache Hit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{metrics.cacheHitRate}%</div>
                <Progress value={metrics.cacheHitRate} className="mt-2 h-1" />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-gray-500">Bundle</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{metrics.bundleSize}MB</div>
                <Progress value={100 - metrics.bundleSize * 10} className="mt-2 h-1" />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Optimization Recommendations */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              <CardTitle>Optimization Opportunities</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span className="text-sm">Enable lazy loading for 23 components</span>
                <Button size="sm" variant="outline" className="ml-auto">Apply</Button>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span className="text-sm">Compress 15 images (save 2.1MB)</span>
                <Button size="sm" variant="outline" className="ml-auto">Optimize</Button>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Service worker caching enabled</span>
                <Badge variant="success" className="ml-auto">Active</Badge>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span className="text-sm">Enable virtual scrolling for large lists</span>
                <Button size="sm" variant="outline" className="ml-auto">Configure</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Tabs */}
        <Tabs defaultValue="monitor" className="space-y-4">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="monitor" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Monitor
            </TabsTrigger>
            <TabsTrigger value="cache" className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Cache
            </TabsTrigger>
            <TabsTrigger value="lazy" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Lazy Load
            </TabsTrigger>
            <TabsTrigger value="images" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Images
            </TabsTrigger>
            <TabsTrigger value="virtual" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Virtual Scroll
            </TabsTrigger>
          </TabsList>

          <TabsContent value="monitor">
            <PerformanceMonitor metrics={metrics} />
          </TabsContent>

          <TabsContent value="cache">
            <CacheManager />
          </TabsContent>

          <TabsContent value="lazy">
            <LazyLoadConfig />
          </TabsContent>

          <TabsContent value="images">
            <ImageOptimizer />
          </TabsContent>

          <TabsContent value="virtual">
            <VirtualScrollConfig />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}