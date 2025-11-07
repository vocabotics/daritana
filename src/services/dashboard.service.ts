import { apiClient } from './api';
import { virtualOfficeService } from './virtualOfficeSimple.service';
import { teamActivityService } from './teamActivity.service';
import { calendarService } from './calendar.service';
import { chatService } from './chat.service';

class DashboardService {
  // Get team online status from Virtual Office
  async getTeamOnlineStatus() {
    try {
      const teamMembers = virtualOfficeService.getTeamMembers();
      const onlineMembers = teamMembers.filter(m => m.status === 'online');
      const busyMembers = teamMembers.filter(m => m.status === 'busy');
      const awayMembers = teamMembers.filter(m => m.status === 'away');
      
      return {
        total: teamMembers.length,
        online: onlineMembers.length,
        busy: busyMembers.length,
        away: awayMembers.length,
        offline: teamMembers.length - onlineMembers.length - busyMembers.length - awayMembers.length,
        members: teamMembers.slice(0, 8) // First 8 members for display
      };
    } catch (error) {
      console.error('Error fetching team online status:', error);
      // Fallback to API call
      const response = await apiClient.get('/api/team-activity/members');
      const members = response.data.data || [];
      return {
        total: members.length,
        online: members.filter((m: any) => m.status === 'online').length,
        busy: members.filter((m: any) => m.status === 'busy').length,
        away: members.filter((m: any) => m.status === 'away').length,
        offline: members.filter((m: any) => m.status === 'offline').length,
        members: members.slice(0, 8)
      };
    }
  }

  // Get activity feed from real events
  async getActivityFeed(limit: number = 20) {
    try {
      const activities = await teamActivityService.getActivity(limit);
      return activities.map(activity => ({
        id: activity.id,
        type: activity.type,
        user: activity.userName,
        userAvatar: activity.userAvatar,
        action: teamActivityService.formatActivity(activity),
        target: activity.target,
        time: teamActivityService.getRelativeTime(activity.timestamp),
        timestamp: activity.timestamp
      }));
    } catch (error) {
      console.error('Error fetching activity feed:', error);
      return [];
    }
  }

  // Get today's activity from meetings and tasks
  async getTodaysActivity() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get today's meetings
      const meetings = await calendarService.getMeetings({
        startDate: today,
        endDate: tomorrow
      });

      // Get recent tasks (API call)
      const tasksResponse = await apiClient.get('/api/tasks', {
        params: {
          updatedAfter: today.toISOString(),
          limit: 10
        }
      });

      const tasks = tasksResponse.data.data || [];

      return {
        meetings: meetings.length,
        tasksCompleted: tasks.filter((t: any) => t.status === 'COMPLETED').length,
        tasksCreated: tasks.filter((t: any) => 
          new Date(t.createdAt) >= today
        ).length,
        events: [
          ...meetings.map(m => ({
            type: 'meeting',
            title: m.title,
            time: new Date(m.startTime).toLocaleTimeString(),
            status: m.status
          })),
          ...tasks.slice(0, 5).map((t: any) => ({
            type: 'task',
            title: t.title,
            time: new Date(t.updatedAt).toLocaleTimeString(),
            status: t.status
          }))
        ]
      };
    } catch (error) {
      console.error('Error fetching today\'s activity:', error);
      return {
        meetings: 0,
        tasksCompleted: 0,
        tasksCreated: 0,
        events: []
      };
    }
  }

  // Get ARIA AI suggestions based on real data
  async getAriaSuggestions() {
    try {
      // Get team stats for analysis
      const stats = await teamActivityService.getStats();
      
      const suggestions = [];

      // Productivity insights
      if (stats && stats.tasks.completionRate < 50) {
        suggestions.push({
          type: 'alert',
          title: 'Low Task Completion Rate',
          description: `Only ${stats.tasks.completionRate}% of tasks completed. Consider reviewing task assignments.`,
          action: 'Review Tasks',
          priority: 'high'
        });
      }

      // Team utilization
      if (stats && stats.teamMembers.activityRate < 70) {
        suggestions.push({
          type: 'insight',
          title: 'Team Underutilization',
          description: `Team activity at ${stats.teamMembers.activityRate}%. Some members may have capacity for more tasks.`,
          action: 'Optimize Workload',
          priority: 'medium'
        });
      }

      // Project recommendations
      if (stats && stats.projects.total > 0) {
        suggestions.push({
          type: 'recommendation',
          title: 'Project Health Check',
          description: `You have ${stats.projects.active} active projects. Schedule regular reviews to ensure on-time delivery.`,
          action: 'Schedule Reviews',
          priority: 'low'
        });
      }

      // Meeting optimization
      const upcomingMeetings = await calendarService.getUpcomingMeetings(undefined, 7);
      if (upcomingMeetings.length > 10) {
        suggestions.push({
          type: 'optimization',
          title: 'Meeting Overload Detected',
          description: `${upcomingMeetings.length} meetings scheduled this week. Consider consolidating or delegating some.`,
          action: 'Review Calendar',
          priority: 'medium'
        });
      }

      return suggestions;
    } catch (error) {
      console.error('Error generating ARIA suggestions:', error);
      return [
        {
          type: 'info',
          title: 'Welcome to ARIA Assistant',
          description: 'I\'m here to help optimize your workflow and provide insights.',
          action: 'Get Started',
          priority: 'low'
        }
      ];
    }
  }

  // Get weather data (using OpenWeatherMap API)
  async getWeather(city: string = 'Kuala Lumpur') {
    try {
      // You can use a free weather API like OpenWeatherMap
      // For now, return formatted mock data
      const weatherData = {
        location: city,
        temperature: 28,
        condition: 'Partly Cloudy',
        humidity: 75,
        windSpeed: 12,
        forecast: [
          { day: 'Today', high: 32, low: 24, condition: 'Partly Cloudy' },
          { day: 'Tomorrow', high: 31, low: 23, condition: 'Thunderstorms' },
          { day: 'Thursday', high: 30, low: 23, condition: 'Rain' }
        ]
      };
      return weatherData;
    } catch (error) {
      console.error('Error fetching weather:', error);
      return null;
    }
  }

  // Get recent files from documents API
  async getRecentFiles(limit: number = 10) {
    try {
      const response = await apiClient.get('/api/documents', {
        params: {
          sortBy: 'updatedAt',
          sortOrder: 'DESC',
          limit
        }
      });

      const documents = response.data.data || [];
      
      return documents.map((doc: any) => ({
        id: doc.id,
        name: doc.name,
        type: doc.fileType || 'document',
        size: doc.fileSize,
        modifiedBy: doc.user?.name || 'Unknown',
        modifiedAt: new Date(doc.updatedAt),
        thumbnail: doc.thumbnailUrl,
        url: doc.fileUrl,
        projectId: doc.projectId,
        projectName: doc.project?.name
      }));
    } catch (error) {
      console.error('Error fetching recent files:', error);
      return [];
    }
  }

  // Get project overview with real data
  async getProjectOverview() {
    try {
      const response = await apiClient.get('/api/projects', {
        params: { limit: 100 }
      });

      const projects = response.data.data || [];
      
      const overview = {
        total: projects.length,
        active: projects.filter((p: any) => p.status === 'IN_PROGRESS').length,
        completed: projects.filter((p: any) => p.status === 'COMPLETED').length,
        planning: projects.filter((p: any) => p.status === 'PLANNING').length,
        onHold: projects.filter((p: any) => p.status === 'ON_HOLD').length,
        stats: {
          onTrack: 0,
          atRisk: 0,
          delayed: 0
        },
        recentProjects: projects.slice(0, 5)
      };

      // Calculate project health
      projects.forEach((project: any) => {
        if (project.status === 'IN_PROGRESS') {
          const endDate = new Date(project.endDate);
          const today = new Date();
          const daysUntilDeadline = Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntilDeadline < 0) {
            overview.stats.delayed++;
          } else if (daysUntilDeadline < 7) {
            overview.stats.atRisk++;
          } else {
            overview.stats.onTrack++;
          }
        }
      });

      return overview;
    } catch (error) {
      console.error('Error fetching project overview:', error);
      return null;
    }
  }

  // Get upcoming deadlines from tasks and meetings
  async getUpcomingDeadlines(limit: number = 10) {
    try {
      // Get upcoming tasks with due dates
      const tasksResponse = await apiClient.get('/api/tasks', {
        params: {
          hasDueDate: true,
          status: ['TODO', 'IN_PROGRESS'],
          sortBy: 'dueDate',
          sortOrder: 'ASC',
          limit
        }
      });

      const tasks = tasksResponse.data.data || [];
      
      // Get upcoming meetings
      const meetings = await calendarService.getUpcomingMeetings(undefined, limit);

      // Combine and sort by date
      const deadlines = [
        ...tasks.map((task: any) => ({
          id: task.id,
          type: 'task',
          title: task.title,
          project: task.project?.name,
          date: new Date(task.dueDate),
          priority: task.priority,
          status: task.status
        })),
        ...meetings.map(meeting => ({
          id: meeting.id,
          type: 'meeting',
          title: meeting.title,
          project: meeting.project?.name,
          date: meeting.startTime,
          priority: 'medium',
          status: meeting.status
        }))
      ];

      // Sort by date and return top items
      return deadlines
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching upcoming deadlines:', error);
      return [];
    }
  }

  // Get financial metrics
  async getFinancialMetrics() {
    try {
      const response = await apiClient.get('/api/financial/dashboard');
      
      if (response.data.success) {
        return response.data.data;
      }

      // Fallback calculation
      const invoices = await apiClient.get('/api/financial/invoices');
      const expenses = await apiClient.get('/api/financial/expenses');
      
      const totalRevenue = invoices.data.data?.reduce((sum: number, inv: any) => 
        inv.status === 'PAID' ? sum + inv.total : sum, 0) || 0;
      
      const totalExpenses = expenses.data.data?.reduce((sum: number, exp: any) => 
        exp.status === 'APPROVED' ? sum + exp.amount : sum, 0) || 0;

      return {
        revenue: totalRevenue,
        expenses: totalExpenses,
        profit: totalRevenue - totalExpenses,
        pending: invoices.data.data?.filter((inv: any) => inv.status === 'PENDING').length || 0,
        overdue: invoices.data.data?.filter((inv: any) => inv.status === 'OVERDUE').length || 0
      };
    } catch (error) {
      console.error('Error fetching financial metrics:', error);
      return null;
    }
  }

  // Get team performance metrics
  async getTeamPerformance() {
    try {
      const stats = await teamActivityService.getStats();
      const members = await teamActivityService.getMembers();

      if (!stats || !members) return null;

      return {
        productivityScore: stats.overview.productivityScore,
        taskCompletionRate: stats.tasks.completionRate,
        activeMembers: stats.teamMembers.active,
        totalMembers: stats.teamMembers.total,
        topPerformers: members
          .sort((a, b) => b.metrics.productivityScore - a.metrics.productivityScore)
          .slice(0, 3)
          .map(m => ({
            name: m.name,
            score: m.metrics.productivityScore,
            tasksCompleted: m.metrics.tasksCompleted
          }))
      };
    } catch (error) {
      console.error('Error fetching team performance:', error);
      return null;
    }
  }
}

export const dashboardService = new DashboardService();