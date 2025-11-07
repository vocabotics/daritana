import React, { useState, useMemo, useCallback } from 'react'
import { 
  Search, 
  Filter, 
  Plus, 
  MoreVertical,
  Calendar,
  DollarSign,
  Users,
  MapPin,
  TrendingUp,
  Clock,
  Edit,
  Trash2,
  Eye,
  CheckSquare,
  FolderOpen
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor'
import { useVirtualList, createMemoizedComponent, useOptimizedHandlers } from '@/utils/performanceOptimizations'
import { useQueryCache } from '@/utils/caching'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

// Memoized Project Card Component
const ProjectCard = createMemoizedComponent<{
  project: Project
  getStatusColor: (status: Project['status']) => string
  getPriorityColor: (priority: Project['priority']) => string
  getTypeIcon: (type: Project['type']) => string
  formatCurrency: (amount: number) => string
  onView?: (project: Project) => void
  onEdit?: (project: Project) => void
  onDelete?: (projectId: string) => void
}>(({ 
  project, 
  getStatusColor, 
  getPriorityColor, 
  getTypeIcon, 
  formatCurrency,
  onView, 
  onEdit, 
  onDelete 
}) => (
  <Card key={project.id} className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
    <div className="space-y-3">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getTypeIcon(project.type)}</span>
          <div>
            <h3 className="font-semibold text-lg">{project.name}</h3>
            <p className="text-sm text-muted-foreground">{project.clientName}</p>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView?.(project)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit?.(project)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete?.(project.id)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="text-sm line-clamp-2">{project.description}</p>

      <div className="flex gap-2">
        <Badge className={cn(getStatusColor(project.status))}>
          {project.status.replace('_', ' ')}
        </Badge>
        <Badge className={cn(getPriorityColor(project.priority))}>
          {project.priority}
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span>{project.progress}%</span>
        </div>
        <Progress value={project.progress} className="h-2" />
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3 text-gray-400" />
          <span>{project.city}</span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3 text-gray-400" />
          <span>{project.teamSize} members</span>
        </div>
        <div className="flex items-center gap-1">
          <DollarSign className="h-3 w-3 text-gray-400" />
          <span>{formatCurrency(project.budget)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3 text-gray-400" />
          <span>{format(new Date(project.endDate), 'MMM dd')}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex items-center gap-1 text-sm">
          <CheckSquare className="h-3 w-3 text-gray-400" />
          <span>{project.tasksCompleted}/{project.totalTasks} tasks</span>
        </div>
        {project.actualCost > project.budget && (
          <Badge variant="destructive" className="text-xs">
            Over Budget
          </Badge>
        )}
      </div>
    </div>
  </Card>
))

export interface Project {
  id: string
  name: string
  description: string
  type: 'renovation' | 'new_construction' | 'interior' | 'landscape' | 'commercial' | 'residential'
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  progress: number
  budget: number
  actualCost: number
  startDate: string
  endDate: string
  address: string
  city: string
  state: string
  clientName: string
  clientEmail: string
  projectLead?: string
  teamSize: number
  tasksCompleted: number
  totalTasks: number
  createdAt: string
  updatedAt: string
}

interface ProjectListProps {
  projects: Project[]
  onEdit?: (project: Project) => void
  onDelete?: (projectId: string) => void
  onView?: (project: Project) => void
  viewMode?: 'grid' | 'list'
}

export function ProjectList({ 
  projects, 
  onEdit, 
  onDelete, 
  onView,
  viewMode: initialViewMode = 'grid'
}: ProjectListProps) {
  // Performance monitoring
  usePerformanceMonitor('ProjectList')
  const { createDebouncedHandler } = useOptimizedHandlers()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('updated')
  const [viewMode, setViewMode] = useState(initialViewMode)

  // Optimized search handler with debouncing
  const debouncedSetSearchQuery = createDebouncedHandler(setSearchQuery, 300)

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let filtered = projects.filter(project => {
      const matchesSearch = 
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.city.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === 'all' || project.status === statusFilter
      const matchesType = typeFilter === 'all' || project.type === typeFilter
      const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter

      return matchesSearch && matchesStatus && matchesType && matchesPriority
    })

    // Sort projects
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'priority':
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        case 'progress':
          return b.progress - a.progress
        case 'budget':
          return b.budget - a.budget
        case 'updated':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      }
    })

    return filtered
  }, [projects, searchQuery, statusFilter, typeFilter, priorityFilter, sortBy])

  // Memoized utility functions
  const getStatusColor = useCallback((status: Project['status']) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'on_hold': return 'bg-orange-100 text-orange-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }, [])

  const getPriorityColor = useCallback((priority: Project['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }, [])

  const getTypeIcon = useCallback((type: Project['type']) => {
    switch (type) {
      case 'renovation': return '🔨'
      case 'new_construction': return '🏗️'
      case 'interior': return '🎨'
      case 'landscape': return '🌳'
      case 'commercial': return '🏢'
      case 'residential': return '🏠'
      default: return '📁'
    }
  }, [])

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 0
    }).format(amount)
  }, [])

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search projects, clients, or locations..."
            value={searchQuery}
            onChange={(e) => debouncedSetSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="renovation">Renovation</SelectItem>
              <SelectItem value="new_construction">New Construction</SelectItem>
              <SelectItem value="interior">Interior</SelectItem>
              <SelectItem value="landscape">Landscape</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
              <SelectItem value="residential">Residential</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated">Last Updated</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="progress">Progress</SelectItem>
              <SelectItem value="budget">Budget</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-1 border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <rect x="3" y="3" width="7" height="7" strokeWidth="2"/>
                <rect x="14" y="3" width="7" height="7" strokeWidth="2"/>
                <rect x="3" y="14" width="7" height="7" strokeWidth="2"/>
                <rect x="14" y="14" width="7" height="7" strokeWidth="2"/>
              </svg>
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <line x1="3" y1="6" x2="21" y2="6" strokeWidth="2"/>
                <line x1="3" y1="12" x2="21" y2="12" strokeWidth="2"/>
                <line x1="3" y1="18" x2="21" y2="18" strokeWidth="2"/>
              </svg>
            </Button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredProjects.length} of {projects.length} projects
      </div>

      {/* Grid View with Virtual Scrolling for large lists */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              getStatusColor={getStatusColor}
              getPriorityColor={getPriorityColor}
              getTypeIcon={getTypeIcon}
              formatCurrency={formatCurrency}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((project) => (
                <TableRow key={project.id} className="cursor-pointer hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getTypeIcon(project.type)}</span>
                      <div>
                        <p className="font-medium">{project.name}</p>
                        <p className="text-sm text-muted-foreground">{project.city}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{project.clientName}</TableCell>
                  <TableCell>
                    <Badge className={cn(getStatusColor(project.status))}>
                      {project.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(getPriorityColor(project.priority))}>
                      {project.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={project.progress} className="h-2 w-16" />
                      <span className="text-sm">{project.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{formatCurrency(project.budget)}</p>
                      {project.actualCost > 0 && (
                        <p className={cn(
                          "text-xs",
                          project.actualCost > project.budget ? "text-red-600" : "text-green-600"
                        )}>
                          {formatCurrency(project.actualCost)}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-gray-400" />
                      <span>{project.teamSize}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(project.endDate), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView?.(project)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit?.(project)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onDelete?.(project.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-2">
            <FolderOpen className="h-12 w-12 text-gray-400" />
            <h3 className="text-lg font-semibold">No projects found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters or search query
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}