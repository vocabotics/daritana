/**
 * DRAWING SERVICE - PRODUCTION VERSION
 * SECURITY: Uses lib/api.ts for HTTP-Only cookie authentication
 * NO MOCK DATA: All requests go to real backend
 */

import { api } from '@/lib/api';
import { Drawing, DrawingRevision, DrawingTransmittal, DrawingFilters } from '@/types/architect';

class DrawingService {
  /**
   * Fetch all drawings with optional filters
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async getDrawings(filters?: DrawingFilters): Promise<Drawing[]> {
    const response = await api.get('/architect/drawings', {
      params: filters,
    });
    return response.data.data || [];
  }

  /**
   * Fetch single drawing by ID
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async getDrawing(id: string): Promise<Drawing | null> {
    const response = await api.get(`/architect/drawings/${id}`);
    return response.data.data;
  }

  /**
   * Upload new drawing
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async uploadDrawing(file: File, metadata: Partial<Drawing>): Promise<Drawing> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify(metadata));

    const response = await api.post('/architect/drawings', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  }

  /**
   * Create new revision for existing drawing
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async createRevision(drawingId: string, file: File, revision: Omit<DrawingRevision, 'id' | 'fileUrl' | 'fileSize'>): Promise<DrawingRevision> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('revision', JSON.stringify(revision));

    const response = await api.post(
      `/architect/drawings/${drawingId}/revisions`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data.data;
  }

  /**
   * Create drawing transmittal
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async createTransmittal(transmittal: Omit<DrawingTransmittal, 'id' | 'transmittalNumber' | 'sentDate'>): Promise<DrawingTransmittal> {
    const response = await api.post('/architect/transmittals', transmittal);
    return response.data.data;
  }

  /**
   * Get all transmittals for project
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async getTransmittals(projectId: string): Promise<DrawingTransmittal[]> {
    const response = await api.get('/architect/transmittals', {
      params: { projectId },
    });
    return response.data.data || [];
  }

  /**
   * Update drawing status
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async updateDrawingStatus(id: string, status: Drawing['status']): Promise<Drawing> {
    const response = await api.patch(`/architect/drawings/${id}/status`, { status });
    return response.data.data;
  }
}

export const drawingService = new DrawingService();
