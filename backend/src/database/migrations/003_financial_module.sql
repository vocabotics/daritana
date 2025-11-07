-- Financial Module Migration
-- Adds support for quotations, invoices, and payment tracking

-- Create quotations table
CREATE TABLE IF NOT EXISTS quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_number VARCHAR(50) UNIQUE NOT NULL,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES users(id),
    prepared_by UUID NOT NULL REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'rejected', 'revised', 'expired')),
    valid_until DATE NOT NULL,
    subtotal DECIMAL(15, 2) DEFAULT 0,
    sst_amount DECIMAL(15, 2) DEFAULT 0,
    total_amount DECIMAL(15, 2) DEFAULT 0,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    terms_and_conditions TEXT,
    payment_terms VARCHAR(100) DEFAULT '30 days',
    notes TEXT,
    revision_number INTEGER DEFAULT 0,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    rejected_reason TEXT,
    sent_at TIMESTAMP,
    viewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create quotation_items table
CREATE TABLE IF NOT EXISTS quotation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    item_code VARCHAR(50),
    description TEXT NOT NULL,
    category VARCHAR(100),
    quantity DECIMAL(10, 2) DEFAULT 1,
    unit VARCHAR(50) DEFAULT 'unit',
    unit_price DECIMAL(15, 2) NOT NULL,
    total_price DECIMAL(15, 2) NOT NULL,
    sst_rate DECIMAL(5, 2) DEFAULT 8,
    sst_amount DECIMAL(15, 2) DEFAULT 0,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    notes TEXT,
    sort_order INTEGER DEFAULT 0,
    is_optional BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create item_library table
CREATE TABLE IF NOT EXISTS item_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    unit VARCHAR(50) DEFAULT 'unit',
    base_price DECIMAL(15, 2) NOT NULL,
    sst_rate DECIMAL(5, 2) DEFAULT 8,
    supplier VARCHAR(255),
    brand VARCHAR(255),
    specifications TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    tags TEXT[],
    image_url VARCHAR(500),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced invoices table (if not exists, create it)
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    quotation_id UUID REFERENCES quotations(id),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES users(id),
    issued_by UUID NOT NULL REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'cancelled')),
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal DECIMAL(15, 2) DEFAULT 0,
    sst_amount DECIMAL(15, 2) DEFAULT 0,
    total_amount DECIMAL(15, 2) DEFAULT 0,
    paid_amount DECIMAL(15, 2) DEFAULT 0,
    balance_amount DECIMAL(15, 2) DEFAULT 0,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    payment_terms VARCHAR(100) DEFAULT '30 days',
    notes TEXT,
    reminder_sent_at TIMESTAMP,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create invoice_items table
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    item_code VARCHAR(50),
    description TEXT NOT NULL,
    category VARCHAR(100),
    quantity DECIMAL(10, 2) DEFAULT 1,
    unit VARCHAR(50) DEFAULT 'unit',
    unit_price DECIMAL(15, 2) NOT NULL,
    total_price DECIMAL(15, 2) NOT NULL,
    sst_rate DECIMAL(5, 2) DEFAULT 8,
    sst_amount DECIMAL(15, 2) DEFAULT 0,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    notes TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_id UUID REFERENCES invoices(id),
    project_id UUID REFERENCES projects(id),
    payer_id UUID NOT NULL REFERENCES users(id),
    receiver_id UUID NOT NULL REFERENCES users(id),
    amount DECIMAL(15, 2) NOT NULL,
    payment_method VARCHAR(50) CHECK (payment_method IN ('bank_transfer', 'fpx', 'credit_card', 'debit_card', 'cash', 'cheque', 'ewallet', 'jompay')),
    payment_type VARCHAR(50) CHECK (payment_type IN ('deposit', 'progress', 'final', 'retention', 'refund')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    transaction_id VARCHAR(255),
    reference_number VARCHAR(255),
    payment_date DATE NOT NULL,
    notes TEXT,
    receipt_url VARCHAR(500),
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create receipts table
CREATE TABLE IF NOT EXISTS receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    payment_id UUID NOT NULL REFERENCES payments(id),
    invoice_id UUID REFERENCES invoices(id),
    amount DECIMAL(15, 2) NOT NULL,
    issued_date DATE NOT NULL,
    issued_by UUID NOT NULL REFERENCES users(id),
    notes TEXT,
    pdf_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create statements table for account statements
CREATE TABLE IF NOT EXISTS statements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    statement_number VARCHAR(50) UNIQUE NOT NULL,
    client_id UUID NOT NULL REFERENCES users(id),
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    opening_balance DECIMAL(15, 2) DEFAULT 0,
    closing_balance DECIMAL(15, 2) DEFAULT 0,
    total_invoiced DECIMAL(15, 2) DEFAULT 0,
    total_paid DECIMAL(15, 2) DEFAULT 0,
    pdf_url VARCHAR(500),
    generated_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create aging_reports table
CREATE TABLE IF NOT EXISTS aging_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES users(id),
    report_date DATE NOT NULL,
    current_amount DECIMAL(15, 2) DEFAULT 0,
    days_30_amount DECIMAL(15, 2) DEFAULT 0,
    days_60_amount DECIMAL(15, 2) DEFAULT 0,
    days_90_amount DECIMAL(15, 2) DEFAULT 0,
    days_over_90_amount DECIMAL(15, 2) DEFAULT 0,
    total_outstanding DECIMAL(15, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quotations_project_id ON quotations(project_id);
CREATE INDEX IF NOT EXISTS idx_quotations_client_id ON quotations(client_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_number ON quotations(quotation_number);

CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id ON quotation_items(quotation_id);
CREATE INDEX IF NOT EXISTS idx_item_library_category ON item_library(category);
CREATE INDEX IF NOT EXISTS idx_item_library_active ON item_library(is_active);

CREATE INDEX IF NOT EXISTS idx_invoices_project_id ON invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_project_id ON payments(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

CREATE INDEX IF NOT EXISTS idx_receipts_payment_id ON receipts(payment_id);
CREATE INDEX IF NOT EXISTS idx_statements_client_id ON statements(client_id);
CREATE INDEX IF NOT EXISTS idx_aging_reports_client_id ON aging_reports(client_id);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quotations_updated_at BEFORE UPDATE ON quotations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_quotation_items_updated_at BEFORE UPDATE ON quotation_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_item_library_updated_at BEFORE UPDATE ON item_library
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_invoice_items_updated_at BEFORE UPDATE ON invoice_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_receipts_updated_at BEFORE UPDATE ON receipts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_statements_updated_at BEFORE UPDATE ON statements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_aging_reports_updated_at BEFORE UPDATE ON aging_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();