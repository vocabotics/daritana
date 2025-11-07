import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store/authStore';
import { useProjectStore } from '@/store/projectStore';
import { 
  FolderOpen, 
  CheckSquare, 
  Clock, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  Calendar,
  FileText
} from 'lucide-react';

export function DashboardStats() {
  const { user } = useAuthStore();
  const { 
    projects, 
    stats, 
    isLoading, 
    fetchProjects, 
    fetchDashboardStats 
  } = useProjectStore();

  useEffect(() => {
    // Fetch dashboard data when component mounts
    fetchDashboardStats();
    fetchProjects({ limit: 100 }); // Get all projects for accurate stats
  }, [fetchDashboardStats, fetchProjects]);
  
  if (!user) return null;
  
  const getStatsForRole = () => {
    // Use real data from backend or fallback to calculated values
    const totalProjects = stats?.total || projects.length;
    const activeProjects = stats?.active || projects.filter(p => p.status === 'in_progress').length;
    const completedProjects = stats?.completed || projects.filter(p => p.status === 'completed').length;
    const overdueProjects = stats?.overdue || projects.filter(p => p.isOverdue).length;
    
    const avgProgress = projects.length > 0 
      ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)
      : 0;

    switch (user.role) {
      case 'client':
        return [
          {
            title: 'My Projects',
            value: totalProjects,
            icon: FolderOpen,
            description: 'Total projects',
            progress: null,
            trend: totalProjects > 0 ? '+12%' : null
          },
          {
            title: 'In Progress',
            value: activeProjects,
            icon: Clock,
            description: 'Active projects',
            progress: totalProjects > 0 ? Math.round((activeProjects / totalProjects) * 100) : 0
          },
          {
            title: 'Completed',
            value: completedProjects,
            icon: CheckSquare,
            description: 'Finished projects',
            progress: totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0
          },
          {
            title: 'Overall Progress',
            value: `${avgProgress}%`,
            icon: TrendingUp,
            description: 'Average completion',
            progress: avgProgress
          }
        ];
      
      case 'project_lead':
      case 'staff':
      case 'admin':
        return [
          {
            title: 'Total Projects',
            value: totalProjects,
            icon: FolderOpen,
            description: 'All projects',
            progress: null,
            trend: '+5%'
          },
          {
            title: 'Active Projects',
            value: activeProjects,
            icon: Clock,
            description: 'In progress',
            progress: totalProjects > 0 ? Math.round((activeProjects / totalProjects) * 100) : 0
          },
          {
            title: 'Completed',
            value: completedProjects,
            icon: CheckSquare,
            description: 'Successfully finished',
            progress: totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0
          },
          {
            title: 'Overdue',
            value: overdueProjects,
            icon: AlertTriangle,
            description: 'Need attention',
            progress: null,
            isWarning: overdueProjects > 0
          }
        ];
      
      case 'designer':
        const designProjects = projects.filter(p => 
          p.type === 'interior_design' || p.designer?.id === user.id
        );
        
        return [
          {
            title: 'Design Projects',
            value: designProjects.length,
            icon: FileText,
            description: 'Assigned to you',
            progress: null
          },
          {
            title: 'In Progress',
            value: designProjects.filter(p => p.status === 'in_progress').length,
            icon: Clock,
            description: 'Active designs',
            progress: designProjects.length > 0 ? Math.round((designProjects.filter(p => p.status === 'in_progress').length / designProjects.length) * 100) : 0
          },
          {
            title: 'Completed',
            value: designProjects.filter(p => p.status === 'completed').length,
            icon: CheckSquare,
            description: 'Finished designs',
            progress: designProjects.length > 0 ? Math.round((designProjects.filter(p => p.status === 'completed').length / designProjects.length) * 100) : 0
          },
          {
            title: 'Average Progress',
            value: `${avgProgress}%`,
            icon: TrendingUp,
            description: 'Design completion',
            progress: avgProgress
          }
        ];
      
      case 'contractor':
        const contractorProjects = projects.filter(p => 
          p.status === 'in_progress' // Contractors typically work on active projects
        );
        
        return [
          {
            title: 'Active Contracts',
            value: contractorProjects.length,
            icon: FolderOpen,
            description: 'Current projects',
            progress: null
          },
          {
            title: 'Construction Phase',
            value: contractorProjects.filter(p => p.progress > 50).length,
            icon: Clock,
            description: 'In construction',
            progress: null
          },
          {
            title: 'Near Completion',
            value: contractorProjects.filter(p => p.progress > 80).length,
            icon: CheckSquare,
            description: 'Almost done',
            progress: null
          },
          {
            title: 'On Schedule',
            value: `${Math.max(0, 100 - (overdueProjects * 10))}%`,
            icon: TrendingUp,
            description: 'Timeline performance',
            progress: Math.max(0, 100 - (overdueProjects * 10))
          }
        ];
      
      default:
        return [
          {
            title: 'Projects',
            value: totalProjects,
            icon: FolderOpen,
            description: 'Total projects',
            progress: null
          }
        ];
    }
  };
  
  const statsData = getStatsForRole();
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="architect-border">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsData.map((stat, index) => (
        <Card key={index} className={`architect-border ${stat.isWarning ? 'border-orange-200 bg-orange-50' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${stat.isWarning ? 'text-orange-700' : 'text-gray-600'}`}>
              {stat.title}
            </CardTitle>
            <div className="flex items-center space-x-2">
              {stat.trend && (
                <span className="text-xs text-green-600 font-medium">
                  {stat.trend}
                </span>
              )}
              <stat.icon className={`h-4 w-4 ${stat.isWarning ? 'text-orange-500' : 'text-gray-400'}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold architect-heading ${stat.isWarning ? 'text-orange-800' : ''}`}>
              {stat.value}
            </div>
            <p className={`text-xs mt-1 ${stat.isWarning ? 'text-orange-600' : 'text-gray-500'}`}>
              {stat.description}
            </p>
            {stat.progress !== null && (
              <div className="mt-3">
                <Progress 
                  value={stat.progress} 
                  className={`h-2 ${stat.isWarning ? 'bg-orange-100' : ''}`}
                />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}