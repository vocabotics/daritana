-- Design Brief System Migration
-- Adds comprehensive design brief functionality with cultural intelligence

-- Create design_briefs table
CREATE TABLE IF NOT EXISTS design_briefs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES users(id),
    brief_name VARCHAR(255) NOT NULL,
    project_type VARCHAR(100) NOT NULL,
    requirements TEXT NOT NULL,
    budget DECIMAL(15, 2) NOT NULL,
    target_completion_date DATE,
    pinterest_board VARCHAR(500),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'revision_needed', 'rejected')),
    
    -- Location details (JSONB for flexibility)
    project_location JSONB NOT NULL,
    
    -- Cultural preferences (JSONB for complex nested data)
    cultural_preferences JSONB,
    
    -- Climate considerations (JSONB)
    climate_features JSONB,
    
    -- Room specifications (JSONB array)
    rooms_requirements JSONB DEFAULT '[]'::jsonb,
    
    -- Material preferences (JSONB)
    material_preferences JSONB,
    
    -- Timeline preferences (JSONB)
    timeline_preferences JSONB,
    
    -- Generated outputs (filled by AI/system)
    estimated_timeline INTEGER, -- in days
    generated_tasks JSONB, -- array of task templates
    resource_allocation JSONB, -- resource requirements
    
    -- Approval workflow
    submitted_by UUID REFERENCES users(id),
    reviewed_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    submitted_at TIMESTAMP,
    reviewed_at TIMESTAMP,
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    revision_notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create cultural_design_templates table for reusable cultural guidelines
CREATE TABLE IF NOT EXISTS cultural_design_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    culture VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'spatial', 'material', 'color', 'symbolic', 'functional'
    template_name VARCHAR(255) NOT NULL,
    description TEXT,
    guidelines JSONB NOT NULL,
    importance VARCHAR(20) DEFAULT 'recommended' CHECK (importance IN ('mandatory', 'recommended', 'optional')),
    applicable_spaces TEXT[], -- array of room types this applies to
    climate_considerations JSONB, -- how climate affects this guideline
    budget_impact VARCHAR(20) DEFAULT 'medium' CHECK (budget_impact IN ('low', 'medium', 'high')),
    created_by UUID NOT NULL REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create climate_design_strategies table
CREATE TABLE IF NOT EXISTS climate_design_strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_name VARCHAR(255) NOT NULL,
    climate_zone VARCHAR(50) NOT NULL, -- 'tropical', 'equatorial', 'monsoon'
    category VARCHAR(50) NOT NULL, -- 'ventilation', 'shading', 'drainage', 'thermal'
    description TEXT,
    implementation JSONB NOT NULL, -- detailed implementation guidelines
    effectiveness_rating INTEGER DEFAULT 3 CHECK (effectiveness_rating BETWEEN 1 AND 5),
    cost_rating INTEGER DEFAULT 3 CHECK (cost_rating BETWEEN 1 AND 5),
    maintenance_level VARCHAR(20) DEFAULT 'medium' CHECK (maintenance_level IN ('low', 'medium', 'high')),
    suitable_building_types TEXT[],
    created_by UUID NOT NULL REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create material_library table for Malaysian materials
CREATE TABLE IF NOT EXISTS material_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'flooring', 'walls', 'ceiling', 'structural', 'decorative'
    material_type VARCHAR(100) NOT NULL, -- 'timber', 'stone', 'ceramic', 'metal', 'composite'
    origin VARCHAR(100) NOT NULL, -- 'local', 'regional', 'imported'
    supplier_info JSONB,
    
    -- Cultural significance
    cultural_associations TEXT[],
    traditional_uses TEXT[],
    symbolic_meaning TEXT,
    
    -- Climate suitability
    climate_performance JSONB, -- humidity resistance, thermal properties, etc.
    maintenance_requirements TEXT,
    durability_rating INTEGER DEFAULT 3 CHECK (durability_rating BETWEEN 1 AND 5),
    
    -- Specifications
    technical_specs JSONB,
    sustainability_rating INTEGER DEFAULT 3 CHECK (sustainability_rating BETWEEN 1 AND 5),
    cost_per_unit DECIMAL(10, 2),
    unit VARCHAR(20) DEFAULT 'sqm',
    availability VARCHAR(20) DEFAULT 'available' CHECK (availability IN ('available', 'limited', 'seasonal', 'discontinued')),
    
    -- Visual properties
    colors TEXT[],
    textures TEXT[],
    finish_options TEXT[],
    image_urls TEXT[],
    
    created_by UUID NOT NULL REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create artisan_directory table for local craftspeople
CREATE TABLE IF NOT EXISTS artisan_directory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    business_name VARCHAR(255),
    contact_info JSONB NOT NULL, -- phone, email, address, website
    
    -- Specializations
    craft_specialties TEXT[] NOT NULL,
    cultural_expertise TEXT[], -- which cultural traditions they specialize in
    material_expertise TEXT[], -- materials they work with
    
    -- Location and service area
    location JSONB NOT NULL, -- state, region, specific areas served
    service_radius INTEGER DEFAULT 50, -- km radius they serve
    
    -- Portfolio and credentials
    portfolio_urls TEXT[],
    certifications TEXT[],
    years_experience INTEGER,
    
    -- Ratings and reviews
    average_rating DECIMAL(3, 2) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    featured_projects TEXT[], -- project IDs or descriptions
    
    -- Availability and pricing
    availability_status VARCHAR(20) DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'seasonal', 'unavailable')),
    price_range VARCHAR(20) DEFAULT 'medium' CHECK (price_range IN ('low', 'medium', 'high', 'premium')),
    minimum_project_size DECIMAL(10, 2),
    
    -- Platform management
    verified BOOLEAN DEFAULT FALSE,
    featured BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create brief_collaboration table for team involvement in brief processing
CREATE TABLE IF NOT EXISTS brief_collaboration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brief_id UUID NOT NULL REFERENCES design_briefs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    role VARCHAR(50) NOT NULL, -- 'reviewer', 'designer', 'cultural_consultant', 'project_manager'
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID NOT NULL REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'declined')),
    estimated_hours INTEGER,
    actual_hours INTEGER,
    notes TEXT,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(brief_id, user_id, role)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_design_briefs_project_id ON design_briefs(project_id);
CREATE INDEX IF NOT EXISTS idx_design_briefs_client_id ON design_briefs(client_id);
CREATE INDEX IF NOT EXISTS idx_design_briefs_status ON design_briefs(status);
CREATE INDEX IF NOT EXISTS idx_design_briefs_submitted_at ON design_briefs(submitted_at);

CREATE INDEX IF NOT EXISTS idx_cultural_templates_culture ON cultural_design_templates(culture);
CREATE INDEX IF NOT EXISTS idx_cultural_templates_category ON cultural_design_templates(category);
CREATE INDEX IF NOT EXISTS idx_cultural_templates_active ON cultural_design_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_climate_strategies_zone ON climate_design_strategies(climate_zone);
CREATE INDEX IF NOT EXISTS idx_climate_strategies_category ON climate_design_strategies(category);
CREATE INDEX IF NOT EXISTS idx_climate_strategies_active ON climate_design_strategies(is_active);

CREATE INDEX IF NOT EXISTS idx_material_library_category ON material_library(category);
CREATE INDEX IF NOT EXISTS idx_material_library_origin ON material_library(origin);
CREATE INDEX IF NOT EXISTS idx_material_library_active ON material_library(is_active);

CREATE INDEX IF NOT EXISTS idx_artisan_directory_location ON artisan_directory USING GIN(location);
CREATE INDEX IF NOT EXISTS idx_artisan_directory_specialties ON artisan_directory USING GIN(craft_specialties);
CREATE INDEX IF NOT EXISTS idx_artisan_directory_active ON artisan_directory(is_active);

CREATE INDEX IF NOT EXISTS idx_brief_collaboration_brief ON brief_collaboration(brief_id);
CREATE INDEX IF NOT EXISTS idx_brief_collaboration_user ON brief_collaboration(user_id);
CREATE INDEX IF NOT EXISTS idx_brief_collaboration_status ON brief_collaboration(status);

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_design_briefs_updated_at BEFORE UPDATE ON design_briefs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_cultural_design_templates_updated_at BEFORE UPDATE ON cultural_design_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_climate_design_strategies_updated_at BEFORE UPDATE ON climate_design_strategies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_material_library_updated_at BEFORE UPDATE ON material_library
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_artisan_directory_updated_at BEFORE UPDATE ON artisan_directory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_brief_collaboration_updated_at BEFORE UPDATE ON brief_collaboration
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Insert sample data for cultural design templates
INSERT INTO cultural_design_templates (culture, category, template_name, description, guidelines, importance, applicable_spaces, created_by) VALUES
('malay', 'spatial', 'Traditional Malay House Layout', 'Guidelines for traditional Malay spatial organization', '{"entrance": "Raised threshold with serambi", "living": "Open concept with minimal walls", "kitchen": "Separate wet and dry areas", "religious": "Prayer area facing qibla"}', 'recommended', '{"living_room", "dining_room", "prayer_room"}', '00000000-0000-0000-0000-000000000001'),

('chinese', 'spatial', 'Feng Shui Principles', 'Basic feng shui guidelines for space arrangement', '{"entrance": "Clear, unobstructed pathway", "living": "Commanding position for furniture", "bedroom": "Bed not directly facing door", "kitchen": "Stove position for prosperity"}', 'recommended', '{"living_room", "bedroom", "dining_room", "kitchen"}', '00000000-0000-0000-0000-000000000001'),

('indian', 'spatial', 'Vastu Shastra Layout', 'Traditional Indian architectural guidelines', '{"entrance": "East or north facing preferred", "kitchen": "Southeast corner", "pooja": "Northeast corner", "bedroom": "Southwest for master bedroom"}', 'recommended', '{"pooja_room", "kitchen", "bedroom"}', '00000000-0000-0000-0000-000000000001'),

('tropical', 'climate', 'Ventilation Strategy', 'Natural ventilation for tropical climate', '{"cross_ventilation": true, "high_ceilings": "minimum 3m", "openings": "30% of wall area", "orientation": "minimize west-facing openings"}', 'mandatory', '{"living_room", "bedroom", "kitchen"}', '00000000-0000-0000-0000-000000000001');

-- Insert sample climate design strategies
INSERT INTO climate_design_strategies (strategy_name, climate_zone, category, description, implementation, effectiveness_rating, cost_rating, suitable_building_types, created_by) VALUES
('Cross Ventilation', 'tropical', 'ventilation', 'Natural air movement through strategically placed openings', '{"window_placement": "opposite walls", "height_difference": "create stack effect", "obstacles": "minimize internal barriers"}', 5, 2, '{"residential", "office", "retail"}', '00000000-0000-0000-0000-000000000001'),

('Deep Roof Overhangs', 'tropical', 'shading', 'Extended roof projection for sun and rain protection', '{"overhang_depth": "1.5-2m minimum", "angle": "match sun angles", "materials": "lightweight, reflective"}', 4, 3, '{"residential", "commercial"}', '00000000-0000-0000-0000-000000000001'),

('Elevated Floor Design', 'tropical', 'drainage', 'Raised floor system for flood protection and ventilation', '{"elevation": "0.6-1.5m above ground", "ventilation": "under-floor air circulation", "access": "integrated ramp/stairs"}', 4, 4, '{"residential", "community"}', '00000000-0000-0000-0000-000000000001');

-- Insert sample materials
INSERT INTO material_library (material_name, category, material_type, origin, cultural_associations, traditional_uses, climate_performance, cost_per_unit, unit, colors, created_by) VALUES
('Chengal Timber', 'flooring', 'timber', 'local', '{"malay", "traditional"}', '{"flooring", "structural", "furniture"}', '{"humidity_resistance": "excellent", "termite_resistance": "high", "durability": "50+ years"}', 250.00, 'sqm', '{"golden brown", "honey", "amber"}', '00000000-0000-0000-0000-000000000001'),

('Terracotta Tiles', 'flooring', 'ceramic', 'local', '{"peranakan", "colonial"}', '{"flooring", "wall_cladding", "roofing"}', '{"thermal_mass": "high", "slip_resistance": "good", "maintenance": "low"}', 85.00, 'sqm', '{"red", "orange", "brown"}', '00000000-0000-0000-0000-000000000001'),

('Mengkuang Weaving', 'decorative', 'natural', 'local', '{"malay", "dayak"}', '{"wall_panels", "room_dividers", "decorative_screens"}', '{"breathability": "excellent", "humidity_adaptation": "good", "maintenance": "medium"}', 120.00, 'sqm', '{"natural", "brown", "gold"}', '00000000-0000-0000-0000-000000000001');

-- Note: Sample user ID used above should be replaced with actual admin user ID when migrating