import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  X, Settings, Maximize2, Minimize2, GripVertical,
  TrendingUp, CheckCircle, Clock, Users, FileText,
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

interface SimpleDashboardGridProps {
  widgets: WidgetType[];
  isEditMode: boolean;
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

export default function SimpleDashboardGrid({ 
  widgets, 
  isEditMode, 
  onRemoveWidget 
}: SimpleDashboardGridProps) {
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

  // Calculate grid class based on widget size
  const getGridClass = (widget: WidgetType) => {
    const colSpan = `col-span-${Math.min(widget.size.width, 12)}`;
    const rowSpan = widget.size.height <= 2 ? 'h-48' : 
                    widget.size.height <= 3 ? 'h-64' : 
                    widget.size.height <= 4 ? 'h-80' : 
                    widget.size.height <= 5 ? 'h-96' : 'h-[28rem]';
    return `${colSpan} ${rowSpan}`;
  };

  const renderWidget = (widget: WidgetType) => {
    const WidgetComponent = widgetComponents[widget.type];
    const isMaximized = maximizedWidget === widget.id;
    const isLoading = loadingWidgets[widget.id];
    const data = widgetData[widget.id];

    if (isMaximized) {
      return (
        <div className="fixed inset-4 z-50 bg-white rounded-lg shadow-2xl">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gray-50 border-b">
              <div className="flex items-center gap-2">
                {getWidgetIcon(widget.type)}
                <CardTitle className="text-sm font-medium text-gray-700">
                  {widget.title}
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setMaximizedWidget(null)}
              >
                <Minimize2 className="h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent className="p-4 h-[calc(100%-3.5rem)] overflow-auto">
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
    }

    return (
      <Card className="h-full overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gray-50 border-b">
          <div className="flex items-center gap-2">
            {isEditMode && (
              <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
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
                  onClick={() => loadWidgetData(widget.id, widget.type)}
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setMaximizedWidget(widget.id)}
                >
                  <Maximize2 className="h-3 w-3" />
                </Button>
              </>
            )}
            {isEditMode && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {}}
                >
                  <Settings className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-red-500 hover:text-red-700"
                  onClick={() => onRemoveWidget(widget.id)}
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
    );
  };

  // Group widgets into rows for better organization
  const organizeWidgets = () => {
    const rows: WidgetType[][] = [];
    let currentRow: WidgetType[] = [];
    let currentWidth = 0;

    widgets
      .sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x)
      .forEach(widget => {
        if (currentWidth + widget.size.width > 12) {
          if (currentRow.length > 0) {
            rows.push(currentRow);
            currentRow = [];
            currentWidth = 0;
          }
        }
        currentRow.push(widget);
        currentWidth += widget.size.width;
      });

    if (currentRow.length > 0) {
      rows.push(currentRow);
    }

    return rows;
  };

  const widgetRows = organizeWidgets();

  return (
    <div className="p-4 space-y-4">
      {widgetRows.map((row, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-12 gap-4">
          {row.map(widget => (
            <div
              key={widget.id}
              className={cn(
                "transition-all",
                `col-span-${Math.min(widget.size.width, 12)}`,
                widget.size.height <= 2 ? 'min-h-[12rem]' : 
                widget.size.height <= 3 ? 'min-h-[16rem]' : 
                widget.size.height <= 4 ? 'min-h-[20rem]' : 
                widget.size.height <= 5 ? 'min-h-[24rem]' : 'min-h-[28rem]'
              )}
              style={{
                gridColumn: `span ${Math.min(widget.size.width, 12)} / span ${Math.min(widget.size.width, 12)}`
              }}
            >
              {renderWidget(widget)}
            </div>
          ))}
        </div>
      ))}
      
      {maximizedWidget && widgets.find(w => w.id === maximizedWidget) && 
        renderWidget(widgets.find(w => w.id === maximizedWidget)!)
      }
    </div>
  );
}