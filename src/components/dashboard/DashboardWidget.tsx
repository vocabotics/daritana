import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  X, Settings, Maximize2, Minimize2, GripVertical,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Calendar, Clock, DollarSign, Users, FileText, Package,
  BarChart3, PieChart, Activity, Zap
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
import TodaysActivityWidget from './widgets/TodaysActivityWidget';
import WeatherWidget from './widgets/WeatherWidget';

interface DashboardWidgetProps {
  widget: WidgetType;
  isEditMode: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onResize?: (size: { width: number; height: number }) => void;
  onMove?: (position: { x: number; y: number }) => void;
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
  'todays-activity': TodaysActivityWidget,
  'weather': WeatherWidget,
};

export default function DashboardWidget({
  widget,
  isEditMode,
  isSelected,
  onSelect,
  onRemove,
  onResize,
  onMove
}: DashboardWidgetProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const { getWidgetData } = useDashboardStore();

  useEffect(() => {
    loadWidgetData();
  }, [widget.type]);

  const loadWidgetData = async () => {
    try {
      setLoading(true);
      setError(null);
      const widgetData = await getWidgetData(widget.type);
      setData(widgetData);
    } catch (err) {
      setError('Failed to load widget data');
      console.error('Widget data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const WidgetComponent = widgetComponents[widget.type];
  
  const getWidgetIcon = () => {
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
    return icons[widget.type] || <BarChart3 className="h-4 w-4" />;
  };

  return (
    <div
      className={cn(
        "dashboard-widget relative",
        isEditMode && "cursor-move",
        isSelected && "ring-2 ring-blue-500",
        isMaximized && "fixed inset-4 z-50"
      )}
      style={{
        gridColumn: `span ${widget.size.width}`,
        gridRow: `span ${widget.size.height}`,
      }}
      onClick={() => isEditMode && onSelect()}
    >
      <Card className="h-full overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            {isEditMode && (
              <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
            )}
            {getWidgetIcon()}
            <CardTitle className="text-sm font-medium">
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
                  onClick={() => setIsMaximized(!isMaximized)}
                >
                  {isMaximized ? (
                    <Minimize2 className="h-3 w-3" />
                  ) : (
                    <Maximize2 className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={loadWidgetData}
                >
                  <Activity className="h-3 w-3" />
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
                    onRemove();
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 h-[calc(100%-4rem)] overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <AlertTriangle className="h-8 w-8 text-yellow-500 mb-2" />
              <p className="text-sm text-gray-500">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={loadWidgetData}
              >
                Retry
              </Button>
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
      
      {isEditMode && isSelected && (
        <>
          {/* Resize handles */}
          <div className="absolute -right-2 -bottom-2 w-4 h-4 bg-blue-500 rounded-full cursor-se-resize" />
          <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full cursor-e-resize" />
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-blue-500 rounded-full cursor-s-resize" />
        </>
      )}
    </div>
  );
}