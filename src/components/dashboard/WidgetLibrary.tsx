import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Search,
  Plus,
  Star,
  Clock,
  TrendingUp,
  Users,
  FileText,
  BarChart3,
  Calendar,
  DollarSign,
  Activity,
  Briefcase,
  CheckSquare,
  MessageSquare,
  Bell,
  Target,
  PieChart,
  LineChart,
  Map,
  Shield,
  Zap,
  Building,
  Package,
  Truck,
  Settings,
  Brain,
  Sparkles
} from 'lucide-react';

export interface WidgetDefinition {
  id: string;
  type: string;
  title: string;
  description: string;
  category: 'analytics' | 'projects' | 'team' | 'finance' | 'productivity' | 'ai';
  icon: React.ReactNode;
  previewImage: string;
  defaultSize: { width: number; height: number };
  minSize?: { width: number; height: number };
  maxSize?: { width: number; height: number };
  tags: string[];
  isPremium?: boolean;
  isNew?: boolean;
  popularity: number; // 0-100
}

const WIDGET_DEFINITIONS: WidgetDefinition[] = [
  // Analytics Widgets
  {
    id: 'performance-metrics',
    type: 'performance-metrics',
    title: 'Performance Metrics',
    description: 'Real-time KPIs and performance indicators with trend analysis',
    category: 'analytics',
    icon: <Activity className="h-5 w-5" />,
    previewImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
    defaultSize: { width: 6, height: 4 },
    minSize: { width: 4, height: 3 },
    tags: ['kpi', 'metrics', 'performance', 'analytics'],
    popularity: 95
  },
  {
    id: 'revenue-chart',
    type: 'revenue-chart',
    title: 'Revenue Analytics',
    description: 'Financial performance tracking with revenue trends and forecasts',
    category: 'analytics',
    icon: <TrendingUp className="h-5 w-5" />,
    previewImage: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=400&h=300&fit=crop',
    defaultSize: { width: 6, height: 4 },
    tags: ['revenue', 'finance', 'charts', 'trends'],
    popularity: 88
  },
  {
    id: 'project-analytics',
    type: 'project-analytics',
    title: 'Project Analytics',
    description: 'Comprehensive project performance and health metrics',
    category: 'analytics',
    icon: <PieChart className="h-5 w-5" />,
    previewImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
    defaultSize: { width: 8, height: 5 },
    tags: ['projects', 'analytics', 'dashboard'],
    popularity: 82,
    isNew: true
  },

  // Project Widgets
  {
    id: 'active-projects',
    type: 'active-projects',
    title: 'Active Projects',
    description: 'Overview of all active projects with status and progress',
    category: 'projects',
    icon: <Briefcase className="h-5 w-5" />,
    previewImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
    defaultSize: { width: 8, height: 4 },
    minSize: { width: 6, height: 3 },
    tags: ['projects', 'overview', 'status'],
    popularity: 92
  },
  {
    id: 'project-timeline',
    type: 'project-timeline',
    title: 'Project Timeline',
    description: 'Visual timeline of project milestones and deadlines',
    category: 'projects',
    icon: <Calendar className="h-5 w-5" />,
    previewImage: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400&h=300&fit=crop',
    defaultSize: { width: 12, height: 4 },
    tags: ['timeline', 'schedule', 'milestones'],
    popularity: 76
  },
  {
    id: 'my-tasks',
    type: 'my-tasks',
    title: 'My Tasks',
    description: 'Personal task list with priorities and due dates',
    category: 'productivity',
    icon: <CheckSquare className="h-5 w-5" />,
    previewImage: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400&h=300&fit=crop',
    defaultSize: { width: 4, height: 4 },
    tags: ['tasks', 'todo', 'productivity'],
    popularity: 90
  },

  // Team Widgets
  {
    id: 'team-overview',
    type: 'team-overview',
    title: 'Team Overview',
    description: 'Team member status, availability, and workload distribution',
    category: 'team',
    icon: <Users className="h-5 w-5" />,
    previewImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=300&fit=crop',
    defaultSize: { width: 6, height: 4 },
    tags: ['team', 'collaboration', 'status'],
    popularity: 84
  },
  {
    id: 'team-performance',
    type: 'team-performance',
    title: 'Team Performance',
    description: 'Team productivity metrics and performance indicators',
    category: 'team',
    icon: <Target className="h-5 w-5" />,
    previewImage: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop',
    defaultSize: { width: 6, height: 4 },
    tags: ['team', 'performance', 'metrics'],
    popularity: 72
  },
  {
    id: 'activity-feed',
    type: 'activity-feed',
    title: 'Activity Feed',
    description: 'Real-time feed of team activities and project updates',
    category: 'team',
    icon: <MessageSquare className="h-5 w-5" />,
    previewImage: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop',
    defaultSize: { width: 4, height: 6 },
    tags: ['activity', 'feed', 'updates', 'collaboration'],
    popularity: 78
  },

  // Finance Widgets
  {
    id: 'budget-tracker',
    type: 'budget-tracker',
    title: 'Budget Tracker',
    description: 'Project budget tracking with spend analysis',
    category: 'finance',
    icon: <DollarSign className="h-5 w-5" />,
    previewImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop',
    defaultSize: { width: 6, height: 4 },
    tags: ['budget', 'finance', 'tracking'],
    popularity: 80
  },
  {
    id: 'invoice-summary',
    type: 'invoice-summary',
    title: 'Invoice Summary',
    description: 'Outstanding invoices and payment status',
    category: 'finance',
    icon: <FileText className="h-5 w-5" />,
    previewImage: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=400&h=300&fit=crop',
    defaultSize: { width: 4, height: 3 },
    tags: ['invoices', 'payments', 'finance'],
    popularity: 74
  },

  // AI-Powered Widgets
  {
    id: 'ai-recommendations',
    type: 'ai-recommendations',
    title: 'AI Insights',
    description: 'AI-powered recommendations and predictive analytics',
    category: 'ai',
    icon: <Brain className="h-5 w-5" />,
    previewImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop',
    defaultSize: { width: 6, height: 4 },
    tags: ['ai', 'insights', 'recommendations', 'smart'],
    popularity: 86,
    isPremium: true,
    isNew: true
  },
  {
    id: 'smart-alerts',
    type: 'smart-alerts',
    title: 'Smart Alerts',
    description: 'Intelligent notifications and risk alerts',
    category: 'ai',
    icon: <Sparkles className="h-5 w-5" />,
    previewImage: 'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=400&h=300&fit=crop',
    defaultSize: { width: 4, height: 3 },
    tags: ['alerts', 'notifications', 'ai', 'smart'],
    popularity: 79,
    isPremium: true
  },

  // Productivity Widgets
  {
    id: 'upcoming-deadlines',
    type: 'upcoming-deadlines',
    title: 'Upcoming Deadlines',
    description: 'Critical deadlines and milestone reminders',
    category: 'productivity',
    icon: <Clock className="h-5 w-5" />,
    previewImage: 'https://images.unsplash.com/photo-1611079830522-11cc5c3a88e4?w=400&h=300&fit=crop',
    defaultSize: { width: 6, height: 3 },
    tags: ['deadlines', 'calendar', 'reminders'],
    popularity: 88
  },
  {
    id: 'quick-actions',
    type: 'quick-actions',
    title: 'Quick Actions',
    description: 'Frequently used actions and shortcuts',
    category: 'productivity',
    icon: <Zap className="h-5 w-5" />,
    previewImage: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=400&h=300&fit=crop',
    defaultSize: { width: 4, height: 3 },
    tags: ['shortcuts', 'actions', 'quick', 'productivity'],
    popularity: 82
  },
  {
    id: 'recent-files',
    type: 'recent-files',
    title: 'Recent Files',
    description: 'Quick access to recently viewed and edited files',
    category: 'productivity',
    icon: <FileText className="h-5 w-5" />,
    previewImage: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=400&h=300&fit=crop',
    defaultSize: { width: 4, height: 4 },
    tags: ['files', 'documents', 'recent'],
    popularity: 76
  }
];

interface WidgetLibraryProps {
  onAddWidget: (widget: WidgetDefinition) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function WidgetLibrary({ onAddWidget, isOpen, onClose }: WidgetLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [hoveredWidget, setHoveredWidget] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'All Widgets', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <Activity className="h-4 w-4" /> },
    { id: 'projects', label: 'Projects', icon: <Briefcase className="h-4 w-4" /> },
    { id: 'team', label: 'Team', icon: <Users className="h-4 w-4" /> },
    { id: 'finance', label: 'Finance', icon: <DollarSign className="h-4 w-4" /> },
    { id: 'productivity', label: 'Productivity', icon: <CheckSquare className="h-4 w-4" /> },
    { id: 'ai', label: 'AI-Powered', icon: <Brain className="h-4 w-4" /> }
  ];

  const filteredWidgets = WIDGET_DEFINITIONS.filter(widget => {
    const matchesSearch = widget.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         widget.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         widget.tags.some(tag => tag.includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || widget.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => b.popularity - a.popularity);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-semibold">Widget Library</h2>
                <p className="text-gray-500">Add widgets to customize your dashboard</p>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                ✕
              </Button>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search widgets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="px-6 py-3 border-b">
            <div className="flex gap-2 overflow-x-auto">
              {categories.map(category => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="flex items-center gap-2 whitespace-nowrap"
                >
                  {category.icon}
                  {category.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Widget Grid */}
          <ScrollArea className="flex-1 p-6">
            <div className="grid grid-cols-3 gap-4">
              {filteredWidgets.map(widget => (
                <motion.div
                  key={widget.id}
                  whileHover={{ y: -4 }}
                  onMouseEnter={() => setHoveredWidget(widget.id)}
                  onMouseLeave={() => setHoveredWidget(null)}
                >
                  <Card 
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-all"
                    onClick={() => onAddWidget(widget)}
                  >
                    <div className="relative h-40 bg-gradient-to-br from-gray-50 to-gray-100">
                      <img
                        src={widget.previewImage}
                        alt={widget.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute top-2 right-2 flex gap-1">
                        {widget.isNew && (
                          <Badge className="bg-green-500 text-white">New</Badge>
                        )}
                        {widget.isPremium && (
                          <Badge className="bg-purple-500 text-white">Premium</Badge>
                        )}
                      </div>
                      <div className="absolute bottom-2 left-2 text-white">
                        {widget.icon}
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-1">{widget.title}</h3>
                      <p className="text-sm text-gray-500 mb-3">{widget.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          {widget.tags.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-400">
                          <Star className="h-3 w-3 fill-current" />
                          {widget.popularity}%
                        </div>
                      </div>
                    </CardContent>
                    {hoveredWidget === widget.id && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-blue-500/10 flex items-center justify-center"
                      >
                        <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Widget
                        </Button>
                      </motion.div>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default WidgetLibrary;