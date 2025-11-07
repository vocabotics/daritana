import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  List,
  Layers,
  Maximize,
  Activity,
  CheckCircle,
  AlertTriangle,
  Settings,
  Table
} from 'lucide-react';
import { toast } from 'sonner';

export function VirtualScrollConfig() {
  const [virtualizedLists] = useState([
    { name: 'Project List', items: 1500, rendered: 20, enabled: true, type: 'list' },
    { name: 'Task Board', items: 800, rendered: 15, enabled: true, type: 'grid' },
    { name: 'File Manager', items: 5000, rendered: 30, enabled: false, type: 'table' },
    { name: 'Team Directory', items: 250, rendered: 250, enabled: false, type: 'cards' },
    { name: 'Activity Feed', items: 2000, rendered: 10, enabled: true, type: 'timeline' },
    { name: 'Comments', items: 500, rendered: 8, enabled: true, type: 'nested' }
  ]);

  const [settings, setSettings] = useState({
    enabled: true,
    itemHeight: 80,
    overscan: 3,
    scrollDebounce: 150,
    useWindowScroll: false,
    enableHorizontal: false,
    dynamicHeight: false
  });

  const enableAllVirtualization = () => {
    toast.success('Virtual scrolling enabled for all large lists');
  };

  const analyzePerformance = () => {
    toast.info('Analyzing scroll performance...');
    setTimeout(() => {
      toast.success('Analysis complete! 3 lists can benefit from virtualization');
    }, 2000);
  };

  const totalMemorySaved = virtualizedLists
    .filter(list => list.enabled)
    .reduce((acc, list) => acc + (list.items - list.rendered) * 0.5, 0); // KB per item

  return (
    <div className="space-y-6">
      {/* Virtual Scroll Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Virtual Scrolling</CardTitle>
              <CardDescription>Render only visible items in large lists for better performance</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={analyzePerformance}>
                <Activity className="h-4 w-4 mr-2" />
                Analyze
              </Button>
              <Button onClick={enableAllVirtualization}>
                <List className="h-4 w-4 mr-2" />
                Enable All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Virtualized Lists</p>
              <p className="text-2xl font-bold">
                {virtualizedLists.filter(l => l.enabled).length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Items</p>
              <p className="text-2xl font-bold">
                {virtualizedLists.reduce((acc, l) => acc + l.items, 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Rendered Items</p>
              <p className="text-2xl font-bold text-green-600">
                {virtualizedLists.filter(l => l.enabled).reduce((acc, l) => acc + l.rendered, 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Memory Saved</p>
              <p className="text-2xl font-bold">
                {(totalMemorySaved / 1024).toFixed(1)} MB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>List Configuration</CardTitle>
          <CardDescription>Enable virtual scrolling for large data sets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {virtualizedLists.map((list, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  {list.type === 'grid' && <Layers className="h-5 w-5 text-gray-400" />}
                  {list.type === 'table' && <Table className="h-5 w-5 text-gray-400" />}
                  {list.type !== 'grid' && list.type !== 'table' && <List className="h-5 w-5 text-gray-400" />}
                  <div>
                    <p className="font-medium">{list.name}</p>
                    <p className="text-sm text-gray-500">
                      {list.items.toLocaleString()} items • Type: {list.type}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {list.enabled ? (
                    <>
                      <Badge variant="success">
                        Rendering {list.rendered} of {list.items.toLocaleString()}
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Virtualized
                      </Badge>
                    </>
                  ) : (
                    <>
                      {list.items > 100 && (
                        <Badge variant="warning" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Not Optimized
                        </Badge>
                      )}
                      <Badge variant="secondary">Standard</Badge>
                    </>
                  )}
                  <Switch checked={list.enabled} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Virtual Scroll Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Virtual Scroll Settings</CardTitle>
          <CardDescription>Fine-tune virtual scrolling behavior</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enable Virtual Scrolling</p>
                <p className="text-sm text-gray-500">Use virtual scrolling for large lists</p>
              </div>
              <Switch
                checked={settings.enabled}
                onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
              />
            </div>

            <div>
              <p className="font-medium mb-2">Item Height ({settings.itemHeight}px)</p>
              <p className="text-sm text-gray-500 mb-3">
                Expected height of each item for calculation
              </p>
              <div className="flex items-center gap-4">
                <Slider
                  value={[settings.itemHeight]}
                  onValueChange={(value) => setSettings({ ...settings, itemHeight: value[0] })}
                  min={20}
                  max={200}
                  step={10}
                  className="flex-1"
                />
                <span className="w-16 text-right font-medium">{settings.itemHeight}px</span>
              </div>
            </div>

            <div>
              <p className="font-medium mb-2">Overscan Count ({settings.overscan} items)</p>
              <p className="text-sm text-gray-500 mb-3">
                Number of items to render outside visible area
              </p>
              <div className="flex items-center gap-4">
                <Slider
                  value={[settings.overscan]}
                  onValueChange={(value) => setSettings({ ...settings, overscan: value[0] })}
                  min={0}
                  max={10}
                  step={1}
                  className="flex-1"
                />
                <span className="w-12 text-right font-medium">{settings.overscan}</span>
              </div>
            </div>

            <div>
              <p className="font-medium mb-2">Scroll Debounce ({settings.scrollDebounce}ms)</p>
              <p className="text-sm text-gray-500 mb-3">
                Delay before recalculating visible items
              </p>
              <div className="flex items-center gap-4">
                <Slider
                  value={[settings.scrollDebounce]}
                  onValueChange={(value) => setSettings({ ...settings, scrollDebounce: value[0] })}
                  min={0}
                  max={500}
                  step={50}
                  className="flex-1"
                />
                <span className="w-16 text-right font-medium">{settings.scrollDebounce}ms</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.useWindowScroll}
                  onChange={(e) => setSettings({ ...settings, useWindowScroll: e.target.checked })}
                  className="rounded"
                />
                <div>
                  <p className="font-medium">Use Window Scroll</p>
                  <p className="text-sm text-gray-500">Scroll with page instead of container</p>
                </div>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.enableHorizontal}
                  onChange={(e) => setSettings({ ...settings, enableHorizontal: e.target.checked })}
                  className="rounded"
                />
                <div>
                  <p className="font-medium">Horizontal Virtualization</p>
                  <p className="text-sm text-gray-500">Enable for horizontal scrolling lists</p>
                </div>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.dynamicHeight}
                  onChange={(e) => setSettings({ ...settings, dynamicHeight: e.target.checked })}
                  className="rounded"
                />
                <div>
                  <p className="font-medium">Dynamic Item Height</p>
                  <p className="text-sm text-gray-500">Support items with variable heights</p>
                </div>
              </label>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Virtual scrolling may affect keyboard navigation and screen readers. Test accessibility after enabling.
              </AlertDescription>
            </Alert>

            <Button className="w-full">Apply Settings</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}