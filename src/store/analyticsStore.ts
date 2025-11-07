import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  analyticsAPI, 
  ProjectPerformanceMetrics, 
  ProjectTrends, 
  ProjectRiskAnalysis, 
  TeamAnalytics, 
  OrganizationAnalytics, 
  CustomReport 
} from '@/services/analyticsAPI';

interface AnalyticsStore {
  // Analytics data
  projectMetrics: ProjectPerformanceMetrics[];
  projectTrends: ProjectTrends | null;
  riskAnalysis: ProjectRiskAnalysis[];
  teamAnalytics: TeamAnalytics | null;
  organizationAnalytics: OrganizationAnalytics | null;
  customReports: CustomReport[];
  dashboardMetrics: any;
  kpis: any[];
  realtimeMetrics: any;
  
  // Loading states
  isLoading: boolean;
  isLoadingProjects: boolean;
  isLoadingTeams: boolean;
  isLoadingOrganization: boolean;
  isLoadingReports: boolean;
  isLoadingRealtime: boolean;
  error: string | null;
  
  // API methods - Project Analytics
  fetchProjectPerformance: (params?: { projectId?: string; timeframe?: string; metrics?: string[] }) => Promise<void>;
  fetchProjectTrends: (params?: { timeframe?: string; projectIds?: string[]; category?: string }) => Promise<void>;
  fetchRiskAnalysis: (params?: { projectId?: string; riskLevel?: string; category?: string }) => Promise<void>;
  getProjectComparison: (projectIds: string[], metrics: string[]) => Promise<any>;
  getProjectForecast: (projectId: string, timeframe?: number) => Promise<any>;
  getProjectInsights: (projectId: string) => Promise<any>;
  
  // API methods - Team Analytics
  fetchTeamOverview: (params?: { teamId?: string; timeframe?: string }) => Promise<void>;
  getMemberPerformance: (params?: { memberId?: string; timeframe?: string; metrics?: string[] }) => Promise<any>;
  getSkillAnalysis: (params?: { teamId?: string; department?: string }) => Promise<any>;
  getWorkloadAnalysis: (params?: { timeframe?: string }) => Promise<any>;
  getCollaborationMetrics: (params?: { timeframe?: string }) => Promise<any>;
  
  // API methods - Organization Analytics
  fetchOrganizationOverview: (params?: { timeframe?: string }) => Promise<void>;
  getFinancialAnalytics: (params?: { timeframe?: string; breakdown?: string }) => Promise<any>;
  getOperationalMetrics: (params?: { timeframe?: string }) => Promise<any>;
  getMarketAnalytics: (params?: { timeframe?: string }) => Promise<any>;
  getBenchmarking: (category: string, metrics: string[]) => Promise<any>;
  
  // API methods - Custom Reports
  fetchReports: (params?: { type?: string; createdBy?: string }) => Promise<void>;
  getReportById: (id: string) => Promise<CustomReport | null>;
  createReport: (report: any) => Promise<void>;
  updateReport: (id: string, updates: Partial<CustomReport>) => Promise<void>;
  deleteReport: (id: string) => Promise<void>;
  generateReport: (id: string, parameters?: any) => Promise<any>;
  exportReport: (id: string, format: 'PDF' | 'EXCEL' | 'CSV') => Promise<Blob>;
  getReportTemplates: () => Promise<any>;
  
  // API methods - Predictive Analytics
  getProjectOutcome: (projectId: string, scenarios?: any[]) => Promise<any>;
  getResourceDemand: (params: { timeframe: number; projectTypes?: string[]; skillRequirements?: string[] }) => Promise<any>;
  getMarketTrends: (params: { industry: string; region: string; timeframe: number }) => Promise<any>;
  getRiskPrediction: (projectId: string, timeHorizon?: number) => Promise<any>;
  
  // Convenience methods
  fetchDashboardMetrics: (timeframe?: string) => Promise<void>;
  getExecutiveSummary: (timeframe?: string) => Promise<any>;
  fetchKPIs: (category?: string) => Promise<void>;
  searchAnalytics: (query: string, type?: string) => Promise<any>;
  fetchRealtimeMetrics: () => Promise<void>;
  exportDashboard: (format: 'PDF' | 'EXCEL', sections: string[]) => Promise<Blob>;
  
  // Getters
  getProjectMetricsByStatus: (status: string) => ProjectPerformanceMetrics[];
  getHighRiskProjects: () => ProjectRiskAnalysis[];
  getTopPerformingProjects: (limit?: number) => ProjectPerformanceMetrics[];
  getProjectsByHealthScore: (minScore: number) => ProjectPerformanceMetrics[];
  getTrendsByMetric: (metric: string) => any[];
  
  // Utility methods
  clearError: () => void;
  reset: () => void;
  refreshAllData: (timeframe?: string) => Promise<void>;
}

// Default empty data for initial state
const defaultProjectMetrics: ProjectPerformanceMetrics[] = [];

const defaultTeamAnalytics: TeamAnalytics = {
  teamOverview: {
    totalMembers: 0,
    activeMembers: 0,
    averageUtilization: 0,
    totalCapacity: 0,
    availableCapacity: 0
  },
  productivity: {
    tasksCompleted: 0,
    averageTaskDuration: 0,
    onTimeDelivery: 0,
    qualityScore: 0,
    productivity: 0
  },
  memberPerformance: [],
  skillAnalysis: {
    availableSkills: [],
    skillGaps: []
  },
  collaborationMetrics: {
    communicationFrequency: 0,
    crossTeamCollaboration: 0,
    knowledgeSharing: 0,
    meetingEfficiency: 0
  },
  trends: {
    productivityTrend: [],
    utilizationTrend: [],
    qualityTrend: []
  }
};

const defaultOrganizationAnalytics: OrganizationAnalytics = {
  overview: {
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalRevenue: 0,
    totalTeamMembers: 0,
    averageProjectValue: 0,
    clientSatisfactionScore: 0,
    organizationGrowth: 0
  },
  financial: {
    revenue: {
      current: 0,
      projected: 0,
      variance: 0
    },
    profitability: {
      grossMargin: 0,
      netMargin: 0,
      operatingMargin: 0
    },
    cashFlow: {
      operating: 0,
      investing: 0,
      financing: 0,
      net: 0
    }
  },
  operational: {
    projectDelivery: {
      onTimeDelivery: 0,
      withinBudget: 0,
      qualityScore: 0
    },
    resourceUtilization: {
      team: 0,
      equipment: 0,
      facilities: 0
    },
    efficiency: {
      processingTime: 0,
      automationLevel: 0,
      errorRate: 0
    }
  },
  market: {
    marketShare: 0,
    competitivePosition: 'Unknown',
    clientRetention: 0,
    newClientAcquisition: 0,
    brandRecognition: 0
  },
  trends: {
    revenueGrowth: [],
    projectCount: [],
    teamGrowth: [],
    clientSatisfaction: []
  }
};

export const useAnalyticsStore = create<AnalyticsStore>()(
  persist(
    (set, get) => ({
      // Analytics data
      projectMetrics: defaultProjectMetrics,
      projectTrends: null,
      riskAnalysis: [],
      teamAnalytics: defaultTeamAnalytics,
      organizationAnalytics: defaultOrganizationAnalytics,
      customReports: [],
      dashboardMetrics: null,
      kpis: [],
      realtimeMetrics: null,
      
      // Loading states
      isLoading: false,
      isLoadingProjects: false,
      isLoadingTeams: false,
      isLoadingOrganization: false,
      isLoadingReports: false,
      isLoadingRealtime: false,
      error: null,
      
      // API methods - Project Analytics
      fetchProjectPerformance: async (params) => {
        set({ isLoadingProjects: true, error: null });
        try {
          const response = await analyticsAPI.projects.getPerformance(params);
          set({ 
            projectMetrics: response || defaultProjectMetrics, // Fallback to default data
            isLoadingProjects: false 
          });
        } catch (error) {
          console.error('Failed to fetch project performance:', error);
          set({ 
            projectMetrics: defaultProjectMetrics, // Fallback to default data
            error: 'Failed to fetch project performance - using mock data',
            isLoadingProjects: false 
          });
        }
      },
      
      fetchProjectTrends: async (params) => {
        set({ isLoadingProjects: true, error: null });
        try {
          const response = await analyticsAPI.projects.getTrends(params);
          set({ 
            projectTrends: response || null,
            isLoadingProjects: false 
          });
        } catch (error) {
          console.error('Failed to fetch project trends:', error);
          set({ 
            projectTrends: null,
            error: 'Failed to fetch project trends',
            isLoadingProjects: false 
          });
        }
      },
      
      fetchRiskAnalysis: async (params) => {
        set({ isLoadingProjects: true, error: null });
        try {
          const response = await analyticsAPI.projects.getRiskAnalysis(params);
          set({ 
            riskAnalysis: response || [],
            isLoadingProjects: false 
          });
        } catch (error) {
          console.error('Failed to fetch risk analysis:', error);
          set({ 
            riskAnalysis: [],
            error: 'Failed to fetch risk analysis',
            isLoadingProjects: false 
          });
        }
      },
      
      getProjectComparison: async (projectIds, metrics) => {
        try {
          const response = await analyticsAPI.projects.getProjectComparison(projectIds, metrics);
          return response;
        } catch (error) {
          console.error('Failed to get project comparison:', error);
          return null;
        }
      },
      
      getProjectForecast: async (projectId, timeframe) => {
        try {
          const response = await analyticsAPI.projects.getProjectForecast(projectId, timeframe);
          return response;
        } catch (error) {
          console.error('Failed to get project forecast:', error);
          return null;
        }
      },
      
      getProjectInsights: async (projectId) => {
        try {
          const response = await analyticsAPI.projects.getProjectInsights(projectId);
          return response;
        } catch (error) {
          console.error('Failed to get project insights:', error);
          return null;
        }
      },
      
      // API methods - Team Analytics
      fetchTeamOverview: async (params) => {
        set({ isLoadingTeams: true, error: null });
        try {
          const response = await analyticsAPI.teams.getTeamOverview(params);
          set({ 
            teamAnalytics: response || defaultTeamAnalytics, // Fallback to default data
            isLoadingTeams: false 
          });
        } catch (error) {
          console.error('Failed to fetch team overview:', error);
          set({ 
            teamAnalytics: defaultTeamAnalytics, // Fallback to default data
            error: 'Failed to fetch team overview - using mock data',
            isLoadingTeams: false 
          });
        }
      },
      
      getMemberPerformance: async (params) => {
        try {
          const response = await analyticsAPI.teams.getMemberPerformance(params);
          return response;
        } catch (error) {
          console.error('Failed to get member performance:', error);
          return null;
        }
      },
      
      getSkillAnalysis: async (params) => {
        try {
          const response = await analyticsAPI.teams.getSkillAnalysis(params);
          return response;
        } catch (error) {
          console.error('Failed to get skill analysis:', error);
          return null;
        }
      },
      
      getWorkloadAnalysis: async (params) => {
        try {
          const response = await analyticsAPI.teams.getWorkloadAnalysis(params);
          return response;
        } catch (error) {
          console.error('Failed to get workload analysis:', error);
          return null;
        }
      },
      
      getCollaborationMetrics: async (params) => {
        try {
          const response = await analyticsAPI.teams.getCollaborationMetrics(params);
          return response;
        } catch (error) {
          console.error('Failed to get collaboration metrics:', error);
          return null;
        }
      },
      
      // API methods - Organization Analytics
      fetchOrganizationOverview: async (params) => {
        set({ isLoadingOrganization: true, error: null });
        try {
          const response = await analyticsAPI.organization.getOverview(params);
          set({ 
            organizationAnalytics: response || defaultOrganizationAnalytics, // Fallback to default data
            isLoadingOrganization: false 
          });
        } catch (error) {
          console.error('Failed to fetch organization overview:', error);
          set({ 
            organizationAnalytics: defaultOrganizationAnalytics, // Fallback to default data
            error: 'Failed to fetch organization overview - using mock data',
            isLoadingOrganization: false 
          });
        }
      },
      
      getFinancialAnalytics: async (params) => {
        try {
          const response = await analyticsAPI.organization.getFinancialAnalytics(params);
          return response;
        } catch (error) {
          console.error('Failed to get financial analytics:', error);
          return null;
        }
      },
      
      getOperationalMetrics: async (params) => {
        try {
          const response = await analyticsAPI.organization.getOperationalMetrics(params);
          return response;
        } catch (error) {
          console.error('Failed to get operational metrics:', error);
          return null;
        }
      },
      
      getMarketAnalytics: async (params) => {
        try {
          const response = await analyticsAPI.organization.getMarketAnalytics(params);
          return response;
        } catch (error) {
          console.error('Failed to get market analytics:', error);
          return null;
        }
      },
      
      getBenchmarking: async (category, metrics) => {
        try {
          const response = await analyticsAPI.organization.getBenchmarking(category, metrics);
          return response;
        } catch (error) {
          console.error('Failed to get benchmarking:', error);
          return null;
        }
      },
      
      // API methods - Custom Reports
      fetchReports: async (params) => {
        set({ isLoadingReports: true, error: null });
        try {
          const response = await analyticsAPI.reports.getAll(params);
          set({ 
            customReports: response.reports || [],
            isLoadingReports: false 
          });
        } catch (error) {
          console.error('Failed to fetch reports:', error);
          set({ 
            customReports: [],
            error: 'Failed to fetch reports',
            isLoadingReports: false 
          });
        }
      },
      
      getReportById: async (id) => {
        try {
          const response = await analyticsAPI.reports.getById(id);
          return response.report || null;
        } catch (error) {
          console.error('Failed to get report:', error);
          return null;
        }
      },
      
      createReport: async (report) => {
        set({ isLoading: true, error: null });
        try {
          const response = await analyticsAPI.reports.create(report);
          set((state) => ({
            customReports: [...state.customReports, response.report],
            isLoading: false
          }));
        } catch (error) {
          console.error('Failed to create report:', error);
          set({ 
            error: 'Failed to create report',
            isLoading: false 
          });
        }
      },
      
      updateReport: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
          const response = await analyticsAPI.reports.update(id, updates);
          set((state) => ({
            customReports: state.customReports.map(report => 
              report.id === id ? response.report : report
            ),
            isLoading: false
          }));
        } catch (error) {
          console.error('Failed to update report:', error);
          set({ 
            error: 'Failed to update report',
            isLoading: false 
          });
        }
      },
      
      deleteReport: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await analyticsAPI.reports.delete(id);
          set((state) => ({
            customReports: state.customReports.filter(report => report.id !== id),
            isLoading: false
          }));
        } catch (error) {
          console.error('Failed to delete report:', error);
          set({ 
            error: 'Failed to delete report',
            isLoading: false 
          });
        }
      },
      
      generateReport: async (id, parameters) => {
        try {
          const response = await analyticsAPI.reports.generate(id, parameters);
          return response;
        } catch (error) {
          console.error('Failed to generate report:', error);
          throw error;
        }
      },
      
      exportReport: async (id, format) => {
        try {
          const blob = await analyticsAPI.reports.export(id, format);
          return blob;
        } catch (error) {
          console.error('Failed to export report:', error);
          throw error;
        }
      },
      
      getReportTemplates: async () => {
        try {
          const response = await analyticsAPI.reports.getTemplates();
          return response.templates || [];
        } catch (error) {
          console.error('Failed to get report templates:', error);
          return [];
        }
      },
      
      // API methods - Predictive Analytics
      getProjectOutcome: async (projectId, scenarios) => {
        try {
          const response = await analyticsAPI.predictive.getProjectOutcome(projectId, scenarios);
          return response;
        } catch (error) {
          console.error('Failed to get project outcome:', error);
          return null;
        }
      },
      
      getResourceDemand: async (params) => {
        try {
          const response = await analyticsAPI.predictive.getResourceDemand(params);
          return response;
        } catch (error) {
          console.error('Failed to get resource demand:', error);
          return null;
        }
      },
      
      getMarketTrends: async (params) => {
        try {
          const response = await analyticsAPI.predictive.getMarketTrends(params);
          return response;
        } catch (error) {
          console.error('Failed to get market trends:', error);
          return null;
        }
      },
      
      getRiskPrediction: async (projectId, timeHorizon) => {
        try {
          const response = await analyticsAPI.predictive.getRiskPrediction(projectId, timeHorizon);
          return response;
        } catch (error) {
          console.error('Failed to get risk prediction:', error);
          return null;
        }
      },
      
      // Convenience methods
      fetchDashboardMetrics: async (timeframe = '30d') => {
        set({ isLoading: true, error: null });
        try {
          const response = await analyticsAPI.getDashboardMetrics(timeframe);
          set({ 
            dashboardMetrics: response,
            isLoading: false 
          });
        } catch (error) {
          console.error('Failed to fetch dashboard metrics:', error);
          set({ 
            dashboardMetrics: {
                      projects: defaultProjectMetrics,
        team: defaultTeamAnalytics,
        organization: defaultOrganizationAnalytics
            },
            error: 'Failed to fetch dashboard metrics - using mock data',
            isLoading: false 
          });
        }
      },
      
      getExecutiveSummary: async (timeframe) => {
        try {
          const response = await analyticsAPI.getExecutiveSummary(timeframe);
          return response;
        } catch (error) {
          console.error('Failed to get executive summary:', error);
          return null;
        }
      },
      
      fetchKPIs: async (category) => {
        set({ isLoading: true, error: null });
        try {
          const response = await analyticsAPI.getKPIs(category);
          set({ 
            kpis: response.kpis || [],
            isLoading: false 
          });
        } catch (error) {
          console.error('Failed to fetch KPIs:', error);
          set({ 
            kpis: [],
            error: 'Failed to fetch KPIs',
            isLoading: false 
          });
        }
      },
      
      searchAnalytics: async (query, type) => {
        try {
          const response = await analyticsAPI.searchAnalytics(query, type);
          return response.results || [];
        } catch (error) {
          console.error('Failed to search analytics:', error);
          return [];
        }
      },
      
      fetchRealtimeMetrics: async () => {
        set({ isLoadingRealtime: true, error: null });
        try {
          const response = await analyticsAPI.getRealtimeMetrics();
          set({ 
            realtimeMetrics: response,
            isLoadingRealtime: false 
          });
        } catch (error) {
          console.error('Failed to fetch realtime metrics:', error);
          set({ 
            realtimeMetrics: null,
            error: 'Failed to fetch realtime metrics',
            isLoadingRealtime: false 
          });
        }
      },
      
      exportDashboard: async (format, sections) => {
        try {
          const blob = await analyticsAPI.exportDashboard(format, sections);
          return blob;
        } catch (error) {
          console.error('Failed to export dashboard:', error);
          throw error;
        }
      },
      
      // Getters
      getProjectMetricsByStatus: (status) => {
        return get().projectMetrics.filter(project => project.status === status);
      },
      
      getHighRiskProjects: () => {
        return get().riskAnalysis.filter(analysis => 
          analysis.riskLevel === 'HIGH' || analysis.riskLevel === 'CRITICAL'
        );
      },
      
      getTopPerformingProjects: (limit = 5) => {
        return get().projectMetrics
          .sort((a, b) => b.healthScore - a.healthScore)
          .slice(0, limit);
      },
      
      getProjectsByHealthScore: (minScore) => {
        return get().projectMetrics.filter(project => project.healthScore >= minScore);
      },
      
      getTrendsByMetric: (metric) => {
        const trends = get().projectTrends;
        if (!trends || !trends.metrics) return [];
        
        const metricData = trends.metrics[metric as keyof typeof trends.metrics];
        return Array.isArray(metricData) ? metricData : [];
      },
      
      // Utility methods
      clearError: () => set({ error: null }),
      
      reset: () => set({
        projectMetrics: [],
        projectTrends: null,
        riskAnalysis: [],
        teamAnalytics: null,
        organizationAnalytics: null,
        customReports: [],
        dashboardMetrics: null,
        kpis: [],
        realtimeMetrics: null,
        isLoading: false,
        isLoadingProjects: false,
        isLoadingTeams: false,
        isLoadingOrganization: false,
        isLoadingReports: false,
        isLoadingRealtime: false,
        error: null
      }),
      
      refreshAllData: async (timeframe = '30d') => {
        set({ isLoading: true, error: null });
        try {
          await Promise.all([
            get().fetchProjectPerformance({ timeframe }),
            get().fetchTeamOverview({ timeframe }),
            get().fetchOrganizationOverview({ timeframe }),
            get().fetchDashboardMetrics(timeframe),
            get().fetchKPIs()
          ]);
          set({ isLoading: false });
        } catch (error) {
          console.error('Failed to refresh all data:', error);
          set({ 
            error: 'Failed to refresh some data',
            isLoading: false 
          });
        }
      }
    }),
    {
      name: 'analytics-store',
      partialize: (state) => ({
        // Don't persist API data, only user preferences if any
      }),
    }
  )
);