import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { 
  MapPin, 
  Users, 
  DollarSign,
  Clock,
  Building,
  Star,
  Eye,
  Edit,
  Archive,
  Search,
  Filter,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Navigation,
  Layers,
  X,
  Calendar,
  Phone,
  Mail
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  coordinates?: { lat: number; lng: number };
}

interface ProjectMapLayoutProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
  onProjectEdit?: (project: Project) => void;
  onProjectArchive?: (project: Project) => void;
}

// Mock coordinates for Malaysian locations
const locationCoordinates: { [key: string]: { lat: number; lng: number } } = {
  'KLCC, Kuala Lumpur': { lat: 3.1578, lng: 101.7118 },
  'George Town, Penang': { lat: 5.4141, lng: 100.3288 },
  'Johor Bahru': { lat: 1.4655, lng: 103.7578 },
  'Ipoh, Perak': { lat: 4.5841, lng: 101.0829 },
  'Shah Alam, Selangor': { lat: 3.0733, lng: 101.5185 },
  'Kota Kinabalu, Sabah': { lat: 5.9804, lng: 116.0735 },
  'Kuching, Sarawak': { lat: 1.5579, lng: 110.3392 },
  'Melaka': { lat: 2.1896, lng: 102.2501 },
  'Alor Setar, Kedah': { lat: 6.1239, lng: 100.3710 },
  'Kuantan, Pahang': { lat: 3.8126, lng: 103.3256 },
};

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
      return 'ring-red-500';
    case 'medium':
      return 'ring-yellow-500';
    case 'low':
      return 'ring-green-500';
    default:
      return 'ring-gray-300';
  }
};

export const ProjectMapLayout: React.FC<ProjectMapLayoutProps> = ({
  projects,
  onProjectClick,
  onProjectEdit,
  onProjectArchive
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 3.1390, lng: 101.6869 }); // Malaysia center
  const [mapZoom, setMapZoom] = useState(6);
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);

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

  // Filter projects
  const filteredProjects = projects
    .filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          project.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          project.client.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || project.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    })
    .map(project => ({
      ...project,
      coordinates: project.coordinates || locationCoordinates[project.location] || 
                  locationCoordinates[Object.keys(locationCoordinates).find(key => 
                    project.location.toLowerCase().includes(key.toLowerCase().split(',')[0].toLowerCase())
                  ) || ''] || { lat: 3.1390, lng: 101.6869 }
    }));

  // Group projects by location for clustering
  const projectClusters = filteredProjects.reduce((clusters, project) => {
    const key = `${project.coordinates.lat.toFixed(3)},${project.coordinates.lng.toFixed(3)}`;
    if (!clusters[key]) {
      clusters[key] = [];
    }
    clusters[key].push(project);
    return clusters;
  }, {} as { [key: string]: Project[] });

  const handleMarkerClick = (project: Project) => {
    setSelectedProject(project);
    setMapCenter(project.coordinates!);
    setMapZoom(12);
  };

  const handleZoomIn = () => {
    setMapZoom(prev => Math.min(prev + 1, 18));
  };

  const handleZoomOut = () => {
    setMapZoom(prev => Math.max(prev - 1, 5));
  };

  const handleResetView = () => {
    setMapCenter({ lat: 3.1390, lng: 101.6869 });
    setMapZoom(6);
    setSelectedProject(null);
  };

  // Calculate marker position on the map (simplified positioning)
  const getMarkerPosition = (coordinates: { lat: number; lng: number }) => {
    const mapWidth = 800; // Assuming map width
    const mapHeight = 600; // Assuming map height
    
    // Simple linear interpolation for Malaysia bounds
    const latRange = { min: 0.8, max: 7.0 };
    const lngRange = { min: 99.6, max: 119.3 };
    
    const x = ((coordinates.lng - lngRange.min) / (lngRange.max - lngRange.min)) * mapWidth;
    const y = mapHeight - ((coordinates.lat - latRange.min) / (latRange.max - latRange.min)) * mapHeight;
    
    return { x: Math.max(0, Math.min(mapWidth, x)), y: Math.max(0, Math.min(mapHeight, y)) };
  };

  return (
    <div className="w-full h-full flex">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r flex flex-col">
        {/* Search and Filters */}
        <div className="p-4 border-b space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects, locations..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredProjects.map((project) => {
            const daysRemaining = project.endDate ? getDaysRemaining(project.endDate) : null;
            const isOverdue = daysRemaining !== null && daysRemaining < 0;
            const isHovered = hoveredProject === project.id;
            const isSelected = selectedProject?.id === project.id;

            return (
              <motion.div
                key={project.id}
                layout
                className={`cursor-pointer transition-all ${
                  isSelected ? 'ring-2 ring-primary' : isHovered ? 'shadow-md' : 'shadow-sm'
                }`}
                onMouseEnter={() => setHoveredProject(project.id)}
                onMouseLeave={() => setHoveredProject(null)}
                onClick={() => handleMarkerClick(project)}
              >
                <Card>
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{project.name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {project.client}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          {project.priority && (
                            <Star className={`h-3 w-3 ${
                              project.priority === 'high' ? 'text-red-500 fill-red-500' :
                              project.priority === 'medium' ? 'text-yellow-500 fill-yellow-500' :
                              'text-green-500'
                            }`} />
                          )}
                          <Badge className={`${getStatusColor(project.status).replace('bg-', 'bg-').replace('500', '100 text-')}${getStatusColor(project.status).split('-')[1]}-800`} variant="outline">
                            {project.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{project.location}</span>
                      </div>

                      {/* Progress */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="h-1.5" />
                      </div>

                      {/* Additional Info */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        {project.budget && (
                          <span>{formatCurrency(project.budget)}</span>
                        )}
                        {project.endDate && (
                          <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                            {isOverdue ? `${Math.abs(daysRemaining!)} days overdue` : `${daysRemaining} days left`}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}

          {filteredProjects.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <div className="text-sm">No projects found</div>
              <div className="text-xs mt-1">Try adjusting your search or filters</div>
            </div>
          )}
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative bg-gray-100">
        {/* Map Controls */}
        <div className="absolute top-4 right-4 z-10 space-y-2">
          <div className="bg-white rounded-lg shadow-lg p-2 space-y-1">
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleResetView}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Map Background */}
        <div className="w-full h-full bg-gradient-to-br from-blue-50 to-green-50 relative overflow-hidden">
          {/* Simplified Malaysia Map Outline */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl text-blue-200 opacity-50">
              🗺️
            </div>
          </div>

          {/* Project Markers */}
          <div className="absolute inset-0">
            {Object.entries(projectClusters).map(([key, clusterProjects]) => {
              const mainProject = clusterProjects[0];
              const position = getMarkerPosition(mainProject.coordinates!);
              const isCluster = clusterProjects.length > 1;
              const isHovered = clusterProjects.some(p => hoveredProject === p.id);
              const isSelected = clusterProjects.some(p => selectedProject?.id === p.id);

              return (
                <motion.div
                  key={key}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                  style={{ left: position.x, top: position.y }}
                  initial={{ scale: 0 }}
                  animate={{ 
                    scale: isHovered ? 1.2 : 1,
                    zIndex: isSelected ? 20 : isHovered ? 10 : 1
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  onClick={() => {
                    if (isCluster && clusterProjects.length > 1) {
                      // Show cluster popup or zoom to area
                      setSelectedProject(mainProject);
                    } else {
                      handleMarkerClick(mainProject);
                    }
                  }}
                >
                  <div className={`relative ${getPriorityColor(mainProject.priority || '')} ring-2`}>
                    <div className={`w-8 h-8 rounded-full ${getStatusColor(mainProject.status)} flex items-center justify-center text-white text-xs font-bold shadow-lg`}>
                      {isCluster ? clusterProjects.length : '1'}
                    </div>
                    
                    {/* Marker Label */}
                    <div className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                      {isCluster ? `${clusterProjects.length} projects` : mainProject.name}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Project Detail Popup */}
        <AnimatePresence>
          {selectedProject && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="absolute bottom-4 left-4 right-4 z-20"
            >
              <Card className="shadow-xl">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{selectedProject.name}</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedProject(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Project Info */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge className={`${getStatusColor(selectedProject.status).replace('bg-', 'bg-').replace('500', '100 text-')}${getStatusColor(selectedProject.status).split('-')[1]}-800`} variant="outline">
                          {selectedProject.status.replace('_', ' ')}
                        </Badge>
                        {selectedProject.priority && (
                          <Star className={`h-4 w-4 ${
                            selectedProject.priority === 'high' ? 'text-red-500 fill-red-500' :
                            selectedProject.priority === 'medium' ? 'text-yellow-500 fill-yellow-500' :
                            'text-green-500'
                          }`} />
                        )}
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedProject.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedProject.client}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedProject.type}</span>
                        </div>
                        {selectedProject.budget && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span>{formatCurrency(selectedProject.budget)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress & Timeline */}
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span>Progress</span>
                          <span className="font-medium">{selectedProject.progress}%</span>
                        </div>
                        <Progress value={selectedProject.progress} className="h-2" />
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Started: {formatDate(selectedProject.startDate)}</span>
                        </div>
                        {selectedProject.endDate && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>Due: {formatDate(selectedProject.endDate)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm font-medium mb-2">Team</div>
                        <div className="flex -space-x-1">
                          {selectedProject.team.slice(0, 5).map((member, idx) => (
                            <Avatar key={idx} className="w-6 h-6 border-2 border-white">
                              <AvatarFallback className="text-xs">{member[0]}</AvatarFallback>
                            </Avatar>
                          ))}
                          {selectedProject.team.length > 5 && (
                            <div className="w-6 h-6 bg-muted rounded-full border-2 border-white flex items-center justify-center text-xs">
                              +{selectedProject.team.length - 5}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => onProjectClick(selectedProject)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {onProjectEdit && (
                          <Button size="sm" variant="outline" onClick={() => onProjectEdit(selectedProject)}>
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProjectMapLayout;