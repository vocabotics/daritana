/**
 * SITE VISIT SERVICE - PRODUCTION VERSION
 * SECURITY: Uses lib/api.ts for HTTP-Only cookie authentication
 * NO MOCK DATA: All requests go to real backend
 */

import { api } from '@/lib/api';
import { SiteVisit, SitePhoto, SiteIssue } from '@/types/architect';

class SiteVisitService {
  /**
   * Fetch all site visits with optional filters
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async getSiteVisits(projectId?: string, dateRange?: { from: string; to: string }): Promise<SiteVisit[]> {
    const response = await api.get('/architect/site-instructions', {
      params: { projectId, ...dateRange },
    });
    return response.data.data || [];
  }

  /**
   * Fetch single site visit by ID
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async getSiteVisit(id: string): Promise<SiteVisit | null> {
    const response = await api.get(`/architect/site-instructions/${id}`);
    return response.data.data;
  }

  /**
   * Create new site visit
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async createSiteVisit(visit: Omit<SiteVisit, 'id' | 'visitNumber' | 'createdAt'>): Promise<SiteVisit> {
    const response = await api.post('/architect/site-instructions', visit);
    return response.data.data;
  }

  /**
   * Update existing site visit
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async updateSiteVisit(id: string, updates: Partial<SiteVisit>): Promise<SiteVisit> {
    const response = await api.patch(`/architect/site-instructions/${id}`, updates);
    return response.data.data;
  }

  /**
   * Delete site visit
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async deleteSiteVisit(id: string): Promise<void> {
    await api.delete(`/architect/site-instructions/${id}`);
  }

  /**
   * Upload site visit photo
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async uploadPhoto(visitId: string, file: File, location: string, description?: string): Promise<SitePhoto> {
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('location', location);
    if (description) {
      formData.append('description', description);
    }

    const response = await api.post(
      `/architect/site-instructions/${visitId}/photos`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data.data;
  }

  /**
   * Record site issue during visit
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async recordIssue(visitId: string, issue: Omit<SiteIssue, 'id'>): Promise<SiteIssue> {
    const response = await api.post(`/architect/site-instructions/${visitId}/issues`, issue);
    return response.data.data;
  }

  /**
   * Update site issue status
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async updateIssueStatus(visitId: string, issueId: string, status: SiteIssue['status'], resolution?: string): Promise<SiteIssue> {
    const response = await api.patch(`/architect/site-instructions/${visitId}/issues/${issueId}`, {
      status,
      resolution,
    });
    return response.data.data;
  }

  /**
   * Generate site visit report PDF
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async generateReport(visitId: string): Promise<Blob> {
    const response = await api.get(`/architect/site-instructions/${visitId}/report/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Get site visit statistics for project
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async getStatistics(projectId: string): Promise<{
    totalVisits: number;
    averageIssuesPerVisit: number;
    issuesResolved: number;
    issuesPending: number;
    lastVisitDate: string;
    nextScheduledVisit: string;
  }> {
    const response = await api.get('/architect/site-instructions/statistics', {
      params: { projectId },
    });
    return response.data.data;
  }
}

export const siteVisitService = new SiteVisitService();
