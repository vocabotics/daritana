-- ============================================
-- CONSTRUCTION MONITORING SCHEMA
-- World-Class Construction Progress Tracking System
-- ============================================

-- Create construction schema
CREATE SCHEMA IF NOT EXISTS construction;

-- Grant permissions
GRANT USAGE ON SCHEMA construction TO daritana_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA construction TO daritana_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA construction TO daritana_app;

-- ============================================
-- CONSTRUCTION SITES
-- ============================================
CREATE TABLE construction.sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects.projects(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES core.organizations(id),
    
    -- Site Information
    site_code VARCHAR(100) UNIQUE NOT NULL,
    site_name VARCHAR(255) NOT NULL,
    site_type VARCHAR(50) CHECK (site_type IN ('residential', 'commercial', 'industrial', 'infrastructure', 'mixed')),
    
    -- Location
    address JSONB NOT NULL,
    coordinates POINT,
    site_area_sqm DECIMAL(10, 2),
    site_boundaries JSONB, -- GeoJSON polygon
    
    -- Key Personnel
    site_manager_id UUID REFERENCES core.users(id),
    safety_officer_id UUID REFERENCES core.users(id),
    quality_inspector_id UUID REFERENCES core.users(id),
    
    -- Timeline
    groundbreaking_date DATE,
    estimated_completion DATE,
    actual_completion DATE,
    handover_date DATE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'planning' CHECK (status IN ('planning', 'site_prep', 'foundation', 'structure', 'mep', 'finishing', 'inspection', 'completed', 'handed_over')),
    is_active BOOLEAN DEFAULT true,
    
    -- Weather Station
    weather_station_id VARCHAR(100),
    weather_api_key VARCHAR(255),
    
    -- IoT Integration
    iot_enabled BOOLEAN DEFAULT false,
    iot_devices JSONB DEFAULT '[]',
    
    -- WhatsApp Integration
    whatsapp_group_id VARCHAR(100),
    whatsapp_group_name VARCHAR(255),
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_construction_sites_project ON construction.sites(project_id);
CREATE INDEX idx_construction_sites_org ON construction.sites(organization_id);
CREATE INDEX idx_construction_sites_status ON construction.sites(status);
CREATE INDEX idx_construction_sites_location ON construction.sites USING gist(coordinates);

-- ============================================
-- CONSTRUCTION PHASES
-- ============================================
CREATE TABLE construction.phases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES construction.sites(id) ON DELETE CASCADE,
    
    -- Phase Information
    phase_code VARCHAR(50) NOT NULL,
    phase_name VARCHAR(255) NOT NULL,
    phase_type VARCHAR(100) NOT NULL,
    sequence_order INT NOT NULL,
    
    -- Timeline
    planned_start DATE,
    planned_end DATE,
    actual_start DATE,
    actual_end DATE,
    
    -- Progress
    progress_percentage DECIMAL(5, 2) DEFAULT 0,
    weight_factor DECIMAL(5, 2) DEFAULT 1.0, -- For weighted progress calculation
    
    -- Dependencies
    predecessor_phases UUID[],
    successor_phases UUID[],
    
    -- Milestones
    key_milestones JSONB DEFAULT '[]',
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'delayed', 'on_hold')),
    delay_reasons TEXT[],
    
    -- Quality Gates
    quality_checkpoints JSONB DEFAULT '[]',
    inspection_required BOOLEAN DEFAULT true,
    inspection_status VARCHAR(50),
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(site_id, phase_code)
);

CREATE INDEX idx_phases_site ON construction.phases(site_id);
CREATE INDEX idx_phases_status ON construction.phases(status);
CREATE INDEX idx_phases_dates ON construction.phases(planned_start, planned_end);

-- ============================================
-- PROGRESS UPDATES
-- ============================================
CREATE TABLE construction.progress_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES construction.sites(id) ON DELETE CASCADE,
    phase_id UUID REFERENCES construction.phases(id),
    
    -- Update Information
    update_type VARCHAR(50) CHECK (update_type IN ('daily', 'hourly', 'milestone', 'incident', 'weather', 'automated')),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    recorded_by UUID REFERENCES core.users(id),
    
    -- Progress Data
    overall_progress DECIMAL(5, 2),
    phase_progress DECIMAL(5, 2),
    work_completed TEXT,
    work_planned_next TEXT,
    
    -- Workforce
    workers_present INT,
    workers_by_trade JSONB, -- {"carpenters": 5, "electricians": 3, etc}
    contractor_teams JSONB,
    
    -- Equipment
    equipment_on_site JSONB,
    equipment_utilization DECIMAL(5, 2),
    
    -- Materials
    materials_received JSONB,
    materials_used JSONB,
    material_issues TEXT[],
    
    -- Weather Impact
    weather_conditions JSONB,
    weather_delays BOOLEAN DEFAULT false,
    weather_impact_hours DECIMAL(4, 2),
    
    -- Issues & Risks
    issues_encountered TEXT[],
    safety_incidents INT DEFAULT 0,
    quality_issues INT DEFAULT 0,
    
    -- AI Analysis
    ai_progress_verification DECIMAL(5, 2), -- AI-verified progress percentage
    ai_anomalies_detected TEXT[],
    ai_recommendations TEXT[],
    ai_confidence_score DECIMAL(3, 2),
    
    -- Media
    photos UUID[], -- Reference to site_images table
    videos UUID[],
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_progress_updates_site ON construction.progress_updates(site_id);
CREATE INDEX idx_progress_updates_phase ON construction.progress_updates(phase_id);
CREATE INDEX idx_progress_updates_date ON construction.progress_updates(recorded_at DESC);
CREATE INDEX idx_progress_updates_type ON construction.progress_updates(update_type);

-- ============================================
-- MATERIAL TRACKING
-- ============================================
CREATE TABLE construction.materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES construction.sites(id) ON DELETE CASCADE,
    
    -- Material Information
    material_code VARCHAR(100) NOT NULL,
    material_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    unit_of_measure VARCHAR(50),
    
    -- Quantities
    planned_quantity DECIMAL(12, 3),
    ordered_quantity DECIMAL(12, 3),
    delivered_quantity DECIMAL(12, 3),
    used_quantity DECIMAL(12, 3),
    waste_quantity DECIMAL(12, 3),
    remaining_quantity DECIMAL(12, 3),
    
    -- Supplier Information
    supplier_name VARCHAR(255),
    supplier_contact JSONB,
    purchase_order_number VARCHAR(100),
    
    -- Delivery Tracking
    expected_delivery DATE,
    actual_delivery TIMESTAMPTZ,
    delivery_note_number VARCHAR(100),
    qr_code VARCHAR(255),
    
    -- Quality
    quality_cert_number VARCHAR(100),
    test_results JSONB,
    approved_by UUID REFERENCES core.users(id),
    rejection_reason TEXT,
    
    -- Cost
    unit_cost DECIMAL(10, 2),
    total_cost DECIMAL(15, 2),
    currency VARCHAR(3) DEFAULT 'MYR',
    
    -- Storage
    storage_location VARCHAR(255),
    storage_conditions TEXT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'planned' CHECK (status IN ('planned', 'ordered', 'in_transit', 'delivered', 'in_use', 'completed', 'rejected')),
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_materials_site ON construction.materials(site_id);
CREATE INDEX idx_materials_status ON construction.materials(status);
CREATE INDEX idx_materials_delivery ON construction.materials(expected_delivery);
CREATE INDEX idx_materials_qr ON construction.materials(qr_code);

-- ============================================
-- WORKER TRACKING
-- ============================================
CREATE TABLE construction.workers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES construction.sites(id) ON DELETE CASCADE,
    
    -- Worker Information
    worker_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    ic_number VARCHAR(50),
    passport_number VARCHAR(50),
    
    -- Employment
    company_name VARCHAR(255),
    trade VARCHAR(100),
    skill_level VARCHAR(50) CHECK (skill_level IN ('apprentice', 'skilled', 'supervisor', 'master')),
    
    -- Safety
    safety_card_number VARCHAR(100),
    safety_card_expiry DATE,
    medical_cert_expiry DATE,
    safety_training JSONB DEFAULT '[]',
    ppe_issued JSONB DEFAULT '[]',
    
    -- Attendance
    total_days_worked INT DEFAULT 0,
    last_check_in TIMESTAMPTZ,
    last_check_out TIMESTAMPTZ,
    
    -- Performance
    productivity_score DECIMAL(3, 2),
    quality_score DECIMAL(3, 2),
    safety_violations INT DEFAULT 0,
    
    -- Biometric
    fingerprint_enrolled BOOLEAN DEFAULT false,
    face_enrolled BOOLEAN DEFAULT false,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    blacklisted BOOLEAN DEFAULT false,
    blacklist_reason TEXT,
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(site_id, worker_id)
);

CREATE INDEX idx_workers_site ON construction.workers(site_id);
CREATE INDEX idx_workers_trade ON construction.workers(trade);
CREATE INDEX idx_workers_company ON construction.workers(company_name);
CREATE INDEX idx_workers_active ON construction.workers(is_active) WHERE is_active = true;

-- Worker Daily Attendance
CREATE TABLE construction.worker_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES construction.sites(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES construction.workers(id) ON DELETE CASCADE,
    
    -- Attendance
    attendance_date DATE NOT NULL,
    check_in_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,
    hours_worked DECIMAL(4, 2),
    overtime_hours DECIMAL(4, 2),
    
    -- Work Details
    work_location VARCHAR(255),
    tasks_assigned TEXT[],
    tasks_completed TEXT[],
    
    -- Verification
    check_in_method VARCHAR(50), -- biometric, qr, manual
    check_in_photo_url TEXT,
    check_in_location POINT,
    
    -- Safety
    safety_briefing_attended BOOLEAN DEFAULT false,
    ppe_check_passed BOOLEAN DEFAULT true,
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(worker_id, attendance_date)
);

CREATE INDEX idx_attendance_site ON construction.worker_attendance(site_id);
CREATE INDEX idx_attendance_worker ON construction.worker_attendance(worker_id);
CREATE INDEX idx_attendance_date ON construction.worker_attendance(attendance_date DESC);

-- ============================================
-- SITE INSPECTIONS
-- ============================================
CREATE TABLE construction.inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES construction.sites(id) ON DELETE CASCADE,
    phase_id UUID REFERENCES construction.phases(id),
    
    -- Inspection Details
    inspection_type VARCHAR(100) NOT NULL, -- safety, quality, progress, regulatory, client
    inspection_code VARCHAR(100) UNIQUE NOT NULL,
    scheduled_date DATE,
    actual_date TIMESTAMPTZ,
    
    -- Inspector
    inspector_name VARCHAR(255),
    inspector_company VARCHAR(255),
    inspector_id UUID REFERENCES core.users(id),
    
    -- Checklist
    checklist_template JSONB,
    checklist_results JSONB,
    
    -- Findings
    total_items_checked INT,
    items_passed INT,
    items_failed INT,
    critical_issues INT DEFAULT 0,
    major_issues INT DEFAULT 0,
    minor_issues INT DEFAULT 0,
    
    -- Compliance Score
    compliance_score DECIMAL(5, 2),
    safety_score DECIMAL(5, 2),
    quality_score DECIMAL(5, 2),
    
    -- Actions
    corrective_actions JSONB DEFAULT '[]',
    preventive_actions JSONB DEFAULT '[]',
    deadline_for_actions DATE,
    
    -- Documentation
    report_url TEXT,
    photos UUID[],
    certificates_issued JSONB DEFAULT '[]',
    
    -- Status
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'failed', 'reinspection_required')),
    reinspection_date DATE,
    
    -- Sign-off
    signed_by UUID REFERENCES core.users(id),
    signature_url TEXT,
    signed_at TIMESTAMPTZ,
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inspections_site ON construction.inspections(site_id);
CREATE INDEX idx_inspections_phase ON construction.inspections(phase_id);
CREATE INDEX idx_inspections_type ON construction.inspections(inspection_type);
CREATE INDEX idx_inspections_date ON construction.inspections(scheduled_date);
CREATE INDEX idx_inspections_status ON construction.inspections(status);

-- ============================================
-- SITE IMAGES & VIDEOS
-- ============================================
CREATE TABLE construction.site_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES construction.sites(id) ON DELETE CASCADE,
    progress_update_id UUID REFERENCES construction.progress_updates(id),
    
    -- Media Information
    media_type VARCHAR(20) CHECK (media_type IN ('photo', 'video', 'panorama', 'timelapse', 'drone')),
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    
    -- Storage
    storage_url TEXT NOT NULL,
    thumbnail_url TEXT,
    
    -- Capture Details
    captured_at TIMESTAMPTZ NOT NULL,
    captured_by UUID REFERENCES core.users(id),
    device_info JSONB,
    
    -- Location
    capture_location POINT,
    capture_area VARCHAR(255),
    view_angle VARCHAR(50),
    
    -- AI Vision Analysis
    ai_processed BOOLEAN DEFAULT false,
    ai_processed_at TIMESTAMPTZ,
    ai_detected_objects JSONB, -- ["workers": 5, "excavator": 1, "concrete_pour": true]
    ai_progress_detected DECIMAL(5, 2),
    ai_safety_issues JSONB DEFAULT '[]',
    ai_quality_issues JSONB DEFAULT '[]',
    ai_comparison_baseline UUID, -- Reference to previous image for comparison
    ai_change_percentage DECIMAL(5, 2),
    
    -- Tags & Classification
    tags TEXT[],
    phase VARCHAR(100),
    area VARCHAR(100),
    
    -- Validation
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES core.users(id),
    verification_notes TEXT,
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_site_media_site ON construction.site_media(site_id);
CREATE INDEX idx_site_media_update ON construction.site_media(progress_update_id);
CREATE INDEX idx_site_media_type ON construction.site_media(media_type);
CREATE INDEX idx_site_media_captured ON construction.site_media(captured_at DESC);
CREATE INDEX idx_site_media_ai ON construction.site_media(ai_processed) WHERE ai_processed = false;
CREATE INDEX idx_site_media_tags ON construction.site_media USING gin(tags);

-- ============================================
-- EQUIPMENT TRACKING
-- ============================================
CREATE TABLE construction.equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES construction.sites(id) ON DELETE CASCADE,
    
    -- Equipment Information
    equipment_code VARCHAR(100) UNIQUE NOT NULL,
    equipment_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100),
    
    -- Ownership
    ownership_type VARCHAR(50) CHECK (ownership_type IN ('owned', 'rented', 'leased')),
    owner_company VARCHAR(255),
    rental_rate_per_day DECIMAL(10, 2),
    
    -- Tracking
    current_location VARCHAR(255),
    gps_tracker_id VARCHAR(100),
    last_gps_update TIMESTAMPTZ,
    
    -- Usage
    total_hours_used DECIMAL(10, 2) DEFAULT 0,
    fuel_consumption_total DECIMAL(10, 2),
    
    -- Maintenance
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    maintenance_hours_remaining DECIMAL(8, 2),
    
    -- Status
    operational_status VARCHAR(50) DEFAULT 'available' CHECK (operational_status IN ('available', 'in_use', 'maintenance', 'breakdown', 'off_site')),
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_equipment_site ON construction.equipment(site_id);
CREATE INDEX idx_equipment_status ON construction.equipment(operational_status);
CREATE INDEX idx_equipment_category ON construction.equipment(category);

-- Equipment Daily Usage
CREATE TABLE construction.equipment_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_id UUID NOT NULL REFERENCES construction.equipment(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES construction.sites(id) ON DELETE CASCADE,
    
    -- Usage Details
    usage_date DATE NOT NULL,
    operator_id UUID REFERENCES construction.workers(id),
    
    -- Time Tracking
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    total_hours DECIMAL(4, 2),
    idle_hours DECIMAL(4, 2),
    productive_hours DECIMAL(4, 2),
    
    -- Operations
    tasks_performed TEXT[],
    work_area VARCHAR(255),
    
    -- Consumption
    fuel_consumed DECIMAL(8, 2),
    
    -- Issues
    breakdowns INT DEFAULT 0,
    breakdown_details JSONB DEFAULT '[]',
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(equipment_id, usage_date)
);

CREATE INDEX idx_equipment_usage_equipment ON construction.equipment_usage(equipment_id);
CREATE INDEX idx_equipment_usage_site ON construction.equipment_usage(site_id);
CREATE INDEX idx_equipment_usage_date ON construction.equipment_usage(usage_date DESC);

-- ============================================
-- WEATHER LOGS
-- ============================================
CREATE TABLE construction.weather_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES construction.sites(id) ON DELETE CASCADE,
    
    -- Weather Data
    recorded_at TIMESTAMPTZ NOT NULL,
    temperature_celsius DECIMAL(4, 1),
    humidity_percent INT,
    wind_speed_kmh DECIMAL(5, 1),
    wind_direction VARCHAR(10),
    
    -- Precipitation
    rainfall_mm DECIMAL(6, 2),
    precipitation_type VARCHAR(50),
    
    -- Conditions
    weather_condition VARCHAR(100),
    visibility_km DECIMAL(4, 1),
    uv_index INT,
    air_quality_index INT,
    
    -- Impact
    work_impact VARCHAR(50) CHECK (work_impact IN ('none', 'minor', 'moderate', 'severe', 'stop_work')),
    affected_activities TEXT[],
    delay_hours DECIMAL(4, 2),
    
    -- Source
    data_source VARCHAR(50), -- api, manual, iot_sensor
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(site_id, recorded_at)
);

CREATE INDEX idx_weather_site ON construction.weather_logs(site_id);
CREATE INDEX idx_weather_date ON construction.weather_logs(recorded_at DESC);
CREATE INDEX idx_weather_impact ON construction.weather_logs(work_impact) WHERE work_impact != 'none';

-- ============================================
-- SITE INCIDENTS
-- ============================================
CREATE TABLE construction.incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES construction.sites(id) ON DELETE CASCADE,
    
    -- Incident Information
    incident_code VARCHAR(100) UNIQUE NOT NULL,
    incident_type VARCHAR(100) NOT NULL, -- safety, quality, delay, environmental, security
    severity VARCHAR(50) CHECK (severity IN ('minor', 'moderate', 'major', 'critical', 'fatal')),
    
    -- Details
    occurred_at TIMESTAMPTZ NOT NULL,
    reported_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    reported_by UUID REFERENCES core.users(id),
    location VARCHAR(255),
    description TEXT NOT NULL,
    
    -- People Involved
    people_involved JSONB DEFAULT '[]',
    injuries INT DEFAULT 0,
    fatalities INT DEFAULT 0,
    
    -- Investigation
    root_cause TEXT,
    contributing_factors TEXT[],
    investigation_status VARCHAR(50) DEFAULT 'pending',
    investigator_name VARCHAR(255),
    
    -- Actions
    immediate_actions TEXT[],
    corrective_actions JSONB DEFAULT '[]',
    preventive_measures TEXT[],
    
    -- Reporting
    reported_to_authorities BOOLEAN DEFAULT false,
    authority_reference VARCHAR(100),
    insurance_claim_number VARCHAR(100),
    
    -- Cost Impact
    estimated_cost DECIMAL(12, 2),
    actual_cost DECIMAL(12, 2),
    downtime_hours DECIMAL(8, 2),
    
    -- Documentation
    photos UUID[],
    reports JSONB DEFAULT '[]',
    
    -- Status
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
    closed_at TIMESTAMPTZ,
    closed_by UUID REFERENCES core.users(id),
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_incidents_site ON construction.incidents(site_id);
CREATE INDEX idx_incidents_type ON construction.incidents(incident_type);
CREATE INDEX idx_incidents_severity ON construction.incidents(severity);
CREATE INDEX idx_incidents_date ON construction.incidents(occurred_at DESC);
CREATE INDEX idx_incidents_status ON construction.incidents(status);

-- ============================================
-- WHATSAPP MESSAGES
-- ============================================
CREATE TABLE construction.whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES construction.sites(id) ON DELETE CASCADE,
    
    -- Message Information
    message_id VARCHAR(255) UNIQUE NOT NULL,
    from_number VARCHAR(50) NOT NULL,
    from_name VARCHAR(255),
    to_number VARCHAR(50),
    
    -- Content
    message_type VARCHAR(50), -- text, image, video, document, location
    message_text TEXT,
    media_url TEXT,
    
    -- Processing
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMPTZ,
    
    -- AI Analysis
    ai_category VARCHAR(100), -- progress_update, issue_report, material_delivery, etc
    ai_sentiment VARCHAR(50),
    ai_entities JSONB, -- Extracted entities like dates, quantities, locations
    ai_action_required BOOLEAN DEFAULT false,
    ai_priority VARCHAR(20),
    
    -- Linking
    linked_to_update UUID REFERENCES construction.progress_updates(id),
    linked_to_incident UUID REFERENCES construction.incidents(id),
    
    -- Timestamp
    received_at TIMESTAMPTZ NOT NULL,
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_whatsapp_site ON construction.whatsapp_messages(site_id);
CREATE INDEX idx_whatsapp_from ON construction.whatsapp_messages(from_number);
CREATE INDEX idx_whatsapp_processed ON construction.whatsapp_messages(processed) WHERE processed = false;
CREATE INDEX idx_whatsapp_date ON construction.whatsapp_messages(received_at DESC);

-- ============================================
-- AI PREDICTIONS & INSIGHTS
-- ============================================
CREATE TABLE construction.ai_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES construction.sites(id) ON DELETE CASCADE,
    
    -- Prediction Information
    prediction_type VARCHAR(100) NOT NULL, -- completion_date, cost_overrun, safety_risk, quality_issue, weather_delay
    prediction_date DATE NOT NULL,
    
    -- Model Details
    model_name VARCHAR(100),
    model_version VARCHAR(50),
    training_date TIMESTAMPTZ,
    
    -- Predictions
    predicted_value JSONB NOT NULL,
    confidence_score DECIMAL(3, 2),
    probability_distribution JSONB,
    
    -- Factors
    contributing_factors JSONB,
    risk_factors JSONB,
    
    -- Recommendations
    recommendations TEXT[],
    mitigation_strategies JSONB,
    
    -- Validation
    actual_value JSONB,
    accuracy_score DECIMAL(3, 2),
    validated_at TIMESTAMPTZ,
    
    -- Alert Status
    alert_level VARCHAR(20) CHECK (alert_level IN ('info', 'warning', 'critical')),
    alert_sent BOOLEAN DEFAULT false,
    alert_acknowledged BOOLEAN DEFAULT false,
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_predictions_site ON construction.ai_predictions(site_id);
CREATE INDEX idx_ai_predictions_type ON construction.ai_predictions(prediction_type);
CREATE INDEX idx_ai_predictions_date ON construction.ai_predictions(prediction_date DESC);
CREATE INDEX idx_ai_predictions_alert ON construction.ai_predictions(alert_level) WHERE alert_acknowledged = false;

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to calculate overall site progress
CREATE OR REPLACE FUNCTION construction.calculate_site_progress(site_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    total_weight DECIMAL;
    weighted_progress DECIMAL;
BEGIN
    SELECT 
        SUM(weight_factor),
        SUM(progress_percentage * weight_factor)
    INTO total_weight, weighted_progress
    FROM construction.phases
    WHERE site_id = site_id;
    
    IF total_weight > 0 THEN
        RETURN weighted_progress / total_weight;
    ELSE
        RETURN 0;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to generate daily progress report
CREATE OR REPLACE FUNCTION construction.generate_daily_report(site_id UUID, report_date DATE)
RETURNS JSONB AS $$
DECLARE
    report JSONB;
BEGIN
    SELECT jsonb_build_object(
        'site_id', site_id,
        'report_date', report_date,
        'overall_progress', construction.calculate_site_progress(site_id),
        'workers_present', (
            SELECT COUNT(*) 
            FROM construction.worker_attendance 
            WHERE site_id = site_id 
            AND attendance_date = report_date
        ),
        'equipment_utilization', (
            SELECT AVG(productive_hours / total_hours * 100)
            FROM construction.equipment_usage
            WHERE site_id = site_id
            AND usage_date = report_date
        ),
        'incidents', (
            SELECT COUNT(*)
            FROM construction.incidents
            WHERE site_id = site_id
            AND DATE(occurred_at) = report_date
        ),
        'weather_impact', (
            SELECT work_impact
            FROM construction.weather_logs
            WHERE site_id = site_id
            AND DATE(recorded_at) = report_date
            ORDER BY recorded_at DESC
            LIMIT 1
        )
    ) INTO report;
    
    RETURN report;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update phase progress when progress updates are added
CREATE OR REPLACE FUNCTION construction.update_phase_progress()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.phase_id IS NOT NULL AND NEW.phase_progress IS NOT NULL THEN
        UPDATE construction.phases
        SET progress_percentage = NEW.phase_progress,
            status = CASE 
                WHEN NEW.phase_progress = 0 THEN 'pending'
                WHEN NEW.phase_progress < 100 THEN 'in_progress'
                WHEN NEW.phase_progress = 100 THEN 'completed'
                ELSE status
            END,
            actual_start = CASE
                WHEN actual_start IS NULL AND NEW.phase_progress > 0 
                THEN NEW.recorded_at::DATE
                ELSE actual_start
            END,
            actual_end = CASE
                WHEN NEW.phase_progress = 100 AND actual_end IS NULL
                THEN NEW.recorded_at::DATE
                ELSE actual_end
            END
        WHERE id = NEW.phase_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_phase_progress
AFTER INSERT OR UPDATE ON construction.progress_updates
FOR EACH ROW
EXECUTE FUNCTION construction.update_phase_progress();

-- Trigger to check worker safety certification
CREATE OR REPLACE FUNCTION construction.check_worker_safety()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.safety_card_expiry < CURRENT_DATE THEN
        RAISE EXCEPTION 'Worker safety card has expired';
    END IF;
    
    IF NEW.medical_cert_expiry < CURRENT_DATE THEN
        RAISE EXCEPTION 'Worker medical certificate has expired';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_worker_safety
BEFORE INSERT OR UPDATE ON construction.workers
FOR EACH ROW
EXECUTE FUNCTION construction.check_worker_safety();

-- ============================================
-- VIEWS FOR REPORTING
-- ============================================

-- Daily Dashboard View
CREATE OR REPLACE VIEW construction.daily_dashboard AS
SELECT 
    s.id as site_id,
    s.site_name,
    s.status,
    construction.calculate_site_progress(s.id) as overall_progress,
    (
        SELECT COUNT(DISTINCT worker_id)
        FROM construction.worker_attendance wa
        WHERE wa.site_id = s.id
        AND wa.attendance_date = CURRENT_DATE
    ) as workers_today,
    (
        SELECT COUNT(*)
        FROM construction.equipment e
        WHERE e.site_id = s.id
        AND e.operational_status = 'in_use'
    ) as equipment_in_use,
    (
        SELECT COUNT(*)
        FROM construction.incidents i
        WHERE i.site_id = s.id
        AND DATE(i.occurred_at) = CURRENT_DATE
    ) as incidents_today,
    (
        SELECT work_impact
        FROM construction.weather_logs w
        WHERE w.site_id = s.id
        AND DATE(w.recorded_at) = CURRENT_DATE
        ORDER BY w.recorded_at DESC
        LIMIT 1
    ) as current_weather_impact
FROM construction.sites s
WHERE s.is_active = true;

-- Material Status View
CREATE OR REPLACE VIEW construction.material_status AS
SELECT 
    m.site_id,
    m.material_code,
    m.material_name,
    m.category,
    m.planned_quantity,
    m.delivered_quantity,
    m.used_quantity,
    m.remaining_quantity,
    CASE 
        WHEN m.delivered_quantity >= m.planned_quantity THEN 'sufficient'
        WHEN m.delivered_quantity > m.planned_quantity * 0.8 THEN 'low'
        ELSE 'critical'
    END as stock_status,
    m.expected_delivery,
    m.status
FROM construction.materials m
WHERE m.status NOT IN ('completed', 'rejected');

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Composite indexes for common queries
CREATE INDEX idx_progress_updates_site_date ON construction.progress_updates(site_id, recorded_at DESC);
CREATE INDEX idx_worker_attendance_site_date ON construction.worker_attendance(site_id, attendance_date DESC);
CREATE INDEX idx_equipment_usage_site_date ON construction.equipment_usage(site_id, usage_date DESC);

-- Partial indexes for active records
CREATE INDEX idx_sites_active ON construction.sites(status) WHERE is_active = true;
CREATE INDEX idx_phases_incomplete ON construction.phases(site_id, status) WHERE status != 'completed';
CREATE INDEX idx_incidents_open ON construction.incidents(site_id, status) WHERE status IN ('open', 'investigating');

-- BRIN indexes for time-series data
CREATE INDEX idx_progress_updates_recorded_brin ON construction.progress_updates USING brin(recorded_at);
CREATE INDEX idx_weather_logs_recorded_brin ON construction.weather_logs USING brin(recorded_at);
CREATE INDEX idx_whatsapp_messages_received_brin ON construction.whatsapp_messages USING brin(received_at);

-- ============================================
-- SAMPLE DATA FOR TESTING
-- ============================================

-- Insert sample construction phases
INSERT INTO construction.phases (phase_code, phase_name, phase_type, sequence_order, weight_factor)
VALUES 
    ('SITE_PREP', 'Site Preparation', 'preparation', 1, 5.0),
    ('FOUNDATION', 'Foundation Work', 'foundation', 2, 15.0),
    ('STRUCTURE', 'Structural Work', 'structure', 3, 30.0),
    ('ROOFING', 'Roofing', 'roofing', 4, 10.0),
    ('MEP_ROUGH', 'MEP Rough-In', 'mep', 5, 15.0),
    ('EXTERIOR', 'Exterior Finishing', 'finishing', 6, 10.0),
    ('INTERIOR', 'Interior Finishing', 'finishing', 7, 10.0),
    ('FINAL_MEP', 'Final MEP', 'mep', 8, 3.0),
    ('LANDSCAPING', 'Landscaping', 'landscaping', 9, 2.0)
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT ALL ON SCHEMA construction TO daritana_app;
GRANT ALL ON ALL TABLES IN SCHEMA construction TO daritana_app;
GRANT ALL ON ALL SEQUENCES IN SCHEMA construction TO daritana_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA construction TO daritana_app;