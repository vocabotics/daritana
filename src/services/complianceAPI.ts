import { apiClient } from './api';

// Types for compliance entities
export interface ComplianceRequirement {
  id: string;
  code: string;
  title: string;
  description: string;
  category: 'BUILDING' | 'FIRE_SAFETY' | 'ACCESSIBILITY' | 'ENVIRONMENTAL' | 'STRUCTURAL' | 'PLANNING';
  authority: 'BOMBA' | 'JKR' | 'PLB' | 'JPBD' | 'MPKL' | 'MPSJ' | 'CUSTOM';
  mandatoryFor: string[]; // Project types
  applicableStates: string[];
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  penaltyRange?: string;
  documentRequired: boolean;
  inspectionRequired: boolean;
  isActive: boolean;
  lastUpdated: Date;
  references?: Array<{
    type: 'UBBL' | 'ACT' | 'GUIDELINE' | 'STANDARD';
    reference: string;
    section?: string;
    url?: string;
  }>;
}

export interface ProjectCompliance {
  id: string;
  projectId: string;
  requirementId: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'PENDING_REVIEW' | 'COMPLIANT' | 'NON_COMPLIANT' | 'EXEMPTED';
  assessmentDate?: Date;
  dueDate?: Date;
  assignedTo?: string;
  reviewer?: string;
  notes?: string;
  evidence: Array<{
    type: 'DOCUMENT' | 'INSPECTION_REPORT' | 'CERTIFICATE' | 'PHOTO';
    name: string;
    url: string;
    uploadedAt: Date;
    uploadedBy: string;
  }>;
  issues: Array<{
    id: string;
    description: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
    assignedTo?: string;
    dueDate?: Date;
    createdAt: Date;
    resolvedAt?: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
  requirement: ComplianceRequirement;
}

export interface UBBLCheck {
  id: string;
  projectId: string;
  checkType: 'FULL_COMPLIANCE' | 'SPECIFIC_CLAUSES' | 'DESIGN_REVIEW';
  projectDetails: {
    buildingType: string;
    occupancyClass: string;
    totalFloorArea: number;
    buildingHeight: number;
    numberOfStories: number;
    location: {
      state: string;
      city: string;
      zone?: string;
    };
  };
  requestedClauses?: string[]; // Specific UBBL clauses to check
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  results: {
    overallCompliance: number; // Percentage
    compliantClauses: number;
    nonCompliantClauses: number;
    clauseResults: Array<{
      clause: string;
      title: string;
      requirement: string;
      status: 'COMPLIANT' | 'NON_COMPLIANT' | 'NOT_APPLICABLE' | 'NEEDS_REVIEW';
      explanation: string;
      recommendation?: string;
      severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    }>;
    recommendations: Array<{
      priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
      clause: string;
      issue: string;
      recommendation: string;
      estimatedCost?: number;
      timeframe?: string;
    }>;
  };
  aiAnalysis?: {
    riskAssessment: string;
    costImplications: string;
    timelineImpact: string;
    priorityActions: string[];
  };
  requestedBy: string;
  reviewedBy?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface ComplianceAlert {
  id: string;
  type: 'DEADLINE_APPROACHING' | 'OVERDUE_REQUIREMENT' | 'NEW_REGULATION' | 'INSPECTION_DUE' | 'NON_COMPLIANCE';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  message: string;
  projectId?: string;
  requirementId?: string;
  dueDate?: Date;
  isRead: boolean;
  isAcknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  createdAt: Date;
  metadata?: {
    projectName?: string;
    requirementCode?: string;
    authority?: string;
    daysPastDue?: number;
    estimatedPenalty?: number;
  };
}

export interface ComplianceDashboard {
  overview: {
    totalProjects: number;
    compliantProjects: number;
    projectsAtRisk: number;
    overdueRequirements: number;
    upcomingDeadlines: number;
    overallComplianceRate: number;
  };
  complianceByCategory: Array<{
    category: string;
    total: number;
    compliant: number;
    nonCompliant: number;
    pending: number;
    complianceRate: number;
  }>;
  recentActivity: Array<{
    type: 'ASSESSMENT_COMPLETED' | 'REQUIREMENT_ADDED' | 'ISSUE_RESOLVED' | 'DEADLINE_MISSED';
    projectName: string;
    description: string;
    timestamp: Date;
  }>;
  upcomingDeadlines: Array<{
    projectId: string;
    projectName: string;
    requirementCode: string;
    requirementTitle: string;
    dueDate: Date;
    daysRemaining: number;
    severity: string;
  }>;
  riskAnalysis: {
    highRiskProjects: Array<{
      projectId: string;
      projectName: string;
      riskScore: number;
      criticalIssues: number;
      nextDeadline: Date;
    }>;
    complianceTrends: Array<{
      month: string;
      complianceRate: number;
      totalAssessments: number;
    }>;
  };
}

// ==================== COMPLIANCE REQUIREMENTS API ====================

export const complianceRequirementsAPI = {
  async getAll(params?: {
    category?: string;
    authority?: string;
    projectType?: string;
    state?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get('/compliance/requirements', { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get(`/compliance/requirements/${id}`);
    return response.data;
  },

  async getByProject(projectId: string, projectType: string, state: string) {
    const response = await apiClient.get('/compliance/requirements', {
      params: {
        projectType,
        state,
        mandatoryFor: projectType
      }
    });
    return response.data;
  },

  async search(query: string, filters?: {
    category?: string;
    authority?: string;
  }) {
    const response = await apiClient.get('/compliance/requirements', {
      params: { search: query, ...filters }
    });
    return response.data;
  }
};

// ==================== PROJECT COMPLIANCE API ====================

export const projectComplianceAPI = {
  async getByProject(projectId: string) {
    const response = await apiClient.get(`/compliance/projects/${projectId}/compliance`);
    return response.data;
  },

  async updateCompliance(id: string, updates: {
    status?: string;
    notes?: string;
    assignedTo?: string;
    dueDate?: string;
    evidence?: Array<{
      type: string;
      name: string;
      url: string;
    }>;
  }) {
    const response = await apiClient.put(`/compliance/project-compliance/${id}`, updates);
    return response.data;
  },

  async addEvidence(complianceId: string, evidence: {
    type: 'DOCUMENT' | 'INSPECTION_REPORT' | 'CERTIFICATE' | 'PHOTO';
    name: string;
    file: File;
  }) {
    const formData = new FormData();
    formData.append('file', evidence.file);
    formData.append('type', evidence.type);
    formData.append('name', evidence.name);

    const response = await apiClient.post(
      `/compliance/project-compliance/${complianceId}/evidence`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  async addIssue(complianceId: string, issue: {
    description: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    assignedTo?: string;
    dueDate?: string;
  }) {
    const response = await apiClient.post(
      `/compliance/project-compliance/${complianceId}/issues`,
      issue
    );
    return response.data;
  },

  async resolveIssue(complianceId: string, issueId: string, resolution: {
    notes: string;
    evidence?: Array<{
      type: string;
      name: string;
      url: string;
    }>;
  }) {
    const response = await apiClient.post(
      `/compliance/project-compliance/${complianceId}/issues/${issueId}/resolve`,
      resolution
    );
    return response.data;
  }
};

// ==================== UBBL COMPLIANCE API ====================

export const ubblComplianceAPI = {
  async checkCompliance(projectId: string, checkData: {
    checkType: 'FULL_COMPLIANCE' | 'SPECIFIC_CLAUSES' | 'DESIGN_REVIEW';
    projectDetails: {
      buildingType: string;
      occupancyClass: string;
      totalFloorArea: number;
      buildingHeight: number;
      numberOfStories: number;
      location: {
        state: string;
        city: string;
        zone?: string;
      };
    };
    requestedClauses?: string[];
    documents?: File[];
  }) {
    const formData = new FormData();
    formData.append('projectId', projectId);
    formData.append('checkType', checkData.checkType);
    formData.append('projectDetails', JSON.stringify(checkData.projectDetails));
    
    if (checkData.requestedClauses) {
      formData.append('requestedClauses', JSON.stringify(checkData.requestedClauses));
    }
    
    if (checkData.documents) {
      checkData.documents.forEach((doc, index) => {
        formData.append(`documents[${index}]`, doc);
      });
    }

    const response = await apiClient.post(
      `/compliance/projects/${projectId}/ubbl-check`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  async getCheckResult(checkId: string) {
    const response = await apiClient.get(`/compliance/ubbl-checks/${checkId}`);
    return response.data;
  },

  async getProjectChecks(projectId: string) {
    const response = await apiClient.get(`/compliance/projects/${projectId}/ubbl-checks`);
    return response.data;
  },

  async getUBBLClauses(params?: {
    category?: string;
    buildingType?: string;
    search?: string;
  }) {
    const response = await apiClient.get('/compliance/ubbl/clauses', { params });
    return response.data;
  },

  async getClauseDetails(clauseId: string) {
    const response = await apiClient.get(`/compliance/ubbl/clauses/${clauseId}`);
    return response.data;
  }
};

// ==================== COMPLIANCE ALERTS API ====================

export const complianceAlertsAPI = {
  async getAll(params?: {
    type?: string;
    severity?: string;
    projectId?: string;
    isRead?: boolean;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get('/compliance/alerts', { params });
    return response.data;
  },

  async markAsRead(alertId: string) {
    const response = await apiClient.patch(`/compliance/alerts/${alertId}/read`);
    return response.data;
  },

  async acknowledge(alertId: string, notes?: string) {
    const response = await apiClient.patch(`/compliance/alerts/${alertId}/acknowledge`, { notes });
    return response.data;
  },

  async dismiss(alertId: string) {
    const response = await apiClient.delete(`/compliance/alerts/${alertId}`);
    return response.data;
  },

  async getUnreadCount() {
    const response = await apiClient.get('/compliance/alerts/unread-count');
    return response.data;
  }
};

// ==================== COMPLIANCE DASHBOARD API ====================

export const complianceDashboardAPI = {
  async getDashboard(params?: {
    timeframe?: '7d' | '30d' | '90d' | '1y';
    projectId?: string;
  }) {
    const response = await apiClient.get('/compliance/dashboard', { params });
    return response.data as ComplianceDashboard;
  },

  async getComplianceMetrics(params?: {
    projectId?: string;
    category?: string;
    timeframe?: string;
  }) {
    const response = await apiClient.get('/compliance/metrics', { params });
    return response.data;
  },

  async exportComplianceReport(params: {
    projectId?: string;
    startDate: string;
    endDate: string;
    format: 'PDF' | 'EXCEL';
    includeEvidence?: boolean;
  }) {
    const response = await apiClient.get('/compliance/reports/export', {
      params,
      responseType: 'blob'
    });
    return response.data;
  }
};

// ==================== COMBINED COMPLIANCE API ====================

export const complianceAPI = {
  requirements: complianceRequirementsAPI,
  projectCompliance: projectComplianceAPI,
  ubbl: ubblComplianceAPI,
  alerts: complianceAlertsAPI,
  dashboard: complianceDashboardAPI,

  // Convenience methods
  async getProjectComplianceOverview(projectId: string) {
    const [compliance, alerts, ubblChecks] = await Promise.all([
      projectComplianceAPI.getByProject(projectId),
      complianceAlertsAPI.getAll({ projectId, limit: 10 }),
      ubblComplianceAPI.getProjectChecks(projectId)
    ]);

    return {
      compliance: compliance.compliance || [],
      alerts: alerts.alerts || [],
      ubblChecks: ubblChecks.checks || []
    };
  },

  async getComplianceRiskAssessment(projectId: string) {
    const response = await apiClient.get(`/compliance/projects/${projectId}/risk-assessment`);
    return response.data;
  },

  async searchComplianceDatabase(query: string, type: 'requirements' | 'clauses' = 'requirements') {
    if (type === 'requirements') {
      return complianceRequirementsAPI.search(query);
    } else {
      return ubblComplianceAPI.getUBBLClauses({ search: query });
    }
  },

  async getCriticalComplianceIssues() {
    const alerts = await complianceAlertsAPI.getAll({
      severity: 'CRITICAL',
      isRead: false,
      limit: 20
    });
    return alerts.alerts || [];
  },

  async getUpcomingDeadlines(days: number = 30) {
    const response = await apiClient.get('/compliance/upcoming-deadlines', {
      params: { days }
    });
    return response.data;
  },

  async getComplianceTimeline(projectId: string) {
    const response = await apiClient.get(`/compliance/projects/${projectId}/timeline`);
    return response.data;
  }
};

export default complianceAPI;