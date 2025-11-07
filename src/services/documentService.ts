// Document Management Service
// Handles all document operations including upload, versioning, and sharing

import type {
  Document,
  DocumentVersion,
  DocumentComment,
  DocumentShare,
  DocumentWorkflow,
  DocumentFilter,
  DocumentUploadData,
  DocumentStats,
  DocumentCategory,
  DocumentTag,
  DocumentTemplate
} from '@/types/document';

class DocumentManagementService {
  private baseUrl = import.meta.env.VITE_API_URL || '/api';
  private uploadUrl = import.meta.env.VITE_UPLOAD_URL || '/uploads';

  // =====================================================
  // DOCUMENT OPERATIONS
  // =====================================================

  /**
   * Upload a new document
   */
  async uploadDocument(data: DocumentUploadData): Promise<{ success: boolean; data?: Document; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('title', data.title);
      formData.append('document_type', data.document_type);
      
      if (data.category_id) formData.append('category_id', data.category_id);
      if (data.project_id) formData.append('project_id', data.project_id);
      if (data.description) formData.append('description', data.description);
      if (data.tags) formData.append('tags', JSON.stringify(data.tags));
      if (data.metadata) formData.append('metadata', JSON.stringify(data.metadata));

      const response = await fetch(`${this.baseUrl}/documents/upload`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      return {
        success: true,
        data: result.document
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Get documents with filtering
   */
  async getDocuments(filter: DocumentFilter = {}): Promise<{ 
    success: boolean; 
    data?: { 
      documents: Document[]; 
      total: number; 
      page: number; 
      per_page: number; 
    }; 
    error?: string 
  }> {
    try {
      const params = new URLSearchParams();
      
      if (filter.project_id) params.append('project_id', filter.project_id);
      if (filter.category_id) params.append('category_id', filter.category_id);
      if (filter.document_type) params.append('document_type', filter.document_type);
      if (filter.status) params.append('status', filter.status);
      if (filter.tags?.length) params.append('tags', filter.tags.join(','));
      if (filter.search) params.append('search', filter.search);
      if (filter.page) params.append('page', filter.page.toString());
      if (filter.per_page) params.append('per_page', filter.per_page.toString());
      if (filter.sort_by) params.append('sort_by', filter.sort_by);
      if (filter.sort_order) params.append('sort_order', filter.sort_order);

      const response = await fetch(`${this.baseUrl}/documents?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch documents');
      }

      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch documents'
      };
    }
  }

  /**
   * Get document by ID
   */
  async getDocument(id: string): Promise<{ success: boolean; data?: Document; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/documents/${id}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Document not found');
      }

      return {
        success: true,
        data: result.document
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch document'
      };
    }
  }

  /**
   * Update document metadata
   */
  async updateDocument(id: string, updates: Partial<Document>): Promise<{ success: boolean; data?: Document; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/documents/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Update failed');
      }

      return {
        success: true,
        data: result.document
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Update failed'
      };
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/documents/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Delete failed');
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed'
      };
    }
  }

  /**
   * Download document
   */
  async downloadDocument(id: string): Promise<{ success: boolean; data?: Blob; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/documents/${id}/download`);

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      return {
        success: true,
        data: blob
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Download failed'
      };
    }
  }

  // =====================================================
  // VERSION MANAGEMENT
  // =====================================================

  /**
   * Upload new version
   */
  async uploadVersion(documentId: string, file: File, notes?: string): Promise<{ success: boolean; data?: DocumentVersion; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (notes) formData.append('notes', notes);

      const response = await fetch(`${this.baseUrl}/documents/${documentId}/versions`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Version upload failed');
      }

      return {
        success: true,
        data: result.version
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Version upload failed'
      };
    }
  }

  /**
   * Get document versions
   */
  async getVersions(documentId: string): Promise<{ success: boolean; data?: DocumentVersion[]; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/documents/${documentId}/versions`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch versions');
      }

      return {
        success: true,
        data: result.versions
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch versions'
      };
    }
  }

  /**
   * Restore version
   */
  async restoreVersion(documentId: string, versionId: string): Promise<{ success: boolean; data?: Document; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/documents/${documentId}/versions/${versionId}/restore`, {
        method: 'POST'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Restore failed');
      }

      return {
        success: true,
        data: result.document
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Restore failed'
      };
    }
  }

  // =====================================================
  // SHARING
  // =====================================================

  /**
   * Share document
   */
  async shareDocument(documentId: string, shareData: {
    email?: string;
    user_id?: string;
    permission_level: 'view' | 'comment' | 'edit';
    expires_at?: Date;
    password?: string;
  }): Promise<{ success: boolean; data?: DocumentShare; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/documents/${documentId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(shareData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Share failed');
      }

      return {
        success: true,
        data: result.share
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Share failed'
      };
    }
  }

  /**
   * Get document shares
   */
  async getShares(documentId: string): Promise<{ success: boolean; data?: DocumentShare[]; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/documents/${documentId}/shares`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch shares');
      }

      return {
        success: true,
        data: result.shares
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch shares'
      };
    }
  }

  /**
   * Revoke share
   */
  async revokeShare(shareId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/shares/${shareId}/revoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Revoke failed');
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Revoke failed'
      };
    }
  }

  // =====================================================
  // COMMENTS
  // =====================================================

  /**
   * Add comment
   */
  async addComment(documentId: string, commentData: {
    text: string;
    type?: 'general' | 'technical' | 'approval' | 'revision';
    page_number?: number;
    annotation_data?: any;
  }): Promise<{ success: boolean; data?: DocumentComment; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/documents/${documentId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(commentData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Comment failed');
      }

      return {
        success: true,
        data: result.comment
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Comment failed'
      };
    }
  }

  /**
   * Get comments
   */
  async getComments(documentId: string): Promise<{ success: boolean; data?: DocumentComment[]; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/documents/${documentId}/comments`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch comments');
      }

      return {
        success: true,
        data: result.comments
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch comments'
      };
    }
  }

  /**
   * Resolve comment
   */
  async resolveComment(commentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/comments/${commentId}/resolve`, {
        method: 'POST'
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Resolve failed');
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Resolve failed'
      };
    }
  }

  // =====================================================
  // WORKFLOWS
  // =====================================================

  /**
   * Start workflow
   */
  async startWorkflow(documentId: string, workflowType: 'approval' | 'review' | 'distribution', data?: any): Promise<{ success: boolean; data?: DocumentWorkflow; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/documents/${documentId}/workflows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workflow_type: workflowType,
          data
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Workflow failed');
      }

      return {
        success: true,
        data: result.workflow
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Workflow failed'
      };
    }
  }

  /**
   * Get workflow status
   */
  async getWorkflow(workflowId: string): Promise<{ success: boolean; data?: DocumentWorkflow; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/workflows/${workflowId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch workflow');
      }

      return {
        success: true,
        data: result.workflow
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch workflow'
      };
    }
  }

  /**
   * Complete workflow step
   */
  async completeWorkflowStep(stepId: string, action: 'approved' | 'rejected' | 'returned', comments?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/workflow-steps/${stepId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          comments
        })
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Step completion failed');
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Step completion failed'
      };
    }
  }

  // =====================================================
  // CATEGORIES & TAGS
  // =====================================================

  /**
   * Get categories
   */
  async getCategories(): Promise<{ success: boolean; data?: DocumentCategory[]; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/document-categories`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch categories');
      }

      return {
        success: true,
        data: result.categories
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch categories'
      };
    }
  }

  /**
   * Get tags
   */
  async getTags(): Promise<{ success: boolean; data?: DocumentTag[]; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/document-tags`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch tags');
      }

      return {
        success: true,
        data: result.tags
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch tags'
      };
    }
  }

  /**
   * Create tag
   */
  async createTag(name: string, category?: string, color?: string): Promise<{ success: boolean; data?: DocumentTag; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/document-tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          category,
          color
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Tag creation failed');
      }

      return {
        success: true,
        data: result.tag
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Tag creation failed'
      };
    }
  }

  // =====================================================
  // TEMPLATES
  // =====================================================

  /**
   * Get templates
   */
  async getTemplates(category?: string): Promise<{ success: boolean; data?: DocumentTemplate[]; error?: string }> {
    try {
      const params = category ? `?category=${category}` : '';
      const response = await fetch(`${this.baseUrl}/document-templates${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch templates');
      }

      return {
        success: true,
        data: result.templates
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch templates'
      };
    }
  }

  /**
   * Create document from template
   */
  async createFromTemplate(templateId: string, data: Record<string, any>): Promise<{ success: boolean; data?: Document; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/templates/${templateId}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Template creation failed');
      }

      return {
        success: true,
        data: result.document
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Template creation failed'
      };
    }
  }

  // =====================================================
  // STATISTICS
  // =====================================================

  /**
   * Get document statistics
   */
  async getStats(projectId?: string): Promise<{ success: boolean; data?: DocumentStats; error?: string }> {
    try {
      const params = projectId ? `?project_id=${projectId}` : '';
      const response = await fetch(`${this.baseUrl}/documents/stats${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch stats');
      }

      return {
        success: true,
        data: result.stats
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch stats'
      };
    }
  }

  // =====================================================
  // SEARCH
  // =====================================================

  /**
   * Search documents
   */
  async searchDocuments(query: string, filters?: DocumentFilter): Promise<{ 
    success: boolean; 
    data?: { 
      documents: Document[]; 
      total: number; 
    }; 
    error?: string 
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/documents/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query,
          ...filters
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Search failed');
      }

      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed'
      };
    }
  }

  // =====================================================
  // UTILITIES
  // =====================================================

  /**
   * Generate document preview
   */
  async generatePreview(documentId: string): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/documents/${documentId}/preview`, {
        method: 'POST'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Preview generation failed');
      }

      return {
        success: true,
        data: result.preview_url
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Preview generation failed'
      };
    }
  }

  /**
   * Extract text from document (OCR)
   */
  async extractText(documentId: string): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/documents/${documentId}/extract-text`, {
        method: 'POST'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Text extraction failed');
      }

      return {
        success: true,
        data: result.text
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Text extraction failed'
      };
    }
  }

  /**
   * Validate document
   */
  async validateDocument(documentId: string): Promise<{ 
    success: boolean; 
    data?: { 
      valid: boolean; 
      issues: string[]; 
    }; 
    error?: string 
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/documents/${documentId}/validate`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Validation failed');
      }

      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Validation failed'
      };
    }
  }
}

// Export singleton instance
export const documentService = new DocumentManagementService();
export default documentService;