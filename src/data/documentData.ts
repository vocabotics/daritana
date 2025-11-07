// Document Data Service - Real API Integration
// This service fetches document data from the backend instead of using mock data

import type {
  Document,
  DocumentCategory,
  DocumentTag,
  DocumentTemplate,
  DocumentComment,
  DocumentShare,
  DocumentVersion
} from '@/types/document';

// Service interface for document data
export interface DocumentDataService {
  getCategories(): Promise<DocumentCategory[]>;
  getTags(): Promise<DocumentTag[]>;
  getTemplates(): Promise<DocumentTemplate[]>;
  getDocuments(projectId?: string): Promise<Document[]>;
  getDocumentById(id: string): Promise<Document | null>;
  getDocumentVersions(documentId: string): Promise<DocumentVersion[]>;
  getDocumentComments(documentId: string): Promise<DocumentComment[]>;
  getDocumentShares(documentId: string): Promise<DocumentShare[]>;
}

// Default empty structures for initial state
export const defaultCategories: DocumentCategory[] = [];
export const defaultTags: DocumentTag[] = [];
export const defaultTemplates: DocumentTemplate[] = [];
export const defaultDocuments: Document[] = [];

// Sample data for demo mode (minimal examples)
export const sampleCategories: DocumentCategory[] = [
  {
    id: 'demo-cat-1',
    code: 'DEMO',
    name_en: 'Demo Category',
    name_ms: 'Kategori Demo',
    icon: 'file',
    color: '#3B82F6',
    sort_order: 1,
    is_system: false,
    status: 'active',
    created_at: new Date(),
    updated_at: new Date()
  }
];

export const sampleTags: DocumentTag[] = [
  { 
    id: 'demo-tag-1', 
    name: 'Demo Tag', 
    slug: 'demo-tag', 
    category: 'demo', 
    color: '#EF4444', 
    usage_count: 1, 
    created_at: new Date() 
  }
];

export const sampleTemplates: DocumentTemplate[] = [
  {
    id: 'demo-template-1',
    name: 'Demo Template',
    description: 'A demonstration document template',
    category_id: 'demo-cat-1',
    file_path: '/templates/demo-template.docx',
    file_size: 1024,
    is_system: false,
    status: 'active',
    created_at: new Date(),
    updated_at: new Date()
  }
];

export const sampleDocuments: Document[] = [
  {
    id: 'demo-doc-1',
    title: 'Demo Document',
    description: 'A demonstration document',
    filename: 'demo-document.pdf',
    file_path: '/documents/demo-document.pdf',
    file_size: 2048,
    mime_type: 'application/pdf',
    category_id: 'demo-cat-1',
    project_id: 'demo-project-1',
    uploaded_by: 'demo-user',
    status: 'active',
    is_public: false,
    download_count: 0,
    created_at: new Date(),
    updated_at: new Date()
  }
];

// Export empty arrays for real API integration
export const mockCategories = defaultCategories;
export const mockTags = defaultTags;
export const mockTemplates = defaultTemplates;
export const mockDocuments = defaultDocuments;