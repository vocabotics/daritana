import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  MoreVertical, 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign,
  Clock,
  Building,
  Star,
  Eye,
  Edit,
  Archive
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

interface ProjectGridLayoutProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
  onProjectEdit?: (project: Project) => void;
  onProjectArchive?: (project: Project) => void;
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'planning':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'on_hold':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'completed':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'text-red-500';
    case 'medium':
      return 'text-yellow-500';
    case 'low':
      return 'text-green-500';
    default:
      return 'text-gray-500';
  }
};

export const ProjectGridLayout: React.FC<ProjectGridLayoutProps> = ({
  projects,
  onProjectClick,
  onProjectEdit,
  onProjectArchive
}) => {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
      {projects.map((project, index) => {
        const daysRemaining = project.endDate ? getDaysRemaining(project.endDate) : null;
        const isOverdue = daysRemaining !== null && daysRemaining < 0;
        
        return (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -4 }}
          >
            <Card className="h-full hover:shadow-xl transition-all duration-300 group cursor-pointer overflow-hidden">
              {/* Project Image/Header */}
              <div 
                className="h-32 bg-gradient-to-br from-blue-500 to-purple-600 relative overflow-hidden"
                onClick={() => onProjectClick(project)}
              >
                {project.image ? (
                  <img 
                    src={project.image} 
                    alt={project.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building className="h-12 w-12 text-white/80" />
                  </div>
                )}
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Quick Actions */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="icon" className="h-8 w-8 bg-white/90 hover:bg-white">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onProjectClick(project)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      {onProjectEdit && (
                        <DropdownMenuItem onClick={() => onProjectEdit(project)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Project
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      {onProjectArchive && (
                        <DropdownMenuItem onClick={() => onProjectArchive(project)}>
                          <Archive className="mr-2 h-4 w-4" />
                          Archive
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Status & Priority Badges */}
                <div className="absolute top-2 left-2 flex gap-1">
                  <Badge className={getStatusColor(project.status)}>
                    {project.status.replace('_', ' ')}
                  </Badge>
                  {project.priority && (
                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(project.priority)} bg-current`} />
                  )}
                </div>
              </div>

              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle 
                    className="text-base font-semibold line-clamp-2 cursor-pointer hover:text-primary transition-colors"
                    onClick={() => onProjectClick(project)}
                  >
                    {project.name}
                  </CardTitle>
                  <div className="flex items-center">
                    {project.priority === 'high' && <Star className="h-4 w-4 text-yellow-500" />}
                  </div>
                </div>
                {project.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {project.description}
                  </p>
                )}
              </CardHeader>

              <CardContent className="pt-2">
                <div className="space-y-3">
                  {/* Progress */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>

                  {/* Key Details */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground truncate">{project.location}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">{project.client}</span>
                    </div>

                    {project.budget && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">{formatCurrency(project.budget)}</span>
                      </div>
                    )}

                    {project.endDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className={`${isOverdue ? 'text-red-600' : 'text-muted-foreground'}`}>
                          {isOverdue 
                            ? `${Math.abs(daysRemaining!)} days overdue`
                            : `${daysRemaining} days remaining`
                          }
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Team Avatars */}
                  {project.team.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Team:</span>
                      <div className="flex -space-x-2">
                        {project.team.slice(0, 3).map((member, idx) => (
                          <div
                            key={idx}
                            className="w-6 h-6 bg-gray-300 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium"
                          >
                            {member[0]}
                          </div>
                        ))}
                        {project.team.length > 3 && (
                          <div className="w-6 h-6 bg-gray-200 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium">
                            +{project.team.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ProjectGridLayout;