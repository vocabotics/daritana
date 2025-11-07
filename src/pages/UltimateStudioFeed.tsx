import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, TrendingUp, AlertCircle, CheckCircle, Clock, Calendar,
  DollarSign, Users, MessageSquare, FileText, Building, Briefcase,
  Video, Phone, Mail, Globe, Star, Heart, Share, Bookmark, Filter,
  RefreshCw, Sparkles, Zap, Bell, ArrowUp, ArrowDown, MoreVertical,
  Camera, Mic, Link, Hash, MapPin, Award, Target, Package, ShoppingCart,
  CreditCard, Receipt, Hammer, HardHat, Ruler, PaintBucket, Lightbulb,
  Brain, ChevronRight, Circle, Play, Pause, Eye, ThumbsUp, MessageCircle,
  GitBranch, GitCommit, GitPullRequest, Flag, Milestone, Timer, 
  BarChart3, PieChart, LineChart, TrendingDown, ExternalLink, Download,
  Upload, Edit, Trash2, Archive, Send, Check, X, Info, HelpCircle
} from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { useTaskStore } from '@/store/taskStore';
import { useFinancialStore } from '@/store/financialStore';
import { useAuthStore } from '@/store/authStore';
import { wsService } from '@/services/websocket.service';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow, isToday, isYesterday, addDays } from 'date-fns';
import { toast } from 'sonner';

// Feed item types
type FeedItemType = 
  | 'project_update' | 'task_change' | 'deadline_alert' | 'meeting' 
  | 'financial' | 'client_message' | 'team_activity' | 'design_review'
  | 'document' | 'approval' | 'milestone' | 'marketplace' | 'community'
  | 'ai_insight' | 'calendar_event' | 'notification' | 'system';

interface FeedItem {
  id: string;
  type: FeedItemType;
  priority: 'critical' | 'high' | 'medium' | 'low';
  timestamp: Date;
  title: string;
  description: string;
  source: string;
  projectId?: string;
  projectName?: string;
  author?: {
    id: string;
    name: string;
    avatar?: string;
    role?: string;
  };
  data?: any;
  actions?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary';
  }>;
  tags?: string[];
  isRead?: boolean;
  isStarred?: boolean;
  attachments?: Array<{
    type: 'image' | 'document' | 'video' | 'link';
    url: string;
    name: string;
    size?: string;
  }>;
}

export function UltimateStudioFeed() {
  const { user } = useAuthStore();
  const { projects, fetchProjects } = useProjectStore();
  const { tasks, fetchTasks } = useTaskStore();
  const { invoices, quotations, getOverdueInvoices, getTotalRevenue } = useFinancialStore();
  
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'starred' | 'critical'>('all');
  const [selectedTypes, setSelectedTypes] = useState<Set<FeedItemType>>(new Set());
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const feedEndRef = useRef<HTMLDivElement>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  // Generate comprehensive feed items from all sources
  const generateFeedItems = useCallback(() => {
    const items: FeedItem[] = [];
    const now = new Date();

    // Project Updates
    projects.forEach(project => {
      // Recent project activity
      if (project.updatedAt && new Date(project.updatedAt) > addDays(now, -7)) {
        items.push({
          id: `project-${project.id}-update`,
          type: 'project_update',
          priority: project.priority === 'high' ? 'high' : 'medium',
          timestamp: new Date(project.updatedAt),
          title: `Project Update: ${project.name}`,
          description: `Progress updated to ${project.progress}%. ${project.status === 'at_risk' ? 'Project is at risk!' : ''}`,
          source: 'Projects',
          projectId: project.id,
          projectName: project.name,
          author: project.projectLead ? {
            id: project.projectLead.id,
            name: `${project.projectLead.firstName} ${project.projectLead.lastName}`,
            role: 'Project Lead'
          } : undefined,
          tags: [project.type, project.status],
          actions: [
            {
              label: 'View Project',
              icon: <Eye className="h-3 w-3" />,
              onClick: () => toast.info(`Opening ${project.name}`)
            }
          ]
        });
      }

      // Upcoming deadlines
      if (project.endDate) {
        const daysUntilDeadline = Math.ceil((new Date(project.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntilDeadline <= 7 && daysUntilDeadline >= 0) {
          items.push({
            id: `project-${project.id}-deadline`,
            type: 'deadline_alert',
            priority: daysUntilDeadline <= 2 ? 'critical' : 'high',
            timestamp: new Date(project.endDate),
            title: `⏰ Deadline Alert: ${project.name}`,
            description: `Project deadline in ${daysUntilDeadline} days!`,
            source: 'Timeline',
            projectId: project.id,
            projectName: project.name,
            tags: ['deadline', 'urgent'],
            data: { daysRemaining: daysUntilDeadline }
          });
        }
      }
    });

    // Task Updates
    tasks.forEach(task => {
      // Critical tasks
      if (task.priority === 'critical' || task.priority === 'high') {
        items.push({
          id: `task-${task.id}`,
          type: 'task_change',
          priority: task.priority as 'critical' | 'high',
          timestamp: new Date(task.updatedAt || task.createdAt),
          title: `Task: ${task.title}`,
          description: task.description || 'Task requires attention',
          source: 'Tasks',
          projectId: task.projectId,
          projectName: projects.find(p => p.id === task.projectId)?.name,
          author: task.assignee ? {
            id: task.assignee.id,
            name: task.assignee.name,
            role: 'Team Member'
          } : undefined,
          tags: [task.status, task.priority],
          actions: [
            {
              label: task.status === 'completed' ? 'Reopen' : 'Complete',
              icon: task.status === 'completed' ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />,
              onClick: () => toast.success(`Task ${task.status === 'completed' ? 'reopened' : 'completed'}`)
            }
          ]
        });
      }
    });

    // Financial Updates
    invoices.forEach(invoice => {
      if (invoice.status === 'overdue' || invoice.status === 'pending') {
        const invoiceAmount = invoice.total || 0;
        const clientName = invoice.client?.name || 'Unknown Client';
        
        items.push({
          id: `invoice-${invoice.id}`,
          type: 'financial',
          priority: invoice.status === 'overdue' ? 'critical' : 'high',
          timestamp: new Date(invoice.dueDate),
          title: `💰 Invoice ${invoice.status === 'overdue' ? 'Overdue' : 'Pending'}: ${invoice.invoiceNumber}`,
          description: `Amount: RM ${invoiceAmount.toLocaleString()}. Client: ${clientName}`,
          source: 'Finance',
          projectId: invoice.projectId,
          tags: ['invoice', invoice.status],
          data: { amount: invoiceAmount, currency: 'RM' },
          actions: [
            {
              label: 'Send Reminder',
              icon: <Mail className="h-3 w-3" />,
              onClick: () => toast.success('Reminder sent')
            }
          ]
        });
      }
    });

    // Simulated Meeting Updates
    items.push({
      id: 'meeting-1',
      type: 'meeting',
      priority: 'high',
      timestamp: addDays(now, 1),
      title: '📅 Design Review Meeting Tomorrow',
      description: 'Client presentation for KLCC Tower Project Phase 2',
      source: 'Calendar',
      projectId: projects[0]?.id,
      projectName: 'KLCC Tower',
      author: {
        id: '1',
        name: 'Sarah Chen',
        role: 'Design Lead',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
      },
      tags: ['meeting', 'client', 'design'],
      attachments: [
        { type: 'document', name: 'Design_Proposal_v3.pdf', url: '#', size: '2.4 MB' }
      ],
      actions: [
        {
          label: 'Join Meeting',
          icon: <Video className="h-3 w-3" />,
          onClick: () => toast.info('Meeting link will be available tomorrow')
        }
      ]
    });

    // AI Insights from ARIA
    items.push({
      id: 'ai-insight-1',
      type: 'ai_insight',
      priority: 'medium',
      timestamp: now,
      title: '🤖 ARIA Insight: Resource Optimization Opportunity',
      description: 'Based on current project timelines, reallocating 2 designers from Project A to Project B could improve delivery by 15%',
      source: 'ARIA AI',
      tags: ['ai', 'optimization', 'resources'],
      data: { 
        confidence: 0.89,
        impact: 'high',
        savings: 'RM 45,000'
      },
      actions: [
        {
          label: 'Apply Recommendation',
          icon: <Sparkles className="h-3 w-3" />,
          onClick: () => toast.success('Resource optimization applied')
        },
        {
          label: 'Learn More',
          icon: <Brain className="h-3 w-3" />,
          onClick: () => toast.info('Opening ARIA insights dashboard'),
          variant: 'outline'
        }
      ]
    });

    // Community Updates
    items.push({
      id: 'community-1',
      type: 'community',
      priority: 'low',
      timestamp: addDays(now, -1),
      title: '🌟 Trending in Architecture Community',
      description: 'New sustainable building materials discussion gaining traction. 245 architects participating.',
      source: 'Community',
      tags: ['community', 'trending', 'sustainability'],
      author: {
        id: '2',
        name: 'Architecture Malaysia',
        role: 'Community',
        avatar: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=150'
      },
      actions: [
        {
          label: 'Join Discussion',
          icon: <MessageSquare className="h-3 w-3" />,
          onClick: () => toast.info('Opening community discussion')
        }
      ]
    });

    // Marketplace Activity
    items.push({
      id: 'marketplace-1',
      type: 'marketplace',
      priority: 'medium',
      timestamp: addDays(now, -2),
      title: '🛒 New Quote Received',
      description: 'Supplier "BuildMaster Sdn Bhd" submitted quote for steel beams. 20% below budget!',
      source: 'Marketplace',
      projectId: projects[1]?.id,
      tags: ['marketplace', 'quote', 'savings'],
      data: { 
        savings: 'RM 12,000',
        supplier: 'BuildMaster Sdn Bhd'
      },
      actions: [
        {
          label: 'Review Quote',
          icon: <FileText className="h-3 w-3" />,
          onClick: () => toast.info('Opening quote details')
        },
        {
          label: 'Accept',
          icon: <Check className="h-3 w-3" />,
          onClick: () => toast.success('Quote accepted'),
          variant: 'default'
        }
      ]
    });

    // Design Review
    items.push({
      id: 'design-review-1',
      type: 'design_review',
      priority: 'high',
      timestamp: now,
      title: '🎨 Design Review Completed',
      description: 'Client approved lobby design with minor revisions. 3 comments to address.',
      source: 'Design',
      projectId: projects[0]?.id,
      projectName: projects[0]?.name,
      author: {
        id: '3',
        name: 'Michael Tan',
        role: 'Client',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
      },
      tags: ['design', 'approval', 'revision'],
      attachments: [
        { type: 'image', name: 'Lobby_Design_Final.jpg', url: '#', size: '1.8 MB' }
      ],
      actions: [
        {
          label: 'View Comments',
          icon: <MessageCircle className="h-3 w-3" />,
          onClick: () => toast.info('Opening design comments')
        }
      ]
    });

    // Sort by timestamp (newest first)
    items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return items;
  }, [projects, tasks, invoices, quotations]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchProjects(),
          fetchTasks()
        ]);
        const items = generateFeedItems();
        setFeedItems(items);
      } catch (error) {
        console.error('Failed to load feed data:', error);
        toast.error('Failed to load studio feed');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Real-time updates
  useEffect(() => {
    wsService.on('update', (update: any) => {
      const newItem: FeedItem = {
        id: `realtime-${Date.now()}`,
        type: 'notification',
        priority: 'medium',
        timestamp: new Date(),
        title: `Real-time Update`,
        description: update.message || 'New activity in your studio',
        source: 'Real-time',
        isRead: false
      };
      setFeedItems(prev => [newItem, ...prev]);
    });

    return () => {
      wsService.off('update', () => {});
    };
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (!isAutoRefresh) return;

    const interval = setInterval(() => {
      const items = generateFeedItems();
      setFeedItems(items);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [isAutoRefresh, generateFeedItems]);

  // Filter items
  const filteredItems = feedItems.filter(item => {
    if (filter === 'unread' && item.isRead) return false;
    if (filter === 'starred' && !item.isStarred) return false;
    if (filter === 'critical' && item.priority !== 'critical') return false;
    if (selectedTypes.size > 0 && !selectedTypes.has(item.type)) return false;
    return true;
  });

  // Group items by date
  const groupItemsByDate = (items: FeedItem[]) => {
    const groups: Record<string, FeedItem[]> = {};
    
    items.forEach(item => {
      const date = item.timestamp;
      let key: string;
      
      if (isToday(date)) {
        key = 'Today';
      } else if (isYesterday(date)) {
        key = 'Yesterday';
      } else {
        key = format(date, 'EEEE, MMMM d');
      }
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    
    return groups;
  };

  const groupedItems = groupItemsByDate(filteredItems);

  // Mark item as read
  const markAsRead = (itemId: string) => {
    setFeedItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, isRead: true } : item
      )
    );
  };

  // Toggle star
  const toggleStar = (itemId: string) => {
    setFeedItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, isStarred: !item.isStarred } : item
      )
    );
  };

  // Get icon for feed item type
  const getTypeIcon = (type: FeedItemType) => {
    const icons = {
      project_update: <Briefcase className="h-4 w-4" />,
      task_change: <CheckCircle className="h-4 w-4" />,
      deadline_alert: <Clock className="h-4 w-4" />,
      meeting: <Calendar className="h-4 w-4" />,
      financial: <DollarSign className="h-4 w-4" />,
      client_message: <MessageSquare className="h-4 w-4" />,
      team_activity: <Users className="h-4 w-4" />,
      design_review: <PaintBucket className="h-4 w-4" />,
      document: <FileText className="h-4 w-4" />,
      approval: <CheckCircle className="h-4 w-4" />,
      milestone: <Flag className="h-4 w-4" />,
      marketplace: <ShoppingCart className="h-4 w-4" />,
      community: <Globe className="h-4 w-4" />,
      ai_insight: <Brain className="h-4 w-4" />,
      calendar_event: <Calendar className="h-4 w-4" />,
      notification: <Bell className="h-4 w-4" />,
      system: <Info className="h-4 w-4" />
    };
    return icons[type] || <Activity className="h-4 w-4" />;
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    const colors = {
      critical: 'text-red-600 bg-red-50 border-red-200',
      high: 'text-orange-600 bg-orange-50 border-orange-200',
      medium: 'text-blue-600 bg-blue-50 border-blue-200',
      low: 'text-gray-600 bg-gray-50 border-gray-200'
    };
    return colors[priority as keyof typeof colors] || colors.low;
  };

  // Render feed item
  const renderFeedItem = (item: FeedItem) => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      whileHover={{ x: 2 }}
      className={cn(
        "group relative",
        !item.isRead && "bg-blue-50/30"
      )}
      onClick={() => markAsRead(item.id)}
    >
      <Card className={cn(
        "border-l-4 hover:shadow-md transition-all cursor-pointer",
        getPriorityColor(item.priority)
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {/* Type Icon */}
              <div className={cn(
                "p-2 rounded-lg",
                getPriorityColor(item.priority)
              )}>
                {getTypeIcon(item.type)}
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  {item.priority === 'critical' && (
                    <Badge variant="destructive" className="text-xs">
                      Critical
                    </Badge>
                  )}
                  {!item.isRead && (
                    <Circle className="h-2 w-2 fill-blue-500 text-blue-500" />
                  )}
                </div>

                <p className="text-sm text-gray-600 mb-2">{item.description}</p>

                {/* Metadata */}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                  </span>
                  {item.source && (
                    <span className="flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      {item.source}
                    </span>
                  )}
                  {item.projectName && (
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3 w-3" />
                      {item.projectName}
                    </span>
                  )}
                </div>

                {/* Author */}
                {item.author && (
                  <div className="flex items-center gap-2 mt-3">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={item.author.avatar} />
                      <AvatarFallback>
                        {item.author.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-gray-600">
                      {item.author.name}
                      {item.author.role && ` • ${item.author.role}`}
                    </span>
                  </div>
                )}

                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Attachments */}
                {item.attachments && item.attachments.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {item.attachments.map((attachment, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs"
                      >
                        {attachment.type === 'image' && <Camera className="h-3 w-3" />}
                        {attachment.type === 'document' && <FileText className="h-3 w-3" />}
                        {attachment.type === 'video' && <Video className="h-3 w-3" />}
                        {attachment.type === 'link' && <Link className="h-3 w-3" />}
                        <span>{attachment.name}</span>
                        {attachment.size && (
                          <span className="text-gray-500">({attachment.size})</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* AI Data */}
                {item.type === 'ai_insight' && item.data && (
                  <div className="flex gap-4 mt-3 p-2 bg-purple-50 rounded">
                    <div className="text-xs">
                      <span className="text-gray-600">Confidence:</span>
                      <span className="ml-1 font-semibold">{(item.data.confidence * 100).toFixed(0)}%</span>
                    </div>
                    {item.data.impact && (
                      <div className="text-xs">
                        <span className="text-gray-600">Impact:</span>
                        <span className="ml-1 font-semibold capitalize">{item.data.impact}</span>
                      </div>
                    )}
                    {item.data.savings && (
                      <div className="text-xs">
                        <span className="text-gray-600">Potential Savings:</span>
                        <span className="ml-1 font-semibold text-green-600">{item.data.savings}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                {item.actions && item.actions.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {item.actions.map((action, idx) => (
                      <Button
                        key={idx}
                        size="sm"
                        variant={action.variant || 'outline'}
                        onClick={(e) => {
                          e.stopPropagation();
                          action.onClick();
                        }}
                        className="text-xs"
                      >
                        {action.icon}
                        <span className="ml-1">{action.label}</span>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleStar(item.id);
                }}
              >
                <Star className={cn(
                  "h-4 w-4",
                  item.isStarred && "fill-yellow-400 text-yellow-400"
                )} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  toast.info('Bookmarked for later');
                }}
              >
                <Bookmark className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  toast.info('Shared to team');
                }}
              >
                <Share className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
    </motion.div>
  );

  const toolbar = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-900">Studio Feed</h2>
        <Badge variant="outline" className="text-xs">
          {filteredItems.length} updates
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList className="h-8">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="unread" className="text-xs">Unread</TabsTrigger>
            <TabsTrigger value="starred" className="text-xs">Starred</TabsTrigger>
            <TabsTrigger value="critical" className="text-xs">Critical</TabsTrigger>
          </TabsList>
        </Tabs>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAutoRefresh(!isAutoRefresh)}
          className={cn(isAutoRefresh && "bg-green-50")}
        >
          <RefreshCw className={cn("h-4 w-4", isAutoRefresh && "animate-spin")} />
          <span className="ml-2 hidden lg:inline">
            {isAutoRefresh ? 'Auto' : 'Manual'}
          </span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const items = generateFeedItems();
            setFeedItems(items);
            toast.success('Feed refreshed');
          }}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <Layout toolbar={toolbar}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">Loading your studio feed...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout toolbar={toolbar}>
      <div className="max-w-4xl mx-auto p-6">
        {/* Welcome Message */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {user?.name}
          </h1>
          <p className="text-gray-600">
            Here's everything happening in your studio today
          </p>
        </div>

        {/* Feed Items */}
        <div className="space-y-6">
          <AnimatePresence>
            {Object.entries(groupedItems).map(([date, items]) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px flex-1 bg-gray-200" />
                  <span className="text-sm font-medium text-gray-500 px-3">
                    {date}
                  </span>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>
                
                <div className="space-y-3">
                  {items.map(item => renderFeedItem(item))}
                </div>
              </div>
            ))}
          </AnimatePresence>
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="mt-8 text-center">
            <Button
              variant="outline"
              onClick={() => {
                // Simulate loading more items
                toast.info('Loading more updates...');
                setHasMore(false);
              }}
            >
              Load More Updates
            </Button>
          </div>
        )}

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <Card className="p-12 text-center">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No updates yet
            </h3>
            <p className="text-gray-600">
              Your studio feed will show all important updates here
            </p>
          </Card>
        )}

        {/* Scroll to top */}
        <div ref={feedEndRef} />
      </div>
    </Layout>
  );
}