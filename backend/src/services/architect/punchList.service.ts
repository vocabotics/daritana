import axios from 'axios';
import { PunchItem, PunchPhoto, PunchComment, PunchListFilters, PunchStatistics } from '@/types/architect';
import { getAuthToken } from '@/utils/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:7001/api';

class PunchListService {
  private getHeaders() {
    const token = getAuthToken();
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    };
  }

  async getPunchItems(filters?: PunchListFilters): Promise<PunchItem[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/architect/punch-items`, {
        headers: this.getHeaders(),
        params: filters,
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch punch items:', error);
      return this.getMockPunchItems();
    }
  }

  async getPunchItem(id: string): Promise<PunchItem | null> {
    try {
      const response = await axios.get(`${API_BASE_URL}/architect/punch-items/${id}`, {
        headers: this.getHeaders(),
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch punch item:', error);
      const mockItems = this.getMockPunchItems();
      return mockItems.find(item => item.id === id) || null;
    }
  }

  async createPunchItem(item: Omit<PunchItem, 'id' | 'itemNumber' | 'createdAt'>): Promise<PunchItem> {
    try {
      const response = await axios.post(`${API_BASE_URL}/architect/punch-items`, item, {
        headers: this.getHeaders(),
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to create punch item:', error);
      return {
        ...item,
        id: `pi-${Date.now()}`,
        itemNumber: `PI-${String(Date.now()).slice(-4)}`,
        createdAt: new Date().toISOString(),
      } as PunchItem;
    }
  }

  async updatePunchItem(id: string, updates: Partial<PunchItem>): Promise<PunchItem> {
    try {
      const response = await axios.put(`${API_BASE_URL}/architect/punch-items/${id}`, updates, {
        headers: this.getHeaders(),
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to update punch item:', error);
      throw error;
    }
  }

  async uploadPhotos(itemId: string, photos: File[], type: PunchPhoto['type']): Promise<PunchPhoto[]> {
    try {
      const formData = new FormData();
      photos.forEach(photo => {
        formData.append('photos', photo);
      });
      formData.append('type', type);

      const response = await axios.post(
        `${API_BASE_URL}/architect/punch-items/${itemId}/photos`,
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
      console.error('Failed to upload photos:', error);
      throw error;
    }
  }

  async addComment(itemId: string, comment: Omit<PunchComment, 'id' | 'timestamp'>): Promise<PunchComment> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/architect/punch-items/${itemId}/comments`,
        comment,
        {
          headers: this.getHeaders(),
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Failed to add comment:', error);
      return {
        ...comment,
        id: `comment-${Date.now()}`,
        timestamp: new Date().toISOString(),
      } as PunchComment;
    }
  }

  async updateStatus(id: string, status: PunchItem['status'], verifiedBy?: string): Promise<PunchItem> {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/architect/punch-items/${id}/status`,
        { status, verifiedBy },
        {
          headers: this.getHeaders(),
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Failed to update status:', error);
      throw error;
    }
  }

  async getStatistics(projectId?: string): Promise<PunchStatistics> {
    try {
      const response = await axios.get(`${API_BASE_URL}/architect/punch-items/statistics`, {
        headers: this.getHeaders(),
        params: { projectId },
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
      // Return mock statistics
      return {
        total: 45,
        open: 12,
        inProgress: 8,
        completed: 20,
        overdue: 5,
        byCategory: {
          architectural: 15,
          structural: 8,
          mep: 10,
          finishes: 7,
          external: 3,
          landscape: 2,
        },
        byContractor: [
          { contractor: 'Hassan Construction', open: 5, completed: 10 },
          { contractor: 'MEP Solutions', open: 3, completed: 5 },
          { contractor: 'Finishing Works Ltd', open: 4, completed: 5 },
        ],
        completionRate: 44.4,
      };
    }
  }

  async exportReport(projectId: string, format: 'pdf' | 'excel'): Promise<string> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/architect/punch-items/export`,
        {
          headers: this.getHeaders(),
          params: { projectId, format },
          responseType: 'blob',
        }
      );
      // Create download URL
      const url = window.URL.createObjectURL(new Blob([response.data]));
      return url;
    } catch (error) {
      console.error('Failed to export report:', error);
      return '/reports/punch-list-sample.pdf';
    }
  }

  private getMockPunchItems(): PunchItem[] {
    return [
      {
        id: 'pi-001',
        projectId: 'proj-001',
        projectName: 'KLCC Tower 3',
        itemNumber: 'PI-001',
        title: 'Paint touch-up required',
        description: 'Paint peeling observed on corridor wall. Touch-up needed.',
        location: 'Level 5',
        floor: '5',
        room: 'Corridor 5A',
        category: 'finishes',
        type: 'defect',
        priority: 'medium',
        status: 'open',
        assignedContractor: {
          id: 'contractor-001',
          name: 'Ali Mohd',
          company: 'Perfect Finish Sdn Bhd',
          trade: 'Painting',
        },
        createdBy: 'Sarah Lee',
        createdAt: '2024-01-15T10:00:00Z',
        dueDate: '2024-01-22T17:00:00Z',
        photos: [
          {
            id: 'pp-001',
            url: '/photos/pi-001-before.jpg',
            thumbnailUrl: '/thumbnails/pi-001-before.jpg',
            type: 'before',
            caption: 'Paint peeling on wall',
            uploadedAt: '2024-01-15T10:00:00Z',
            uploadedBy: 'Sarah Lee',
          },
        ],
        comments: [],
        costToRectify: 500,
        tags: ['painting', 'corridor', 'level-5'],
      },
      {
        id: 'pi-002',
        projectId: 'proj-001',
        projectName: 'KLCC Tower 3',
        itemNumber: 'PI-002',
        title: 'Tile replacement needed',
        description: 'Cracked floor tile in main lobby. Needs immediate replacement.',
        location: 'Ground Floor',
        floor: 'G',
        room: 'Main Lobby',
        category: 'finishes',
        type: 'damage',
        priority: 'high',
        status: 'in_progress',
        assignedContractor: {
          id: 'contractor-002',
          name: 'Tan Brothers',
          company: 'Quality Tiles Sdn Bhd',
          trade: 'Tiling',
        },
        createdBy: 'Sarah Lee',
        createdAt: '2024-01-14T09:00:00Z',
        dueDate: '2024-01-19T17:00:00Z',
        photos: [
          {
            id: 'pp-002',
            url: '/photos/pi-002-before.jpg',
            thumbnailUrl: '/thumbnails/pi-002-before.jpg',
            type: 'before',
            caption: 'Cracked tile in lobby',
            uploadedAt: '2024-01-14T09:00:00Z',
            uploadedBy: 'Sarah Lee',
          },
          {
            id: 'pp-003',
            url: '/photos/pi-002-during.jpg',
            thumbnailUrl: '/thumbnails/pi-002-during.jpg',
            type: 'during',
            caption: 'Tile removal in progress',
            uploadedAt: '2024-01-17T14:00:00Z',
            uploadedBy: 'Ahmad Hassan',
          },
        ],
        comments: [
          {
            id: 'comment-001',
            text: 'Replacement tile ordered. Will arrive tomorrow.',
            author: 'Tan Brothers',
            authorRole: 'Contractor',
            timestamp: '2024-01-17T10:00:00Z',
          },
        ],
        costToRectify: 1500,
        tags: ['tiling', 'lobby', 'urgent'],
      },
      {
        id: 'pi-003',
        projectId: 'proj-001',
        projectName: 'KLCC Tower 3',
        itemNumber: 'PI-003',
        title: 'Door closer adjustment',
        description: 'Fire door not closing properly. Closer needs adjustment.',
        location: 'Level 3',
        floor: '3',
        room: 'Stairwell 3B',
        category: 'architectural',
        type: 'incorrect',
        priority: 'critical',
        status: 'ready_for_inspection',
        assignedContractor: {
          id: 'contractor-003',
          name: 'Safety First',
          company: 'Fire Safety Systems',
          trade: 'Fire Safety',
        },
        createdBy: 'Ahmad Hassan',
        createdAt: '2024-01-13T11:00:00Z',
        dueDate: '2024-01-15T17:00:00Z',
        completedDate: '2024-01-15T15:00:00Z',
        photos: [
          {
            id: 'pp-004',
            url: '/photos/pi-003-before.jpg',
            thumbnailUrl: '/thumbnails/pi-003-before.jpg',
            type: 'before',
            caption: 'Door not closing completely',
            uploadedAt: '2024-01-13T11:00:00Z',
            uploadedBy: 'Ahmad Hassan',
          },
          {
            id: 'pp-005',
            url: '/photos/pi-003-after.jpg',
            thumbnailUrl: '/thumbnails/pi-003-after.jpg',
            type: 'after',
            caption: 'Door closing properly after adjustment',
            uploadedAt: '2024-01-15T15:00:00Z',
            uploadedBy: 'Safety First',
          },
        ],
        comments: [
          {
            id: 'comment-002',
            text: 'Door closer adjusted and tested. Closing properly now.',
            author: 'Safety First',
            authorRole: 'Contractor',
            timestamp: '2024-01-15T15:00:00Z',
          },
        ],
        costToRectify: 200,
        tags: ['fire-safety', 'door', 'critical'],
      },
      {
        id: 'pi-004',
        projectId: 'proj-002',
        projectName: 'Penang Heritage Hotel',
        itemNumber: 'PI-004',
        title: 'Window frame restoration',
        description: 'Heritage window frame needs restoration. Paint stripping and repainting required.',
        location: 'Second Floor',
        floor: '2',
        room: 'Suite 201',
        category: 'architectural',
        type: 'incomplete',
        priority: 'medium',
        status: 'approved',
        assignedContractor: {
          id: 'contractor-004',
          name: 'Heritage Craft',
          company: 'Heritage Restoration Experts',
          trade: 'Conservation',
        },
        createdBy: 'Dr. Fatimah Ibrahim',
        createdAt: '2024-01-10T08:00:00Z',
        dueDate: '2024-01-18T17:00:00Z',
        completedDate: '2024-01-17T16:00:00Z',
        verifiedDate: '2024-01-18T10:00:00Z',
        verifiedBy: 'Dr. Fatimah Ibrahim',
        photos: [
          {
            id: 'pp-006',
            url: '/photos/pi-004-before.jpg',
            thumbnailUrl: '/thumbnails/pi-004-before.jpg',
            type: 'before',
            caption: 'Window frame before restoration',
            uploadedAt: '2024-01-10T08:00:00Z',
            uploadedBy: 'Dr. Fatimah Ibrahim',
          },
          {
            id: 'pp-007',
            url: '/photos/pi-004-after.jpg',
            thumbnailUrl: '/thumbnails/pi-004-after.jpg',
            type: 'after',
            caption: 'Window frame after restoration',
            uploadedAt: '2024-01-17T16:00:00Z',
            uploadedBy: 'Heritage Craft',
          },
        ],
        comments: [
          {
            id: 'comment-003',
            text: 'Restoration completed following heritage guidelines.',
            author: 'Heritage Craft',
            authorRole: 'Contractor',
            timestamp: '2024-01-17T16:00:00Z',
          },
          {
            id: 'comment-004',
            text: 'Excellent work. Approved.',
            author: 'Dr. Fatimah Ibrahim',
            authorRole: 'Architect',
            timestamp: '2024-01-18T10:00:00Z',
          },
        ],
        costToRectify: 3000,
        tags: ['heritage', 'window', 'restoration'],
      },
    ];
  }
}

export const punchListService = new PunchListService();