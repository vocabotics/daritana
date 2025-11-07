import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign,
  Clock,
  Building,
  Star,
  Eye,
  Edit,
  Archive,
  ChevronLeft,
  ChevronRight,
  Filter,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  progress: number;
  budget?: number;
  startDate: Date;
  endDate?: Date;
  location: string;
  client: string;
  team: string[];
  image?: string;
  priority?: 'low' | 'medium' | 'high';
  type: string;
}

interface ProjectTimelineLayoutProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
  onProjectEdit?: (project: Project) => void;
  onProjectArchive?: (project: Project) => void;
}

type TimelineView = 'month' | 'quarter' | 'year';
type TimelineFilter = 'all' | 'active' | 'planning' | 'completed';

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active':
      return 'bg-green-500';
    case 'planning':
      return 'bg-blue-500';
    case 'on_hold':
      return 'bg-yellow-500';
    case 'completed':
      return 'bg-gray-500';
    case 'cancelled':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'border-l-red-500';
    case 'medium':
      return 'border-l-yellow-500';
    case 'low':
      return 'border-l-green-500';
    default:
      return 'border-l-gray-300';
  }
};

export const ProjectTimelineLayout: React.FC<ProjectTimelineLayoutProps> = ({
  projects,
  onProjectClick,
  onProjectEdit,
  onProjectArchive
}) => {
  const [timelineView, setTimelineView] = useState<TimelineView>('month');
  const [filter, setFilter] = useState<TimelineFilter>('all');
  const [currentDate, setCurrentDate] = useState(new Date());

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDaysRemaining = (endDate: Date) => {
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Generate timeline dates based on view
  const timelineDates = useMemo(() => {
    const dates = [];
    const today = new Date(currentDate);
    
    if (timelineView === 'month') {
      // Show current month with weeks
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      for (let d = new Date(startOfMonth); d <= endOfMonth; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d));
      }
    } else if (timelineView === 'quarter') {
      // Show current quarter with months
      const quarterStart = Math.floor(today.getMonth() / 3) * 3;
      for (let i = 0; i < 3; i++) {
        const monthDate = new Date(today.getFullYear(), quarterStart + i, 1);
        dates.push(monthDate);
      }
    } else {
      // Show current year with quarters
      for (let i = 0; i < 4; i++) {
        const quarterDate = new Date(today.getFullYear(), i * 3, 1);
        dates.push(quarterDate);
      }
    }
    
    return dates;
  }, [currentDate, timelineView]);

  // Filter projects
  const filteredProjects = projects.filter(project => {
    if (filter === 'all') return true;
    return project.status.toLowerCase() === filter.toLowerCase();
  });

  // Calculate project position and width on timeline
  const getProjectTimelineData = (project: Project) => {
    const startDate = project.startDate;
    const endDate = project.endDate || new Date();
    
    let timelineStart: Date, timelineEnd: Date;
    
    if (timelineView === 'month') {
      timelineStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      timelineEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    } else if (timelineView === 'quarter') {
      const quarterStart = Math.floor(currentDate.getMonth() / 3) * 3;
      timelineStart = new Date(currentDate.getFullYear(), quarterStart, 1);
      timelineEnd = new Date(currentDate.getFullYear(), quarterStart + 3, 0);
    } else {
      timelineStart = new Date(currentDate.getFullYear(), 0, 1);
      timelineEnd = new Date(currentDate.getFullYear(), 11, 31);
    }
    
    const totalDuration = timelineEnd.getTime() - timelineStart.getTime();
    const projectStart = Math.max(startDate.getTime(), timelineStart.getTime());
    const projectEnd = Math.min(endDate.getTime(), timelineEnd.getTime());
    
    if (projectEnd < timelineStart.getTime() || projectStart > timelineEnd.getTime()) {
      return null; // Project not visible in current timeline
    }
    
    const leftPercent = ((projectStart - timelineStart.getTime()) / totalDuration) * 100;
    const widthPercent = ((projectEnd - projectStart) / totalDuration) * 100;
    
    return {
      left: Math.max(0, leftPercent),
      width: Math.max(1, widthPercent),
      isPartial: startDate.getTime() < timelineStart.getTime() || endDate.getTime() > timelineEnd.getTime()
    };
  };

  const navigateTimeline = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    if (timelineView === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (timelineView === 'quarter') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 3 : -3));
    } else {
      newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
    }
    
    setCurrentDate(newDate);
  };

  const getTimelineHeaderText = () => {
    if (timelineView === 'month') {
      return currentDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    } else if (timelineView === 'quarter') {
      const quarter = Math.floor(currentDate.getMonth() / 3) + 1;
      return `Q${quarter} ${currentDate.getFullYear()}`;
    } else {
      return currentDate.getFullYear().toString();
    }
  };

  const getDateLabel = (date: Date) => {
    if (timelineView === 'month') {
      return date.getDate().toString();
    } else if (timelineView === 'quarter') {
      return date.toLocaleDateString('en-GB', { month: 'short' });
    } else {
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      return `Q${quarter}`;
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Timeline Controls */}
      <div className="flex items-center justify-between p-4 bg-white border-b">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateTimeline('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="font-semibold text-lg">{getTimelineHeaderText()}</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateTimeline('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={(value) => setFilter(value as TimelineFilter)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={timelineView} onValueChange={(value) => setTimelineView(value as TimelineView)}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="quarter">Quarter</SelectItem>
              <SelectItem value="year">Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Timeline Header */}
      <div className="flex bg-gray-50 border-b">
        <div className="w-80 p-3 border-r bg-white">
          <div className="font-medium text-sm">Project</div>
        </div>
        <div className="flex-1 p-3">
          <div className="grid grid-cols-10 gap-1 text-xs text-center">
            {timelineDates.slice(0, 10).map((date, index) => (
              <div key={index} className="text-muted-foreground">
                {getDateLabel(date)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 overflow-y-auto">
        {filteredProjects.map((project, index) => {
          const timelineData = getProjectTimelineData(project);
          const daysRemaining = project.endDate ? getDaysRemaining(project.endDate) : null;
          const isOverdue = daysRemaining !== null && daysRemaining < 0;

          return (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex border-b hover:bg-gray-50"
            >
              {/* Project Info Panel */}
              <div className="w-80 p-3 border-r bg-white">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      {project.image ? (
                        <img src={project.image} alt={project.name} className="w-full h-full object-cover rounded" />
                      ) : (
                        <Building className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div 
                        className="font-medium text-sm truncate cursor-pointer hover:text-primary"
                        onClick={() => onProjectClick(project)}
                      >
                        {project.name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {project.client}
                      </div>
                    </div>
                    {project.priority && (
                      <Star className={`h-3 w-3 ${
                        project.priority === 'high' ? 'text-red-500 fill-red-500' :
                        project.priority === 'medium' ? 'text-yellow-500 fill-yellow-500' :
                        'text-green-500'
                      }`} />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(project.startDate)}</span>
                    </div>
                    {project.endDate && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span className={isOverdue ? 'text-red-600' : ''}>
                          {formatDate(project.endDate)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${getStatusColor(project.status).replace('bg-', 'bg-').replace('500', '100 text-')}${getStatusColor(project.status).split('-')[1]}-800`} variant="outline">
                      {project.status.replace('_', ' ')}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {project.progress}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline Bar */}
              <div className="flex-1 p-3 relative">
                <div className="relative h-6 bg-gray-100 rounded">
                  {timelineData && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${timelineData.width}%` }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className={`absolute top-0 h-full rounded cursor-pointer group ${getStatusColor(project.status)} ${getPriorityColor(project.priority || '')} border-l-4`}
                      style={{ left: `${timelineData.left}%` }}
                      onClick={() => onProjectClick(project)}
                    >
                      {/* Progress overlay */}
                      <div 
                        className="h-full bg-white/20 rounded-r transition-all group-hover:bg-white/30"
                        style={{ width: `${project.progress}%` }}
                      />
                      
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                          {project.name} ({project.progress}%)
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  {/* Current date indicator */}
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                    style={{ 
                      left: `${((new Date().getTime() - timelineDates[0].getTime()) / (timelineDates[timelineDates.length - 1].getTime() - timelineDates[0].getTime())) * 100}%` 
                    }}
                  >
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full" />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
        
        {/* Empty State */}
        {filteredProjects.length === 0 && (
          <div className="flex items-center justify-center py-12 text-center">
            <div className="text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <div className="text-sm">No projects found for the selected filter</div>
              <div className="text-xs mt-1">Try adjusting your filters or date range</div>
            </div>
          </div>
        )}
      </div>

      {/* Timeline Legend */}
      <div className="border-t p-3 bg-gray-50">
        <div className="flex items-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded" />
            <span>Planning</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded" />
            <span>Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded" />
            <span>On Hold</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-500 rounded" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <div className="w-0.5 h-3 bg-red-500" />
            <span>Today</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectTimelineLayout;