import React, { useEffect, useState, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { DashboardEmptyState } from '@/components/ui/empty-state';
import { useAuthStore } from '@/store/authStore';
import { useDashboardStore } from '@/store/dashboardStore';
import { useProjectContextStore } from '@/store/projectContextStore';
import { useDemoStore } from '@/store/demoStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { useQueryCache, useComponentCache } from '@/utils/caching';
import { createMemoizedComponent } from '@/utils/performanceOptimizations';
import { 
  Plus, Settings, Save, RotateCcw, Grid3x3, Maximize,
  LayoutDashboard, Edit3, Check, X, Palette, Sparkles
} from 'lucide-react';
import DashboardGrid from '@/components/dashboard/DashboardGrid';
import TemplateSelector from '@/components/dashboard/TemplateSelector';
import { DEFAULT_LAYOUTS, WIDGET_CATEGORIES, DashboardWidget as WidgetType } from '@/types/dashboard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export function Dashboard() {
  // Performance monitoring
  const { measureApiCall } = usePerformanceMonitor('Dashboard');
  
  const { user } = useAuthStore();
  const { mode, currentProject } = useProjectContextStore();
  const { isEnabled: isDemoMode } = useDemoStore();
  const {
    currentLayout,
    isEditMode,
    selectedWidget,
    setLayout,
    addWidget,
    removeWidget,
    setEditMode,
    selectWidget,
    saveLayout,
    resetToDefault,
    savedLayouts,
    loadLayout,
    updateLayoutFromGrid
  } = useDashboardStore();
  
  // Cache dashboard statistics
  const { data: dashboardStats, isLoading: statsLoading } = useQueryCache(
    user ? `dashboard-stats-${user.id}` : null,
    async () => {
      // Simulate API call for dashboard statistics
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        totalProjects: 12,
        activeProjects: 8,
        completedTasks: 145,
        pendingTasks: 23,
        teamMembers: 15,
        upcomingDeadlines: 5
      };
    },
    {
      ttl: 5 * 60 * 1000, // Cache for 5 minutes
      tags: ['dashboard', 'statistics'],
      staleWhileRevalidate: true
    }
  );
  
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [layoutName, setLayoutName] = useState('');
  
  // Track if there are unsaved changes
  const [hasChanges, setHasChanges] = useState(false);
  
  // Initialize dashboard based on user role
  useEffect(() => {
    if (user && currentLayout.length === 0) {
      const defaultLayout = DEFAULT_LAYOUTS[user.role] || DEFAULT_LAYOUTS.designer;
      setLayout(defaultLayout);
    }
  }, [user, currentLayout, setLayout]);
  
  if (!user) return null;
  
  // Memoized welcome message
  const welcomeMessage = useMemo(() => {
    if (!user) return '';
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    return `${greeting}, ${user.name}`;
  }, [user?.name]);
  
  // Memoized dashboard configuration
  const dashboardConfig = useComponentCache(
    `dashboard-config-${user?.role}`,
    () => {
      const defaultLayout = DEFAULT_LAYOUTS[user?.role || 'designer'] || DEFAULT_LAYOUTS.designer;
      return {
        canCustomize: user?.role === 'designer' || user?.role === 'project_lead' || user?.role === 'staff',
        defaultLayout
      };
    },
    [user?.role]
  );
  
  // Use cached dashboard configuration
  const { canCustomize } = dashboardConfig;
  
  const handleAddWidget = (widgetType: WidgetType['type'], title: string, defaultSize: { width: number; height: number }) => {
    const newWidget: WidgetType = {
      id: Date.now().toString(),
      type: widgetType,
      title,
      position: { x: 0, y: 0 }, // Will be placed at the first available spot
      size: defaultSize
    };
    addWidget(newWidget);
    setShowWidgetLibrary(false);
    toast.success(`Added ${title} widget`);
  };
  
  const handleSaveLayout = () => {
    if (!layoutName.trim()) {
      toast.error('Please enter a layout name');
      return;
    }
    saveLayout(layoutName);
    setShowSaveDialog(false);
    setLayoutName('');
    toast.success('Layout saved successfully');
  };
  
  const handleLoadLayout = (layoutId: string) => {
    loadLayout(layoutId);
    toast.success('Layout loaded successfully');
  };
  
  const handleResetLayout = () => {
    if (user) {
      resetToDefault(user.role);
      toast.success('Dashboard reset to default');
    }
  };
  
  // Memoized dashboard title and description
  const dashboardTitle = useMemo(() => {
    if (mode === 'project' && currentProject) {
      return `${currentProject.name} Dashboard`;
    }
    return welcomeMessage;
  }, [mode, currentProject?.name, welcomeMessage]);

  const dashboardDescription = useMemo(() => {
    if (mode === 'project' && currentProject) {
      return `Project overview and key metrics for ${currentProject.name}`;
    }
    return user?.role === 'client' 
      ? 'Track your projects and communicate with your design team'
      : user?.role === 'contractor'
      ? 'Manage contracts, bids, and track project progress'
      : user?.role === 'designer'
      ? 'Access design tasks, briefs, and collaborate with teams'
      : 'Oversee projects, manage teams, and monitor performance';
  }, [mode, currentProject?.name, user?.role]);

  const dashboardActions = (
    <div className="flex items-center space-x-2">
      {(user.role === 'designer' || user.role === 'project_lead') && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTemplateSelector(true)}
            className="flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Templates
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditMode(!isEditMode)}
            className="flex items-center gap-2"
          >
            {isEditMode ? <Check className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            {isEditMode ? 'Done' : 'Edit'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSaveDialog(true)}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetLayout}
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        </>
      )}
    </div>
  );

  return (
    <Layout
      contextualInfo={false}
      fullHeight={true}
      title={dashboardTitle}
      subtitle={dashboardDescription}
      actions={canCustomize ? dashboardActions : undefined}
    >
      <div className="h-full space-y-4">
        {/* Dashboard Content */}
        <div className="flex-1 min-h-0">
          
          {/* Dashboard Controls */}
          {canCustomize && (
            <div className="flex items-center gap-2">
              {savedLayouts.length > 0 && (
                <div className="flex items-center gap-1">
                  {savedLayouts.map((layout) => (
                    <Button
                      key={layout.id}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLoadLayout(layout.id)}
                    >
                      {layout.name}
                    </Button>
                  ))}
                </div>
              )}
              
              {isEditMode ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowWidgetLibrary(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Widget
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSaveDialog(true)}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save Layout
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetLayout}
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Reset
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setEditMode(false)}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Done
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditMode(true)}
                >
                  <Edit3 className="h-4 w-4 mr-1" />
                  Customize
                </Button>
              )}
            </div>
          )}
        </div>
        
        {/* Dashboard Grid */}
        {currentLayout.length === 0 && !isDemoMode ? (
          <div className="flex items-center justify-center h-96">
            <DashboardEmptyState onCustomizeDashboard={() => setShowWidgetLibrary(true)} />
          </div>
        ) : (
          <DashboardGrid
            widgets={currentLayout}
          isEditMode={isEditMode}
          onLayoutChange={updateLayoutFromGrid}
          onRemoveWidget={removeWidget}
        />
        )}
      </div>
      
      {/* Widget Library Dialog */}
      <Dialog open={showWidgetLibrary} onOpenChange={setShowWidgetLibrary}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Widget Library</DialogTitle>
            <DialogDescription>
              Choose widgets to add to your dashboard
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue={WIDGET_CATEGORIES[0].category} className="mt-4">
            <TabsList className="grid grid-cols-4 lg:grid-cols-6">
              {WIDGET_CATEGORIES.map((category) => (
                <TabsTrigger key={category.category} value={category.category} className="text-xs">
                  {category.category}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {WIDGET_CATEGORIES.map((category) => (
              <TabsContent key={category.category} value={category.category}>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.widgets
                    .filter(w => w.roles.includes('all') || w.roles.includes(user.role))
                    .map((widget) => (
                      <Card
                        key={widget.type}
                        className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleAddWidget(widget.type, widget.title, widget.defaultSize)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <Grid3x3 className="h-5 w-5 text-gray-400" />
                          {widget.premium && (
                            <Badge variant="secondary" className="text-xs">Premium</Badge>
                          )}
                        </div>
                        <h4 className="font-medium text-sm mb-1">{widget.title}</h4>
                        <p className="text-xs text-gray-500">{widget.description}</p>
                        <div className="mt-2 text-xs text-gray-400">
                          Size: {widget.defaultSize.width}x{widget.defaultSize.height}
                        </div>
                      </Card>
                    ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </DialogContent>
      </Dialog>
      
      {/* Save Layout Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Dashboard Layout</DialogTitle>
            <DialogDescription>
              Give your custom layout a name to save it for later use
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <Input
                placeholder="Enter layout name..."
                value={layoutName}
                onChange={(e) => setLayoutName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSaveLayout()}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveLayout}>
                Save Layout
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Template Selector Dialog */}
      <Dialog open={showTemplateSelector} onOpenChange={setShowTemplateSelector}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Dashboard Templates</DialogTitle>
            <DialogDescription>
              Choose from our professionally designed dashboard layouts
            </DialogDescription>
          </DialogHeader>
          <TemplateSelector 
            onSelectTemplate={(widgets) => {
              setLayout(widgets);
              setHasChanges(true);
              toast.success('Template applied successfully!');
            }}
            onClose={() => setShowTemplateSelector(false)}
            currentRole={user?.role || 'staff'}
          />
        </DialogContent>
      </Dialog>
    </Layout>
  );
}