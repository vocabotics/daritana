import axios from 'axios';
import { Drawing, DrawingRevision, DrawingTransmittal, DrawingFilters } from '@/types/architect';
import { getAuthToken } from '@/utils/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:7001/api';

class DrawingService {
  private getHeaders() {
    const token = getAuthToken();
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    };
  }

  async getDrawings(filters?: DrawingFilters): Promise<Drawing[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/architect/drawings`, {
        headers: this.getHeaders(),
        params: filters,
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch drawings:', error);
      return this.getMockDrawings();
    }
  }

  async getDrawing(id: string): Promise<Drawing | null> {
    try {
      const response = await axios.get(`${API_BASE_URL}/architect/drawings/${id}`, {
        headers: this.getHeaders(),
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch drawing:', error);
      const mockDrawings = this.getMockDrawings();
      return mockDrawings.find(drawing => drawing.id === id) || null;
    }
  }

  async uploadDrawing(file: File, metadata: Partial<Drawing>): Promise<Drawing> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('metadata', JSON.stringify(metadata));

      const response = await axios.post(`${API_BASE_URL}/architect/drawings`, formData, {
        headers: {
          ...this.getHeaders(),
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to upload drawing:', error);
      throw error;
    }
  }

  async createRevision(drawingId: string, file: File, revision: Omit<DrawingRevision, 'id' | 'fileUrl' | 'fileSize'>): Promise<DrawingRevision> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('revision', JSON.stringify(revision));

      const response = await axios.post(
        `${API_BASE_URL}/architect/drawings/${drawingId}/revisions`,
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
      console.error('Failed to create revision:', error);
      throw error;
    }
  }

  async createTransmittal(transmittal: Omit<DrawingTransmittal, 'id' | 'transmittalNumber' | 'sentDate'>): Promise<DrawingTransmittal> {
    try {
      const response = await axios.post(`${API_BASE_URL}/architect/transmittals`, transmittal, {
        headers: this.getHeaders(),
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to create transmittal:', error);
      return {
        ...transmittal,
        id: `tr-${Date.now()}`,
        transmittalNumber: `TR-${String(Date.now()).slice(-4)}`,
        sentDate: new Date().toISOString(),
      } as DrawingTransmittal;
    }
  }

  async getTransmittals(projectId: string): Promise<DrawingTransmittal[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/architect/transmittals`, {
        headers: this.getHeaders(),
        params: { projectId },
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch transmittals:', error);
      return [];
    }
  }

  async updateDrawingStatus(id: string, status: Drawing['status']): Promise<Drawing> {
    try {
      const response = await axios.put(`${API_BASE_URL}/architect/drawings/${id}/status`, { status }, {
        headers: this.getHeaders(),
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to update drawing status:', error);
      throw error;
    }
  }

  private getMockDrawings(): Drawing[] {
    return [
      {
        id: 'dwg-001',
        projectId: 'proj-001',
        projectName: 'KLCC Tower 3',
        drawingNumber: 'A-101',
        title: 'Ground Floor Plan',
        discipline: 'architectural',
        type: 'plan',
        scale: '1:100',
        size: 'A1',
        currentRevision: 'C',
        status: 'for_construction',
        revisions: [
          {
            id: 'rev-001',
            revision: 'A',
            description: 'Initial issue for review',
            date: '2024-01-01T08:00:00Z',
            author: 'Sarah Lee',
            fileUrl: '/drawings/A-101-Rev-A.pdf',
            fileSize: 5242880,
            status: 'superseded',
          },
          {
            id: 'rev-002',
            revision: 'B',
            description: 'Updated based on client comments',
            date: '2024-01-08T10:00:00Z',
            author: 'Sarah Lee',
            fileUrl: '/drawings/A-101-Rev-B.pdf',
            fileSize: 5342880,
            status: 'superseded',
          },
          {
            id: 'rev-003',
            revision: 'C',
            description: 'For construction',
            date: '2024-01-15T14:00:00Z',
            author: 'Sarah Lee',
            fileUrl: '/drawings/A-101-Rev-C.pdf',
            fileSize: 5442880,
            status: 'current',
          },
        ],
        fileUrl: '/drawings/A-101-Rev-C.pdf',
        thumbnailUrl: '/thumbnails/A-101.jpg',
        createdBy: 'Sarah Lee',
        createdAt: '2024-01-01T08:00:00Z',
        lastModified: '2024-01-15T14:00:00Z',
        transmittals: ['tr-001', 'tr-002'],
        tags: ['ground-floor', 'main-entrance', 'lobby'],
      },
      {
        id: 'dwg-002',
        projectId: 'proj-001',
        projectName: 'KLCC Tower 3',
        drawingNumber: 'S-201',
        title: 'Foundation Layout',
        discipline: 'structural',
        type: 'plan',
        scale: '1:200',
        size: 'A0',
        currentRevision: 'B',
        status: 'for_construction',
        revisions: [
          {
            id: 'rev-004',
            revision: 'A',
            description: 'Initial structural layout',
            date: '2024-01-02T09:00:00Z',
            author: 'Ahmad Rahman',
            fileUrl: '/drawings/S-201-Rev-A.pdf',
            fileSize: 8388608,
            status: 'superseded',
          },
          {
            id: 'rev-005',
            revision: 'B',
            description: 'Revised pile locations',
            date: '2024-01-10T11:00:00Z',
            author: 'Ahmad Rahman',
            fileUrl: '/drawings/S-201-Rev-B.pdf',
            fileSize: 8488608,
            status: 'current',
          },
        ],
        fileUrl: '/drawings/S-201-Rev-B.pdf',
        thumbnailUrl: '/thumbnails/S-201.jpg',
        createdBy: 'Ahmad Rahman',
        createdAt: '2024-01-02T09:00:00Z',
        lastModified: '2024-01-10T11:00:00Z',
        transmittals: ['tr-001'],
        tags: ['foundation', 'piling', 'structural'],
      },
      {
        id: 'dwg-003',
        projectId: 'proj-001',
        projectName: 'KLCC Tower 3',
        drawingNumber: 'M-301',
        title: 'HVAC Distribution - Level 1',
        discipline: 'mep',
        type: 'plan',
        scale: '1:100',
        size: 'A1',
        currentRevision: 'A',
        status: 'for_review',
        revisions: [
          {
            id: 'rev-006',
            revision: 'A',
            description: 'Initial MEP layout',
            date: '2024-01-18T13:00:00Z',
            author: 'Kumar Raj',
            fileUrl: '/drawings/M-301-Rev-A.pdf',
            fileSize: 4194304,
            status: 'current',
          },
        ],
        fileUrl: '/drawings/M-301-Rev-A.pdf',
        thumbnailUrl: '/thumbnails/M-301.jpg',
        createdBy: 'Kumar Raj',
        createdAt: '2024-01-18T13:00:00Z',
        lastModified: '2024-01-18T13:00:00Z',
        transmittals: [],
        tags: ['hvac', 'mechanical', 'level-1'],
      },
      {
        id: 'dwg-004',
        projectId: 'proj-002',
        projectName: 'Penang Heritage Hotel',
        drawingNumber: 'A-H01',
        title: 'Heritage Facade - Front Elevation',
        discipline: 'architectural',
        type: 'elevation',
        scale: '1:50',
        size: 'A2',
        currentRevision: 'D',
        status: 'approved',
        revisions: [
          {
            id: 'rev-007',
            revision: 'A',
            description: 'Initial heritage documentation',
            date: '2023-12-01T08:00:00Z',
            author: 'Dr. Fatimah Ibrahim',
            fileUrl: '/drawings/A-H01-Rev-A.pdf',
            fileSize: 3145728,
            status: 'superseded',
          },
          {
            id: 'rev-008',
            revision: 'B',
            description: 'Conservation authority comments',
            date: '2023-12-15T10:00:00Z',
            author: 'Dr. Fatimah Ibrahim',
            fileUrl: '/drawings/A-H01-Rev-B.pdf',
            fileSize: 3245728,
            status: 'superseded',
          },
          {
            id: 'rev-009',
            revision: 'C',
            description: 'Material specifications added',
            date: '2024-01-05T09:00:00Z',
            author: 'Dr. Fatimah Ibrahim',
            fileUrl: '/drawings/A-H01-Rev-C.pdf',
            fileSize: 3345728,
            status: 'superseded',
          },
          {
            id: 'rev-010',
            revision: 'D',
            description: 'Final approved by heritage department',
            date: '2024-01-12T15:00:00Z',
            author: 'Dr. Fatimah Ibrahim',
            fileUrl: '/drawings/A-H01-Rev-D.pdf',
            fileSize: 3445728,
            status: 'current',
          },
        ],
        fileUrl: '/drawings/A-H01-Rev-D.pdf',
        thumbnailUrl: '/thumbnails/A-H01.jpg',
        createdBy: 'Dr. Fatimah Ibrahim',
        createdAt: '2023-12-01T08:00:00Z',
        lastModified: '2024-01-12T15:00:00Z',
        transmittals: ['tr-003', 'tr-004'],
        tags: ['heritage', 'facade', 'conservation', 'front-elevation'],
      },
    ];
  }
}

export const drawingService = new DrawingService();