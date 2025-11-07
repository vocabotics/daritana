import React from 'react';
import { ActivityFeed } from '@/components/collaboration';
import { useProjectContextStore } from '@/store/projectContextStore';
import { Clock, User } from 'lucide-react';

export default function ActivityFeedWidget({ data }: { data: any }) {
  const { currentProject } = useProjectContextStore();
  
  // If we have data from dashboard service, show it directly
  if (data && Array.isArray(data)) {
    return (
      <div className="space-y-2 max-h-[350px] overflow-y-auto">
        {data.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
        ) : (
          data.map((item: any) => (
            <div key={item.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">{item.user}</span> {item.action}
                </p>
                {item.target && (
                  <p className="text-xs text-gray-500 truncate">{item.target}</p>
                )}
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-400">{item.time}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }
  
  // Fallback to comprehensive ActivityFeed component
  return (
    <ActivityFeed
      projectId={currentProject?.id}
      compact={true}
      showFilters={false}
      showNotificationBadge={true}
      autoRefresh={true}
      maxHeight="350px"
      className="border-0 shadow-none"
    />
  );
}