import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Project } from '@/types';
import { formatDate } from '@/lib/utils';
import { Calendar, MapPin, DollarSign, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const navigate = useNavigate();
  
  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'planning':
        return 'bg-yellow-100 text-yellow-800';
      case 'design':
        return 'bg-blue-100 text-blue-800';
      case 'construction':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'on_hold':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getProgressPercentage = () => {
    const now = new Date();
    const start = new Date(project.startDate);
    const end = new Date(project.endDate);
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    return Math.min(Math.max((elapsed / total) * 100, 0), 100);
  };
  
  const progress = getProgressPercentage();
  
  return (
    <Card className="architect-border hover:minimal-shadow transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg architect-heading line-clamp-2">
            {project.name}
          </CardTitle>
          <Badge className={getStatusColor(project.status)}>
            {project.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {project.images.length > 0 && (
          <div className="aspect-video relative overflow-hidden rounded-md">
            <img
              src={project.images[0]}
              alt={project.name}
              className="object-cover w-full h-full pencil-sketch"
            />
          </div>
        )}
        
        <p className="text-sm text-gray-600 architect-text line-clamp-3">
          {project.description}
        </p>
        
        <div className="space-y-2">
          <div className="flex items-center text-xs text-gray-500">
            <MapPin className="h-3 w-3 mr-1" />
            {project.location}
          </div>
          
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="h-3 w-3 mr-1" />
            {formatDate(project.startDate)} - {formatDate(project.endDate)}
          </div>
          
          <div className="flex items-center text-xs text-gray-500">
            <DollarSign className="h-3 w-3 mr-1" />
            RM {project.budget.toLocaleString()}
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        <Button 
          variant="outline" 
          className="w-full architect-border"
          onClick={() => navigate(`/projects/${project.id}`)}
        >
          <Eye className="h-4 w-4 mr-2" />
          View Details
        </Button>
      </CardContent>
    </Card>
  );
}