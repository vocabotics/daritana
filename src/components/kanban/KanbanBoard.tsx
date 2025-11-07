import React, { useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTaskStore, Task } from '@/store/taskStore';
import { formatDate } from '@/lib/utils';
import { Clock, User, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { createMemoizedComponent, useVirtualList } from '@/utils/performanceOptimizations';
import { useQueryCache } from '@/utils/caching';

// Memoized Task Card Component
const TaskCard = createMemoizedComponent<{
  task: Task
  getPriorityColor: (priority: Task['priority']) => string
  getCategoryColor: (tag?: string) => string
  isOverdue: (dueDate?: string) => boolean
  onDragStart: (e: React.DragEvent, taskId: string) => void
}>(({ task, getPriorityColor, getCategoryColor, isOverdue, onDragStart }) => (
  <Card 
    className="kanban-card architect-border cursor-move hover:shadow-md transition-shadow"
    draggable
    onDragStart={(e) => onDragStart(e, task.id)}
  >
    <CardHeader className="pb-2">
      <div className="flex items-start justify-between">
        <CardTitle className="text-sm architect-heading line-clamp-2">
          {task.title}
        </CardTitle>
        {task.dueDate && isOverdue(task.dueDate) && (
          <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 ml-2" />
        )}
      </div>
    </CardHeader>
    
    <CardContent className="pt-0 space-y-3">
      {task.description && (
        <p className="text-xs text-gray-600 line-clamp-3">
          {task.description}
        </p>
      )}
      
      <div className="flex flex-wrap gap-1">
        <Badge className={getPriorityColor(task.priority)}>
          {task.priority}
        </Badge>
        {task.tags && task.tags.length > 0 && (
          <Badge className={getCategoryColor(task.tags[0])}>
            {task.tags[0]}
          </Badge>
        )}
      </div>
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        {task.dueDate && (
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            <span className={isOverdue(task.dueDate) ? 'text-red-500' : ''}>
              {formatDate(new Date(task.dueDate))}
            </span>
          </div>
        )}
        
        {task.assignedTo && (
          <div className="flex items-center">
            <User className="h-3 w-3 mr-1" />
            <span>{task.assignedTo.firstName}</span>
          </div>
        )}
      </div>
      
      {task.attachments && task.attachments.length > 0 && (
        <div className="text-xs text-gray-500">
          📎 {task.attachments.length} attachment(s)
        </div>
      )}
    </CardContent>
  </Card>
))

interface KanbanColumnProps {
  title: string;
  status: Task['status'];
  tasks: Task[];
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, status: Task['status']) => void;
}

function KanbanColumn({ title, status, tasks, onDragStart, onDragOver, onDrop }: KanbanColumnProps) {
  usePerformanceMonitor(`KanbanColumn-${status}`);
  
  // Memoized filtered tasks
  const columnTasks = useMemo(() => 
    tasks.filter(task => task.status === status), 
    [tasks, status]
  );
  
  // Memoized utility functions
  const getPriorityColor = useCallback((priority: Task['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);
  
  const getCategoryColor = useCallback((tag?: string) => {
    if (!tag) return 'bg-gray-100 text-gray-800';
    switch (tag.toLowerCase()) {
      case 'design':
        return 'bg-blue-100 text-blue-800';
      case 'engineering':
        return 'bg-purple-100 text-purple-800';
      case 'client':
        return 'bg-pink-100 text-pink-800';
      case 'management':
        return 'bg-indigo-100 text-indigo-800';
      case 'construction':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);
  
  const isOverdue = useCallback((dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && status !== 'done';
  }, [status]);
  
  return (
    <div 
      className="kanban-column p-4 rounded-lg"
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, status)}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium architect-heading">{title}</h3>
        <Badge variant="outline">{columnTasks.length}</Badge>
      </div>
      
      <div className="space-y-3">
        {columnTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            getPriorityColor={getPriorityColor}
            getCategoryColor={getCategoryColor}
            isOverdue={isOverdue}
            onDragStart={onDragStart}
          />
        ))}
        
        {columnTasks.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            No tasks in this column
          </div>
        )}
      </div>
    </div>
  );
}

export function KanbanBoard() {
  usePerformanceMonitor('KanbanBoard');
  const { tasks, updateTaskStatus, isLoading } = useTaskStore();
  
  // Memoized columns configuration
  const columns = useMemo(() => [
    { title: 'To Do', status: 'todo' as Task['status'] },
    { title: 'In Progress', status: 'in_progress' as Task['status'] },
    { title: 'Review', status: 'review' as Task['status'] },
    { title: 'Done', status: 'done' as Task['status'] },
  ], []);
  
  // Memoized drag handlers
  const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);
  
  const handleDrop = useCallback(async (e: React.DragEvent, newStatus: Task['status']) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    
    if (taskId) {
      const success = await updateTaskStatus(taskId, newStatus);
      if (success) {
        toast.success('Task status updated');
      } else {
        toast.error('Failed to update task status');
      }
    }
  }, [updateTaskStatus]);
  
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="mt-2 text-gray-600">Loading tasks...</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {columns.map((column) => (
        <KanbanColumn
          key={column.status}
          title={column.title}
          status={column.status}
          tasks={tasks}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />
      ))}
    </div>
  );
}