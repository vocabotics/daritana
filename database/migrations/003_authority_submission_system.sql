-- Migration 003: Authority Submission System
-- Comprehensive system for Malaysian building authority submissions

-- =============================================
-- MALAYSIAN BUILDING AUTHORITIES
-- =============================================

CREATE TABLE building_authorities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL, -- DBKL, MBSA, MBPJ, etc.
    name_en VARCHAR(255) NOT NULL,
    name_ms VARCHAR(255) NOT NULL,
    jurisdiction VARCHAR(100) NOT NULL, -- Kuala Lumpur, Selangor, etc.
    state_code VARCHAR(10) NOT NULL,
    contact_info JSONB NOT NULL DEFAULT '{}', -- phone, email, address
    office_hours JSONB NOT NULL DEFAULT '{}', -- operating hours
    submission_methods JSONB NOT NULL DEFAULT '[]', -- online, physical, hybrid
    api_endpoint VARCHAR(500), -- for digital integration
    api_credentials JSONB, -- encrypted API keys/tokens
    fee_schedule JSONB NOT NULL DEFAULT '{}', -- fee structure
    processing_times JSONB NOT NULL DEFAULT '{}', -- typical processing times
    requirements JSONB NOT NULL DEFAULT '{}', -- specific requirements
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, maintenance
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- SUBMISSION CATEGORIES & TYPES
-- =============================================

CREATE TABLE submission_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    authority_id UUID NOT NULL REFERENCES building_authorities(id),
    code VARCHAR(50) NOT NULL, -- BP, CF, CCC, etc.
    name_en VARCHAR(255) NOT NULL,
    name_ms VARCHAR(255) NOT NULL,
    description_en TEXT,
    description_ms TEXT,
    required_documents JSONB NOT NULL DEFAULT '[]',
    submission_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    processing_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    typical_processing_days INTEGER DEFAULT 30,
    max_processing_days INTEGER DEFAULT 60,
    requires_site_inspection BOOLEAN DEFAULT false,
    requires_public_notice BOOLEAN DEFAULT false,
    renewal_required BOOLEAN DEFAULT false,
    renewal_period_months INTEGER,
    compliance_requirements JSONB DEFAULT '{}', -- linked UBBL clauses
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(authority_id, code)
);

-- =============================================
-- BUILDING PERMITS & SUBMISSIONS
-- =============================================

CREATE TABLE building_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    authority_id UUID NOT NULL REFERENCES building_authorities(id),
    category_id UUID NOT NULL REFERENCES submission_categories(id),
    
    -- Submission Details
    submission_number VARCHAR(100), -- authority-generated number
    internal_reference VARCHAR(100) NOT NULL, -- our internal tracking
    submission_type VARCHAR(50) NOT NULL, -- new, amendment, renewal, etc.
    submission_method VARCHAR(20) DEFAULT 'online', -- online, physical, hybrid
    
    -- Project Information
    site_address TEXT NOT NULL,
    lot_number VARCHAR(50),
    plan_number VARCHAR(50),
    land_title VARCHAR(100),
    land_area DECIMAL(12,2), -- square meters
    built_up_area DECIMAL(12,2), -- square meters
    building_height DECIMAL(8,2), -- meters
    number_of_floors INTEGER,
    building_use VARCHAR(100), -- residential, commercial, mixed, etc.
    occupancy_load INTEGER,
    
    -- Submission Status Tracking
    status VARCHAR(30) NOT NULL DEFAULT 'draft', -- draft, submitted, under_review, approved, rejected, expired
    submission_date TIMESTAMP WITH TIME ZONE,
    acknowledgment_date TIMESTAMP WITH TIME ZONE,
    review_start_date TIMESTAMP WITH TIME ZONE,
    site_inspection_date TIMESTAMP WITH TIME ZONE,
    decision_date TIMESTAMP WITH TIME ZONE,
    certificate_issued_date TIMESTAMP WITH TIME ZONE,
    expiry_date TIMESTAMP WITH TIME ZONE,
    
    -- Financial Information
    calculated_fees JSONB NOT NULL DEFAULT '{}', -- breakdown of all fees
    total_fees DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, partial, paid, refunded
    payment_reference VARCHAR(100),
    receipt_number VARCHAR(100),
    
    -- Authority Response
    authority_response JSONB DEFAULT '{}', -- comments, conditions, etc.
    rejection_reasons JSONB DEFAULT '[]',
    approval_conditions JSONB DEFAULT '[]',
    certificate_details JSONB DEFAULT '{}',
    
    -- Compliance & Documentation
    compliance_score DECIMAL(5,2), -- from compliance checker
    compliance_issues JSONB DEFAULT '[]',
    submitted_documents JSONB DEFAULT '[]', -- document references
    missing_documents JSONB DEFAULT '[]',
    
    -- Workflow & Assignment
    assigned_to UUID REFERENCES users(id),
    consultant_id UUID REFERENCES users(id), -- external consultant if any
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    last_updated_by UUID REFERENCES users(id)
);

-- =============================================
-- SUBMISSION DOCUMENTS
-- =============================================

CREATE TABLE submission_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES building_submissions(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL, -- architectural_plan, structural_plan, MEP_plan, etc.
    document_category VARCHAR(50) NOT NULL, -- required, supporting, supplementary
    
    -- File Information
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- pdf, dwg, jpg, etc.
    mime_type VARCHAR(100),
    checksum VARCHAR(128), -- for integrity verification
    
    -- Document Details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    drawing_number VARCHAR(100),
    revision VARCHAR(20) DEFAULT '1.0',
    scale VARCHAR(20), -- 1:100, 1:50, etc.
    sheet_number VARCHAR(20),
    total_sheets INTEGER,
    
    -- Authority Requirements
    is_required BOOLEAN DEFAULT true,
    authority_specification TEXT, -- specific authority requirements
    compliance_notes TEXT,
    
    -- Processing Status
    status VARCHAR(30) DEFAULT 'uploaded', -- uploaded, verified, approved, rejected
    verification_status VARCHAR(30), -- format_ok, compliant, non_compliant
    verification_notes TEXT,
    stamped_by VARCHAR(255), -- professional stamp info
    stamp_number VARCHAR(100),
    
    -- Metadata
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- SUBMISSION STATUS HISTORY
-- =============================================

CREATE TABLE submission_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES building_submissions(id) ON DELETE CASCADE,
    
    -- Status Change Details
    previous_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    status_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Change Information
    changed_by UUID REFERENCES users(id),
    change_reason VARCHAR(100),
    comments TEXT,
    authority_reference VARCHAR(100), -- authority's internal reference
    
    -- Additional Data
    metadata JSONB DEFAULT '{}', -- any additional status-specific data
    notification_sent BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- FEE CALCULATIONS & PAYMENTS
-- =============================================

CREATE TABLE submission_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES building_submissions(id) ON DELETE CASCADE,
    
    -- Fee Details
    fee_type VARCHAR(100) NOT NULL, -- submission_fee, processing_fee, inspection_fee, etc.
    fee_category VARCHAR(50) NOT NULL, -- mandatory, optional, penalty
    description VARCHAR(255) NOT NULL,
    
    -- Calculation
    calculation_method VARCHAR(50), -- fixed, area_based, value_based, custom
    base_amount DECIMAL(10,2) DEFAULT 0,
    rate DECIMAL(8,4), -- rate per unit (sqm, value, etc.)
    units DECIMAL(12,2), -- number of units
    calculated_amount DECIMAL(10,2) NOT NULL,
    
    -- Taxes & Additional Charges
    sst_applicable BOOLEAN DEFAULT true,
    sst_rate DECIMAL(5,2) DEFAULT 6.00,
    sst_amount DECIMAL(10,2) DEFAULT 0,
    other_charges DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'calculated', -- calculated, invoiced, paid, waived
    due_date DATE,
    paid_date TIMESTAMP WITH TIME ZONE,
    payment_reference VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- API INTEGRATION LOGS
-- =============================================

CREATE TABLE authority_api_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES building_submissions(id),
    authority_id UUID NOT NULL REFERENCES building_authorities(id),
    
    -- API Call Details
    endpoint VARCHAR(500) NOT NULL,
    method VARCHAR(10) NOT NULL, -- GET, POST, PUT, etc.
    request_headers JSONB,
    request_body JSONB,
    response_status INTEGER,
    response_headers JSONB,
    response_body JSONB,
    
    -- Processing Info
    execution_time_ms INTEGER,
    success BOOLEAN DEFAULT false,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Context
    operation_type VARCHAR(50), -- submit, status_check, document_upload, etc.
    initiated_by UUID REFERENCES users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Building Submissions
CREATE INDEX idx_building_submissions_project_id ON building_submissions(project_id);
CREATE INDEX idx_building_submissions_authority_id ON building_submissions(authority_id);
CREATE INDEX idx_building_submissions_status ON building_submissions(status);
CREATE INDEX idx_building_submissions_submission_date ON building_submissions(submission_date);
CREATE INDEX idx_building_submissions_created_at ON building_submissions(created_at);
CREATE INDEX idx_building_submissions_internal_reference ON building_submissions(internal_reference);

-- Submission Documents
CREATE INDEX idx_submission_documents_submission_id ON submission_documents(submission_id);
CREATE INDEX idx_submission_documents_type ON submission_documents(document_type);
CREATE INDEX idx_submission_documents_status ON submission_documents(status);

-- Status History
CREATE INDEX idx_submission_status_history_submission_id ON submission_status_history(submission_id);
CREATE INDEX idx_submission_status_history_status_date ON submission_status_history(status_date);

-- Fees
CREATE INDEX idx_submission_fees_submission_id ON submission_fees(submission_id);
CREATE INDEX idx_submission_fees_status ON submission_fees(status);

-- API Logs
CREATE INDEX idx_authority_api_logs_submission_id ON authority_api_logs(submission_id);
CREATE INDEX idx_authority_api_logs_authority_id ON authority_api_logs(authority_id);
CREATE INDEX idx_authority_api_logs_created_at ON authority_api_logs(created_at);

-- =============================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_building_authorities_updated_at 
    BEFORE UPDATE ON building_authorities 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submission_categories_updated_at 
    BEFORE UPDATE ON submission_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_building_submissions_updated_at 
    BEFORE UPDATE ON building_submissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submission_documents_updated_at 
    BEFORE UPDATE ON submission_documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submission_fees_updated_at 
    BEFORE UPDATE ON submission_fees 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- INITIAL DATA - MALAYSIAN AUTHORITIES
-- =============================================

-- Insert major Malaysian building authorities
INSERT INTO building_authorities (code, name_en, name_ms, jurisdiction, state_code, contact_info, fee_schedule, requirements) VALUES 
('DBKL', 'Kuala Lumpur City Hall', 'Dewan Bandaraya Kuala Lumpur', 'Kuala Lumpur', 'WP', 
 '{"phone": "+603-2691-6011", "email": "aduan@dbkl.gov.my", "address": "Menara DBKL 1, Jalan Raja Laut, 50350 Kuala Lumpur"}',
 '{"building_permit": {"base_fee": 50, "area_rate": 0.30, "min_fee": 100, "max_fee": 50000}}',
 '{"min_lot_size": 400, "max_coverage": 0.6, "min_setback": 3}'),

('MBSA', 'Selayang Municipal Council', 'Majlis Perbandaran Selayang', 'Selayang', 'SGR',
 '{"phone": "+603-6120-2000", "email": "pro@mbselayang.gov.my", "address": "Kompleks MBSA, Jalan Dato Senu, 68100 Batu Caves"}',
 '{"building_permit": {"base_fee": 40, "area_rate": 0.25, "min_fee": 80, "max_fee": 40000}}',
 '{"min_lot_size": 300, "max_coverage": 0.65, "min_setback": 2.5}'),

('MBPJ', 'Petaling Jaya City Council', 'Majlis Bandaraya Petaling Jaya', 'Petaling Jaya', 'SGR',
 '{"phone": "+603-7954-2020", "email": "pro@mbpj.gov.my", "address": "Menara MBPJ, 46675 Petaling Jaya"}',
 '{"building_permit": {"base_fee": 60, "area_rate": 0.35, "min_fee": 120, "max_fee": 60000}}',
 '{"min_lot_size": 500, "max_coverage": 0.55, "min_setback": 3.5}'),

('MPAJ', 'Ampang Jaya Municipal Council', 'Majlis Perbandaran Ampang Jaya', 'Ampang Jaya', 'SGR',
 '{"phone": "+603-4270-3000", "email": "pro@mpaj.gov.my", "address": "Pejabat MPAJ, Jalan Memanda 9, 68000 Ampang"}',
 '{"building_permit": {"base_fee": 45, "area_rate": 0.28, "min_fee": 90, "max_fee": 35000}}',
 '{"min_lot_size": 350, "max_coverage": 0.62, "min_setback": 3}');

-- Insert common submission categories
INSERT INTO submission_categories (authority_id, code, name_en, name_ms, required_documents, submission_fee, processing_fee) 
SELECT 
    ba.id,
    'BP',
    'Building Plan Approval',
    'Kelulusan Pelan Bangunan',
    '["architectural_plans", "structural_plans", "mep_plans", "site_plan", "location_plan", "building_specification", "calculation_sheets"]',
    CASE ba.code 
        WHEN 'DBKL' THEN 500.00
        WHEN 'MBPJ' THEN 600.00
        WHEN 'MBSA' THEN 400.00
        WHEN 'MPAJ' THEN 450.00
    END,
    CASE ba.code 
        WHEN 'DBKL' THEN 200.00
        WHEN 'MBPJ' THEN 250.00
        WHEN 'MBSA' THEN 150.00
        WHEN 'MPAJ' THEN 180.00
    END
FROM building_authorities ba;

INSERT INTO submission_categories (authority_id, code, name_en, name_ms, required_documents, submission_fee, processing_fee) 
SELECT 
    ba.id,
    'CF',
    'Certificate of Fitness for Occupation',
    'Sijil Siap dan Selamat Menduduki',
    '["building_completion_certificate", "mep_completion_certificate", "site_photos", "as_built_drawings"]',
    CASE ba.code 
        WHEN 'DBKL' THEN 300.00
        WHEN 'MBPJ' THEN 350.00
        WHEN 'MBSA' THEN 250.00
        WHEN 'MPAJ' THEN 280.00
    END,
    CASE ba.code 
        WHEN 'DBKL' THEN 100.00
        WHEN 'MBPJ' THEN 120.00
        WHEN 'MBSA' THEN 80.00
        WHEN 'MPAJ' THEN 90.00
    END
FROM building_authorities ba;

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- Active submissions summary
CREATE OR REPLACE VIEW active_submissions_summary AS
SELECT 
    bs.id,
    bs.internal_reference,
    bs.submission_number,
    p.name as project_name,
    p.client_name,
    ba.name_en as authority_name,
    sc.name_en as category_name,
    bs.status,
    bs.submission_date,
    bs.total_fees,
    bs.payment_status,
    EXTRACT(DAYS FROM CURRENT_TIMESTAMP - bs.submission_date) as days_since_submission,
    sc.typical_processing_days - EXTRACT(DAYS FROM CURRENT_TIMESTAMP - bs.submission_date) as days_remaining
FROM building_submissions bs
JOIN projects p ON bs.project_id = p.id
JOIN building_authorities ba ON bs.authority_id = ba.id
JOIN submission_categories sc ON bs.category_id = sc.id
WHERE bs.status NOT IN ('approved', 'rejected', 'expired', 'withdrawn');

COMMENT ON TABLE building_authorities IS 'Master list of Malaysian building authorities with their contact info and requirements';
COMMENT ON TABLE submission_categories IS 'Types of submissions each authority accepts (BP, CF, CCC, etc.)';
COMMENT ON TABLE building_submissions IS 'Main table for tracking all building authority submissions';
COMMENT ON TABLE submission_documents IS 'Documents attached to each submission with verification status';
COMMENT ON TABLE submission_status_history IS 'Complete audit trail of status changes for submissions';
COMMENT ON TABLE submission_fees IS 'Detailed breakdown of all fees for each submission';
COMMENT ON TABLE authority_api_logs IS 'Logs of all API interactions with building authorities';

-- Migration completed successfully
SELECT 'Authority Submission System schema created successfully' as status;