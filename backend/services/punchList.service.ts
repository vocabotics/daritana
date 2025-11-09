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
 * Punch List Item Status Enum
 */
export enum PunchListStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  CLOSED = 'closed'
}

/**
 * Punch List Item Priority Enum
 */
export enum PunchListPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

/**
 * Punch List Item Category Enum
 */
export enum PunchListCategory {
  ARCHITECTURAL = 'architectural',
  STRUCTURAL = 'structural',
  MECHANICAL = 'mechanical',
  ELECTRICAL = 'electrical',
  PLUMBING = 'plumbing',
  FINISHES = 'finishes',
  EXTERIOR = 'exterior',
  LANDSCAPING = 'landscaping',
  SAFETY = 'safety',
  DOCUMENTATION = 'documentation',
  OTHER = 'other'
}

/**
 * Defect Type Enum
 */
export enum DefectType {
  INCOMPLETE_WORK = 'incomplete_work',
  DAMAGED = 'damaged',
  DEFECTIVE = 'defective',
  MISSING = 'missing',
  WRONG_SPECIFICATION = 'wrong_specification',
  POOR_WORKMANSHIP = 'poor_workmanship',
  NON_COMPLIANT = 'non_compliant',
  AESTHETIC = 'aesthetic'
}

/**
 * Punch List Interface
 */
export interface PunchList {
  id: string;
  list_number: string;
  project_id: string;
  title: string;
  description?: string;
  phase?: string;
  area?: string;
  created_by: string;
  inspection_date: Date;
  target_completion_date?: Date;
  actual_completion_date?: Date;
  total_items?: number;
  completed_items?: number;
  verified_items?: number;
  completion_percentage?: number;
  status: 'open' | 'in_progress' | 'completed' | 'closed';
  tags?: string[];
  created_at: Date;
  updated_at: Date;
}

/**
 * Punch List Item Interface
 */
export interface PunchListItem {
  id: string;
  punch_list_id: string;
  item_number: string;
  title: string;
  description: string;
  category: PunchListCategory;
  defect_type: DefectType;
  priority: PunchListPriority;
  status: PunchListStatus;
  location: string;
  floor?: string;
  room?: string;
  grid_reference?: string;
  specification_reference?: string;
  assigned_to: string;
  contractor_company?: string;
  trade?: string;
  due_date?: Date;
  completed_date?: Date;
  verified_date?: Date;
  verified_by?: string;
  rejected_date?: Date;
  rejection_reason?: string;
  cost_to_rectify?: number;
  time_to_rectify_hours?: number;
  before_photos?: string[];
  after_photos?: string[];
  tags?: string[];
  metadata?: any;
  created_at: Date;
  updated_at: Date;
}

/**
 * Punch List Photo Interface
 */
export interface PunchListPhoto {
  id: string;
  item_id: string;
  file_path: string;
  thumbnail_path?: string;
  photo_type: 'before' | 'after' | 'progress';
  caption?: string;
  taken_by: string;
  taken_at: Date;
}

/**
 * Punch List Comment Interface
 */
export interface PunchListComment {
  id: string;
  item_id: string;
  user_id: string;
  comment: string;
  attachments?: string[];
  created_at: Date;
}

/**
 * Punch List Service Class
 */
export class PunchListService {
  /**
   * Initialize Punch List tables
   */
  static async initializeTables(): Promise<void> {
    const queries = [
      // Punch Lists table
      `CREATE TABLE IF NOT EXISTS punch_lists (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        list_number VARCHAR(50) UNIQUE NOT NULL,
        project_id UUID NOT NULL,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        phase VARCHAR(100),
        area VARCHAR(100),
        created_by UUID NOT NULL,
        inspection_date DATE NOT NULL,
        target_completion_date DATE,
        actual_completion_date DATE,
        total_items INTEGER DEFAULT 0,
        completed_items INTEGER DEFAULT 0,
        verified_items INTEGER DEFAULT 0,
        completion_percentage DECIMAL(5,2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'open',
        tags TEXT[],
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )`,

      // Punch List Items table
      `CREATE TABLE IF NOT EXISTS punch_list_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        punch_list_id UUID NOT NULL,
        item_number VARCHAR(50) UNIQUE NOT NULL,
        title VARCHAR(500) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(50) DEFAULT 'other',
        defect_type VARCHAR(50) DEFAULT 'defective',
        priority VARCHAR(20) DEFAULT 'medium',
        status VARCHAR(20) DEFAULT 'pending',
        location VARCHAR(255) NOT NULL,
        floor VARCHAR(50),
        room VARCHAR(100),
        grid_reference VARCHAR(50),
        specification_reference VARCHAR(255),
        assigned_to UUID NOT NULL,
        contractor_company VARCHAR(255),
        trade VARCHAR(100),
        due_date DATE,
        completed_date TIMESTAMP,
        verified_date TIMESTAMP,
        verified_by UUID,
        rejected_date TIMESTAMP,
        rejection_reason TEXT,
        cost_to_rectify DECIMAL(15,2),
        time_to_rectify_hours DECIMAL(10,2),
        tags TEXT[],
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (punch_list_id) REFERENCES punch_lists(id) ON DELETE CASCADE
      )`,

      // Punch List Photos table
      `CREATE TABLE IF NOT EXISTS punch_list_photos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        item_id UUID NOT NULL,
        file_path TEXT NOT NULL,
        thumbnail_path TEXT,
        photo_type VARCHAR(20) DEFAULT 'before',
        caption TEXT,
        taken_by UUID NOT NULL,
        taken_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (item_id) REFERENCES punch_list_items(id) ON DELETE CASCADE
      )`,

      // Punch List Comments table
      `CREATE TABLE IF NOT EXISTS punch_list_comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        item_id UUID NOT NULL,
        user_id UUID NOT NULL,
        comment TEXT NOT NULL,
        attachments TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (item_id) REFERENCES punch_list_items(id) ON DELETE CASCADE
      )`,

      // Punch List History/Audit log
      `CREATE TABLE IF NOT EXISTS punch_list_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        item_id UUID NOT NULL,
        user_id UUID NOT NULL,
        action VARCHAR(100) NOT NULL,
        field_changed VARCHAR(100),
        old_value TEXT,
        new_value TEXT,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (item_id) REFERENCES punch_list_items(id) ON DELETE CASCADE
      )`,

      // Create indexes
      `CREATE INDEX IF NOT EXISTS idx_punch_lists_project_id ON punch_lists(project_id)`,
      `CREATE INDEX IF NOT EXISTS idx_punch_lists_status ON punch_lists(status)`,
      `CREATE INDEX IF NOT EXISTS idx_punch_list_items_punch_list_id ON punch_list_items(punch_list_id)`,
      `CREATE INDEX IF NOT EXISTS idx_punch_list_items_status ON punch_list_items(status)`,
      `CREATE INDEX IF NOT EXISTS idx_punch_list_items_assigned_to ON punch_list_items(assigned_to)`,
      `CREATE INDEX IF NOT EXISTS idx_punch_list_items_priority ON punch_list_items(priority)`,
      `CREATE INDEX IF NOT EXISTS idx_punch_list_photos_item_id ON punch_list_photos(item_id)`
    ];

    for (const query of queries) {
      await pool.query(query);
    }
  }

  /**
   * Generate Punch List number
   */
  private static async generatePunchListNumber(projectId: string): Promise<string> {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM punch_lists WHERE project_id = $1`,
      [projectId]
    );
    const count = parseInt(result.rows[0].count) + 1;
    const projectCode = projectId.substring(0, 8).toUpperCase();
    return `PL-${projectCode}-${String(count).padStart(3, '0')}`;
  }

  /**
   * Generate Punch List Item number
   */
  private static async generateItemNumber(punchListId: string): Promise<string> {
    const result = await pool.query(
      `SELECT list_number FROM punch_lists WHERE id = $1`,
      [punchListId]
    );
    const listNumber = result.rows[0]?.list_number || 'PL-UNKNOWN';

    const countResult = await pool.query(
      `SELECT COUNT(*) as count FROM punch_list_items WHERE punch_list_id = $1`,
      [punchListId]
    );
    const count = parseInt(countResult.rows[0].count) + 1;

    return `${listNumber}-${String(count).padStart(4, '0')}`;
  }

  /**
   * Create new Punch List
   */
  static async createPunchList(data: Partial<PunchList>): Promise<PunchList> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const listNumber = await this.generatePunchListNumber(data.project_id!);
      const listId = uuidv4();

      const query = `
        INSERT INTO punch_lists (
          id, list_number, project_id, title, description, phase, area,
          created_by, inspection_date, target_completion_date, tags
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
        ) RETURNING *
      `;

      const values = [
        listId,
        listNumber,
        data.project_id,
        data.title,
        data.description,
        data.phase,
        data.area,
        data.created_by,
        data.inspection_date || new Date(),
        data.target_completion_date,
        data.tags || []
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
   * Create Punch List Item
   */
  static async createPunchListItem(item: Partial<PunchListItem>): Promise<PunchListItem> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const itemNumber = await this.generateItemNumber(item.punch_list_id!);
      const itemId = uuidv4();

      const query = `
        INSERT INTO punch_list_items (
          id, punch_list_id, item_number, title, description, category,
          defect_type, priority, status, location, floor, room,
          grid_reference, specification_reference, assigned_to,
          contractor_company, trade, due_date, cost_to_rectify,
          time_to_rectify_hours, tags
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
        ) RETURNING *
      `;

      const values = [
        itemId,
        item.punch_list_id,
        itemNumber,
        item.title,
        item.description,
        item.category || PunchListCategory.OTHER,
        item.defect_type || DefectType.DEFECTIVE,
        item.priority || PunchListPriority.MEDIUM,
        PunchListStatus.PENDING,
        item.location,
        item.floor,
        item.room,
        item.grid_reference,
        item.specification_reference,
        item.assigned_to,
        item.contractor_company,
        item.trade,
        item.due_date,
        item.cost_to_rectify,
        item.time_to_rectify_hours,
        item.tags || []
      ];

      const result = await client.query(query, values);

      // Update punch list statistics
      await this.updatePunchListStatistics(client, item.punch_list_id!);

      // Log history
      await this.logHistory(
        client, itemId, item.assigned_to!,
        'created', null, null, null, 'Punch list item created'
      );

      // Send notification to assigned contractor
      await this.sendNotification(
        item.assigned_to!,
        'New Punch List Item Assigned',
        `You have been assigned punch list item ${itemNumber}: ${item.title}`,
        'punch_list',
        itemId
      );

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
   * Get Punch List by ID
   */
  static async getPunchListById(id: string): Promise<PunchList | null> {
    const query = `SELECT * FROM punch_lists WHERE id = $1`;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Get Punch Lists by project
   */
  static async getPunchListsByProject(projectId: string, filters?: {
    status?: string;
    phase?: string;
    area?: string;
  }): Promise<PunchList[]> {
    let query = `SELECT * FROM punch_lists WHERE project_id = $1`;
    const values: any[] = [projectId];
    let paramCount = 1;

    if (filters?.status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      values.push(filters.status);
    }

    if (filters?.phase) {
      paramCount++;
      query += ` AND phase = $${paramCount}`;
      values.push(filters.phase);
    }

    if (filters?.area) {
      paramCount++;
      query += ` AND area = $${paramCount}`;
      values.push(filters.area);
    }

    query += ` ORDER BY inspection_date DESC`;

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Get Punch List Items
   */
  static async getPunchListItems(punchListId: string, filters?: {
    status?: PunchListStatus;
    priority?: PunchListPriority;
    category?: PunchListCategory;
    assigned_to?: string;
  }): Promise<PunchListItem[]> {
    let query = `
      SELECT pli.*,
        array_agg(DISTINCT plp.file_path) FILTER (WHERE plp.photo_type = 'before') as before_photos,
        array_agg(DISTINCT plp.file_path) FILTER (WHERE plp.photo_type = 'after') as after_photos
      FROM punch_list_items pli
      LEFT JOIN punch_list_photos plp ON pli.id = plp.item_id
      WHERE pli.punch_list_id = $1
    `;

    const values: any[] = [punchListId];
    let paramCount = 1;

    if (filters?.status) {
      paramCount++;
      query += ` AND pli.status = $${paramCount}`;
      values.push(filters.status);
    }

    if (filters?.priority) {
      paramCount++;
      query += ` AND pli.priority = $${paramCount}`;
      values.push(filters.priority);
    }

    if (filters?.category) {
      paramCount++;
      query += ` AND pli.category = $${paramCount}`;
      values.push(filters.category);
    }

    if (filters?.assigned_to) {
      paramCount++;
      query += ` AND pli.assigned_to = $${paramCount}`;
      values.push(filters.assigned_to);
    }

    query += ` GROUP BY pli.id ORDER BY pli.priority DESC, pli.due_date ASC`;

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Update Punch List Item Status
   */
  static async updateItemStatus(
    itemId: string,
    status: PunchListStatus,
    userId: string,
    details?: {
      rejection_reason?: string;
      completed_date?: Date;
      verified_date?: Date;
    }
  ): Promise<PunchListItem> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get current item
      const currentItem = await client.query(
        `SELECT * FROM punch_list_items WHERE id = $1`,
        [itemId]
      );

      if (!currentItem.rows[0]) {
        throw new Error('Punch list item not found');
      }

      const oldStatus = currentItem.rows[0].status;

      // Build update query based on status
      let updateQuery = `UPDATE punch_list_items SET status = $1, updated_at = CURRENT_TIMESTAMP`;
      const updateValues: any[] = [status];
      let paramCount = 1;

      if (status === PunchListStatus.COMPLETED) {
        paramCount++;
        updateQuery += `, completed_date = $${paramCount}`;
        updateValues.push(details?.completed_date || new Date());
      } else if (status === PunchListStatus.VERIFIED) {
        paramCount++;
        updateQuery += `, verified_date = $${paramCount}`;
        updateValues.push(details?.verified_date || new Date());
        paramCount++;
        updateQuery += `, verified_by = $${paramCount}`;
        updateValues.push(userId);
      } else if (status === PunchListStatus.REJECTED) {
        paramCount++;
        updateQuery += `, rejected_date = $${paramCount}`;
        updateValues.push(new Date());
        paramCount++;
        updateQuery += `, rejection_reason = $${paramCount}`;
        updateValues.push(details?.rejection_reason);
      }

      paramCount++;
      updateQuery += ` WHERE id = $${paramCount} RETURNING *`;
      updateValues.push(itemId);

      const result = await client.query(updateQuery, updateValues);

      // Log history
      await this.logHistory(
        client, itemId, userId, 'status_changed',
        'status', oldStatus, status, details?.rejection_reason
      );

      // Update punch list statistics
      await this.updatePunchListStatistics(client, currentItem.rows[0].punch_list_id);

      // Send notifications based on status change
      if (status === PunchListStatus.COMPLETED) {
        // Notify inspector for verification
        const punchList = await this.getPunchListById(currentItem.rows[0].punch_list_id);
        if (punchList?.created_by) {
          await this.sendNotification(
            punchList.created_by,
            'Punch List Item Completed',
            `Item ${currentItem.rows[0].item_number} has been marked as completed and requires verification`,
            'punch_list',
            itemId
          );
        }
      } else if (status === PunchListStatus.REJECTED) {
        // Notify contractor of rejection
        await this.sendNotification(
          currentItem.rows[0].assigned_to,
          'Punch List Item Rejected',
          `Item ${currentItem.rows[0].item_number} has been rejected: ${details?.rejection_reason}`,
          'punch_list',
          itemId
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
   * Update Punch List Item
   */
  static async updatePunchListItem(
    itemId: string,
    updates: Partial<PunchListItem>,
    userId: string
  ): Promise<PunchListItem> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get current item for comparison
      const currentItem = await client.query(
        `SELECT * FROM punch_list_items WHERE id = $1`,
        [itemId]
      );

      if (!currentItem.rows[0]) {
        throw new Error('Punch list item not found');
      }

      // Build update query
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCount = 0;

      const allowedFields = [
        'title', 'description', 'category', 'defect_type', 'priority',
        'location', 'floor', 'room', 'grid_reference', 'specification_reference',
        'assigned_to', 'contractor_company', 'trade', 'due_date',
        'cost_to_rectify', 'time_to_rectify_hours', 'tags'
      ];

      for (const field of allowedFields) {
        if (updates[field as keyof PunchListItem] !== undefined) {
          paramCount++;
          updateFields.push(`${field} = $${paramCount}`);
          values.push(updates[field as keyof PunchListItem]);

          // Log field changes
          await this.logHistory(
            client, itemId, userId, 'updated', field,
            currentItem.rows[0][field]?.toString(),
            updates[field as keyof PunchListItem]?.toString(),
            null
          );
        }
      }

      paramCount++;
      updateFields.push(`updated_at = $${paramCount}`);
      values.push(new Date());

      paramCount++;
      values.push(itemId);

      const query = `
        UPDATE punch_list_items
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await client.query(query, values);

      // Send notification if assigned_to changed
      if (updates.assigned_to && updates.assigned_to !== currentItem.rows[0].assigned_to) {
        await this.sendNotification(
          updates.assigned_to,
          'Punch List Item Assigned',
          `You have been assigned punch list item ${currentItem.rows[0].item_number}`,
          'punch_list',
          itemId
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
   * Add Photo to Punch List Item
   */
  static async addPhoto(
    itemId: string,
    filePath: string,
    photoType: 'before' | 'after' | 'progress',
    takenBy: string,
    caption?: string
  ): Promise<PunchListPhoto> {
    const query = `
      INSERT INTO punch_list_photos (
        item_id, file_path, photo_type, caption, taken_by
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await pool.query(query, [
      itemId, filePath, photoType, caption, takenBy
    ]);

    return result.rows[0];
  }

  /**
   * Get Photos for Item
   */
  static async getPhotos(itemId: string): Promise<PunchListPhoto[]> {
    const query = `
      SELECT * FROM punch_list_photos
      WHERE item_id = $1
      ORDER BY photo_type, taken_at DESC
    `;
    const result = await pool.query(query, [itemId]);
    return result.rows;
  }

  /**
   * Add Comment to Item
   */
  static async addComment(
    itemId: string,
    userId: string,
    comment: string,
    attachments?: string[]
  ): Promise<PunchListComment> {
    const query = `
      INSERT INTO punch_list_comments (
        item_id, user_id, comment, attachments
      ) VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await pool.query(query, [
      itemId, userId, comment, attachments || []
    ]);

    return result.rows[0];
  }

  /**
   * Get Comments for Item
   */
  static async getComments(itemId: string): Promise<PunchListComment[]> {
    const query = `
      SELECT plc.*, u.name as user_name
      FROM punch_list_comments plc
      LEFT JOIN users u ON plc.user_id = u.id
      WHERE plc.item_id = $1
      ORDER BY plc.created_at DESC
    `;
    const result = await pool.query(query, [itemId]);
    return result.rows;
  }

  /**
   * Get Item History
   */
  static async getHistory(itemId: string): Promise<any[]> {
    const query = `
      SELECT h.*, u.name as user_name
      FROM punch_list_history h
      LEFT JOIN users u ON h.user_id = u.id
      WHERE h.item_id = $1
      ORDER BY h.created_at DESC
    `;
    const result = await pool.query(query, [itemId]);
    return result.rows;
  }

  /**
   * Update Punch List Statistics
   */
  private static async updatePunchListStatistics(client: any, punchListId: string): Promise<void> {
    const statsQuery = `
      SELECT
        COUNT(*) as total_items,
        COUNT(*) FILTER (WHERE status IN ('completed', 'verified', 'closed')) as completed_items,
        COUNT(*) FILTER (WHERE status = 'verified') as verified_items
      FROM punch_list_items
      WHERE punch_list_id = $1
    `;

    const statsResult = await client.query(statsQuery, [punchListId]);
    const stats = statsResult.rows[0];

    const completionPercentage = stats.total_items > 0
      ? (stats.completed_items / stats.total_items) * 100
      : 0;

    // Determine punch list status
    let listStatus = 'open';
    if (stats.total_items === stats.verified_items && stats.total_items > 0) {
      listStatus = 'closed';
    } else if (stats.completed_items > 0) {
      listStatus = 'in_progress';
    }

    // Update punch list
    await client.query(
      `UPDATE punch_lists
       SET total_items = $1,
           completed_items = $2,
           verified_items = $3,
           completion_percentage = $4,
           status = $5,
           actual_completion_date = CASE
             WHEN $5 = 'closed' THEN CURRENT_TIMESTAMP
             ELSE actual_completion_date
           END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6`,
      [
        stats.total_items,
        stats.completed_items,
        stats.verified_items,
        completionPercentage,
        listStatus,
        punchListId
      ]
    );
  }

  /**
   * Get Punch List Statistics
   */
  static async getStatistics(projectId: string): Promise<any> {
    const query = `
      SELECT
        COUNT(DISTINCT pl.id) as total_lists,
        COUNT(DISTINCT pl.id) FILTER (WHERE pl.status = 'open') as open_lists,
        COUNT(DISTINCT pl.id) FILTER (WHERE pl.status = 'closed') as closed_lists,
        COUNT(pli.id) as total_items,
        COUNT(pli.id) FILTER (WHERE pli.status = 'pending') as pending_items,
        COUNT(pli.id) FILTER (WHERE pli.status = 'in_progress') as in_progress_items,
        COUNT(pli.id) FILTER (WHERE pli.status = 'completed') as completed_items,
        COUNT(pli.id) FILTER (WHERE pli.status = 'verified') as verified_items,
        COUNT(pli.id) FILTER (WHERE pli.status = 'rejected') as rejected_items,
        COUNT(pli.id) FILTER (WHERE pli.priority = 'critical') as critical_items,
        COUNT(pli.id) FILTER (WHERE pli.priority = 'high') as high_priority_items,
        COUNT(pli.id) FILTER (WHERE pli.due_date < CURRENT_DATE AND pli.status NOT IN ('completed', 'verified', 'closed')) as overdue_items,
        AVG(pl.completion_percentage) as avg_completion,
        SUM(pli.cost_to_rectify) as total_cost_to_rectify,
        SUM(pli.time_to_rectify_hours) as total_hours_to_rectify
      FROM punch_lists pl
      LEFT JOIN punch_list_items pli ON pl.id = pli.punch_list_id
      WHERE pl.project_id = $1
    `;

    const result = await pool.query(query, [projectId]);
    return result.rows[0];
  }

  /**
   * Get Items by Contractor
   */
  static async getItemsByContractor(
    projectId: string,
    contractorId: string
  ): Promise<PunchListItem[]> {
    const query = `
      SELECT pli.*, pl.list_number, pl.title as list_title
      FROM punch_list_items pli
      JOIN punch_lists pl ON pli.punch_list_id = pl.id
      WHERE pl.project_id = $1 AND pli.assigned_to = $2
      ORDER BY pli.priority DESC, pli.due_date ASC
    `;

    const result = await pool.query(query, [projectId, contractorId]);
    return result.rows;
  }

  /**
   * Generate Punch List Report
   */
  static async generateReport(punchListId: string): Promise<any> {
    const punchList = await this.getPunchListById(punchListId);
    const items = await this.getPunchListItems(punchListId);

    const itemsByCategory = items.reduce((acc: any, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {});

    const itemsByStatus = items.reduce((acc: any, item) => {
      if (!acc[item.status]) {
        acc[item.status] = 0;
      }
      acc[item.status]++;
      return acc;
    }, {});

    const itemsByPriority = items.reduce((acc: any, item) => {
      if (!acc[item.priority]) {
        acc[item.priority] = 0;
      }
      acc[item.priority]++;
      return acc;
    }, {});

    return {
      punchList,
      totalItems: items.length,
      itemsByCategory,
      itemsByStatus,
      itemsByPriority,
      completionPercentage: punchList?.completion_percentage || 0,
      estimatedCost: items.reduce((sum, item) => sum + (item.cost_to_rectify || 0), 0),
      estimatedHours: items.reduce((sum, item) => sum + (item.time_to_rectify_hours || 0), 0)
    };
  }

  /**
   * Log history entry
   */
  private static async logHistory(
    client: any,
    itemId: string,
    userId: string,
    action: string,
    fieldChanged: string | null,
    oldValue: string | null,
    newValue: string | null,
    comment: string | null
  ): Promise<void> {
    await client.query(
      `INSERT INTO punch_list_history (item_id, user_id, action, field_changed, old_value, new_value, comment)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [itemId, userId, action, fieldChanged, oldValue, newValue, comment]
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
   * Close Punch List
   */
  static async closePunchList(id: string, userId: string): Promise<PunchList> {
    const query = `
      UPDATE punch_lists
      SET status = 'closed',
          actual_completion_date = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

export default PunchListService;