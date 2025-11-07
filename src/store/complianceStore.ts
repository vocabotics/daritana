import { create } from 'zustand';
import {
  ComplianceRule,
  ProjectCompliance,
  ComplianceCheck,
  ComplianceAlert,
  ComplianceSubmission,
  UBBLClause,
  ComplianceStatus,
  ComplianceCheckStatus,
  ProjectType,
  ComplianceAuthority,
  ComplianceCategory
} from '@/types';
import { 
  complianceAPI, 
  ComplianceRequirement, 
  ProjectCompliance as APIProjectCompliance, 
  UBBLCheck, 
  ComplianceAlert as APIComplianceAlert, 
  ComplianceDashboard 
} from '@/services/complianceAPI';

interface ComplianceStore {
  // Legacy state
  complianceRules: ComplianceRule[];
  ubblClauses: UBBLClause[];
  projectCompliances: ProjectCompliance[];
  complianceAlerts: ComplianceAlert[];
  
  // New API state
  requirements: ComplianceRequirement[];
  apiProjectCompliances: APIProjectCompliance[];
  ubblChecks: UBBLCheck[];
  apiAlerts: APIComplianceAlert[];
  dashboard: ComplianceDashboard | null;
  
  // Loading states
  isLoading: boolean;
  isLoadingRequirements: boolean;
  isLoadingCompliances: boolean;
  isLoadingAlerts: boolean;
  isLoadingDashboard: boolean;
  error: string | null;
  
  // API methods - Requirements
  fetchRequirements: (params?: { category?: string; authority?: string; projectType?: string; state?: string }) => Promise<void>;
  searchRequirements: (query: string, filters?: { category?: string; authority?: string }) => Promise<void>;
  getRequirementById: (id: string) => Promise<ComplianceRequirement | null>;
  getRequirementsForProject: (projectId: string, projectType: string, state: string) => Promise<void>;
  
  // API methods - Project Compliance
  fetchProjectCompliance: (projectId: string) => Promise<void>;
  updateCompliance: (id: string, updates: any) => Promise<void>;
  addEvidence: (complianceId: string, evidence: any) => Promise<void>;
  addIssue: (complianceId: string, issue: any) => Promise<void>;
  resolveIssue: (complianceId: string, issueId: string, resolution: any) => Promise<void>;
  
  // API methods - UBBL Compliance
  performUBBLCheck: (projectId: string, checkData: any) => Promise<void>;
  getUBBLCheckResult: (checkId: string) => Promise<UBBLCheck | null>;
  getProjectUBBLChecks: (projectId: string) => Promise<void>;
  getUBBLClauses: (params?: { category?: string; buildingType?: string; search?: string }) => Promise<void>;
  getClauseDetails: (clauseId: string) => Promise<any>;
  
  // API methods - Alerts
  fetchAlerts: (params?: { type?: string; severity?: string; projectId?: string; isRead?: boolean }) => Promise<void>;
  markAlertAsRead: (alertId: string) => Promise<void>;
  acknowledgeAlert: (alertId: string, notes?: string) => Promise<void>;
  dismissAlert: (alertId: string) => Promise<void>;
  getUnreadAlertCount: () => Promise<number>;
  
  // API methods - Dashboard
  fetchDashboard: (params?: { timeframe?: string; projectId?: string }) => Promise<void>;
  getComplianceMetrics: (params?: { projectId?: string; category?: string; timeframe?: string }) => Promise<any>;
  exportComplianceReport: (params: any) => Promise<Blob>;
  
  // Convenience methods
  getProjectComplianceOverview: (projectId: string) => Promise<any>;
  getComplianceRiskAssessment: (projectId: string) => Promise<any>;
  searchComplianceDatabase: (query: string, type?: 'requirements' | 'clauses') => Promise<any>;
  getCriticalComplianceIssues: () => Promise<APIComplianceAlert[]>;
  getUpcomingDeadlines: (days?: number) => Promise<any>;
  getComplianceTimeline: (projectId: string) => Promise<any>;
  
  // Legacy actions (for backward compatibility)
  addComplianceRule: (rule: ComplianceRule) => void;
  updateComplianceRule: (id: string, updates: Partial<ComplianceRule>) => void;
  deleteComplianceRule: (id: string) => void;
  addUBBLClause: (clause: UBBLClause) => void;
  updateUBBLClause: (id: string, updates: Partial<UBBLClause>) => void;
  createProjectCompliance: (projectCompliance: ProjectCompliance) => void;
  updateProjectCompliance: (id: string, updates: Partial<ProjectCompliance>) => void;
  updateComplianceCheck: (projectId: string, checkId: string, updates: Partial<ComplianceCheck>) => void;
  addComplianceAlert: (alert: ComplianceAlert) => void;
  acknowledgeAlertLegacy: (alertId: string, userId: string) => void;
  resolveAlert: (alertId: string) => void;
  
  // Getters
  getProjectCompliance: (projectId: string) => ProjectCompliance | undefined;
  getComplianceRulesByCategory: (category: ComplianceCategory) => ComplianceRule[];
  getComplianceRulesByAuthority: (authority: ComplianceAuthority) => ComplianceRule[];
  getUBBLClausesBySection: (section: string) => UBBLClause[];
  getActiveAlerts: (projectId?: string) => ComplianceAlert[];
  calculateComplianceScore: (projectId: string) => number;
  
  // New API getters
  getRequirementsByCategory: (category: string) => ComplianceRequirement[];
  getRequirementsByAuthority: (authority: string) => ComplianceRequirement[];
  getAPIProjectCompliance: (projectId: string) => APIProjectCompliance[];
  getActiveAPIAlerts: (projectId?: string) => APIComplianceAlert[];
  getUBBLChecksByProject: (projectId: string) => UBBLCheck[];
  
  // Utility methods
  clearError: () => void;
  reset: () => void;
}

// Default data structures (empty for real API integration)
const defaultComplianceRules: ComplianceRule[] = [];
const defaultUBBLClauses: UBBLClause[] = [];
const defaultProjectCompliances: ProjectCompliance[] = [];
const defaultComplianceAlerts: ComplianceAlert[] = [];

// Sample data for demo mode (minimal examples)
const sampleComplianceRules: ComplianceRule[] = [
  {
    id: 'demo-rule-1',
    code: 'DEMO-001',
    category: 'building_planning',
    title: 'Sample Building Rule',
    description: 'A demonstration compliance rule for the interface',
    requirement: 'This is a sample requirement for demonstration purposes',
    applicableFor: ['residential_low_rise'],
    severity: 'mandatory',
    authority: 'DBKL',
    lastUpdated: new Date(),
    effectiveDate: new Date(),
    relatedClauses: [],
    checklistItems: [
      {
        id: 'demo-check-1',
        description: 'Sample checklist item',
        required: true
      }
    ],
    penalties: []
  }
];

const sampleUBBLClauses: UBBLClause[] = [
  {
    id: 'demo-clause-1',
    clauseNumber: 'DEMO.1',
    section: 'Part I - General',
    subSection: 'Sample Clause',
    title: 'Sample UBBL Clause',
    content: 'This is a sample UBBL clause for demonstration purposes.',
    applicableBuildings: ['residential_low_rise'],
    measurements: [],
    calculations: [],
    crossReferences: [],
    effectiveDate: new Date()
  }
];

const sampleProjectCompliances: ProjectCompliance[] = [
  {
    id: 'demo-pc-1',
    projectId: 'demo-project-1',
    projectType: 'residential_low_rise',
    applicableRules: ['demo-rule-1'],
    complianceChecks: [
      {
        id: 'demo-check-1',
        ruleId: 'demo-rule-1',
        status: 'compliant',
        checkedBy: 'demo-user',
        checkedAt: new Date(),
        evidence: [],
        checklistResponses: [
          {
            itemId: 'demo-check-1',
            compliant: true,
            value: '100',
            notes: 'Sample compliance check response'
          }
        ],
        calculatedValues: []
      }
    ],
    overallStatus: 'compliant',
    lastAssessment: new Date(),
    nextReviewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    assignedOfficer: 'demo-officer',
    submissionHistory: [],
    exemptions: [],
    deviations: []
  }
];

const sampleComplianceAlerts: ComplianceAlert[] = [
  {
    id: 'demo-alert-1',
    projectId: 'demo-project-1',
    type: 'inspection_required',
    severity: 'medium',
    title: 'Sample Compliance Alert',
    message: 'This is a sample compliance alert for demonstration purposes.',
    ruleIds: ['demo-rule-1'],
    triggeredBy: 'system',
    triggeredAt: new Date(),
    acknowledged: false,
    resolved: false,
    actionRequired: true,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
  }
];

export const useComplianceStore = create<ComplianceStore>((set, get) => ({
  // Legacy state with default empty structures
  complianceRules: defaultComplianceRules,
  ubblClauses: defaultUBBLClauses,
  projectCompliances: defaultProjectCompliances,
  complianceAlerts: defaultComplianceAlerts,
  
  // New API state
  requirements: [],
  apiProjectCompliances: [],
  ubblChecks: [],
  apiAlerts: [],
  dashboard: null,
  
  // Loading states
  isLoading: false,
  isLoadingRequirements: false,
  isLoadingCompliances: false,
  isLoadingAlerts: false,
  isLoadingDashboard: false,
  error: null,
  
  // API methods - Requirements
  fetchRequirements: async (params) => {
    set({ isLoadingRequirements: true, error: null });
    try {
      const response = await complianceAPI.requirements.getAll(params);
      set({ 
        requirements: response.requirements || [],
        isLoadingRequirements: false 
      });
    } catch (error) {
      console.error('Failed to fetch requirements:', error);
      set({ 
        requirements: [], // Empty fallback
        error: 'Failed to fetch requirements',
        isLoadingRequirements: false 
      });
    }
  },
  
  searchRequirements: async (query, filters) => {
    set({ isLoadingRequirements: true, error: null });
    try {
      const response = await complianceAPI.requirements.search(query, filters);
      set({ 
        requirements: response.requirements || [],
        isLoadingRequirements: false 
      });
    } catch (error) {
      console.error('Failed to search requirements:', error);
      set({ 
        requirements: [],
        error: 'Failed to search requirements',
        isLoadingRequirements: false 
      });
    }
  },
  
  getRequirementById: async (id) => {
    try {
      const response = await complianceAPI.requirements.getById(id);
      return response.requirement || null;
    } catch (error) {
      console.error('Failed to get requirement:', error);
      return null;
    }
  },
  
  getRequirementsForProject: async (projectId, projectType, state) => {
    set({ isLoadingRequirements: true, error: null });
    try {
      const response = await complianceAPI.requirements.getByProject(projectId, projectType, state);
      set({ 
        requirements: response.requirements || [],
        isLoadingRequirements: false 
      });
    } catch (error) {
      console.error('Failed to get project requirements:', error);
      set({ 
        requirements: [],
        error: 'Failed to get project requirements',
        isLoadingRequirements: false 
      });
    }
  },
  
  // API methods - Project Compliance
  fetchProjectCompliance: async (projectId) => {
    set({ isLoadingCompliances: true, error: null });
    try {
      const response = await complianceAPI.projectCompliance.getByProject(projectId);
      set({ 
        apiProjectCompliances: response.compliance || [],
        isLoadingCompliances: false 
      });
    } catch (error) {
      console.error('Failed to fetch project compliance:', error);
      set({ 
        apiProjectCompliances: [],
        error: 'Failed to fetch project compliance',
        isLoadingCompliances: false 
      });
    }
  },
  
  updateCompliance: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const response = await complianceAPI.projectCompliance.updateCompliance(id, updates);
      set((state) => ({
        apiProjectCompliances: state.apiProjectCompliances.map(compliance => 
          compliance.id === id ? response.compliance : compliance
        ),
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to update compliance:', error);
      set({ 
        error: 'Failed to update compliance',
        isLoading: false 
      });
    }
  },
  
  addEvidence: async (complianceId, evidence) => {
    set({ isLoading: true, error: null });
    try {
      await complianceAPI.projectCompliance.addEvidence(complianceId, evidence);
      // Refresh compliance data
      await get().fetchProjectCompliance(complianceId);
      set({ isLoading: false });
    } catch (error) {
      console.error('Failed to add evidence:', error);
      set({ 
        error: 'Failed to add evidence',
        isLoading: false 
      });
    }
  },
  
  addIssue: async (complianceId, issue) => {
    set({ isLoading: true, error: null });
    try {
      await complianceAPI.projectCompliance.addIssue(complianceId, issue);
      // Refresh compliance data
      await get().fetchProjectCompliance(complianceId);
      set({ isLoading: false });
    } catch (error) {
      console.error('Failed to add issue:', error);
      set({ 
        error: 'Failed to add issue',
        isLoading: false 
      });
    }
  },
  
  resolveIssue: async (complianceId, issueId, resolution) => {
    set({ isLoading: true, error: null });
    try {
      await complianceAPI.projectCompliance.resolveIssue(complianceId, issueId, resolution);
      // Refresh compliance data
      await get().fetchProjectCompliance(complianceId);
      set({ isLoading: false });
    } catch (error) {
      console.error('Failed to resolve issue:', error);
      set({ 
        error: 'Failed to resolve issue',
        isLoading: false 
      });
    }
  },
  
  // API methods - UBBL Compliance
  performUBBLCheck: async (projectId, checkData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await complianceAPI.ubbl.checkCompliance(projectId, checkData);
      set((state) => ({
        ubblChecks: [...state.ubblChecks, response.check],
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to perform UBBL check:', error);
      set({ 
        error: 'Failed to perform UBBL check',
        isLoading: false 
      });
    }
  },
  
  getUBBLCheckResult: async (checkId) => {
    try {
      const response = await complianceAPI.ubbl.getCheckResult(checkId);
      return response.check || null;
    } catch (error) {
      console.error('Failed to get UBBL check result:', error);
      return null;
    }
  },
  
  getProjectUBBLChecks: async (projectId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await complianceAPI.ubbl.getProjectChecks(projectId);
      set({ 
        ubblChecks: response.checks || [],
        isLoading: false 
      });
    } catch (error) {
      console.error('Failed to get project UBBL checks:', error);
      set({ 
        ubblChecks: [],
        error: 'Failed to get project UBBL checks',
        isLoading: false 
      });
    }
  },
  
  getUBBLClauses: async (params) => {
    set({ isLoading: true, error: null });
    try {
      await complianceAPI.ubbl.getUBBLClauses(params);
      set({ isLoading: false });
    } catch (error) {
      console.error('Failed to get UBBL clauses:', error);
      set({ 
        error: 'Failed to get UBBL clauses',
        isLoading: false 
      });
    }
  },
  
  getClauseDetails: async (clauseId) => {
    try {
      const response = await complianceAPI.ubbl.getClauseDetails(clauseId);
      return response.clause || null;
    } catch (error) {
      console.error('Failed to get clause details:', error);
      return null;
    }
  },
  
  // API methods - Alerts
  fetchAlerts: async (params) => {
    set({ isLoadingAlerts: true, error: null });
    try {
      const response = await complianceAPI.alerts.getAll(params);
      set({ 
        apiAlerts: response.alerts || [],
        isLoadingAlerts: false 
      });
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      set({ 
        apiAlerts: [],
        error: 'Failed to fetch alerts',
        isLoadingAlerts: false 
      });
    }
  },
  
  markAlertAsRead: async (alertId) => {
    try {
      await complianceAPI.alerts.markAsRead(alertId);
      set((state) => ({
        apiAlerts: state.apiAlerts.map(alert =>
          alert.id === alertId ? { ...alert, isRead: true } : alert
        )
      }));
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
    }
  },
  
  acknowledgeAlert: async (alertId, notes) => {
    try {
      await complianceAPI.alerts.acknowledge(alertId, notes);
      set((state) => ({
        apiAlerts: state.apiAlerts.map(alert =>
          alert.id === alertId 
            ? { ...alert, isAcknowledged: true, acknowledgedAt: new Date() }
            : alert
        )
      }));
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  },
  
  dismissAlert: async (alertId) => {
    try {
      await complianceAPI.alerts.dismiss(alertId);
      set((state) => ({
        apiAlerts: state.apiAlerts.filter(alert => alert.id !== alertId)
      }));
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
    }
  },
  
  getUnreadAlertCount: async () => {
    try {
      const response = await complianceAPI.alerts.getUnreadCount();
      return response.count || 0;
    } catch (error) {
      console.error('Failed to get unread alert count:', error);
      return 0;
    }
  },
  
  // API methods - Dashboard
  fetchDashboard: async (params) => {
    set({ isLoadingDashboard: true, error: null });
    try {
      const dashboard = await complianceAPI.dashboard.getDashboard(params);
      set({ 
        dashboard,
        isLoadingDashboard: false 
      });
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
      set({ 
        dashboard: null,
        error: 'Failed to fetch dashboard',
        isLoadingDashboard: false 
      });
    }
  },
  
  getComplianceMetrics: async (params) => {
    try {
      const metrics = await complianceAPI.dashboard.getComplianceMetrics(params);
      return metrics;
    } catch (error) {
      console.error('Failed to get compliance metrics:', error);
      return null;
    }
  },
  
  exportComplianceReport: async (params) => {
    try {
      const blob = await complianceAPI.dashboard.exportComplianceReport(params);
      return blob;
    } catch (error) {
      console.error('Failed to export compliance report:', error);
      throw error;
    }
  },
  
  // Convenience methods
  getProjectComplianceOverview: async (projectId) => {
    try {
      const overview = await complianceAPI.getProjectComplianceOverview(projectId);
      return overview;
    } catch (error) {
      console.error('Failed to get project compliance overview:', error);
      return null;
    }
  },
  
  getComplianceRiskAssessment: async (projectId) => {
    try {
      const assessment = await complianceAPI.getComplianceRiskAssessment(projectId);
      return assessment;
    } catch (error) {
      console.error('Failed to get compliance risk assessment:', error);
      return null;
    }
  },
  
  searchComplianceDatabase: async (query, type = 'requirements') => {
    try {
      const results = await complianceAPI.searchComplianceDatabase(query, type);
      return results;
    } catch (error) {
      console.error('Failed to search compliance database:', error);
      return null;
    }
  },
  
  getCriticalComplianceIssues: async () => {
    try {
      const issues = await complianceAPI.getCriticalComplianceIssues();
      return issues;
    } catch (error) {
      console.error('Failed to get critical compliance issues:', error);
      return [];
    }
  },
  
  getUpcomingDeadlines: async (days = 30) => {
    try {
      const deadlines = await complianceAPI.getUpcomingDeadlines(days);
      return deadlines;
    } catch (error) {
      console.error('Failed to get upcoming deadlines:', error);
      return null;
    }
  },
  
  getComplianceTimeline: async (projectId) => {
    try {
      const timeline = await complianceAPI.getComplianceTimeline(projectId);
      return timeline;
    } catch (error) {
      console.error('Failed to get compliance timeline:', error);
      return null;
    }
  },
  
  // Legacy actions (for backward compatibility)
  addComplianceRule: (rule) => set((state) => ({
    complianceRules: [...state.complianceRules, rule]
  })),

  updateComplianceRule: (id, updates) => set((state) => ({
    complianceRules: state.complianceRules.map(rule =>
      rule.id === id ? { ...rule, ...updates } : rule
    )
  })),

  deleteComplianceRule: (id) => set((state) => ({
    complianceRules: state.complianceRules.filter(rule => rule.id !== id)
  })),

  addUBBLClause: (clause) => set((state) => ({
    ubblClauses: [...state.ubblClauses, clause]
  })),

  updateUBBLClause: (id, updates) => set((state) => ({
    ubblClauses: state.ubblClauses.map(clause =>
      clause.id === id ? { ...clause, ...updates } : clause
    )
  })),

  createProjectCompliance: (projectCompliance) => set((state) => ({
    projectCompliances: [...state.projectCompliances, projectCompliance]
  })),

  updateProjectCompliance: (id, updates) => set((state) => ({
    projectCompliances: state.projectCompliances.map(pc =>
      pc.id === id ? { ...pc, ...updates } : pc
    )
  })),

  updateComplianceCheck: (projectId, checkId, updates) => set((state) => ({
    projectCompliances: state.projectCompliances.map(pc => {
      if (pc.projectId === projectId) {
        return {
          ...pc,
          complianceChecks: pc.complianceChecks.map(check =>
            check.id === checkId ? { ...check, ...updates } : check
          )
        };
      }
      return pc;
    })
  })),

  addComplianceAlert: (alert) => set((state) => ({
    complianceAlerts: [...state.complianceAlerts, alert]
  })),

  acknowledgeAlertLegacy: (alertId, userId) => set((state) => ({
    complianceAlerts: state.complianceAlerts.map(alert =>
      alert.id === alertId
        ? {
            ...alert,
            acknowledged: true,
            acknowledgedBy: userId,
            acknowledgedAt: new Date()
          }
        : alert
    )
  })),

  resolveAlert: (alertId) => set((state) => ({
    complianceAlerts: state.complianceAlerts.map(alert =>
      alert.id === alertId
        ? { ...alert, resolved: true, resolvedAt: new Date() }
        : alert
    )
  })),

  // Getters
  getProjectCompliance: (projectId) => {
    const state = get();
    return state.projectCompliances.find(pc => pc.projectId === projectId);
  },

  getComplianceRulesByCategory: (category) => {
    const state = get();
    return state.complianceRules.filter(rule => rule.category === category);
  },

  getComplianceRulesByAuthority: (authority) => {
    const state = get();
    return state.complianceRules.filter(rule => rule.authority === authority);
  },

  getUBBLClausesBySection: (section) => {
    const state = get();
    return state.ubblClauses.filter(clause => 
      clause.section.toLowerCase().includes(section.toLowerCase())
    );
  },

  getActiveAlerts: (projectId) => {
    const state = get();
    return state.complianceAlerts.filter(alert => 
      !alert.resolved && (!projectId || alert.projectId === projectId)
    );
  },

  calculateComplianceScore: (projectId) => {
    const state = get();
    const projectCompliance = state.projectCompliances.find(pc => pc.projectId === projectId);
    
    if (!projectCompliance || projectCompliance.complianceChecks.length === 0) {
      return 0;
    }

    const compliantChecks = projectCompliance.complianceChecks.filter(
      check => check.status === 'compliant'
    ).length;

    return Math.round((compliantChecks / projectCompliance.complianceChecks.length) * 100);
  },
  
  // New API getters
  getRequirementsByCategory: (category) => {
    return get().requirements.filter(req => req.category === category as any);
  },
  
  getRequirementsByAuthority: (authority) => {
    return get().requirements.filter(req => req.authority === authority as any);
  },
  
  getAPIProjectCompliance: (projectId) => {
    return get().apiProjectCompliances.filter(compliance => compliance.projectId === projectId);
  },
  
  getActiveAPIAlerts: (projectId) => {
    const state = get();
    return state.apiAlerts.filter(alert => 
      !alert.isAcknowledged && (!projectId || alert.projectId === projectId)
    );
  },
  
  getUBBLChecksByProject: (projectId) => {
    return get().ubblChecks.filter(check => check.projectId === projectId);
  },
  
  // Utility methods
  clearError: () => set({ error: null }),
  
  reset: () => set({
    requirements: [],
    apiProjectCompliances: [],
    ubblChecks: [],
    apiAlerts: [],
    dashboard: null,
    isLoading: false,
    isLoadingRequirements: false,
    isLoadingCompliances: false,
    isLoadingAlerts: false,
    isLoadingDashboard: false,
    error: null
  })
}));