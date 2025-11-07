-- Social Platform Database Schema
-- Complete implementation for community, marketplace, and educational features

-- =====================================================
-- USERS & PROFILES EXTENSION
-- =====================================================

-- Extend user profiles for social features
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS headline VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS years_experience INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS specializations TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS languages TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_date TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS post_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reputation_score INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_instructor BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_supplier BOOLEAN DEFAULT FALSE;

-- User following relationships
CREATE TABLE IF NOT EXISTS user_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_id, following_id)
);

-- =====================================================
-- CONTENT POSTS (Reels, Feed, Portfolio)
-- =====================================================

CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('reel', 'post', 'thread', 'portfolio', 'news', 'update', 'question', 'poll')),
    category VARCHAR(50),
    title VARCHAR(500),
    content TEXT NOT NULL,
    media_urls JSONB DEFAULT '[]',
    thumbnail_url VARCHAR(500),
    hashtags TEXT[] DEFAULT '{}',
    mentions UUID[] DEFAULT '{}',
    location VARCHAR(255),
    project_id UUID REFERENCES projects(id),
    
    -- Engagement metrics
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    save_count INTEGER DEFAULT 0,
    
    -- Status and visibility
    status VARCHAR(50) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived', 'deleted')),
    visibility VARCHAR(50) DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),
    is_featured BOOLEAN DEFAULT FALSE,
    is_trending BOOLEAN DEFAULT FALSE,
    priority VARCHAR(20) CHECK (priority IN ('normal', 'breaking', 'urgent')),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP,
    
    -- Indexing
    search_vector tsvector
);

-- Post interactions
CREATE TABLE IF NOT EXISTS post_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('like', 'save', 'share', 'repost')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id, type)
);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    like_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- COMMUNITY GROUPS
-- =====================================================

CREATE TABLE IF NOT EXISTS community_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    privacy VARCHAR(20) DEFAULT 'public' CHECK (privacy IN ('public', 'private', 'secret')),
    cover_image_url VARCHAR(500),
    icon_url VARCHAR(500),
    
    -- Group details
    location VARCHAR(255),
    languages TEXT[] DEFAULT '{}',
    rules TEXT[],
    tags TEXT[] DEFAULT '{}',
    
    -- Metrics
    member_count INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    growth_rate DECIMAL(5,2) DEFAULT 0,
    activity_level VARCHAR(20) DEFAULT 'low',
    
    -- Settings
    is_verified BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    auto_approve_members BOOLEAN DEFAULT FALSE,
    posting_permission VARCHAR(20) DEFAULT 'all' CHECK (posting_permission IN ('all', 'approved', 'admins')),
    
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Group members
CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES community_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('pending', 'active', 'banned', 'muted')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, user_id)
);

-- Group posts
CREATE TABLE IF NOT EXISTS group_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES community_groups(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_announcement BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, post_id)
);

-- =====================================================
-- EDUCATIONAL PLATFORM
-- =====================================================

-- Instructors
CREATE TABLE IF NOT EXISTS instructors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    credentials TEXT,
    bio TEXT,
    expertise TEXT[] DEFAULT '{}',
    rating DECIMAL(2,1) DEFAULT 0.0,
    total_students INTEGER DEFAULT 0,
    total_courses INTEGER DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    earnings DECIMAL(10,2) DEFAULT 0.00,
    stripe_account_id VARCHAR(255),
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Courses
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID NOT NULL REFERENCES instructors(id),
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    subcategory VARCHAR(50),
    level VARCHAR(20) NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    
    -- Course details
    thumbnail_url VARCHAR(500),
    preview_video_url VARCHAR(500),
    duration_hours DECIMAL(5,2),
    language VARCHAR(50) DEFAULT 'en',
    subtitles TEXT[] DEFAULT '{}',
    
    -- Pricing
    price DECIMAL(10,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'MYR',
    discount_percentage INTEGER DEFAULT 0,
    
    -- Requirements and outcomes
    prerequisites TEXT[],
    learning_outcomes TEXT[],
    target_audience TEXT[],
    
    -- Certification
    has_certificate BOOLEAN DEFAULT FALSE,
    certificate_provider VARCHAR(255),
    accreditations TEXT[] DEFAULT '{}',
    
    -- Metrics
    enrolled_count INTEGER DEFAULT 0,
    completion_count INTEGER DEFAULT 0,
    rating DECIMAL(2,1) DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    is_featured BOOLEAN DEFAULT FALSE,
    is_trending BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP
);

-- Course modules
CREATE TABLE IF NOT EXISTS course_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    duration_minutes INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Course lessons
CREATE TABLE IF NOT EXISTS course_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('video', 'reading', 'quiz', 'assignment', 'live')),
    content_url VARCHAR(500),
    duration_minutes INTEGER,
    order_index INTEGER NOT NULL,
    is_preview BOOLEAN DEFAULT FALSE,
    resources JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Course enrollments
CREATE TABLE IF NOT EXISTS course_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    completed_lessons UUID[] DEFAULT '{}',
    last_accessed_at TIMESTAMP,
    completed_at TIMESTAMP,
    certificate_issued BOOLEAN DEFAULT FALSE,
    certificate_url VARCHAR(500),
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, user_id)
);

-- Course reviews
CREATE TABLE IF NOT EXISTS course_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    review TEXT,
    is_verified_purchase BOOLEAN DEFAULT TRUE,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, user_id)
);

-- =====================================================
-- MARKETPLACE
-- =====================================================

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100),
    tax_number VARCHAR(100),
    description TEXT,
    logo_url VARCHAR(500),
    
    -- Contact details
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postcode VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Malaysia',
    
    -- Business details
    business_type VARCHAR(50),
    established_year INTEGER,
    employee_count VARCHAR(50),
    annual_revenue VARCHAR(50),
    
    -- Verification
    is_verified BOOLEAN DEFAULT FALSE,
    verification_documents JSONB DEFAULT '[]',
    verified_at TIMESTAMP,
    
    -- Ratings and metrics
    rating DECIMAL(2,1) DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,
    response_time_hours INTEGER,
    order_fulfillment_rate DECIMAL(5,2) DEFAULT 100.00,
    
    -- Settings
    minimum_order_value DECIMAL(10,2),
    payment_terms TEXT[],
    delivery_areas TEXT[],
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Product categories
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    parent_id UUID REFERENCES product_categories(id),
    description TEXT,
    icon_url VARCHAR(500),
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES product_categories(id),
    
    -- Basic info
    name VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE NOT NULL,
    description TEXT,
    brand VARCHAR(255),
    model VARCHAR(255),
    sku VARCHAR(100),
    
    -- Pricing
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'MYR',
    unit VARCHAR(50) NOT NULL,
    discount_percentage INTEGER DEFAULT 0,
    bulk_pricing JSONB DEFAULT '[]',
    is_negotiable BOOLEAN DEFAULT FALSE,
    
    -- Specifications
    specifications JSONB DEFAULT '{}',
    dimensions JSONB,
    weight DECIMAL(10,3),
    color VARCHAR(100),
    material VARCHAR(255),
    
    -- Media
    images JSONB DEFAULT '[]',
    videos JSONB DEFAULT '[]',
    documents JSONB DEFAULT '[]',
    
    -- Inventory
    in_stock BOOLEAN DEFAULT TRUE,
    stock_quantity INTEGER,
    lead_time_days INTEGER,
    min_order_quantity INTEGER DEFAULT 1,
    max_order_quantity INTEGER,
    
    -- Certifications and compliance
    certifications TEXT[] DEFAULT '{}',
    compliance_standards TEXT[] DEFAULT '{}',
    warranty_months INTEGER,
    
    -- Attributes
    tags TEXT[] DEFAULT '{}',
    is_featured BOOLEAN DEFAULT FALSE,
    is_trending BOOLEAN DEFAULT FALSE,
    is_sustainable BOOLEAN DEFAULT FALSE,
    made_in_country VARCHAR(100),
    
    -- Metrics
    view_count INTEGER DEFAULT 0,
    order_count INTEGER DEFAULT 0,
    rating DECIMAL(2,1) DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'out_of_stock', 'discontinued')),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Full text search
    search_vector tsvector
);

-- Product reviews
CREATE TABLE IF NOT EXISTS product_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID,
    
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    review TEXT,
    
    -- Detailed ratings
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
    delivery_rating INTEGER CHECK (delivery_rating >= 1 AND delivery_rating <= 5),
    
    -- Media
    images JSONB DEFAULT '[]',
    
    -- Verification
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    helpful_count INTEGER DEFAULT 0,
    
    -- Supplier response
    supplier_response TEXT,
    supplier_response_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, user_id)
);

-- Shopping cart
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- Orders
CREATE TABLE IF NOT EXISTS marketplace_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    
    -- Order details
    items JSONB NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    shipping_fee DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Delivery
    delivery_address JSONB NOT NULL,
    delivery_method VARCHAR(50),
    delivery_notes TEXT,
    estimated_delivery DATE,
    actual_delivery TIMESTAMP,
    
    -- Payment
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'pending',
    payment_reference VARCHAR(255),
    paid_at TIMESTAMP,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product inquiries
CREATE TABLE IF NOT EXISTS product_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    
    subject VARCHAR(255),
    message TEXT NOT NULL,
    quantity INTEGER,
    budget_range VARCHAR(100),
    delivery_date DATE,
    
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'responded', 'negotiating', 'closed')),
    supplier_response TEXT,
    responded_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TRENDING & ANALYTICS
-- =====================================================

CREATE TABLE IF NOT EXISTS trending_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hashtag VARCHAR(255) NOT NULL,
    category VARCHAR(50),
    post_count INTEGER DEFAULT 0,
    engagement_score INTEGER DEFAULT 0,
    trend_percentage DECIMAL(5,2) DEFAULT 0.00,
    description TEXT,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(hashtag, date)
);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS social_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    message TEXT,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Posts indexes
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_type ON posts(type);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_trending ON posts(is_trending) WHERE is_trending = TRUE;
CREATE INDEX idx_posts_search ON posts USING GIN(search_vector);
CREATE INDEX idx_posts_hashtags ON posts USING GIN(hashtags);

-- Groups indexes
CREATE INDEX idx_group_members_user ON group_members(user_id);
CREATE INDEX idx_group_members_group ON group_members(group_id);

-- Products indexes
CREATE INDEX idx_products_supplier ON products(supplier_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_search ON products USING GIN(search_vector);
CREATE INDEX idx_products_tags ON products USING GIN(tags);

-- Courses indexes
CREATE INDEX idx_courses_instructor ON courses(instructor_id);
CREATE INDEX idx_courses_category ON courses(category);
CREATE INDEX idx_course_enrollments_user ON course_enrollments(user_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update search vectors
CREATE OR REPLACE FUNCTION update_post_search_vector() RETURNS trigger AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.hashtags, ' '), '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_search_vector_trigger 
BEFORE INSERT OR UPDATE ON posts 
FOR EACH ROW EXECUTE FUNCTION update_post_search_vector();

-- Similar trigger for products
CREATE OR REPLACE FUNCTION update_product_search_vector() RETURNS trigger AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.brand, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_search_vector_trigger 
BEFORE INSERT OR UPDATE ON products 
FOR EACH ROW EXECUTE FUNCTION update_product_search_vector();

-- Update counts on interactions
CREATE OR REPLACE FUNCTION update_post_counts() RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.type = 'like' THEN
            UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
        ELSIF NEW.type = 'save' THEN
            UPDATE posts SET save_count = save_count + 1 WHERE id = NEW.post_id;
        ELSIF NEW.type = 'share' THEN
            UPDATE posts SET share_count = share_count + 1 WHERE id = NEW.post_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.type = 'like' THEN
            UPDATE posts SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.post_id;
        ELSIF OLD.type = 'save' THEN
            UPDATE posts SET save_count = GREATEST(0, save_count - 1) WHERE id = OLD.post_id;
        ELSIF OLD.type = 'share' THEN
            UPDATE posts SET share_count = GREATEST(0, share_count - 1) WHERE id = OLD.post_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_interaction_counts_trigger 
AFTER INSERT OR DELETE ON post_interactions 
FOR EACH ROW EXECUTE FUNCTION update_post_counts();

-- Update follower counts
CREATE OR REPLACE FUNCTION update_follower_counts() RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE users SET follower_count = follower_count + 1 WHERE id = NEW.following_id;
        UPDATE users SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE users SET follower_count = GREATEST(0, follower_count - 1) WHERE id = OLD.following_id;
        UPDATE users SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER follower_counts_trigger 
AFTER INSERT OR DELETE ON user_follows 
FOR EACH ROW EXECUTE FUNCTION update_follower_counts();

-- =====================================================
-- SEED DATA
-- =====================================================

-- Insert default product categories
INSERT INTO product_categories (name, slug, description) VALUES
('Building Materials', 'building-materials', 'Construction and building materials'),
('Tools & Equipment', 'tools-equipment', 'Professional tools and equipment'),
('Electrical', 'electrical', 'Electrical components and systems'),
('Plumbing', 'plumbing', 'Plumbing supplies and fixtures'),
('Safety Equipment', 'safety-equipment', 'Safety gear and protective equipment'),
('Finishes & Paints', 'finishes-paints', 'Interior and exterior finishes')
ON CONFLICT DO NOTHING;