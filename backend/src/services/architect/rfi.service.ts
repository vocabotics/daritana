import axios from 'axios';
import { RFI, RFIFilters, RFIStatistics, RFIAttachment } from '@/types/architect';
import { getAuthToken } from '@/utils/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:7001/api';

class RFIService {
  private getHeaders() {
    const token = getAuthToken();
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    };
  }

  async getRFIs(filters?: RFIFilters): Promise<RFI[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/architect/rfis`, {
        headers: this.getHeaders(),
        params: filters,
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch RFIs:', error);
      // Return mock data for development
      return this.getMockRFIs();
    }
  }

  async getRFI(id: string): Promise<RFI | null> {
    try {
      const response = await axios.get(`${API_BASE_URL}/architect/rfis/${id}`, {
        headers: this.getHeaders(),
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch RFI:', error);
      // Return mock data for development
      const mockRFIs = this.getMockRFIs();
      return mockRFIs.find(rfi => rfi.id === id) || null;
    }
  }

  async createRFI(rfi: Omit<RFI, 'id' | 'dateCreated' | 'rfiNumber'>): Promise<RFI> {
    try {
      const response = await axios.post(`${API_BASE_URL}/architect/rfis`, rfi, {
        headers: this.getHeaders(),
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to create RFI:', error);
      // Return mock data for development
      return {
        ...rfi,
        id: `rfi-${Date.now()}`,
        rfiNumber: `RFI-${String(Date.now()).slice(-4)}`,
        dateCreated: new Date().toISOString(),
      } as RFI;
    }
  }

  async updateRFI(id: string, updates: Partial<RFI>): Promise<RFI> {
    try {
      const response = await axios.put(`${API_BASE_URL}/architect/rfis/${id}`, updates, {
        headers: this.getHeaders(),
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to update RFI:', error);
      throw error;
    }
  }

  async respondToRFI(id: string, response: string, attachments?: File[]): Promise<RFI> {
    try {
      const formData = new FormData();
      formData.append('response', response);

      if (attachments) {
        attachments.forEach(file => {
          formData.append('attachments', file);
        });
      }

      const result = await axios.post(`${API_BASE_URL}/architect/rfis/${id}/respond`, formData, {
        headers: {
          ...this.getHeaders(),
          'Content-Type': 'multipart/form-data',
        },
      });
      return result.data.data;
    } catch (error) {
      console.error('Failed to respond to RFI:', error);
      throw error;
    }
  }

  async uploadAttachment(rfiId: string, file: File): Promise<RFIAttachment> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${API_BASE_URL}/architect/rfis/${rfiId}/attachments`,
        formData,
        {
          headers: {
            ...this.getHeaders(),
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Failed to upload attachment:', error);
      throw error;
    }
  }

  async getStatistics(projectId?: string): Promise<RFIStatistics> {
    try {
      const response = await axios.get(`${API_BASE_URL}/architect/rfis/statistics`, {
        headers: this.getHeaders(),
        params: { projectId },
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch RFI statistics:', error);
      // Return mock statistics
      return {
        total: 24,
        open: 8,
        responded: 12,
        closed: 4,
        avgResponseTime: 48,
        byCategory: {
          structural: 6,
          architectural: 8,
          mep: 5,
          civil: 3,
          landscape: 1,
          other: 1,
        },
        byPriority: {
          low: 5,
          medium: 12,
          high: 6,
          critical: 1,
        },
      };
    }
  }

  private getMockRFIs(): RFI[] {
    return [
      {
        id: 'rfi-001',
        projectId: 'proj-001',
        projectName: 'KLCC Tower 3',
        rfiNumber: 'RFI-001',
        title: 'Clarification on Steel Beam Specifications',
        description: 'Need clarification on the steel beam specifications for Level 23. The drawings show conflicting dimensions.',
        category: 'structural',
        priority: 'high',
        status: 'open',
        requestedBy: {
          id: 'user-001',
          name: 'Ahmad Hassan',
          company: 'Hassan Construction Sdn Bhd',
          role: 'Site Engineer',
        },
        assignedTo: {
          id: 'user-002',
          name: 'Sarah Lee',
          email: 'sarah.lee@daritana.com',
        },
        dateCreated: '2024-01-15T08:00:00Z',
        dateDue: '2024-01-20T17:00:00Z',
        attachments: [
          {
            id: 'att-001',
            fileName: 'Level_23_Structural.pdf',
            fileUrl: '/files/Level_23_Structural.pdf',
            fileSize: 2048000,
            uploadedBy: 'Ahmad Hassan',
            uploadedAt: '2024-01-15T08:00:00Z',
            type: 'drawing',
          },
        ],
        costImpact: 0,
        scheduleImpact: 0,
        tags: ['structural', 'level-23', 'urgent'],
      },
      {
        id: 'rfi-002',
        projectId: 'proj-001',
        projectName: 'KLCC Tower 3',
        rfiNumber: 'RFI-002',
        title: 'MEP Coordination for Basement Parking',
        description: 'Require coordination details for MEP services in basement parking area B2.',
        category: 'mep',
        priority: 'medium',
        status: 'responded',
        requestedBy: {
          id: 'user-003',
          name: 'Kumar Raj',
          company: 'MEP Solutions Sdn Bhd',
          role: 'MEP Coordinator',
        },
        assignedTo: {
          id: 'user-002',
          name: 'Sarah Lee',
          email: 'sarah.lee@daritana.com',
        },
        dateCreated: '2024-01-10T09:00:00Z',
        dateDue: '2024-01-17T17:00:00Z',
        dateResponded: '2024-01-16T14:30:00Z',
        response: 'Please refer to the updated MEP coordination drawings Rev.3 attached. The services routing has been adjusted to avoid clashes.',
        attachments: [
          {
            id: 'att-002',
            fileName: 'B2_MEP_Coordination_Rev3.dwg',
            fileUrl: '/files/B2_MEP_Coordination_Rev3.dwg',
            fileSize: 5120000,
            uploadedBy: 'Sarah Lee',
            uploadedAt: '2024-01-16T14:30:00Z',
            type: 'drawing',
          },
        ],
        costImpact: 0,
        scheduleImpact: 0,
        tags: ['mep', 'basement', 'coordination'],
      },
      {
        id: 'rfi-003',
        projectId: 'proj-002',
        projectName: 'Penang Heritage Hotel',
        rfiNumber: 'RFI-003',
        title: 'Heritage Facade Restoration Method',
        description: 'Need approval for proposed restoration method for heritage facade elements.',
        category: 'architectural',
        priority: 'critical',
        status: 'in_review',
        requestedBy: {
          id: 'user-004',
          name: 'Lim Wei Ming',
          company: 'Heritage Builders',
          role: 'Conservation Specialist',
        },
        assignedTo: {
          id: 'user-005',
          name: 'Dr. Fatimah Ibrahim',
          email: 'fatimah@daritana.com',
        },
        dateCreated: '2024-01-18T10:00:00Z',
        dateDue: '2024-01-22T17:00:00Z',
        attachments: [
          {
            id: 'att-003',
            fileName: 'Heritage_Restoration_Proposal.pdf',
            fileUrl: '/files/Heritage_Restoration_Proposal.pdf',
            fileSize: 8192000,
            uploadedBy: 'Lim Wei Ming',
            uploadedAt: '2024-01-18T10:00:00Z',
            type: 'document',
          },
          {
            id: 'att-004',
            fileName: 'Facade_Photos.zip',
            fileUrl: '/files/Facade_Photos.zip',
            fileSize: 15360000,
            uploadedBy: 'Lim Wei Ming',
            uploadedAt: '2024-01-18T10:00:00Z',
            type: 'photo',
          },
        ],
        costImpact: 50000,
        scheduleImpact: 5,
        tags: ['heritage', 'facade', 'conservation', 'critical'],
      },
    ];
  }
}

export const rfiService = new RFIService();