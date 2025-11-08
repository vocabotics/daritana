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
 * RFI Status Enum
 */
export enum RFIStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  RESPONDED = 'responded',
  CLOSED = 'closed',
  REJECTED = 'rejected'
}

/**
 * RFI Priority Enum
 */
export enum RFIPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * RFI Category Enum
 */
export enum RFICategory {
  DESIGN_CLARIFICATION = 'design_clarification',
  MATERIAL_SPECIFICATION = 'material_specification',
  CONSTRUCTION_METHOD = 'construction_method',
  SCHEDULE = 'schedule',
  COST = 'cost',
  SAFETY = 'safety',
  COMPLIANCE = 'compliance',
  OTHER = 'other'
}

/**
 * RFI Interface
 */
export interface RFI {
  id: string;
  rfi_number: string;
  project_id: string;
  title: string;
  description: string;
  category: RFICategory;
  priority: RFIPriority;
  status: RFIStatus;
  submitted_by: string;
  submitted_to: string;
  assigned_to?: string;
  due_date?: Date;
  submitted_date?: Date;
  responded_date?: Date;
  closed_date?: Date;
  response?: string;
  impact_cost?: boolean;
  impact_schedule?: boolean;
  estimated_cost_impact?: number;
  estimated_schedule_impact_days?: number;
  attachments?: string[];
  drawing_references?: string[];
  specification_references?: string[];
  tags?: string[];
  created_at: Date;
  updated_at: Date;
}

/**
 * RFI Attachment Interface
 */
export interface RFIAttachment {
  id: string;
  rfi_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  uploaded_by: string;
  uploaded_at: Date;
}

/**
 * RFI Response Interface
 */
export interface RFIResponse {
  id: string;
  rfi_id: string;
  responder_id: string;
  response_text: string;
  attachments?: string[];
  created_at: Date;
}

/**
 * RFI Service Class
 */
export class RFIService {
  /**
   * Initialize RFI tables
   */
  static async initializeTables(): Promise<void> {
    const queries = [
      // RFI table
      `CREATE TABLE IF NOT EXISTS rfis (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        rfi_number VARCHAR(50) UNIQUE NOT NULL,
        project_id UUID NOT NULL,
        title VARCHAR(500) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(50) DEFAULT 'other',
        priority VARCHAR(20) DEFAULT 'medium',
        status VARCHAR(50) DEFAULT 'draft',
        submitted_by UUID NOT NULL,
        submitted_to UUID,
        assigned_to UUID,
        due_date TIMESTAMP,
        submitted_date TIMESTAMP,
        responded_date TIMESTAMP,
        closed_date TIMESTAMP,
        response TEXT,
        impact_cost BOOLEAN DEFAULT false,
        impact_schedule BOOLEAN DEFAULT false,
        estimated_cost_impact DECIMAL(15,2),
        estimated_schedule_impact_days INTEGER,
        drawing_references TEXT[],
        specification_references TEXT[],
        tags TEXT[],
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )`,

      // RFI attachments table
      `CREATE TABLE IF NOT EXISTS rfi_attachments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        rfi_id UUID NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER,
        file_type VARCHAR(100),
        uploaded_by UUID NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (rfi_id) REFERENCES rfis(id) ON DELETE CASCADE
      )`,

      // RFI responses table
      `CREATE TABLE IF NOT EXISTS rfi_responses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        rfi_id UUID NOT NULL,
        responder_id UUID NOT NULL,
        response_text TEXT NOT NULL,
        attachments TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (rfi_id) REFERENCES rfis(id) ON DELETE CASCADE
      )`,

      // RFI history/audit log
      `CREATE TABLE IF NOT EXISTS rfi_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        rfi_id UUID NOT NULL,
        user_id UUID NOT NULL,
        action VARCHAR(100) NOT NULL,
        field_changed VARCHAR(100),
        old_value TEXT,
        new_value TEXT,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (rfi_id) REFERENCES rfis(id) ON DELETE CASCADE
      )`,

      // Create indexes
      `CREATE INDEX IF NOT EXISTS idx_rfis_project_id ON rfis(project_id)`,
      `CREATE INDEX IF NOT EXISTS idx_rfis_status ON rfis(status)`,
      `CREATE INDEX IF NOT EXISTS idx_rfis_submitted_by ON rfis(submitted_by)`,
      `CREATE INDEX IF NOT EXISTS idx_rfis_assigned_to ON rfis(assigned_to)`,
      `CREATE INDEX IF NOT EXISTS idx_rfi_attachments_rfi_id ON rfi_attachments(rfi_id)`,
      `CREATE INDEX IF NOT EXISTS idx_rfi_responses_rfi_id ON rfi_responses(rfi_id)`
    ];

    for (const query of queries) {
      await pool.query(query);
    }
  }

  /**
   * Generate RFI number
   */
  private static async generateRFINumber(projectId: string): Promise<string> {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM rfis WHERE project_id = $1`,
      [projectId]
    );
    const count = parseInt(result.rows[0].count) + 1;
    const projectCode = projectId.substring(0, 8).toUpperCase();
    return `RFI-${projectCode}-${String(count).padStart(4, '0')}`;
  }

  /**
   * Create new RFI
   */
  static async createRFI(data: Partial<RFI>): Promise<RFI> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const rfiNumber = await this.generateRFINumber(data.project_id!);
      const rfiId = uuidv4();

      const query = `
        INSERT INTO rfis (
          id, rfi_number, project_id, title, description, category,
          priority, status, submitted_by, submitted_to, assigned_to,
          due_date, impact_cost, impact_schedule, estimated_cost_impact,
          estimated_schedule_impact_days, drawing_references,
          specification_references, tags
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
        ) RETURNING *
      `;

      const values = [
        rfiId,
        rfiNumber,
        data.project_id,
        data.title,
        data.description,
        data.category || RFICategory.OTHER,
        data.priority || RFIPriority.MEDIUM,
        RFIStatus.DRAFT,
        data.submitted_by,
        data.submitted_to,
        data.assigned_to,
        data.due_date,
        data.impact_cost || false,
        data.impact_schedule || false,
        data.estimated_cost_impact,
        data.estimated_schedule_impact_days,
        data.drawing_references || [],
        data.specification_references || [],
        data.tags || []
      ];

      const result = await client.query(query, values);

      // Log history
      await this.logHistory(client, rfiId, data.submitted_by!, 'created', null, null, null, 'RFI created');

      // Send notification
      if (data.assigned_to) {
        await this.sendNotification(
          data.assigned_to,
          'New RFI Assigned',
          `You have been assigned RFI ${rfiNumber}: ${data.title}`,
          'rfi',
          rfiId
        );
      }

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
   * Get RFI by ID
   */
  static async getRFIById(id: string): Promise<RFI | null> {
    const query = `
      SELECT r.*,
        array_agg(DISTINCT ra.file_path) FILTER (WHERE ra.file_path IS NOT NULL) as attachments
      FROM rfis r
      LEFT JOIN rfi_attachments ra ON r.id = ra.rfi_id
      WHERE r.id = $1
      GROUP BY r.id
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Get RFIs by project
   */
  static async getRFIsByProject(projectId: string, filters?: {
    status?: RFIStatus;
    priority?: RFIPriority;
    category?: RFICategory;
    assigned_to?: string;
  }): Promise<RFI[]> {
    let query = `
      SELECT r.*,
        array_agg(DISTINCT ra.file_path) FILTER (WHERE ra.file_path IS NOT NULL) as attachments
      FROM rfis r
      LEFT JOIN rfi_attachments ra ON r.id = ra.rfi_id
      WHERE r.project_id = $1
    `;

    const values: any[] = [projectId];
    let paramCount = 1;

    if (filters?.status) {
      paramCount++;
      query += ` AND r.status = $${paramCount}`;
      values.push(filters.status);
    }

    if (filters?.priority) {
      paramCount++;
      query += ` AND r.priority = $${paramCount}`;
      values.push(filters.priority);
    }

    if (filters?.category) {
      paramCount++;
      query += ` AND r.category = $${paramCount}`;
      values.push(filters.category);
    }

    if (filters?.assigned_to) {
      paramCount++;
      query += ` AND r.assigned_to = $${paramCount}`;
      values.push(filters.assigned_to);
    }

    query += ` GROUP BY r.id ORDER BY r.created_at DESC`;

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Update RFI
   */
  static async updateRFI(id: string, updates: Partial<RFI>, userId: string): Promise<RFI> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get current RFI for comparison
      const currentRFI = await this.getRFIById(id);
      if (!currentRFI) {
        throw new Error('RFI not found');
      }

      // Build update query
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCount = 0;

      const allowedFields = [
        'title', 'description', 'category', 'priority', 'status',
        'assigned_to', 'due_date', 'response', 'impact_cost',
        'impact_schedule', 'estimated_cost_impact', 'estimated_schedule_impact_days',
        'drawing_references', 'specification_references', 'tags'
      ];

      for (const field of allowedFields) {
        if (updates[field as keyof RFI] !== undefined) {
          paramCount++;
          updateFields.push(`${field} = $${paramCount}`);
          values.push(updates[field as keyof RFI]);

          // Log field changes
          await this.logHistory(
            client, id, userId, 'updated', field,
            currentRFI[field as keyof RFI]?.toString(),
            updates[field as keyof RFI]?.toString(),
            null
          );
        }
      }

      // Handle status changes
      if (updates.status) {
        const now = new Date();
        if (updates.status === RFIStatus.SUBMITTED && !currentRFI.submitted_date) {
          paramCount++;
          updateFields.push(`submitted_date = $${paramCount}`);
          values.push(now);
        } else if (updates.status === RFIStatus.RESPONDED && !currentRFI.responded_date) {
          paramCount++;
          updateFields.push(`responded_date = $${paramCount}`);
          values.push(now);
        } else if (updates.status === RFIStatus.CLOSED && !currentRFI.closed_date) {
          paramCount++;
          updateFields.push(`closed_date = $${paramCount}`);
          values.push(now);
        }
      }

      paramCount++;
      updateFields.push(`updated_at = $${paramCount}`);
      values.push(new Date());

      paramCount++;
      values.push(id);

      const query = `
        UPDATE rfis
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await client.query(query, values);

      // Send notifications for important changes
      if (updates.status === RFIStatus.RESPONDED && currentRFI.submitted_by) {
        await this.sendNotification(
          currentRFI.submitted_by,
          'RFI Response Received',
          `RFI ${currentRFI.rfi_number} has been responded to`,
          'rfi',
          id
        );
      }

      if (updates.assigned_to && updates.assigned_to !== currentRFI.assigned_to) {
        await this.sendNotification(
          updates.assigned_to,
          'RFI Assigned to You',
          `RFI ${currentRFI.rfi_number}: ${currentRFI.title}`,
          'rfi',
          id
        );
      }

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
   * Submit RFI
   */
  static async submitRFI(id: string, userId: string): Promise<RFI> {
    return this.updateRFI(id, {
      status: RFIStatus.SUBMITTED,
      submitted_date: new Date()
    }, userId);
  }

  /**
   * Respond to RFI
   */
  static async respondToRFI(
    id: string,
    response: string,
    responderId: string,
    attachments?: string[]
  ): Promise<RFIResponse> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create response record
      const responseQuery = `
        INSERT INTO rfi_responses (rfi_id, responder_id, response_text, attachments)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

      const responseResult = await client.query(responseQuery, [
        id, responderId, response, attachments || []
      ]);

      // Update RFI status and response
      await this.updateRFI(id, {
        status: RFIStatus.RESPONDED,
        response: response,
        responded_date: new Date()
      }, responderId);

      await client.query('COMMIT');
      return responseResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Close RFI
   */
  static async closeRFI(id: string, userId: string, comment?: string): Promise<RFI> {
    const rfi = await this.updateRFI(id, {
      status: RFIStatus.CLOSED,
      closed_date: new Date()
    }, userId);

    if (comment) {
      await pool.query(
        `INSERT INTO rfi_history (rfi_id, user_id, action, comment)
         VALUES ($1, $2, $3, $4)`,
        [id, userId, 'closed', comment]
      );
    }

    return rfi;
  }

  /**
   * Add attachment to RFI
   */
  static async addAttachment(
    rfiId: string,
    fileName: string,
    filePath: string,
    fileSize: number,
    fileType: string,
    uploadedBy: string
  ): Promise<RFIAttachment> {
    const query = `
      INSERT INTO rfi_attachments (rfi_id, file_name, file_path, file_size, file_type, uploaded_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await pool.query(query, [
      rfiId, fileName, filePath, fileSize, fileType, uploadedBy
    ]);

    return result.rows[0];
  }

  /**
   * Get RFI attachments
   */
  static async getAttachments(rfiId: string): Promise<RFIAttachment[]> {
    const query = `SELECT * FROM rfi_attachments WHERE rfi_id = $1 ORDER BY uploaded_at DESC`;
    const result = await pool.query(query, [rfiId]);
    return result.rows;
  }

  /**
   * Delete attachment
   */
  static async deleteAttachment(attachmentId: string): Promise<boolean> {
    const result = await pool.query(
      `DELETE FROM rfi_attachments WHERE id = $1`,
      [attachmentId]
    );
    return result.rowCount! > 0;
  }

  /**
   * Get RFI responses
   */
  static async getResponses(rfiId: string): Promise<RFIResponse[]> {
    const query = `
      SELECT r.*, u.name as responder_name
      FROM rfi_responses r
      LEFT JOIN users u ON r.responder_id = u.id
      WHERE r.rfi_id = $1
      ORDER BY r.created_at DESC
    `;
    const result = await pool.query(query, [rfiId]);
    return result.rows;
  }

  /**
   * Get RFI history
   */
  static async getHistory(rfiId: string): Promise<any[]> {
    const query = `
      SELECT h.*, u.name as user_name
      FROM rfi_history h
      LEFT JOIN users u ON h.user_id = u.id
      WHERE h.rfi_id = $1
      ORDER BY h.created_at DESC
    `;
    const result = await pool.query(query, [rfiId]);
    return result.rows;
  }

  /**
   * Get RFI statistics
   */
  static async getStatistics(projectId: string): Promise<any> {
    const query = `
      SELECT
        COUNT(*) FILTER (WHERE status = 'draft') as draft_count,
        COUNT(*) FILTER (WHERE status = 'submitted') as submitted_count,
        COUNT(*) FILTER (WHERE status = 'under_review') as under_review_count,
        COUNT(*) FILTER (WHERE status = 'responded') as responded_count,
        COUNT(*) FILTER (WHERE status = 'closed') as closed_count,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
        COUNT(*) as total_count,
        AVG(EXTRACT(EPOCH FROM (responded_date - submitted_date))/86400)
          FILTER (WHERE responded_date IS NOT NULL AND submitted_date IS NOT NULL) as avg_response_days,
        COUNT(*) FILTER (WHERE due_date < CURRENT_TIMESTAMP AND status NOT IN ('closed', 'rejected')) as overdue_count,
        COUNT(*) FILTER (WHERE priority = 'critical' AND status NOT IN ('closed', 'rejected')) as critical_open,
        COUNT(*) FILTER (WHERE impact_cost = true) as cost_impact_count,
        COUNT(*) FILTER (WHERE impact_schedule = true) as schedule_impact_count
      FROM rfis
      WHERE project_id = $1
    `;

    const result = await pool.query(query, [projectId]);
    return result.rows[0];
  }

  /**
   * Log history entry
   */
  private static async logHistory(
    client: any,
    rfiId: string,
    userId: string,
    action: string,
    fieldChanged: string | null,
    oldValue: string | null,
    newValue: string | null,
    comment: string | null
  ): Promise<void> {
    await client.query(
      `INSERT INTO rfi_history (rfi_id, user_id, action, field_changed, old_value, new_value, comment)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [rfiId, userId, action, fieldChanged, oldValue, newValue, comment]
    );
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

  /**
   * Delete RFI (soft delete recommended for production)
   */
  static async deleteRFI(id: string): Promise<boolean> {
    const result = await pool.query(`DELETE FROM rfis WHERE id = $1`, [id]);
    return result.rowCount! > 0;
  }
}

export default RFIService;