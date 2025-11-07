import { apiClient } from './api';

// Types for analytics data
export interface ProjectPerformanceMetrics {
  projectId: string;
  projectName: string;
  status: string;
  progress: number;
  healthScore: number;
  timeline: {
    plannedStartDate: Date;
    actualStartDate: Date;
    plannedEndDate: Date;
    estimatedEndDate: Date;
    daysAhead: number;
    daysBehind: number;
  };
  budget: {
    allocated: number;
    spent: number;
    remaining: number;
    burnRate: number;
    projectedTotal: number;
    variance: number;
  };
  resources: {
    teamSize: number;
    utilization: number;
    availableCapacity: number;
    skillGaps: string[];
  };
  quality: {
    defectRate: number;
    reworkPercentage: number;
    clientSatisfaction: number;
    complianceScore: number;
  };
  risks: Array<{
    id: string;
    description: string;
    probability: number;
    impact: number;
    riskScore: number;
    status: 'OPEN' | 'MITIGATED' | 'CLOSED';
  }>;
  milestones: Array<{
    id: string;
    name: string;
    plannedDate: Date;
    actualDate?: Date;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
  }>;
}

export interface ProjectTrends {
  timeframe: '7d' | '30d' | '90d' | '1y';
  metrics: {
    projectCount: Array<{ date: string; count: number }>;
    budgetUtilization: Array<{ date: string; utilization: number }>;
    timelineAdherence: Array<{ date: string; adherence: number }>;
    qualityMetrics: Array<{ date: string; quality: number }>;
    teamProductivity: Array<{ date: string; productivity: number }>;
    clientSatisfaction: Array<{ date: string; satisfaction: number }>;
  };
  comparisons: {
    currentPeriod: {
      avgProjectDuration: number;
      avgBudgetVariance: number;
      avgQualityScore: number;
      completionRate: number;
    };
    previousPeriod: {
      avgProjectDuration: number;
      avgBudgetVariance: number;
      avgQualityScore: number;
      completionRate: number;
    };
    percentageChange: {
      projectDuration: number;
      budgetVariance: number;
      qualityScore: number;
      completionRate: number;
    };
  };
}

export interface ProjectRiskAnalysis {
  projectId: string;
  overallRiskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskCategories: Array<{
    category: 'SCHEDULE' | 'BUDGET' | 'QUALITY' | 'RESOURCES' | 'EXTERNAL' | 'TECHNICAL';
    score: number;
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    risks: Array<{
      id: string;
      description: string;
      probability: number;
      impact: number;
      mitigation?: string;
      owner?: string;
    }>;
  }>;
  predictions: {
    budgetOverrun: {
      probability: number;
      estimatedAmount: number;
      confidence: number;
    };
    scheduleDelay: {
      probability: number;
      estimatedDays: number;
      confidence: number;
    };
    qualityIssues: {
      probability: number;
      estimatedDefects: number;
      confidence: number;
    };
  };
  recommendations: Array<{
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    category: string;
    action: string;
    expectedImpact: string;
    timeline: string;
    resources: string[];
  }>;
  monteCarloAnalysis?: {
    budgetRange: { min: number; max: number; mostLikely: number };
    timelineRange: { min: number; max: number; mostLikely: number };
    successProbability: number;
    scenarios: Array<{
      scenario: 'BEST_CASE' | 'MOST_LIKELY' | 'WORST_CASE';
      budget: number;
      timeline: number;
      probability: number;
    }>;
  };
}

export interface TeamAnalytics {
  teamOverview: {
    totalMembers: number;
    activeMembers: number;
    averageUtilization: number;
    totalCapacity: number;
    availableCapacity: number;
  };
  productivity: {
    tasksCompleted: number;
    averageTaskDuration: number;
    onTimeDelivery: number;
    qualityScore: number;
    productivity: number;
  };
  memberPerformance: Array<{
    memberId: string;
    name: string;
    role: string;
    utilization: number;
    tasksCompleted: number;
    averageTaskDuration: number;
    qualityScore: number;
    efficiency: number;
    workload: 'UNDERUTILIZED' | 'OPTIMAL' | 'OVERLOADED';
  }>;
  skillAnalysis: {
    availableSkills: Array<{
      skill: string;
      memberCount: number;
      utilizationRate: number;
      demandLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    }>;
    skillGaps: Array<{
      skill: string;
      currentCapacity: number;
      requiredCapacity: number;
      gap: number;
      priority: 'LOW' | 'MEDIUM' | 'HIGH';
    }>;
  };
  collaborationMetrics: {
    communicationFrequency: number;
    crossTeamCollaboration: number;
    knowledgeSharing: number;
    meetingEfficiency: number;
  };
  trends: {
    productivityTrend: Array<{ date: string; productivity: number }>;
    utilizationTrend: Array<{ date: string; utilization: number }>;
    qualityTrend: Array<{ date: string; quality: number }>;
  };
}

export interface OrganizationAnalytics {
  overview: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalRevenue: number;
    totalTeamMembers: number;
    averageProjectValue: number;
    clientSatisfactionScore: number;
    organizationGrowth: number;
  };
  financial: {
    revenue: {
      current: number;
      projected: number;
      variance: number;
    };
    profitability: {
      grossMargin: number;
      netMargin: number;
      operatingMargin: number;
    };
    cashFlow: {
      operating: number;
      investing: number;
      financing: number;
      net: number;
    };
  };
  operational: {
    projectDelivery: {
      onTimeDelivery: number;
      withinBudget: number;
      qualityScore: number;
    };
    resourceUtilization: {
      team: number;
      equipment: number;
      facilities: number;
    };
    efficiency: {
      processingTime: number;
      automationLevel: number;
      errorRate: number;
    };
  };
  market: {
    marketShare: number;
    competitivePosition: string;
    clientRetention: number;
    newClientAcquisition: number;
    brandRecognition: number;
  };
  trends: {
    revenueGrowth: Array<{ period: string; revenue: number; growth: number }>;
    projectCount: Array<{ period: string; count: number }>;
    teamGrowth: Array<{ period: string; size: number }>;
    clientSatisfaction: Array<{ period: string; score: number }>;
  };
}

export interface CustomReport {
  id: string;
  name: string;
  description?: string;
  type: 'PROJECT' | 'FINANCIAL' | 'TEAM' | 'COMPLIANCE' | 'CUSTOM';
  parameters: {
    dateRange: {
      startDate: Date;
      endDate: Date;
    };
    filters: Record<string, any>;
    metrics: string[];
    dimensions: string[];
    aggregations: string[];
  };
  schedule?: {
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
    recipients: string[];
    isActive: boolean;
  };
  data: any;
  generatedAt: Date;
  generatedBy: string;
}

// ==================== PROJECT ANALYTICS API ====================

export const projectAnalyticsAPI = {
  async getPerformance(params?: {
    projectId?: string;
    timeframe?: '7d' | '30d' | '90d' | '1y';
    metrics?: string[];
  }) {
    const response = await apiClient.get('/analytics/projects/performance', { params });
    return response.data as ProjectPerformanceMetrics[];
  },

  async getTrends(params?: {
    timeframe?: '7d' | '30d' | '90d' | '1y';
    projectIds?: string[];
    category?: string;
  }) {
    const response = await apiClient.get('/analytics/projects/trends', { params });
    return response.data as ProjectTrends;
  },

  async getRiskAnalysis(params?: {
    projectId?: string;
    riskLevel?: string;
    category?: string;
  }) {
    const response = await apiClient.get('/analytics/projects/risk-analysis', { params });
    return response.data as ProjectRiskAnalysis[];
  },

  async getProjectComparison(projectIds: string[], metrics: string[]) {
    const response = await apiClient.post('/analytics/projects/comparison', {
      projectIds,
      metrics
    });
    return response.data;
  },

  async getProjectForecast(projectId: string, timeframe: number = 90) {
    const response = await apiClient.get(`/analytics/projects/${projectId}/forecast`, {
      params: { timeframe }
    });
    return response.data;
  },

  async getProjectInsights(projectId: string) {
    const response = await apiClient.get(`/analytics/projects/${projectId}/insights`);
    return response.data;
  }
};

// ==================== TEAM ANALYTICS API ====================

export const teamAnalyticsAPI = {
  async getTeamOverview(params?: {
    teamId?: string;
    timeframe?: '7d' | '30d' | '90d';
  }) {
    const response = await apiClient.get('/analytics/teams/overview', { params });
    return response.data as TeamAnalytics;
  },

  async getMemberPerformance(params?: {
    memberId?: string;
    timeframe?: '7d' | '30d' | '90d';
    metrics?: string[];
  }) {
    const response = await apiClient.get('/analytics/teams/member-performance', { params });
    return response.data;
  },

  async getSkillAnalysis(params?: {
    teamId?: string;
    department?: string;
  }) {
    const response = await apiClient.get('/analytics/teams/skill-analysis', { params });
    return response.data;
  },

  async getWorkloadAnalysis(params?: {
    timeframe?: '7d' | '30d' | '90d';
  }) {
    const response = await apiClient.get('/analytics/teams/workload', { params });
    return response.data;
  },

  async getCollaborationMetrics(params?: {
    timeframe?: '7d' | '30d' | '90d';
  }) {
    const response = await apiClient.get('/analytics/teams/collaboration', { params });
    return response.data;
  }
};

// ==================== ORGANIZATION ANALYTICS API ====================

export const organizationAnalyticsAPI = {
  async getOverview(params?: {
    timeframe?: '7d' | '30d' | '90d' | '1y';
  }) {
    const response = await apiClient.get('/analytics/organization/overview', { params });
    return response.data as OrganizationAnalytics;
  },

  async getFinancialAnalytics(params?: {
    timeframe?: '7d' | '30d' | '90d' | '1y';
    breakdown?: 'monthly' | 'quarterly' | 'yearly';
  }) {
    const response = await apiClient.get('/analytics/organization/financial', { params });
    return response.data;
  },

  async getOperationalMetrics(params?: {
    timeframe?: '7d' | '30d' | '90d';
  }) {
    const response = await apiClient.get('/analytics/organization/operational', { params });
    return response.data;
  },

  async getMarketAnalytics(params?: {
    timeframe?: '30d' | '90d' | '1y';
  }) {
    const response = await apiClient.get('/analytics/organization/market', { params });
    return response.data;
  },

  async getBenchmarking(category: string, metrics: string[]) {
    const response = await apiClient.post('/analytics/organization/benchmarking', {
      category,
      metrics
    });
    return response.data;
  }
};

// ==================== CUSTOM REPORTS API ====================

export const reportsAPI = {
  async getAll(params?: {
    type?: string;
    createdBy?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get('/analytics/reports', { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get(`/analytics/reports/${id}`);
    return response.data;
  },

  async create(report: {
    name: string;
    description?: string;
    type: string;
    parameters: {
      dateRange: {
        startDate: string;
        endDate: string;
      };
      filters: Record<string, any>;
      metrics: string[];
      dimensions: string[];
      aggregations: string[];
    };
    schedule?: {
      frequency: string;
      recipients: string[];
    };
  }) {
    const response = await apiClient.post('/analytics/reports', report);
    return response.data;
  },

  async update(id: string, updates: Partial<CustomReport>) {
    const response = await apiClient.put(`/analytics/reports/${id}`, updates);
    return response.data;
  },

  async delete(id: string) {
    const response = await apiClient.delete(`/analytics/reports/${id}`);
    return response.data;
  },

  async generate(id: string, parameters?: any) {
    const response = await apiClient.post(`/analytics/reports/${id}/generate`, { parameters });
    return response.data;
  },

  async export(id: string, format: 'PDF' | 'EXCEL' | 'CSV') {
    const response = await apiClient.get(`/analytics/reports/${id}/export`, {
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  },

  async getTemplates() {
    const response = await apiClient.get('/analytics/reports/templates');
    return response.data;
  }
};

// ==================== PREDICTIVE ANALYTICS API ====================

export const predictiveAnalyticsAPI = {
  async getProjectOutcome(projectId: string, scenarios?: any[]) {
    const response = await apiClient.post(`/analytics/predictive/project-outcome`, {
      projectId,
      scenarios
    });
    return response.data;
  },

  async getResourceDemand(params: {
    timeframe: number;
    projectTypes?: string[];
    skillRequirements?: string[];
  }) {
    const response = await apiClient.post('/analytics/predictive/resource-demand', params);
    return response.data;
  },

  async getMarketTrends(params: {
    industry: string;
    region: string;
    timeframe: number;
  }) {
    const response = await apiClient.post('/analytics/predictive/market-trends', params);
    return response.data;
  },

  async getRiskPrediction(projectId: string, timeHorizon: number = 30) {
    const response = await apiClient.post('/analytics/predictive/risk-prediction', {
      projectId,
      timeHorizon
    });
    return response.data;
  }
};

// ==================== COMBINED ANALYTICS API ====================

export const analyticsAPI = {
  projects: projectAnalyticsAPI,
  teams: teamAnalyticsAPI,
  organization: organizationAnalyticsAPI,
  reports: reportsAPI,
  predictive: predictiveAnalyticsAPI,

  // Convenience methods
  async getDashboardMetrics(timeframe: string = '30d') {
    const [projectMetrics, teamMetrics, orgOverview] = await Promise.all([
      projectAnalyticsAPI.getPerformance({ timeframe }),
      teamAnalyticsAPI.getTeamOverview({ timeframe }),
      organizationAnalyticsAPI.getOverview({ timeframe })
    ]);

    return {
      projects: projectMetrics,
      team: teamMetrics,
      organization: orgOverview
    };
  },

  async getExecutiveSummary(timeframe: string = '30d') {
    const response = await apiClient.get('/analytics/executive-summary', {
      params: { timeframe }
    });
    return response.data;
  },

  async getKPIs(category?: string) {
    const response = await apiClient.get('/analytics/kpis', {
      params: { category }
    });
    return response.data;
  },

  async searchAnalytics(query: string, type?: string) {
    const response = await apiClient.get('/analytics/search', {
      params: { query, type }
    });
    return response.data;
  },

  async getRealtimeMetrics() {
    const response = await apiClient.get('/analytics/realtime');
    return response.data;
  },

  async exportDashboard(format: 'PDF' | 'EXCEL', sections: string[]) {
    const response = await apiClient.post('/analytics/export-dashboard', {
      format,
      sections
    }, {
      responseType: 'blob'
    });
    return response.data;
  }
};

export default analyticsAPI;