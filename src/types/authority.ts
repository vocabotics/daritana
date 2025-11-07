// Authority Submission System Types
// Comprehensive type definitions for Malaysian building authority integration

export interface BuildingAuthority {
  id: string;
  code: string; // DBKL, MBSA, MBPJ, etc.
  name_en: string;
  name_ms: string;
  jurisdiction: string;
  state_code: string;
  contact_info: {
    phone: string;
    email: string;
    address: string;
    website?: string;
    operating_hours?: string;
  };
  office_hours: {
    [day: string]: {
      open: string;
      close: string;
      closed?: boolean;
    };
  };
  submission_methods: ('online' | 'physical' | 'hybrid')[];
  api_endpoint?: string;
  fee_schedule: {
    [category: string]: {
      base_fee: number;
      area_rate?: number;
      value_rate?: number;
      min_fee: number;
      max_fee: number;
    };
  };
  processing_times: {
    [category: string]: {
      typical_days: number;
      max_days: number;
    };
  };
  requirements: {
    min_lot_size?: number;
    max_coverage?: number;
    min_setback?: number;
    [key: string]: any;
  };
  status: 'active' | 'inactive' | 'maintenance';
  last_sync_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface SubmissionCategory {
  id: string;
  authority_id: string;
  code: string; // BP, CF, CCC, etc.
  name_en: string;
  name_ms: string;
  description_en?: string;
  description_ms?: string;
  required_documents: string[];
  submission_fee: number;
  processing_fee: number;
  typical_processing_days: number;
  max_processing_days: number;
  requires_site_inspection: boolean;
  requires_public_notice: boolean;
  renewal_required: boolean;
  renewal_period_months?: number;
  compliance_requirements: {
    ubbl_clauses: string[];
    minimum_compliance_score?: number;
  };
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

export interface BuildingSubmission {
  id: string;
  project_id: string;
  authority_id: string;
  category_id: string;
  
  // Submission Details
  submission_number?: string; // Authority-generated
  internal_reference: string; // Our internal tracking
  submission_type: 'new' | 'amendment' | 'renewal' | 'variation' | 'extension';
  submission_method: 'online' | 'physical' | 'hybrid';
  
  // Project Information
  site_address: string;
  lot_number?: string;
  plan_number?: string;
  land_title?: string;
  land_area?: number; // sqm
  built_up_area?: number; // sqm
  building_height?: number; // meters
  number_of_floors?: number;
  building_use: string;
  occupancy_load?: number;
  
  // Status Tracking
  status: SubmissionStatus;
  submission_date?: Date;
  acknowledgment_date?: Date;
  review_start_date?: Date;
  site_inspection_date?: Date;
  decision_date?: Date;
  certificate_issued_date?: Date;
  expiry_date?: Date;
  
  // Financial Information
  calculated_fees: {
    [fee_type: string]: {
      amount: number;
      calculation: string;
    };
  };
  total_fees: number;
  payment_status: 'pending' | 'partial' | 'paid' | 'refunded' | 'waived';
  payment_reference?: string;
  receipt_number?: string;
  
  // Authority Response
  authority_response: {
    comments?: string;
    conditions?: string[];
    technical_comments?: string;
    inspector_notes?: string;
  };
  rejection_reasons?: string[];
  approval_conditions?: string[];
  certificate_details?: {
    certificate_number?: string;
    issued_date?: Date;
    expiry_date?: Date;
    conditions?: string[];
  };
  
  // Compliance & Documentation
  compliance_score?: number;
  compliance_issues: ComplianceIssue[];
  submitted_documents: SubmissionDocumentRef[];
  missing_documents: string[];
  
  // Workflow
  assigned_to?: string;
  consultant_id?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
  created_by: string;
  last_updated_by?: string;
  
  // Related Data (populated via joins)
  project?: {
    id: string;
    name: string;
    client_name: string;
  };
  authority?: BuildingAuthority;
  category?: SubmissionCategory;
}

export type SubmissionStatus = 
  | 'draft'           // Being prepared
  | 'submitted'       // Submitted to authority
  | 'acknowledged'    // Authority acknowledged receipt
  | 'under_review'    // Under technical review
  | 'additional_info_required' // Authority needs more info
  | 'site_inspection_scheduled' // Inspection scheduled
  | 'site_inspection_completed' // Inspection done
  | 'conditionally_approved'    // Approved with conditions
  | 'approved'        // Fully approved
  | 'rejected'        // Rejected
  | 'expired'         // Application expired
  | 'withdrawn'       // Withdrawn by applicant
  | 'suspended';      // Suspended for any reason

export interface SubmissionDocument {
  id: string;
  submission_id: string;
  document_type: string;
  document_category: 'required' | 'supporting' | 'supplementary';
  
  // File Information
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  mime_type: string;
  checksum?: string;
  
  // Document Details
  title: string;
  description?: string;
  drawing_number?: string;
  revision: string;
  scale?: string;
  sheet_number?: string;
  total_sheets?: number;
  
  // Authority Requirements
  is_required: boolean;
  authority_specification?: string;
  compliance_notes?: string;
  
  // Processing Status
  status: 'uploaded' | 'verified' | 'approved' | 'rejected';
  verification_status?: 'format_ok' | 'compliant' | 'non_compliant';
  verification_notes?: string;
  stamped_by?: string;
  stamp_number?: string;
  
  // Metadata
  uploaded_by: string;
  uploaded_at: Date;
  verified_by?: string;
  verified_at?: Date;
  
  created_at: Date;
  updated_at: Date;
}

export interface SubmissionDocumentRef {
  document_id: string;
  document_type: string;
  title: string;
  status: string;
  is_required: boolean;
}

export interface SubmissionStatusHistory {
  id: string;
  submission_id: string;
  previous_status?: SubmissionStatus;
  new_status: SubmissionStatus;
  status_date: Date;
  changed_by?: string;
  change_reason?: string;
  comments?: string;
  authority_reference?: string;
  metadata?: Record<string, any>;
  notification_sent: boolean;
  created_at: Date;
}

export interface SubmissionFee {
  id: string;
  submission_id: string;
  fee_type: string;
  fee_category: 'mandatory' | 'optional' | 'penalty';
  description: string;
  
  // Calculation
  calculation_method: 'fixed' | 'area_based' | 'value_based' | 'custom';
  base_amount: number;
  rate?: number;
  units?: number;
  calculated_amount: number;
  
  // Taxes & Charges
  sst_applicable: boolean;
  sst_rate: number;
  sst_amount: number;
  other_charges: number;
  total_amount: number;
  
  // Status
  status: 'calculated' | 'invoiced' | 'paid' | 'waived';
  due_date?: Date;
  paid_date?: Date;
  payment_reference?: string;
  
  created_at: Date;
  updated_at: Date;
}

export interface ComplianceIssue {
  clause_id: string;
  clause_title: string;
  issue_type: 'violation' | 'warning' | 'clarification_needed';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'resolved' | 'waived';
  resolution?: string;
}

export interface AuthorityApiLog {
  id: string;
  submission_id?: string;
  authority_id: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  request_headers?: Record<string, string>;
  request_body?: any;
  response_status?: number;
  response_headers?: Record<string, string>;
  response_body?: any;
  execution_time_ms?: number;
  success: boolean;
  error_message?: string;
  retry_count: number;
  operation_type: string;
  initiated_by?: string;
  created_at: Date;
}

// Form Data Types
export interface SubmissionFormData {
  project_id: string;
  authority_id: string;
  category_id: string;
  submission_type: string;
  submission_method: string;
  
  // Project details
  site_address: string;
  lot_number?: string;
  plan_number?: string;
  land_title?: string;
  land_area?: number;
  built_up_area?: number;
  building_height?: number;
  number_of_floors?: number;
  building_use: string;
  occupancy_load?: number;
  
  // Additional info
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assigned_to?: string;
  consultant_id?: string;
  special_requirements?: string;
}

export interface DocumentUploadData {
  document_type: string;
  title: string;
  description?: string;
  drawing_number?: string;
  revision: string;
  scale?: string;
  sheet_number?: string;
  total_sheets?: number;
  file: File;
}

// API Response Types
export interface SubmissionResponse {
  success: boolean;
  data?: BuildingSubmission;
  error?: string;
  validation_errors?: Record<string, string[]>;
}

export interface SubmissionListResponse {
  success: boolean;
  data?: {
    submissions: BuildingSubmission[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
  error?: string;
}

export interface AuthorityListResponse {
  success: boolean;
  data?: BuildingAuthority[];
  error?: string;
}

export interface FeeCalculationResponse {
  success: boolean;
  data?: {
    fees: SubmissionFee[];
    total_amount: number;
    breakdown: Record<string, number>;
  };
  error?: string;
}

// Dashboard & Analytics Types
export interface SubmissionStats {
  total_submissions: number;
  pending_submissions: number;
  approved_submissions: number;
  rejected_submissions: number;
  total_fees_paid: number;
  average_processing_days: number;
  compliance_score_average: number;
}

export interface AuthorityPerformance {
  authority_id: string;
  authority_name: string;
  total_submissions: number;
  average_processing_days: number;
  approval_rate: number;
  on_time_rate: number;
  last_updated: Date;
}

// Workflow & Notification Types
export interface SubmissionWorkflowStep {
  id: string;
  name: string;
  description: string;
  required: boolean;
  estimated_days: number;
  dependencies: string[];
  assignee_role: string;
  automated: boolean;
}

export interface SubmissionNotification {
  id: string;
  submission_id: string;
  notification_type: 'status_change' | 'deadline_reminder' | 'document_required' | 'payment_due';
  title: string;
  message: string;
  recipients: string[];
  delivery_method: 'email' | 'sms' | 'push' | 'in_app';
  sent_at?: Date;
  read_at?: Date;
  created_at: Date;
}

// Malaysian specific enums and constants
export const MALAYSIAN_STATES = [
  'JHR', 'KDH', 'KTN', 'MLK', 'NSN', 'PHG', 'PNG', 'PRK', 'PLS', 'SBH', 'SWK', 'SGR', 'TRG', 'WP'
] as const;

export const BUILDING_USES = [
  'Single Family Residential',
  'Multi Family Residential', 
  'Commercial Office',
  'Retail',
  'Mixed Development',
  'Industrial',
  'Institutional',
  'Religious',
  'Educational',
  'Healthcare',
  'Hospitality',
  'Recreation',
  'Public Assembly',
  'Warehouse',
  'Other'
] as const;

export const DOCUMENT_TYPES = [
  'architectural_plans',
  'structural_plans',
  'mep_plans',
  'civil_plans',
  'landscape_plans',
  'site_plan',
  'location_plan',
  'building_specification',
  'structural_calculation',
  'mep_calculation',
  'geotechnical_report',
  'environmental_report',
  'traffic_impact_study',
  'land_title',
  'survey_report',
  'professional_certification',
  'insurance_certificate',
  'other'
] as const;

export type MalaysianState = typeof MALAYSIAN_STATES[number];
export type BuildingUse = typeof BUILDING_USES[number];
export type DocumentType = typeof DOCUMENT_TYPES[number];

// Utility functions
export const getStatusColor = (status: SubmissionStatus): string => {
  const colors: Record<SubmissionStatus, string> = {
    'draft': 'gray',
    'submitted': 'blue',
    'acknowledged': 'cyan',
    'under_review': 'yellow',
    'additional_info_required': 'orange',
    'site_inspection_scheduled': 'purple',
    'site_inspection_completed': 'indigo',
    'conditionally_approved': 'lime',
    'approved': 'green',
    'rejected': 'red',
    'expired': 'gray',
    'withdrawn': 'gray',
    'suspended': 'red'
  };
  return colors[status] || 'gray';
};

export const getStatusLabel = (status: SubmissionStatus): string => {
  const labels: Record<SubmissionStatus, string> = {
    'draft': 'Draft',
    'submitted': 'Submitted',
    'acknowledged': 'Acknowledged',
    'under_review': 'Under Review',
    'additional_info_required': 'Info Required',
    'site_inspection_scheduled': 'Inspection Scheduled',
    'site_inspection_completed': 'Inspection Completed',
    'conditionally_approved': 'Conditionally Approved',
    'approved': 'Approved',
    'rejected': 'Rejected',
    'expired': 'Expired',
    'withdrawn': 'Withdrawn',
    'suspended': 'Suspended'
  };
  return labels[status] || status;
};

export const getPriorityColor = (priority: string): string => {
  const colors: Record<string, string> = {
    'low': 'gray',
    'normal': 'blue',
    'high': 'orange',
    'urgent': 'red'
  };
  return colors[priority] || 'gray';
};