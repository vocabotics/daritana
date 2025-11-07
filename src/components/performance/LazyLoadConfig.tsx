import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  Zap,
  Eye,
  FileCode,
  Package,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

export function LazyLoadConfig() {
  const [components] = useState([
    { name: 'Dashboard', path: '/pages/Dashboard.tsx', size: '125KB', loaded: true, priority: 'high' },
    { name: 'Projects', path: '/pages/Projects.tsx', size: '98KB', loaded: false, priority: 'medium' },
    { name: 'Analytics', path: '/pages/Analytics.tsx', size: '156KB', loaded: false, priority: 'low' },
    { name: 'EnterprisePM', path: '/pages/EnterprisePM.tsx', size: '234KB', loaded: false, priority: 'low' },
    { name: 'Marketplace', path: '/pages/Marketplace.tsx', size: '187KB', loaded: false, priority: 'medium' },
    { name: 'Calendar', path: '/components/Calendar.tsx', size: '67KB', loaded: true, priority: 'high' },
    { name: 'Charts', path: '/components/Charts.tsx', size: '89KB', loaded: false, priority: 'medium' },
    { name: 'FileManager', path: '/components/FileManager.tsx', size: '145KB', loaded: false, priority: 'low' }
  ]);

  const [settings, setSettings] = useState({
    enabled: true,
    threshold: 0.1,
    rootMargin: 200,
    preloadNext: true,
    suspenseEnabled: true,
    errorBoundaries: true
  });

  const enableAllLazyLoading = () => {
    toast.success('Lazy loading enabled for all components');
  };

  const optimizeBundle = () => {
    toast.info('Analyzing bundle...');
    setTimeout(() => {
      toast.success('Bundle optimized! Reduced size by 35%');
    }, 2000);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500 bg-red-50';
      case 'medium': return 'text-yellow-500 bg-yellow-50';
      case 'low': return 'text-green-500 bg-green-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Lazy Loading Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Code Splitting & Lazy Loading</CardTitle>
              <CardDescription>Optimize bundle size with dynamic imports</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={optimizeBundle}>
                <Package className="h-4 w-4 mr-2" />
                Optimize Bundle
              </Button>
              <Button onClick={enableAllLazyLoading}>
                <Zap className="h-4 w-4 mr-2" />
                Enable All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Total Components</p>
              <p className="text-2xl font-bold">{components.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Lazy Loaded</p>
              <p className="text-2xl font-bold text-green-600">
                {components.filter(c => !c.loaded).length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Bundle Reduction</p>
              <p className="text-2xl font-bold">723KB</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Load Time Saved</p>
              <p className="text-2xl font-bold">1.8s</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Component List */}
      <Card>
        <CardHeader>
          <CardTitle>Component Loading Strategy</CardTitle>
          <CardDescription>Configure which components should be lazy loaded</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {components.map(component => (
              <div key={component.name} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <FileCode className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{component.name}</p>
                    <p className="text-sm text-gray-500">{component.path}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{component.size}</Badge>
                  <Badge className={getPriorityColor(component.priority)}>
                    {component.priority}
                  </Badge>
                  {component.loaded ? (
                    <Badge variant="secondary" className="gap-1">
                      <XCircle className="h-3 w-3" />
                      Eager
                    </Badge>
                  ) : (
                    <Badge variant="success" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Lazy
                    </Badge>
                  )}
                  <Switch checked={!component.loaded} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lazy Loading Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Lazy Loading Configuration</CardTitle>
          <CardDescription>Fine-tune lazy loading behavior</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enable Lazy Loading</p>
                <p className="text-sm text-gray-500">Dynamically import components on demand</p>
              </div>
              <Switch
                checked={settings.enabled}
                onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
              />
            </div>

            <div>
              <p className="font-medium mb-2">Intersection Observer Threshold</p>
              <p className="text-sm text-gray-500 mb-3">
                Start loading when component is {(settings.threshold * 100).toFixed(0)}% visible
              </p>
              <div className="flex items-center gap-4">
                <Slider
                  value={[settings.threshold]}
                  onValueChange={(value) => setSettings({ ...settings, threshold: value[0] })}
                  min={0}
                  max={1}
                  step={0.1}
                  className="flex-1"
                />
                <span className="w-12 text-right font-medium">
                  {(settings.threshold * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            <div>
              <p className="font-medium mb-2">Root Margin (px)</p>
              <p className="text-sm text-gray-500 mb-3">
                Start loading {settings.rootMargin}px before component enters viewport
              </p>
              <div className="flex items-center gap-4">
                <Slider
                  value={[settings.rootMargin]}
                  onValueChange={(value) => setSettings({ ...settings, rootMargin: value[0] })}
                  min={0}
                  max={500}
                  step={50}
                  className="flex-1"
                />
                <span className="w-16 text-right font-medium">{settings.rootMargin}px</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <Switch
                  checked={settings.preloadNext}
                  onCheckedChange={(checked) => setSettings({ ...settings, preloadNext: checked })}
                />
                <div>
                  <p className="font-medium">Preload Next Route</p>
                  <p className="text-sm text-gray-500">Prefetch components for likely navigation paths</p>
                </div>
              </label>

              <label className="flex items-center gap-2">
                <Switch
                  checked={settings.suspenseEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, suspenseEnabled: checked })}
                />
                <div>
                  <p className="font-medium">React Suspense</p>
                  <p className="text-sm text-gray-500">Show loading states while components load</p>
                </div>
              </label>

              <label className="flex items-center gap-2">
                <Switch
                  checked={settings.errorBoundaries}
                  onCheckedChange={(checked) => setSettings({ ...settings, errorBoundaries: checked })}
                />
                <div>
                  <p className="font-medium">Error Boundaries</p>
                  <p className="text-sm text-gray-500">Gracefully handle component loading failures</p>
                </div>
              </label>
            </div>

            <Button className="w-full">Apply Configuration</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}