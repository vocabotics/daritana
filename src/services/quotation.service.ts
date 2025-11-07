/**
 * Quotation Service
 * Handles quotation-related API calls
 */

import { api } from '@/lib/api';

export interface Quotation {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  clientId: string;
  validUntil: string;
  items: QuotationItem[];
  terms?: string;
  notes?: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  createdAt: string;
  updatedAt: string;
}

export interface QuotationItem {
  id: string;
  description: string;
  itemId?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface CreateQuotationData {
  title: string;
  description?: string;
  projectId: string;
  clientId: string;
  validUntil: string;
  items: Omit<QuotationItem, 'id'>[];
  terms?: string;
  notes?: string;
}

class QuotationService {
  /**
   * Get all quotations
   */
  async getQuotations(params?: {
    page?: number;
    limit?: number;
    projectId?: string;
    clientId?: string;
    status?: string;
  }): Promise<{ data: Quotation[]; total: number }> {
    try {
      const response = await api.get('/quotations', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch quotations:', error);
      return { data: [], total: 0 };
    }
  }

  /**
   * Get quotation by ID
   */
  async getQuotation(id: string): Promise<Quotation | null> {
    try {
      const response = await api.get(`/quotations/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch quotation:', error);
      return null;
    }
  }

  /**
   * Create new quotation
   */
  async createQuotation(data: CreateQuotationData): Promise<Quotation | null> {
    try {
      const response = await api.post('/quotations', data);
      return response.data;
    } catch (error) {
      console.error('Failed to create quotation:', error);
      return null;
    }
  }

  /**
   * Update quotation
   */
  async updateQuotation(id: string, data: Partial<CreateQuotationData>): Promise<Quotation | null> {
    try {
      const response = await api.put(`/quotations/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Failed to update quotation:', error);
      return null;
    }
  }

  /**
   * Delete quotation
   */
  async deleteQuotation(id: string): Promise<boolean> {
    try {
      await api.delete(`/quotations/${id}`);
      return true;
    } catch (error) {
      console.error('Failed to delete quotation:', error);
      return false;
    }
  }

  /**
   * Send quotation to client
   */
  async sendQuotation(id: string): Promise<boolean> {
    try {
      await api.post(`/quotations/${id}/send`);
      return true;
    } catch (error) {
      console.error('Failed to send quotation:', error);
      return false;
    }
  }
}

export const quotationService = new QuotationService();
export default quotationService;