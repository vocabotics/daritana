import React from 'react';
import { Calendar, CheckCircle, Clock, FileText, Users, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface TodaysActivityData {
  meetings: number;
  tasksCompleted: number;
  tasksCreated: number;
  events: Array<{
    type: string;
    title: string;
    time: string;
    status: string;
  }>;
}

export default function TodaysActivityWidget({ data }: { data: TodaysActivityData }) {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p className="text-sm">Loading today's activity...</p>
      </div>
    );
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'meeting': return <Users className="h-3 w-3" />;
      case 'task': return <CheckCircle className="h-3 w-3" />;
      case 'milestone': return <TrendingUp className="h-3 w-3" />;
      default: return <FileText className="h-3 w-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    const lowerStatus = status?.toLowerCase() || '';
    if (lowerStatus.includes('completed') || lowerStatus.includes('done')) return 'text-green-600';
    if (lowerStatus.includes('progress') || lowerStatus.includes('ongoing')) return 'text-blue-600';
    if (lowerStatus.includes('pending') || lowerStatus.includes('scheduled')) return 'text-yellow-600';
    if (lowerStatus.includes('cancelled')) return 'text-red-600';
    return 'text-gray-600';
  };

  const totalActivities = data.meetings + data.tasksCompleted + data.tasksCreated;
  const completionRate = totalActivities > 0 ? (data.tasksCompleted / totalActivities) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2 pb-3 border-b">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Users className="h-3 w-3 text-blue-500" />
            <span className="text-lg font-bold">{data.meetings}</span>
          </div>
          <p className="text-xs text-gray-500">Meetings</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <CheckCircle className="h-3 w-3 text-green-500" />
            <span className="text-lg font-bold">{data.tasksCompleted}</span>
          </div>
          <p className="text-xs text-gray-500">Completed</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <FileText className="h-3 w-3 text-purple-500" />
            <span className="text-lg font-bold">{data.tasksCreated}</span>
          </div>
          <p className="text-xs text-gray-500">Created</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Daily Progress</span>
          <span className="text-xs font-medium">{Math.round(completionRate)}%</span>
        </div>
        <Progress value={completionRate} className="h-2" />
      </div>

      {/* Timeline */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        <h4 className="text-xs font-medium text-gray-700 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Today's Timeline
        </h4>
        {data.events && data.events.length > 0 ? (
          data.events.map((event, index) => (
            <div key={index} className="flex items-start gap-2 pl-4 text-xs">
              <div className="flex items-center gap-1 min-w-[60px] text-gray-500">
                {getEventIcon(event.type)}
                <span>{event.time}</span>
              </div>
              <div className="flex-1">
                <p className="font-medium truncate">{event.title}</p>
                <span className={`text-xs ${getStatusColor(event.status)}`}>
                  {event.status}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-gray-400 pl-4">No events scheduled for today</p>
        )}
      </div>
    </div>
  );
}