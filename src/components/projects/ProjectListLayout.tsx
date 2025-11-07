import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
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
  ChevronRight,
  SortAsc,
  SortDesc,
  ArrowUpDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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

interface ProjectListLayoutProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
  onProjectEdit?: (project: Project) => void;
  onProjectArchive?: (project: Project) => void;
}

type SortField = 'name' | 'status' | 'progress' | 'budget' | 'startDate' | 'endDate' | 'client' | 'priority';
type SortDirection = 'asc' | 'desc' | null;

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
      return <Star className="h-4 w-4 text-red-500 fill-red-500" />;
    case 'medium':
      return <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />;
    case 'low':
      return <Star className="h-4 w-4 text-green-500" />;
    default:
      return null;
  }
};

export const ProjectListLayout: React.FC<ProjectListLayoutProps> = ({
  projects,
  onProjectClick,
  onProjectEdit,
  onProjectArchive
}) => {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? null : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    if (sortDirection === 'asc') return <SortAsc className="h-4 w-4 text-primary" />;
    if (sortDirection === 'desc') return <SortDesc className="h-4 w-4 text-primary" />;
    return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
  };

  const sortedProjects = [...projects].sort((a, b) => {
    if (!sortDirection) return 0;
    
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];
    
    if (sortField === 'startDate' || sortField === 'endDate') {
      aValue = aValue?.getTime() || 0;
      bValue = bValue?.getTime() || 0;
    }
    
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const toggleRowExpansion = (projectId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedRows(newExpanded);
  };

  return (
    <div className="w-full">
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b">
                <TableHead className="w-12"></TableHead>
                <TableHead className="min-w-[200px]">
                  <Button variant="ghost" onClick={() => handleSort('name')} className="h-auto p-0 font-medium">
                    Project
                    {getSortIcon('name')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('status')} className="h-auto p-0 font-medium">
                    Status
                    {getSortIcon('status')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('progress')} className="h-auto p-0 font-medium">
                    Progress
                    {getSortIcon('progress')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('client')} className="h-auto p-0 font-medium">
                    Client
                    {getSortIcon('client')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('budget')} className="h-auto p-0 font-medium">
                    Budget
                    {getSortIcon('budget')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('endDate')} className="h-auto p-0 font-medium">
                    Deadline
                    {getSortIcon('endDate')}
                  </Button>
                </TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedProjects.map((project, index) => {
                const isExpanded = expandedRows.has(project.id);
                const daysRemaining = project.endDate ? getDaysRemaining(project.endDate) : null;
                const isOverdue = daysRemaining !== null && daysRemaining < 0;
                
                return (
                  <React.Fragment key={project.id}>
                    <motion.tr
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b hover:bg-muted/50 cursor-pointer"
                    >
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRowExpansion(project.id)}
                          className="h-6 w-6 p-0"
                        >
                          <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </Button>
                      </TableCell>
                      
                      <TableCell onClick={() => onProjectClick(project)}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                            {project.image ? (
                              <img src={project.image} alt={project.name} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <Building className="h-5 w-5 text-white" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <div className="font-medium text-sm truncate">{project.name}</div>
                              {project.priority && getPriorityIcon(project.priority)}
                            </div>
                            {project.description && (
                              <div className="text-xs text-muted-foreground truncate mt-0.5">
                                {project.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge className={getStatusColor(project.status)} variant="outline">
                          {project.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[80px]">
                          <Progress value={project.progress} className="h-2 flex-1" />
                          <span className="text-xs font-medium w-8">{project.progress}%</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm truncate">{project.client}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {project.budget && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm">{formatCurrency(project.budget)}</span>
                          </div>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {project.endDate && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="text-sm">
                              <div className={isOverdue ? 'text-red-600 font-medium' : 'text-foreground'}>
                                {formatDate(project.endDate)}
                              </div>
                              <div className={`text-xs ${isOverdue ? 'text-red-600' : 'text-muted-foreground'}`}>
                                {isOverdue 
                                  ? `${Math.abs(daysRemaining!)} days overdue`
                                  : `${daysRemaining} days left`
                                }
                              </div>
                            </div>
                          </div>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex -space-x-1">
                          {project.team.slice(0, 3).map((member, idx) => (
                            <Avatar key={idx} className="w-6 h-6 border-2 border-background">
                              <AvatarFallback className="text-xs">{member[0]}</AvatarFallback>
                            </Avatar>
                          ))}
                          {project.team.length > 3 && (
                            <div className="w-6 h-6 bg-muted rounded-full border-2 border-background flex items-center justify-center">
                              <span className="text-xs">+{project.team.length - 3}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
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
                      </TableCell>
                    </motion.tr>
                    
                    {/* Expanded Row Details */}
                    {isExpanded && (
                      <motion.tr
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <TableCell colSpan={9} className="bg-muted/30 p-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="font-medium mb-2">Project Details</div>
                              <div className="space-y-1 text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  <span>{project.location}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Building className="h-4 w-4" />
                                  <span>{project.type}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  <span>Started: {formatDate(project.startDate)}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <div className="font-medium mb-2">Team Members</div>
                              <div className="space-y-1">
                                {project.team.map((member, idx) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <Avatar className="w-5 h-5">
                                      <AvatarFallback className="text-xs">{member[0]}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-muted-foreground">{member}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <div className="font-medium mb-2">Quick Actions</div>
                              <div className="flex flex-wrap gap-2">
                                <Button size="sm" variant="outline" onClick={() => onProjectClick(project)}>
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                                {onProjectEdit && (
                                  <Button size="sm" variant="outline" onClick={() => onProjectEdit(project)}>
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </motion.tr>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectListLayout;