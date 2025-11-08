import axios from 'axios';
import { ChangeOrder, ChangeOrderApproval } from '@/types/architect';
import { getAuthToken } from '@/utils/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:7001/api';

class ChangeOrderService {
  private getHeaders() {
    const token = getAuthToken();
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    };
  }

  async getChangeOrders(projectId?: string): Promise<ChangeOrder[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/architect/change-orders`, {
        headers: this.getHeaders(),
        params: { projectId },
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch change orders:', error);
      return this.getMockChangeOrders();
    }
  }

  async getChangeOrder(id: string): Promise<ChangeOrder | null> {
    try {
      const response = await axios.get(`${API_BASE_URL}/architect/change-orders/${id}`, {
        headers: this.getHeaders(),
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch change order:', error);
      const mockOrders = this.getMockChangeOrders();
      return mockOrders.find(order => order.id === id) || null;
    }
  }

  async createChangeOrder(changeOrder: Omit<ChangeOrder, 'id' | 'changeOrderNumber' | 'createdAt' | 'updatedAt'>): Promise<ChangeOrder> {
    try {
      const response = await axios.post(`${API_BASE_URL}/architect/change-orders`, changeOrder, {
        headers: this.getHeaders(),
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to create change order:', error);
      return {
        ...changeOrder,
        id: `co-${Date.now()}`,
        changeOrderNumber: `CO-${String(Date.now()).slice(-4)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as ChangeOrder;
    }
  }

  async updateChangeOrder(id: string, updates: Partial<ChangeOrder>): Promise<ChangeOrder> {
    try {
      const response = await axios.put(`${API_BASE_URL}/architect/change-orders/${id}`, updates, {
        headers: this.getHeaders(),
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to update change order:', error);
      throw error;
    }
  }

  async approveChangeOrder(id: string, approval: Omit<ChangeOrderApproval, 'id'>): Promise<ChangeOrder> {
    try {
      const response = await axios.post(`${API_BASE_URL}/architect/change-orders/${id}/approve`, approval, {
        headers: this.getHeaders(),
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to approve change order:', error);
      throw error;
    }
  }

  async uploadDocument(changeOrderId: string, file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${API_BASE_URL}/architect/change-orders/${changeOrderId}/documents`,
        formData,
        {
          headers: {
            ...this.getHeaders(),
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data.data.url;
    } catch (error) {
      console.error('Failed to upload document:', error);
      throw error;
    }
  }

  async getCostSummary(projectId: string): Promise<{
    original: number;
    approved: number;
    pending: number;
    total: number;
  }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/architect/change-orders/cost-summary`, {
        headers: this.getHeaders(),
        params: { projectId },
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch cost summary:', error);
      return {
        original: 5000000,
        approved: 250000,
        pending: 75000,
        total: 5325000,
      };
    }
  }

  private getMockChangeOrders(): ChangeOrder[] {
    return [
      {
        id: 'co-001',
        projectId: 'proj-001',
        projectName: 'KLCC Tower 3',
        changeOrderNumber: 'CO-001',
        title: 'Additional Fire Escape Staircase',
        description: 'Client requested additional fire escape staircase for enhanced safety compliance.',
        reason: 'client_request',
        status: 'approved',
        requestedBy: {
          id: 'user-001',
          name: 'John Tan',
          company: 'KLCC Properties',
        },
        originalCost: 5000000,
        revisedCost: 5250000,
        costImpact: 250000,
        originalSchedule: '2024-06-30',
        revisedSchedule: '2024-07-15',
        scheduleImpact: 15,
        approvals: [
          {
            id: 'app-001',
            approverId: 'user-010',
            approverName: 'Datuk Ahmad',
            approverRole: 'Project Director',
            status: 'approved',
            comments: 'Approved for safety compliance',
            date: '2024-01-10T10:00:00Z',
            signature: 'DA',
          },
          {
            id: 'app-002',
            approverId: 'user-011',
            approverName: 'Sarah Lim',
            approverRole: 'Finance Director',
            status: 'approved',
            comments: 'Budget approved',
            date: '2024-01-11T14:00:00Z',
            signature: 'SL',
          },
        ],
        documents: [],
        createdAt: '2024-01-05T09:00:00Z',
        updatedAt: '2024-01-11T14:00:00Z',
        approvedDate: '2024-01-11T14:00:00Z',
      },
      {
        id: 'co-002',
        projectId: 'proj-001',
        projectName: 'KLCC Tower 3',
        changeOrderNumber: 'CO-002',
        title: 'Upgraded HVAC System',
        description: 'Upgrade to more energy-efficient HVAC system as per new green building requirements.',
        reason: 'regulatory',
        status: 'pending_review',
        requestedBy: {
          id: 'user-002',
          name: 'MEP Consultants',
          company: 'Green Tech Solutions',
        },
        originalCost: 5250000,
        revisedCost: 5325000,
        costImpact: 75000,
        originalSchedule: '2024-07-15',
        revisedSchedule: '2024-07-15',
        scheduleImpact: 0,
        approvals: [
          {
            id: 'app-003',
            approverId: 'user-010',
            approverName: 'Datuk Ahmad',
            approverRole: 'Project Director',
            status: 'pending',
            date: undefined,
            signature: undefined,
          },
        ],
        documents: [],
        createdAt: '2024-01-18T11:00:00Z',
        updatedAt: '2024-01-18T11:00:00Z',
      },
      {
        id: 'co-003',
        projectId: 'proj-002',
        projectName: 'Penang Heritage Hotel',
        changeOrderNumber: 'CO-003',
        title: 'Foundation Reinforcement',
        description: 'Additional foundation reinforcement required due to unexpected soil conditions.',
        reason: 'site_condition',
        status: 'in_progress',
        requestedBy: {
          id: 'user-003',
          name: 'Structural Engineers',
          company: 'Foundation Experts Sdn Bhd',
        },
        originalCost: 2000000,
        revisedCost: 2150000,
        costImpact: 150000,
        originalSchedule: '2024-05-30',
        revisedSchedule: '2024-06-15',
        scheduleImpact: 16,
        approvals: [
          {
            id: 'app-004',
            approverId: 'user-012',
            approverName: 'Tan Sri Lee',
            approverRole: 'Owner',
            status: 'approved',
            comments: 'Necessary for structural safety',
            date: '2024-01-08T09:00:00Z',
            signature: 'TSL',
          },
        ],
        documents: [],
        createdAt: '2024-01-03T10:00:00Z',
        updatedAt: '2024-01-08T09:00:00Z',
        approvedDate: '2024-01-08T09:00:00Z',
      },
    ];
  }
}

export const changeOrderService = new ChangeOrderService();