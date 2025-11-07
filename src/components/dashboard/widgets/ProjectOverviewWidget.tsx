import React from 'react';
import { Progress } from '@/components/ui/progress';

interface ProjectOverviewData {
  total: number;
  active: number;
  completed: number;
  onHold: number;
  stats: Array<{ label: string; value: number; color: string }>;
}

export default function ProjectOverviewWidget({ data }: { data: ProjectOverviewData }) {
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-2xl font-bold">{data.total}</p>
          <p className="text-xs text-gray-500">Total Projects</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-green-600">{data.active}</p>
          <p className="text-xs text-gray-500">Active</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-blue-600">{data.completed}</p>
          <p className="text-xs text-gray-500">Completed</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-yellow-600">{data.onHold}</p>
          <p className="text-xs text-gray-500">On Hold</p>
        </div>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm font-medium">Project Health</p>
        {data.stats.map((stat, index) => (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>{stat.label}</span>
              <span>{stat.value} projects</span>
            </div>
            <Progress 
              value={(stat.value / data.active) * 100} 
              className={`h-2 ${
                stat.color === 'green' ? 'bg-green-100' : 
                stat.color === 'yellow' ? 'bg-yellow-100' : 'bg-red-100'
              }`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}