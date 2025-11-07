import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Flag } from 'lucide-react';

interface Update {
  project: string;
  update: string;
  date: string;
  type: 'progress' | 'approval' | 'milestone';
}

export default function ProjectUpdatesWidget({ data }: { data: Update[] }) {
  if (!data || !Array.isArray(data)) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'progress': return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'approval': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'milestone': return <Flag className="h-4 w-4 text-purple-500" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-3">
      {data.map((update, index) => (
        <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {getIcon(update.type)}
                <h4 className="font-medium text-sm">{update.project}</h4>
              </div>
              <p className="text-sm text-gray-600">{update.update}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(update.date).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}