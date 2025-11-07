-- Document Management System Schema
-- Comprehensive document storage and versioning for Malaysian architecture projects

-- =====================================================
-- DOCUMENT STORAGE
-- =====================================================

-- Document Categories
CREATE TABLE document_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_ms VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES document_categories(id),
    icon VARCHAR(50),
    color VARCHAR(7),
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_system BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Main Documents Table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    category_id UUID REFERENCES document_categories(id),
    parent_document_id UUID REFERENCES documents(id), -- For document relationships
    
    -- Document Metadata
    title VARCHAR(500) NOT NULL,
    description TEXT,
    document_number VARCHAR(100), -- Drawing number, spec number, etc.
    document_type VARCHAR(50) NOT NULL, -- drawing, specification, report, contract, etc.
    file_format VARCHAR(20) NOT NULL, -- pdf, dwg, docx, xlsx, jpg, etc.
    
    -- File Information
    file_name VARCHAR(500) NOT NULL,
    file_path TEXT NOT NULL, -- S3 or local storage path
    file_size BIGINT NOT NULL, -- in bytes
    mime_type VARCHAR(100),
    checksum VARCHAR(64), -- SHA-256 hash for integrity
    
    -- Drawing Specific Fields
    drawing_type VARCHAR(50), -- architectural, structural, mep, site, etc.
    drawing_scale VARCHAR(20), -- 1:100, 1:50, etc.
    sheet_number VARCHAR(20),
    total_sheets INTEGER,
    revision VARCHAR(20),
    discipline VARCHAR(50), -- A, C, S, M, E, etc.
    
    -- Document Status
    status VARCHAR(50) DEFAULT 'draft', -- draft, for_review, approved, superseded, archived
    approval_status VARCHAR(50), -- pending, approved, rejected, conditional
    approval_date TIMESTAMP,
    approved_by UUID REFERENCES users(id),
    
    -- Access Control
    visibility VARCHAR(20) DEFAULT 'private', -- public, private, team, client
    is_confidential BOOLEAN DEFAULT FALSE,
    access_level VARCHAR(20) DEFAULT 'view', -- view, edit, admin
    password_protected BOOLEAN DEFAULT FALSE,
    password_hash VARCHAR(255),
    
    -- Versioning
    version_number VARCHAR(20) DEFAULT '1.0',
    is_latest_version BOOLEAN DEFAULT TRUE,
    version_notes TEXT,
    
    -- Metadata
    tags TEXT[], -- Array of tags
    custom_metadata JSONB, -- Flexible metadata storage
    ocr_text TEXT, -- Extracted text for searchability
    thumbnail_path TEXT,
    preview_path TEXT,
    
    -- Compliance & Legal
    retention_period_months INTEGER,
    disposal_date DATE,
    legal_hold BOOLEAN DEFAULT FALSE,
    compliance_checked BOOLEAN DEFAULT FALSE,
    compliance_notes TEXT,
    
    -- Timestamps and Tracking
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP,
    deleted_by UUID REFERENCES users(id)
);

-- Document Versions Table
CREATE TABLE document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    version_number VARCHAR(20) NOT NULL,
    
    -- Version File Info
    file_name VARCHAR(500) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    checksum VARCHAR(64),
    
    -- Version Metadata
    change_summary TEXT,
    change_type VARCHAR(50), -- major, minor, patch
    revision_notes TEXT,
    
    -- Version Status
    status VARCHAR(50) DEFAULT 'active',
    is_major_version BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    
    UNIQUE(document_id, version_number)
);

-- Document Access Log
CREATE TABLE document_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL, -- view, download, print, edit, delete, share
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    access_granted BOOLEAN DEFAULT TRUE,
    denial_reason VARCHAR(255),
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document Shares
CREATE TABLE document_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    shared_by UUID REFERENCES users(id),
    shared_with_email VARCHAR(255),
    shared_with_user_id UUID REFERENCES users(id),
    
    -- Share Settings
    permission_level VARCHAR(20) NOT NULL, -- view, comment, edit
    can_download BOOLEAN DEFAULT TRUE,
    can_print BOOLEAN DEFAULT TRUE,
    can_reshare BOOLEAN DEFAULT FALSE,
    
    -- Share Link
    share_token VARCHAR(255) UNIQUE,
    share_link TEXT,
    password_protected BOOLEAN DEFAULT FALSE,
    password_hash VARCHAR(255),
    
    -- Expiration
    expires_at TIMESTAMP,
    max_views INTEGER,
    current_views INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active',
    revoked_at TIMESTAMP,
    revoked_by UUID REFERENCES users(id),
    revoke_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP
);

-- Document Comments
CREATE TABLE document_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES document_comments(id),
    user_id UUID REFERENCES users(id),
    
    -- Comment Content
    comment_text TEXT NOT NULL,
    comment_type VARCHAR(20) DEFAULT 'general', -- general, technical, approval, revision
    
    -- For Drawing Annotations
    annotation_data JSONB, -- Stores coordinates, shapes, etc.
    page_number INTEGER,
    x_coordinate DECIMAL(10,2),
    y_coordinate DECIMAL(10,2),
    
    -- Status
    status VARCHAR(20) DEFAULT 'active',
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Document Tags
CREATE TABLE document_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50), -- project, technical, compliance, etc.
    color VARCHAR(7),
    description TEXT,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document Tag Associations
CREATE TABLE document_tag_associations (
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES document_tags(id) ON DELETE CASCADE,
    added_by UUID REFERENCES users(id),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (document_id, tag_id)
);

-- Document Templates
CREATE TABLE document_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES document_categories(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_type VARCHAR(50), -- contract, report, specification, etc.
    
    -- Template File
    file_path TEXT,
    file_format VARCHAR(20),
    
    -- Template Variables
    variables JSONB, -- {variable_name: description}
    sample_data JSONB,
    
    -- Usage
    usage_count INTEGER DEFAULT 0,
    is_default BOOLEAN DEFAULT FALSE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document Workflows
CREATE TABLE document_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    workflow_type VARCHAR(50) NOT NULL, -- approval, review, distribution
    
    -- Workflow Status
    status VARCHAR(50) DEFAULT 'pending',
    current_step INTEGER DEFAULT 1,
    total_steps INTEGER NOT NULL,
    
    -- Workflow Data
    workflow_data JSONB, -- Stores step details, approvers, etc.
    
    -- Timestamps
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_by UUID REFERENCES users(id),
    completed_at TIMESTAMP,
    completed_by UUID REFERENCES users(id),
    due_date TIMESTAMP
);

-- Document Workflow Steps
CREATE TABLE document_workflow_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES document_workflows(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    step_type VARCHAR(50) NOT NULL, -- review, approve, sign, notify
    
    -- Step Assignment
    assigned_to UUID REFERENCES users(id),
    assigned_role VARCHAR(50),
    
    -- Step Status
    status VARCHAR(50) DEFAULT 'pending',
    action_taken VARCHAR(50), -- approved, rejected, returned
    comments TEXT,
    
    -- Timestamps
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    due_date TIMESTAMP,
    reminder_sent_at TIMESTAMP
);

-- Full Text Search Index
CREATE TABLE document_search_index (
    document_id UUID PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
    search_vector tsvector,
    content_text TEXT, -- Combined searchable text
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_documents_project_id ON documents(project_id);
CREATE INDEX idx_documents_category_id ON documents(category_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_document_type ON documents(document_type);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX idx_documents_tags ON documents USING GIN(tags);
CREATE INDEX idx_documents_custom_metadata ON documents USING GIN(custom_metadata);

CREATE INDEX idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX idx_document_access_logs_document_id ON document_access_logs(document_id);
CREATE INDEX idx_document_access_logs_user_id ON document_access_logs(user_id);
CREATE INDEX idx_document_access_logs_accessed_at ON document_access_logs(accessed_at DESC);

CREATE INDEX idx_document_shares_document_id ON document_shares(document_id);
CREATE INDEX idx_document_shares_share_token ON document_shares(share_token);
CREATE INDEX idx_document_shares_expires_at ON document_shares(expires_at);

CREATE INDEX idx_document_comments_document_id ON document_comments(document_id);
CREATE INDEX idx_document_comments_user_id ON document_comments(user_id);

CREATE INDEX idx_document_search_vector ON document_search_index USING GIN(search_vector);

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert Document Categories
INSERT INTO document_categories (code, name_en, name_ms, icon, color, sort_order, is_system) VALUES
('ARCH', 'Architectural Drawings', 'Lukisan Seni Bina', 'building', '#3B82F6', 1, true),
('STRUCT', 'Structural Drawings', 'Lukisan Struktur', 'layers', '#EF4444', 2, true),
('MEP', 'MEP Drawings', 'Lukisan MEP', 'zap', '#10B981', 3, true),
('SITE', 'Site Plans', 'Pelan Tapak', 'map-pin', '#F59E0B', 4, true),
('SPEC', 'Specifications', 'Spesifikasi', 'file-text', '#6366F1', 5, true),
('CONTRACT', 'Contracts', 'Kontrak', 'file-signature', '#8B5CF6', 6, true),
('REPORT', 'Reports', 'Laporan', 'clipboard-list', '#EC4899', 7, true),
('CERT', 'Certificates', 'Sijil', 'award', '#14B8A6', 8, true),
('CORR', 'Correspondence', 'Surat-menyurat', 'mail', '#F97316', 9, true),
('PHOTO', 'Photos', 'Gambar', 'camera', '#84CC16', 10, true);

-- Insert Common Document Tags
INSERT INTO document_tags (name, slug, category, color) VALUES
('For Approval', 'for-approval', 'workflow', '#EF4444'),
('Approved', 'approved', 'workflow', '#10B981'),
('Revision Required', 'revision-required', 'workflow', '#F59E0B'),
('Superseded', 'superseded', 'status', '#6B7280'),
('As-Built', 'as-built', 'technical', '#3B82F6'),
('Preliminary', 'preliminary', 'status', '#F97316'),
('Final', 'final', 'status', '#10B981'),
('Confidential', 'confidential', 'security', '#EF4444'),
('Client Review', 'client-review', 'workflow', '#8B5CF6'),
('Authority Submission', 'authority-submission', 'compliance', '#6366F1');

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update search index on document change
CREATE OR REPLACE FUNCTION update_document_search_index()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO document_search_index (document_id, search_vector, content_text)
    VALUES (
        NEW.id,
        to_tsvector('english', 
            COALESCE(NEW.title, '') || ' ' ||
            COALESCE(NEW.description, '') || ' ' ||
            COALESCE(NEW.document_number, '') || ' ' ||
            COALESCE(NEW.ocr_text, '') || ' ' ||
            COALESCE(array_to_string(NEW.tags, ' '), '')
        ),
        COALESCE(NEW.title, '') || ' ' ||
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(NEW.document_number, '') || ' ' ||
        COALESCE(NEW.ocr_text, '')
    )
    ON CONFLICT (document_id) DO UPDATE
    SET search_vector = EXCLUDED.search_vector,
        content_text = EXCLUDED.content_text,
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_document_search_index
AFTER INSERT OR UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION update_document_search_index();

-- Track document access automatically
CREATE OR REPLACE FUNCTION track_document_access()
RETURNS TRIGGER AS $$
BEGIN
    -- This would be called from application layer
    -- Just a placeholder for now
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update document version status
CREATE OR REPLACE FUNCTION update_document_version_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Mark previous versions as not latest
    UPDATE documents
    SET is_latest_version = FALSE
    WHERE id != NEW.id
    AND parent_document_id = NEW.parent_document_id
    AND is_latest_version = TRUE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_document_version_status
AFTER INSERT ON documents
FOR EACH ROW
WHEN (NEW.parent_document_id IS NOT NULL)
EXECUTE FUNCTION update_document_version_status();