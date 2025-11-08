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
 * Change Order Status Enum
 */
export enum ChangeOrderStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  UNDER_REVIEW = 'under_review',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

/**
 * Change Order Type Enum
 */
export enum ChangeOrderType {
  ADDITION = 'addition',
  DELETION = 'deletion',
  MODIFICATION = 'modification',
  TIME_EXTENSION = 'time_extension',
  ACCELERATION = 'acceleration',
  SUBSTITUTION = 'substitution'
}

/**
 * Change Order Priority Enum
 */
export enum ChangeOrderPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Change Order Interface
 */
export interface ChangeOrder {
  id: string;
  change_order_number: string;
  project_id: string;
  title: string;
  description: string;
  type: ChangeOrderType;
  priority: ChangeOrderPriority;
  status: ChangeOrderStatus;
  initiated_by: string;
  requested_by: string;
  reason: string;
  scope_of_work: string;
  original_contract_value?: number;
  proposed_change_value?: number;
  revised_contract_value?: number;
  original_completion_date?: Date;
  proposed_time_impact_days?: number;
  revised_completion_date?: Date;
  cost_breakdown?: any;
  approvals_required?: string[];
  current_approver?: string;
  submitted_date?: Date;
  approved_date?: Date;
  rejected_date?: Date;
  completed_date?: Date;
  rejection_reason?: string;
  attachments?: string[];
  affected_drawings?: string[];
  affected_specifications?: string[];
  rfi_references?: string[];
  created_at: Date;
  updated_at: Date;
}

/**
 * Change Order Approval Interface
 */
export interface ChangeOrderApproval {
  id: string;
  change_order_id: string;
  approver_id: string;
  approval_level: number;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  approved_at?: Date;
  rejected_at?: Date;
  created_at: Date;
}

/**
 * Change Order Cost Item Interface
 */
export interface ChangeOrderCostItem {
  id: string;
  change_order_id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_rate: number;
  total_amount: number;
  category: string;
  notes?: string;
}

/**
 * Change Order Service Class
 */
export class ChangeOrderService {
  /**
   * Initialize Change Order tables
   */
  static async initializeTables(): Promise<void> {
    const queries = [
      // Change Orders table
      `CREATE TABLE IF NOT EXISTS change_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        change_order_number VARCHAR(50) UNIQUE NOT NULL,
        project_id UUID NOT NULL,
        title VARCHAR(500) NOT NULL,
        description TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'modification',
        priority VARCHAR(20) DEFAULT 'medium',
        status VARCHAR(50) DEFAULT 'draft',
        initiated_by UUID NOT NULL,
        requested_by VARCHAR(255),
        reason TEXT,
        scope_of_work TEXT,
        original_contract_value DECIMAL(15,2),
        proposed_change_value DECIMAL(15,2),
        revised_contract_value DECIMAL(15,2),
        original_completion_date DATE,
        proposed_time_impact_days INTEGER,
        revised_completion_date DATE,
        cost_breakdown JSONB DEFAULT '{}',
        approvals_required TEXT[],
        current_approver UUID,
        submitted_date TIMESTAMP,
        approved_date TIMESTAMP,
        rejected_date TIMESTAMP,
        completed_date TIMESTAMP,
        rejection_reason TEXT,
        affected_drawings TEXT[],
        affected_specifications TEXT[],
        rfi_references TEXT[],
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )`,

      // Change Order Approvals table
      `CREATE TABLE IF NOT EXISTS change_order_approvals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        change_order_id UUID NOT NULL,
        approver_id UUID NOT NULL,
        approval_level INTEGER DEFAULT 1,
        status VARCHAR(20) DEFAULT 'pending',
        comments TEXT,
        approved_at TIMESTAMP,
        rejected_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (change_order_id) REFERENCES change_orders(id) ON DELETE CASCADE
      )`,

      // Change Order Cost Items table
      `CREATE TABLE IF NOT EXISTS change_order_cost_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        change_order_id UUID NOT NULL,
        description TEXT NOT NULL,
        quantity DECIMAL(15,3),
        unit VARCHAR(50),
        unit_rate DECIMAL(15,2),
        total_amount DECIMAL(15,2),
        category VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (change_order_id) REFERENCES change_orders(id) ON DELETE CASCADE
      )`,

      // Change Order Attachments table
      `CREATE TABLE IF NOT EXISTS change_order_attachments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        change_order_id UUID NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER,
        file_type VARCHAR(100),
        uploaded_by UUID NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (change_order_id) REFERENCES change_orders(id) ON DELETE CASCADE
      )`,

      // Change Order History/Audit log
      `CREATE TABLE IF NOT EXISTS change_order_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        change_order_id UUID NOT NULL,
        user_id UUID NOT NULL,
        action VARCHAR(100) NOT NULL,
        field_changed VARCHAR(100),
        old_value TEXT,
        new_value TEXT,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (change_order_id) REFERENCES change_orders(id) ON DELETE CASCADE
      )`,

      // Create indexes
      `CREATE INDEX IF NOT EXISTS idx_change_orders_project_id ON change_orders(project_id)`,
      `CREATE INDEX IF NOT EXISTS idx_change_orders_status ON change_orders(status)`,
      `CREATE INDEX IF NOT EXISTS idx_change_orders_initiated_by ON change_orders(initiated_by)`,
      `CREATE INDEX IF NOT EXISTS idx_change_order_approvals_co_id ON change_order_approvals(change_order_id)`,
      `CREATE INDEX IF NOT EXISTS idx_change_order_cost_items_co_id ON change_order_cost_items(change_order_id)`
    ];

    for (const query of queries) {
      await pool.query(query);
    }
  }

  /**
   * Generate Change Order number
   */
  private static async generateChangeOrderNumber(projectId: string): Promise<string> {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM change_orders WHERE project_id = $1`,
      [projectId]
    );
    const count = parseInt(result.rows[0].count) + 1;
    const projectCode = projectId.substring(0, 8).toUpperCase();
    return `CO-${projectCode}-${String(count).padStart(4, '0')}`;
  }

  /**
   * Create new Change Order
   */
  static async createChangeOrder(data: Partial<ChangeOrder>): Promise<ChangeOrder> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const changeOrderNumber = await this.generateChangeOrderNumber(data.project_id!);
      const changeOrderId = uuidv4();

      // Calculate revised contract value if provided
      const revisedValue = data.original_contract_value && data.proposed_change_value
        ? data.original_contract_value + data.proposed_change_value
        : null;

      // Calculate revised completion date if provided
      let revisedDate = null;
      if (data.original_completion_date && data.proposed_time_impact_days) {
        revisedDate = new Date(data.original_completion_date);
        revisedDate.setDate(revisedDate.getDate() + data.proposed_time_impact_days);
      }

      const query = `
        INSERT INTO change_orders (
          id, change_order_number, project_id, title, description, type,
          priority, status, initiated_by, requested_by, reason, scope_of_work,
          original_contract_value, proposed_change_value, revised_contract_value,
          original_completion_date, proposed_time_impact_days, revised_completion_date,
          cost_breakdown, approvals_required, affected_drawings,
          affected_specifications, rfi_references
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
        ) RETURNING *
      `;

      const values = [
        changeOrderId,
        changeOrderNumber,
        data.project_id,
        data.title,
        data.description,
        data.type || ChangeOrderType.MODIFICATION,
        data.priority || ChangeOrderPriority.MEDIUM,
        ChangeOrderStatus.DRAFT,
        data.initiated_by,
        data.requested_by,
        data.reason,
        data.scope_of_work,
        data.original_contract_value,
        data.proposed_change_value,
        revisedValue,
        data.original_completion_date,
        data.proposed_time_impact_days,
        revisedDate,
        data.cost_breakdown || {},
        data.approvals_required || [],
        data.affected_drawings || [],
        data.affected_specifications || [],
        data.rfi_references || []
      ];

      const result = await client.query(query, values);

      // Log history
      await this.logHistory(
        client, changeOrderId, data.initiated_by!,
        'created', null, null, null, 'Change order created'
      );

      // Create approval workflow if approvers specified
      if (data.approvals_required && data.approvals_required.length > 0) {
        await this.createApprovalWorkflow(client, changeOrderId, data.approvals_required);
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
   * Get Change Order by ID
   */
  static async getChangeOrderById(id: string): Promise<ChangeOrder | null> {
    const query = `
      SELECT co.*,
        array_agg(DISTINCT coa.file_path) FILTER (WHERE coa.file_path IS NOT NULL) as attachments
      FROM change_orders co
      LEFT JOIN change_order_attachments coa ON co.id = coa.change_order_id
      WHERE co.id = $1
      GROUP BY co.id
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Get Change Orders by project
   */
  static async getChangeOrdersByProject(projectId: string, filters?: {
    status?: ChangeOrderStatus;
    type?: ChangeOrderType;
    priority?: ChangeOrderPriority;
  }): Promise<ChangeOrder[]> {
    let query = `
      SELECT co.*,
        array_agg(DISTINCT coa.file_path) FILTER (WHERE coa.file_path IS NOT NULL) as attachments
      FROM change_orders co
      LEFT JOIN change_order_attachments coa ON co.id = coa.change_order_id
      WHERE co.project_id = $1
    `;

    const values: any[] = [projectId];
    let paramCount = 1;

    if (filters?.status) {
      paramCount++;
      query += ` AND co.status = $${paramCount}`;
      values.push(filters.status);
    }

    if (filters?.type) {
      paramCount++;
      query += ` AND co.type = $${paramCount}`;
      values.push(filters.type);
    }

    if (filters?.priority) {
      paramCount++;
      query += ` AND co.priority = $${paramCount}`;
      values.push(filters.priority);
    }

    query += ` GROUP BY co.id ORDER BY co.created_at DESC`;

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Update Change Order
   */
  static async updateChangeOrder(
    id: string,
    updates: Partial<ChangeOrder>,
    userId: string
  ): Promise<ChangeOrder> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get current change order for comparison
      const currentCO = await this.getChangeOrderById(id);
      if (!currentCO) {
        throw new Error('Change order not found');
      }

      // Build update query
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCount = 0;

      const allowedFields = [
        'title', 'description', 'type', 'priority', 'status',
        'requested_by', 'reason', 'scope_of_work',
        'original_contract_value', 'proposed_change_value',
        'original_completion_date', 'proposed_time_impact_days',
        'cost_breakdown', 'current_approver', 'rejection_reason',
        'affected_drawings', 'affected_specifications', 'rfi_references'
      ];

      for (const field of allowedFields) {
        if (updates[field as keyof ChangeOrder] !== undefined) {
          paramCount++;
          updateFields.push(`${field} = $${paramCount}`);
          values.push(updates[field as keyof ChangeOrder]);

          // Log field changes
          await this.logHistory(
            client, id, userId, 'updated', field,
            currentCO[field as keyof ChangeOrder]?.toString(),
            updates[field as keyof ChangeOrder]?.toString(),
            null
          );
        }
      }

      // Recalculate revised values if needed
      if (updates.proposed_change_value !== undefined || updates.original_contract_value !== undefined) {
        const originalValue = updates.original_contract_value ?? currentCO.original_contract_value;
        const changeValue = updates.proposed_change_value ?? currentCO.proposed_change_value;

        if (originalValue && changeValue) {
          paramCount++;
          updateFields.push(`revised_contract_value = $${paramCount}`);
          values.push(originalValue + changeValue);
        }
      }

      // Recalculate revised date if needed
      if (updates.proposed_time_impact_days !== undefined || updates.original_completion_date !== undefined) {
        const originalDate = updates.original_completion_date ?? currentCO.original_completion_date;
        const impactDays = updates.proposed_time_impact_days ?? currentCO.proposed_time_impact_days;

        if (originalDate && impactDays) {
          const revisedDate = new Date(originalDate);
          revisedDate.setDate(revisedDate.getDate() + impactDays);
          paramCount++;
          updateFields.push(`revised_completion_date = $${paramCount}`);
          values.push(revisedDate);
        }
      }

      // Handle status changes
      if (updates.status) {
        const now = new Date();
        if (updates.status === ChangeOrderStatus.PENDING_REVIEW && !currentCO.submitted_date) {
          paramCount++;
          updateFields.push(`submitted_date = $${paramCount}`);
          values.push(now);
        } else if (updates.status === ChangeOrderStatus.APPROVED && !currentCO.approved_date) {
          paramCount++;
          updateFields.push(`approved_date = $${paramCount}`);
          values.push(now);
        } else if (updates.status === ChangeOrderStatus.REJECTED && !currentCO.rejected_date) {
          paramCount++;
          updateFields.push(`rejected_date = $${paramCount}`);
          values.push(now);
        } else if (updates.status === ChangeOrderStatus.COMPLETED && !currentCO.completed_date) {
          paramCount++;
          updateFields.push(`completed_date = $${paramCount}`);
          values.push(now);
        }
      }

      paramCount++;
      updateFields.push(`updated_at = $${paramCount}`);
      values.push(new Date());

      paramCount++;
      values.push(id);

      const query = `
        UPDATE change_orders
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await client.query(query, values);

      // Send notifications for important changes
      if (updates.status === ChangeOrderStatus.APPROVED) {
        await this.sendNotification(
          currentCO.initiated_by,
          'Change Order Approved',
          `Change Order ${currentCO.change_order_number} has been approved`,
          'change_order',
          id
        );
      } else if (updates.status === ChangeOrderStatus.REJECTED) {
        await this.sendNotification(
          currentCO.initiated_by,
          'Change Order Rejected',
          `Change Order ${currentCO.change_order_number} has been rejected`,
          'change_order',
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
   * Submit Change Order for approval
   */
  static async submitForApproval(id: string, userId: string): Promise<ChangeOrder> {
    return this.updateChangeOrder(id, {
      status: ChangeOrderStatus.PENDING_REVIEW,
      submitted_date: new Date()
    }, userId);
  }

  /**
   * Approve Change Order
   */
  static async approveChangeOrder(
    id: string,
    approverId: string,
    comments?: string
  ): Promise<ChangeOrderApproval> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update approval record
      const approvalQuery = `
        UPDATE change_order_approvals
        SET status = 'approved', approved_at = CURRENT_TIMESTAMP, comments = $1
        WHERE change_order_id = $2 AND approver_id = $3 AND status = 'pending'
        RETURNING *
      `;

      const approvalResult = await client.query(approvalQuery, [comments, id, approverId]);

      if (approvalResult.rows.length === 0) {
        throw new Error('No pending approval found for this approver');
      }

      // Check if all approvals are complete
      const checkQuery = `
        SELECT COUNT(*) as pending_count
        FROM change_order_approvals
        WHERE change_order_id = $1 AND status = 'pending'
      `;

      const checkResult = await client.query(checkQuery, [id]);
      const pendingCount = parseInt(checkResult.rows[0].pending_count);

      // If all approvals complete, update change order status
      if (pendingCount === 0) {
        await this.updateChangeOrder(id, {
          status: ChangeOrderStatus.APPROVED,
          approved_date: new Date()
        }, approverId);
      } else {
        // Move to next approver
        const nextApproverQuery = `
          SELECT approver_id FROM change_order_approvals
          WHERE change_order_id = $1 AND status = 'pending'
          ORDER BY approval_level LIMIT 1
        `;
        const nextApproverResult = await client.query(nextApproverQuery, [id]);

        if (nextApproverResult.rows.length > 0) {
          await client.query(
            `UPDATE change_orders SET current_approver = $1 WHERE id = $2`,
            [nextApproverResult.rows[0].approver_id, id]
          );
        }
      }

      await client.query('COMMIT');
      return approvalResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Reject Change Order
   */
  static async rejectChangeOrder(
    id: string,
    approverId: string,
    reason: string,
    comments?: string
  ): Promise<ChangeOrderApproval> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update approval record
      const approvalQuery = `
        UPDATE change_order_approvals
        SET status = 'rejected', rejected_at = CURRENT_TIMESTAMP, comments = $1
        WHERE change_order_id = $2 AND approver_id = $3 AND status = 'pending'
        RETURNING *
      `;

      const approvalResult = await client.query(approvalQuery, [comments, id, approverId]);

      // Update change order status
      await this.updateChangeOrder(id, {
        status: ChangeOrderStatus.REJECTED,
        rejection_reason: reason,
        rejected_date: new Date()
      }, approverId);

      await client.query('COMMIT');
      return approvalResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Add cost item to change order
   */
  static async addCostItem(changeOrderId: string, item: Partial<ChangeOrderCostItem>): Promise<ChangeOrderCostItem> {
    const query = `
      INSERT INTO change_order_cost_items (
        change_order_id, description, quantity, unit, unit_rate, total_amount, category, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const totalAmount = (item.quantity || 0) * (item.unit_rate || 0);

    const result = await pool.query(query, [
      changeOrderId, item.description, item.quantity, item.unit,
      item.unit_rate, totalAmount, item.category, item.notes
    ]);

    // Update total proposed change value
    await this.recalculateTotalCost(changeOrderId);

    return result.rows[0];
  }

  /**
   * Get cost items for change order
   */
  static async getCostItems(changeOrderId: string): Promise<ChangeOrderCostItem[]> {
    const query = `SELECT * FROM change_order_cost_items WHERE change_order_id = $1 ORDER BY created_at`;
    const result = await pool.query(query, [changeOrderId]);
    return result.rows;
  }

  /**
   * Recalculate total cost
   */
  private static async recalculateTotalCost(changeOrderId: string): Promise<void> {
    const query = `
      UPDATE change_orders
      SET proposed_change_value = (
        SELECT COALESCE(SUM(total_amount), 0)
        FROM change_order_cost_items
        WHERE change_order_id = $1
      ),
      revised_contract_value = original_contract_value + (
        SELECT COALESCE(SUM(total_amount), 0)
        FROM change_order_cost_items
        WHERE change_order_id = $1
      )
      WHERE id = $1
    `;

    await pool.query(query, [changeOrderId]);
  }

  /**
   * Add attachment to change order
   */
  static async addAttachment(
    changeOrderId: string,
    fileName: string,
    filePath: string,
    fileSize: number,
    fileType: string,
    uploadedBy: string
  ): Promise<any> {
    const query = `
      INSERT INTO change_order_attachments (change_order_id, file_name, file_path, file_size, file_type, uploaded_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await pool.query(query, [
      changeOrderId, fileName, filePath, fileSize, fileType, uploadedBy
    ]);

    return result.rows[0];
  }

  /**
   * Get attachments for change order
   */
  static async getAttachments(changeOrderId: string): Promise<any[]> {
    const query = `SELECT * FROM change_order_attachments WHERE change_order_id = $1 ORDER BY uploaded_at DESC`;
    const result = await pool.query(query, [changeOrderId]);
    return result.rows;
  }

  /**
   * Get approval workflow
   */
  static async getApprovalWorkflow(changeOrderId: string): Promise<ChangeOrderApproval[]> {
    const query = `
      SELECT coa.*, u.name as approver_name
      FROM change_order_approvals coa
      LEFT JOIN users u ON coa.approver_id = u.id
      WHERE coa.change_order_id = $1
      ORDER BY coa.approval_level
    `;
    const result = await pool.query(query, [changeOrderId]);
    return result.rows;
  }

  /**
   * Create approval workflow
   */
  private static async createApprovalWorkflow(
    client: any,
    changeOrderId: string,
    approverIds: string[]
  ): Promise<void> {
    for (let i = 0; i < approverIds.length; i++) {
      await client.query(
        `INSERT INTO change_order_approvals (change_order_id, approver_id, approval_level)
         VALUES ($1, $2, $3)`,
        [changeOrderId, approverIds[i], i + 1]
      );
    }

    // Set first approver as current
    if (approverIds.length > 0) {
      await client.query(
        `UPDATE change_orders SET current_approver = $1 WHERE id = $2`,
        [approverIds[0], changeOrderId]
      );
    }
  }

  /**
   * Get change order history
   */
  static async getHistory(changeOrderId: string): Promise<any[]> {
    const query = `
      SELECT h.*, u.name as user_name
      FROM change_order_history h
      LEFT JOIN users u ON h.user_id = u.id
      WHERE h.change_order_id = $1
      ORDER BY h.created_at DESC
    `;
    const result = await pool.query(query, [changeOrderId]);
    return result.rows;
  }

  /**
   * Get change order statistics
   */
  static async getStatistics(projectId: string): Promise<any> {
    const query = `
      SELECT
        COUNT(*) FILTER (WHERE status = 'draft') as draft_count,
        COUNT(*) FILTER (WHERE status = 'pending_review') as pending_review_count,
        COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_count,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
        COUNT(*) as total_count,
        SUM(proposed_change_value) FILTER (WHERE status = 'approved') as total_approved_value,
        SUM(proposed_change_value) FILTER (WHERE status IN ('pending_review', 'pending_approval')) as pending_value,
        AVG(EXTRACT(EPOCH FROM (approved_date - submitted_date))/86400)
          FILTER (WHERE approved_date IS NOT NULL AND submitted_date IS NOT NULL) as avg_approval_days,
        SUM(proposed_time_impact_days) FILTER (WHERE status = 'approved') as total_time_impact_days
      FROM change_orders
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
    changeOrderId: string,
    userId: string,
    action: string,
    fieldChanged: string | null,
    oldValue: string | null,
    newValue: string | null,
    comment: string | null
  ): Promise<void> {
    await client.query(
      `INSERT INTO change_order_history (change_order_id, user_id, action, field_changed, old_value, new_value, comment)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [changeOrderId, userId, action, fieldChanged, oldValue, newValue, comment]
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
   * Delete Change Order (soft delete recommended for production)
   */
  static async deleteChangeOrder(id: string): Promise<boolean> {
    const result = await pool.query(`DELETE FROM change_orders WHERE id = $1`, [id]);
    return result.rowCount! > 0;
  }
}

export default ChangeOrderService;