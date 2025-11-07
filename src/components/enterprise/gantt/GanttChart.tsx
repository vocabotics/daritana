import React, { useState, useRef, useEffect, useMemo, useCallback, useLayoutEffect } from 'react';
import { format, differenceInDays, addDays, startOfDay, endOfDay, isWeekend } from 'date-fns';
import { ChevronDown, ChevronRight, Milestone, AlertTriangle, Users, Calendar, Filter, Settings, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { GanttTask, TaskDependency, TaskBaseline } from '@/types/enterprise-pm';
import './gantt-chart.css';

interface GanttChartProps {
  tasks: GanttTask[];
  onTaskUpdate?: (task: GanttTask) => void;
  onDependencyCreate?: (from: string, to: string, type: string) => void;
  showBaseline?: number;
  showCriticalPath?: boolean;
  viewMode?: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
  startDate?: Date;
  endDate?: Date;
}

type ViewMode = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';

const VIEW_CONFIGS: Record<ViewMode, { cellWidth: number; format: string; headerFormat: string }> = {
  hour: { cellWidth: 40, format: 'HH:mm', headerFormat: 'MMM dd, yyyy' },
  day: { cellWidth: 50, format: 'dd', headerFormat: 'MMMM yyyy' },
  week: { cellWidth: 120, format: "'W'w", headerFormat: 'MMMM yyyy' },
  month: { cellWidth: 120, format: 'MMM', headerFormat: 'yyyy' },
  quarter: { cellWidth: 200, format: "'Q'Q", headerFormat: 'yyyy' },
  year: { cellWidth: 200, format: 'yyyy', headerFormat: 'yyyy' }
};

export const GanttChart: React.FC<GanttChartProps> = ({
  tasks,
  onTaskUpdate,
  onDependencyCreate,
  showBaseline = -1,
  showCriticalPath = true,
  viewMode: initialViewMode = 'day',
  startDate: propStartDate,
  endDate: propEndDate
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  // Simple refs for basic functionality
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate date range
  const dateRange = useMemo(() => {
    if (propStartDate && propEndDate) {
      return { start: startOfDay(propStartDate), end: endOfDay(propEndDate) };
    }
    
    let minDate = new Date();
    let maxDate = new Date();
    
    tasks.forEach(task => {
      if (task.startDate < minDate) minDate = task.startDate;
      if (task.endDate > maxDate) maxDate = task.endDate;
      
      task.baselines?.forEach(baseline => {
        if (baseline.startDate < minDate) minDate = baseline.startDate;
        if (baseline.endDate > maxDate) maxDate = baseline.endDate;
      });
    });
    
    const start = addDays(minDate, -7);
    const end = addDays(maxDate, 7);
    
    return { start: startOfDay(start), end: endOfDay(end) };
  }, [tasks, propStartDate, propEndDate]);

  const totalDays = differenceInDays(dateRange.end, dateRange.start) + 1;

  // Toggle task expansion
  const toggleTask = useCallback((taskId: string) => {
    setExpandedTasks(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(taskId)) {
        newExpanded.delete(taskId);
      } else {
        newExpanded.add(taskId);
      }
      return newExpanded;
    });
  }, []);

  // Calculate task position (grid-based)
  const getTaskPosition = useCallback((task: GanttTask) => {
    const startDiff = differenceInDays(task.startDate, dateRange.start);
    const duration = differenceInDays(task.endDate, task.startDate) + 1;
    
    return {
      gridColumnStart: startDiff + 1,
      gridColumnEnd: startDiff + duration + 1,
      percentComplete: task.percentComplete || 0
    };
  }, [dateRange.start]);

  // Get baseline position (grid-based)
  const getBaselinePosition = useCallback((baseline: TaskBaseline) => {
    const startDiff = differenceInDays(baseline.startDate, dateRange.start);
    
    return {
      gridColumnStart: startDiff + 1,
      gridColumnEnd: startDiff + baseline.duration + 1
    };
  }, [dateRange.start]);

  // Filter visible tasks
  const visibleTasks = useMemo(() => {
    const visible: GanttTask[] = [];
    
    const addTaskAndChildren = (task: GanttTask) => {
      visible.push(task);
      
      if (expandedTasks.has(task.id) && task.children) {
        task.children.forEach(childId => {
          const child = tasks.find(t => t.id === childId);
          if (child) addTaskAndChildren(child);
        });
      }
    };
    
    tasks.filter(t => !t.parentId).forEach(addTaskAndChildren);
    
    return visible;
  }, [tasks, expandedTasks]);

  // Render timeline header (grid-based)
  const renderTimelineHeader = useCallback(() => {
    const headers: JSX.Element[] = [];
    const maxCols = Math.min(totalDays, 50);
    
    for (let i = 0; i < maxCols; i++) {
      const date = addDays(dateRange.start, i);
      const isWeekendDay = isWeekend(date);
      
      headers.push(
        <div
          key={i}
          className={cn(
            "gantt-timeline-cell",
            isWeekendDay && "weekend"
          )}
        >
          {format(date, VIEW_CONFIGS[viewMode].format)}
        </div>
      );
    }
    
    return headers;
  }, [totalDays, dateRange.start, viewMode]);

  // Grid lines are now handled by CSS Grid

  // Render task list (simplified)
  const renderTaskList = useCallback(() => {
    return (
      <div className="gantt-task-list">
        <div className="gantt-task-list-header">
          <div>Task Name</div>
          <div className="hidden sm:block">Duration</div>
          <div>Resources</div>
        </div>
        
        <div className="gantt-task-list-body">
          {visibleTasks.map((task) => (
            <div
              key={task.id}
              className={cn(
                "gantt-task-item",
                selectedTask === task.id && "selected",
                task.isCritical && showCriticalPath && "critical"
              )}
              style={{ paddingLeft: `${task.level * 12 + 8}px` }}
              onClick={() => setSelectedTask(task.id)}
            >
              <div className="flex items-center gap-1 min-w-0">
                {task.children && task.children.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTask(task.id);
                    }}
                    className="p-0.5 flex-shrink-0"
                  >
                    {expandedTasks.has(task.id) ? 
                      <ChevronDown className="w-3 h-3" /> : 
                      <ChevronRight className="w-3 h-3" />
                    }
                  </button>
                )}
                {task.type === 'milestone' && <Milestone className="w-3 h-3 flex-shrink-0" />}
                <span className="truncate" title={task.name}>{task.name}</span>
              </div>
              <div className="hidden sm:block text-right text-sm">{task.duration}d</div>
              <div className="flex -space-x-1 justify-end">
                {task.resources?.slice(0, 2).map((resource, i) => (
                  <div
                    key={i}
                    className="w-5 h-5 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center"
                  >
                    <Users className="w-2 h-2" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }, [visibleTasks, selectedTask, showCriticalPath, expandedTasks, toggleTask]);

  // Render tasks (grid-based)
  const renderTasks = useCallback(() => {
    return visibleTasks.map((task, index) => {
      const position = getTaskPosition(task);
      const baseline = showBaseline >= 0 ? task.baselines?.find(b => b.number === showBaseline) : null;
      const baselinePos = baseline ? getBaselinePosition(baseline) : null;
      
      return (
        <div
          key={task.id}
          className="gantt-task-row"
          style={{ gridRow: index + 1 }}
        >
          {/* Baseline Bar */}
          {baselinePos && (
            <div
              className="gantt-baseline"
              style={{
                gridColumnStart: baselinePos.gridColumnStart,
                gridColumnEnd: baselinePos.gridColumnEnd
              }}
            />
          )}
          
          {/* Task Bar */}
          <div
            className={cn(
              "gantt-task-bar",
              task.type === 'milestone' ? "milestone" : 
              task.isCritical && showCriticalPath ? "critical" : "normal",
              selectedTask === task.id && "selected",
              task.isCritical && showCriticalPath && "pulse"
            )}
            style={{
              gridColumnStart: position.gridColumnStart,
              gridColumnEnd: position.gridColumnEnd
            }}
          >
            {task.type !== 'milestone' && (
              <>
                {/* Progress Bar */}
                <div
                  className="gantt-progress-bar"
                  style={{ width: `${position.percentComplete}%` }}
                />
                
                {/* Resize Handles */}
                <div className="gantt-resize-handle left" />
                <div className="gantt-resize-handle right" />
                
                {/* Task Label */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="gantt-task-label">
                        {task.name}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-sm">
                        <p className="font-semibold">{task.name}</p>
                        <p>Start: {format(task.startDate, 'MMM dd, yyyy')}</p>
                        <p>End: {format(task.endDate, 'MMM dd, yyyy')}</p>
                        <p>Progress: {task.percentComplete}%</p>
                        {task.totalFloat !== undefined && (
                          <p>Float: {task.totalFloat} days</p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            )}
          </div>
        </div>
      );
    });
  }, [visibleTasks, getTaskPosition, getBaselinePosition, showBaseline, showCriticalPath, selectedTask]);

  return (
    <div ref={containerRef} className="gantt-chart-container">
      {/* Toolbar */}
      <div className="gantt-toolbar">
        <div className="flex items-center gap-4">
          <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hour">Hour</SelectItem>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="quarter">Quarter</SelectItem>
              <SelectItem value="year">Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant={showCriticalPath ? "default" : "outline"}
            size="sm"
            className="gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            Critical Path
          </Button>
          
          <Select value={showBaseline.toString()}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Show Baseline" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="-1">No Baseline</SelectItem>
              <SelectItem value="0">Baseline</SelectItem>
              <SelectItem value="1">Baseline 1</SelectItem>
              <SelectItem value="2">Baseline 2</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Main Area */}
      <div className="gantt-main-area">
        {/* Task List */}
        {renderTaskList()}
        
        {/* Chart Area */}
        <div className="gantt-chart-area">
          {/* Timeline Header */}
          <div className="gantt-timeline-header" style={{
            gridTemplateColumns: `repeat(${Math.min(totalDays, 50)}, minmax(60px, 1fr))`
          }}>
            {renderTimelineHeader()}
          </div>
          
          {/* Chart Grid */}
          <div className="gantt-chart-grid" style={{
            gridTemplateColumns: `repeat(${Math.min(totalDays, 50)}, minmax(60px, 1fr))`,
            gridTemplateRows: `repeat(${visibleTasks.length}, 40px)`
          }}>
            {renderTasks()}
          </div>
        </div>
      </div>
    </div>
  );
};