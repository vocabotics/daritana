import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
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
  Upload, Edit, Trash2, Archive, Send, Check, X, Info, HelpCircle,
  Layers, Layout as LayoutIcon, Grid, Coffee, Moon, Sun, CloudRain,
  Wind, Thermometer, MapPinned, Navigation, Compass, Map, Building2,
  Plus, Save
} from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { useTaskStore } from '@/store/taskStore';
import { useFinancialStore } from '@/store/financialStore';
import { useAuthStore } from '@/store/authStore';
import { wsService } from '@/services/websocket.service';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow, isToday, isYesterday, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { toast } from 'sonner';
import { LineChart as RechartsLineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { studioApi } from '@/lib/api';

// Feed item types - expanded
type FeedItemType = 
  | 'project_update' | 'task_change' | 'deadline_alert' | 'meeting' 
  | 'financial' | 'client_message' | 'team_activity' | 'design_review'
  | 'document' | 'approval' | 'milestone' | 'marketplace' | 'community'
  | 'ai_insight' | 'calendar_event' | 'notification' | 'system'
  | 'weather' | 'news' | 'inspiration' | 'achievement' | 'social';

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
    status?: 'online' | 'away' | 'busy' | 'offline';
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
    type: 'image' | 'document' | 'video' | 'link' | '3d-model' | 'sketch';
    url: string;
    name: string;
    size?: string;
    preview?: string;
  }>;
  reactions?: {
    likes: number;
    comments: number;
    shares: number;
    userReacted?: boolean;
  };
  richContent?: {
    type: 'chart' | 'map' | 'gallery' | 'embed' | 'poll' | 'checklist';
    data: any;
  };
}

// Quick Stats Widget
const QuickStatsWidget = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await studioApi.getStats();
        if (response.success) {
          setStats(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statsData = [
    { 
      label: 'Active Projects', 
      value: stats.activeProjects || 0, 
      icon: <Briefcase className="h-4 w-4" />, 
      color: 'text-blue-600 bg-blue-50',
      trend: stats.trends?.projects || '+0%',
      trendUp: true
    },
    { 
      label: 'Pending Tasks', 
      value: stats.pendingTasks || 0, 
      icon: <CheckCircle className="h-4 w-4" />, 
      color: 'text-orange-600 bg-orange-50',
      trend: stats.trends?.tasks || '-0%',
      trendUp: false
    },
    { 
      label: 'Overdue Invoices', 
      value: stats.overdueInvoices || 0, 
      icon: <AlertCircle className="h-4 w-4" />, 
      color: stats.overdueInvoices > 0 ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50',
      trend: stats.overdueInvoices > 0 ? `RM ${(stats.overdueInvoices * 15000).toLocaleString()}` : 'All clear',
      trendUp: false
    },
    { 
      label: 'Monthly Revenue', 
      value: `RM ${(stats.monthlyRevenue / 1000).toFixed(0)}k`, 
      icon: <DollarSign className="h-4 w-4" />, 
      color: 'text-green-600 bg-green-50',
      trend: stats.trends?.revenue || '+0%',
      trendUp: true
    }
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {statsData.map((stat, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <div className="flex items-center gap-1 mt-1">
                  {stat.trendUp ? (
                    <ArrowUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <ArrowDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={cn(
                    "text-xs",
                    stat.trendUp ? "text-green-600" : "text-red-600"
                  )}>
                    {stat.trend}
                  </span>
                </div>
              </div>
              <div className={cn("p-2 rounded-lg", stat.color)}>
                {stat.icon}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Activity Timeline Widget
const ActivityTimelineWidget = () => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivityChart = async () => {
      try {
        const response = await studioApi.getActivityChart();
        if (response.success) {
          setChartData(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch activity chart:', error);
        // Fallback to empty data
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchActivityChart();
  }, []);

  if (loading) {
    return (
      <Card className="h-full animate-pulse">
        <CardContent className="p-4">
          <div className="h-32 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Today's Activity</CardTitle>
          <Badge variant="outline" className="text-xs">Live</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <ResponsiveContainer width="100%" height={120}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="time" fontSize={10} />
            <YAxis hide />
            <RechartsTooltip 
              contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
              labelStyle={{ fontSize: '11px' }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#3b82f6" 
              fillOpacity={1} 
              fill="url(#colorActivity)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Team Presence Widget
const TeamPresenceWidget = () => {
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOnlineUsers = async () => {
      try {
        // This would need a real API endpoint for online users
        // For now, we'll use a placeholder
        setOnlineUsers([]);
      } catch (error) {
        console.error('Failed to fetch online users:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOnlineUsers();
  }, []);

  const statusColors = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
    offline: 'bg-gray-400'
  };

  if (loading) {
    return (
      <Card className="h-full animate-pulse">
        <CardContent className="p-4">
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Team Online</CardTitle>
          <Badge className="text-xs bg-green-100 text-green-700">
            {onlineUsers.filter(u => u.status === 'online').length} active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-2">
          {onlineUsers.length > 0 ? (
            onlineUsers.map(user => (
              <div key={user.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white",
                    statusColors[user.status as keyof typeof statusColors]
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.role}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MessageSquare className="h-3 w-3" />
                </Button>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-gray-500 text-sm">
              No team members online
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Weather & Location Widget
const WeatherWidget = () => {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // This would need a real weather API integration
        // For now, we'll use a placeholder
        setWeather({
          temp: 28,
          condition: 'Partly Cloudy',
          location: 'Kuala Lumpur',
          humidity: 75,
          wind: 12
        });
      } catch (error) {
        console.error('Failed to fetch weather:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, []);

  if (loading) {
    return (
      <Card className="h-full animate-pulse">
        <CardContent className="p-4">
          <div className="h-24 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (!weather) return null;

  return (
    <Card className="h-full bg-gradient-to-br from-blue-50 to-cyan-50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-600 mb-1">{weather.location}</p>
            <p className="text-3xl font-bold text-gray-900">{weather.temp}°C</p>
            <p className="text-sm text-gray-600 mt-1">{weather.condition}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <CloudRain className="h-3 w-3" />
                {weather.humidity}%
              </span>
              <span className="flex items-center gap-1">
                <Wind className="h-3 w-3" />
                {weather.wind}km/h
              </span>
            </div>
          </div>
          <Sun className="h-8 w-8 text-yellow-500" />
        </div>
      </CardContent>
    </Card>
  );
};

// AI Assistant Widget
const AIAssistantWidget = () => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        // This would need a real AI suggestions API
        // For now, we'll use a placeholder
        setSuggestions([
          { text: "Schedule buffer time for KLCC project", icon: <Clock className="h-3 w-3" /> },
          { text: "Review pending approvals (3)", icon: <CheckCircle className="h-3 w-3" /> },
          { text: "Optimize resource allocation", icon: <Users className="h-3 w-3" /> }
        ]);
      } catch (error) {
        console.error('Failed to fetch AI suggestions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSuggestions();
  }, []);

  if (loading) {
    return (
      <Card className="h-full animate-pulse">
        <CardContent className="p-4">
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-8 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-purple-600" />
          <CardTitle className="text-sm font-medium">ARIA Suggests</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-2">
          {suggestions.map((suggestion, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2 bg-white/80 rounded-lg hover:bg-white cursor-pointer transition-colors">
              <div className="text-purple-600">{suggestion.icon}</div>
              <p className="text-xs text-gray-700 flex-1">{suggestion.text}</p>
              <ChevronRight className="h-3 w-3 text-gray-400" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export function UltimateStudioHub() {
  const { user } = useAuthStore();
  const { projects, fetchProjects } = useProjectStore();
  const { tasks, fetchTasks } = useTaskStore();
  const { invoices, quotations } = useFinancialStore();
  
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'starred' | 'critical'>('all');
  const [selectedTypes, setSelectedTypes] = useState<Set<FeedItemType>>(new Set());
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const feedEndRef = useRef<HTMLDivElement>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  // Fetch real feed data from backend
  const fetchFeedItems = useCallback(async (reset = false) => {
    try {
      const newOffset = reset ? 0 : offset;
      const response = await studioApi.getFeed({
        limit: 20,
        offset: newOffset,
        filter: filter,
        types: Array.from(selectedTypes)
      });

      if (response.success) {
        const newItems = response.data.items.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));

        if (reset) {
          setFeedItems(newItems);
          setOffset(20);
        } else {
          setFeedItems(prev => [...prev, ...newItems]);
          setOffset(prev => prev + 20);
        }
        
        setHasMore(response.data.hasMore);
      }
    } catch (error) {
      console.error('Failed to fetch feed items:', error);
      toast.error('Failed to load feed items');
    } finally {
      setIsLoading(false);
    }
  }, [filter, selectedTypes, offset]);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchProjects(),
        fetchTasks(),
        fetchFeedItems(true)
      ]);
    };
    
    loadInitialData();
  }, [fetchProjects, fetchTasks, fetchFeedItems]);

  // Auto-refresh feed
  useEffect(() => {
    if (!isAutoRefresh) return;

    const interval = setInterval(() => {
      fetchFeedItems(true);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [isAutoRefresh, fetchFeedItems]);

  // Load more items when scrolling
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchFeedItems(false);
    }
  }, [isLoading, hasMore, fetchFeedItems]);

  // Scroll to bottom effect
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [feedItems]);

  if (!user) return null;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Studio Hub</h1>
            <p className="text-gray-600">Welcome back, {user.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchFeedItems(true)}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              Refresh
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Quick Action
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <QuickStatsWidget />

        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Feed Column */}
          <div className="col-span-8 space-y-6">
            {/* Feed Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Tabs value={filter} onValueChange={(value) => setFilter(value as any)}>
                      <TabsList>
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="unread">Unread</TabsTrigger>
                        <TabsTrigger value="starred">Starred</TabsTrigger>
                        <TabsTrigger value="critical">Critical</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                      className={cn(isAutoRefresh && "bg-blue-50 text-blue-600")}
                    >
                      <Zap className="h-4 w-4" />
                      Auto-refresh
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feed Items */}
            <div className="space-y-4">
              {isLoading && feedItems.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Loading feed...</p>
                  </div>
                </div>
              ) : feedItems.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No activity yet</h3>
                    <p className="text-gray-500">Start by creating a project or task to see activity here.</p>
                  </CardContent>
                </Card>
              ) : (
                <AnimatePresence>
                  {feedItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Card className={cn(
                        "hover:shadow-md transition-all cursor-pointer",
                        item.priority === 'critical' && "border-red-200 bg-red-50/50",
                        item.priority === 'high' && "border-orange-200 bg-orange-50/50"
                      )}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            {/* Priority Indicator */}
                            <div className={cn(
                              "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                              item.priority === 'critical' && "bg-red-500",
                              item.priority === 'high' && "bg-orange-500",
                              item.priority === 'medium' && "bg-yellow-500",
                              item.priority === 'low' && "bg-green-500"
                            )} />
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h3 className="font-medium text-gray-900 mb-1">{item.title}</h3>
                                  <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                                  
                                  {/* Tags */}
                                  {item.tags && item.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-3">
                                      {item.tags.slice(0, 3).map((tag, idx) => (
                                        <Badge key={idx} variant="secondary" className="text-xs">
                                          {tag}
                                        </Badge>
                                      ))}
                                      {item.tags.length > 3 && (
                                        <Badge variant="outline" className="text-xs">
                                          +{item.tags.length - 3}
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* Meta Info */}
                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Hash className="h-3 w-3" />
                                      {item.source}
                                    </span>
                                    {item.projectName && (
                                      <span className="flex items-center gap-1">
                                        <Briefcase className="h-3 w-3" />
                                        {item.projectName}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Actions */}
                                <div className="flex items-center gap-1 ml-4">
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Star className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              
                              {/* Reactions */}
                              {item.reactions && (
                                <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
                                  <Button variant="ghost" size="sm" className="h-8 text-xs">
                                    <ThumbsUp className="h-3 w-3 mr-1" />
                                    {item.reactions.likes}
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-8 text-xs">
                                    <MessageCircle className="h-3 w-3 mr-1" />
                                    {item.reactions.comments}
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-8 text-xs">
                                    <Share className="h-3 w-3 mr-1" />
                                    {item.reactions.shares}
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
              
              {/* Load More */}
              {hasMore && (
                <div className="text-center py-4">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Loading...
                      </>
                    ) : (
                      'Load More'
                    )}
                  </Button>
                </div>
              )}
              
              <div ref={feedEndRef} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-span-4 space-y-6">
            <ActivityTimelineWidget />
            <TeamPresenceWidget />
            <WeatherWidget />
            <AIAssistantWidget />
          </div>
        </div>
      </div>
    </Layout>
  );
}