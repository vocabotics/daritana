import axios from 'axios';
import { SiteVisit, SitePhoto, SiteIssue } from '@/types/architect';
import { getAuthToken } from '@/utils/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:7001/api';

class SiteVisitService {
  private getHeaders() {
    const token = getAuthToken();
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    };
  }

  async getSiteVisits(projectId?: string, dateRange?: { from: string; to: string }): Promise<SiteVisit[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/architect/site-visits`, {
        headers: this.getHeaders(),
        params: { projectId, ...dateRange },
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch site visits:', error);
      return this.getMockSiteVisits();
    }
  }

  async getSiteVisit(id: string): Promise<SiteVisit | null> {
    try {
      const response = await axios.get(`${API_BASE_URL}/architect/site-visits/${id}`, {
        headers: this.getHeaders(),
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch site visit:', error);
      const mockVisits = this.getMockSiteVisits();
      return mockVisits.find(visit => visit.id === id) || null;
    }
  }

  async createSiteVisit(visit: Omit<SiteVisit, 'id' | 'visitNumber' | 'createdAt'>): Promise<SiteVisit> {
    try {
      const response = await axios.post(`${API_BASE_URL}/architect/site-visits`, visit, {
        headers: this.getHeaders(),
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to create site visit:', error);
      return {
        ...visit,
        id: `sv-${Date.now()}`,
        visitNumber: `SV-${String(Date.now()).slice(-4)}`,
        createdAt: new Date().toISOString(),
      } as SiteVisit;
    }
  }

  async updateSiteVisit(id: string, updates: Partial<SiteVisit>): Promise<SiteVisit> {
    try {
      const response = await axios.put(`${API_BASE_URL}/architect/site-visits/${id}`, updates, {
        headers: this.getHeaders(),
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to update site visit:', error);
      throw error;
    }
  }

  async uploadPhotos(visitId: string, photos: File[]): Promise<SitePhoto[]> {
    try {
      const formData = new FormData();
      photos.forEach(photo => {
        formData.append('photos', photo);
      });

      const response = await axios.post(
        `${API_BASE_URL}/architect/site-visits/${visitId}/photos`,
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

  async createIssue(visitId: string, issue: Omit<SiteIssue, 'id'>): Promise<SiteIssue> {
    try {
      const response = await axios.post(`${API_BASE_URL}/architect/site-visits/${visitId}/issues`, issue, {
        headers: this.getHeaders(),
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to create issue:', error);
      return { ...issue, id: `issue-${Date.now()}` } as SiteIssue;
    }
  }

  async generateReport(visitId: string): Promise<string> {
    try {
      const response = await axios.post(`${API_BASE_URL}/architect/site-visits/${visitId}/report`, {}, {
        headers: this.getHeaders(),
      });
      return response.data.data.reportUrl;
    } catch (error) {
      console.error('Failed to generate report:', error);
      return '/reports/site-visit-sample.pdf';
    }
  }

  async getWeatherData(location: string, date: string): Promise<{
    condition: string;
    temperature: number;
    humidity: number;
    windSpeed: number;
  }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/architect/weather`, {
        headers: this.getHeaders(),
        params: { location, date },
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
      // Return mock weather data
      return {
        condition: 'sunny',
        temperature: 32,
        humidity: 75,
        windSpeed: 12,
      };
    }
  }

  private getMockSiteVisits(): SiteVisit[] {
    return [
      {
        id: 'sv-001',
        projectId: 'proj-001',
        projectName: 'KLCC Tower 3',
        visitNumber: 'SV-001',
        visitType: 'progress',
        date: '2024-01-18',
        startTime: '09:00',
        endTime: '12:00',
        weather: {
          condition: 'sunny',
          temperature: 32,
          humidity: 75,
          windSpeed: 12,
        },
        attendees: [
          {
            id: 'att-001',
            name: 'Sarah Lee',
            company: 'Daritana Architects',
            role: 'Lead Architect',
            email: 'sarah@daritana.com',
            phone: '+60123456789',
          },
          {
            id: 'att-002',
            name: 'Ahmad Hassan',
            company: 'Hassan Construction',
            role: 'Site Manager',
            email: 'ahmad@hassan.com',
            phone: '+60198765432',
          },
          {
            id: 'att-003',
            name: 'John Tan',
            company: 'KLCC Properties',
            role: 'Client Representative',
            email: 'john@klcc.com',
          },
        ],
        purpose: 'Weekly progress inspection and coordination meeting',
        observations: [
          {
            id: 'obs-001',
            category: 'progress',
            description: 'Foundation work 85% complete. Ahead of schedule by 3 days.',
            location: 'Basement B2',
            status: 'satisfactory',
            photos: ['photo-001', 'photo-002'],
          },
          {
            id: 'obs-002',
            category: 'quality',
            description: 'Concrete finishing meets specifications. Good workmanship observed.',
            location: 'Level 1',
            status: 'satisfactory',
          },
          {
            id: 'obs-003',
            category: 'safety',
            description: 'All workers wearing proper PPE. Safety protocols being followed.',
            location: 'Site-wide',
            status: 'satisfactory',
          },
        ],
        issues: [
          {
            id: 'issue-001',
            title: 'Minor water ponding',
            description: 'Water accumulation observed at basement B2 after rain.',
            severity: 'low',
            category: 'quality',
            location: 'Basement B2',
            assignedTo: 'Ahmad Hassan',
            dueDate: '2024-01-20',
            status: 'open',
            photos: ['photo-003'],
          },
        ],
        photos: [
          {
            id: 'photo-001',
            url: '/photos/sv-001-001.jpg',
            thumbnailUrl: '/thumbnails/sv-001-001.jpg',
            caption: 'Foundation progress - B2',
            location: 'Basement B2',
            timestamp: '2024-01-18T09:30:00Z',
            tags: ['foundation', 'progress'],
          },
          {
            id: 'photo-002',
            url: '/photos/sv-001-002.jpg',
            thumbnailUrl: '/thumbnails/sv-001-002.jpg',
            caption: 'Column reinforcement detail',
            location: 'Level 1',
            timestamp: '2024-01-18T10:00:00Z',
            tags: ['structural', 'reinforcement'],
          },
          {
            id: 'photo-003',
            url: '/photos/sv-001-003.jpg',
            thumbnailUrl: '/thumbnails/sv-001-003.jpg',
            caption: 'Water ponding issue',
            location: 'Basement B2',
            timestamp: '2024-01-18T10:30:00Z',
            tags: ['issue', 'water'],
            annotations: [
              {
                id: 'ann-001',
                x: 150,
                y: 200,
                text: 'Water accumulation area',
                author: 'Sarah Lee',
                timestamp: '2024-01-18T15:00:00Z',
              },
            ],
          },
        ],
        nextSteps: 'Address water ponding issue. Continue with Level 2 structural work.',
        reportUrl: '/reports/SV-001.pdf',
        createdBy: 'Sarah Lee',
        createdAt: '2024-01-18T13:00:00Z',
      },
      {
        id: 'sv-002',
        projectId: 'proj-002',
        projectName: 'Penang Heritage Hotel',
        visitNumber: 'SV-002',
        visitType: 'inspection',
        date: '2024-01-16',
        startTime: '14:00',
        endTime: '17:00',
        weather: {
          condition: 'cloudy',
          temperature: 28,
          humidity: 85,
        },
        attendees: [
          {
            id: 'att-004',
            name: 'Dr. Fatimah Ibrahim',
            company: 'Daritana Architects',
            role: 'Heritage Specialist',
            email: 'fatimah@daritana.com',
          },
          {
            id: 'att-005',
            name: 'Lim Wei Ming',
            company: 'Heritage Builders',
            role: 'Conservation Specialist',
          },
          {
            id: 'att-006',
            name: 'Heritage Officer',
            company: 'Penang Heritage Department',
            role: 'Inspector',
          },
        ],
        purpose: 'Heritage facade restoration inspection',
        observations: [
          {
            id: 'obs-004',
            category: 'quality',
            description: 'Restoration work following heritage guidelines. Materials approved.',
            location: 'Front Facade',
            status: 'satisfactory',
            photos: ['photo-004'],
          },
          {
            id: 'obs-005',
            category: 'workmanship',
            description: 'Excellent attention to detail in decorative elements restoration.',
            location: 'Main Entrance',
            status: 'satisfactory',
          },
        ],
        issues: [],
        photos: [
          {
            id: 'photo-004',
            url: '/photos/sv-002-001.jpg',
            thumbnailUrl: '/thumbnails/sv-002-001.jpg',
            caption: 'Heritage facade restoration progress',
            location: 'Front Facade',
            timestamp: '2024-01-16T14:30:00Z',
            tags: ['heritage', 'facade', 'restoration'],
          },
        ],
        createdBy: 'Dr. Fatimah Ibrahim',
        createdAt: '2024-01-16T18:00:00Z',
      },
    ];
  }
}

export const siteVisitService = new SiteVisitService();