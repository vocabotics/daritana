import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  status: string;
  progress: number;
  deadline: string;
}

export default function ActiveProjectsWidget({ data }: { data: Project[] }) {
  if (!data || !Array.isArray(data)) return null;

  return (
    <div className="space-y-3">
      {data.map((project) => (
        <div key={project.id} className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="font-medium text-sm">{project.name}</h4>
              <Badge variant={project.status === 'In Progress' ? 'default' : 'secondary'} className="mt-1">
                {project.status}
              </Badge>
            </div>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(project.deadline).toLocaleDateString()}
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Progress</span>
              <span>{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2" />
          </div>
        </div>
      ))}
    </div>
  );
}