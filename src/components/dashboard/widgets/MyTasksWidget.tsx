import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  project: string;
  due: string;
  priority: 'high' | 'medium' | 'low';
}

export default function MyTasksWidget({ data }: { data: Task[] }) {
  if (!data || !Array.isArray(data)) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-2">
      {data.map((task) => (
        <div key={task.id} className="flex items-start gap-3 p-2 rounded hover:bg-gray-50">
          <input type="checkbox" className="mt-1" />
          <div className="flex-1">
            <p className="text-sm font-medium">{task.title}</p>
            <p className="text-xs text-gray-500">{task.project}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                {task.priority}
              </Badge>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(task.due).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}