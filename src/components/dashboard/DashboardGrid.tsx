import React, { useState, useEffect } from 'react';
import GridLayout, { Layout, Responsive, WidthProvider } from 'react-grid-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  X, Settings, Maximize2, Minimize2, GripVertical,
  TrendingUp, AlertTriangle, CheckCircle,
  Calendar, Clock, DollarSign, Users, FileText,
  BarChart3, Activity, Zap, RefreshCw
} from 'lucide-react';
import { DashboardWidget as WidgetType } from '@/types/dashboard';
import { useDashboardStore } from '@/store/dashboardStore';
import { cn } from '@/lib/utils';

// Import widget components
import ProjectOverviewWidget from './widgets/ProjectOverviewWidget';
import ActiveProjectsWidget from './widgets/ActiveProjectsWidget';
import MyTasksWidget from './widgets/MyTasksWidget';
import RevenueChartWidget from './widgets/RevenueChartWidget';
import TeamOverviewWidget from './widgets/TeamOverviewWidget';
import UpcomingDeadlinesWidget from './widgets/UpcomingDeadlinesWidget';
import ProjectUpdatesWidget from './widgets/ProjectUpdatesWidget';
import ApprovalRequestsWidget from './widgets/ApprovalRequestsWidget';
import BidOpportunitiesWidget from './widgets/BidOpportunitiesWidget';
import WorkScheduleWidget from './widgets/WorkScheduleWidget';
import PerformanceMetricsWidget from './widgets/PerformanceMetricsWidget';
import AIRecommendationsWidget from './widgets/AIRecommendationsWidget';
import QuickActionsWidget from './widgets/QuickActionsWidget';
import RecentFilesWidget from './widgets/RecentFilesWidget';
import ActivityFeedWidget from './widgets/ActivityFeedWidget';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardGridProps {
  widgets: WidgetType[];
  isEditMode: boolean;
  onLayoutChange: (layout: Layout[]) => void;
  onRemoveWidget: (widgetId: string) => void;
}

const widgetComponents: Record<string, React.ComponentType<{ data: any }>> = {
  'project-overview': ProjectOverviewWidget,
  'active-projects': ActiveProjectsWidget,
  'my-tasks': MyTasksWidget,
  'revenue-chart': RevenueChartWidget,
  'team-overview': TeamOverviewWidget,
  'upcoming-deadlines': UpcomingDeadlinesWidget,
  'project-updates': ProjectUpdatesWidget,
  'approval-requests': ApprovalRequestsWidget,
  'bid-opportunities': BidOpportunitiesWidget,
  'work-schedule': WorkScheduleWidget,
  'performance-metrics': PerformanceMetricsWidget,
  'ai-recommendations': AIRecommendationsWidget,
  'quick-actions': QuickActionsWidget,
  'recent-files': RecentFilesWidget,
  'activity-feed': ActivityFeedWidget,
};


export default function DashboardGrid({ 
  widgets, 
  isEditMode, 
  onLayoutChange, 
  onRemoveWidget 
}: DashboardGridProps) {
  const [widgetData, setWidgetData] = useState<Record<string, any>>({});
  const [loadingWidgets, setLoadingWidgets] = useState<Record<string, boolean>>({});
  const [maximizedWidget, setMaximizedWidget] = useState<string | null>(null);
  const { getWidgetData } = useDashboardStore();

  useEffect(() => {
    // Load data for all widgets
    widgets.forEach(widget => {
      loadWidgetData(widget.id, widget.type);
    });
  }, [widgets]);

  const loadWidgetData = async (widgetId: string, widgetType: string) => {
    setLoadingWidgets(prev => ({ ...prev, [widgetId]: true }));
    try {
      const data = await getWidgetData(widgetType);
      setWidgetData(prev => ({ ...prev, [widgetId]: data }));
    } catch (error) {
      console.error(`Failed to load data for widget ${widgetId}:`, error);
    } finally {
      setLoadingWidgets(prev => ({ ...prev, [widgetId]: false }));
    }
  };

  const getWidgetIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      'project-overview': <BarChart3 className="h-4 w-4" />,
      'active-projects': <FileText className="h-4 w-4" />,
      'my-tasks': <CheckCircle className="h-4 w-4" />,
      'revenue-chart': <TrendingUp className="h-4 w-4" />,
      'team-overview': <Users className="h-4 w-4" />,
      'upcoming-deadlines': <Clock className="h-4 w-4" />,
      'performance-metrics': <Activity className="h-4 w-4" />,
      'ai-recommendations': <Zap className="h-4 w-4" />,
      'quick-actions': <Zap className="h-4 w-4" />,
    };
    return icons[type] || <BarChart3 className="h-4 w-4" />;
  };

  // Convert widgets to grid layout format
  const layout: Layout[] = widgets.map(widget => ({
    i: widget.id,
    x: widget.position.x,
    y: widget.position.y,
    w: widget.size.width,
    h: widget.size.height,
    minW: 2,
    minH: 2,
    maxW: 12,
  }));

  const handleLayoutChange = (newLayout: Layout[]) => {
    if (isEditMode) {
      onLayoutChange(newLayout);
    }
  };

  const renderWidget = (widget: WidgetType) => {
    const WidgetComponent = widgetComponents[widget.type];
    const isMaximized = maximizedWidget === widget.id;
    const isLoading = loadingWidgets[widget.id];
    const data = widgetData[widget.id];

    return (
      <div key={widget.id} className={cn(
        "dashboard-widget h-full",
        isMaximized && "fixed inset-4 z-50 bg-white"
      )}>
        <Card className="h-full overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 select-none bg-gray-50 border-b">
            <div className="flex items-center gap-2">
              {isEditMode && (
                <GripVertical className="h-4 w-4 text-gray-400 cursor-move drag-handle" />
              )}
              {getWidgetIcon(widget.type)}
              <CardTitle className="text-sm font-medium text-gray-700">
                {widget.title}
              </CardTitle>
            </div>
            <div className="flex items-center gap-1">
              {!isEditMode && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      loadWidgetData(widget.id, widget.type);
                    }}
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMaximizedWidget(isMaximized ? null : widget.id);
                    }}
                  >
                    {isMaximized ? (
                      <Minimize2 className="h-3 w-3" />
                    ) : (
                      <Maximize2 className="h-3 w-3" />
                    )}
                  </Button>
                </>
              )}
              {isEditMode && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Open widget settings
                    }}
                  >
                    <Settings className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-red-500 hover:text-red-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveWidget(widget.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 h-[calc(100%-3.5rem)] overflow-auto bg-white">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : WidgetComponent ? (
              <WidgetComponent data={data} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-gray-500">Widget not implemented</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  if (maximizedWidget) {
    const widget = widgets.find(w => w.id === maximizedWidget);
    if (widget) {
      return renderWidget(widget);
    }
  }

  return (
    <div className={cn(
      "dashboard-grid-container p-4",
      isEditMode && "select-none"
    )}>
      <style>{`
        .react-grid-layout {
          background-color: transparent;
        }
        .react-grid-item {
          transition: all 200ms ease;
        }
        .react-grid-item.react-grid-placeholder {
          background: rgb(59, 130, 246, 0.1);
          border: 2px dashed rgb(59, 130, 246);
          border-radius: 8px;
          z-index: 2;
        }
        .react-grid-item > .react-resizable-handle {
          background-image: none;
          background-color: rgb(59, 130, 246);
          border-radius: 50%;
          width: 10px;
          height: 10px;
          bottom: 3px;
          right: 3px;
        }
        .react-grid-item > .react-resizable-handle::after {
          content: '';
          border: none;
        }
        .dashboard-grid-container.select-none {
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
        }
        .react-grid-item.cssTransforms {
          transition: transform 200ms ease;
        }
        .react-grid-item.resizing {
          opacity: 0.9;
          z-index: 10;
        }
        .react-grid-item.react-draggable-dragging {
          opacity: 0.8;
          z-index: 100;
          transition: none;
        }
        .react-grid-item:not(.react-grid-placeholder) {
          background: transparent;
        }
      `}</style>
      
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 12, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={60}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".drag-handle"
        margin={[12, 12]}
        containerPadding={[0, 0]}
        compactType="vertical"
        preventCollision={false}
        autoSize={true}
        useCSSTransforms={true}
      >
        {widgets.map(widget => (
          <div key={widget.id}>
            {renderWidget(widget)}
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
}