import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '@/store/authStore';
import { useProjectStore } from '@/store/projectStore';
import { 
  FileText, 
  CheckSquare, 
  MessageSquare, 
  Calendar, 
  Upload,
  UserCheck,
  ExternalLink
} from 'lucide-react';

interface Activity {
  id: string;
  type: 'task' | 'approval' | 'message' | 'meeting' | 'upload' | 'assignment';
  title: string;
  description: string;
  timestamp: Date;
  user: string;
  project?: string;
}

const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'task',
    title: 'Floor plan sketches completed',
    description: 'Initial floor plan options have been submitted for review',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    user: 'Lisa Wong',
    project: 'Modern Condominium Renovation'
  },
  {
    id: '2',
    type: 'approval',
    title: 'Design brief approved',
    description: 'Client has approved the updated design requirements',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    user: 'Sarah Chen',
    project: 'Modern Condominium Renovation'
  },
  {
    id: '3',
    type: 'upload',
    title: 'New documents uploaded',
    description: 'DBKL permit application documents added to Google Drive',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    user: 'Ahmad Rahman',
    project: 'Modern Condominium Renovation'
  },
  {
    id: '4',
    type: 'meeting',
    title: 'Client meeting scheduled',
    description: 'Design review meeting set for tomorrow at 2:00 PM',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    user: 'Ahmad Rahman',
    project: 'Boutique Hotel Interior Design'
  },
  {
    id: '5',
    type: 'assignment',
    title: 'Task assigned to contractor',
    description: 'Electrical assessment task assigned to John Contractor',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    user: 'Ahmad Rahman',
    project: 'Modern Condominium Renovation'
  }
];

export function RecentActivity() {
  const { user } = useAuthStore();
  const { recentProjects, isLoading, fetchProjects } = useProjectStore();
  
  useEffect(() => {
    if (recentProjects.length === 0) {
      fetchProjects({ limit: 5, sortBy: 'updatedAt', sortOrder: 'DESC' });
    }
  }, [fetchProjects, recentProjects.length]);
  
  if (!user) return null;

  // Generate activities from recent projects
  const generateActivitiesFromProjects = () => {
    const activities: Activity[] = [];
    
    recentProjects.forEach((project) => {
      // Project updates based on status and progress
      if (project.progress > 0) {
        activities.push({
          id: `project-${project.id}-progress`,
          type: 'task',
          title: `Project progress updated`,
          description: `${project.name} is now ${project.progress}% complete`,
          timestamp: new Date(project.updatedAt),
          user: project.projectLead?.firstName ? `${project.projectLead.firstName} ${project.projectLead.lastName}` : 'Project Lead',
          project: project.name
        });
      }

      // Status changes
      if (project.status === 'completed') {
        activities.push({
          id: `project-${project.id}-completed`,
          type: 'approval',
          title: `Project completed`,
          description: `${project.name} has been successfully completed`,
          timestamp: new Date(project.actualEndDate || project.updatedAt),
          user: project.projectLead?.firstName ? `${project.projectLead.firstName} ${project.projectLead.lastName}` : 'Project Lead',
          project: project.name
        });
      }

      // New project creation
      if (new Date(project.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000) {
        activities.push({
          id: `project-${project.id}-created`,
          type: 'assignment',
          title: `New project created`,
          description: `${project.name} has been added to your portfolio`,
          timestamp: new Date(project.createdAt),
          user: project.client?.firstName ? `${project.client.firstName} ${project.client.lastName}` : 'Client',
          project: project.name
        });
      }
    });

    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 6);
  };

  const activities = recentProjects.length > 0 ? generateActivitiesFromProjects() : mockActivities;
  
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'task':
        return CheckSquare;
      case 'approval':
        return UserCheck;
      case 'message':
        return MessageSquare;
      case 'meeting':
        return Calendar;
      case 'upload':
        return Upload;
      case 'assignment':
        return FileText;
      default:
        return FileText;
    }
  };
  
  const getActivityBadgeVariant = (type: Activity['type']) => {
    switch (type) {
      case 'task':
        return 'default';
      case 'approval':
        return 'secondary';
      case 'message':
        return 'outline';
      case 'meeting':
        return 'default';
      case 'upload':
        return 'secondary';
      case 'assignment':
        return 'outline';
      default:
        return 'default';
    }
  };
  
  if (isLoading) {
    return (
      <Card className="architect-border">
        <CardHeader>
          <CardTitle className="architect-heading">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start space-x-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-64" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="architect-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="architect-heading">Recent Activity</CardTitle>
        <Button variant="ghost" size="sm">
          <ExternalLink className="h-4 w-4 mr-1" />
          View All
        </Button>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">No recent activity</p>
            <p className="text-gray-400 text-xs mt-1">
              Activity will appear here as you work on projects
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = getActivityIcon(activity.type);
              
              return (
                <div key={activity.id} className="flex items-start space-x-3 hover:bg-gray-50 p-2 rounded-md transition-colors">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <Icon className="h-4 w-4 text-gray-600" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.title}
                      </p>
                      <Badge variant={getActivityBadgeVariant(activity.type)} className="ml-2 text-xs">
                        {activity.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-500 mt-1">
                      {activity.description}
                    </p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-400">
                        by {activity.user}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                      </p>
                    </div>
                    
                    {activity.project && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-50 text-blue-700">
                          {activity.project}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}