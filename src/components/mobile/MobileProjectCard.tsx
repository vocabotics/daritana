import React from 'react';
import { 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign,
  MoreVertical,
  Clock,
  TrendingUp
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface MobileProjectCardProps {
  project: {
    id: string;
    name: string;
    description: string;
    type: string;
    status: string;
    priority: string;
    progress: number;
    budget: number;
    startDate: string;
    endDate: string;
    location: string;
    teamSize: number;
    clientName: string;
    image?: string;
  };
  onView: () => void;
  onEdit: () => void;
  variant?: 'card' | 'list';
}

export const MobileProjectCard: React.FC<MobileProjectCardProps> = ({
  project,
  onView,
  onEdit,
  variant = 'card'
}) => {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      planning: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      on_hold: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (variant === 'list') {
    return (
      <Card className="p-4 mb-3" onClick={onView}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-base line-clamp-1">{project.name}</h3>
            <p className="text-sm text-gray-500">{project.clientName}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(); }}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                Edit Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex gap-2 mb-2">
          <Badge className={cn(getStatusColor(project.status), 'text-xs')}>
            {project.status.replace('_', ' ')}
          </Badge>
          <Badge className={cn(getPriorityColor(project.priority), 'text-xs')}>
            {project.priority}
          </Badge>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Progress</span>
            <span>{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-1.5" />
        </div>

        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>{project.location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{format(new Date(project.endDate), 'MMM dd')}</span>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden" onClick={onView}>
      {/* Project Image or Gradient */}
      <div className="relative h-32 bg-gradient-to-br from-blue-500 to-purple-600">
        {project.image ? (
          <img 
            src={project.image} 
            alt={project.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white text-4xl font-bold opacity-50">
              {project.name.charAt(0)}
            </span>
          </div>
        )}
        
        {/* Status Badge */}
        <Badge 
          className={cn(
            getStatusColor(project.status),
            'absolute top-2 left-2 text-xs'
          )}
        >
          {project.status.replace('_', ' ')}
        </Badge>

        {/* More Options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button 
              variant="secondary" 
              size="icon" 
              className="absolute top-2 right-2 h-7 w-7 bg-white/90"
            >
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(); }}>
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
              Edit Project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Project Details */}
      <div className="p-4">
        <div className="mb-3">
          <h3 className="font-semibold text-lg line-clamp-1">{project.name}</h3>
          <p className="text-sm text-gray-500 line-clamp-2">{project.description}</p>
        </div>

        {/* Priority Badge */}
        <div className="flex items-center justify-between mb-3">
          <Badge className={cn(getPriorityColor(project.priority), 'text-xs')}>
            {project.priority} priority
          </Badge>
          <span className="text-xs text-gray-500">{project.type}</span>
        </div>

        {/* Progress */}
        <div className="space-y-1 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 rounded">
              <Users className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Team</p>
              <p className="text-sm font-medium">{project.teamSize}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-green-50 rounded">
              <DollarSign className="h-3.5 w-3.5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Budget</p>
              <p className="text-sm font-medium">{formatCurrency(project.budget)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-50 rounded">
              <MapPin className="h-3.5 w-3.5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Location</p>
              <p className="text-sm font-medium line-clamp-1">{project.location}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-orange-50 rounded">
              <Calendar className="h-3.5 w-3.5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Deadline</p>
              <p className="text-sm font-medium">{format(new Date(project.endDate), 'MMM dd')}</p>
            </div>
          </div>
        </div>

        {/* Client Info */}
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Client</p>
              <p className="text-sm font-medium">{project.clientName}</p>
            </div>
            
            {/* Quick Stats */}
            <div className="flex items-center gap-2">
              {project.progress === 100 && (
                <Badge variant="outline" className="text-xs bg-green-50">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              )}
              {new Date(project.endDate) < new Date() && project.progress < 100 && (
                <Badge variant="outline" className="text-xs bg-red-50 text-red-600">
                  <Clock className="h-3 w-3 mr-1" />
                  Overdue
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};