import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import ActivityFeed from '@/components/collaboration/ActivityFeed'
import {
  ArrowLeft,
  Edit,
  MoreVertical,
  Calendar,
  DollarSign,
  Users,
  MapPin,
  Clock,
  FileText,
  CheckSquare,
  MessageSquare,
  AlertCircle,
  TrendingUp,
  Download,
  Share2,
  Plus,
  Target,
  Briefcase,
  Building2,
  Layers,
  Palette,
  Shield,
  Activity,
  FolderOpen,
  Image,
  Video,
  Star,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Home,
  ChevronRight,
  Sparkles,
  Timer,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  PieChart,
  BarChart3,
  TrendingDown,
  Upload,
  Link2,
  ExternalLink,
  Hammer,
  Ruler,
  PaintBucket,
  Settings,
  Flag,
  Hash,
  Lightbulb,
  Award,
  ThumbsUp,
  Heart,
  Info,
  UserPlus
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useProjectStore } from '@/store/projectStore'
import { useTaskStore } from '@/store/taskStore'
import { useAuthStore } from '@/store/authStore'
import { useFinancialStore } from '@/store/financialStore'
import { cloudStorage, CloudFile } from '@/lib/cloudStorage'
import { projectApi } from '@/lib/api'
import { format, formatDistanceToNow, addDays, isAfter, isBefore, differenceInDays } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// Types
interface MetricCard {
  id: string
  title: string
  value: string | number
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  icon: React.ElementType
  color: string
  subtitle?: string
  sparkline?: number[]
  priority?: 'high' | 'medium' | 'low'
}

interface QuickAction {
  id: string
  label: string
  icon: React.ElementType
  action: () => void
  variant?: 'default' | 'outline' | 'ghost'
  color?: string
}

interface FilePreview {
  id: string
  name: string
  type: 'image' | 'document' | 'video' | '3d' | 'spreadsheet'
  size: string
  url: string
  thumbnail?: string
  uploadedBy: string
  uploadedAt: Date
}

// Role-based configurations
const roleConfigurations = {
  client: {
    primaryMetrics: ['progress', 'budget', 'timeline', 'quality'],
    sections: ['overview', 'milestones', 'gallery', 'budget', 'updates'],
    quickActions: ['message', 'schedule', 'download'],
    theme: {
      accent: 'blue',
      gradient: 'from-blue-500 to-cyan-500',
    }
  },
  designer: {
    primaryMetrics: ['tasks', 'revisions', 'approvals', 'resources'],
    sections: ['design', 'tasks', 'moodboard', 'files', 'collaboration'],
    quickActions: ['upload', 'create_task', 'share', 'comment'],
    theme: {
      accent: 'purple',
      gradient: 'from-purple-500 to-pink-500',
    }
  },
  project_lead: {
    primaryMetrics: ['progress', 'budget', 'risks', 'team'],
    sections: ['dashboard', 'timeline', 'team', 'risks', 'reports'],
    quickActions: ['assign', 'review', 'approve', 'export'],
    theme: {
      accent: 'green',
      gradient: 'from-green-500 to-emerald-500',
    }
  },
  contractor: {
    primaryMetrics: ['tasks', 'schedule', 'materials', 'compliance'],
    sections: ['tasks', 'schedule', 'materials', 'safety', 'documents'],
    quickActions: ['update_progress', 'request_materials', 'submit_report'],
    theme: {
      accent: 'orange',
      gradient: 'from-orange-500 to-red-500',
    }
  },
  staff: {
    primaryMetrics: ['tasks', 'deadlines', 'documents', 'meetings'],
    sections: ['tasks', 'calendar', 'documents', 'communication'],
    quickActions: ['complete_task', 'upload', 'comment'],
    theme: {
      accent: 'indigo',
      gradient: 'from-indigo-500 to-blue-500',
    }
  }
}

// Utility functions
const getStatusColor = (status: string) => {
  const colors = {
    planning: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    on_hold: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  }
  return colors[status] || colors.draft
}

const getPriorityColor = (priority: string) => {
  const colors = {
    urgent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  }
  return colors[priority] || colors.medium
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 0
  }).format(amount)
}

const getProjectTypeIcon = (type: string) => {
  const icons = {
    residential: Home,
    commercial: Building2,
    industrial: Briefcase,
    institutional: Shield,
    renovation: Hammer,
    interior_design: Palette,
    landscape: Layers,
  }
  return icons[type] || Building2
}

// Components
const HeroSection = ({ project, userRole, roleConfig }) => {
  const ProjectIcon = getProjectTypeIcon(project.type || 'general')
  const isOverdue = project.endDate && isAfter(new Date(), new Date(project.endDate))
  const daysRemaining = project.endDate ? differenceInDays(new Date(project.endDate), new Date()) : null
  
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-white to-blue-50 border border-blue-100 p-8 md:p-12">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-transparent to-blue-100"></div>
      </div>
      
      {/* Status Badges */}
      <div className="relative mb-6 flex flex-wrap gap-2">
        <Badge className={cn('px-3 py-1', getStatusColor(project.status))}>
          <Activity className="mr-1 h-3 w-3" />
          {project.status.replace('_', ' ')}
        </Badge>
        <Badge className={cn('px-3 py-1', getPriorityColor(project.priority))}>
          <Flag className="mr-1 h-3 w-3" />
          {project.priority}
        </Badge>
        <Badge variant="outline" className="bg-blue-50 text-blue-900 border-blue-200">
          <ProjectIcon className="mr-1 h-3 w-3" />
          {project.type ? project.type.replace('_', ' ') : 'General'}
        </Badge>
        {isOverdue && (
          <Badge className="bg-red-500 text-white">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Overdue
          </Badge>
        )}
      </div>
      
      {/* Project Title & Description */}
      <div className="relative">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-bold text-gray-900 mb-3"
        >
          {project.name}
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-gray-600 mb-4 max-w-3xl"
        >
          {project.description || 'An innovative architectural project bringing modern design to life.'}
        </motion.p>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-4 text-gray-600"
        >
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>{project.address}, {project.city}</span>
          </div>
          {daysRemaining !== null && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>
                {daysRemaining > 0 
                  ? `${daysRemaining} days remaining`
                  : `${Math.abs(daysRemaining)} days overdue`
                }
              </span>
            </div>
          )}
        </motion.div>
      </div>
      
      {/* Progress Bar */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="relative mt-8"
      >
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-600">Overall Progress</span>
          <span className="text-sm font-bold text-gray-900">{project.progress || 0}%</span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${project.progress || 0}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full bg-gradient-to-r ${roleConfig.theme.gradient} relative`}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          </motion.div>
        </div>
      </motion.div>
      
      {/* Quick Stats */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8"
      >
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs">Budget</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(project.budget || 0)}</p>
          {project.actualCost && (
            <p className="text-xs text-gray-600 mt-1">
              Spent: {formatCurrency(project.actualCost)}
            </p>
          )}
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Users className="h-4 w-4" />
            <span className="text-xs">Team Size</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{project.team?.length || 0}</p>
          <p className="text-xs text-gray-600 mt-1">Members</p>
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Calendar className="h-4 w-4" />
            <span className="text-xs">Timeline</span>
          </div>
          <p className="text-xl font-bold text-gray-900">
            {project.endDate ? format(new Date(project.endDate), 'MMM dd') : 'TBD'}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Started {project.startDate ? format(new Date(project.startDate), 'MMM dd') : 'TBD'}
          </p>
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <CheckSquare className="h-4 w-4" />
            <span className="text-xs">Tasks</span>
          </div>
          <p className="text-xl font-bold text-gray-900">0/0</p>
          <p className="text-xs text-gray-600 mt-1">Completed</p>
        </div>
      </motion.div>
    </div>
  )
}

const MetricGrid = ({ metrics, compact = false }) => {
  return (
    <div className={cn(
      'grid gap-4',
      compact 
        ? 'grid-cols-2 md:grid-cols-4' 
        : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
    )}>
      {metrics.map((metric, index) => {
        const Icon = metric.icon
        return (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className={cn(
              'relative overflow-hidden hover:shadow-lg transition-all duration-300',
              metric.priority === 'high' && 'ring-2 ring-red-500/20',
              !compact && 'hover:scale-[1.02]'
            )}>
              {/* Background Gradient */}
              <div className={cn(
                'absolute inset-0 opacity-5',
                `bg-gradient-to-br ${metric.color}`
              )} />
              
              <CardHeader className={cn('pb-2', compact && 'p-4')}>
                <div className="flex items-center justify-between">
                  <div className={cn(
                    'p-2 rounded-lg',
                    metric.color.replace('from-', 'bg-').replace('to-', '').split(' ')[0] + '/10'
                  )}>
                    <Icon className={cn(
                      'h-5 w-5',
                      metric.color.replace('from-', 'text-').replace('to-', '').split(' ')[0].replace('bg-', '')
                    )} />
                  </div>
                  {metric.trend && (
                    <div className={cn(
                      'flex items-center gap-1 text-sm',
                      metric.trend === 'up' ? 'text-green-600' : 
                      metric.trend === 'down' ? 'text-red-600' : 
                      'text-gray-500'
                    )}>
                      {metric.trend === 'up' ? <ArrowUpRight className="h-4 w-4" /> :
                       metric.trend === 'down' ? <ArrowDownRight className="h-4 w-4" /> :
                       <TrendingUp className="h-4 w-4" />}
                      {metric.change && <span>{Math.abs(metric.change)}%</span>}
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className={compact && 'p-4 pt-0'}>
                <p className="text-sm text-muted-foreground">{metric.title}</p>
                <p className={cn(
                  'font-bold mt-1',
                  compact ? 'text-xl' : 'text-2xl'
                )}>
                  {metric.value}
                </p>
                {metric.subtitle && (
                  <p className="text-xs text-muted-foreground mt-1">{metric.subtitle}</p>
                )}
                
                {/* Mini Sparkline */}
                {metric.sparkline && !compact && (
                  <div className="flex items-end gap-1 h-8 mt-3">
                    {metric.sparkline.map((value, i) => (
                      <div
                        key={i}
                        className={cn(
                          'flex-1 rounded-t',
                          metric.color.replace('from-', 'bg-').replace('to-', '').split(' ')[0] + '/20'
                        )}
                        style={{ height: `${value}%` }}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}

const TaskKanbanPreview = ({ projectId, tasks }) => {
  const columns = [
    { id: 'todo', title: 'To Do', color: 'bg-gray-500' },
    { id: 'in_progress', title: 'In Progress', color: 'bg-blue-500' },
    { id: 'review', title: 'Review', color: 'bg-yellow-500' },
    { id: 'done', title: 'Done', color: 'bg-green-500' },
  ]
  
  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped = {
      todo: [],
      in_progress: [],
      review: [],
      done: [],
    }
    
    tasks?.forEach(task => {
      if (grouped[task.status]) {
        grouped[task.status].push(task)
      }
    })
    
    return grouped
  }, [tasks])
  
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Task Board
          </CardTitle>
          <Button size="sm" variant="outline">
            <ExternalLink className="h-4 w-4 mr-1" />
            Open Kanban
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-4 gap-0 border-t">
          {columns.map(column => (
            <div key={column.id} className="border-r last:border-r-0">
              <div className={cn(
                'px-4 py-2 border-b flex items-center justify-between',
                'bg-gray-50 dark:bg-gray-900/50'
              )}>
                <div className="flex items-center gap-2">
                  <div className={cn('w-2 h-2 rounded-full', column.color)} />
                  <span className="text-sm font-medium">{column.title}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {tasksByStatus[column.id]?.length || 0}
                </Badge>
              </div>
              
              <ScrollArea className="h-[300px] p-2">
                <div className="space-y-2">
                  {tasksByStatus[column.id]?.slice(0, 5).map(task => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.02 }}
                      className="p-3 bg-white dark:bg-gray-800 rounded-lg border shadow-sm cursor-pointer"
                    >
                      <p className="text-sm font-medium line-clamp-2">{task.title}</p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            'text-xs',
                            task.priority === 'urgent' && 'border-red-500 text-red-600',
                            task.priority === 'high' && 'border-orange-500 text-orange-600'
                          )}
                        >
                          {task.priority}
                        </Badge>
                        {task.assignedTo && (
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-xs">
                              {task.assignedTo.firstName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                      {task.dueDate && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Due {format(new Date(task.dueDate), 'MMM dd')}
                        </p>
                      )}
                    </motion.div>
                  ))}
                  
                  {tasksByStatus[column.id]?.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No tasks
                    </p>
                  )}
                  
                  {tasksByStatus[column.id]?.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      +{tasksByStatus[column.id].length - 5} more
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

const FinancialSnapshot = ({ project, financials }) => {
  const navigate = useNavigate()
  const budgetUtilization = project.budget ? ((project.actualCost || 0) / project.budget) * 100 : 0
  const isOverBudget = budgetUtilization > 100
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 0
    }).format(amount)
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Financial Overview
          </CardTitle>
          <Button size="sm" variant="outline">
            <FileText className="h-4 w-4 mr-1" />
            Reports
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Budget Progress */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Budget Utilization</span>
            <span className={cn(
              'text-sm font-bold',
              isOverBudget ? 'text-red-600' : budgetUtilization > 80 ? 'text-yellow-600' : 'text-green-600'
            )}>
              {budgetUtilization.toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={Math.min(budgetUtilization, 100)} 
            className={cn(
              'h-3',
              isOverBudget && '[&>div]:bg-red-500'
            )}
          />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Spent: {formatCurrency(project.actualCost || 0)}</span>
            <span>Budget: {formatCurrency(project.budget || 0)}</span>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-400">Revenue</p>
            <p className="text-2xl font-bold text-green-900 dark:text-green-300">
              {formatCurrency(project.budget || 0)}
            </p>
          </div>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-400">Expenses</p>
            <p className="text-2xl font-bold text-red-900 dark:text-red-300">
              {formatCurrency(project.actualCost || 0)}
            </p>
          </div>
        </div>
        
        {/* Recent Transactions */}
        <div>
          <h4 className="text-sm font-medium mb-3">Recent Transactions</h4>
          <div className="space-y-2">
            {financials?.invoices?.slice(0, 3).map(invoice => (
              <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{invoice.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(invoice.date, 'MMM dd, yyyy')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{formatCurrency(invoice.amount)}</span>
                  <Badge variant={invoice.status === 'paid' ? 'success' : 'warning'}>
                    {invoice.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          {financials?.invoices?.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              <p className="text-sm">No transactions yet</p>
            </div>
          )}
        </div>
        
        <Button 
          variant="outline" 
          className="w-full mt-4"
          onClick={() => navigate('/financial')}
        >
          View Financial Details
        </Button>
      </CardContent>
    </Card>
  )
}

const TeamCollaboration = ({ project }) => {
  const [teamMembers, setTeamMembers] = useState([])
  const [isLoadingTeam, setIsLoadingTeam] = useState(false)

  useEffect(() => {
    const loadTeamMembers = async () => {
      if (!project?.id) return
      
      setIsLoadingTeam(true)
      try {
        const response = await projectApi.getProjectTeam(project.id)
        if (response.success && response.data.team) {
          const formattedMembers = response.data.team.map((member: any) => ({
            id: member.id,
            name: member.name || `${member.firstName} ${member.lastName}`,
            role: member.role || member.position || 'Team Member',
            avatar: member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || member.firstName)}&background=0D8ABC&color=fff`,
            status: member.status || 'online',
            tasksCompleted: member.tasksCompleted || member._count?.tasks || 0,
            hoursLogged: member.hoursLogged || 0
          }))
          setTeamMembers(formattedMembers)
        }
      } catch (error) {
        console.error('Failed to load team members:', error)
      } finally {
        setIsLoadingTeam(false)
      }
    }

    loadTeamMembers()
  }, [project?.id])
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Collaboration
          </CardTitle>
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            Add Member
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoadingTeam ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : teamMembers.length > 0 ? (
          teamMembers.map(member => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900/70 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    'absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white',
                    member.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                  )} />
                </div>
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium">{member.tasksCompleted}</p>
                  <p className="text-xs text-muted-foreground">Tasks</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{member.hoursLogged}h</p>
                  <p className="text-xs text-muted-foreground">Logged</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Send Message
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Eye className="h-4 w-4 mr-2" />
                      View Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      Remove from Team
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No team members assigned to this project</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const FileGallery = ({ project, files, isLoading }) => {
  const navigate = useNavigate()
  
  // Convert CloudFile to FilePreview format
  const fileList: FilePreview[] = files?.map(f => ({
    id: f.id,
    name: f.name,
    type: f.mimeType?.startsWith('image/') ? 'image' : 
          f.mimeType?.includes('pdf') ? 'document' :
          f.mimeType?.includes('video') ? 'video' :
          f.mimeType?.includes('spreadsheet') || f.mimeType?.includes('excel') ? 'spreadsheet' :
          'document',
    size: `${(f.size / 1024 / 1024).toFixed(1)} MB`,
    url: f.webViewLink || f.downloadUrl || '#',
    thumbnail: f.thumbnailLink,
    uploadedBy: f.uploadedBy || 'System',
    uploadedAt: new Date(f.createdTime || Date.now())
  })) || []
  
  const getFileIcon = (type: string) => {
    const icons = {
      image: Image,
      document: FileText,
      video: Video,
      '3d': Layers,
      spreadsheet: BarChart3,
    }
    return icons[type] || FileText
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Project Files
          </CardTitle>
          <Button size="sm" variant="outline">
            <Upload className="h-4 w-4 mr-1" />
            Upload
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : fileList.length === 0 ? (
          <div className="text-center py-8">
            <FolderOpen className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <p className="text-sm text-gray-500">No files uploaded yet</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={() => navigate('/files')}
            >
              Upload First File
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {fileList.slice(0, 6).map((file, index) => {
              const FileIcon = getFileIcon(file.type)
              return (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  className="group relative cursor-pointer"
                  onClick={() => window.open(file.url, '_blank')}
                >
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border">
                  {file.thumbnail ? (
                    <img 
                      src={file.thumbnail} 
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="mt-2">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">{file.size}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(file.uploadedAt, { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </motion.div>
            )
            })}
          </div>
        )}
        
        {fileList.length > 6 && (
          <Button 
            variant="outline" 
            className="w-full mt-4"
            onClick={() => navigate('/files')}
          >
            View All Files ({fileList.length})
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

const MilestoneTimeline = ({ project }) => {
  const [milestones, setMilestones] = useState([])
  const [isLoadingMilestones, setIsLoadingMilestones] = useState(false)

  useEffect(() => {
    const loadMilestones = async () => {
      if (!project?.id) return
      
      setIsLoadingMilestones(true)
      try {
        const response = await projectApi.getProjectMilestones(project.id)
        if (response.success && response.data.milestones) {
          const formattedMilestones = response.data.milestones.map((milestone: any) => ({
            id: milestone.id,
            name: milestone.name || milestone.title,
            date: new Date(milestone.date || milestone.dueDate || milestone.createdAt),
            status: milestone.status || 'upcoming',
            description: milestone.description || milestone.notes || ''
          }))
          setMilestones(formattedMilestones)
        }
      } catch (error) {
        console.error('Failed to load milestones:', error)
      } finally {
        setIsLoadingMilestones(false)
      }
    }

    loadMilestones()
  }, [project?.id])
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Project Milestones
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
          
          <div className="space-y-6">
            {isLoadingMilestones ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : milestones.length > 0 ? (
              milestones.map((milestone, index) => (
                <motion.div
                  key={milestone.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative flex gap-4"
                >
                  {/* Milestone dot */}
                  <div className={cn(
                    'relative z-10 w-12 h-12 rounded-full flex items-center justify-center',
                    milestone.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30' :
                    milestone.status === 'in_progress' ? 'bg-blue-100 dark:bg-blue-900/30' :
                    'bg-gray-100 dark:bg-gray-800'
                  )}>
                    {milestone.status === 'completed' ? (
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    ) : milestone.status === 'in_progress' ? (
                      <Clock className="h-6 w-6 text-blue-600" />
                    ) : (
                      <div className="w-3 h-3 bg-gray-400 rounded-full" />
                    )}
                  </div>
                  
                  {/* Milestone content */}
                  <div className="flex-1 pb-6">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium">{milestone.name}</h4>
                      <Badge variant={
                        milestone.status === 'completed' ? 'success' :
                        milestone.status === 'in_progress' ? 'default' :
                        'secondary'
                      }>
                        {milestone.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {milestone.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(milestone.date, 'MMMM dd, yyyy')}
                    </p>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No milestones defined for this project</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { projects, fetchProjects, fetchProjectById, currentProject, isLoadingProject } = useProjectStore()
  const { tasks, fetchProjectTasks, tasksByProject } = useTaskStore()
  const { invoices, quotations, getInvoicesByProject, getQuotationsByProject } = useFinancialStore()
  const { user } = useAuthStore()
  
  const [isLoading, setIsLoading] = useState(true)
  const [activeView, setActiveView] = useState('dashboard')
  const [projectFiles, setProjectFiles] = useState<CloudFile[]>([])
  const [isLoadingFiles, setIsLoadingFiles] = useState(false)
  
  // Fetch project details from backend
  useEffect(() => {
    const loadProject = async () => {
      if (id) {
        setIsLoading(true)
        try {
          await fetchProjectById(id)
        } catch (error) {
          console.error('Failed to load project:', error)
          toast.error('Failed to load project details')
        } finally {
          setIsLoading(false)
        }
      }
    }
    loadProject()
  }, [id, fetchProjectById])
  
  // Use currentProject if it matches the id, otherwise find from list
  const project = (currentProject?.id === id) ? currentProject : projects.find(p => p.id === id)
  
  // Get project tasks from the store
  const projectTasks = tasksByProject.get(id || '') || []
  
  // Get user role configuration
  const userRole = user?.role || 'staff'
  const roleConfig = roleConfigurations[userRole] || roleConfigurations.staff
  
  // Load project tasks when project is loaded
  useEffect(() => {
    if (id && project) {
      fetchProjectTasks(id)
      loadProjectFiles()
    }
  }, [id, project, fetchProjectTasks])
  
  // Load project files
  const loadProjectFiles = async () => {
    if (!id) return
    setIsLoadingFiles(true)
    try {
      const serverFiles = await cloudStorage.listServerFiles()
      // Filter files for this project (in a real app, this would be done server-side)
      const filtered = serverFiles.filter(f => 
        f.metadata?.projectId === id || 
        f.name.toLowerCase().includes(project?.name.toLowerCase() || '')
      )
      setProjectFiles(filtered)
    } catch (error) {
      console.error('Failed to load project files:', error)
    } finally {
      setIsLoadingFiles(false)
    }
  }
  
  // Calculate financial metrics
  const projectFinancials = useMemo(() => {
    if (!id) return {
      totalInvoiced: 0,
      totalPaid: 0,
      totalQuoted: 0,
      outstanding: 0,
      invoices: [],
      quotations: []
    }
    
    const projectInvoices = getInvoicesByProject(id)
    const projectQuotations = getQuotationsByProject(id)
    
    const totalInvoiced = projectInvoices.reduce((sum, inv) => sum + inv.amount, 0)
    const totalPaid = projectInvoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0)
    const totalQuoted = projectQuotations.reduce((sum, quot) => sum + quot.amount, 0)
    
    return {
      totalInvoiced,
      totalPaid,
      totalQuoted,
      outstanding: totalInvoiced - totalPaid,
      invoices: projectInvoices,
      quotations: projectQuotations
    }
  }, [getInvoicesByProject, getQuotationsByProject, id])
  
  // Generate metrics based on role
  const primaryMetrics: MetricCard[] = useMemo(() => {
    if (!project) return []
    
    const metricsMap = {
      progress: {
        id: 'progress',
        title: 'Overall Progress',
        value: `${project.progress || 0}%`,
        change: 5,
        trend: 'up',
        icon: TrendingUp,
        color: 'from-blue-500 to-cyan-500',
        sparkline: [30, 40, 35, 50, 49, 60, 70, 91],
      },
      budget: {
        id: 'budget',
        title: 'Budget Status',
        value: formatCurrency(project.budget || 0),
        subtitle: `${((project.actualCost || 0) / (project.budget || 1) * 100).toFixed(0)}% used`,
        icon: DollarSign,
        color: 'from-green-500 to-emerald-500',
        trend: project.actualCost > project.budget * 0.8 ? 'down' : 'neutral',
      },
      timeline: {
        id: 'timeline',
        title: 'Days Remaining',
        value: project.endDate ? differenceInDays(new Date(project.endDate), new Date()) : 'N/A',
        subtitle: project.endDate ? format(new Date(project.endDate), 'MMM dd, yyyy') : 'TBD',
        icon: Calendar,
        color: 'from-purple-500 to-pink-500',
      },
      tasks: {
        id: 'tasks',
        title: 'Active Tasks',
        value: projectTasks.filter(t => t.status !== 'done').length || 0,
        subtitle: `${projectTasks.filter(t => t.status === 'done').length || 0} completed`,
        icon: CheckSquare,
        color: 'from-orange-500 to-red-500',
      },
      team: {
        id: 'team',
        title: 'Team Members',
        value: project.team?.length || 0,
        subtitle: 'Active members',
        icon: Users,
        color: 'from-indigo-500 to-purple-500',
      },
      quality: {
        id: 'quality',
        title: 'Quality Score',
        value: '92%',
        change: 3,
        trend: 'up',
        icon: Award,
        color: 'from-yellow-500 to-orange-500',
      },
      risks: {
        id: 'risks',
        title: 'Open Risks',
        value: 3,
        subtitle: '1 high priority',
        icon: AlertTriangle,
        color: 'from-red-500 to-pink-500',
        priority: 'high',
      },
      approvals: {
        id: 'approvals',
        title: 'Pending Approvals',
        value: 5,
        subtitle: '2 urgent',
        icon: Shield,
        color: 'from-cyan-500 to-blue-500',
      },
    }
    
    return roleConfig.primaryMetrics
      .map(metricId => metricsMap[metricId])
      .filter(Boolean)
  }, [project, tasks, roleConfig])
  
  // Quick actions based on role
  const quickActions: QuickAction[] = useMemo(() => {
    const actionsMap = {
      message: {
        id: 'message',
        label: 'Message Team',
        icon: MessageSquare,
        action: () => console.log('Message'),
        variant: 'outline',
      },
      schedule: {
        id: 'schedule',
        label: 'Schedule Meeting',
        icon: Calendar,
        action: () => console.log('Schedule'),
        variant: 'outline',
      },
      download: {
        id: 'download',
        label: 'Download Report',
        icon: Download,
        action: () => console.log('Download'),
        variant: 'outline',
      },
      upload: {
        id: 'upload',
        label: 'Upload Files',
        icon: Upload,
        action: () => console.log('Upload'),
        variant: 'default',
      },
      create_task: {
        id: 'create_task',
        label: 'Create Task',
        icon: Plus,
        action: () => navigate(`/projects/${id}/tasks/new`),
        variant: 'default',
      },
      share: {
        id: 'share',
        label: 'Share',
        icon: Share2,
        action: () => console.log('Share'),
        variant: 'outline',
      },
      assign: {
        id: 'assign',
        label: 'Assign Task',
        icon: UserPlus,
        action: () => console.log('Assign'),
        variant: 'default',
      },
      review: {
        id: 'review',
        label: 'Review Work',
        icon: Eye,
        action: () => console.log('Review'),
        variant: 'outline',
      },
      approve: {
        id: 'approve',
        label: 'Approve',
        icon: CheckCircle2,
        action: () => console.log('Approve'),
        variant: 'default',
        color: 'bg-green-600 hover:bg-green-700',
      },
      export: {
        id: 'export',
        label: 'Export Data',
        icon: Download,
        action: () => console.log('Export'),
        variant: 'outline',
      },
    }
    
    return (roleConfig.quickActions || [])
      .map(actionId => actionsMap[actionId])
      .filter(Boolean)
  }, [roleConfig, id, navigate])
  
  // Show loading state
  if (isLoading || isLoadingProject) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading project details...</p>
          </div>
        </div>
      </Layout>
    )
  }
  
  if (!project) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Project Not Found</h2>
          <p className="text-muted-foreground mb-4">The project you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/projects')}>
            Back to Projects
          </Button>
        </div>
      </Layout>
    )
  }
  
  const toolbar = (
    <div className="flex items-center gap-2">
      {quickActions.map(action => {
        const ActionIcon = action.icon
        return (
          <TooltipProvider key={action.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={action.variant}
                  size="sm"
                  onClick={action.action}
                  className={action.color}
                >
                  <ActionIcon className="h-4 w-4 mr-1" />
                  <span className="hidden md:inline">{action.label}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{action.label}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      })}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            Project Settings
          </DropdownMenuItem>
          <DropdownMenuItem>
            <FileText className="mr-2 h-4 w-4" />
            Generate Report
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-600">
            Archive Project
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )

  return (
    <Layout toolbar={toolbar}>
      <div className="space-y-6">
        {/* Hero Section */}
        <HeroSection project={project} userRole={userRole} roleConfig={roleConfig} />
        
        {/* Primary Metrics */}
        <MetricGrid metrics={primaryMetrics} />
        
        {/* Dynamic Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Board Preview */}
            <TaskKanbanPreview projectId={project.id} tasks={projectTasks} />
            
            {/* Milestone Timeline */}
            <MilestoneTimeline project={project} />
            
            {/* File Gallery */}
            <FileGallery project={project} files={projectFiles} isLoading={isLoadingFiles} />
          </div>
          
          {/* Sidebar (1 col) */}
          <div className="space-y-6">
            {/* Activity Feed */}
            <ActivityFeed
              projectId={project.id}
              compact={true}
              maxHeight="400px"
              showFilters={false}
              showNotificationBadge={true}
            />
            
            {/* Financial Snapshot */}
            <FinancialSnapshot project={project} financials={projectFinancials} />
            
            {/* Team Collaboration */}
            <TeamCollaboration project={project} />
          </div>
        </div>
      </div>
    </Layout>
  )
}