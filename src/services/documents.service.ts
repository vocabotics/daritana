import axios from 'axios';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5004/api';

// SECURITY: Create axios instance with HTTP-Only cookie authentication
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send HTTP-Only cookies with all requests
  headers: {
    'Content-Type': 'application/json'
  }
});

// No manual Authorization headers needed - cookies sent automatically

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  mimeType: string;
  path: string;
  url: string;
  category?: string;
  projectId?: string;
  status: 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
  uploadedBy: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  uploadedById: string;
  createdAt: string;
  updatedAt: string;
  versions?: DocumentVersion[];
  _count?: {
    versions: number;
    documentComments: number;
  };
  reviews?: DocumentReview[];
  annotations?: DocumentAnnotation[];
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: string;
  branch?: string;
  authorId: string;
  author?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
  message: string;
  description?: string;
  changes: any;
  createdAt: string;
  approvals?: any[];
  changeRequests?: any[];
}

export interface DocumentReview {
  id: string;
  documentId: string;
  creator: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  _count: {
    participants: number;
    messages: number;
  };
}

export interface DocumentAnnotation {
  id: string;
  documentId: string;
  content: string;
  resolved: boolean;
  uploadedBy: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  replies: any[];
}

export interface DocumentFilters {
  status?: string;
  category?: string;
  projectId?: string;
}

export interface UploadDocumentData {
  name: string;
  category?: string;
  projectId?: string;
  file: File;
}

export interface UpdateDocumentData {
  name?: string;
  status?: 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
  category?: string;
}

export interface CreateVersionData {
  version: string;
  branch?: string;
  message: string;
  description?: string;
  file?: File;
}

export interface ShareDocumentData {
  userIds?: string[];
  emails?: string[];
  permissions: 'view' | 'edit' | 'admin';
  message?: string;
}

class DocumentsService {
  private apiUrl = `${API_URL}/documents`;

  // Get all documents with optional filters
  async getDocuments(filters?: DocumentFilters): Promise<Document[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.projectId) params.append('projectId', filters.projectId);

      // SECURITY: Cookies sent automatically with withCredentials
      const response = await api.get(`/documents?${params.toString()}`);

      return response.data.documents || [];
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      toast.error(error.response?.data?.error || 'Failed to fetch documents');
      throw error;
    }
  }

  // Get single document by ID
  async getDocument(id: string): Promise<Document> {
    try {
      const response = await api.get(`${this.apiUrl}/${id}`, {
      });

      return response.data;
    } catch (error: any) {
      console.error('Error fetching document:', error);
      toast.error(error.response?.data?.error || 'Failed to fetch document');
      throw error;
    }
  }

  // Upload new document
  async uploadDocument(data: UploadDocumentData): Promise<Document> {
    try {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('name', data.name);
      if (data.category) formData.append('category', data.category);
      if (data.projectId) formData.append('projectId', data.projectId);

      // SECURITY: Cookies sent automatically with withCredentials
      // Content-Type automatically set to multipart/form-data for FormData
      const response = await api.post(this.apiUrl, formData);

      toast.success('Document uploaded successfully');
      return response.data;
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast.error(error.response?.data?.error || 'Failed to upload document');
      throw error;
    }
  }

  // Update document
  async updateDocument(id: string, data: UpdateDocumentData): Promise<Document> {
    try {
      const response = await api.patch(`${this.apiUrl}/${id}`, data, {
      });

      toast.success('Document updated successfully');
      return response.data;
    } catch (error: any) {
      console.error('Error updating document:', error);
      toast.error(error.response?.data?.error || 'Failed to update document');
      throw error;
    }
  }

  // Delete document
  async deleteDocument(id: string): Promise<void> {
    try {
      await api.delete(`${this.apiUrl}/${id}`, {
      });

      toast.success('Document deleted successfully');
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast.error(error.response?.data?.error || 'Failed to delete document');
      throw error;
    }
  }

  // Create new version
  async createVersion(documentId: string, data: CreateVersionData): Promise<DocumentVersion> {
    try {
      const formData = new FormData();
      formData.append('version', data.version);
      formData.append('message', data.message);
      if (data.branch) formData.append('branch', data.branch);
      if (data.description) formData.append('description', data.description);
      if (data.file) formData.append('file', data.file);

      // SECURITY: Cookies sent automatically with withCredentials
      const response = await api.post(`${this.apiUrl}/${documentId}/versions`, formData);

      toast.success('New version created successfully');
      return response.data;
    } catch (error: any) {
      console.error('Error creating version:', error);
      toast.error(error.response?.data?.error || 'Failed to create version');
      throw error;
    }
  }

  // Get document versions
  async getVersions(documentId: string): Promise<DocumentVersion[]> {
    try {
      const response = await api.get(`${this.apiUrl}/${documentId}/versions`, {
      });

      return response.data.versions || [];
    } catch (error: any) {
      console.error('Error fetching versions:', error);
      toast.error(error.response?.data?.error || 'Failed to fetch versions');
      throw error;
    }
  }

  // Share document
  async shareDocument(documentId: string, data: ShareDocumentData): Promise<void> {
    try {
      await api.post(`${this.apiUrl}/${documentId}/share`, data, {
      });

      toast.success('Document shared successfully');
    } catch (error: any) {
      console.error('Error sharing document:', error);
      toast.error(error.response?.data?.error || 'Failed to share document');
      throw error;
    }
  }

  // Download document
  async downloadDocument(documentId: string): Promise<void> {
    try {
      const response = await api.get(`${this.apiUrl}/${documentId}/download`, {
        responseType: 'blob'
      });

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'document';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) filename = filenameMatch[1];
      }

      // Create blob URL and download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Document downloaded successfully');
    } catch (error: any) {
      console.error('Error downloading document:', error);
      toast.error(error.response?.data?.error || 'Failed to download document');
      throw error;
    }
  }

  // Get document preview URL
  getPreviewUrl(document: Document): string {
    // If the document has a direct URL, use it
    if (document.url && document.url.startsWith('http')) {
      return document.url;
    }
    
    // Otherwise, construct the preview URL
    return `${API_URL}${document.url}`;
  }

  // Request document approval
  async requestApproval(documentId: string, reviewers: string[], message?: string): Promise<void> {
    try {
      await api.post(`${this.apiUrl}/${documentId}/request-approval`, {
        reviewers,
        message
      }, {
      });

      toast.success('Approval request sent successfully');
    } catch (error: any) {
      console.error('Error requesting approval:', error);
      toast.error(error.response?.data?.error || 'Failed to request approval');
      throw error;
    }
  }

  // Approve or reject document
  async reviewDocument(documentId: string, action: 'approve' | 'reject', comments?: string): Promise<void> {
    try {
      await api.post(`${this.apiUrl}/${documentId}/review`, {
        action,
        comments
      }, {
      });

      toast.success(`Document ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
    } catch (error: any) {
      console.error('Error reviewing document:', error);
      toast.error(error.response?.data?.error || 'Failed to review document');
      throw error;
    }
  }

  // Add annotation to document
  async addAnnotation(documentId: string, content: string, position?: { x: number; y: number; page?: number }): Promise<void> {
    try {
      await api.post(`${this.apiUrl}/${documentId}/annotations`, {
        content,
        position
      }, {
      });

      toast.success('Annotation added successfully');
    } catch (error: any) {
      console.error('Error adding annotation:', error);
      toast.error(error.response?.data?.error || 'Failed to add annotation');
      throw error;
    }
  }

  // Resolve annotation
  async resolveAnnotation(documentId: string, annotationId: string): Promise<void> {
    try {
      await api.patch(`${this.apiUrl}/${documentId}/annotations/${annotationId}/resolve`, {}, {
      });

      toast.success('Annotation resolved');
    } catch (error: any) {
      console.error('Error resolving annotation:', error);
      toast.error(error.response?.data?.error || 'Failed to resolve annotation');
      throw error;
    }
  }

  // Get document statistics
  async getStatistics(projectId?: string): Promise<{
    total: number;
    draft: number;
    inReview: number;
    approved: number;
    rejected: number;
    archived: number;
    totalSize: number;
  }> {
    try {
      const params = projectId ? `?projectId=${projectId}` : '';
      const response = await api.get(`${this.apiUrl}/statistics${params}`, {
      });

      return response.data;
    } catch (error: any) {
      console.error('Error fetching statistics:', error);
      // Return default values if error
      return {
        total: 0,
        draft: 0,
        inReview: 0,
        approved: 0,
        rejected: 0,
        archived: 0,
        totalSize: 0
      };
    }
  }

  // Get document categories
  async getCategories(): Promise<Array<{ id: string; name: string; code: string; }>> {
    try {
      const response = await api.get(`${this.apiUrl}/categories`, {
      });

      return response.data.categories || [];
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      // Return default categories if error
      return [
        { id: 'cat-arch', name: 'Architectural', code: 'ARCH' },
        { id: 'cat-struct', name: 'Structural', code: 'STRUCT' },
        { id: 'cat-mep', name: 'MEP', code: 'MEP' },
        { id: 'cat-site', name: 'Site Plans', code: 'SITE' },
        { id: 'cat-spec', name: 'Specifications', code: 'SPEC' }
      ];
    }
  }
}

export const documentsService = new DocumentsService();