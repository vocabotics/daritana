import { api } from '@/lib/api';

export interface ConstructionSite {
  id: string;
  name: string;
  location: string;
  projectId: string;
  startDate: Date;
  expectedEndDate: Date;
  currentPhase: string;
  overallProgress: number;
  status: 'active' | 'on_hold' | 'completed' | 'delayed';
  managerName: string;
  managerContact: string;
  totalWorkers: number;
  activeWorkers: number;
  weather: {
    condition: string;
    temperature: number;
    humidity: number;
    windSpeed: number;
  };
  safetyScore: number;
  lastUpdated: Date;
}

export interface ProgressUpdate {
  id: string;
  timestamp: Date;
  phase: string;
  progress: number;
  description: string;
  author: string;
  mediaCount: number;
  aiVerified: boolean;
}

export interface MaterialDelivery {
  id: string;
  material: string;
  quantity: number;
  unit: string;
  deliveredAt: Date;
  supplier: string;
  status: 'pending' | 'delivered' | 'inspected' | 'rejected';
}

export interface WorkerActivity {
  id: string;
  name: string;
  role: string;
  checkIn: Date;
  checkOut?: Date;
  hoursWorked: number;
  productivity: number;
  safetyCompliant: boolean;
}

export interface ConstructionAnalytics {
  progressChart: Array<{
    date: string;
    planned: number;
    actual: number;
  }>;
  phaseCompletion: Array<{
    phase: string;
    completed: number;
  }>;
  safetyMetrics: {
    incidents: number;
    nearMisses: number;
    safetyScore: number;
    daysWithoutIncident: number;
  };
  resourceUtilization: {
    workers: number;
    equipment: number;
    materials: number;
  };
}

export interface DashboardData {
  site: ConstructionSite;
  statistics: {
    overallProgress: number;
    daysRemaining: number;
    workersOnSite: number;
    safetyScore: number;
    tasksCompleted: number;
    tasksInProgress: number;
    issuesOpen: number;
    inspectionsDue: number;
  };
  recentActivity: Array<{
    type: string;
    message: string;
    timestamp: Date;
    user: string;
  }>;
  upcomingMilestones: Array<{
    name: string;
    date: Date;
    progress: number;
  }>;
}

class ConstructionService {
  // Get all construction sites
  async getSites() {
    try {
      console.log('Fetching construction sites...');
      const response = await api.get('/construction/sites');
      console.log('Construction sites response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching construction sites:', error);
      throw error;
    }
  }

  // Get single construction site
  async getSite(siteId: string) {
    try {
      console.log('Fetching construction site:', siteId);
      const token = localStorage.getItem('access_token');
      console.log('Token available:', !!token);
      const response = await api.get(`/construction/sites/${siteId}`);
      console.log('Construction site response:', response.data);
      
      // Parse dates from the response
      if (response.data?.data) {
        const site = response.data.data;
        site.startDate = new Date(site.startDate);
        site.expectedEndDate = new Date(site.expectedEndDate);
        site.lastUpdated = new Date(site.lastUpdated);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching construction site:', error);
      throw error;
    }
  }

  // Get progress updates for a site
  async getProgressUpdates(siteId: string) {
    try {
      const response = await api.get(`/construction/sites/${siteId}/progress`);
      
      // Parse dates in the response
      if (response.data?.data && Array.isArray(response.data.data)) {
        response.data.data.forEach((update: any) => {
          update.timestamp = new Date(update.timestamp);
        });
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching progress updates:', error);
      throw error;
    }
  }

  // Add progress update
  async addProgressUpdate(siteId: string, data: {
    phase: string;
    progress: number;
    description: string;
    mediaUrls?: string[];
  }) {
    try {
      const response = await api.post(`/construction/sites/${siteId}/progress`, data);
      return response.data;
    } catch (error) {
      console.error('Error adding progress update:', error);
      throw error;
    }
  }

  // Get material deliveries
  async getMaterialDeliveries(siteId: string) {
    try {
      const response = await api.get(`/construction/sites/${siteId}/materials`);
      
      // Parse dates in the response
      if (response.data?.data && Array.isArray(response.data.data)) {
        response.data.data.forEach((delivery: any) => {
          delivery.deliveredAt = new Date(delivery.deliveredAt);
        });
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching material deliveries:', error);
      throw error;
    }
  }

  // Get worker activities
  async getWorkerActivities(siteId: string) {
    try {
      const response = await api.get(`/construction/sites/${siteId}/workers`);
      
      // Parse dates in the response
      if (response.data?.data && Array.isArray(response.data.data)) {
        response.data.data.forEach((worker: any) => {
          worker.checkIn = new Date(worker.checkIn);
          if (worker.checkOut) {
            worker.checkOut = new Date(worker.checkOut);
          }
        });
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching worker activities:', error);
      throw error;
    }
  }

  // Get analytics data
  async getAnalytics(siteId: string) {
    try {
      const response = await api.get(`/construction/sites/${siteId}/analytics`);
      return response.data;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  }

  // Analyze construction image with AI
  async analyzeImage(siteId: string, imageFile: File) {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await api.post(`/construction/sites/${siteId}/analyze-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw error;
    }
  }

  // Get dashboard data
  async getDashboard(siteId: string) {
    try {
      const response = await api.get(`/construction/dashboard/${siteId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }
}

export const constructionService = new ConstructionService();