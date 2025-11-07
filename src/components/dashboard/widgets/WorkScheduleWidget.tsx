import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock } from 'lucide-react';

interface ScheduleItem {
  date: string;
  project: string;
  task: string;
  time: string;
}

export default function WorkScheduleWidget({ data }: { data: ScheduleItem[] }) {
  if (!data || !Array.isArray(data)) return null;

  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="flex gap-3 p-3 border rounded-lg hover:bg-gray-50">
          <div className="flex flex-col items-center justify-center bg-blue-50 rounded px-3 py-2 min-w-[60px]">
            <span className="text-xs font-medium text-blue-600">
              {new Date(item.date).toLocaleDateString('en', { month: 'short' })}
            </span>
            <span className="text-lg font-bold text-blue-900">
              {new Date(item.date).getDate()}
            </span>
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-sm">{item.task}</h4>
            <p className="text-xs text-gray-500 mt-1">{item.project}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {item.time}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}