// Document Management System Types
// Comprehensive type definitions for document storage and management

// =====================================================
// CORE DOCUMENT TYPES
// =====================================================

export interface DocumentCategory {
  id: string;
  code: string;
  name_en: string;
  name_ms: string;
  parent_id?: string;
  icon?: string;
  color?: string;
  description?: string;
  sort_order: number;
  is_system: boolean;
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

export interface Document {
  id: string;
  project_id?: string;
  category_id?: string;
  parent_document_id?: string;
  
  // Metadata
  title: string;
  description?: string;
  document_number?: string;
  document_type: DocumentType;
  file_format: FileFormat;
  
  // File Information
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type?: string;
  checksum?: string;
  
  // Drawing Specific
  drawing_type?: DrawingType;
  drawing_scale?: string;
  sheet_number?: string;
  total_sheets?: number;
  revision?: string;
  discipline?: DrawingDiscipline;
  
  // Status
  status: DocumentStatus;
  approval_status?: ApprovalStatus;
  approval_date?: Date;
  approved_by?: string;
  
  // Access Control
  visibility: DocumentVisibility;
  is_confidential: boolean;
  access_level: AccessLevel;
  password_protected: boolean;
  
  // Versioning
  version_number: string;
  is_latest_version: boolean;
  version_notes?: string;
  
  // Metadata
  tags: string[];
  custom_metadata?: Record<string, any>;
  ocr_text?: string;
  thumbnail_path?: string;
  preview_path?: string;
  
  // Compliance
  retention_period_months?: number;
  disposal_date?: Date;
  legal_hold: boolean;
  compliance_checked: boolean;
  compliance_notes?: string;
  
  // Timestamps
  created_at: Date;
  created_by: string;
  updated_at: Date;
  updated_by?: string;
  deleted_at?: Date;
  deleted_by?: string;
  
  // Computed/Related
  category?: DocumentCategory;
  versions?: DocumentVersion[];
  comments?: DocumentComment[];
  shares?: DocumentShare[];
  workflow?: DocumentWorkflow;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: string;
  
  // File Info
  file_name: string;
  file_path: string;
  file_size: number;
  checksum?: string;
  
  // Metadata
  change_summary?: string;
  change_type: 'major' | 'minor' | 'patch';
  revision_notes?: string;
  
  // Status
  status: 'active' | 'archived';
  is_major_version: boolean;
  
  // Timestamps
  created_at: Date;
  created_by: string;
}

export interface DocumentAccessLog {
  id: string;
  document_id: string;
  user_id: string;
  action: DocumentAction;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  access_granted: boolean;
  denial_reason?: string;
  accessed_at: Date;
}

export interface DocumentShare {
  id: string;
  document_id: string;
  shared_by: string;
  shared_with_email?: string;
  shared_with_user_id?: string;
  
  // Permissions
  permission_level: SharePermission;
  can_download: boolean;
  can_print: boolean;
  can_reshare: boolean;
  
  // Share Link
  share_token: string;
  share_link: string;
  password_protected: boolean;
  
  // Expiration
  expires_at?: Date;
  max_views?: number;
  current_views: number;
  
  // Status
  status: 'active' | 'expired' | 'revoked';
  revoked_at?: Date;
  revoked_by?: string;
  revoke_reason?: string;
  
  // Timestamps
  created_at: Date;
  last_accessed_at?: Date;
}

export interface DocumentComment {
  id: string;
  document_id: string;
  parent_comment_id?: string;
  user_id: string;
  
  // Content
  comment_text: string;
  comment_type: CommentType;
  
  // Annotations
  annotation_data?: AnnotationData;
  page_number?: number;
  x_coordinate?: number;
  y_coordinate?: number;
  
  // Status
  status: 'active' | 'deleted';
  is_resolved: boolean;
  resolved_by?: string;
  resolved_at?: Date;
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
  
  // Related
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
  replies?: DocumentComment[];
}

export interface DocumentTag {
  id: string;
  name: string;
  slug: string;
  category?: string;
  color?: string;
  description?: string;
  usage_count: number;
  created_at: Date;
}

export interface DocumentTemplate {
  id: string;
  category_id?: string;
  name: string;
  description?: string;
  template_type: TemplateType;
  
  // Template File
  file_path?: string;
  file_format?: string;
  
  // Variables
  variables?: Record<string, string>;
  sample_data?: Record<string, any>;
  
  // Usage
  usage_count: number;
  is_default: boolean;
  
  // Status
  status: 'active' | 'inactive';
  created_at: Date;
  created_by: string;
  updated_at: Date;
}

export interface DocumentWorkflow {
  id: string;
  document_id: string;
  workflow_type: WorkflowType;
  
  // Status
  status: WorkflowStatus;
  current_step: number;
  total_steps: number;
  
  // Data
  workflow_data?: Record<string, any>;
  
  // Timestamps
  started_at: Date;
  started_by: string;
  completed_at?: Date;
  completed_by?: string;
  due_date?: Date;
  
  // Related
  steps?: DocumentWorkflowStep[];
}

export interface DocumentWorkflowStep {
  id: string;
  workflow_id: string;
  step_number: number;
  step_type: StepType;
  
  // Assignment
  assigned_to?: string;
  assigned_role?: string;
  
  // Status
  status: StepStatus;
  action_taken?: 'approved' | 'rejected' | 'returned';
  comments?: string;
  
  // Timestamps
  assigned_at: Date;
  completed_at?: Date;
  due_date?: Date;
  reminder_sent_at?: Date;
  
  // Related
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
}

// =====================================================
// ENUMS AND CONSTANTS
// =====================================================

export type DocumentType = 
  | 'drawing'
  | 'specification'
  | 'report'
  | 'contract'
  | 'certificate'
  | 'correspondence'
  | 'photo'
  | 'calculation'
  | 'schedule'
  | 'other';

export type FileFormat = 
  | 'pdf'
  | 'dwg'
  | 'dxf'
  | 'rvt'
  | 'skp'
  | 'docx'
  | 'xlsx'
  | 'jpg'
  | 'png'
  | 'zip'
  | 'other';

export type DrawingType = 
  | 'architectural'
  | 'structural'
  | 'mechanical'
  | 'electrical'
  | 'plumbing'
  | 'site'
  | 'landscape'
  | 'detail'
  | 'section'
  | 'elevation'
  | 'plan';

export type DrawingDiscipline = 
  | 'A' // Architectural
  | 'C' // Civil
  | 'S' // Structural
  | 'M' // Mechanical
  | 'E' // Electrical
  | 'P' // Plumbing
  | 'L' // Landscape
  | 'I' // Interior
  | 'G' // General;

export type DocumentStatus = 
  | 'draft'
  | 'for_review'
  | 'approved'
  | 'superseded'
  | 'archived';

export type ApprovalStatus = 
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'conditional';

export type DocumentVisibility = 
  | 'public'
  | 'private'
  | 'team'
  | 'client';

export type AccessLevel = 
  | 'view'
  | 'comment'
  | 'edit'
  | 'admin';

export type DocumentAction = 
  | 'view'
  | 'download'
  | 'print'
  | 'edit'
  | 'delete'
  | 'share'
  | 'comment'
  | 'approve'
  | 'reject';

export type SharePermission = 
  | 'view'
  | 'comment'
  | 'edit';

export type CommentType = 
  | 'general'
  | 'technical'
  | 'approval'
  | 'revision';

export type TemplateType = 
  | 'contract'
  | 'report'
  | 'specification'
  | 'letter'
  | 'form';

export type WorkflowType = 
  | 'approval'
  | 'review'
  | 'distribution'
  | 'signature';

export type WorkflowStatus = 
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export type StepType = 
  | 'review'
  | 'approve'
  | 'sign'
  | 'notify';

export type StepStatus = 
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'skipped'
  | 'failed';

// =====================================================
// HELPER INTERFACES
// =====================================================

export interface AnnotationData {
  type: 'text' | 'arrow' | 'rectangle' | 'circle' | 'line' | 'highlight';
  coordinates: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  style?: {
    color?: string;
    strokeWidth?: number;
    fontSize?: number;
  };
  text?: string;
}

export interface DocumentFilter {
  project_id?: string;
  category_id?: string;
  document_type?: DocumentType;
  status?: DocumentStatus;
  tags?: string[];
  search?: string;
  created_after?: Date;
  created_before?: Date;
  page?: number;
  per_page?: number;
  sort_by?: 'created_at' | 'updated_at' | 'title' | 'size';
  sort_order?: 'asc' | 'desc';
}

export interface DocumentUploadData {
  file: File;
  title: string;
  document_type: DocumentType;
  category_id?: string;
  project_id?: string;
  description?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface DocumentStats {
  total_documents: number;
  total_size: number;
  documents_by_type: Record<DocumentType, number>;
  documents_by_status: Record<DocumentStatus, number>;
  recent_uploads: number;
  pending_approvals: number;
  shared_documents: number;
  average_document_size: number;
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

export const getDocumentTypeLabel = (type: DocumentType): string => {
  const labels: Record<DocumentType, string> = {
    drawing: 'Drawing',
    specification: 'Specification',
    report: 'Report',
    contract: 'Contract',
    certificate: 'Certificate',
    correspondence: 'Correspondence',
    photo: 'Photo',
    calculation: 'Calculation',
    schedule: 'Schedule',
    other: 'Other'
  };
  return labels[type] || type;
};

export const getFileFormatIcon = (format: FileFormat): string => {
  const icons: Record<FileFormat, string> = {
    pdf: 'file-pdf',
    dwg: 'file-cad',
    dxf: 'file-cad',
    rvt: 'file-3d',
    skp: 'file-3d',
    docx: 'file-word',
    xlsx: 'file-excel',
    jpg: 'file-image',
    png: 'file-image',
    zip: 'file-archive',
    other: 'file'
  };
  return icons[format] || 'file';
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const isImageFile = (format: FileFormat): boolean => {
  return ['jpg', 'png'].includes(format);
};

export const isCADFile = (format: FileFormat): boolean => {
  return ['dwg', 'dxf', 'rvt', 'skp'].includes(format);
};

export const canPreview = (format: FileFormat): boolean => {
  return ['pdf', 'jpg', 'png'].includes(format);
};