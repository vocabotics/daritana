/**
 * CHANGE ORDER SERVICE - PRODUCTION VERSION
 * SECURITY: Uses lib/api.ts for HTTP-Only cookie authentication
 * NO MOCK DATA: All requests go to real backend
 */

import { api } from '@/lib/api';
import { ChangeOrder, ChangeOrderApproval } from '@/types/architect';

class ChangeOrderService {
  /**
   * Fetch all change orders with optional project filter
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async getChangeOrders(projectId?: string): Promise<ChangeOrder[]> {
    const response = await api.get('/architect/change-orders', {
      params: { projectId },
    });
    return response.data.data || [];
  }

  /**
   * Fetch single change order by ID
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async getChangeOrder(id: string): Promise<ChangeOrder | null> {
    const response = await api.get(`/architect/change-orders/${id}`);
    return response.data.data;
  }

  /**
   * Create new change order
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async createChangeOrder(changeOrder: Omit<ChangeOrder, 'id' | 'changeOrderNumber' | 'createdAt' | 'updatedAt'>): Promise<ChangeOrder> {
    const response = await api.post('/architect/change-orders', changeOrder);
    return response.data.data;
  }

  /**
   * Update existing change order
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async updateChangeOrder(id: string, updates: Partial<ChangeOrder>): Promise<ChangeOrder> {
    const response = await api.patch(`/architect/change-orders/${id}`, updates);
    return response.data.data;
  }

  /**
   * Approve change order
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async approveChangeOrder(id: string, approval: Omit<ChangeOrderApproval, 'id'>): Promise<ChangeOrder> {
    const response = await api.post(`/architect/change-orders/${id}/approve`, approval);
    return response.data.data;
  }

  /**
   * Upload document to change order
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async uploadDocument(changeOrderId: string, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(
      `/architect/change-orders/${changeOrderId}/documents`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data.data.url;
  }

  /**
   * Get cost summary for project
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async getCostSummary(projectId: string): Promise<{
    original: number;
    approved: number;
    pending: number;
    total: number;
  }> {
    const response = await api.get('/architect/change-orders/cost-summary', {
      params: { projectId },
    });
    return response.data.data;
  }
}

export const changeOrderService = new ChangeOrderService();
