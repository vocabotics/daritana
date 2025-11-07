import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  GitBranch, 
  AlertTriangle,
  Users,
  TrendingUp,
  Download,
  Settings,
  Maximize2,
  Filter,
  Clock
} from 'lucide-react';
import { useScheduleStore } from '@/store/scheduleStore';
import { useProjectStore } from '@/store/projectStore';
import { ProjectTimeline, Milestone, CriticalPath } from '@/types';

interface GanttTask {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  dependencies: string[];
  resource?: string;
  isCritical: boolean;
  isMilestone: boolean;
  color: string;
  category: string;
}

const AdvancedGanttChart: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { ganttConfig, updateGanttConfig, calculateCriticalPath, holidays } = useScheduleStore();
  const { projects, currentProject } = useProjectStore();
  
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [zoom, setZoom] = useState(1);
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [showResourceView, setShowResourceView] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  // Convert project timeline to Gantt tasks
  useEffect(() => {
    if (currentProject?.timeline) {
      const ganttTasks: GanttTask[] = currentProject.timeline.map(item => ({
        id: item.id,
        name: item.title,
        start: new Date(item.startDate),
        end: new Date(item.endDate),
        progress: item.progress || 0,
        dependencies: item.dependencies,
        resource: item.assignedTo?.[0],
        isCritical: item.isCritical || false,
        isMilestone: false,
        color: getCategoryColor(item.category),
        category: item.category
      }));
      
      // Add milestones
      if (currentProject.milestones) {
        currentProject.milestones.forEach(milestone => {
          ganttTasks.push({
            id: milestone.id,
            name: milestone.name,
            start: new Date(milestone.date),
            end: new Date(milestone.date),
            progress: milestone.status === 'completed' ? 100 : 0,
            dependencies: milestone.dependencies,
            isCritical: false,
            isMilestone: true,
            color: '#9333ea',
            category: 'milestone'
          });
        });
      }
      
      setTasks(ganttTasks);
      
      // Calculate critical path
      if (currentProject.timeline.length > 0) {
        calculateCriticalPath(currentProject.id, currentProject.timeline);
      }
    }
  }, [currentProject, calculateCriticalPath]);
  
  // Render Gantt chart on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || tasks.length === 0) return;
    
    // Set canvas size
    canvas.width = containerRef.current?.clientWidth || 1200;
    canvas.height = tasks.length * 40 + 100;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const cellWidth = ganttConfig.viewMode === 'day' ? 30 : 
                      ganttConfig.viewMode === 'week' ? 20 : 
                      ganttConfig.viewMode === 'month' ? 15 : 10;
    
    const startDate = new Date(Math.min(...tasks.map(t => t.start.getTime())));
    const endDate = new Date(Math.max(...tasks.map(t => t.end.getTime())));
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    // Draw vertical lines (time grid)
    for (let i = 0; i <= totalDays; i++) {
      const x = 250 + i * cellWidth * zoom;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
      
      // Draw date labels
      if (i % 7 === 0 || ganttConfig.viewMode === 'day') {
        const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        ctx.fillStyle = '#6b7280';
        ctx.font = '10px sans-serif';
        ctx.fillText(date.toLocaleDateString('en-MY', { day: '2-digit', month: 'short' }), x - 15, 20);
      }
    }
    
    // Draw horizontal lines (task rows)
    tasks.forEach((_, index) => {
      const y = 50 + index * 40;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    });
    
    // Draw weekend shading
    for (let i = 0; i <= totalDays; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      if (date.getDay() === 0 || date.getDay() === 6 || 
          holidays.some(h => h.date.toDateString() === date.toDateString())) {
        const x = 250 + i * cellWidth * zoom;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.05)';
        ctx.fillRect(x, 30, cellWidth * zoom, canvas.height);
      }
    }
    
    // Draw tasks
    tasks.forEach((task, index) => {
      const y = 50 + index * 40;
      const taskStart = Math.ceil((task.start.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const taskDuration = Math.ceil((task.end.getTime() - task.start.getTime()) / (1000 * 60 * 60 * 24)) || 1;
      const x = 250 + taskStart * cellWidth * zoom;
      const width = taskDuration * cellWidth * zoom;
      
      // Draw task name
      ctx.fillStyle = '#111827';
      ctx.font = '12px sans-serif';
      ctx.fillText(task.name, 10, y + 20);
      
      if (task.isMilestone) {
        // Draw milestone diamond
        ctx.fillStyle = task.color;
        ctx.beginPath();
        ctx.moveTo(x, y + 10);
        ctx.lineTo(x + 10, y + 20);
        ctx.lineTo(x, y + 30);
        ctx.lineTo(x - 10, y + 20);
        ctx.closePath();
        ctx.fill();
      } else {
        // Draw task bar
        ctx.fillStyle = task.isCritical ? '#dc2626' : task.color;
        ctx.fillRect(x, y + 10, width, 20);
        
        // Draw progress
        if (task.progress > 0) {
          ctx.fillStyle = task.isCritical ? '#991b1b' : adjustColor(task.color, -20);
          ctx.fillRect(x, y + 10, width * (task.progress / 100), 20);
        }
        
        // Draw progress text
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px sans-serif';
        ctx.fillText(`${task.progress}%`, x + width / 2 - 10, y + 23);
      }
      
      // Draw resource name if enabled
      if (ganttConfig.showResourceNames && task.resource) {
        ctx.fillStyle = '#6b7280';
        ctx.font = '10px sans-serif';
        ctx.fillText(task.resource, x + width + 5, y + 23);
      }
      
      // Draw dependencies
      if (ganttConfig.showDependencies && task.dependencies.length > 0) {
        ctx.strokeStyle = '#9ca3af';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        
        task.dependencies.forEach(depId => {
          const depTask = tasks.find(t => t.id === depId);
          if (depTask) {
            const depIndex = tasks.indexOf(depTask);
            const depY = 50 + depIndex * 40;
            const depEnd = 250 + Math.ceil((depTask.end.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) * cellWidth * zoom;
            
            ctx.beginPath();
            ctx.moveTo(depEnd, depY + 20);
            ctx.lineTo(x - 5, y + 20);
            ctx.stroke();
            
            // Arrow head
            ctx.beginPath();
            ctx.moveTo(x - 5, y + 20);
            ctx.lineTo(x - 10, y + 15);
            ctx.lineTo(x - 10, y + 25);
            ctx.closePath();
            ctx.fill();
          }
        });
        
        ctx.setLineDash([]);
      }
    });
    
    // Highlight critical path
    if (ganttConfig.showCriticalPath) {
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.5;
      
      const criticalTasks = tasks.filter(t => t.isCritical);
      criticalTasks.forEach(task => {
        const taskStart = Math.ceil((task.start.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const taskDuration = Math.ceil((task.end.getTime() - task.start.getTime()) / (1000 * 60 * 60 * 24)) || 1;
        const x = 250 + taskStart * cellWidth * zoom;
        const width = taskDuration * cellWidth * zoom;
        const y = 50 + tasks.indexOf(task) * 40;
        
        ctx.strokeRect(x - 2, y + 8, width + 4, 24);
      });
      
      ctx.globalAlpha = 1;
    }
    
  }, [tasks, ganttConfig, zoom, holidays]);
  
  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      design: '#3b82f6',
      engineering: '#10b981',
      client: '#f59e0b',
      management: '#8b5cf6',
      construction: '#ef4444',
      approval: '#ec4899',
      procurement: '#06b6d4',
      site_work: '#f97316'
    };
    return colors[category] || '#6b7280';
  };
  
  const adjustColor = (color: string, amount: number): string => {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  };
  
  const exportGantt = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = `gantt-chart-${currentProject?.name || 'project'}-${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };
  
  const optimizeSchedule = () => {
    if (!currentProject) return;
    // This would trigger schedule optimization in the store
    console.log('Optimizing schedule for project:', currentProject.id);
  };
  
  return (
    <Card className="w-full h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle>Master Gantt Timeline</CardTitle>
            {currentProject?.criticalPath && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Critical Path: {currentProject.criticalPath.totalDuration} days
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={ganttConfig.viewMode} onValueChange={(value: any) => updateGanttConfig({ viewMode: value })}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="quarter">Quarter</SelectItem>
                <SelectItem value="year">Year</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="engineering">Engineering</SelectItem>
                <SelectItem value="construction">Construction</SelectItem>
                <SelectItem value="approval">Approvals</SelectItem>
                <SelectItem value="procurement">Procurement</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="icon" onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="text-sm text-muted-foreground px-2">{Math.round(zoom * 100)}%</span>
            
            <Button variant="outline" size="icon" onClick={() => setZoom(Math.min(2, zoom + 0.1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            <Button variant="outline" size="icon" onClick={exportGantt}>
              <Download className="h-4 w-4" />
            </Button>
            
            <Button variant="outline" size="icon">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="mb-4 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Switch
              id="show-dependencies"
              checked={ganttConfig.showDependencies}
              onCheckedChange={(checked) => updateGanttConfig({ showDependencies: checked })}
            />
            <Label htmlFor="show-dependencies" className="text-sm">Dependencies</Label>
          </div>
          
          <div className="flex items-center gap-2">
            <Switch
              id="show-critical"
              checked={ganttConfig.showCriticalPath}
              onCheckedChange={(checked) => updateGanttConfig({ showCriticalPath: checked })}
            />
            <Label htmlFor="show-critical" className="text-sm">Critical Path</Label>
          </div>
          
          <div className="flex items-center gap-2">
            <Switch
              id="show-milestones"
              checked={ganttConfig.showMilestones}
              onCheckedChange={(checked) => updateGanttConfig({ showMilestones: checked })}
            />
            <Label htmlFor="show-milestones" className="text-sm">Milestones</Label>
          </div>
          
          <div className="flex items-center gap-2">
            <Switch
              id="show-resources"
              checked={ganttConfig.showResourceNames}
              onCheckedChange={(checked) => updateGanttConfig({ showResourceNames: checked })}
            />
            <Label htmlFor="show-resources" className="text-sm">Resources</Label>
          </div>
          
          <div className="flex items-center gap-2">
            <Switch
              id="resource-view"
              checked={showResourceView}
              onCheckedChange={setShowResourceView}
            />
            <Label htmlFor="resource-view" className="text-sm">Resource View</Label>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={optimizeSchedule}
            className="ml-auto"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Optimize Schedule
          </Button>
        </div>
        
        <div className="relative overflow-auto border rounded-lg" ref={containerRef}>
          <canvas
            ref={canvasRef}
            className="w-full"
            style={{ maxHeight: '600px' }}
          />
        </div>
        
        <div className="mt-4 grid grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded" />
            <span className="text-sm">Design</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded" />
            <span className="text-sm">Engineering</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded" />
            <span className="text-sm">Construction</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-600 rounded" />
            <span className="text-sm">Milestone</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedGanttChart;