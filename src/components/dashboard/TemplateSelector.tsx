import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  LayoutGrid, 
  Search, 
  Star, 
  Crown, 
  Zap, 
  Palette, 
  TrendingUp,
  Users,
  Building,
  FileText,
  BarChart3,
  Calendar,
  MessageSquare,
  Settings,
  Save,
  Grid3x3
} from 'lucide-react';
import { DashboardWidget } from '@/types/dashboard';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

interface Template {
  id: string;
  name: string;
  description: string;
  category: 'business' | 'executive' | 'project' | 'personal' | 'team';
  icon: React.ElementType;
  preview: string[];
  widgets: DashboardWidget[];
  roles: string[];
  featured?: boolean;
  premium?: boolean;
  popularity?: number;
}

interface TemplateSelectorProps {
  onSelectTemplate: (widgets: DashboardWidget[]) => void;
  onClose: () => void;
  currentRole: string;
}

const DASHBOARD_TEMPLATES: Template[] = [
  {
    id: 'executive-overview',
    name: 'Executive Overview',
    description: 'High-level KPIs and strategic insights for leadership',
    category: 'executive',
    icon: Crown,
    preview: ['Revenue Chart', 'Project Overview', 'Team Performance', 'Market Trends'],
    widgets: [
      { id: '1', type: 'revenue-chart', title: 'Revenue Trends', position: { x: 0, y: 0 }, size: { width: 8, height: 4 } },
      { id: '2', type: 'performance-metrics', title: 'KPIs', position: { x: 8, y: 0 }, size: { width: 4, height: 4 } },
      { id: '3', type: 'project-overview', title: 'Projects Status', position: { x: 0, y: 4 }, size: { width: 6, height: 3 } },
      { id: '4', type: 'team-overview', title: 'Team Utilization', position: { x: 6, y: 4 }, size: { width: 6, height: 3 } },
      { id: '5', type: 'trend-analysis', title: 'Market Intelligence', position: { x: 0, y: 7 }, size: { width: 6, height: 3 } },
      { id: '6', type: 'ai-recommendations', title: 'Strategic Insights', position: { x: 6, y: 7 }, size: { width: 6, height: 3 } }
    ],
    roles: ['admin', 'project_lead'],
    featured: true,
    premium: true,
    popularity: 95
  },
  {
    id: 'project-command-center',
    name: 'Project Command Center',
    description: 'Comprehensive project management and team coordination',
    category: 'project',
    icon: Building,
    preview: ['Active Projects', 'Task Board', 'Timeline', 'Team Status'],
    widgets: [
      { id: '1', type: 'active-projects', title: 'Active Projects', position: { x: 0, y: 0 }, size: { width: 8, height: 4 } },
      { id: '2', type: 'upcoming-deadlines', title: 'Deadlines', position: { x: 8, y: 0 }, size: { width: 4, height: 4 } },
      { id: '3', type: 'task-kanban', title: 'Task Board', position: { x: 0, y: 4 }, size: { width: 12, height: 5 } },
      { id: '4', type: 'team-overview', title: 'Team Status', position: { x: 0, y: 9 }, size: { width: 6, height: 3 } },
      { id: '5', type: 'project-timeline', title: 'Timeline', position: { x: 6, y: 9 }, size: { width: 6, height: 3 } }
    ],
    roles: ['project_lead', 'designer', 'admin'],
    featured: true,
    popularity: 88
  },
  {
    id: 'client-portal-premium',
    name: 'Premium Client Experience',
    description: 'Elegant client dashboard with design gallery and updates',
    category: 'business',
    icon: Star,
    preview: ['Project Updates', 'Design Gallery', 'Milestones', 'Approvals'],
    widgets: [
      { id: '1', type: 'design-gallery', title: 'Design Showcase', position: { x: 0, y: 0 }, size: { width: 8, height: 5 } },
      { id: '2', type: 'milestone-tracker', title: 'Project Progress', position: { x: 8, y: 0 }, size: { width: 4, height: 5 } },
      { id: '3', type: 'project-updates', title: 'Latest Updates', position: { x: 0, y: 5 }, size: { width: 6, height: 4 } },
      { id: '4', type: 'approval-requests', title: 'Pending Approvals', position: { x: 6, y: 5 }, size: { width: 3, height: 4 } },
      { id: '5', type: 'meeting-schedule', title: 'Meetings', position: { x: 9, y: 5 }, size: { width: 3, height: 4 } }
    ],
    roles: ['client'],
    featured: true,
    popularity: 92
  },
  {
    id: 'financial-control',
    name: 'Financial Control Center',
    description: 'Complete financial oversight and cash flow management',
    category: 'business',
    icon: TrendingUp,
    preview: ['Revenue Chart', 'Invoices', 'Cash Flow', 'Budget Tracking'],
    widgets: [
      { id: '1', type: 'revenue-chart', title: 'Revenue Analysis', position: { x: 0, y: 0 }, size: { width: 8, height: 4 } },
      { id: '2', type: 'cash-flow', title: 'Cash Flow', position: { x: 8, y: 0 }, size: { width: 4, height: 4 } },
      { id: '3', type: 'invoice-summary', title: 'Invoice Status', position: { x: 0, y: 4 }, size: { width: 4, height: 3 } },
      { id: '4', type: 'payment-pending', title: 'Pending Payments', position: { x: 4, y: 4 }, size: { width: 4, height: 3 } },
      { id: '5', type: 'profit-loss', title: 'P&L Summary', position: { x: 8, y: 4 }, size: { width: 4, height: 3 } },
      { id: '6', type: 'project-budget', title: 'Budget Tracker', position: { x: 0, y: 7 }, size: { width: 6, height: 3 } },
      { id: '7', type: 'expense-tracker', title: 'Expenses', position: { x: 6, y: 7 }, size: { width: 6, height: 3 } }
    ],
    roles: ['admin', 'project_lead'],
    premium: true,
    popularity: 78
  },
  {
    id: 'team-collaboration-hub',
    name: 'Team Collaboration Hub',
    description: 'Foster team communication and track collaboration',
    category: 'team',
    icon: Users,
    preview: ['Team Overview', 'Activity Feed', 'Messages', 'Workload'],
    widgets: [
      { id: '1', type: 'team-overview', title: 'Team Dashboard', position: { x: 0, y: 0 }, size: { width: 6, height: 4 } },
      { id: '2', type: 'workload-distribution', title: 'Workload Balance', position: { x: 6, y: 0 }, size: { width: 6, height: 4 } },
      { id: '3', type: 'activity-feed', title: 'Team Activity', position: { x: 0, y: 4 }, size: { width: 4, height: 4 } },
      { id: '4', type: 'recent-messages', title: 'Team Chat', position: { x: 4, y: 4 }, size: { width: 4, height: 4 } },
      { id: '5', type: 'meeting-schedule', title: 'Team Meetings', position: { x: 8, y: 4 }, size: { width: 4, height: 4 } },
      { id: '6', type: 'team-performance', title: 'Performance Metrics', position: { x: 0, y: 8 }, size: { width: 12, height: 3 } }
    ],
    roles: ['project_lead', 'admin'],
    popularity: 85
  },
  {
    id: 'contractor-operations',
    name: 'Contractor Operations',
    description: 'Site management, scheduling, and compliance tracking',
    category: 'project',
    icon: Building,
    preview: ['Work Schedule', 'Site Progress', 'Bid Opportunities', 'Safety'],
    widgets: [
      { id: '1', type: 'work-schedule', title: 'Work Schedule', position: { x: 0, y: 0 }, size: { width: 6, height: 4 } },
      { id: '2', type: 'site-progress', title: 'Site Progress', position: { x: 6, y: 0 }, size: { width: 6, height: 4 } },
      { id: '3', type: 'bid-opportunities', title: 'New Opportunities', position: { x: 0, y: 4 }, size: { width: 8, height: 3 } },
      { id: '4', type: 'material-orders', title: 'Material Orders', position: { x: 8, y: 4 }, size: { width: 4, height: 3 } },
      { id: '5', type: 'safety-compliance', title: 'Safety Status', position: { x: 0, y: 7 }, size: { width: 6, height: 3 } },
      { id: '6', type: 'payment-pending', title: 'Payments', position: { x: 6, y: 7 }, size: { width: 6, height: 3 } }
    ],
    roles: ['contractor'],
    popularity: 82
  },
  {
    id: 'designer-creative-space',
    name: 'Creative Design Studio',
    description: 'Design-focused dashboard with portfolio and inspiration',
    category: 'personal',
    icon: Palette,
    preview: ['My Projects', 'Design Gallery', 'Tasks', 'Inspiration'],
    widgets: [
      { id: '1', type: 'project-overview', title: 'My Projects', position: { x: 0, y: 0 }, size: { width: 6, height: 4 } },
      { id: '2', type: 'design-gallery', title: 'Portfolio Gallery', position: { x: 6, y: 0 }, size: { width: 6, height: 4 } },
      { id: '3', type: 'my-tasks', title: 'Design Tasks', position: { x: 0, y: 4 }, size: { width: 4, height: 4 } },
      { id: '4', type: 'recent-files', title: 'Recent Designs', position: { x: 4, y: 4 }, size: { width: 4, height: 4 } },
      { id: '5', type: 'ai-recommendations', title: 'Design Insights', position: { x: 8, y: 4 }, size: { width: 4, height: 4 } },
      { id: '6', type: 'quick-actions', title: 'Quick Tools', position: { x: 0, y: 8 }, size: { width: 12, height: 2 } }
    ],
    roles: ['designer'],
    popularity: 89
  },
  {
    id: 'analytics-powerhouse',
    name: 'Analytics Powerhouse',
    description: 'Data-driven insights and comprehensive reporting',
    category: 'business',
    icon: BarChart3,
    preview: ['Performance Charts', 'Trend Analysis', 'KPIs', 'Predictions'],
    widgets: [
      { id: '1', type: 'performance-metrics', title: 'KPI Dashboard', position: { x: 0, y: 0 }, size: { width: 6, height: 4 } },
      { id: '2', type: 'trend-analysis', title: 'Trend Analysis', position: { x: 6, y: 0 }, size: { width: 6, height: 4 } },
      { id: '3', type: 'project-analytics', title: 'Project Analytics', position: { x: 0, y: 4 }, size: { width: 4, height: 3 } },
      { id: '4', type: 'client-satisfaction', title: 'Client Satisfaction', position: { x: 4, y: 4 }, size: { width: 4, height: 3 } },
      { id: '5', type: 'productivity-chart', title: 'Productivity', position: { x: 8, y: 4 }, size: { width: 4, height: 3 } },
      { id: '6', type: 'ai-recommendations', title: 'AI Insights', position: { x: 0, y: 7 }, size: { width: 12, height: 3 } }
    ],
    roles: ['admin', 'project_lead'],
    premium: true,
    popularity: 76
  },
  {
    id: 'minimalist-focus',
    name: 'Minimalist Focus',
    description: 'Clean, distraction-free dashboard for focused work',
    category: 'personal',
    icon: Zap,
    preview: ['My Tasks', 'Today\'s Schedule', 'Quick Actions', 'Recent Activity'],
    widgets: [
      { id: '1', type: 'my-tasks', title: 'My Tasks', position: { x: 0, y: 0 }, size: { width: 8, height: 5 } },
      { id: '2', type: 'meeting-schedule', title: 'Today\'s Schedule', position: { x: 8, y: 0 }, size: { width: 4, height: 5 } },
      { id: '3', type: 'quick-actions', title: 'Quick Actions', position: { x: 0, y: 5 }, size: { width: 6, height: 3 } },
      { id: '4', type: 'activity-feed', title: 'Recent Activity', position: { x: 6, y: 5 }, size: { width: 6, height: 3 } }
    ],
    roles: ['all'],
    popularity: 91
  },
  {
    id: 'communication-central',
    name: 'Communication Central',
    description: 'Stay connected with messages, meetings, and updates',
    category: 'team',
    icon: MessageSquare,
    preview: ['Messages', 'Meetings', 'Announcements', 'Activity Feed'],
    widgets: [
      { id: '1', type: 'recent-messages', title: 'Messages', position: { x: 0, y: 0 }, size: { width: 6, height: 4 } },
      { id: '2', type: 'meeting-schedule', title: 'Meetings', position: { x: 6, y: 0 }, size: { width: 6, height: 4 } },
      { id: '3', type: 'announcements', title: 'Announcements', position: { x: 0, y: 4 }, size: { width: 8, height: 3 } },
      { id: '4', type: 'activity-feed', title: 'Activity Feed', position: { x: 8, y: 4 }, size: { width: 4, height: 3 } },
      { id: '5', type: 'notifications', title: 'Notifications', position: { x: 0, y: 7 }, size: { width: 12, height: 2 } }
    ],
    roles: ['all'],
    popularity: 84
  }
];

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onSelectTemplate,
  onClose,
  currentRole
}) => {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');

  // Filter templates based on search and category
  const filteredTemplates = DASHBOARD_TEMPLATES.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesRole = template.roles.includes('all') || template.roles.includes(currentRole);
    
    return matchesSearch && matchesCategory && matchesRole;
  });

  // Sort templates by featured, then popularity
  const sortedTemplates = filteredTemplates.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return (b.popularity || 0) - (a.popularity || 0);
  });

  const categories = [
    { id: 'all', name: 'All Templates', icon: Grid3x3 },
    { id: 'executive', name: 'Executive', icon: Crown },
    { id: 'business', name: 'Business', icon: TrendingUp },
    { id: 'project', name: 'Project', icon: Building },
    { id: 'team', name: 'Team', icon: Users },
    { id: 'personal', name: 'Personal', icon: Zap }
  ];

  const handleSelectTemplate = (template: Template) => {
    onSelectTemplate(template.widgets);
    toast.success(`Applied "${template.name}" template`);
    onClose();
  };

  const handleSaveAsTemplate = (templateName: string) => {
    // This would save the current layout as a custom template
    toast.success(`Template "${templateName}" saved successfully`);
    setShowSaveDialog(false);
    setTemplateName('');
  };

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold mb-2">Choose a Template</h2>
        <p className="text-muted-foreground">
          Select from our curated collection of dashboard layouts designed for your role
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(category => {
            const Icon = category.icon;
            return (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
              >
                <Icon className="h-4 w-4 mr-1" />
                {category.name}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {sortedTemplates.map((template) => {
            const Icon = template.icon;
            return (
              <motion.div
                key={template.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group"
              >
                <Card className="h-full hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-primary/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-primary" />
                        <CardTitle className="text-sm font-medium">{template.name}</CardTitle>
                      </div>
                      <div className="flex items-center gap-1">
                        {template.featured && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                        {template.premium && (
                          <Badge variant="outline" className="text-xs">
                            <Crown className="h-3 w-3 mr-1" />
                            Premium
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardDescription className="text-xs">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    {/* Preview widgets */}
                    <div className="space-y-2 mb-4">
                      <div className="text-xs font-medium text-muted-foreground">Includes:</div>
                      <div className="flex flex-wrap gap-1">
                        {template.preview.slice(0, 4).map((widget, index) => (
                          <Badge key={index} variant="outline" className="text-xs py-0">
                            {widget}
                          </Badge>
                        ))}
                        {template.preview.length > 4 && (
                          <Badge variant="outline" className="text-xs py-0">
                            +{template.preview.length - 4} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Popularity indicator */}
                    {template.popularity && (
                      <div className="flex items-center gap-2 mb-3">
                        <div className="text-xs text-muted-foreground">Popularity:</div>
                        <div className="flex-1 bg-secondary rounded-full h-1.5">
                          <div 
                            className="bg-primary rounded-full h-1.5 transition-all"
                            style={{ width: `${template.popularity}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground">{template.popularity}%</div>
                      </div>
                    )}

                    <Button 
                      className="w-full group-hover:bg-primary group-hover:text-primary-foreground"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectTemplate(template)}
                    >
                      <LayoutGrid className="h-4 w-4 mr-2" />
                      Apply Template
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {sortedTemplates.length === 0 && (
        <div className="text-center py-8">
          <div className="text-muted-foreground">
            No templates found matching your criteria
          </div>
        </div>
      )}

      {/* Save Template Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Current Layout as Template</DialogTitle>
            <DialogDescription>
              Save your current dashboard layout as a reusable template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                placeholder="My Custom Template"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => handleSaveAsTemplate(templateName)}
                disabled={!templateName.trim()}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplateSelector;