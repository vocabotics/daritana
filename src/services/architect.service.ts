/**
 * ARCHITECT FEATURES SERVICE
 * Frontend service for all 12 Malaysian architect practice management features
 *
 * SECURITY: Uses lib/api.ts for HTTP-Only cookie authentication
 * All requests automatically include credentials (withCredentials: true)
 */

import { api } from '@/lib/api';

const BASE_URL = '/architect';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface AuthoritySubmission {
  id: string;
  submissionNo: string;
  authority: string; // DBKL, MBPJ, MBSA, MPS, MPAJ, MPSJ, etc.
  submissionType: 'BUILDING_PLAN' | 'LAYOUT_PLAN' | 'STRUCTURAL_PLAN' | 'MEP_PLAN' | 'CCC_APPLICATION' | 'AMENDMENT' | 'ADDITION_ALTERATION' | 'DEMOLITION' | 'SUBDIVISION' | 'AMALGAMATION' | 'CONVERSION' | 'OTHER';
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'QUERY' | 'APPROVED' | 'APPROVED_WITH_CONDITIONS' | 'REJECTED' | 'WITHDRAWN';
  submittedDate: string;
  approvedDate?: string;
  approvedBy?: string;
  conditions?: string[];
  projectId: string;
  organizationId: string;
}

export interface CCCApplication {
  id: string;
  applicationNo: string;
  localAuthority: string;
  status: 'DRAFT' | 'SUBMITTED' | 'INSPECTION_SCHEDULED' | 'INSPECTION_COMPLETED' | 'DEFECTS_FOUND' | 'RECTIFICATION_REQUIRED' | 'APPROVED' | 'REJECTED';
  applicationDate: string;
  inspectionDate?: string;
  approvalDate?: string;
  defectsFound?: any[];
  consultantName: string;
  consultantRegNo: string; // LAM or BEM registration number
  projectId: string;
  organizationId: string;
}

export interface ChangeOrder {
  id: string;
  changeOrderNo: string;
  title: string;
  description: string;
  category: 'CLIENT_VARIATION' | 'DESIGN_CHANGE' | 'SITE_CONDITION' | 'MATERIAL_CHANGE' | 'COST_SAVING' | 'REGULATORY' | 'ERROR_CORRECTION' | 'OTHER';
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'IMPLEMENTED' | 'CANCELLED';
  requestDate: string;
  approvalDate?: string;
  costImpact: number;
  timeImpact?: number; // in days
  projectId: string;
  organizationId: string;
}

export interface DLPRecord {
  id: string;
  dlpNo: string;
  startDate: string;
  endDate: string;
  durationMonths: number;
  status: 'ACTIVE' | 'COMPLETED' | 'EXTENDED';
  defectsReported: number;
  defectsRectified: number;
  extensionGranted?: number; // days
  projectId: string;
  organizationId: string;
}

export interface Drawing {
  id: string;
  drawingNo: string;
  title: string;
  revision: string;
  drawingType: 'ARCHITECTURAL' | 'STRUCTURAL' | 'MECHANICAL' | 'ELECTRICAL' | 'PLUMBING' | 'LANDSCAPE' | 'CIVIL' | 'SITE_PLAN' | 'DETAIL' | 'SECTION' | 'ELEVATION' | 'OTHER';
  status: 'DRAFT' | 'IN_PROGRESS' | 'FOR_REVIEW' | 'APPROVED' | 'ISSUED_FOR_CONSTRUCTION' | 'AS_BUILT' | 'SUPERSEDED';
  scale?: string;
  preparedDate: string;
  fileUrl?: string;
  projectId: string;
  organizationId: string;
}

export interface MeetingMinute {
  id: string;
  minuteNo: string;
  meetingType: 'SITE_MEETING' | 'CLIENT_MEETING' | 'CONSULTANT_MEETING' | 'PROGRESS_MEETING' | 'COORDINATION_MEETING' | 'TECHNICAL_MEETING' | 'OTHER';
  meetingDate: string;
  venue: string;
  attendees: string[];
  discussionPoints: any[];
  actionItems: any[];
  nextMeetingDate?: string;
  projectId: string;
  organizationId: string;
}

export interface PAMContract {
  id: string;
  contractNo: string;
  contractType: 'PAM_2006' | 'PAM_2018';
  contractSum: number;
  contractDate: string;
  commencementDate: string;
  completionDate: string;
  extensionOfTime?: number; // days
  liquidatedDamages?: number;
  contractorName: string;
  projectId: string;
  organizationId: string;
}

export interface PaymentCertificate {
  id: string;
  certificateNo: string;
  certificateType: 'INTERIM' | 'FINAL';
  certifiedAmount: number;
  retentionAmount: number;
  previouslyPaid: number;
  netPayable: number;
  certifiedDate: string;
  paymentDueDate: string;
  status: 'DRAFT' | 'ISSUED' | 'APPROVED' | 'PAID' | 'DISPUTED';
  projectId: string;
  organizationId: string;
}

export interface PunchList {
  id: string;
  punchListNo: string;
  inspectionDate: string;
  location: string;
  items: any[];
  totalItems: number;
  completedItems: number;
  status: 'DRAFT' | 'ISSUED' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED';
  targetCompletionDate?: string;
  projectId: string;
  organizationId: string;
}

export interface RFI {
  id: string;
  rfiNo: string;
  subject: string;
  description: string;
  category: 'DESIGN_CLARIFICATION' | 'MATERIAL_SPECIFICATION' | 'TECHNICAL_DETAIL' | 'SITE_CONDITION' | 'COORDINATION' | 'OTHER';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESPONDED' | 'CLOSED' | 'CANCELLED';
  raisedDate: string;
  responseDate?: string;
  response?: string;
  projectId: string;
  organizationId: string;
}

export interface RetentionRecord {
  id: string;
  retentionNo: string;
  retentionPercentage: number; // typically 5%
  retentionAmount: number;
  retentionDate: string;
  releaseDate?: string;
  status: 'HELD' | 'PARTIALLY_RELEASED' | 'FULLY_RELEASED';
  releasedAmount?: number;
  projectId: string;
  organizationId: string;
}

export interface SiteInstruction {
  id: string;
  instructionNo: string;
  subject: string;
  description: string;
  instructionType: 'VARIATION' | 'CLARIFICATION' | 'CORRECTION' | 'ADDITIONAL_WORK' | 'OMISSION' | 'PROVISIONAL_SUM' | 'OTHER';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'DRAFT' | 'ISSUED' | 'ACKNOWLEDGED' | 'IMPLEMENTED' | 'CLOSED';
  issuedDate: string;
  acknowledgedDate?: string;
  costImplication: boolean;
  estimatedCost?: number;
  projectId: string;
  organizationId: string;
}

// ============================================================
// 1. AUTHORITY SUBMISSIONS
// ============================================================

export const authoritySubmissionsService = {
  getAll: async (projectId?: string) => {
    const params = projectId ? `?projectId=${projectId}` : '';
    const response = await api.get(`${BASE_URL}/authority-submissions${params}`);
    return response.data;
  },

  create: async (data: Partial<AuthoritySubmission>) => {
    const response = await api.post(`${BASE_URL}/authority-submissions`, data);
    return response.data;
  },

  update: async (id: string, data: Partial<AuthoritySubmission>) => {
    const response = await api.patch(`${BASE_URL}/authority-submissions/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`${BASE_URL}/authority-submissions/${id}`);
    return response.data;
  },
};

// ============================================================
// 2. CCC APPLICATIONS
// ============================================================

export const cccApplicationsService = {
  getAll: async (projectId?: string) => {
    const params = projectId ? `?projectId=${projectId}` : '';
    const response = await api.get(`${BASE_URL}/ccc-applications${params}`);
    return response.data;
  },

  create: async (data: Partial<CCCApplication>) => {
    const response = await api.post(`${BASE_URL}/ccc-applications`, data);
    return response.data;
  },

  update: async (id: string, data: Partial<CCCApplication>) => {
    const response = await api.patch(`${BASE_URL}/ccc-applications/${id}`, data);
    return response.data;
  },
};

// ============================================================
// 3. CHANGE ORDERS
// ============================================================

export const changeOrdersService = {
  getAll: async (projectId?: string) => {
    const params = projectId ? `?projectId=${projectId}` : '';
    const response = await api.get(`${BASE_URL}/change-orders${params}`);
    return response.data;
  },

  create: async (data: Partial<ChangeOrder>) => {
    const response = await api.post(`${BASE_URL}/change-orders`, data);
    return response.data;
  },

  update: async (id: string, data: Partial<ChangeOrder>) => {
    const response = await api.patch(`${BASE_URL}/change-orders/${id}`, data);
    return response.data;
  },
};

// ============================================================
// 4. DLP RECORDS
// ============================================================

export const dlpRecordsService = {
  getAll: async (projectId?: string) => {
    const params = projectId ? `?projectId=${projectId}` : '';
    const response = await api.get(`${BASE_URL}/dlp-records${params}`);
    return response.data;
  },

  create: async (data: Partial<DLPRecord>) => {
    const response = await api.post(`${BASE_URL}/dlp-records`, data);
    return response.data;
  },

  update: async (id: string, data: Partial<DLPRecord>) => {
    const response = await api.patch(`${BASE_URL}/dlp-records/${id}`, data);
    return response.data;
  },
};

// ============================================================
// 5. DRAWINGS
// ============================================================

export const drawingsService = {
  getAll: async (projectId?: string) => {
    const params = projectId ? `?projectId=${projectId}` : '';
    const response = await api.get(`${BASE_URL}/drawings${params}`);
    return response.data;
  },

  create: async (data: Partial<Drawing>) => {
    const response = await api.post(`${BASE_URL}/drawings`, data);
    return response.data;
  },

  update: async (id: string, data: Partial<Drawing>) => {
    const response = await api.patch(`${BASE_URL}/drawings/${id}`, data);
    return response.data;
  },
};

// ============================================================
// 6. MEETING MINUTES
// ============================================================

export const meetingMinutesService = {
  getAll: async (projectId?: string) => {
    const params = projectId ? `?projectId=${projectId}` : '';
    const response = await api.get(`${BASE_URL}/meeting-minutes${params}`);
    return response.data;
  },

  create: async (data: Partial<MeetingMinute>) => {
    const response = await api.post(`${BASE_URL}/meeting-minutes`, data);
    return response.data;
  },

  update: async (id: string, data: Partial<MeetingMinute>) => {
    const response = await api.patch(`${BASE_URL}/meeting-minutes/${id}`, data);
    return response.data;
  },
};

// ============================================================
// 7. PAM CONTRACTS
// ============================================================

export const pamContractsService = {
  getAll: async (projectId?: string) => {
    const params = projectId ? `?projectId=${projectId}` : '';
    const response = await api.get(`${BASE_URL}/pam-contracts${params}`);
    return response.data;
  },

  create: async (data: Partial<PAMContract>) => {
    const response = await api.post(`${BASE_URL}/pam-contracts`, data);
    return response.data;
  },

  update: async (id: string, data: Partial<PAMContract>) => {
    const response = await api.patch(`${BASE_URL}/pam-contracts/${id}`, data);
    return response.data;
  },
};

// ============================================================
// 8. PAYMENT CERTIFICATES
// ============================================================

export const paymentCertificatesService = {
  getAll: async (projectId?: string) => {
    const params = projectId ? `?projectId=${projectId}` : '';
    const response = await api.get(`${BASE_URL}/payment-certificates${params}`);
    return response.data;
  },

  create: async (data: Partial<PaymentCertificate>) => {
    const response = await api.post(`${BASE_URL}/payment-certificates`, data);
    return response.data;
  },

  update: async (id: string, data: Partial<PaymentCertificate>) => {
    const response = await api.patch(`${BASE_URL}/payment-certificates/${id}`, data);
    return response.data;
  },
};

// ============================================================
// 9. PUNCH LISTS
// ============================================================

export const punchListsService = {
  getAll: async (projectId?: string) => {
    const params = projectId ? `?projectId=${projectId}` : '';
    const response = await api.get(`${BASE_URL}/punch-lists${params}`);
    return response.data;
  },

  create: async (data: Partial<PunchList>) => {
    const response = await api.post(`${BASE_URL}/punch-lists`, data);
    return response.data;
  },

  update: async (id: string, data: Partial<PunchList>) => {
    const response = await api.patch(`${BASE_URL}/punch-lists/${id}`, data);
    return response.data;
  },
};

// ============================================================
// 10. RFIs
// ============================================================

export const rfisService = {
  getAll: async (projectId?: string) => {
    const params = projectId ? `?projectId=${projectId}` : '';
    const response = await api.get(`${BASE_URL}/rfis${params}`);
    return response.data;
  },

  create: async (data: Partial<RFI>) => {
    const response = await api.post(`${BASE_URL}/rfis`, data);
    return response.data;
  },

  update: async (id: string, data: Partial<RFI>) => {
    const response = await api.patch(`${BASE_URL}/rfis/${id}`, data);
    return response.data;
  },
};

// ============================================================
// 11. RETENTION RECORDS
// ============================================================

export const retentionRecordsService = {
  getAll: async (projectId?: string) => {
    const params = projectId ? `?projectId=${projectId}` : '';
    const response = await api.get(`${BASE_URL}/retention-records${params}`);
    return response.data;
  },

  create: async (data: Partial<RetentionRecord>) => {
    const response = await api.post(`${BASE_URL}/retention-records`, data);
    return response.data;
  },

  update: async (id: string, data: Partial<RetentionRecord>) => {
    const response = await api.patch(`${BASE_URL}/retention-records/${id}`, data);
    return response.data;
  },
};

// ============================================================
// 12. SITE INSTRUCTIONS
// ============================================================

export const siteInstructionsService = {
  getAll: async (projectId?: string) => {
    const params = projectId ? `?projectId=${projectId}` : '';
    const response = await api.get(`${BASE_URL}/site-instructions${params}`);
    return response.data;
  },

  create: async (data: Partial<SiteInstruction>) => {
    const response = await api.post(`${BASE_URL}/site-instructions`, data);
    return response.data;
  },

  update: async (id: string, data: Partial<SiteInstruction>) => {
    const response = await api.patch(`${BASE_URL}/site-instructions/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`${BASE_URL}/site-instructions/${id}`);
    return response.data;
  },
};

// Export all services as a single object for convenience
export const architectService = {
  authoritySubmissions: authoritySubmissionsService,
  cccApplications: cccApplicationsService,
  changeOrders: changeOrdersService,
  dlpRecords: dlpRecordsService,
  drawings: drawingsService,
  meetingMinutes: meetingMinutesService,
  pamContracts: pamContractsService,
  paymentCertificates: paymentCertificatesService,
  punchLists: punchListsService,
  rfis: rfisService,
  retentionRecords: retentionRecordsService,
  siteInstructions: siteInstructionsService,
};
