-- Daritana Architect Management Platform Database Schema
-- PostgreSQL 15+ with advanced features for scalability and compliance

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gist";
CREATE EXTENSION IF NOT EXISTS "postgres_fdw";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create schemas for multi-tenant architecture
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS projects;
CREATE SCHEMA IF NOT EXISTS finance;
CREATE SCHEMA IF NOT EXISTS compliance;
CREATE SCHEMA IF NOT EXISTS documents;
CREATE SCHEMA IF NOT EXISTS integrations;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS ai;

-- Set search path
SET search_path TO core, projects, finance, compliance, documents, integrations, audit, ai, public;

-- ============================================
-- CORE SCHEMA - User Management & Authentication
-- ============================================

-- Organizations (Multi-tenant support)
CREATE TABLE core.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('architecture_firm', 'interior_design', 'contractor', 'client_company')),
    registration_number VARCHAR(100),
    tax_id VARCHAR(50),
    address JSONB,
    contact_info JSONB,
    settings JSONB DEFAULT '{}',
    subscription_tier VARCHAR(50) DEFAULT 'basic',
    subscription_expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_organizations_code ON core.organizations(code);
CREATE INDEX idx_organizations_type ON core.organizations(type);
CREATE INDEX idx_organizations_active ON core.organizations(is_active) WHERE is_active = true;

-- Users with role-based access control
CREATE TABLE core.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES core.organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255),
    role VARCHAR(50) NOT NULL CHECK (role IN ('client', 'staff', 'contractor', 'project_lead', 'designer', 'admin', 'super_admin')),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    display_name VARCHAR(200),
    phone VARCHAR(50),
    ic_number VARCHAR(50), -- Malaysian IC for compliance
    professional_id VARCHAR(100), -- LAM/PAM registration number
    avatar_url TEXT,
    department VARCHAR(100),
    position VARCHAR(100),
    permissions JSONB DEFAULT '[]',
    preferences JSONB DEFAULT '{}',
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ,
    password_changed_at TIMESTAMPTZ,
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON core.users(email);
CREATE INDEX idx_users_organization ON core.users(organization_id);
CREATE INDEX idx_users_role ON core.users(role);
CREATE INDEX idx_users_active ON core.users(is_active) WHERE is_active = true;
CREATE INDEX idx_users_search ON core.users USING gin(to_tsvector('english', COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') || ' ' || COALESCE(email, '')));

-- Authentication sessions
CREATE TABLE core.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    refresh_token_hash VARCHAR(255) UNIQUE,
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    refresh_expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user ON core.sessions(user_id);
CREATE INDEX idx_sessions_token ON core.sessions(token_hash);
CREATE INDEX idx_sessions_expires ON core.sessions(expires_at) WHERE is_active = true;

-- Role permissions mapping
CREATE TABLE core.role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role VARCHAR(50) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    conditions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role, resource, action)
);

CREATE INDEX idx_role_permissions_role ON core.role_permissions(role);

-- ============================================
-- PROJECTS SCHEMA - Project Management
-- ============================================

-- Projects
CREATE TABLE projects.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
    project_code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('residential', 'commercial', 'industrial', 'renovation', 'interior_design', 'landscape')),
    status VARCHAR(50) DEFAULT 'planning' CHECK (status IN ('planning', 'design', 'approval', 'construction', 'completed', 'on_hold', 'cancelled')),
    phase VARCHAR(50),
    client_id UUID REFERENCES core.users(id),
    project_lead_id UUID REFERENCES core.users(id),
    designer_id UUID REFERENCES core.users(id),
    
    -- Location & Site Information
    address JSONB NOT NULL,
    coordinates POINT,
    land_area_sqm DECIMAL(10, 2),
    built_up_area_sqm DECIMAL(10, 2),
    
    -- Timeline
    start_date DATE,
    target_completion_date DATE,
    actual_completion_date DATE,
    
    -- Financial
    budget_amount DECIMAL(15, 2),
    currency VARCHAR(3) DEFAULT 'MYR',
    contract_value DECIMAL(15, 2),
    
    -- Malaysian Compliance
    submission_type VARCHAR(100), -- BP, CCC, etc.
    local_authority VARCHAR(100), -- DBKL, MBPJ, etc.
    approval_status VARCHAR(50),
    approval_reference VARCHAR(100),
    
    -- Documents & Settings
    settings JSONB DEFAULT '{}',
    tags TEXT[],
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    risk_level VARCHAR(20) DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high')),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    is_archived BOOLEAN DEFAULT false,
    created_by UUID REFERENCES core.users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_projects_organization ON projects.projects(organization_id);
CREATE INDEX idx_projects_code ON projects.projects(project_code);
CREATE INDEX idx_projects_status ON projects.projects(status);
CREATE INDEX idx_projects_client ON projects.projects(client_id);
CREATE INDEX idx_projects_lead ON projects.projects(project_lead_id);
CREATE INDEX idx_projects_dates ON projects.projects(start_date, target_completion_date);
CREATE INDEX idx_projects_location ON projects.projects USING gist(coordinates);
CREATE INDEX idx_projects_search ON projects.projects USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Project Team Members
CREATE TABLE projects.project_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    role VARCHAR(100) NOT NULL,
    responsibilities TEXT[],
    access_level VARCHAR(50) DEFAULT 'read' CHECK (access_level IN ('read', 'write', 'admin')),
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, user_id, role)
);

CREATE INDEX idx_project_members_project ON projects.project_members(project_id);
CREATE INDEX idx_project_members_user ON projects.project_members(user_id);

-- Tasks with dependency tracking
CREATE TABLE projects.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects.projects(id) ON DELETE CASCADE,
    parent_task_id UUID REFERENCES projects.tasks(id) ON DELETE CASCADE,
    task_code VARCHAR(100),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'task' CHECK (type IN ('task', 'milestone', 'phase', 'deliverable')),
    status VARCHAR(50) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'blocked', 'completed', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Assignment
    assigned_to UUID REFERENCES core.users(id),
    assigned_by UUID REFERENCES core.users(id),
    
    -- Timeline
    start_date DATE,
    due_date DATE,
    estimated_hours DECIMAL(8, 2),
    actual_hours DECIMAL(8, 2),
    completed_at TIMESTAMPTZ,
    
    -- Progress tracking
    progress_percentage INT DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    checklist JSONB DEFAULT '[]',
    
    -- Dependencies
    dependencies UUID[], -- Array of task IDs this task depends on
    blocks UUID[], -- Array of task IDs this task blocks
    
    -- Location & Context
    location VARCHAR(255),
    tags TEXT[],
    labels JSONB DEFAULT '[]',
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern JSONB,
    created_by UUID REFERENCES core.users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_project ON projects.tasks(project_id);
CREATE INDEX idx_tasks_parent ON projects.tasks(parent_task_id);
CREATE INDEX idx_tasks_assigned ON projects.tasks(assigned_to);
CREATE INDEX idx_tasks_status ON projects.tasks(status);
CREATE INDEX idx_tasks_dates ON projects.tasks(start_date, due_date);
CREATE INDEX idx_tasks_dependencies ON projects.tasks USING gin(dependencies);

-- Design Briefs
CREATE TABLE projects.design_briefs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects.projects(id) ON DELETE CASCADE,
    version INT DEFAULT 1,
    title VARCHAR(255) NOT NULL,
    
    -- Client Requirements
    client_requirements TEXT,
    design_style VARCHAR(100),
    color_preferences TEXT[],
    material_preferences TEXT[],
    
    -- Spatial Requirements
    space_planning JSONB,
    room_requirements JSONB,
    functional_requirements TEXT,
    
    -- Technical Specifications
    technical_specs JSONB,
    sustainability_requirements TEXT,
    accessibility_requirements TEXT,
    
    -- Budget & Timeline
    design_budget DECIMAL(12, 2),
    material_budget DECIMAL(12, 2),
    timeline_requirements TEXT,
    
    -- Inspiration & References
    mood_boards JSONB DEFAULT '[]',
    reference_projects UUID[],
    
    -- Approval
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'revision', 'rejected')),
    approved_by UUID REFERENCES core.users(id),
    approved_at TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES core.users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_design_briefs_project ON projects.design_briefs(project_id);
CREATE INDEX idx_design_briefs_status ON projects.design_briefs(status);

-- Project Timeline & Milestones
CREATE TABLE projects.timelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects.projects(id) ON DELETE CASCADE,
    phase VARCHAR(100) NOT NULL,
    milestone VARCHAR(255) NOT NULL,
    description TEXT,
    planned_start DATE,
    planned_end DATE,
    actual_start DATE,
    actual_end DATE,
    status VARCHAR(50) DEFAULT 'pending',
    dependencies UUID[],
    deliverables JSONB DEFAULT '[]',
    responsible_party UUID REFERENCES core.users(id),
    approval_required BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES core.users(id),
    approved_at TIMESTAMPTZ,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_timelines_project ON projects.timelines(project_id);
CREATE INDEX idx_timelines_dates ON projects.timelines(planned_start, planned_end);

-- ============================================
-- FINANCE SCHEMA - Financial Management
-- ============================================

-- Quotations
CREATE TABLE finance.quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES core.organizations(id),
    project_id UUID REFERENCES projects.projects(id),
    quotation_number VARCHAR(100) UNIQUE NOT NULL,
    version INT DEFAULT 1,
    client_id UUID REFERENCES core.users(id),
    
    -- Financial Details
    items JSONB NOT NULL DEFAULT '[]',
    subtotal DECIMAL(15, 2) NOT NULL,
    tax_rate DECIMAL(5, 2) DEFAULT 0,
    tax_amount DECIMAL(15, 2) DEFAULT 0,
    discount_rate DECIMAL(5, 2) DEFAULT 0,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    total_amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'MYR',
    
    -- Terms & Conditions
    payment_terms TEXT,
    validity_period INT DEFAULT 30, -- days
    valid_until DATE,
    terms_conditions TEXT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'revised')),
    sent_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    -- Metadata
    notes TEXT,
    internal_notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES core.users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quotations_organization ON finance.quotations(organization_id);
CREATE INDEX idx_quotations_project ON finance.quotations(project_id);
CREATE INDEX idx_quotations_number ON finance.quotations(quotation_number);
CREATE INDEX idx_quotations_client ON finance.quotations(client_id);
CREATE INDEX idx_quotations_status ON finance.quotations(status);

-- Invoices
CREATE TABLE finance.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES core.organizations(id),
    project_id UUID REFERENCES projects.projects(id),
    quotation_id UUID REFERENCES finance.quotations(id),
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    client_id UUID REFERENCES core.users(id),
    
    -- Financial Details
    items JSONB NOT NULL DEFAULT '[]',
    subtotal DECIMAL(15, 2) NOT NULL,
    tax_rate DECIMAL(5, 2) DEFAULT 0,
    tax_amount DECIMAL(15, 2) DEFAULT 0,
    total_amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'MYR',
    
    -- Payment Information
    payment_terms VARCHAR(100),
    due_date DATE,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'cancelled', 'refunded')),
    paid_amount DECIMAL(15, 2) DEFAULT 0,
    balance_amount DECIMAL(15, 2),
    
    -- Dates
    issued_date DATE,
    sent_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    
    -- Malaysian Tax Compliance
    sst_registered BOOLEAN DEFAULT false,
    sst_number VARCHAR(50),
    
    -- Metadata
    notes TEXT,
    internal_notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES core.users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoices_organization ON finance.invoices(organization_id);
CREATE INDEX idx_invoices_project ON finance.invoices(project_id);
CREATE INDEX idx_invoices_number ON finance.invoices(invoice_number);
CREATE INDEX idx_invoices_client ON finance.invoices(client_id);
CREATE INDEX idx_invoices_status ON finance.invoices(status);
CREATE INDEX idx_invoices_due ON finance.invoices(due_date) WHERE status NOT IN ('paid', 'cancelled');

-- Payments
CREATE TABLE finance.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES core.organizations(id),
    invoice_id UUID REFERENCES finance.invoices(id),
    payment_number VARCHAR(100) UNIQUE NOT NULL,
    
    -- Payment Details
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'MYR',
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('bank_transfer', 'cheque', 'cash', 'credit_card', 'fpx', 'jompay', 'ewallet', 'other')),
    payment_date DATE NOT NULL,
    
    -- Transaction Details
    transaction_id VARCHAR(255),
    bank_reference VARCHAR(255),
    payment_gateway VARCHAR(50),
    gateway_response JSONB,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    
    -- Receipt
    receipt_number VARCHAR(100),
    receipt_url TEXT,
    
    -- Metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES core.users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_organization ON finance.payments(organization_id);
CREATE INDEX idx_payments_invoice ON finance.payments(invoice_id);
CREATE INDEX idx_payments_date ON finance.payments(payment_date);
CREATE INDEX idx_payments_method ON finance.payments(payment_method);

-- ============================================
-- COMPLIANCE SCHEMA - Malaysian Regulatory Compliance
-- ============================================

-- Building Code Compliance (UBBL)
CREATE TABLE compliance.ubbl_checklist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects.projects(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    clause_number VARCHAR(50) NOT NULL,
    clause_title VARCHAR(255) NOT NULL,
    description TEXT,
    requirement TEXT NOT NULL,
    compliance_status VARCHAR(50) DEFAULT 'pending' CHECK (compliance_status IN ('pending', 'compliant', 'non_compliant', 'not_applicable', 'in_progress')),
    evidence_required TEXT[],
    evidence_provided JSONB DEFAULT '[]',
    reviewed_by UUID REFERENCES core.users(id),
    reviewed_at TIMESTAMPTZ,
    comments TEXT,
    action_required TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ubbl_project ON compliance.ubbl_checklist(project_id);
CREATE INDEX idx_ubbl_status ON compliance.ubbl_checklist(compliance_status);
CREATE INDEX idx_ubbl_category ON compliance.ubbl_checklist(category);

-- Authority Submissions
CREATE TABLE compliance.authority_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects.projects(id) ON DELETE CASCADE,
    submission_type VARCHAR(100) NOT NULL, -- BP, CCC, CP, OP, etc.
    authority VARCHAR(100) NOT NULL, -- DBKL, MBPJ, MBSA, etc.
    reference_number VARCHAR(100),
    
    -- Submission Details
    submission_date DATE,
    submission_method VARCHAR(50), -- online, physical, hybrid
    portal_reference VARCHAR(100), -- OSC reference number
    
    -- Documents
    required_documents JSONB DEFAULT '[]',
    submitted_documents JSONB DEFAULT '[]',
    
    -- Status & Timeline
    status VARCHAR(50) DEFAULT 'preparing' CHECK (status IN ('preparing', 'submitted', 'in_review', 'rfi', 'approved', 'rejected', 'appealing')),
    current_stage VARCHAR(100),
    expected_approval_date DATE,
    actual_approval_date DATE,
    
    -- Fees
    submission_fee DECIMAL(10, 2),
    processing_fee DECIMAL(10, 2),
    total_fee DECIMAL(10, 2),
    payment_reference VARCHAR(100),
    
    -- Comments & Follow-ups
    authority_comments TEXT,
    rfi_details JSONB DEFAULT '[]', -- Request for Information
    internal_notes TEXT,
    
    -- Approval Details
    approval_number VARCHAR(100),
    approval_conditions TEXT[],
    validity_period INT, -- months
    expires_at DATE,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES core.users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_submissions_project ON compliance.authority_submissions(project_id);
CREATE INDEX idx_submissions_type ON compliance.authority_submissions(submission_type);
CREATE INDEX idx_submissions_authority ON compliance.authority_submissions(authority);
CREATE INDEX idx_submissions_status ON compliance.authority_submissions(status);

-- Professional Board Compliance (LAM/PAM)
CREATE TABLE compliance.professional_compliance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects.projects(id),
    board VARCHAR(50) NOT NULL CHECK (board IN ('LAM', 'PAM', 'BEM', 'BQSM')),
    registration_number VARCHAR(100),
    scale_of_fees_version VARCHAR(50),
    fee_calculation JSONB,
    compliance_checklist JSONB DEFAULT '[]',
    submitted_by UUID REFERENCES core.users(id),
    submitted_at TIMESTAMPTZ,
    approved_by VARCHAR(255),
    approved_at TIMESTAMPTZ,
    certificate_number VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_prof_compliance_project ON compliance.professional_compliance(project_id);
CREATE INDEX idx_prof_compliance_board ON compliance.professional_compliance(board);

-- ============================================
-- DOCUMENTS SCHEMA - Document Management
-- ============================================

-- Documents with version control
CREATE TABLE documents.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES core.organizations(id),
    project_id UUID REFERENCES projects.projects(id),
    parent_id UUID REFERENCES documents.documents(id), -- For versioning
    
    -- Document Information
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- drawing, report, contract, permit, etc.
    category VARCHAR(100),
    mime_type VARCHAR(100),
    file_size BIGINT,
    
    -- Storage
    storage_provider VARCHAR(50) DEFAULT 's3', -- s3, gcs, local, gdrive
    storage_path TEXT NOT NULL,
    storage_url TEXT,
    thumbnail_url TEXT,
    
    -- Version Control
    version VARCHAR(50) DEFAULT '1.0',
    is_latest BOOLEAN DEFAULT true,
    version_notes TEXT,
    
    -- Security
    access_level VARCHAR(50) DEFAULT 'private', -- public, private, restricted
    encryption_key VARCHAR(255),
    checksum VARCHAR(255),
    
    -- Metadata & Search
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    ocr_text TEXT, -- For searchability
    search_vector tsvector,
    
    -- Sharing & Collaboration
    shared_with UUID[], -- User IDs
    share_link VARCHAR(255),
    share_expires_at TIMESTAMPTZ,
    
    -- Audit
    uploaded_by UUID REFERENCES core.users(id),
    last_accessed_by UUID REFERENCES core.users(id),
    last_accessed_at TIMESTAMPTZ,
    download_count INT DEFAULT 0,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted', 'processing')),
    deleted_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documents_organization ON documents.documents(organization_id);
CREATE INDEX idx_documents_project ON documents.documents(project_id);
CREATE INDEX idx_documents_type ON documents.documents(type);
CREATE INDEX idx_documents_latest ON documents.documents(is_latest) WHERE is_latest = true;
CREATE INDEX idx_documents_search ON documents.documents USING gin(search_vector);
CREATE INDEX idx_documents_tags ON documents.documents USING gin(tags);

-- Document Approvals
CREATE TABLE documents.approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents.documents(id),
    approver_id UUID NOT NULL REFERENCES core.users(id),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'conditional')),
    comments TEXT,
    conditions TEXT,
    approved_at TIMESTAMPTZ,
    signature_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(document_id, approver_id)
);

CREATE INDEX idx_approvals_document ON documents.approvals(document_id);
CREATE INDEX idx_approvals_approver ON documents.approvals(approver_id);
CREATE INDEX idx_approvals_status ON documents.approvals(status);

-- ============================================
-- INTEGRATIONS SCHEMA - External System Integrations
-- ============================================

-- Google Drive Integration
CREATE TABLE integrations.google_drive (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES core.users(id),
    organization_id UUID NOT NULL REFERENCES core.organizations(id),
    
    -- OAuth Credentials
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    
    -- Drive Information
    drive_email VARCHAR(255),
    root_folder_id VARCHAR(255),
    project_folders JSONB DEFAULT '{}', -- project_id -> folder_id mapping
    
    -- Sync Settings
    sync_enabled BOOLEAN DEFAULT true,
    sync_frequency VARCHAR(50) DEFAULT 'realtime', -- realtime, hourly, daily
    last_sync_at TIMESTAMPTZ,
    sync_status VARCHAR(50) DEFAULT 'idle',
    
    -- Permissions
    permissions TEXT[],
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_gdrive_user ON integrations.google_drive(user_id);
CREATE INDEX idx_gdrive_organization ON integrations.google_drive(organization_id);

-- WhatsApp Business Integration
CREATE TABLE integrations.whatsapp (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES core.organizations(id),
    
    -- API Credentials
    phone_number_id VARCHAR(100),
    business_account_id VARCHAR(100),
    access_token TEXT,
    webhook_verify_token VARCHAR(255),
    
    -- Configuration
    default_template_namespace VARCHAR(255),
    templates JSONB DEFAULT '{}',
    
    -- Status
    status VARCHAR(50) DEFAULT 'inactive',
    last_webhook_at TIMESTAMPTZ,
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_whatsapp_organization ON integrations.whatsapp(organization_id);

-- Telegram Integration
CREATE TABLE integrations.telegram (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES core.organizations(id),
    
    -- Bot Configuration
    bot_token TEXT,
    bot_username VARCHAR(100),
    webhook_url TEXT,
    
    -- Channels & Groups
    channels JSONB DEFAULT '[]',
    notification_chat_id VARCHAR(100),
    
    -- Status
    status VARCHAR(50) DEFAULT 'inactive',
    last_webhook_at TIMESTAMPTZ,
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_telegram_organization ON integrations.telegram(organization_id);

-- Payment Gateway Integration
CREATE TABLE integrations.payment_gateways (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES core.organizations(id),
    
    -- Gateway Information
    provider VARCHAR(50) NOT NULL, -- stripe, fpx, jompay, ipay88, etc.
    merchant_id VARCHAR(255),
    
    -- Credentials (encrypted)
    api_key_encrypted TEXT,
    secret_key_encrypted TEXT,
    webhook_secret TEXT,
    
    -- Configuration
    currency VARCHAR(3) DEFAULT 'MYR',
    test_mode BOOLEAN DEFAULT true,
    auto_capture BOOLEAN DEFAULT true,
    webhook_url TEXT,
    
    -- FPX Specific
    fpx_seller_id VARCHAR(100),
    fpx_exchange_id VARCHAR(100),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_webhook_at TIMESTAMPTZ,
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_gateways_organization ON integrations.payment_gateways(organization_id);
CREATE INDEX idx_payment_gateways_provider ON integrations.payment_gateways(provider);

-- ============================================
-- AUDIT SCHEMA - Audit Trails & Logging
-- ============================================

-- Audit Logs
CREATE TABLE audit.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES core.organizations(id),
    user_id UUID REFERENCES core.users(id),
    
    -- Action Information
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    resource_name VARCHAR(255),
    
    -- Change Details
    old_values JSONB,
    new_values JSONB,
    changes JSONB,
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    session_id UUID,
    request_id VARCHAR(100),
    
    -- Result
    status VARCHAR(50) DEFAULT 'success',
    error_message TEXT,
    
    -- Compliance
    requires_review BOOLEAN DEFAULT false,
    reviewed_by UUID REFERENCES core.users(id),
    reviewed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_organization ON audit.audit_logs(organization_id);
CREATE INDEX idx_audit_user ON audit.audit_logs(user_id);
CREATE INDEX idx_audit_resource ON audit.audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_action ON audit.audit_logs(action);
CREATE INDEX idx_audit_created ON audit.audit_logs(created_at DESC);

-- Data Privacy Logs (PDPA Compliance)
CREATE TABLE audit.privacy_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES core.users(id),
    
    -- Request Information
    request_type VARCHAR(50) NOT NULL, -- access, rectification, deletion, portability
    request_details JSONB,
    
    -- Processing
    status VARCHAR(50) DEFAULT 'pending',
    processed_by UUID REFERENCES core.users(id),
    processed_at TIMESTAMPTZ,
    
    -- Response
    response_details JSONB,
    data_provided JSONB,
    
    -- Compliance
    pdpa_article VARCHAR(50),
    retention_period INT, -- days
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_privacy_user ON audit.privacy_logs(user_id);
CREATE INDEX idx_privacy_type ON audit.privacy_logs(request_type);
CREATE INDEX idx_privacy_status ON audit.privacy_logs(status);

-- ============================================
-- AI SCHEMA - AI Assistant & Automation
-- ============================================

-- AI Conversations
CREATE TABLE ai.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES core.users(id),
    project_id UUID REFERENCES projects.projects(id),
    
    -- Conversation Details
    title VARCHAR(255),
    context VARCHAR(100), -- project_planning, design_review, compliance_check, etc.
    model VARCHAR(50) DEFAULT 'gpt-4',
    
    -- Messages
    messages JSONB DEFAULT '[]',
    total_tokens INT DEFAULT 0,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active',
    last_message_at TIMESTAMPTZ,
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_conversations_user ON ai.conversations(user_id);
CREATE INDEX idx_ai_conversations_project ON ai.conversations(project_id);

-- AI Templates
CREATE TABLE ai.templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES core.organizations(id),
    
    -- Template Information
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Template Content
    prompt_template TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    example_output TEXT,
    
    -- Configuration
    model_config JSONB DEFAULT '{}',
    max_tokens INT DEFAULT 2000,
    temperature DECIMAL(3, 2) DEFAULT 0.7,
    
    -- Usage
    usage_count INT DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT false,
    
    created_by UUID REFERENCES core.users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_templates_organization ON ai.templates(organization_id);
CREATE INDEX idx_ai_templates_category ON ai.templates(category);

-- Daily Operations Automation
CREATE TABLE ai.daily_operations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES core.organizations(id),
    
    -- Operation Type
    operation_type VARCHAR(50) NOT NULL, -- morning_todo, evening_evidence, daily_review
    scheduled_time TIME NOT NULL,
    timezone VARCHAR(50) DEFAULT 'Asia/Kuala_Lumpur',
    
    -- Configuration
    enabled BOOLEAN DEFAULT true,
    recipients UUID[], -- User IDs
    channels JSONB DEFAULT '{}', -- email, whatsapp, telegram settings
    
    -- Template
    template_id UUID REFERENCES ai.templates(id),
    custom_prompt TEXT,
    
    -- Execution
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    run_count INT DEFAULT 0,
    
    -- Results
    last_result JSONB,
    success_rate DECIMAL(5, 2),
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_daily_operations_organization ON ai.daily_operations(organization_id);
CREATE INDEX idx_daily_operations_type ON ai.daily_operations(operation_type);
CREATE INDEX idx_daily_operations_next_run ON ai.daily_operations(next_run_at) WHERE enabled = true;

-- ============================================
-- NOTIFICATIONS & COMMUNICATIONS
-- ============================================

-- Notifications
CREATE TABLE core.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES core.users(id),
    
    -- Notification Details
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    
    -- Context
    resource_type VARCHAR(50),
    resource_id UUID,
    action_url TEXT,
    
    -- Delivery
    channels TEXT[] DEFAULT ARRAY['in_app'], -- in_app, email, sms, whatsapp, telegram
    priority VARCHAR(20) DEFAULT 'normal',
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    is_archived BOOLEAN DEFAULT false,
    
    -- Scheduling
    scheduled_for TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON core.notifications(user_id);
CREATE INDEX idx_notifications_unread ON core.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_scheduled ON core.notifications(scheduled_for) WHERE sent_at IS NULL;

-- Comments & Discussions
CREATE TABLE core.comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Polymorphic association
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID NOT NULL,
    
    -- Comment Details
    user_id UUID NOT NULL REFERENCES core.users(id),
    parent_comment_id UUID REFERENCES core.comments(id),
    content TEXT NOT NULL,
    
    -- Mentions & Tags
    mentions UUID[], -- User IDs
    tags TEXT[],
    
    -- Attachments
    attachments JSONB DEFAULT '[]',
    
    -- Reactions
    reactions JSONB DEFAULT '{}',
    
    -- Status
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comments_resource ON core.comments(resource_type, resource_id);
CREATE INDEX idx_comments_user ON core.comments(user_id);
CREATE INDEX idx_comments_parent ON core.comments(parent_comment_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to all tables with updated_at
DO $$
DECLARE
    t record;
BEGIN
    FOR t IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname IN ('core', 'projects', 'finance', 'compliance', 'documents', 'integrations', 'audit', 'ai')
        AND EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = pg_tables.schemaname 
            AND table_name = pg_tables.tablename 
            AND column_name = 'updated_at'
        )
    LOOP
        EXECUTE format('
            CREATE TRIGGER update_%I_%I_updated_at 
            BEFORE UPDATE ON %I.%I 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at()',
            t.schemaname, t.tablename, t.schemaname, t.tablename
        );
    END LOOP;
END;
$$;

-- Function to generate project codes
CREATE OR REPLACE FUNCTION generate_project_code(org_code VARCHAR, project_type VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    year_code VARCHAR;
    sequence_num INT;
    type_code VARCHAR;
BEGIN
    year_code := TO_CHAR(CURRENT_DATE, 'YY');
    
    type_code := CASE project_type
        WHEN 'residential' THEN 'RES'
        WHEN 'commercial' THEN 'COM'
        WHEN 'industrial' THEN 'IND'
        WHEN 'renovation' THEN 'REN'
        WHEN 'interior_design' THEN 'INT'
        WHEN 'landscape' THEN 'LAN'
        ELSE 'PRJ'
    END;
    
    SELECT COUNT(*) + 1 INTO sequence_num
    FROM projects.projects
    WHERE organization_id = (SELECT id FROM core.organizations WHERE code = org_code)
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);
    
    RETURN UPPER(org_code || '-' || type_code || '-' || year_code || '-' || LPAD(sequence_num::TEXT, 4, '0'));
END;
$$ LANGUAGE plpgsql;

-- Function to check user permissions
CREATE OR REPLACE FUNCTION check_user_permission(
    user_id UUID,
    resource VARCHAR,
    action VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
    user_role VARCHAR;
    has_permission BOOLEAN;
BEGIN
    SELECT role INTO user_role FROM core.users WHERE id = user_id;
    
    SELECT EXISTS(
        SELECT 1 
        FROM core.role_permissions 
        WHERE role = user_role 
        AND resource = resource 
        AND action = action
    ) INTO has_permission;
    
    RETURN has_permission;
END;
$$ LANGUAGE plpgsql;

-- Function for full-text search
CREATE OR REPLACE FUNCTION search_documents(search_query TEXT)
RETURNS TABLE(
    id UUID,
    name VARCHAR,
    type VARCHAR,
    project_id UUID,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.name,
        d.type,
        d.project_id,
        ts_rank(d.search_vector, plainto_tsquery('english', search_query)) AS rank
    FROM documents.documents d
    WHERE d.search_vector @@ plainto_tsquery('english', search_query)
    ORDER BY rank DESC
    LIMIT 100;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Partial indexes for common queries
CREATE INDEX idx_projects_active_by_org ON projects.projects(organization_id, status) 
WHERE is_active = true AND is_archived = false;

CREATE INDEX idx_tasks_open_by_assignee ON projects.tasks(assigned_to, due_date) 
WHERE status NOT IN ('completed', 'cancelled');

CREATE INDEX idx_invoices_unpaid ON finance.invoices(organization_id, due_date) 
WHERE status NOT IN ('paid', 'cancelled');

-- BRIN indexes for time-series data
CREATE INDEX idx_audit_logs_created_brin ON audit.audit_logs USING brin(created_at);
CREATE INDEX idx_notifications_created_brin ON core.notifications USING brin(created_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on sensitive tables
ALTER TABLE core.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents.documents ENABLE ROW LEVEL SECURITY;

-- Create policies (example for projects)
CREATE POLICY project_access ON projects.projects
    FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM core.users 
            WHERE id = current_setting('app.current_user_id')::UUID
        )
        OR 
        id IN (
            SELECT project_id 
            FROM projects.project_members 
            WHERE user_id = current_setting('app.current_user_id')::UUID
            AND is_active = true
        )
    );

-- ============================================
-- INITIAL DATA & PERMISSIONS
-- ============================================

-- Insert default role permissions
INSERT INTO core.role_permissions (role, resource, action) VALUES
-- Admin permissions
('admin', 'users', 'create'),
('admin', 'users', 'read'),
('admin', 'users', 'update'),
('admin', 'users', 'delete'),
('admin', 'projects', 'create'),
('admin', 'projects', 'read'),
('admin', 'projects', 'update'),
('admin', 'projects', 'delete'),
('admin', 'invoices', 'create'),
('admin', 'invoices', 'read'),
('admin', 'invoices', 'update'),
('admin', 'invoices', 'delete'),

-- Project Lead permissions
('project_lead', 'projects', 'create'),
('project_lead', 'projects', 'read'),
('project_lead', 'projects', 'update'),
('project_lead', 'tasks', 'create'),
('project_lead', 'tasks', 'read'),
('project_lead', 'tasks', 'update'),
('project_lead', 'tasks', 'delete'),
('project_lead', 'documents', 'create'),
('project_lead', 'documents', 'read'),
('project_lead', 'documents', 'update'),

-- Designer permissions
('designer', 'projects', 'read'),
('designer', 'design_briefs', 'create'),
('designer', 'design_briefs', 'read'),
('designer', 'design_briefs', 'update'),
('designer', 'documents', 'create'),
('designer', 'documents', 'read'),
('designer', 'tasks', 'read'),
('designer', 'tasks', 'update'),

-- Staff permissions
('staff', 'projects', 'read'),
('staff', 'tasks', 'read'),
('staff', 'tasks', 'update'),
('staff', 'documents', 'read'),
('staff', 'documents', 'create'),

-- Contractor permissions
('contractor', 'projects', 'read'),
('contractor', 'tasks', 'read'),
('contractor', 'tasks', 'update'),
('contractor', 'documents', 'read'),

-- Client permissions
('client', 'projects', 'read'),
('client', 'invoices', 'read'),
('client', 'documents', 'read'),
('client', 'design_briefs', 'read'),
('client', 'comments', 'create'),
('client', 'comments', 'read');

-- ============================================
-- MAINTENANCE & OPTIMIZATION
-- ============================================

-- Create maintenance function for cleaning old sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM core.sessions 
    WHERE expires_at < CURRENT_TIMESTAMP 
    AND is_active = true;
    
    UPDATE core.sessions 
    SET is_active = false 
    WHERE refresh_expires_at < CURRENT_TIMESTAMP 
    AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Create function for archiving old audit logs
CREATE OR REPLACE FUNCTION archive_old_audit_logs()
RETURNS void AS $$
BEGIN
    -- Move logs older than 6 months to archive table
    INSERT INTO audit.audit_logs_archive
    SELECT * FROM audit.audit_logs
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '6 months';
    
    DELETE FROM audit.audit_logs
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '6 months';
END;
$$ LANGUAGE plpgsql;

-- Add table comments for documentation
COMMENT ON TABLE core.organizations IS 'Multi-tenant organizations for architecture and design firms';
COMMENT ON TABLE core.users IS 'System users with role-based access control';
COMMENT ON TABLE projects.projects IS 'Architecture and design projects with Malaysian compliance tracking';
COMMENT ON TABLE compliance.ubbl_checklist IS 'Uniform Building By-Laws compliance checklist for Malaysian projects';
COMMENT ON TABLE compliance.authority_submissions IS 'Tracking submissions to Malaysian local authorities (DBKL, MBPJ, etc.)';
COMMENT ON TABLE finance.invoices IS 'Invoice management with Malaysian tax compliance (SST)';
COMMENT ON TABLE ai.daily_operations IS 'Automated daily operations including 8AM todo lists and 6PM evidence collection';

-- Grant permissions to application role
GRANT USAGE ON SCHEMA core, projects, finance, compliance, documents, integrations, audit, ai TO daritana_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA core, projects, finance, compliance, documents, integrations, audit, ai TO daritana_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA core, projects, finance, compliance, documents, integrations, audit, ai TO daritana_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA core, projects, finance, compliance, documents, integrations, audit, ai TO daritana_app;