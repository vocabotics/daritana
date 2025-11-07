-- Enhanced UBBL Compliance System Database Schema
-- World-class Malaysian building compliance reference system
-- Supporting bilingual content, AI integration, and academic use

-- Drop existing tables if they exist
DROP TABLE IF EXISTS ubbl_knowledge_vectors CASCADE;
DROP TABLE IF EXISTS ubbl_calculators CASCADE;
DROP TABLE IF EXISTS ubbl_explainers CASCADE;
DROP TABLE IF EXISTS ubbl_clauses CASCADE;
DROP TABLE IF EXISTS ubbl_amendments CASCADE;
DROP TABLE IF EXISTS ubbl_citations CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable vector extension for AI embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Core UBBL Clauses Table - The heart of the system
CREATE TABLE ubbl_clauses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clause_number VARCHAR(20) UNIQUE NOT NULL, -- e.g., "12.3.4", "123A"
    part_number INTEGER NOT NULL CHECK (part_number BETWEEN 1 AND 12),
    part_title_en TEXT NOT NULL,
    part_title_ms TEXT NOT NULL,
    section_number VARCHAR(10),
    subsection_number VARCHAR(10),
    
    -- Bilingual content
    title_en TEXT NOT NULL,
    title_ms TEXT NOT NULL,
    content_en TEXT NOT NULL,
    content_ms TEXT NOT NULL,
    
    -- PDF References
    pdf_page_start INTEGER,
    pdf_page_end INTEGER,
    pdf_section_reference TEXT,
    pdf_bookmark TEXT,
    
    -- Legal Information
    effective_date DATE NOT NULL DEFAULT '1984-01-01',
    last_amended DATE,
    amendment_history JSONB DEFAULT '[]',
    
    -- Application Scope
    applicable_building_types TEXT[] DEFAULT '{}',
    applicable_building_heights JSONB, -- min/max heights
    applicable_occupancies TEXT[],
    geographic_scope TEXT[] DEFAULT '{"malaysia"}',
    
    -- Complexity Indicators
    calculation_required BOOLEAN DEFAULT FALSE,
    has_exceptions BOOLEAN DEFAULT FALSE,
    complexity_level INTEGER DEFAULT 1 CHECK (complexity_level BETWEEN 1 AND 5),
    
    -- Relationships
    parent_clause_id UUID REFERENCES ubbl_clauses(id),
    related_clauses UUID[] DEFAULT '{}',
    superseded_by UUID REFERENCES ubbl_clauses(id),
    
    -- Metadata
    keywords TEXT[],
    tags TEXT[],
    priority_level VARCHAR(20) DEFAULT 'standard', -- critical, high, standard, low
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Search optimization
    search_vector_en TSVECTOR,
    search_vector_ms TSVECTOR
);

-- Rich Multilingual Explainers
CREATE TABLE ubbl_explainers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clause_id UUID NOT NULL REFERENCES ubbl_clauses(id) ON DELETE CASCADE,
    language VARCHAR(2) NOT NULL CHECK (language IN ('en', 'ms')),
    
    -- Rich Content
    explanation_html TEXT NOT NULL,
    simplified_explanation TEXT, -- For students/beginners
    technical_notes TEXT, -- For professionals
    
    -- Examples and Cases
    examples JSONB DEFAULT '[]', -- Real-world examples
    case_studies JSONB DEFAULT '[]', -- Actual project cases
    common_violations JSONB DEFAULT '[]', -- What goes wrong
    best_practices JSONB DEFAULT '[]', -- How to do it right
    
    -- Visual Content
    diagrams JSONB DEFAULT '[]', -- Diagram references
    photos JSONB DEFAULT '[]', -- Reference photos
    videos JSONB DEFAULT '[]', -- Tutorial videos
    
    -- Academic Content
    learning_objectives TEXT[],
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    estimated_read_time INTEGER, -- minutes
    
    -- Authorship
    author_name TEXT,
    reviewer_name TEXT,
    review_date DATE,
    version INTEGER DEFAULT 1,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(clause_id, language)
);

-- Interactive Calculators and Tools
CREATE TABLE ubbl_calculators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clause_id UUID NOT NULL REFERENCES ubbl_clauses(id) ON DELETE CASCADE,
    calculator_type VARCHAR(50) NOT NULL, -- 'area', 'height', 'occupancy', 'parking'
    
    -- Calculator Configuration
    name_en TEXT NOT NULL,
    name_ms TEXT NOT NULL,
    description_en TEXT,
    description_ms TEXT,
    
    -- Input/Output Configuration
    input_parameters JSONB NOT NULL, -- Field definitions
    calculation_formula TEXT NOT NULL, -- JavaScript formula
    validation_rules JSONB DEFAULT '{}', -- Input validation
    output_format JSONB NOT NULL, -- Output formatting
    
    -- Units and Measurements
    default_units VARCHAR(20) DEFAULT 'metric', -- metric, imperial
    supported_units JSONB DEFAULT '{"metric": true, "imperial": false}',
    
    -- UI Configuration
    ui_layout JSONB, -- Custom UI layout
    help_text_en TEXT,
    help_text_ms TEXT,
    
    -- Features
    save_calculations BOOLEAN DEFAULT TRUE,
    export_pdf BOOLEAN DEFAULT TRUE,
    share_link BOOLEAN DEFAULT FALSE,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    version INTEGER DEFAULT 1,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Knowledge Base and Vector Embeddings
CREATE TABLE ubbl_knowledge_vectors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clause_id UUID NOT NULL REFERENCES ubbl_clauses(id) ON DELETE CASCADE,
    
    -- Vector Embeddings for AI
    content_embedding_en VECTOR(1536), -- OpenAI Ada-002 embeddings
    content_embedding_ms VECTOR(1536),
    
    -- Source Content
    content_text_en TEXT NOT NULL,
    content_text_ms TEXT,
    content_type VARCHAR(50) NOT NULL, -- 'clause', 'explainer', 'example'
    
    -- AI Training Metadata
    training_context JSONB, -- Context for AI training
    semantic_tags TEXT[], -- AI-generated semantic tags
    confidence_score FLOAT DEFAULT 1.0,
    
    -- Processing Information
    embedding_model VARCHAR(50) DEFAULT 'text-embedding-ada-002',
    last_processed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Amendment History Tracking
CREATE TABLE ubbl_amendments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clause_id UUID NOT NULL REFERENCES ubbl_clauses(id) ON DELETE CASCADE,
    
    amendment_number VARCHAR(50) NOT NULL,
    amendment_date DATE NOT NULL,
    effective_date DATE NOT NULL,
    
    -- Changes
    change_type VARCHAR(50) NOT NULL, -- 'added', 'modified', 'deleted', 'superseded'
    old_content_en TEXT,
    new_content_en TEXT,
    old_content_ms TEXT,
    new_content_ms TEXT,
    
    -- Legal References
    gazette_reference TEXT,
    legal_authority TEXT,
    reason_for_change TEXT,
    
    -- Impact Assessment
    affected_projects TEXT[],
    transition_period INTEGER, -- months
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Citation and Reference Management
CREATE TABLE ubbl_citations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clause_id UUID NOT NULL REFERENCES ubbl_clauses(id) ON DELETE CASCADE,
    
    -- Citation Formats
    apa_format TEXT NOT NULL,
    mla_format TEXT NOT NULL,
    chicago_format TEXT NOT NULL,
    ieee_format TEXT NOT NULL,
    
    -- Malaysian Legal Citation
    malaysian_legal_format TEXT,
    
    -- DOI and URLs
    doi VARCHAR(255),
    permalink TEXT NOT NULL,
    qr_code TEXT, -- QR code for mobile access
    
    -- Usage Statistics
    citation_count INTEGER DEFAULT 0,
    last_cited TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_ubbl_clauses_part_number ON ubbl_clauses(part_number);
CREATE INDEX idx_ubbl_clauses_clause_number ON ubbl_clauses(clause_number);
CREATE INDEX idx_ubbl_clauses_building_types ON ubbl_clauses USING GIN(applicable_building_types);
CREATE INDEX idx_ubbl_clauses_search_en ON ubbl_clauses USING GIN(search_vector_en);
CREATE INDEX idx_ubbl_clauses_search_ms ON ubbl_clauses USING GIN(search_vector_ms);
CREATE INDEX idx_ubbl_clauses_effective_date ON ubbl_clauses(effective_date);

CREATE INDEX idx_ubbl_explainers_clause_language ON ubbl_explainers(clause_id, language);
CREATE INDEX idx_ubbl_calculators_clause_type ON ubbl_calculators(clause_id, calculator_type);
CREATE INDEX idx_ubbl_knowledge_vectors_clause ON ubbl_knowledge_vectors(clause_id);
CREATE INDEX idx_ubbl_amendments_clause_date ON ubbl_amendments(clause_id, amendment_date);

-- Create search vectors update function
CREATE OR REPLACE FUNCTION update_ubbl_search_vectors()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector_en := to_tsvector('english', COALESCE(NEW.title_en, '') || ' ' || COALESCE(NEW.content_en, ''));
    NEW.search_vector_ms := to_tsvector('simple', COALESCE(NEW.title_ms, '') || ' ' || COALESCE(NEW.content_ms, ''));
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for search vector updates
CREATE TRIGGER update_ubbl_search_vectors_trigger
    BEFORE INSERT OR UPDATE ON ubbl_clauses
    FOR EACH ROW
    EXECUTE FUNCTION update_ubbl_search_vectors();

-- Insert sample data structure for testing
INSERT INTO ubbl_clauses (
    clause_number,
    part_number,
    part_title_en,
    part_title_ms,
    title_en,
    title_ms,
    content_en,
    content_ms,
    applicable_building_types,
    calculation_required,
    pdf_page_start,
    keywords
) VALUES (
    '1.1',
    1,
    'PRELIMINARY',
    'PERMULAAN',
    'Citation',
    'Petikan',
    'These By-laws may be cited as the Uniform Building By-Laws 1984.',
    'Undang-undang kecil ini boleh dipetik sebagai Undang-undang Kecil Bangunan Seragam 1984.',
    '{"residential", "commercial", "industrial", "institutional"}',
    false,
    1,
    '{"citation", "preliminary", "building by-laws"}'
);

-- Create views for common queries
CREATE VIEW v_active_ubbl_clauses AS
SELECT 
    c.*,
    e_en.explanation_html as explanation_en,
    e_ms.explanation_html as explanation_ms
FROM ubbl_clauses c
LEFT JOIN ubbl_explainers e_en ON c.id = e_en.clause_id AND e_en.language = 'en'
LEFT JOIN ubbl_explainers e_ms ON c.id = e_ms.clause_id AND e_ms.language = 'ms'
WHERE c.superseded_by IS NULL;

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO daritana_app;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO daritana_app;