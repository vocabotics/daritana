import { apiClient } from './api';

export interface ComplianceDocument {
  id: string;
  name: string;
  type: string;
  status: 'compliant' | 'non-compliant' | 'pending';
  lastReviewed: string;
  reviewer?: string;
  project?: any;
  versions?: any[];
}

export interface ComplianceIssue {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'major' | 'minor';
  status: 'open' | 'in-progress' | 'resolved';
  project?: any;
  assignee?: any;
  dueDate?: string;
  resolution?: string;
}

export interface ComplianceAudit {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  userId: string;
  user?: any;
  createdAt: string;
  metadata?: any;
}

export interface ComplianceStandard {
  id: string;
  name: string;
  category: string;
  status: string;
}

export interface ComplianceReport {
  totalIssues: number;
  resolvedIssues: number;
  complianceRate: number;
  totalDocuments: number;
  totalAudits: number;
}

class ComplianceService {
  async getDocuments(): Promise<ComplianceDocument[]> {
    const response = await apiClient.get('/compliance/documents');
    return response.data;
  }

  async getAudits(): Promise<ComplianceAudit[]> {
    const response = await apiClient.get('/compliance/audits');
    return response.data;
  }

  async getStandards(): Promise<ComplianceStandard[]> {
    const response = await apiClient.get('/compliance/standards');
    return response.data;
  }

  async getIssues(): Promise<ComplianceIssue[]> {
    const response = await apiClient.get('/compliance/issues');
    return response.data;
  }

  async createIssue(issue: {
    title: string;
    description: string;
    severity: string;
    projectId: string;
    dueDate?: string;
  }): Promise<ComplianceIssue> {
    const response = await apiClient.post('/compliance/issues', issue);
    return response.data;
  }

  async updateIssue(id: string, updates: {
    status?: string;
    resolution?: string;
  }): Promise<ComplianceIssue> {
    const response = await apiClient.put(`/compliance/issues/${id}`, updates);
    return response.data;
  }

  async getReport(): Promise<ComplianceReport> {
    const response = await apiClient.get('/compliance/report');
    return response.data;
  }
}

export const complianceService = new ComplianceService();