// Mock data for Authority Submission System
// This data demonstrates the full authority submission workflow

import type {
  BuildingAuthority,
  SubmissionCategory,
  BuildingSubmission,
  SubmissionStats,
  AuthorityPerformance
} from '@/types/authority';

// Default empty structures for initial state
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
export const defaultAuthorityPerformance: AuthorityPerformance = {
  authority_id: '',
  authority_name: '',
  total_submissions: 0,
  approval_rate: 0,
  average_processing_days: 0,
  on_time_rate: 0,
  last_updated: new Date()
};

// Sample data for demo mode (minimal examples)
export const sampleAuthorities: BuildingAuthority[] = [
  {
    id: 'demo-auth-1',
    code: 'DEMO',
    name_en: 'Demo Authority',
    name_ms: 'Pihak Berkuasa Demo',
    jurisdiction: 'Demo Area',
    state_code: 'DEMO',
    contact_info: {
      phone: '+60-3-1234-5678',
      email: 'demo@authority.gov.my',
      address: 'Demo Address, Demo City',
      website: 'https://demo-authority.gov.my',
      operating_hours: 'Mon-Fri 8:00am-5:00pm'
    },
    office_hours: {
      monday: { open: '08:00', close: '17:00' },
      tuesday: { open: '08:00', close: '17:00' },
      wednesday: { open: '08:00', close: '17:00' },
      thursday: { open: '08:00', close: '17:00' },
      friday: { open: '08:00', close: '17:00' },
      saturday: { open: '08:00', close: '17:00' },
      sunday: { open: '08:00', close: '17:00' }
    },
    submission_methods: ['online'],
    api_endpoint: 'https://api.demo-authority.gov.my/v1',
    fee_schedule: {
      building_permit: {
        base_fee: 100,
        area_rate: 0.50,
        min_fee: 100,
        max_fee: 10000
      }
    },
    processing_times: {
      building_permit: {
        typical_days: 21,
        max_days: 30
      }
    },
    requirements: {
      min_lot_size: 500,
      max_coverage: 0.6,
      min_setback: 3
    },
    status: 'active',
    created_at: new Date(),
    updated_at: new Date()
  }
];

// Submission Categories
export const mockSubmissionCategories: SubmissionCategory[] = [
  {
    id: 'cat-001',
    authority_id: 'auth-001', // DBKL
    code: 'BP',
    name_en: 'Building Plan Approval',
    name_ms: 'Kelulusan Pelan Bangunan',
    description_en: 'Application for building plan approval for new construction or major renovation',
    description_ms: 'Permohonan kelulusan pelan bangunan untuk pembinaan baru atau pengubahsuaian besar',
    required_documents: [
      'architectural_plans',
      'structural_plans',
      'mep_plans',
      'site_plan',
      'location_plan',
      'building_specification',
      'structural_calculation',
      'professional_certification'
    ],
    submission_fee: 500.00,
    processing_fee: 200.00,
    typical_processing_days: 21,
    max_processing_days: 30,
    requires_site_inspection: true,
    requires_public_notice: false,
    renewal_required: false,
    compliance_requirements: {
      ubbl_clauses: ['BP-001', 'BP-002', 'BP-003'],
      minimum_compliance_score: 85
    },
    status: 'active',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-12-01')
  },
  {
    id: 'cat-002',
    authority_id: 'auth-001', // DBKL
    code: 'CF',
    name_en: 'Certificate of Fitness for Occupation',
    name_ms: 'Sijil Siap dan Selamat Menduduki',
    description_en: 'Certificate confirming building is safe for occupation',
    description_ms: 'Sijil mengesahkan bangunan selamat untuk diduduki',
    required_documents: [
      'building_completion_certificate',
      'mep_completion_certificate',
      'site_photos',
      'as_built_drawings',
      'professional_certification'
    ],
    submission_fee: 300.00,
    processing_fee: 100.00,
    typical_processing_days: 14,
    max_processing_days: 21,
    requires_site_inspection: true,
    requires_public_notice: false,
    renewal_required: true,
    renewal_period_months: 12,
    compliance_requirements: {
      ubbl_clauses: ['CF-001', 'CF-002'],
      minimum_compliance_score: 90
    },
    status: 'active',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-12-01')
  },
  {
    id: 'cat-003',
    authority_id: 'auth-002', // MBPJ
    code: 'BP',
    name_en: 'Building Plan Approval',
    name_ms: 'Kelulusan Pelan Bangunan',
    description_en: 'Application for building plan approval',
    required_documents: [
      'architectural_plans',
      'structural_plans',
      'mep_plans',
      'site_plan',
      'location_plan'
    ],
    submission_fee: 600.00,
    processing_fee: 250.00,
    typical_processing_days: 28,
    max_processing_days: 42,
    requires_site_inspection: true,
    requires_public_notice: true,
    renewal_required: false,
    compliance_requirements: {
      ubbl_clauses: ['BP-001', 'BP-002'],
      minimum_compliance_score: 80
    },
    status: 'active',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-12-01')
  }
];

// Mock Building Submissions
export const mockSubmissions: BuildingSubmission[] = [
  {
    id: 'sub-001',
    project_id: 'proj-001',
    authority_id: 'auth-001',
    category_id: 'cat-001',
    submission_number: 'DBKL/BP/2024/001234',
    internal_reference: 'DAR-240801-A1B2',
    submission_type: 'new',
    submission_method: 'online',
    site_address: 'Lot 1234, Jalan Bukit Bintang, 55100 Kuala Lumpur',
    lot_number: '1234',
    plan_number: 'Plan 5678',
    land_title: 'GM 1234, Lot 5678',
    land_area: 2000,
    built_up_area: 1200,
    building_height: 15.5,
    number_of_floors: 4,
    building_use: 'Commercial Office',
    occupancy_load: 200,
    status: 'under_review',
    submission_date: new Date('2024-08-01'),
    acknowledgment_date: new Date('2024-08-02'),
    review_start_date: new Date('2024-08-05'),
    calculated_fees: {
      submission_fee: { amount: 500, calculation: 'Base fee' },
      processing_fee: { amount: 200, calculation: 'Processing' },
      area_fee: { amount: 360, calculation: '1200 sqm × RM 0.30' }
    },
    total_fees: 1060.00,
    payment_status: 'paid',
    payment_reference: 'PAY-2024-001',
    receipt_number: 'RCP-2024-001',
    authority_response: {
      comments: 'Application under technical review',
      technical_comments: 'Please verify structural calculations for floor loading'
    },
    compliance_score: 88,
    compliance_issues: [
      {
        clause_id: 'ubbl-106',
        clause_title: 'Staircase Requirements',
        issue_type: 'warning',
        description: 'Minimum stair width requirement needs verification',
        severity: 'medium',
        status: 'open'
      }
    ],
    submitted_documents: [
      {
        document_id: 'doc-001',
        document_type: 'architectural_plans',
        title: 'Architectural Plans - Level 1-4',
        status: 'approved',
        is_required: true
      },
      {
        document_id: 'doc-002',
        document_type: 'structural_plans',
        title: 'Structural Plans and Calculations',
        status: 'under_review',
        is_required: true
      }
    ],
    missing_documents: [],
    priority: 'high',
    created_at: new Date('2024-07-30'),
    updated_at: new Date('2024-08-15'),
    created_by: 'user-001',
    last_updated_by: 'user-002',
    project: {
      id: 'proj-001',
      name: 'KLCC Office Tower',
      client_name: 'ABC Development Sdn Bhd'
    }
  },
  {
    id: 'sub-002',
    project_id: 'proj-002',
    authority_id: 'auth-002',
    category_id: 'cat-003',
    submission_number: 'MBPJ/BP/2024/000567',
    internal_reference: 'DAR-240715-C3D4',
    submission_type: 'new',
    submission_method: 'online',
    site_address: 'No. 88, Jalan SS2/24, SS2, 47300 Petaling Jaya, Selangor',
    lot_number: '88',
    land_area: 1500,
    built_up_area: 900,
    building_height: 12.0,
    number_of_floors: 3,
    building_use: 'Mixed Development',
    occupancy_load: 150,
    status: 'approved',
    submission_date: new Date('2024-07-15'),
    acknowledgment_date: new Date('2024-07-16'),
    review_start_date: new Date('2024-07-18'),
    decision_date: new Date('2024-08-10'),
    certificate_issued_date: new Date('2024-08-12'),
    calculated_fees: {
      submission_fee: { amount: 600, calculation: 'Base fee' },
      processing_fee: { amount: 250, calculation: 'Processing' },
      area_fee: { amount: 315, calculation: '900 sqm × RM 0.35' }
    },
    total_fees: 1165.00,
    payment_status: 'paid',
    authority_response: {
      comments: 'Application approved with conditions',
      conditions: [
        'Install fire safety equipment as per approved plans',
        'Submit as-built drawings upon completion'
      ]
    },
    approval_conditions: [
      'Fire safety equipment installation mandatory',
      'Monthly progress reports required'
    ],
    certificate_details: {
      certificate_number: 'MBPJ/BP/2024/000567/CERT',
      issued_date: new Date('2024-08-12'),
      expiry_date: new Date('2026-08-12'),
      conditions: ['Valid for 24 months from issue date']
    },
    compliance_score: 92,
    compliance_issues: [],
    submitted_documents: [
      {
        document_id: 'doc-003',
        document_type: 'architectural_plans',
        title: 'Complete Architectural Plans',
        status: 'approved',
        is_required: true
      }
    ],
    missing_documents: [],
    priority: 'normal',
    created_at: new Date('2024-07-14'),
    updated_at: new Date('2024-08-12'),
    created_by: 'user-003',
    project: {
      id: 'proj-002',
      name: 'SS2 Mixed Development',
      client_name: 'XYZ Holdings Bhd'
    }
  },
  {
    id: 'sub-003',
    project_id: 'proj-003',
    authority_id: 'auth-001',
    category_id: 'cat-002',
    internal_reference: 'DAR-240620-E5F6',
    submission_type: 'new',
    submission_method: 'physical',
    site_address: 'No. 123, Jalan Ampang, 50450 Kuala Lumpur',
    building_use: 'Single Family Residential',
    built_up_area: 350,
    number_of_floors: 2,
    occupancy_load: 8,
    status: 'submitted',
    submission_date: new Date('2024-08-20'),
    acknowledgment_date: new Date('2024-08-21'),
    calculated_fees: {
      submission_fee: { amount: 300, calculation: 'CF base fee' },
      processing_fee: { amount: 100, calculation: 'CF processing' }
    },
    total_fees: 400.00,
    payment_status: 'pending',
    authority_response: {
      comments: 'Demo application under review'
    },
    compliance_score: 85,
    compliance_issues: [],
    submitted_documents: [
      {
        document_id: 'doc-004',
        document_type: 'building_completion_certificate',
        title: 'Building Completion Certificate',
        status: 'uploaded',
        is_required: true
      }
    ],
    missing_documents: ['mep_completion_certificate', 'site_photos'],
    priority: 'normal',
    created_at: new Date('2024-08-18'),
    updated_at: new Date('2024-08-21'),
    created_by: 'user-004',
    project: {
      id: 'proj-003',
      name: 'Ampang Residence',
      client_name: 'Mr. Ahmad Bin Ali'
    }
  },
  {
    id: 'sub-004',
    project_id: 'proj-004',
    authority_id: 'auth-003',
    category_id: 'cat-001',
    internal_reference: 'DAR-240505-G7H8',
    submission_type: 'amendment',
    submission_method: 'online',
    site_address: 'Lot 456, Jalan Gombak, 53100 Gombak, Selangor',
    building_use: 'Industrial',
    built_up_area: 2500,
    number_of_floors: 1,
    status: 'rejected',
    submission_date: new Date('2024-05-05'),
    acknowledgment_date: new Date('2024-05-06'),
    review_start_date: new Date('2024-05-08'),
    decision_date: new Date('2024-05-25'),
    calculated_fees: {
      submission_fee: { amount: 400, calculation: 'MBSA base fee' }
    },
    total_fees: 400.00,
    payment_status: 'refunded',
    authority_response: {
      comments: 'Application rejected due to non-compliance',
      technical_comments: 'Structural design does not meet industrial building requirements'
    },
    rejection_reasons: [
      'Inadequate structural design for industrial loading',
      'Missing environmental impact assessment',
      'Non-compliance with setback requirements'
    ],
    compliance_score: 65,
    compliance_issues: [
      {
        clause_id: 'ubbl-201',
        clause_title: 'Industrial Building Requirements',
        issue_type: 'violation',
        description: 'Floor loading capacity insufficient for industrial use',
        severity: 'critical',
        status: 'open'
      }
    ],
    submitted_documents: [
      {
        document_id: 'doc-005',
        document_type: 'architectural_plans',
        title: 'Industrial Building Plans',
        status: 'rejected',
        is_required: true
      }
    ],
    missing_documents: ['environmental_report'],
    priority: 'high',
    created_at: new Date('2024-05-01'),
    updated_at: new Date('2024-05-25'),
    created_by: 'user-005',
    project: {
      id: 'proj-004',
      name: 'Gombak Industrial Facility',
      client_name: 'Industrial Corp Sdn Bhd'
    }
  }
];

// Mock Statistics
export const mockSubmissionStats: SubmissionStats = {
  total_submissions: 24,
  pending_submissions: 8,
  approved_submissions: 12,
  rejected_submissions: 3,
  total_fees_paid: 156750.00,
  average_processing_days: 24.5,
  compliance_score_average: 86.2
};

// Mock Authority Performance Data
export const mockAuthorityPerformance: AuthorityPerformance[] = [
  {
    authority_id: 'auth-001',
    authority_name: 'DBKL',
    total_submissions: 15,
    average_processing_days: 22.3,
    approval_rate: 0.87,
    on_time_rate: 0.93,
    last_updated: new Date('2024-08-20')
  },
  {
    authority_id: 'auth-002', 
    authority_name: 'MBPJ',
    total_submissions: 6,
    average_processing_days: 26.8,
    approval_rate: 0.83,
    on_time_rate: 0.67,
    last_updated: new Date('2024-08-20')
  },
  {
    authority_id: 'auth-003',
    authority_name: 'MBSA', 
    total_submissions: 3,
    average_processing_days: 28.0,
    approval_rate: 0.67,
    on_time_rate: 0.67,
    last_updated: new Date('2024-08-20')
  }
];

// Helper functions to get data
export const getAuthorityById = (id: string) => mockAuthorities.find(auth => auth.id === id);
export const getCategoryById = (id: string) => mockSubmissionCategories.find(cat => cat.id === id);
export const getSubmissionById = (id: string) => mockSubmissions.find(sub => sub.id === id);
export const getSubmissionsByProject = (projectId: string) => mockSubmissions.filter(sub => sub.project_id === projectId);
export const getSubmissionsByAuthority = (authorityId: string) => mockSubmissions.filter(sub => sub.authority_id === authorityId);
export const getActiveSubmissions = () => mockSubmissions.filter(sub => !['approved', 'rejected', 'expired', 'withdrawn'].includes(sub.status));
export const getCompletedSubmissions = () => mockSubmissions.filter(sub => ['approved', 'rejected'].includes(sub.status));

// Categories by authority
export const getCategoriesByAuthority = (authorityId: string) => 
  mockSubmissionCategories.filter(cat => cat.authority_id === authorityId);