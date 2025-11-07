import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Image,
  Upload,
  Download,
  Zap,
  CheckCircle,
  AlertTriangle,
  FileImage,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { toast } from 'sonner';

export function ImageOptimizer() {
  const [images] = useState([
    { name: 'hero-banner.jpg', original: 2.4, optimized: 0.8, format: 'JPEG', dimensions: '1920x1080', status: 'optimized' },
    { name: 'project-1.png', original: 3.2, optimized: 1.1, format: 'PNG', dimensions: '1200x800', status: 'optimized' },
    { name: 'team-photo.jpg', original: 1.8, optimized: null, format: 'JPEG', dimensions: '800x600', status: 'pending' },
    { name: 'logo-large.svg', original: 0.2, optimized: 0.15, format: 'SVG', dimensions: 'Vector', status: 'optimized' },
    { name: 'background.webp', original: 0.9, optimized: 0.9, format: 'WebP', dimensions: '1920x1080', status: 'optimized' },
    { name: 'gallery-1.jpg', original: 4.5, optimized: null, format: 'JPEG', dimensions: '2560x1440', status: 'pending' }
  ]);

  const [optimizationSettings, setOptimizationSettings] = useState({
    quality: 85,
    format: 'auto',
    lazy: true,
    responsive: true,
    webp: true,
    avif: false,
    maxWidth: 2048
  });

  const [isOptimizing, setIsOptimizing] = useState(false);

  const optimizeAll = () => {
    setIsOptimizing(true);
    toast.info('Optimizing images...');
    setTimeout(() => {
      setIsOptimizing(false);
      toast.success('All images optimized! Saved 5.2MB');
    }, 3000);
  };

  const totalSavings = images.reduce((acc, img) => {
    if (img.optimized) {
      return acc + (img.original - img.optimized);
    }
    return acc;
  }, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'optimized':
        return <Badge variant="success" className="gap-1"><CheckCircle className="h-3 w-3" />Optimized</Badge>;
      case 'pending':
        return <Badge variant="warning" className="gap-1"><AlertTriangle className="h-3 w-3" />Pending</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Optimization Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Image Optimization</CardTitle>
              <CardDescription>Compress and optimize images for better performance</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Upload Images
              </Button>
              <Button onClick={optimizeAll} disabled={isOptimizing}>
                <Zap className="h-4 w-4 mr-2" />
                {isOptimizing ? 'Optimizing...' : 'Optimize All'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Total Images</p>
              <p className="text-2xl font-bold">{images.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Size</p>
              <p className="text-2xl font-bold">
                {images.reduce((acc, img) => acc + img.original, 0).toFixed(1)} MB
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Savings</p>
              <p className="text-2xl font-bold text-green-600">
                {totalSavings.toFixed(1)} MB
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Compression</p>
              <p className="text-2xl font-bold">
                {((totalSavings / images.reduce((acc, img) => acc + img.original, 0)) * 100).toFixed(0)}%
              </p>
            </div>
          </div>
          
          {isOptimizing && (
            <div className="mt-4">
              <Progress value={65} className="h-2" />
              <p className="text-sm text-gray-500 mt-2">Optimizing 4 of 6 images...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image List */}
      <Card>
        <CardHeader>
          <CardTitle>Image Library</CardTitle>
          <CardDescription>Manage and optimize individual images</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {images.map((image, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <FileImage className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{image.name}</p>
                    <p className="text-sm text-gray-500">
                      {image.dimensions} • {image.format}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm">
                      <span className="text-gray-500">Original:</span> {image.original} MB
                    </p>
                    {image.optimized && (
                      <p className="text-sm">
                        <span className="text-gray-500">Optimized:</span>{' '}
                        <span className="text-green-600 font-medium">{image.optimized} MB</span>
                      </p>
                    )}
                  </div>
                  {getStatusBadge(image.status)}
                  <Button size="sm" variant="ghost">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Optimization Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Optimization Settings</CardTitle>
          <CardDescription>Configure image optimization parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Quality ({optimizationSettings.quality}%)</label>
              <input
                type="range"
                min="1"
                max="100"
                value={optimizationSettings.quality}
                onChange={(e) => setOptimizationSettings({
                  ...optimizationSettings,
                  quality: parseInt(e.target.value)
                })}
                className="w-full mt-2"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Low (fast)</span>
                <span>High (quality)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Output Format</label>
                <select 
                  className="w-full mt-1 p-2 border rounded"
                  value={optimizationSettings.format}
                  onChange={(e) => setOptimizationSettings({
                    ...optimizationSettings,
                    format: e.target.value
                  })}
                >
                  <option value="auto">Auto-detect</option>
                  <option value="jpeg">JPEG</option>
                  <option value="png">PNG</option>
                  <option value="webp">WebP</option>
                  <option value="avif">AVIF</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Max Width (px)</label>
                <input
                  type="number"
                  value={optimizationSettings.maxWidth}
                  onChange={(e) => setOptimizationSettings({
                    ...optimizationSettings,
                    maxWidth: parseInt(e.target.value)
                  })}
                  className="w-full mt-1 p-2 border rounded"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={optimizationSettings.lazy}
                  onChange={(e) => setOptimizationSettings({
                    ...optimizationSettings,
                    lazy: e.target.checked
                  })}
                  className="rounded"
                />
                <div>
                  <p className="font-medium">Lazy Loading</p>
                  <p className="text-sm text-gray-500">Load images only when visible</p>
                </div>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={optimizationSettings.responsive}
                  onChange={(e) => setOptimizationSettings({
                    ...optimizationSettings,
                    responsive: e.target.checked
                  })}
                  className="rounded"
                />
                <div>
                  <p className="font-medium">Responsive Images</p>
                  <p className="text-sm text-gray-500">Generate multiple sizes for different screens</p>
                </div>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={optimizationSettings.webp}
                  onChange={(e) => setOptimizationSettings({
                    ...optimizationSettings,
                    webp: e.target.checked
                  })}
                  className="rounded"
                />
                <div>
                  <p className="font-medium">WebP Conversion</p>
                  <p className="text-sm text-gray-500">Convert to WebP format when supported</p>
                </div>
              </label>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Optimized images will replace originals. Original files will be backed up.
              </AlertDescription>
            </Alert>

            <Button className="w-full">Save Settings</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}