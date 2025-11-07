import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutGrid, 
  List,
  Grid3x3,
  Kanban,
  BarChart3,
  Calendar,
  Map,
  Filter,
  Search,
  Settings,
  Sparkles,
  Eye,
  Building,
  TrendingUp,
  Users
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import ProjectGridLayout from './ProjectGridLayout';
import ProjectListLayout from './ProjectListLayout';
import ProjectKanbanLayout from './ProjectKanbanLayout';
import ProjectTimelineLayout from './ProjectTimelineLayout';
import ProjectMapLayout from './ProjectMapLayout';
import ProjectAnalyticsLayout from './ProjectAnalyticsLayout';

interface ProjectsLayoutTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  layout: 'grid' | 'list' | 'kanban' | 'timeline' | 'map' | 'analytics';
  features: string[];
  recommended: boolean;
}

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

interface ProjectsLayoutManagerProps {
  onLayoutChange: (layout: string) => void;
  currentLayout: string;
  showSearch?: boolean;
  showFilters?: boolean;
  projects?: Project[];
  onProjectClick?: (project: Project) => void;
  onProjectEdit?: (project: Project) => void;
  onProjectArchive?: (project: Project) => void;
  onProjectMove?: (projectId: string, newStatus: string) => void;
}

const PROJECT_LAYOUTS: ProjectsLayoutTemplate[] = [
  {
    id: 'executive-overview',
    name: 'Executive Overview',
    description: 'High-level project metrics with financial insights',
    icon: TrendingUp,
    layout: 'analytics',
    features: ['Revenue tracking', 'Project ROI', 'Team utilization', 'Client satisfaction'],
    recommended: true
  },
  {
    id: 'project-portfolio',
    name: 'Project Portfolio',
    description: 'Beautiful grid view showcasing all projects with images',
    icon: LayoutGrid,
    layout: 'grid',
    features: ['Project images', 'Progress indicators', 'Status badges', 'Quick actions'],
    recommended: true
  },
  {
    id: 'detailed-list',
    name: 'Detailed List',
    description: 'Comprehensive list with all project details and metadata',
    icon: List,
    layout: 'list',
    features: ['Sortable columns', 'Detailed metadata', 'Bulk actions', 'Advanced filters'],
    recommended: false
  },
  {
    id: 'kanban-board',
    name: 'Project Kanban',
    description: 'Manage projects by status with drag-and-drop interface',
    icon: Kanban,
    layout: 'kanban',
    features: ['Drag & drop', 'Status tracking', 'Priority indicators', 'Team assignments'],
    recommended: true
  },
  {
    id: 'timeline-gantt',
    name: 'Timeline View',
    description: 'Gantt-style timeline showing project schedules and dependencies',
    icon: Calendar,
    layout: 'timeline',
    features: ['Gantt charts', 'Dependencies', 'Critical path', 'Resource allocation'],
    recommended: false
  },
  {
    id: 'geographic-map',
    name: 'Geographic Map',
    description: 'Location-based view of projects across Malaysia',
    icon: Map,
    layout: 'map',
    features: ['Interactive map', 'Location clustering', 'Site photos', 'Regional insights'],
    recommended: false
  }
];

export const ProjectsLayoutManager: React.FC<ProjectsLayoutManagerProps> = ({
  onLayoutChange,
  currentLayout,
  showSearch = true,
  showFilters = true,
  projects = [],
  onProjectClick = () => {},
  onProjectEdit,
  onProjectArchive,
  onProjectMove
}) => {
  const [showTemplates, setShowTemplates] = useState(false);

  const getCurrentTemplate = () => {
    return PROJECT_LAYOUTS.find(template => template.layout === currentLayout) || PROJECT_LAYOUTS[0];
  };

  const handleTemplateSelect = (template: ProjectsLayoutTemplate) => {
    onLayoutChange(template.layout);
    setShowTemplates(false);
  };

  // Render layout content based on current layout
  const renderLayoutContent = () => {
    switch (currentLayout) {
      case 'grid':
        return (
          <ProjectGridLayout
            projects={projects}
            onProjectClick={onProjectClick}
            onProjectEdit={onProjectEdit}
            onProjectArchive={onProjectArchive}
          />
        );
      case 'list':
        return (
          <ProjectListLayout
            projects={projects}
            onProjectClick={onProjectClick}
            onProjectEdit={onProjectEdit}
            onProjectArchive={onProjectArchive}
          />
        );
      case 'kanban':
        return (
          <ProjectKanbanLayout
            projects={projects}
            onProjectClick={onProjectClick}
            onProjectEdit={onProjectEdit}
            onProjectArchive={onProjectArchive}
            onProjectMove={onProjectMove}
          />
        );
      case 'timeline':
        return (
          <ProjectTimelineLayout
            projects={projects}
            onProjectClick={onProjectClick}
            onProjectEdit={onProjectEdit}
            onProjectArchive={onProjectArchive}
          />
        );
      case 'map':
        return (
          <ProjectMapLayout
            projects={projects}
            onProjectClick={onProjectClick}
            onProjectEdit={onProjectEdit}
            onProjectArchive={onProjectArchive}
          />
        );
      case 'analytics':
        return (
          <ProjectAnalyticsLayout
            projects={projects}
            onProjectClick={onProjectClick}
          />
        );
      default:
        return (
          <ProjectGridLayout
            projects={projects}
            onProjectClick={onProjectClick}
            onProjectEdit={onProjectEdit}
            onProjectArchive={onProjectArchive}
          />
        );
    }
  };

  if (showTemplates) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Choose Layout Template</h3>
            <p className="text-sm text-muted-foreground">
              Select the best way to view and manage your projects
            </p>
          </div>
          <Button variant="outline" onClick={() => setShowTemplates(false)}>
            Cancel
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PROJECT_LAYOUTS.map((template) => {
            const Icon = template.icon;
            const isActive = template.layout === currentLayout;
            
            return (
              <motion.div
                key={template.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  className={`cursor-pointer transition-all duration-200 ${
                    isActive 
                      ? 'ring-2 ring-primary border-primary' 
                      : 'hover:shadow-lg hover:border-primary/50'
                  }`}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-primary" />
                        <CardTitle className="text-base">{template.name}</CardTitle>
                      </div>
                      {template.recommended && (
                        <Badge variant="secondary" className="text-xs">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Recommended
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-sm">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-2">Features:</div>
                        <div className="flex flex-wrap gap-1">
                          {template.features.map((feature, index) => (
                            <Badge key={index} variant="outline" className="text-xs py-0">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2">
                        <div className="text-xs text-muted-foreground">
                          Layout: {template.layout}
                        </div>
                        <Button size="sm" variant={isActive ? "default" : "outline"}>
                          {isActive ? (
                            <>
                              <Eye className="h-4 w-4 mr-1" />
                              Current
                            </>
                          ) : (
                            'Apply'
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  const currentTemplate = getCurrentTemplate();
  const CurrentIcon = currentTemplate.icon;

  return (
    <div className="flex flex-col h-full">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-white border-b px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Current Layout Info */}
          <div className="flex items-center gap-2">
            <CurrentIcon className="h-5 w-5 text-primary" />
            <div>
              <div className="font-medium text-sm">{currentTemplate.name}</div>
              <div className="text-xs text-muted-foreground">{currentTemplate.description}</div>
            </div>
          </div>

          {/* Layout Toggle Buttons */}
          <div className="flex items-center gap-1">
            {PROJECT_LAYOUTS.filter(t => t.recommended).map((template) => {
              const Icon = template.icon;
              const isActive = template.layout === currentLayout;
              
              return (
                <Button
                  key={template.id}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onLayoutChange(template.layout)}
                  className="h-8 px-2"
                >
                  <Icon className="h-4 w-4" />
                </Button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          {showSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                className="pl-10 w-64"
              />
            </div>
          )}

          {/* Filters */}
          {showFilters && (
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-1" />
              Filters
            </Button>
          )}

          {/* Template Selector */}
          <Button variant="outline" size="sm" onClick={() => setShowTemplates(true)}>
            <Sparkles className="h-4 w-4 mr-1" />
            Templates
          </Button>

          {/* Settings */}
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Layout Content */}
      <div className="flex-1 overflow-hidden">
        {renderLayoutContent()}
      </div>
    </div>
  );
};

export default ProjectsLayoutManager;