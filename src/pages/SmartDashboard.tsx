import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { useAuthStore } from '@/store/authStore';
import { useProjectContextStore } from '@/store/projectContextStore';
import { useSmartDashboardStore } from '@/store/smartDashboardStore';
import { useProjectStore } from '@/store/projectStore';
import { useTaskStore } from '@/store/taskStore';
import { useFinancialStore } from '@/store/financialStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Settings, 
  Save, 
  RotateCcw, 
  Plus,
  Wand2,
  LayoutDashboard,
  RefreshCw,
  Eye,
  Edit2,
  Check,
  X,
  Star,
  Grid3x3
} from 'lucide-react';
import SimpleDashboardGrid from '@/components/dashboard/SimpleDashboardGrid';
import { WidgetLibrary } from '@/components/dashboard/WidgetLibrary';
import { DashboardTemplates, DashboardTemplate } from '@/components/dashboard/DashboardTemplates';
import { DashboardWidget } from '@/types/dashboard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';

export function SmartDashboard() {
  const { user } = useAuthStore();
  const { mode, currentProject } = useProjectContextStore();
  const { projects, fetchProjects } = useProjectStore();
  const { tasks, fetchTasks } = useTaskStore();
  const { invoices, quotations, fetchFinancialData } = useFinancialStore();
  
  const {
    currentLayout,
    isEditMode,
    savedLayouts,
    currentSavedLayoutId,
    setEditMode,
    addWidget,
    removeWidget,
    updateWidget,
    saveCurrentLayout,
    loadSavedLayout,
    loadUserLayouts,
    resetToDefaultForContext,
  } = useSmartDashboardStore();
  
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [customTemplateName, setCustomTemplateName] = useState('');
  const [customTemplateDescription, setCustomTemplateDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DashboardTemplate | null>(null);

  // Load real data on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchProjects(),
          fetchTasks(),
          fetchFinancialData()
        ]);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Load user layouts on mount
  useEffect(() => {
    if (user?.id) {
      loadUserLayouts(user.id);
    }
  }, [user?.id]);

  // Dashboard statistics from real data
  const dashboardStats = useMemo(() => ({
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'active' || p.status === 'in_progress').length,
    totalTasks: tasks.length,
    pendingTasks: tasks.filter(t => t.status === 'todo' || t.status === 'in_progress').length,
    totalRevenue: invoices?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0,
    pendingInvoices: invoices?.filter(inv => inv.status === 'pending').length || 0,
    teamMembers: 12, // This could come from a team store
    upcomingDeadlines: tasks.filter(t => {
      const dueDate = new Date(t.dueDate || t.endDate || '');
      const now = new Date();
      const daysDiff = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff >= 0 && daysDiff <= 7;
    }).length
  }), [projects, tasks, invoices]);

  const handleSelectTemplate = (template: DashboardTemplate) => {
    setSelectedTemplate(template);
    // Apply the template's widget layout
    template.widgets.forEach(widget => {
      addWidget(widget);
    });
    toast.success(`Applied "${template.name}" template`);
    setShowTemplateSelector(false);
  };

  const handleAddWidget = (widgetDef: any) => {
    const newWidget: DashboardWidget = {
      id: `widget-${Date.now()}`,
      type: widgetDef.type,
      title: widgetDef.title,
      position: { x: 0, y: 0 },
      size: widgetDef.defaultSize || { width: 4, height: 3 }
    };
    addWidget(newWidget);
    toast.success(`Added "${widgetDef.title}" widget`);
  };

  const handleSaveLayout = async () => {
    if (!customTemplateName) {
      toast.error('Please enter a name for your layout');
      return;
    }
    
    try {
      await saveCurrentLayout(customTemplateName, customTemplateDescription);
      toast.success('Layout saved successfully');
      setShowSaveDialog(false);
      setCustomTemplateName('');
      setCustomTemplateDescription('');
    } catch (error) {
      toast.error('Failed to save layout');
    }
  };

  const handleLayoutChange = (layout: any[]) => {
    // Update widget positions based on grid layout changes
    layout.forEach(item => {
      updateWidget(item.i, {
        position: { x: item.x, y: item.y },
        size: { width: item.w, height: item.h }
      });
    });
  };

  const toolbar = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-semibold">Personal Dashboard</h1>
        <div className="flex gap-2">
          <Badge variant="outline" className="gap-1">
            <Grid3x3 className="h-3 w-3" />
            {currentLayout.length} widgets
          </Badge>
          {selectedTemplate && (
            <Badge variant="secondary" className="gap-1">
              <Star className="h-3 w-3" />
              {selectedTemplate.name}
            </Badge>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTemplateSelector(true)}
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Templates
              </Button>
            </TooltipTrigger>
            <TooltipContent>Choose from pre-built layouts</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowWidgetLibrary(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Widget
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add widgets to your dashboard</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="h-6 w-px bg-gray-200" />

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isEditMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEditMode(!isEditMode)}
              >
                {isEditMode ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Done
                  </>
                ) : (
                  <>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isEditMode ? 'Finish editing' : 'Edit dashboard layout'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {isEditMode && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSaveDialog(true)}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Layout
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={resetToDefaultForContext}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </>
        )}
      </div>
    </div>
  );

  if (isLoading && !projects.length) {
    return (
      <Layout toolbar={toolbar}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">Loading dashboard data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout toolbar={toolbar}>
      <div className="h-full bg-gray-50">
        {/* Quick Stats Bar */}
        <div className="px-6 py-4 bg-white border-b">
          <div className="grid grid-cols-4 lg:grid-cols-8 gap-4">
            <div className="text-center">
              <div className="text-2xl font-semibold">{dashboardStats.activeProjects}</div>
              <div className="text-xs text-gray-500">Active Projects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold">{dashboardStats.pendingTasks}</div>
              <div className="text-xs text-gray-500">Pending Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold">RM {(dashboardStats.totalRevenue / 1000).toFixed(0)}k</div>
              <div className="text-xs text-gray-500">Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold">{dashboardStats.pendingInvoices}</div>
              <div className="text-xs text-gray-500">Pending Invoices</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold">{dashboardStats.teamMembers}</div>
              <div className="text-xs text-gray-500">Team Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold">{dashboardStats.upcomingDeadlines}</div>
              <div className="text-xs text-gray-500">Due This Week</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold">92%</div>
              <div className="text-xs text-gray-500">Efficiency</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold">4.8</div>
              <div className="text-xs text-gray-500">Client Rating</div>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="p-6">
          {currentLayout.length > 0 ? (
            <SimpleDashboardGrid
              widgets={currentLayout}
              isEditMode={isEditMode}
              onRemoveWidget={removeWidget}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-96 bg-white rounded-lg border-2 border-dashed border-gray-200">
              <LayoutDashboard className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No widgets added yet</h3>
              <p className="text-gray-500 mb-6 text-center max-w-md">
                Start by choosing a template or adding widgets to customize your dashboard
              </p>
              <div className="flex gap-3">
                <Button onClick={() => setShowTemplateSelector(true)}>
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Choose Template
                </Button>
                <Button variant="outline" onClick={() => setShowWidgetLibrary(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Widgets
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Template Selector Dialog */}
        <Dialog open={showTemplateSelector} onOpenChange={setShowTemplateSelector}>
          <DialogContent className="max-w-6xl h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Choose a Dashboard Template</DialogTitle>
              <DialogDescription>
                Select a pre-built layout to get started quickly
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto h-full pb-6">
              <DashboardTemplates
                onSelectTemplate={handleSelectTemplate}
                currentTemplateId={selectedTemplate?.id}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Widget Library */}
        <AnimatePresence>
          {showWidgetLibrary && (
            <WidgetLibrary
              onAddWidget={handleAddWidget}
              isOpen={showWidgetLibrary}
              onClose={() => setShowWidgetLibrary(false)}
            />
          )}
        </AnimatePresence>

        {/* Save Layout Dialog */}
        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Dashboard Layout</DialogTitle>
              <DialogDescription>
                Save your current dashboard configuration as a template
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Layout Name</label>
                <Input
                  placeholder="e.g., My Productivity Dashboard"
                  value={customTemplateName}
                  onChange={(e) => setCustomTemplateName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Description (optional)</label>
                <Input
                  placeholder="Describe this layout..."
                  value={customTemplateDescription}
                  onChange={(e) => setCustomTemplateDescription(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveLayout}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Layout
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

export default SmartDashboard;