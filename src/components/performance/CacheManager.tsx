import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  HardDrive,
  RefreshCw,
  Trash2,
  Database,
  Cloud,
  FileText,
  Image,
  Code
} from 'lucide-react';
import { toast } from 'sonner';

export function CacheManager() {
  const [cacheStats, setCacheStats] = useState({
    total: 100, // MB
    used: 45.7, // MB
    items: 1234,
    hitRate: 78.5
  });

  const [cacheTypes] = useState([
    { type: 'API Responses', size: 12.3, items: 234, enabled: true, icon: Cloud },
    { type: 'Images', size: 23.5, items: 567, enabled: true, icon: Image },
    { type: 'Documents', size: 5.8, items: 89, enabled: true, icon: FileText },
    { type: 'JavaScript', size: 3.2, items: 45, enabled: true, icon: Code },
    { type: 'User Data', size: 0.9, items: 299, enabled: false, icon: Database }
  ]);

  const clearCache = (type?: string) => {
    if (type) {
      toast.success(`${type} cache cleared`);
    } else {
      setCacheStats({ ...cacheStats, used: 0, items: 0 });
      toast.success('All cache cleared successfully');
    }
  };

  const refreshCache = () => {
    toast.info('Refreshing cache...');
    setTimeout(() => {
      toast.success('Cache refreshed');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Cache Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Cache Management</CardTitle>
              <CardDescription>Configure caching strategies and manage stored data</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={refreshCache}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="destructive" onClick={() => clearCache()}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Cache Usage</p>
              <p className="text-2xl font-bold">{cacheStats.used} MB</p>
              <Progress value={(cacheStats.used / cacheStats.total) * 100} className="mt-2" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Items</p>
              <p className="text-2xl font-bold">{cacheStats.items.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Hit Rate</p>
              <p className="text-2xl font-bold">{cacheStats.hitRate}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Savings</p>
              <p className="text-2xl font-bold">2.3s</p>
              <p className="text-xs text-gray-400">Avg. load time saved</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cache Types */}
      <Card>
        <CardHeader>
          <CardTitle>Cache Categories</CardTitle>
          <CardDescription>Manage different types of cached content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {cacheTypes.map(cache => (
              <div key={cache.type} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <cache.icon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">{cache.type}</p>
                    <p className="text-sm text-gray-500">
                      {cache.size} MB • {cache.items} items
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={cache.enabled ? 'default' : 'secondary'}>
                    {cache.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                  <Switch checked={cache.enabled} />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => clearCache(cache.type)}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cache Strategy */}
      <Card>
        <CardHeader>
          <CardTitle>Caching Strategy</CardTitle>
          <CardDescription>Configure how content is cached and served</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">Network First</p>
                  <Switch defaultChecked />
                </div>
                <p className="text-sm text-gray-500">
                  Try network first, fallback to cache for API calls
                </p>
              </div>
              
              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">Cache First</p>
                  <Switch />
                </div>
                <p className="text-sm text-gray-500">
                  Serve from cache, update in background for static assets
                </p>
              </div>
              
              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">Stale While Revalidate</p>
                  <Switch defaultChecked />
                </div>
                <p className="text-sm text-gray-500">
                  Serve stale content while fetching fresh data
                </p>
              </div>
              
              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">Background Sync</p>
                  <Switch defaultChecked />
                </div>
                <p className="text-sm text-gray-500">
                  Sync data in background when connection restored
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Cache Expiration</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-sm text-gray-500">API Data</label>
                  <select className="w-full mt-1 p-2 border rounded">
                    <option>5 minutes</option>
                    <option>15 minutes</option>
                    <option>1 hour</option>
                    <option>1 day</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Images</label>
                  <select className="w-full mt-1 p-2 border rounded">
                    <option>1 day</option>
                    <option>7 days</option>
                    <option>30 days</option>
                    <option>Forever</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Scripts</label>
                  <select className="w-full mt-1 p-2 border rounded">
                    <option>1 hour</option>
                    <option>1 day</option>
                    <option>7 days</option>
                    <option>Version-based</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-500">User Data</label>
                  <select className="w-full mt-1 p-2 border rounded">
                    <option>No cache</option>
                    <option>Session only</option>
                    <option>1 hour</option>
                    <option>Until logout</option>
                  </select>
                </div>
              </div>
            </div>

            <Button className="w-full">Save Cache Settings</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}