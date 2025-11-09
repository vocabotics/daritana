/**
 * RFI SERVICE - PRODUCTION VERSION
 * SECURITY: Uses lib/api.ts for HTTP-Only cookie authentication
 * NO MOCK DATA: All requests go to real backend
 */

import { api } from '@/lib/api';
import { RFI, RFIFilters, RFIStatistics, RFIAttachment } from '@/types/architect';

class RFIService {
  /**
   * Fetch all RFIs with optional filters
   * SECURITY: Uses HTTP-Only cookies via lib/api (withCredentials: true)
   */
  async getRFIs(filters?: RFIFilters): Promise<RFI[]> {
    const response = await api.get('/architect/rfis', { params: filters });
    return response.data.data || [];
  }

  /**
   * Fetch single RFI by ID
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async getRFI(id: string): Promise<RFI | null> {
    const response = await api.get(`/architect/rfis/${id}`);
    return response.data.data;
  }

  /**
   * Create new RFI
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async createRFI(rfi: Omit<RFI, 'id' | 'dateCreated' | 'rfiNumber'>): Promise<RFI> {
    const response = await api.post('/architect/rfis', rfi);
    return response.data.data;
  }

  /**
   * Update existing RFI
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async updateRFI(id: string, updates: Partial<RFI>): Promise<RFI> {
    const response = await api.patch(`/architect/rfis/${id}`, updates);
    return response.data.data;
  }

  /**
   * Respond to RFI with optional file attachments
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async respondToRFI(id: string, responseText: string, attachments?: File[]): Promise<RFI> {
    const formData = new FormData();
    formData.append('response', responseText);

    if (attachments) {
      attachments.forEach(file => {
        formData.append('attachments', file);
      });
    }

    const response = await api.post(`/architect/rfis/${id}/respond`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  }

  /**
   * Upload attachment to existing RFI
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async uploadAttachment(rfiId: string, file: File): Promise<RFIAttachment> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(
      `/architect/rfis/${rfiId}/attachments`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data.data;
  }

  /**
   * Get RFI statistics for dashboard
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async getStatistics(projectId?: string): Promise<RFIStatistics> {
    const response = await api.get('/architect/rfis/statistics', {
      params: { projectId },
    });
    return response.data.data;
  }
}

export const rfiService = new RFIService();