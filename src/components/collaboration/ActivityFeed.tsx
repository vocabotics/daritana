import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow, isToday, isYesterday, startOfDay, endOfDay } from 'date-fns';
import {
  Bell,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  Edit3,
  Eye,
  FileText,
  Filter,
  FolderPlus,
  MessageSquare,
  MoreVertical,
  Plus,
  Settings,
  Star,
  Target,
  TrendingUp,
  Upload,
  UserPlus,
  Users,
  X,
  AlertCircle,
  UserMinus,
  GitBranch,
  Zap,
  Archive,
  Trash2,
  RefreshCw,
  ChevronDown,
  Search,
  Badge,
  Shield,
  Flag,
  Briefcase,
  Home,
  Layers,
  Award
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge as BadgeUI } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuthStore } from '@/store/authStore';
import { useProjectStore } from '@/store/projectStore';
import { teamApi } from '@/lib/api';
import { toast } from 'sonner';

// Activity Types
export type ActivityType =
  | 'task_created'
  | 'task_completed'
  | 'task_updated'
  | 'task_assigned'
  | 'task_deleted'
  | 'file_uploaded'
  | 'file_modified'
  | 'file_deleted'
  | 'member_added'
  | 'member_removed'
  | 'member_role_changed'
  | 'status_changed'
  | 'comment_added'
  | 'comment_edited'
  | 'milestone_achieved'
  | 'milestone_updated'
  | 'budget_updated'
  | 'timeline_updated'
  | 'approval_requested'
  | 'approval_granted'
  | 'approval_rejected'
  | 'meeting_scheduled'
  | 'design_updated'
  | 'compliance_check'
  | 'risk_identified'
  | 'issue_reported'
  | 'issue_resolved';

// Activity Interface
export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  projectId: string;
  projectName?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userRole?: string;
  targetId?: string;
  targetName?: string;
  targetType?: 'task' | 'file' | 'user' | 'milestone' | 'document' | 'comment';
  metadata?: {
    previousValue?: any;
    newValue?: any;
    fileSize?: number;
    fileType?: string;
    progress?: number;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    status?: string;
    amount?: number;
    currency?: string;
    dueDate?: string;
    assignedTo?: string[];
    tags?: string[];
    attachments?: Array<{
      id: string;
      name: string;
      url: string;
      type: string;
      size: number;
    }>;
  };
  timestamp: Date;
  read: boolean;
  important: boolean;
  canUndo?: boolean;
}

// Activity Group Interface
interface ActivityGroup {
  date: string;
  activities: Activity[];
  isExpanded: boolean;
}

// Mock WebSocket connection for real-time updates
const mockWebSocket = {
  listeners: new Set<(activity: Activity) => void>(),
  
  subscribe(callback: (activity: Activity) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  },
  
  emit(activity: Activity) {
    this.listeners.forEach(listener => listener(activity));
  },
  
  // Simulate random activities
  startSimulation() {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance of new activity
        const activity = generateMockActivity();
        this.emit(activity);
      }
    }, 10000); // Every 10 seconds
    
    return () => clearInterval(interval);
  }
};

// Generate mock activity for demonstration
function generateMockActivity(): Activity {
  const types: ActivityType[] = ['task_completed', 'file_uploaded', 'comment_added', 'status_changed'];
  const users = [
    { id: '1', name: 'Ahmad Rahman', avatar: 'https://i.pravatar.cc/150?u=ahmad', role: 'Architect' },
    { id: '2', name: 'Sarah Lee', avatar: 'https://i.pravatar.cc/150?u=sarah', role: 'Designer' },
    { id: '3', name: 'Raj Kumar', avatar: 'https://i.pravatar.cc/150?u=raj', role: 'Engineer' },
  ];
  
  const type = types[Math.floor(Math.random() * types.length)];
  const user = users[Math.floor(Math.random() * users.length)];
  
  const activities: Record<ActivityType, Partial<Activity>> = {
    task_completed: {
      title: 'Completed task',
      targetName: 'Review floor plans',
      targetType: 'task',
      metadata: { progress: 100, status: 'completed' }
    },
    file_uploaded: {
      title: 'Uploaded a file',
      targetName: 'revised-layout.pdf',
      targetType: 'file',
      metadata: { fileSize: 2048576, fileType: 'application/pdf' }
    },
    comment_added: {
      title: 'Added a comment',
      description: 'Looks great! Just need to adjust the lighting in the main hall.',
      targetType: 'comment'
    },
    status_changed: {
      title: 'Changed project status',
      metadata: { previousValue: 'in_progress', newValue: 'review' }
    }
  };
  
  return {
    id: `activity-${Date.now()}-${Math.random()}`,
    type,
    timestamp: new Date(),
    userId: user.id,
    userName: user.name,
    userAvatar: user.avatar,
    userRole: user.role,
    projectId: 'project-1',
    projectName: 'KLCC Tower Renovation',
    read: false,
    important: Math.random() > 0.8,
    canUndo: type === 'status_changed',
    ...activities[type]
  } as Activity;
}

// Activity icon mapping
const activityIcons: Record<ActivityType, React.ElementType> = {
  task_created: Plus,
  task_completed: CheckCircle,
  task_updated: Edit3,
  task_assigned: UserPlus,
  task_deleted: Trash2,
  file_uploaded: Upload,
  file_modified: Edit3,
  file_deleted: Trash2,
  member_added: UserPlus,
  member_removed: UserMinus,
  member_role_changed: Users,
  status_changed: GitBranch,
  comment_added: MessageSquare,
  comment_edited: Edit3,
  milestone_achieved: Star,
  milestone_updated: Target,
  budget_updated: DollarSign,
  timeline_updated: Calendar,
  approval_requested: Shield,
  approval_granted: CheckCircle,
  approval_rejected: X,
  meeting_scheduled: Calendar,
  design_updated: Layers,
  compliance_check: Shield,
  risk_identified: AlertCircle,
  issue_reported: Flag,
  issue_resolved: CheckCircle,
};

// Activity color mapping
const activityColors: Record<ActivityType, string> = {
  task_created: 'text-blue-600 bg-blue-50',
  task_completed: 'text-green-600 bg-green-50',
  task_updated: 'text-yellow-600 bg-yellow-50',
  task_assigned: 'text-purple-600 bg-purple-50',
  task_deleted: 'text-red-600 bg-red-50',
  file_uploaded: 'text-indigo-600 bg-indigo-50',
  file_modified: 'text-yellow-600 bg-yellow-50',
  file_deleted: 'text-red-600 bg-red-50',
  member_added: 'text-green-600 bg-green-50',
  member_removed: 'text-red-600 bg-red-50',
  member_role_changed: 'text-purple-600 bg-purple-50',
  status_changed: 'text-blue-600 bg-blue-50',
  comment_added: 'text-gray-600 bg-gray-50',
  comment_edited: 'text-yellow-600 bg-yellow-50',
  milestone_achieved: 'text-green-600 bg-green-50',
  milestone_updated: 'text-yellow-600 bg-yellow-50',
  budget_updated: 'text-orange-600 bg-orange-50',
  timeline_updated: 'text-blue-600 bg-blue-50',
  approval_requested: 'text-purple-600 bg-purple-50',
  approval_granted: 'text-green-600 bg-green-50',
  approval_rejected: 'text-red-600 bg-red-50',
  meeting_scheduled: 'text-blue-600 bg-blue-50',
  design_updated: 'text-indigo-600 bg-indigo-50',
  compliance_check: 'text-purple-600 bg-purple-50',
  risk_identified: 'text-red-600 bg-red-50',
  issue_reported: 'text-orange-600 bg-orange-50',
  issue_resolved: 'text-green-600 bg-green-50',
};

// Mock data generator
function generateMockActivities(count: number = 50): Activity[] {
  const activities: Activity[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const hoursAgo = Math.floor(Math.random() * 24);
    const timestamp = new Date(now);
    timestamp.setDate(timestamp.getDate() - daysAgo);
    timestamp.setHours(timestamp.getHours() - hoursAgo);
    
    const activity = generateMockActivity();
    activity.id = `activity-${i}`;
    activity.timestamp = timestamp;
    activity.read = Math.random() > 0.3;
    
    activities.push(activity);
  }
  
  return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

interface ActivityFeedProps {
  projectId?: string;
  className?: string;
  compact?: boolean;
  maxHeight?: string;
  showFilters?: boolean;
  showNotificationBadge?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export default function ActivityFeed({
  projectId,
  className,
  compact = false,
  maxHeight = '600px',
  showFilters = true,
  showNotificationBadge = true,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
}: ActivityFeedProps) {
  const { user } = useAuthStore();
  const { currentProject } = useProjectStore();
  
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Filter states
  const [filterType, setFilterType] = useState<ActivityType | 'all'>('all');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [filterDateRange, setFilterDateRange] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // UI states
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [groupByDate, setGroupByDate] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastActivityRef = useRef<HTMLDivElement>(null);
  
  // Initialize activities
  useEffect(() => {
    const loadActivities = async () => {
      setIsLoading(true);
      try {
        const response = await teamApi.getActivity();
        if (response.data?.activities) {
          const formattedActivities = response.data.activities.map((activity: any) => ({
            id: activity.id,
            type: activity.type || 'task_created',
            title: activity.title || activity.message || 'Activity',
            description: activity.description,
            projectId: activity.projectId || activity.project?.id || '',
            projectName: activity.projectName || activity.project?.name,
            userId: activity.userId || activity.user?.id || '',
            userName: activity.userName || activity.user?.name || 'Unknown User',
            userAvatar: activity.userAvatar || activity.user?.avatar,
            userRole: activity.userRole || activity.user?.role,
            targetId: activity.targetId,
            targetType: activity.targetType,
            metadata: activity.metadata || {},
            timestamp: new Date(activity.timestamp || activity.createdAt),
            read: activity.read || false,
            priority: activity.priority || 'normal',
            category: activity.category || 'general'
          }));
          setActivities(formattedActivities);
          setFilteredActivities(formattedActivities);
          setUnreadCount(formattedActivities.filter(a => !a.read).length);
        }
      } catch (error) {
        console.error('Failed to load activities:', error);
        toast.error('Failed to load activity feed');
        // Fallback to mock data
        const mockActivities = generateMockActivities(20);
        setActivities(mockActivities);
        setFilteredActivities(mockActivities);
        setUnreadCount(mockActivities.filter(a => !a.read).length);
      } finally {
        setIsLoading(false);
        
        // Expand today's group by default
        const today = format(new Date(), 'yyyy-MM-dd');
        setExpandedGroups(new Set([today]));
      }
    };
    
    loadActivities();
  }, [projectId]);
  
  // Subscribe to real-time updates
  useEffect(() => {
    if (!autoRefresh) return;
    
    const unsubscribe = mockWebSocket.subscribe((newActivity) => {
      setActivities(prev => [newActivity, ...prev]);
      if (!newActivity.read) {
        setUnreadCount(prev => prev + 1);
      }
    });
    
    const stopSimulation = mockWebSocket.startSimulation();
    
    return () => {
      unsubscribe();
      stopSimulation();
    };
  }, [autoRefresh]);
  
  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      // Simulate refresh - in real app, this would fetch new activities
      console.log('Auto-refreshing activities...');
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);
  
  // Infinite scroll
  useEffect(() => {
    if (!lastActivityRef.current) return;
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMoreActivities();
        }
      },
      { threshold: 0.1 }
    );
    
    observerRef.current.observe(lastActivityRef.current);
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoadingMore]);
  
  // Filter activities
  useEffect(() => {
    let filtered = [...activities];
    
    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(a => a.type === filterType);
    }
    
    // User filter
    if (filterUser !== 'all') {
      filtered = filtered.filter(a => a.userId === filterUser);
    }
    
    // Date range filter
    if (filterDateRange !== 'all') {
      const now = new Date();
      const ranges = {
        today: startOfDay(now),
        week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      };
      
      if (filterDateRange in ranges) {
        filtered = filtered.filter(a => a.timestamp >= ranges[filterDateRange]);
      }
    }
    
    // Unread filter
    if (showUnreadOnly) {
      filtered = filtered.filter(a => !a.read);
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(query) ||
        a.description?.toLowerCase().includes(query) ||
        a.targetName?.toLowerCase().includes(query) ||
        a.userName.toLowerCase().includes(query)
      );
    }
    
    setFilteredActivities(filtered);
  }, [activities, filterType, filterUser, filterDateRange, showUnreadOnly, searchQuery]);
  
  // Load more activities
  const loadMoreActivities = async () => {
    if (isLoadingMore) return;
    
    setIsLoadingMore(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newActivities = generateMockActivities(10);
    setActivities(prev => [...prev, ...newActivities]);
    
    // Simulate end of data
    if (activities.length > 50) {
      setHasMore(false);
    }
    
    setIsLoadingMore(false);
  };
  
  // Group activities by date
  const groupActivitiesByDate = (activities: Activity[]): ActivityGroup[] => {
    const groups: Map<string, Activity[]> = new Map();
    
    activities.forEach(activity => {
      const dateKey = format(activity.timestamp, 'yyyy-MM-dd');
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(activity);
    });
    
    return Array.from(groups.entries()).map(([date, activities]) => ({
      date,
      activities,
      isExpanded: expandedGroups.has(date),
    }));
  };
  
  // Toggle group expansion
  const toggleGroup = (date: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  };
  
  // Mark activity as read
  const markAsRead = (activityId: string) => {
    setActivities(prev => prev.map(a => 
      a.id === activityId ? { ...a, read: true } : a
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };
  
  // Mark all as read
  const markAllAsRead = () => {
    setActivities(prev => prev.map(a => ({ ...a, read: true })));
    setUnreadCount(0);
  };
  
  // Undo action
  const handleUndo = (activity: Activity) => {
    console.log('Undo action for:', activity);
    // Implement undo logic here
  };
  
  // Format date label
  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEEE, MMMM d');
  };
  
  // Get unique users for filter
  const uniqueUsers = Array.from(new Set(activities.map(a => a.userId))).map(id => {
    const activity = activities.find(a => a.userId === id);
    return {
      id,
      name: activity?.userName || 'Unknown',
      avatar: activity?.userAvatar,
    };
  });
  
  // Render activity item
  const renderActivity = (activity: Activity) => {
    const Icon = activityIcons[activity.type];
    const colorClass = activityColors[activity.type];
    
    return (
      <motion.div
        key={activity.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className={cn(
          'group relative',
          !activity.read && 'bg-blue-50/50 dark:bg-blue-950/20'
        )}
      >
        <div className={cn(
          'flex gap-3 p-4 rounded-lg transition-colors',
          'hover:bg-gray-50 dark:hover:bg-gray-900/50',
          compact && 'p-3'
        )}>
          {/* Activity Icon */}
          <div className={cn(
            'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
            colorClass,
            compact && 'w-8 h-8'
          )}>
            <Icon className={cn('w-5 h-5', compact && 'w-4 h-4')} />
          </div>
          
          {/* Activity Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                {/* User and Action */}
                <div className="flex items-center gap-2 mb-1">
                  <Avatar className={cn('w-6 h-6', compact && 'w-5 h-5')}>
                    <AvatarImage src={activity.userAvatar} alt={activity.userName} />
                    <AvatarFallback>
                      {activity.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm">{activity.userName}</span>
                  {activity.userRole && (
                    <BadgeUI variant="secondary" className="text-xs">
                      {activity.userRole}
                    </BadgeUI>
                  )}
                  {activity.important && (
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  )}
                </div>
                
                {/* Activity Title */}
                <p className={cn('text-sm text-gray-900 dark:text-gray-100', compact && 'text-xs')}>
                  {activity.title}
                  {activity.targetName && (
                    <span className="font-medium ml-1">"{activity.targetName}"</span>
                  )}
                </p>
                
                {/* Description */}
                {activity.description && !compact && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {activity.description}
                  </p>
                )}
                
                {/* Metadata */}
                {activity.metadata && !compact && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {activity.metadata.priority && (
                      <BadgeUI
                        variant={
                          activity.metadata.priority === 'urgent' ? 'destructive' :
                          activity.metadata.priority === 'high' ? 'default' :
                          'secondary'
                        }
                        className="text-xs"
                      >
                        {activity.metadata.priority}
                      </BadgeUI>
                    )}
                    {activity.metadata.status && (
                      <BadgeUI variant="outline" className="text-xs">
                        {activity.metadata.status}
                      </BadgeUI>
                    )}
                    {activity.metadata.progress !== undefined && (
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <TrendingUp className="w-3 h-3" />
                        {activity.metadata.progress}%
                      </div>
                    )}
                    {activity.metadata.amount && (
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <DollarSign className="w-3 h-3" />
                        {activity.metadata.currency || 'MYR'} {activity.metadata.amount.toLocaleString()}
                      </div>
                    )}
                    {activity.metadata.fileSize && (
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <FileText className="w-3 h-3" />
                        {(activity.metadata.fileSize / 1024 / 1024).toFixed(2)} MB
                      </div>
                    )}
                  </div>
                )}
                
                {/* Attachments */}
                {activity.metadata?.attachments && activity.metadata.attachments.length > 0 && !compact && (
                  <div className="flex gap-2 mt-2">
                    {activity.metadata.attachments.map(attachment => (
                      <div
                        key={attachment.id}
                        className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs"
                      >
                        <FileText className="w-3 h-3" />
                        <span className="truncate max-w-[100px]">{attachment.name}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Timestamp and Actions */}
                <div className="flex items-center justify-between mt-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {format(activity.timestamp, 'PPpp')}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  {/* Quick Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!activity.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => markAsRead(activity.id)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Mark read
                      </Button>
                    )}
                    {activity.canUndo && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => handleUndo(activity)}
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Undo
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Add comment
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Archive className="w-4 h-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Unread indicator */}
          {!activity.read && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r" />
          )}
        </div>
      </motion.div>
    );
  };
  
  const activityGroups = groupByDate ? groupActivitiesByDate(filteredActivities) : [
    { date: '', activities: filteredActivities, isExpanded: true }
  ];
  
  return (
    <Card className={cn('relative', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Activity Feed</CardTitle>
            {showNotificationBadge && unreadCount > 0 && (
              <BadgeUI variant="destructive" className="h-5 px-1.5">
                {unreadCount}
              </BadgeUI>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                Mark all read
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setGroupByDate(!groupByDate)}
            >
              <Calendar className="w-4 h-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Feed Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowUnreadOnly(!showUnreadOnly)}>
                  <Eye className="w-4 h-4 mr-2" />
                  {showUnreadOnly ? 'Show all' : 'Show unread only'}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bell className="w-4 h-4 mr-2" />
                  Notification preferences
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 mt-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            
            <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="task_created">Tasks</SelectItem>
                <SelectItem value="file_uploaded">Files</SelectItem>
                <SelectItem value="comment_added">Comments</SelectItem>
                <SelectItem value="status_changed">Status</SelectItem>
                <SelectItem value="member_added">Team</SelectItem>
                <SelectItem value="milestone_achieved">Milestones</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterUser} onValueChange={setFilterUser}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="All users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All users</SelectItem>
                {uniqueUsers.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterDateRange} onValueChange={(value: any) => setFilterDateRange(value)}>
              <SelectTrigger className="w-[120px] h-9">
                <SelectValue placeholder="All time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This week</SelectItem>
                <SelectItem value="month">This month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea 
          className="w-full" 
          style={{ height: maxHeight }}
          ref={scrollAreaRef}
        >
          <div className="px-6 pb-4">
            {isLoading ? (
              // Loading skeleton
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredActivities.length === 0 ? (
              // Empty state
              <div className="text-center py-12">
                <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  No activities found
                </p>
                <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">
                  Activities will appear here as they happen
                </p>
              </div>
            ) : (
              // Activity list
              <AnimatePresence>
                {activityGroups.map((group, groupIndex) => (
                  <div key={group.date || 'all'} className="mb-6 last:mb-0">
                    {groupByDate && group.date && (
                      <button
                        onClick={() => toggleGroup(group.date)}
                        className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 mb-3 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                      >
                        <ChevronDown
                          className={cn(
                            'w-4 h-4 transition-transform',
                            !group.isExpanded && '-rotate-90'
                          )}
                        />
                        {formatDateLabel(group.date)}
                        <BadgeUI variant="secondary" className="ml-1 text-xs">
                          {group.activities.length}
                        </BadgeUI>
                      </button>
                    )}
                    
                    <AnimatePresence>
                      {group.isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-2"
                        >
                          {group.activities.map((activity, index) => (
                            <div
                              key={activity.id}
                              ref={
                                groupIndex === activityGroups.length - 1 &&
                                index === group.activities.length - 1
                                  ? lastActivityRef
                                  : null
                              }
                            >
                              {renderActivity(activity)}
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </AnimatePresence>
            )}
            
            {/* Load more indicator */}
            {isLoadingMore && (
              <div className="flex justify-center py-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Loading more activities...
                </div>
              </div>
            )}
            
            {!hasMore && filteredActivities.length > 0 && (
              <div className="text-center py-4 text-sm text-gray-500">
                No more activities to load
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}