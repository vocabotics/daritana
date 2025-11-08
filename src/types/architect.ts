// Architect-specific types for Malaysian architecture firms

// RFI (Request for Information) Types
export interface RFI {
  id: string;
  projectId: string;
  projectName: string;
  rfiNumber: string;
  title: string;
  description: string;
  category: 'structural' | 'architectural' | 'mep' | 'civil' | 'landscape' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'draft' | 'open' | 'in_review' | 'responded' | 'closed';
  requestedBy: {
    id: string;
    name: string;
    company: string;
    role: string;
  };
  assignedTo: {
    id: string;
    name: string;
    email: string;
  };
  dateCreated: string;
  dateDue: string;
  dateResponded?: string;
  dateClosed?: string;
  response?: string;
  attachments: RFIAttachment[];
  costImpact?: number;
  scheduleImpact?: number; // days
  tags: string[];
}

export interface RFIAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
  type: 'drawing' | 'specification' | 'photo' | 'document' | 'other';
}

// Change Order Types
export interface ChangeOrder {
  id: string;
  projectId: string;
  projectName: string;
  changeOrderNumber: string;
  title: string;
  description: string;
  reason: 'design_change' | 'site_condition' | 'client_request' | 'error_omission' | 'regulatory' | 'other';
  status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'in_progress' | 'completed';
  requestedBy: {
    id: string;
    name: string;
    company: string;
  };
  originalCost: number;
  revisedCost: number;
  costImpact: number;
  originalSchedule: string;
  revisedSchedule: string;
  scheduleImpact: number; // days
  approvals: ChangeOrderApproval[];
  documents: Document[];
  createdAt: string;
  updatedAt: string;
  approvedDate?: string;
  completedDate?: string;
}

export interface ChangeOrderApproval {
  id: string;
  approverId: string;
  approverName: string;
  approverRole: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  date?: string;
  signature?: string;
}

// Drawing Register Types
export interface Drawing {
  id: string;
  projectId: string;
  projectName: string;
  drawingNumber: string;
  title: string;
  discipline: 'architectural' | 'structural' | 'mep' | 'civil' | 'landscape' | 'interior';
  type: 'plan' | 'elevation' | 'section' | 'detail' | 'schedule' | '3d' | 'diagram';
  scale: string;
  size: 'A0' | 'A1' | 'A2' | 'A3' | 'A4';
  currentRevision: string;
  status: 'draft' | 'for_review' | 'for_approval' | 'approved' | 'for_construction' | 'as_built' | 'superseded';
  revisions: DrawingRevision[];
  fileUrl: string;
  thumbnailUrl?: string;
  createdBy: string;
  createdAt: string;
  lastModified: string;
  transmittals: string[];
  tags: string[];
}

export interface DrawingRevision {
  id: string;
  revision: string;
  description: string;
  date: string;
  author: string;
  fileUrl: string;
  fileSize: number;
  status: 'current' | 'superseded';
  comments?: string;
}

export interface DrawingTransmittal {
  id: string;
  transmittalNumber: string;
  projectId: string;
  drawings: string[]; // drawing IDs
  recipient: {
    name: string;
    company: string;
    email: string;
  };
  purpose: 'for_review' | 'for_approval' | 'for_construction' | 'for_information' | 'as_built';
  sentDate: string;
  dueDate?: string;
  status: 'draft' | 'sent' | 'acknowledged' | 'responded';
  comments?: string;
}

// Site Visit Types
export interface SiteVisit {
  id: string;
  projectId: string;
  projectName: string;
  visitNumber: string;
  visitType: 'routine' | 'inspection' | 'progress' | 'safety' | 'quality' | 'meeting';
  date: string;
  startTime: string;
  endTime: string;
  weather: {
    condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy';
    temperature: number;
    humidity: number;
    windSpeed?: number;
  };
  attendees: SiteVisitAttendee[];
  purpose: string;
  observations: SiteObservation[];
  issues: SiteIssue[];
  photos: SitePhoto[];
  nextSteps?: string;
  reportUrl?: string;
  createdBy: string;
  createdAt: string;
}

export interface SiteVisitAttendee {
  id: string;
  name: string;
  company: string;
  role: string;
  email?: string;
  phone?: string;
  signature?: string;
}

export interface SiteObservation {
  id: string;
  category: 'progress' | 'quality' | 'safety' | 'material' | 'workmanship';
  description: string;
  location: string;
  photos?: string[];
  status: 'satisfactory' | 'needs_attention' | 'unsatisfactory';
}

export interface SiteIssue {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'safety' | 'quality' | 'progress' | 'compliance';
  location: string;
  assignedTo?: string;
  dueDate?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  photos?: string[];
}

export interface SitePhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
  caption: string;
  location: string;
  timestamp: string;
  tags: string[];
  annotations?: PhotoAnnotation[];
}

export interface PhotoAnnotation {
  id: string;
  x: number;
  y: number;
  text: string;
  author: string;
  timestamp: string;
}

// Punch List Types
export interface PunchItem {
  id: string;
  projectId: string;
  projectName: string;
  itemNumber: string;
  title: string;
  description: string;
  location: string;
  floor?: string;
  room?: string;
  category: 'architectural' | 'structural' | 'mep' | 'finishes' | 'external' | 'landscape';
  type: 'defect' | 'incomplete' | 'damage' | 'missing' | 'incorrect';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'ready_for_inspection' | 'approved' | 'rejected' | 'closed';
  assignedContractor: {
    id: string;
    name: string;
    company: string;
    trade: string;
  };
  createdBy: string;
  createdAt: string;
  dueDate: string;
  completedDate?: string;
  verifiedDate?: string;
  verifiedBy?: string;
  photos: PunchPhoto[];
  comments: PunchComment[];
  costToRectify?: number;
  tags: string[];
}

export interface PunchPhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
  type: 'before' | 'during' | 'after';
  caption?: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface PunchComment {
  id: string;
  text: string;
  author: string;
  authorRole: string;
  timestamp: string;
  attachments?: string[];
}

// PAM Contract Types (Malaysian specific)
export interface PAMContract {
  id: string;
  projectId: string;
  projectName: string;
  contractNumber: string;
  contractType: 'PAM2018' | 'PAM2006' | 'PWD203A' | 'CIDB2000' | 'custom';
  title: string;
  employer: {
    name: string;
    company: string;
    address: string;
    registrationNumber: string;
  };
  contractor: {
    name: string;
    company: string;
    address: string;
    registrationNumber: string;
    cidbGrade?: string;
  };
  contractSum: number;
  commencementDate: string;
  completionDate: string;
  defectsLiabilityPeriod: number; // months
  retentionPercentage: number;
  liquidatedDamages: number; // per day
  performanceBond?: {
    amount: number;
    bank: string;
    validUntil: string;
  };
  insurances: Insurance[];
  variations: Variation[];
  certificates: PaymentCertificate[];
  status: 'draft' | 'active' | 'suspended' | 'terminated' | 'completed';
  clauses: PAMClause[];
  amendments: ContractAmendment[];
  createdAt: string;
  updatedAt: string;
}

export interface Insurance {
  id: string;
  type: 'contractors_all_risk' | 'public_liability' | 'workmens_compensation' | 'professional_indemnity';
  provider: string;
  policyNumber: string;
  amount: number;
  validFrom: string;
  validTo: string;
  status: 'active' | 'expired' | 'cancelled';
}

export interface Variation {
  id: string;
  variationNumber: string;
  description: string;
  reason: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedDate?: string;
  documents?: string[];
}

export interface PaymentCertificate {
  id: string;
  certificateNumber: string;
  periodFrom: string;
  periodTo: string;
  workDone: number;
  materials: number;
  variations: number;
  previousCertified: number;
  currentCertified: number;
  retention: number;
  releaseRetention: number;
  netPayment: number;
  status: 'draft' | 'submitted' | 'certified' | 'paid';
  certifiedBy?: string;
  certifiedDate?: string;
  paidDate?: string;
  attachments?: string[];
}

export interface PAMClause {
  id: string;
  clauseNumber: string;
  title: string;
  description: string;
  category: string;
  mandatory: boolean;
  modified?: boolean;
  customText?: string;
}

export interface ContractAmendment {
  id: string;
  amendmentNumber: string;
  date: string;
  description: string;
  clauses: string[];
  approvedBy: string;
  effectiveDate: string;
  documents?: string[];
}

// Filter and Sort Types
export interface RFIFilters {
  status?: RFI['status'][];
  priority?: RFI['priority'][];
  category?: RFI['category'][];
  dateRange?: {
    from: string;
    to: string;
  };
  assignedTo?: string;
  projectId?: string;
}

export interface DrawingFilters {
  discipline?: Drawing['discipline'][];
  type?: Drawing['type'][];
  status?: Drawing['status'][];
  size?: Drawing['size'][];
  projectId?: string;
  searchTerm?: string;
}

export interface PunchListFilters {
  status?: PunchItem['status'][];
  priority?: PunchItem['priority'][];
  category?: PunchItem['category'][];
  assignedContractor?: string;
  location?: string;
  projectId?: string;
  dueDateRange?: {
    from: string;
    to: string;
  };
}

// Statistics Types
export interface RFIStatistics {
  total: number;
  open: number;
  responded: number;
  closed: number;
  avgResponseTime: number; // hours
  byCategory: Record<RFI['category'], number>;
  byPriority: Record<RFI['priority'], number>;
}

export interface PunchStatistics {
  total: number;
  open: number;
  inProgress: number;
  completed: number;
  overdue: number;
  byCategory: Record<PunchItem['category'], number>;
  byContractor: Array<{
    contractor: string;
    open: number;
    completed: number;
  }>;
  completionRate: number;
}

export interface ContractStatistics {
  totalValue: number;
  variations: number;
  certified: number;
  paid: number;
  retention: number;
  progress: number; // percentage
}