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
 * Drawing Status Enum
 */
export enum DrawingStatus {
  DRAFT = 'draft',
  FOR_REVIEW = 'for_review',
  FOR_APPROVAL = 'for_approval',
  APPROVED = 'approved',
  FOR_CONSTRUCTION = 'for_construction',
  AS_BUILT = 'as_built',
  SUPERSEDED = 'superseded',
  OBSOLETE = 'obsolete'
}

/**
 * Drawing Type Enum
 */
export enum DrawingType {
  ARCHITECTURAL = 'architectural',
  STRUCTURAL = 'structural',
  MECHANICAL = 'mechanical',
  ELECTRICAL = 'electrical',
  PLUMBING = 'plumbing',
  CIVIL = 'civil',
  LANDSCAPE = 'landscape',
  DETAIL = 'detail',
  SECTION = 'section',
  ELEVATION = 'elevation',
  PLAN = 'plan',
  SCHEDULE = 'schedule',
  DIAGRAM = 'diagram',
  OTHER = 'other'
}

/**
 * Drawing Discipline Enum
 */
export enum DrawingDiscipline {
  ARCHITECTURE = 'A',
  CIVIL = 'C',
  ELECTRICAL = 'E',
  FIRE_PROTECTION = 'F',
  GENERAL = 'G',
  HVAC = 'H',
  INTERIOR = 'I',
  LANDSCAPE = 'L',
  MECHANICAL = 'M',
  PLUMBING = 'P',
  STRUCTURAL = 'S',
  TELECOM = 'T'
}

/**
 * Drawing Interface
 */
export interface Drawing {
  id: string;
  drawing_number: string;
  project_id: string;
  title: string;
  description?: string;
  type: DrawingType;
  discipline: DrawingDiscipline;
  status: DrawingStatus;
  revision: string;
  revision_date: Date;
  scale: string;
  paper_size: string;
  file_path: string;
  file_size?: number;
  file_type?: string;
  cad_file_path?: string;
  pdf_file_path?: string;
  drawn_by: string;
  checked_by?: string;
  approved_by?: string;
  issued_for?: string;
  issue_date?: Date;
  current_version: boolean;
  superseded_by?: string;
  supersedes?: string;
  sheet_number?: string;
  total_sheets?: number;
  grid_reference?: string;
  north_point?: boolean;
  key_plan?: boolean;
  tags?: string[];
  metadata?: any;
  created_at: Date;
  updated_at: Date;
}

/**
 * Drawing Revision Interface
 */
export interface DrawingRevision {
  id: string;
  drawing_id: string;
  revision: string;
  revision_date: Date;
  description: string;
  revised_by: string;
  approved_by?: string;
  file_path: string;
  changes_summary?: string;
  cloud_marks?: any;
  created_at: Date;
}

/**
 * Drawing Transmittal Interface
 */
export interface DrawingTransmittal {
  id: string;
  transmittal_number: string;
  project_id: string;
  title: string;
  recipient_company: string;
  recipient_name: string;
  recipient_email: string;
  sender_name: string;
  transmitted_date: Date;
  purpose: string;
  drawings: string[];
  remarks?: string;
  acknowledgement_required: boolean;
  acknowledged?: boolean;
  acknowledged_date?: Date;
  acknowledged_by?: string;
  created_at: Date;
}

/**
 * Drawing Service Class
 */
export class DrawingService {
  /**
   * Initialize Drawing tables
   */
  static async initializeTables(): Promise<void> {
    const queries = [
      // Drawings table
      `CREATE TABLE IF NOT EXISTS drawings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        drawing_number VARCHAR(100) UNIQUE NOT NULL,
        project_id UUID NOT NULL,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        type VARCHAR(50) DEFAULT 'other',
        discipline VARCHAR(10) DEFAULT 'G',
        status VARCHAR(50) DEFAULT 'draft',
        revision VARCHAR(10) DEFAULT 'A',
        revision_date DATE,
        scale VARCHAR(50),
        paper_size VARCHAR(10),
        file_path TEXT NOT NULL,
        file_size INTEGER,
        file_type VARCHAR(50),
        cad_file_path TEXT,
        pdf_file_path TEXT,
        drawn_by VARCHAR(255),
        checked_by VARCHAR(255),
        approved_by VARCHAR(255),
        issued_for VARCHAR(255),
        issue_date DATE,
        current_version BOOLEAN DEFAULT true,
        superseded_by UUID,
        supersedes UUID,
        sheet_number VARCHAR(20),
        total_sheets INTEGER,
        grid_reference VARCHAR(50),
        north_point BOOLEAN DEFAULT false,
        key_plan BOOLEAN DEFAULT false,
        tags TEXT[],
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (superseded_by) REFERENCES drawings(id),
        FOREIGN KEY (supersedes) REFERENCES drawings(id)
      )`,

      // Drawing revisions table
      `CREATE TABLE IF NOT EXISTS drawing_revisions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        drawing_id UUID NOT NULL,
        revision VARCHAR(10) NOT NULL,
        revision_date DATE NOT NULL,
        description TEXT NOT NULL,
        revised_by VARCHAR(255) NOT NULL,
        approved_by VARCHAR(255),
        file_path TEXT NOT NULL,
        changes_summary TEXT,
        cloud_marks JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (drawing_id) REFERENCES drawings(id) ON DELETE CASCADE,
        UNIQUE(drawing_id, revision)
      )`,

      // Drawing transmittals table
      `CREATE TABLE IF NOT EXISTS drawing_transmittals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        transmittal_number VARCHAR(50) UNIQUE NOT NULL,
        project_id UUID NOT NULL,
        title VARCHAR(500) NOT NULL,
        recipient_company VARCHAR(255) NOT NULL,
        recipient_name VARCHAR(255) NOT NULL,
        recipient_email VARCHAR(255),
        sender_name VARCHAR(255) NOT NULL,
        transmitted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        purpose TEXT,
        remarks TEXT,
        acknowledgement_required BOOLEAN DEFAULT false,
        acknowledged BOOLEAN DEFAULT false,
        acknowledged_date TIMESTAMP,
        acknowledged_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )`,

      // Drawing transmittal items table
      `CREATE TABLE IF NOT EXISTS drawing_transmittal_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        transmittal_id UUID NOT NULL,
        drawing_id UUID NOT NULL,
        revision VARCHAR(10),
        copies INTEGER DEFAULT 1,
        format VARCHAR(50),
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (transmittal_id) REFERENCES drawing_transmittals(id) ON DELETE CASCADE,
        FOREIGN KEY (drawing_id) REFERENCES drawings(id)
      )`,

      // Drawing access log
      `CREATE TABLE IF NOT EXISTS drawing_access_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        drawing_id UUID NOT NULL,
        user_id UUID NOT NULL,
        action VARCHAR(50) NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (drawing_id) REFERENCES drawings(id) ON DELETE CASCADE
      )`,

      // Drawing comments
      `CREATE TABLE IF NOT EXISTS drawing_comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        drawing_id UUID NOT NULL,
        user_id UUID NOT NULL,
        comment TEXT NOT NULL,
        x_coordinate DECIMAL(10,2),
        y_coordinate DECIMAL(10,2),
        markup_data JSONB,
        parent_comment_id UUID,
        resolved BOOLEAN DEFAULT false,
        resolved_by UUID,
        resolved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (drawing_id) REFERENCES drawings(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_comment_id) REFERENCES drawing_comments(id)
      )`,

      // Create indexes
      `CREATE INDEX IF NOT EXISTS idx_drawings_project_id ON drawings(project_id)`,
      `CREATE INDEX IF NOT EXISTS idx_drawings_status ON drawings(status)`,
      `CREATE INDEX IF NOT EXISTS idx_drawings_discipline ON drawings(discipline)`,
      `CREATE INDEX IF NOT EXISTS idx_drawings_current_version ON drawings(current_version)`,
      `CREATE INDEX IF NOT EXISTS idx_drawing_revisions_drawing_id ON drawing_revisions(drawing_id)`,
      `CREATE INDEX IF NOT EXISTS idx_drawing_transmittals_project_id ON drawing_transmittals(project_id)`,
      `CREATE INDEX IF NOT EXISTS idx_drawing_access_log_drawing_id ON drawing_access_log(drawing_id)`
    ];

    for (const query of queries) {
      await pool.query(query);
    }
  }

  /**
   * Generate Drawing number based on discipline and project
   */
  private static async generateDrawingNumber(
    projectId: string,
    discipline: DrawingDiscipline,
    type: DrawingType
  ): Promise<string> {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM drawings WHERE project_id = $1 AND discipline = $2`,
      [projectId, discipline]
    );
    const count = parseInt(result.rows[0].count) + 1;
    const projectCode = projectId.substring(0, 6).toUpperCase();

    // Format: PROJECT-DISCIPLINE-TYPE-NUMBER
    const typeCode = type.substring(0, 3).toUpperCase();
    return `${projectCode}-${discipline}-${typeCode}-${String(count).padStart(4, '0')}`;
  }

  /**
   * Create new Drawing
   */
  static async createDrawing(data: Partial<Drawing>): Promise<Drawing> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const drawingNumber = data.drawing_number ||
        await this.generateDrawingNumber(data.project_id!, data.discipline!, data.type!);
      const drawingId = uuidv4();

      const query = `
        INSERT INTO drawings (
          id, drawing_number, project_id, title, description, type, discipline,
          status, revision, revision_date, scale, paper_size, file_path,
          file_size, file_type, cad_file_path, pdf_file_path,
          drawn_by, checked_by, approved_by, issued_for, issue_date,
          sheet_number, total_sheets, grid_reference, north_point, key_plan, tags
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
          $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27
        ) RETURNING *
      `;

      const values = [
        drawingId,
        drawingNumber,
        data.project_id,
        data.title,
        data.description,
        data.type || DrawingType.OTHER,
        data.discipline || DrawingDiscipline.GENERAL,
        data.status || DrawingStatus.DRAFT,
        data.revision || 'A',
        data.revision_date || new Date(),
        data.scale,
        data.paper_size,
        data.file_path,
        data.file_size,
        data.file_type,
        data.cad_file_path,
        data.pdf_file_path,
        data.drawn_by,
        data.checked_by,
        data.approved_by,
        data.issued_for,
        data.issue_date,
        data.sheet_number,
        data.total_sheets,
        data.grid_reference,
        data.north_point || false,
        data.key_plan || false,
        data.tags || []
      ];

      const result = await client.query(query, values);

      // Create initial revision record
      await this.createRevision(client, drawingId, {
        revision: data.revision || 'A',
        revision_date: data.revision_date || new Date(),
        description: 'Initial issue',
        revised_by: data.drawn_by!,
        file_path: data.file_path!
      });

      // Log access
      await this.logAccess(drawingId, data.drawn_by!, 'created');

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
   * Get Drawing by ID
   */
  static async getDrawingById(id: string): Promise<Drawing | null> {
    const query = `SELECT * FROM drawings WHERE id = $1`;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Get Drawings by project
   */
  static async getDrawingsByProject(projectId: string, filters?: {
    status?: DrawingStatus;
    discipline?: DrawingDiscipline;
    type?: DrawingType;
    current_only?: boolean;
  }): Promise<Drawing[]> {
    let query = `SELECT * FROM drawings WHERE project_id = $1`;
    const values: any[] = [projectId];
    let paramCount = 1;

    if (filters?.status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      values.push(filters.status);
    }

    if (filters?.discipline) {
      paramCount++;
      query += ` AND discipline = $${paramCount}`;
      values.push(filters.discipline);
    }

    if (filters?.type) {
      paramCount++;
      query += ` AND type = $${paramCount}`;
      values.push(filters.type);
    }

    if (filters?.current_only) {
      query += ` AND current_version = true`;
    }

    query += ` ORDER BY discipline, drawing_number, revision DESC`;

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Create new revision
   */
  static async createNewRevision(
    drawingId: string,
    data: {
      revision: string;
      description: string;
      revised_by: string;
      file_path: string;
      changes_summary?: string;
    }
  ): Promise<DrawingRevision> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create revision record
      const revisionResult = await this.createRevision(client, drawingId, {
        ...data,
        revision_date: new Date()
      });

      // Mark current version as superseded
      await client.query(
        `UPDATE drawings
         SET current_version = false, superseded_by = $1
         WHERE id = $2 AND current_version = true`,
        [revisionResult.id, drawingId]
      );

      // Create new current version
      const drawing = await this.getDrawingById(drawingId);
      if (drawing) {
        const newDrawing = await this.createDrawing({
          ...drawing,
          id: undefined,
          revision: data.revision,
          revision_date: new Date(),
          file_path: data.file_path,
          supersedes: drawingId,
          current_version: true,
          created_at: undefined,
          updated_at: undefined
        });

        // Update the superseded drawing
        await client.query(
          `UPDATE drawings SET superseded_by = $1 WHERE id = $2`,
          [newDrawing.id, drawingId]
        );
      }

      await client.query('COMMIT');
      return revisionResult;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Create revision record
   */
  private static async createRevision(
    client: any,
    drawingId: string,
    data: Partial<DrawingRevision>
  ): Promise<DrawingRevision> {
    const query = `
      INSERT INTO drawing_revisions (
        drawing_id, revision, revision_date, description,
        revised_by, approved_by, file_path, changes_summary, cloud_marks
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await client.query(query, [
      drawingId,
      data.revision,
      data.revision_date,
      data.description,
      data.revised_by,
      data.approved_by,
      data.file_path,
      data.changes_summary,
      data.cloud_marks || {}
    ]);

    return result.rows[0];
  }

  /**
   * Get drawing revisions
   */
  static async getRevisions(drawingId: string): Promise<DrawingRevision[]> {
    const query = `
      SELECT * FROM drawing_revisions
      WHERE drawing_id = $1
      ORDER BY revision_date DESC, revision DESC
    `;
    const result = await pool.query(query, [drawingId]);
    return result.rows;
  }

  /**
   * Create transmittal
   */
  static async createTransmittal(data: Partial<DrawingTransmittal>): Promise<DrawingTransmittal> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Generate transmittal number
      const countResult = await client.query(
        `SELECT COUNT(*) as count FROM drawing_transmittals WHERE project_id = $1`,
        [data.project_id]
      );
      const count = parseInt(countResult.rows[0].count) + 1;
      const transmittalNumber = `T-${data.project_id?.substring(0, 6).toUpperCase()}-${String(count).padStart(4, '0')}`;

      const transmittalId = uuidv4();

      const query = `
        INSERT INTO drawing_transmittals (
          id, transmittal_number, project_id, title,
          recipient_company, recipient_name, recipient_email,
          sender_name, purpose, remarks, acknowledgement_required
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;

      const result = await client.query(query, [
        transmittalId,
        transmittalNumber,
        data.project_id,
        data.title,
        data.recipient_company,
        data.recipient_name,
        data.recipient_email,
        data.sender_name,
        data.purpose,
        data.remarks,
        data.acknowledgement_required || false
      ]);

      // Add drawing items to transmittal
      if (data.drawings && data.drawings.length > 0) {
        for (const drawingId of data.drawings) {
          await client.query(
            `INSERT INTO drawing_transmittal_items (transmittal_id, drawing_id, copies, format)
             VALUES ($1, $2, $3, $4)`,
            [transmittalId, drawingId, 1, 'PDF']
          );
        }
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
   * Get transmittals by project
   */
  static async getTransmittals(projectId: string): Promise<DrawingTransmittal[]> {
    const query = `
      SELECT t.*,
        array_agg(dti.drawing_id) FILTER (WHERE dti.drawing_id IS NOT NULL) as drawings
      FROM drawing_transmittals t
      LEFT JOIN drawing_transmittal_items dti ON t.id = dti.transmittal_id
      WHERE t.project_id = $1
      GROUP BY t.id
      ORDER BY t.transmitted_date DESC
    `;
    const result = await pool.query(query, [projectId]);
    return result.rows;
  }

  /**
   * Acknowledge transmittal
   */
  static async acknowledgeTransmittal(
    transmittalId: string,
    acknowledgedBy: string
  ): Promise<DrawingTransmittal> {
    const query = `
      UPDATE drawing_transmittals
      SET acknowledged = true,
          acknowledged_date = CURRENT_TIMESTAMP,
          acknowledged_by = $1
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [acknowledgedBy, transmittalId]);
    return result.rows[0];
  }

  /**
   * Update Drawing status
   */
  static async updateStatus(
    id: string,
    status: DrawingStatus,
    userId: string,
    comments?: string
  ): Promise<Drawing> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const query = `
        UPDATE drawings
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;

      const result = await client.query(query, [status, id]);

      // Log the status change
      await this.logAccess(id, userId, `status_changed_to_${status}`);

      // Handle specific status transitions
      if (status === DrawingStatus.APPROVED) {
        await client.query(
          `UPDATE drawings SET approved_by = $1, issue_date = CURRENT_TIMESTAMP WHERE id = $2`,
          [userId, id]
        );
      }

      if (status === DrawingStatus.FOR_CONSTRUCTION) {
        await client.query(
          `UPDATE drawings SET issued_for = 'Construction' WHERE id = $1`,
          [id]
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
   * Add comment to drawing
   */
  static async addComment(
    drawingId: string,
    userId: string,
    comment: string,
    coordinates?: { x: number; y: number },
    markupData?: any
  ): Promise<any> {
    const query = `
      INSERT INTO drawing_comments (
        drawing_id, user_id, comment, x_coordinate, y_coordinate, markup_data
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await pool.query(query, [
      drawingId,
      userId,
      comment,
      coordinates?.x,
      coordinates?.y,
      markupData || {}
    ]);

    return result.rows[0];
  }

  /**
   * Get comments for drawing
   */
  static async getComments(drawingId: string): Promise<any[]> {
    const query = `
      SELECT dc.*, u.name as user_name
      FROM drawing_comments dc
      LEFT JOIN users u ON dc.user_id = u.id
      WHERE dc.drawing_id = $1 AND dc.parent_comment_id IS NULL
      ORDER BY dc.created_at DESC
    `;
    const result = await pool.query(query, [drawingId]);
    return result.rows;
  }

  /**
   * Resolve comment
   */
  static async resolveComment(commentId: string, resolvedBy: string): Promise<any> {
    const query = `
      UPDATE drawing_comments
      SET resolved = true, resolved_by = $1, resolved_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [resolvedBy, commentId]);
    return result.rows[0];
  }

  /**
   * Get drawing register/log
   */
  static async getDrawingRegister(projectId: string): Promise<any[]> {
    const query = `
      SELECT
        d.*,
        (SELECT COUNT(*) FROM drawing_revisions WHERE drawing_id = d.id) as revision_count,
        (SELECT COUNT(*) FROM drawing_comments WHERE drawing_id = d.id AND resolved = false) as open_comments,
        (SELECT COUNT(*) FROM drawing_transmittal_items WHERE drawing_id = d.id) as transmittal_count
      FROM drawings d
      WHERE d.project_id = $1
      ORDER BY d.discipline, d.drawing_number, d.revision
    `;
    const result = await pool.query(query, [projectId]);
    return result.rows;
  }

  /**
   * Get drawing statistics
   */
  static async getStatistics(projectId: string): Promise<any> {
    const query = `
      SELECT
        COUNT(*) as total_drawings,
        COUNT(*) FILTER (WHERE current_version = true) as current_drawings,
        COUNT(*) FILTER (WHERE status = 'draft') as draft_count,
        COUNT(*) FILTER (WHERE status = 'for_review') as for_review_count,
        COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
        COUNT(*) FILTER (WHERE status = 'for_construction') as for_construction_count,
        COUNT(*) FILTER (WHERE status = 'as_built') as as_built_count,
        COUNT(*) FILTER (WHERE status = 'superseded') as superseded_count,
        COUNT(DISTINCT discipline) as disciplines_count,
        (SELECT COUNT(*) FROM drawing_revisions dr
         JOIN drawings d ON dr.drawing_id = d.id
         WHERE d.project_id = $1) as total_revisions,
        (SELECT COUNT(*) FROM drawing_transmittals WHERE project_id = $1) as total_transmittals,
        (SELECT COUNT(*) FROM drawing_comments dc
         JOIN drawings d ON dc.drawing_id = d.id
         WHERE d.project_id = $1 AND dc.resolved = false) as open_comments
      FROM drawings
      WHERE project_id = $1
    `;

    const result = await pool.query(query, [projectId]);
    return result.rows[0];
  }

  /**
   * Search drawings
   */
  static async searchDrawings(
    projectId: string,
    searchTerm: string
  ): Promise<Drawing[]> {
    const query = `
      SELECT * FROM drawings
      WHERE project_id = $1
        AND (
          drawing_number ILIKE $2
          OR title ILIKE $2
          OR description ILIKE $2
          OR $2 = ANY(tags)
        )
      ORDER BY current_version DESC, drawing_number
    `;

    const searchPattern = `%${searchTerm}%`;
    const result = await pool.query(query, [projectId, searchPattern]);
    return result.rows;
  }

  /**
   * Log access
   */
  private static async logAccess(
    drawingId: string,
    userId: string,
    action: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await pool.query(
      `INSERT INTO drawing_access_log (drawing_id, user_id, action, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [drawingId, userId, action, ipAddress, userAgent]
    );
  }

  /**
   * Get access log
   */
  static async getAccessLog(drawingId: string): Promise<any[]> {
    const query = `
      SELECT dal.*, u.name as user_name
      FROM drawing_access_log dal
      LEFT JOIN users u ON dal.user_id = u.id
      WHERE dal.drawing_id = $1
      ORDER BY dal.accessed_at DESC
      LIMIT 100
    `;
    const result = await pool.query(query, [drawingId]);
    return result.rows;
  }

  /**
   * Delete Drawing (soft delete by marking as obsolete)
   */
  static async deleteDrawing(id: string, userId: string): Promise<Drawing> {
    const query = `
      UPDATE drawings
      SET status = 'obsolete', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id]);

    await this.logAccess(id, userId, 'deleted');

    return result.rows[0];
  }
}

export default DrawingService;