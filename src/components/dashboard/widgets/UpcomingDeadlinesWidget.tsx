import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileText, DollarSign, Users } from 'lucide-react';

interface Deadline {
  title: string;
  project: string;
  date: string;
  type: string;
}

export default function UpcomingDeadlinesWidget({ data }: { data: Deadline[] }) {
  if (!data || !Array.isArray(data)) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'compliance': return <FileText className="h-4 w-4" />;
      case 'payment': return <DollarSign className="h-4 w-4" />;
      case 'meeting': return <Users className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'compliance': return 'destructive';
      case 'payment': return 'default';
      case 'meeting': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-2">
      {data.map((deadline, index) => (
        <div key={index} className="flex items-start gap-3 p-2 rounded hover:bg-gray-50">
          <div className="mt-1">{getIcon(deadline.type)}</div>
          <div className="flex-1">
            <p className="text-sm font-medium">{deadline.title}</p>
            <p className="text-xs text-gray-500">{deadline.project}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={getTypeColor(deadline.type)} className="text-xs">
                {deadline.type}
              </Badge>
              <span className="text-xs text-gray-500">
                {new Date(deadline.date).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}