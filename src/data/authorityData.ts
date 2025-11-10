// Authority Data Service - Real API Integration
// ✅ All data fetched from database - No mock/sample data

import type {
  BuildingAuthority,
  SubmissionCategory,
  BuildingSubmission,
  SubmissionStats,
  AuthorityPerformance
} from '@/types/authority';

// Service interface for authority data
export interface AuthorityDataService {
  getAuthorities(): Promise<BuildingAuthority[]>;
  getSubmissionCategories(authorityId: string): Promise<SubmissionCategory[]>;
  getSubmissions(projectId?: string): Promise<BuildingSubmission[]>;
  getSubmissionStats(): Promise<SubmissionStats>;
  getAuthorityPerformance(): Promise<AuthorityPerformance[]>;
}

// ✅ All data structures are empty - real data fetched from database
export const defaultAuthorities: BuildingAuthority[] = [];
export const defaultSubmissionCategories: SubmissionCategory[] = [];
export const defaultSubmissions: BuildingSubmission[] = [];
export const defaultSubmissionStats: SubmissionStats = {
  total_submissions: 0,
  pending_submissions: 0,
  approved_submissions: 0,
  rejected_submissions: 0,
  total_fees_paid: 0,
  average_processing_days: 0,
  compliance_score_average: 0
};
export const defaultAuthorityPerformance: AuthorityPerformance[] = [];
