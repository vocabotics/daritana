-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'client', 'staff', 'contractor', 'project_lead', 'designer', 'admin'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM (
        'pending', 'active', 'suspended', 'deleted'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE project_status AS ENUM (
        'draft', 'planning', 'in_progress', 'on_hold', 'completed', 'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE project_type AS ENUM (
        'residential', 'commercial', 'industrial', 'institutional', 
        'mixed_use', 'renovation', 'interior_design'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM (
        'todo', 'in_progress', 'in_review', 'blocked', 'completed', 'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_priority AS ENUM (
        'low', 'medium', 'high', 'urgent'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE document_type AS ENUM (
        'drawing', 'specification', 'contract', 'invoice', 'quotation', 
        'report', 'permit', 'certificate', 'photo', 'video', 
        'presentation', 'spreadsheet', 'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE document_status AS ENUM (
        'draft', 'in_review', 'approved', 'rejected', 'archived'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create audit trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create text search configuration for Malaysian content
CREATE TEXT SEARCH CONFIGURATION IF NOT EXISTS malaysian (COPY = english);

-- Add indexes for full-text search
CREATE INDEX IF NOT EXISTS idx_projects_search ON projects USING gin(
    to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, ''))
);

CREATE INDEX IF NOT EXISTS idx_tasks_search ON tasks USING gin(
    to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, ''))
);

CREATE INDEX IF NOT EXISTS idx_documents_search ON documents USING gin(
    to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, ''))
);

-- Create materialized view for project statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS project_statistics AS
SELECT 
    p.id as project_id,
    p.name as project_name,
    p.status as project_status,
    COUNT(DISTINCT t.id) as total_tasks,
    COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks,
    COUNT(DISTINCT CASE WHEN t.status = 'in_progress' THEN t.id END) as in_progress_tasks,
    COUNT(DISTINCT d.id) as total_documents,
    COALESCE(AVG(t.progress), 0) as average_task_progress,
    p."createdAt",
    p."updatedAt"
FROM projects p
LEFT JOIN tasks t ON p.id = t."projectId"
LEFT JOIN documents d ON p.id = d."projectId"
GROUP BY p.id, p.name, p.status, p."createdAt", p."updatedAt";

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_project_statistics_project_id ON project_statistics (project_id);

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_project_statistics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY project_statistics;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust based on your setup)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO postgres;