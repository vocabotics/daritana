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

// ✅ All data structures are empty - real data fetched from database
export const defaultCategories: DocumentCategory[] = [];
export const defaultTags: DocumentTag[] = [];
export const defaultTemplates: DocumentTemplate[] = [];
export const defaultDocuments: Document[] = [];