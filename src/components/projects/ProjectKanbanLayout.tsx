import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  Archive,
  Plus
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

interface ProjectKanbanLayoutProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
  onProjectEdit?: (project: Project) => void;
  onProjectArchive?: (project: Project) => void;
  onProjectMove?: (projectId: string, newStatus: string) => void;
}

const STATUSES = [
  { id: 'planning', name: 'Planning', color: 'bg-blue-100 border-blue-200', count: 0 },
  { id: 'active', name: 'Active', color: 'bg-green-100 border-green-200', count: 0 },
  { id: 'on_hold', name: 'On Hold', color: 'bg-yellow-100 border-yellow-200', count: 0 },
  { id: 'completed', name: 'Completed', color: 'bg-gray-100 border-gray-200', count: 0 },
  { id: 'cancelled', name: 'Cancelled', color: 'bg-red-100 border-red-200', count: 0 }
];

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

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'high':
      return <Star className="h-3 w-3 text-red-500 fill-red-500" />;
    case 'medium':
      return <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />;
    case 'low':
      return <Star className="h-3 w-3 text-green-500" />;
    default:
      return null;
  }
};

export const ProjectKanbanLayout: React.FC<ProjectKanbanLayoutProps> = ({
  projects,
  onProjectClick,
  onProjectEdit,
  onProjectArchive,
  onProjectMove
}) => {
  const [draggedProject, setDraggedProject] = useState<string | null>(null);

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
      month: 'short'
    });
  };

  const getDaysRemaining = (endDate: Date) => {
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Group projects by status
  const projectsByStatus = STATUSES.map(status => {
    const statusProjects = projects.filter(project => 
      project.status.toLowerCase() === status.id.toLowerCase()
    );
    return {
      ...status,
      count: statusProjects.length,
      projects: statusProjects
    };
  });

  const handleDragStart = (projectId: string) => {
    setDraggedProject(projectId);
  };

  const handleDragEnd = () => {
    setDraggedProject(null);
  };

  const handleDrop = (statusId: string) => {
    if (draggedProject && onProjectMove) {
      onProjectMove(draggedProject, statusId);
    }
    setDraggedProject(null);
  };

  const ProjectCard: React.FC<{ project: Project; isDragged?: boolean }> = ({ project, isDragged = false }) => {
    const daysRemaining = project.endDate ? getDaysRemaining(project.endDate) : null;
    const isOverdue = daysRemaining !== null && daysRemaining < 0;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileHover={{ y: -2 }}
        className={`${isDragged ? 'opacity-50' : ''}`}
        draggable={!!onProjectMove}
        onDragStart={() => handleDragStart(project.id)}
        onDragEnd={handleDragEnd}
      >
        <Card className="group hover:shadow-md transition-all duration-200 cursor-pointer">
          {/* Project Image/Header */}
          <div 
            className="h-20 bg-gradient-to-br from-blue-500 to-purple-600 relative overflow-hidden rounded-t-lg"
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
                <Building className="h-8 w-8 text-white/80" />
              </div>
            )}
            
            {/* Overlay with actions */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            
            {/* Quick Actions */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon" className="h-6 w-6 bg-white/90 hover:bg-white">
                    <MoreVertical className="h-3 w-3" />
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

            {/* Priority Badge */}
            {project.priority && (
              <div className="absolute top-2 left-2">
                {getPriorityIcon(project.priority)}
              </div>
            )}
          </div>

          <CardContent className="p-3 space-y-3">
            {/* Project Name */}
            <div 
              className="font-medium text-sm line-clamp-2 cursor-pointer hover:text-primary transition-colors"
              onClick={() => onProjectClick(project)}
            >
              {project.name}
            </div>

            {/* Client */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{project.client}</span>
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{project.location}</span>
            </div>

            {/* Progress */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="h-1.5" />
            </div>

            {/* Budget */}
            {project.budget && (
              <div className="flex items-center gap-2 text-xs">
                <DollarSign className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">{formatCurrency(project.budget)}</span>
              </div>
            )}

            {/* Deadline */}
            {project.endDate && (
              <div className="flex items-center gap-2 text-xs">
                <Clock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <span className={`${isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                  {formatDate(project.endDate)}
                  {isOverdue && ` (${Math.abs(daysRemaining!)} days overdue)`}
                  {!isOverdue && daysRemaining! <= 7 && ` (${daysRemaining} days left)`}
                </span>
              </div>
            )}

            {/* Team */}
            {project.team.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Team</span>
                <div className="flex -space-x-1">
                  {project.team.slice(0, 3).map((member, idx) => (
                    <Avatar key={idx} className="w-5 h-5 border border-background">
                      <AvatarFallback className="text-xs">{member[0]}</AvatarFallback>
                    </Avatar>
                  ))}
                  {project.team.length > 3 && (
                    <div className="w-5 h-5 bg-muted rounded-full border border-background flex items-center justify-center">
                      <span className="text-xs">+{project.team.length - 3}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="flex gap-4 p-4 min-h-screen overflow-x-auto">
      {projectsByStatus.map((status) => (
        <div 
          key={status.id} 
          className="flex-shrink-0 w-72"
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(status.id)}
        >
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${status.color.split(' ')[0]}`} />
                  {status.name}
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {status.count}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
              <AnimatePresence>
                {status.projects.map((project) => (
                  <ProjectCard 
                    key={project.id} 
                    project={project}
                    isDragged={draggedProject === project.id}
                  />
                ))}
              </AnimatePresence>
              
              {/* Add Project Button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3"
              >
                <Button 
                  variant="outline" 
                  className="w-full border-dashed border-2 h-12 text-muted-foreground hover:text-foreground hover:border-primary/50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Project
                </Button>
              </motion.div>
              
              {/* Empty State */}
              {status.projects.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground"
                >
                  <Building className="h-12 w-12 mb-3 opacity-50" />
                  <p className="text-sm">No projects in {status.name.toLowerCase()}</p>
                  <p className="text-xs mt-1">Drag projects here or create a new one</p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
};

export default ProjectKanbanLayout;