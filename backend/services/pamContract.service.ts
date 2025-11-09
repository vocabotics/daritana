import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/daritana_dev',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/**
 * PAM Contract Type Enum
 * Based on Malaysian PAM 2018 Forms
 */
export enum PAMContractType {
  PAM_2018 = 'pam_2018', // Standard PAM Contract 2018 (With Quantities)
  PAM_2018_WOQ = 'pam_2018_woq', // PAM Contract 2018 (Without Quantities)
  PAM_SUB_2018 = 'pam_sub_2018', // PAM Sub-Contract 2018
  PAM_DESIGN_BUILD_2018 = 'pam_design_build_2018', // Design & Build Contract
  CONSULTANCY_AGREEMENT = 'consultancy_agreement', // Architect's Appointment
  MINOR_WORKS = 'minor_works' // Minor Building Works
}

/**
 * Contract Status Enum
 */
export enum ContractStatus {
  DRAFT = 'draft',
  REVIEW = 'review',
  NEGOTIATION = 'negotiation',
  APPROVED = 'approved',
  SIGNED = 'signed',
  ACTIVE = 'active',
  AMENDED = 'amended',
  SUSPENDED = 'suspended',
  TERMINATED = 'terminated',
  COMPLETED = 'completed'
}

/**
 * Payment Terms Enum (Malaysian Standards)
 */
export enum PaymentTerms {
  PROGRESS_PAYMENT = 'progress_payment', // Monthly progress claims
  MILESTONE = 'milestone', // Based on milestones
  LUMP_SUM = 'lump_sum', // Fixed lump sum
  SCHEDULE_OF_RATES = 'schedule_of_rates', // Based on rates
  REMEASUREMENT = 'remeasurement' // Subject to remeasurement
}

/**
 * PAM Contract Interface
 */
export interface PAMContract {
  id: string;
  contract_number: string;
  project_id: string;
  contract_type: PAMContractType;
  status: ContractStatus;
  title: string;
  description?: string;
  // Contract Parties
  employer_name: string;
  employer_address: string;
  employer_representative?: string;
  contractor_name: string;
  contractor_address: string;
  contractor_registration?: string;
  architect_name: string;
  architect_address: string;
  architect_registration?: string;
  quantity_surveyor_name?: string;
  quantity_surveyor_address?: string;
  // Contract Values
  contract_sum: number;
  retention_percentage: number;
  retention_limit?: number;
  performance_bond_percentage?: number;
  performance_bond_value?: number;
  liquidated_damages_rate?: number;
  defects_liability_period_months: number;
  // Dates
  letter_of_award_date?: Date;
  commencement_date: Date;
  completion_date: Date;
  extended_completion_date?: Date;
  actual_completion_date?: Date;
  // Payment Terms
  payment_terms: PaymentTerms;
  payment_certificate_period_days: number;
  honouring_certificate_period_days: number;
  advance_payment_percentage?: number;
  advance_payment_value?: number;
  // Insurance Requirements
  contractors_all_risk_required: boolean;
  car_sum_insured?: number;
  public_liability_required: boolean;
  pl_sum_insured?: number;
  workmen_compensation_required: boolean;
  // Contract Documents
  signed_contract_path?: string;
  letter_of_award_path?: string;
  performance_bond_path?: string;
  insurance_policies_paths?: string[];
  // Additional Clauses
  special_conditions?: any;
  variation_limit_percentage?: number;
  nominated_subcontractors?: string[];
  nominated_suppliers?: string[];
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Contract Clause Template Interface
 */
export interface ContractClause {
  id: string;
  clause_number: string;
  title: string;
  content: string;
  category: string;
  contract_type: PAMContractType;
  is_mandatory: boolean;
  is_standard: boolean;
  version: string;
  tags?: string[];
  created_at: Date;
  updated_at: Date;
}

/**
 * Contract Amendment Interface
 */
export interface ContractAmendment {
  id: string;
  contract_id: string;
  amendment_number: string;
  title: string;
  description: string;
  effective_date: Date;
  clauses_affected?: string[];
  original_value?: number;
  revised_value?: number;
  approved_by?: string;
  approved_date?: Date;
  document_path?: string;
  created_at: Date;
}

/**
 * Contract Certificate Interface
 */
export interface ContractCertificate {
  id: string;
  contract_id: string;
  certificate_type: string;
  certificate_number: string;
  issue_date: Date;
  amount?: number;
  description?: string;
  issued_by: string;
  document_path?: string;
  created_at: Date;
}

/**
 * PAM Contract Service Class
 */
export class PAMContractService {
  /**
   * Initialize PAM Contract tables
   */
  static async initializeTables(): Promise<void> {
    const queries = [
      // PAM Contracts table
      `CREATE TABLE IF NOT EXISTS pam_contracts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        contract_number VARCHAR(50) UNIQUE NOT NULL,
        project_id UUID NOT NULL,
        contract_type VARCHAR(50) DEFAULT 'pam_2018',
        status VARCHAR(20) DEFAULT 'draft',
        title VARCHAR(500) NOT NULL,
        description TEXT,
        employer_name VARCHAR(255) NOT NULL,
        employer_address TEXT NOT NULL,
        employer_representative VARCHAR(255),
        contractor_name VARCHAR(255) NOT NULL,
        contractor_address TEXT NOT NULL,
        contractor_registration VARCHAR(100),
        architect_name VARCHAR(255) NOT NULL,
        architect_address TEXT NOT NULL,
        architect_registration VARCHAR(100),
        quantity_surveyor_name VARCHAR(255),
        quantity_surveyor_address TEXT,
        contract_sum DECIMAL(15,2) NOT NULL,
        retention_percentage DECIMAL(5,2) DEFAULT 10,
        retention_limit DECIMAL(15,2),
        performance_bond_percentage DECIMAL(5,2),
        performance_bond_value DECIMAL(15,2),
        liquidated_damages_rate DECIMAL(15,2),
        defects_liability_period_months INTEGER DEFAULT 12,
        letter_of_award_date DATE,
        commencement_date DATE NOT NULL,
        completion_date DATE NOT NULL,
        extended_completion_date DATE,
        actual_completion_date DATE,
        payment_terms VARCHAR(50) DEFAULT 'progress_payment',
        payment_certificate_period_days INTEGER DEFAULT 14,
        honouring_certificate_period_days INTEGER DEFAULT 14,
        advance_payment_percentage DECIMAL(5,2),
        advance_payment_value DECIMAL(15,2),
        contractors_all_risk_required BOOLEAN DEFAULT true,
        car_sum_insured DECIMAL(15,2),
        public_liability_required BOOLEAN DEFAULT true,
        pl_sum_insured DECIMAL(15,2),
        workmen_compensation_required BOOLEAN DEFAULT true,
        signed_contract_path TEXT,
        letter_of_award_path TEXT,
        performance_bond_path TEXT,
        insurance_policies_paths TEXT[],
        special_conditions JSONB DEFAULT '{}',
        variation_limit_percentage DECIMAL(5,2) DEFAULT 15,
        nominated_subcontractors TEXT[],
        nominated_suppliers TEXT[],
        created_by UUID NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )`,

      // Contract Clauses Library table
      `CREATE TABLE IF NOT EXISTS contract_clauses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        clause_number VARCHAR(50) NOT NULL,
        title VARCHAR(500) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        contract_type VARCHAR(50) NOT NULL,
        is_mandatory BOOLEAN DEFAULT false,
        is_standard BOOLEAN DEFAULT true,
        version VARCHAR(20) DEFAULT '2018',
        tags TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(clause_number, contract_type, version)
      )`,

      // Contract Amendments table
      `CREATE TABLE IF NOT EXISTS contract_amendments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        contract_id UUID NOT NULL,
        amendment_number VARCHAR(50) NOT NULL,
        title VARCHAR(500) NOT NULL,
        description TEXT NOT NULL,
        effective_date DATE NOT NULL,
        clauses_affected TEXT[],
        original_value DECIMAL(15,2),
        revised_value DECIMAL(15,2),
        approved_by VARCHAR(255),
        approved_date DATE,
        document_path TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (contract_id) REFERENCES pam_contracts(id) ON DELETE CASCADE,
        UNIQUE(contract_id, amendment_number)
      )`,

      // Contract Certificates table
      `CREATE TABLE IF NOT EXISTS contract_certificates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        contract_id UUID NOT NULL,
        certificate_type VARCHAR(100) NOT NULL,
        certificate_number VARCHAR(50) NOT NULL,
        issue_date DATE NOT NULL,
        amount DECIMAL(15,2),
        description TEXT,
        issued_by VARCHAR(255) NOT NULL,
        document_path TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (contract_id) REFERENCES pam_contracts(id) ON DELETE CASCADE
      )`,

      // Contract Variations table
      `CREATE TABLE IF NOT EXISTS contract_variations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        contract_id UUID NOT NULL,
        variation_order_number VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        instruction_date DATE NOT NULL,
        value DECIMAL(15,2),
        time_extension_days INTEGER,
        approved BOOLEAN DEFAULT false,
        approved_date DATE,
        approved_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (contract_id) REFERENCES pam_contracts(id) ON DELETE CASCADE
      )`,

      // Payment Certificates table
      `CREATE TABLE IF NOT EXISTS payment_certificates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        contract_id UUID NOT NULL,
        certificate_number INTEGER NOT NULL,
        certificate_date DATE NOT NULL,
        work_done_value DECIMAL(15,2),
        materials_on_site DECIMAL(15,2),
        variation_value DECIMAL(15,2),
        previous_certified DECIMAL(15,2),
        current_certified DECIMAL(15,2),
        retention_amount DECIMAL(15,2),
        advance_recovery DECIMAL(15,2),
        net_payment DECIMAL(15,2),
        certified_by VARCHAR(255),
        approved_by VARCHAR(255),
        payment_date DATE,
        payment_reference VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (contract_id) REFERENCES pam_contracts(id) ON DELETE CASCADE
      )`,

      // Create indexes
      `CREATE INDEX IF NOT EXISTS idx_pam_contracts_project_id ON pam_contracts(project_id)`,
      `CREATE INDEX IF NOT EXISTS idx_pam_contracts_status ON pam_contracts(status)`,
      `CREATE INDEX IF NOT EXISTS idx_pam_contracts_contract_type ON pam_contracts(contract_type)`,
      `CREATE INDEX IF NOT EXISTS idx_contract_amendments_contract_id ON contract_amendments(contract_id)`,
      `CREATE INDEX IF NOT EXISTS idx_payment_certificates_contract_id ON payment_certificates(contract_id)`
    ];

    for (const query of queries) {
      await pool.query(query);
    }

    // Initialize standard PAM 2018 clauses if not exists
    await this.initializeStandardClauses();
  }

  /**
   * Initialize Standard PAM 2018 Clauses
   */
  private static async initializeStandardClauses(): Promise<void> {
    const standardClauses = [
      {
        clause_number: '1.0',
        title: 'Interpretation and Definitions',
        content: 'Standard definitions as per PAM Contract 2018 including Employer, Contractor, Architect, Contract Documents, etc.',
        category: 'General',
        contract_type: PAMContractType.PAM_2018,
        is_mandatory: true
      },
      {
        clause_number: '2.0',
        title: 'Architect\'s Instructions',
        content: 'The Contractor shall comply with all instructions issued by the Architect in regard to the Works.',
        category: 'Administration',
        contract_type: PAMContractType.PAM_2018,
        is_mandatory: true
      },
      {
        clause_number: '5.0',
        title: 'Contract Documents',
        content: 'The Contract Documents shall comprise the Articles of Agreement, Conditions of Contract, Drawings, Bills of Quantities, and other documents.',
        category: 'Documentation',
        contract_type: PAMContractType.PAM_2018,
        is_mandatory: true
      },
      {
        clause_number: '11.0',
        title: 'Variations',
        content: 'The Architect may issue instructions for variations to the Works. All variations shall be valued in accordance with the Contract.',
        category: 'Variations',
        contract_type: PAMContractType.PAM_2018,
        is_mandatory: true
      },
      {
        clause_number: '15.0',
        title: 'Practical Completion',
        content: 'When the Works are practically completed, the Architect shall issue a Certificate of Practical Completion.',
        category: 'Completion',
        contract_type: PAMContractType.PAM_2018,
        is_mandatory: true
      },
      {
        clause_number: '20.0',
        title: 'Insurances',
        content: 'The Contractor shall maintain Contractors All Risk Insurance, Public Liability Insurance, and Workmen\'s Compensation as required.',
        category: 'Insurance',
        contract_type: PAMContractType.PAM_2018,
        is_mandatory: true
      },
      {
        clause_number: '24.0',
        title: 'Damages for Non-Completion',
        content: 'If the Contractor fails to complete by the Completion Date, liquidated damages shall apply at the rate stated in the Contract.',
        category: 'Damages',
        contract_type: PAMContractType.PAM_2018,
        is_mandatory: true
      },
      {
        clause_number: '27.0',
        title: 'Defects Liability',
        content: 'The Contractor shall make good all defects during the Defects Liability Period of 12 months from Practical Completion.',
        category: 'Defects',
        contract_type: PAMContractType.PAM_2018,
        is_mandatory: true
      },
      {
        clause_number: '30.0',
        title: 'Certificates and Payments',
        content: 'The Architect shall issue Interim Certificates at monthly intervals. Payment shall be made within the period stated.',
        category: 'Payment',
        contract_type: PAMContractType.PAM_2018,
        is_mandatory: true
      },
      {
        clause_number: '31.0',
        title: 'Retention',
        content: 'Retention of 10% (or as stated) shall be deducted from interim payments, subject to the retention limit.',
        category: 'Payment',
        contract_type: PAMContractType.PAM_2018,
        is_mandatory: true
      }
    ];

    for (const clause of standardClauses) {
      await pool.query(
        `INSERT INTO contract_clauses (
          clause_number, title, content, category, contract_type, is_mandatory, is_standard
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (clause_number, contract_type, version) DO NOTHING`,
        [
          clause.clause_number,
          clause.title,
          clause.content,
          clause.category,
          clause.contract_type,
          clause.is_mandatory,
          true
        ]
      );
    }
  }

  /**
   * Generate Contract number
   */
  private static async generateContractNumber(projectId: string): Promise<string> {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM pam_contracts WHERE project_id = $1`,
      [projectId]
    );
    const count = parseInt(result.rows[0].count) + 1;
    const projectCode = projectId.substring(0, 8).toUpperCase();
    const year = new Date().getFullYear();
    return `PAM-${projectCode}-${year}-${String(count).padStart(3, '0')}`;
  }

  /**
   * Create new PAM Contract
   */
  static async createContract(data: Partial<PAMContract>): Promise<PAMContract> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const contractNumber = await this.generateContractNumber(data.project_id!);
      const contractId = uuidv4();

      // Calculate retention limit if not provided (typically 5% of contract sum)
      const retentionLimit = data.retention_limit || (data.contract_sum! * 0.05);

      // Calculate performance bond value if percentage provided
      const performanceBondValue = data.performance_bond_percentage
        ? (data.contract_sum! * data.performance_bond_percentage / 100)
        : data.performance_bond_value;

      const query = `
        INSERT INTO pam_contracts (
          id, contract_number, project_id, contract_type, status, title, description,
          employer_name, employer_address, employer_representative,
          contractor_name, contractor_address, contractor_registration,
          architect_name, architect_address, architect_registration,
          quantity_surveyor_name, quantity_surveyor_address,
          contract_sum, retention_percentage, retention_limit,
          performance_bond_percentage, performance_bond_value,
          liquidated_damages_rate, defects_liability_period_months,
          letter_of_award_date, commencement_date, completion_date,
          payment_terms, payment_certificate_period_days,
          honouring_certificate_period_days, advance_payment_percentage,
          advance_payment_value, contractors_all_risk_required,
          car_sum_insured, public_liability_required, pl_sum_insured,
          workmen_compensation_required, special_conditions,
          variation_limit_percentage, nominated_subcontractors,
          nominated_suppliers, created_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28,
          $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41,
          $42, $43, $44
        ) RETURNING *
      `;

      const values = [
        contractId,
        contractNumber,
        data.project_id,
        data.contract_type || PAMContractType.PAM_2018,
        ContractStatus.DRAFT,
        data.title,
        data.description,
        data.employer_name,
        data.employer_address,
        data.employer_representative,
        data.contractor_name,
        data.contractor_address,
        data.contractor_registration,
        data.architect_name,
        data.architect_address,
        data.architect_registration,
        data.quantity_surveyor_name,
        data.quantity_surveyor_address,
        data.contract_sum,
        data.retention_percentage || 10,
        retentionLimit,
        data.performance_bond_percentage,
        performanceBondValue,
        data.liquidated_damages_rate,
        data.defects_liability_period_months || 12,
        data.letter_of_award_date,
        data.commencement_date,
        data.completion_date,
        data.payment_terms || PaymentTerms.PROGRESS_PAYMENT,
        data.payment_certificate_period_days || 14,
        data.honouring_certificate_period_days || 14,
        data.advance_payment_percentage,
        data.advance_payment_value,
        data.contractors_all_risk_required !== false,
        data.car_sum_insured || data.contract_sum,
        data.public_liability_required !== false,
        data.pl_sum_insured,
        data.workmen_compensation_required !== false,
        data.special_conditions || {},
        data.variation_limit_percentage || 15,
        data.nominated_subcontractors || [],
        data.nominated_suppliers || [],
        data.created_by
      ];

      const result = await client.query(query, values);

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get Contract by ID
   */
  static async getContractById(id: string): Promise<PAMContract | null> {
    const query = `SELECT * FROM pam_contracts WHERE id = $1`;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Get Contracts by project
   */
  static async getContractsByProject(projectId: string): Promise<PAMContract[]> {
    const query = `
      SELECT * FROM pam_contracts
      WHERE project_id = $1
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [projectId]);
    return result.rows;
  }

  /**
   * Update Contract Status
   */
  static async updateContractStatus(
    id: string,
    status: ContractStatus,
    userId: string
  ): Promise<PAMContract> {
    const query = `
      UPDATE pam_contracts
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [status, id]);

    // Send notification for important status changes
    if (status === ContractStatus.SIGNED) {
      await this.sendNotification(
        userId,
        'Contract Signed',
        `Contract ${result.rows[0].contract_number} has been signed and is now active`,
        'contract',
        id
      );
    }

    return result.rows[0];
  }

  /**
   * Get Standard Clauses
   */
  static async getStandardClauses(contractType: PAMContractType): Promise<ContractClause[]> {
    const query = `
      SELECT * FROM contract_clauses
      WHERE contract_type = $1 AND is_standard = true
      ORDER BY clause_number
    `;
    const result = await pool.query(query, [contractType]);
    return result.rows;
  }

  /**
   * Create Contract Amendment
   */
  static async createAmendment(amendment: Partial<ContractAmendment>): Promise<ContractAmendment> {
    const amendmentId = uuidv4();

    // Generate amendment number
    const countResult = await pool.query(
      `SELECT COUNT(*) as count FROM contract_amendments WHERE contract_id = $1`,
      [amendment.contract_id]
    );
    const count = parseInt(countResult.rows[0].count) + 1;
    const amendmentNumber = `AMD-${String(count).padStart(3, '0')}`;

    const query = `
      INSERT INTO contract_amendments (
        id, contract_id, amendment_number, title, description,
        effective_date, clauses_affected, original_value, revised_value,
        approved_by, approved_date, document_path
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const result = await pool.query(query, [
      amendmentId,
      amendment.contract_id,
      amendmentNumber,
      amendment.title,
      amendment.description,
      amendment.effective_date,
      amendment.clauses_affected || [],
      amendment.original_value,
      amendment.revised_value,
      amendment.approved_by,
      amendment.approved_date,
      amendment.document_path
    ]);

    // Update contract status to amended
    await this.updateContractStatus(amendment.contract_id!, ContractStatus.AMENDED, amendment.approved_by!);

    return result.rows[0];
  }

  /**
   * Create Payment Certificate
   */
  static async createPaymentCertificate(data: any): Promise<any> {
    const certId = uuidv4();

    const query = `
      INSERT INTO payment_certificates (
        id, contract_id, certificate_number, certificate_date,
        work_done_value, materials_on_site, variation_value,
        previous_certified, current_certified, retention_amount,
        advance_recovery, net_payment, certified_by, approved_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    // Calculate values
    const grossValue = (data.work_done_value || 0) + (data.materials_on_site || 0) + (data.variation_value || 0);
    const currentCertified = grossValue - (data.previous_certified || 0);

    // Get contract for retention percentage
    const contract = await this.getContractById(data.contract_id);
    const retentionAmount = currentCertified * (contract?.retention_percentage || 10) / 100;
    const netPayment = currentCertified - retentionAmount - (data.advance_recovery || 0);

    const result = await pool.query(query, [
      certId,
      data.contract_id,
      data.certificate_number,
      data.certificate_date || new Date(),
      data.work_done_value,
      data.materials_on_site,
      data.variation_value,
      data.previous_certified || 0,
      currentCertified,
      retentionAmount,
      data.advance_recovery || 0,
      netPayment,
      data.certified_by,
      data.approved_by
    ]);

    return result.rows[0];
  }

  /**
   * Get Payment Certificates
   */
  static async getPaymentCertificates(contractId: string): Promise<any[]> {
    const query = `
      SELECT * FROM payment_certificates
      WHERE contract_id = $1
      ORDER BY certificate_number
    `;
    const result = await pool.query(query, [contractId]);
    return result.rows;
  }

  /**
   * Create Certificate (CPC, Final, etc.)
   */
  static async createCertificate(cert: Partial<ContractCertificate>): Promise<ContractCertificate> {
    const certId = uuidv4();

    const query = `
      INSERT INTO contract_certificates (
        id, contract_id, certificate_type, certificate_number,
        issue_date, amount, description, issued_by, document_path
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await pool.query(query, [
      certId,
      cert.contract_id,
      cert.certificate_type,
      cert.certificate_number,
      cert.issue_date,
      cert.amount,
      cert.description,
      cert.issued_by,
      cert.document_path
    ]);

    // Update contract dates based on certificate type
    if (cert.certificate_type === 'Practical Completion') {
      await pool.query(
        `UPDATE pam_contracts SET actual_completion_date = $1 WHERE id = $2`,
        [cert.issue_date, cert.contract_id]
      );
    }

    return result.rows[0];
  }

  /**
   * Generate Contract Document
   */
  static async generateContractDocument(contractId: string): Promise<string> {
    const contract = await this.getContractById(contractId);
    if (!contract) {
      throw new Error('Contract not found');
    }

    const clauses = await this.getStandardClauses(contract.contract_type);

    // This would typically generate a PDF document
    // For now, we'll return a placeholder path
    const documentPath = `/contracts/${contract.contract_number}.pdf`;

    // Update contract with document path
    await pool.query(
      `UPDATE pam_contracts SET signed_contract_path = $1 WHERE id = $2`,
      [documentPath, contractId]
    );

    return documentPath;
  }

  /**
   * Calculate Contract Progress
   */
  static async calculateProgress(contractId: string): Promise<any> {
    const contract = await this.getContractById(contractId);
    const certificates = await this.getPaymentCertificates(contractId);

    const totalCertified = certificates.reduce((sum, cert) => sum + (cert.current_certified || 0), 0);
    const progressPercentage = contract?.contract_sum
      ? (totalCertified / contract.contract_sum) * 100
      : 0;

    const timeElapsed = contract?.commencement_date
      ? Math.floor((Date.now() - new Date(contract.commencement_date).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const totalDuration = contract?.commencement_date && contract?.completion_date
      ? Math.floor((new Date(contract.completion_date).getTime() - new Date(contract.commencement_date).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const timeProgress = totalDuration > 0 ? (timeElapsed / totalDuration) * 100 : 0;

    return {
      contractSum: contract?.contract_sum || 0,
      totalCertified,
      progressPercentage: Math.min(progressPercentage, 100),
      timeElapsed,
      totalDuration,
      timeProgress: Math.min(timeProgress, 100),
      retentionHeld: certificates.reduce((sum, cert) => sum + (cert.retention_amount || 0), 0),
      paymentsCount: certificates.length
    };
  }

  /**
   * Get Contract Summary
   */
  static async getContractSummary(projectId: string): Promise<any> {
    const query = `
      SELECT
        COUNT(*) as total_contracts,
        COUNT(*) FILTER (WHERE status = 'active') as active_contracts,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_contracts,
        SUM(contract_sum) as total_contract_value,
        AVG(EXTRACT(EPOCH FROM (completion_date - commencement_date))/86400) as avg_duration_days,
        (SELECT COUNT(*) FROM contract_amendments ca
         JOIN pam_contracts pc ON ca.contract_id = pc.id
         WHERE pc.project_id = $1) as total_amendments,
        (SELECT SUM(net_payment) FROM payment_certificates pay
         JOIN pam_contracts pc ON pay.contract_id = pc.id
         WHERE pc.project_id = $1) as total_paid
      FROM pam_contracts
      WHERE project_id = $1
    `;

    const result = await pool.query(query, [projectId]);
    return result.rows[0];
  }

  /**
   * Send notification (simplified - integrate with actual notification service)
   */
  private static async sendNotification(
    userId: string,
    title: string,
    message: string,
    type: string,
    relatedId: string
  ): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, related_id, is_read)
         VALUES ($1, $2, $3, $4, $5, false)`,
        [userId, title, message, type, relatedId]
      );
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }
}

export default PAMContractService;