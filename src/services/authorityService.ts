// Authority Submission Service
// Service layer for Malaysian building authority integration

import type {
  BuildingAuthority,
  SubmissionCategory,
  BuildingSubmission,
  SubmissionFormData,
  SubmissionResponse,
  SubmissionListResponse,
  AuthorityListResponse,
  FeeCalculationResponse,
  SubmissionDocument,
  DocumentUploadData,
  SubmissionFee,
  AuthorityApiLog,
  SubmissionStats,
  SubmissionStatus
} from '@/types/authority';

// Import data service for real API integration
import {
  defaultAuthorities,
  defaultSubmissionCategories,
  defaultSubmissions,
  defaultSubmissionStats,
  getCategoriesByAuthority,
  getSubmissionsByProject,
  getActiveSubmissions,
  getCompletedSubmissions
} from '@/data/authorityData';

class AuthoritySubmissionService {
  private baseUrl = import.meta.env.VITE_API_URL || '/api';

  // =============================================
  // AUTHORITY MANAGEMENT
  // =============================================

  /**
   * Get all building authorities
   */
  async getAuthorities(): Promise<AuthorityListResponse> {
    // Using mock data for development
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return {
        success: true,
        data: defaultAuthorities
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get authority by ID
   */
  async getAuthority(id: string): Promise<{ success: boolean; data?: BuildingAuthority; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/authorities/${id}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch authority');
      }
      
      return {
        success: true,
        data: data.authority
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get submission categories for an authority
   */
  async getSubmissionCategories(authorityId: string): Promise<{ success: boolean; data?: SubmissionCategory[]; error?: string }> {
    // Using mock data for development
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const categories = getCategoriesByAuthority(authorityId);
      
      return {
        success: true,
        data: categories
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // =============================================
  // SUBMISSION MANAGEMENT
  // =============================================

  /**
   * Create new submission
   */
  async createSubmission(formData: SubmissionFormData): Promise<SubmissionResponse> {
    try {
      // Generate internal reference
      const internalRef = this.generateInternalReference(formData.authority_id, formData.category_id);
      
      const response = await fetch(`${this.baseUrl}/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          internal_reference: internalRef,
          status: 'draft'
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to create submission',
          validation_errors: data.validation_errors
        };
      }
      
      return {
        success: true,
        data: data.submission
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get all submissions with filtering and pagination
   */
  async getSubmissions(params: {
    page?: number;
    per_page?: number;
    project_id?: string;
    authority_id?: string;
    status?: SubmissionStatus;
    search?: string;
  } = {}): Promise<SubmissionListResponse> {
    // Using mock data for development
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      
      let filteredSubmissions = [...defaultSubmissions];
      
      // Apply filters
      if (params.project_id) {
        filteredSubmissions = filteredSubmissions.filter(sub => sub.project_id === params.project_id);
      }
      
      if (params.authority_id) {
        filteredSubmissions = filteredSubmissions.filter(sub => sub.authority_id === params.authority_id);
      }
      
      if (params.status) {
        filteredSubmissions = filteredSubmissions.filter(sub => sub.status === params.status);
      }
      
      if (params.search) {
        const searchLower = params.search.toLowerCase();
        filteredSubmissions = filteredSubmissions.filter(sub => 
          sub.internal_reference.toLowerCase().includes(searchLower) ||
          sub.project?.name.toLowerCase().includes(searchLower) ||
          sub.submission_number?.toLowerCase().includes(searchLower)
        );
      }
      
      // Add authority and category info
      const enrichedSubmissions = filteredSubmissions.map(submission => ({
        ...submission,
        authority: defaultAuthorities.find(auth => auth.id === submission.authority_id),
        category: defaultSubmissionCategories.find(cat => cat.id === submission.category_id)
      }));
      
      // Pagination
      const page = params.page || 1;
      const per_page = params.per_page || 20;
      const start = (page - 1) * per_page;
      const end = start + per_page;
      const paginatedSubmissions = enrichedSubmissions.slice(start, end);
      
      return {
        success: true,
        data: {
          submissions: paginatedSubmissions,
          total: filteredSubmissions.length,
          page,
          per_page,
          total_pages: Math.ceil(filteredSubmissions.length / per_page)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get submission by ID
   */
  async getSubmission(id: string): Promise<SubmissionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/submissions/${id}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch submission');
      }
      
      return {
        success: true,
        data: data.submission
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update submission
   */
  async updateSubmission(id: string, updates: Partial<BuildingSubmission>): Promise<SubmissionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/submissions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to update submission',
          validation_errors: data.validation_errors
        };
      }
      
      return {
        success: true,
        data: data.submission
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Submit to authority (change status from draft to submitted)
   */
  async submitToAuthority(id: string): Promise<SubmissionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/submissions/${id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to submit to authority'
        };
      }
      
      return {
        success: true,
        data: data.submission
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update submission status
   */
  async updateSubmissionStatus(
    id: string, 
    status: SubmissionStatus, 
    comments?: string
  ): Promise<SubmissionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/submissions/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          comments
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to update submission status'
        };
      }
      
      return {
        success: true,
        data: data.submission
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // =============================================
  // DOCUMENT MANAGEMENT
  // =============================================

  /**
   * Upload document to submission
   */
  async uploadDocument(submissionId: string, documentData: DocumentUploadData): Promise<{ success: boolean; data?: SubmissionDocument; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('file', documentData.file);
      formData.append('document_type', documentData.document_type);
      formData.append('title', documentData.title);
      formData.append('revision', documentData.revision);
      
      if (documentData.description) formData.append('description', documentData.description);
      if (documentData.drawing_number) formData.append('drawing_number', documentData.drawing_number);
      if (documentData.scale) formData.append('scale', documentData.scale);
      if (documentData.sheet_number) formData.append('sheet_number', documentData.sheet_number);
      if (documentData.total_sheets) formData.append('total_sheets', documentData.total_sheets.toString());
      
      const response = await fetch(`${this.baseUrl}/submissions/${submissionId}/documents`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload document');
      }
      
      return {
        success: true,
        data: data.document
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get documents for submission
   */
  async getSubmissionDocuments(submissionId: string): Promise<{ success: boolean; data?: SubmissionDocument[]; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/submissions/${submissionId}/documents`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch documents');
      }
      
      return {
        success: true,
        data: data.documents
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/documents/${documentId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete document');
      }
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // =============================================
  // FEE MANAGEMENT
  // =============================================

  /**
   * Calculate fees for submission
   */
  async calculateFees(submissionData: Partial<BuildingSubmission>): Promise<FeeCalculationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/submissions/calculate-fees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to calculate fees');
      }
      
      return {
        success: true,
        data: {
          fees: data.fees,
          total_amount: data.total_amount,
          breakdown: data.breakdown
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get fees for submission
   */
  async getSubmissionFees(submissionId: string): Promise<{ success: boolean; data?: SubmissionFee[]; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/submissions/${submissionId}/fees`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch fees');
      }
      
      return {
        success: true,
        data: data.fees
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // =============================================
  // COMPLIANCE & VALIDATION
  // =============================================

  /**
   * Run compliance check on submission
   */
  async runComplianceCheck(submissionId: string): Promise<{ success: boolean; data?: { score: number; issues: any[] }; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/submissions/${submissionId}/compliance-check`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to run compliance check');
      }
      
      return {
        success: true,
        data: {
          score: data.score,
          issues: data.issues
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validate submission before submission
   */
  async validateSubmission(submissionId: string): Promise<{ success: boolean; data?: { valid: boolean; errors: string[] }; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/submissions/${submissionId}/validate`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to validate submission');
      }
      
      return {
        success: true,
        data: {
          valid: data.valid,
          errors: data.errors || []
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // =============================================
  // ANALYTICS & REPORTING
  // =============================================

  /**
   * Get submission statistics
   */
  async getSubmissionStats(params: {
    start_date?: string;
    end_date?: string;
    authority_id?: string;
    project_id?: string;
  } = {}): Promise<{ success: boolean; data?: SubmissionStats; error?: string }> {
    // Using mock data for development
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // For now, return default stats - could be filtered based on params
      let stats = { ...defaultSubmissionStats };
      
      // Apply basic filtering if project_id is provided
      if (params.project_id) {
        const projectSubmissions = defaultSubmissions.filter(sub => sub.project_id === params.project_id);
        stats = {
          total_submissions: projectSubmissions.length,
          pending_submissions: projectSubmissions.filter(sub => !['approved', 'rejected', 'expired', 'withdrawn'].includes(sub.status)).length,
          approved_submissions: projectSubmissions.filter(sub => sub.status === 'approved').length,
          rejected_submissions: projectSubmissions.filter(sub => sub.status === 'rejected').length,
          total_fees_paid: projectSubmissions.reduce((sum, sub) => sum + (sub.payment_status === 'paid' ? sub.total_fees : 0), 0),
          average_processing_days: 21,
          compliance_score_average: 88
        };
      }
      
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate submission report
   */
  async generateReport(submissionId: string, format: 'pdf' | 'excel'): Promise<{ success: boolean; data?: { download_url: string }; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/submissions/${submissionId}/report?format=${format}`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate report');
      }
      
      return {
        success: true,
        data: {
          download_url: data.download_url
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // =============================================
  // AUTHORITY API INTEGRATION
  // =============================================

  /**
   * Sync submission status with authority
   */
  async syncWithAuthority(submissionId: string): Promise<SubmissionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/submissions/${submissionId}/sync`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync with authority');
      }
      
      return {
        success: true,
        data: data.submission
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get API logs for debugging
   */
  async getApiLogs(submissionId: string): Promise<{ success: boolean; data?: AuthorityApiLog[]; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/submissions/${submissionId}/api-logs`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch API logs');
      }
      
      return {
        success: true,
        data: data.logs
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  /**
   * Generate internal reference number
   */
  private generateInternalReference(authorityId: string, categoryId: string): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `DAR-${timestamp}-${random}`;
  }

  /**
   * Format Malaysian phone number
   */
  formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Handle Malaysian phone numbers
    if (cleaned.startsWith('6')) {
      // International format
      return `+${cleaned}`;
    } else if (cleaned.startsWith('0')) {
      // Local format, convert to international
      return `+6${cleaned.substring(1)}`;
    } else {
      // Assume it's already in the correct format
      return `+60${cleaned}`;
    }
  }

  /**
   * Format currency in MYR
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Calculate business days between dates
   */
  calculateBusinessDays(startDate: Date, endDate: Date): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let businessDays = 0;
    
    while (start <= end) {
      const dayOfWeek = start.getDay();
      // Monday = 1, Friday = 5
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        businessDays++;
      }
      start.setDate(start.getDate() + 1);
    }
    
    return businessDays;
  }

  /**
   * Get expected completion date based on processing days
   */
  getExpectedCompletionDate(submissionDate: Date, processingDays: number): Date {
    const result = new Date(submissionDate);
    let daysAdded = 0;
    
    while (daysAdded < processingDays) {
      result.setDate(result.getDate() + 1);
      const dayOfWeek = result.getDay();
      // Skip weekends
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        daysAdded++;
      }
    }
    
    return result;
  }

  /**
   * Check if submission is overdue
   */
  isSubmissionOverdue(submission: BuildingSubmission): boolean {
    if (!submission.submission_date || !submission.category?.typical_processing_days) {
      return false;
    }
    
    const expectedDate = this.getExpectedCompletionDate(
      new Date(submission.submission_date),
      submission.category.typical_processing_days
    );
    
    return new Date() > expectedDate && !['approved', 'rejected', 'withdrawn'].includes(submission.status);
  }
}

// Export singleton instance
export const authorityService = new AuthoritySubmissionService();
export default authorityService;