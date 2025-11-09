/**
 * PUNCH LIST SERVICE - PRODUCTION VERSION
 * SECURITY: Uses lib/api.ts for HTTP-Only cookie authentication
 * NO MOCK DATA: All requests go to real backend
 */

import { api } from '@/lib/api';
import { PunchItem, PunchPhoto, PunchComment, PunchListFilters, PunchStatistics } from '@/types/architect';

class PunchListService {
  /**
   * Fetch all punch items with optional filters
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async getPunchItems(filters?: PunchListFilters): Promise<PunchItem[]> {
    const response = await api.get('/architect/punch-lists', {
      params: filters,
    });
    return response.data.data || [];
  }

  /**
   * Fetch single punch item by ID
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async getPunchItem(id: string): Promise<PunchItem | null> {
    const response = await api.get(`/architect/punch-lists/${id}`);
    return response.data.data;
  }

  /**
   * Create new punch item
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async createPunchItem(item: Omit<PunchItem, 'id' | 'itemNumber' | 'createdAt'>): Promise<PunchItem> {
    const response = await api.post('/architect/punch-lists', item);
    return response.data.data;
  }

  /**
   * Update existing punch item
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async updatePunchItem(id: string, updates: Partial<PunchItem>): Promise<PunchItem> {
    const response = await api.patch(`/architect/punch-lists/${id}`, updates);
    return response.data.data;
  }

  /**
   * Delete punch item
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async deletePunchItem(id: string): Promise<void> {
    await api.delete(`/architect/punch-lists/${id}`);
  }

  /**
   * Upload photo for punch item
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async uploadPhoto(itemId: string, file: File, description?: string): Promise<PunchPhoto> {
    const formData = new FormData();
    formData.append('photo', file);
    if (description) {
      formData.append('description', description);
    }

    const response = await api.post(
      `/architect/punch-lists/${itemId}/photos`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data.data;
  }

  /**
   * Add comment to punch item
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async addComment(itemId: string, comment: Omit<PunchComment, 'id' | 'createdAt'>): Promise<PunchComment> {
    const response = await api.post(`/architect/punch-lists/${itemId}/comments`, comment);
    return response.data.data;
  }

  /**
   * Get punch list statistics
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async getStatistics(projectId: string): Promise<PunchStatistics> {
    const response = await api.get('/architect/punch-lists/statistics', {
      params: { projectId },
    });
    return response.data.data;
  }

  /**
   * Export punch list to PDF
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async exportToPDF(projectId: string, filters?: PunchListFilters): Promise<Blob> {
    const response = await api.get('/architect/punch-lists/export/pdf', {
      params: { projectId, ...filters },
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Bulk update punch items status
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async bulkUpdateStatus(itemIds: string[], status: PunchItem['status']): Promise<void> {
    await api.post('/architect/punch-lists/bulk-update', {
      itemIds,
      status,
    });
  }
}

export const punchListService = new PunchListService();
