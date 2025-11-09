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
 * Site Visit Type Enum
 */
export enum SiteVisitType {
  ROUTINE_INSPECTION = 'routine_inspection',
  PROGRESS_REVIEW = 'progress_review',
  QUALITY_INSPECTION = 'quality_inspection',
  SAFETY_INSPECTION = 'safety_inspection',
  AUTHORITY_INSPECTION = 'authority_inspection',
  CLIENT_WALKTHROUGH = 'client_walkthrough',
  CONSULTANT_REVIEW = 'consultant_review',
  DEFECT_INSPECTION = 'defect_inspection',
  FINAL_INSPECTION = 'final_inspection',
  HANDOVER = 'handover'
}

/**
 * Inspection Status Enum
 */
export enum InspectionStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  POSTPONED = 'postponed'
}

/**
 * Issue Severity Enum
 */
export enum IssueSeverity {
  CRITICAL = 'critical',
  MAJOR = 'major',
  MINOR = 'minor',
  OBSERVATION = 'observation'
}

/**
 * Issue Status Enum
 */
export enum IssueStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  DISPUTED = 'disputed'
}

/**
 * Weather Conditions Enum
 */
export enum WeatherCondition {
  SUNNY = 'sunny',
  CLOUDY = 'cloudy',
  RAINY = 'rainy',
  WINDY = 'windy',
  STORMY = 'stormy',
  FOGGY = 'foggy',
  HAZY = 'hazy'
}

/**
 * Site Visit Interface
 */
export interface SiteVisit {
  id: string;
  visit_number: string;
  project_id: string;
  visit_type: SiteVisitType;
  status: InspectionStatus;
  scheduled_date: Date;
  actual_date?: Date;
  start_time?: Date;
  end_time?: Date;
  purpose: string;
  description?: string;
  inspector_id: string;
  inspector_name?: string;
  attendees?: string[];
  weather_condition?: WeatherCondition;
  temperature?: number;
  humidity?: number;
  wind_speed?: number;
  site_conditions?: string;
  work_progress_percentage?: number;
  workers_on_site?: number;
  equipment_on_site?: string[];
  areas_inspected?: string[];
  overall_rating?: number;
  report_generated?: boolean;
  report_path?: string;
  follow_up_required?: boolean;
  follow_up_date?: Date;
  tags?: string[];
  metadata?: any;
  created_at: Date;
  updated_at: Date;
}

/**
 * Site Visit Attendee Interface
 */
export interface SiteVisitAttendee {
  id: string;
  visit_id: string;
  name: string;
  company: string;
  role: string;
  email?: string;
  phone?: string;
  signature?: string;
  signed_at?: Date;
}

/**
 * Inspection Issue Interface
 */
export interface InspectionIssue {
  id: string;
  visit_id: string;
  issue_number: string;
  title: string;
  description: string;
  severity: IssueSeverity;
  status: IssueStatus;
  location: string;
  grid_reference?: string;
  responsible_party?: string;
  due_date?: Date;
  resolved_date?: Date;
  resolution_details?: string;
  cost_impact?: number;
  time_impact_days?: number;
  photos?: string[];
  created_at: Date;
  updated_at: Date;
}

/**
 * Inspection Checklist Interface
 */
export interface InspectionChecklist {
  id: string;
  visit_id: string;
  category: string;
  item: string;
  specification?: string;
  compliant: boolean;
  comments?: string;
  photos?: string[];
  checked_by: string;
  checked_at: Date;
}

/**
 * Site Photo Interface
 */
export interface SitePhoto {
  id: string;
  visit_id: string;
  issue_id?: string;
  file_path: string;
  thumbnail_path?: string;
  caption?: string;
  location?: string;
  tags?: string[];
  gps_latitude?: number;
  gps_longitude?: number;
  taken_by: string;
  taken_at: Date;
}

/**
 * Site Visit Service Class
 */
export class SiteVisitService {
  /**
   * Initialize Site Visit tables
   */
  static async initializeTables(): Promise<void> {
    const queries = [
      // Site Visits table
      `CREATE TABLE IF NOT EXISTS site_visits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        visit_number VARCHAR(50) UNIQUE NOT NULL,
        project_id UUID NOT NULL,
        visit_type VARCHAR(50) DEFAULT 'routine_inspection',
        status VARCHAR(50) DEFAULT 'scheduled',
        scheduled_date TIMESTAMP NOT NULL,
        actual_date TIMESTAMP,
        start_time TIMESTAMP,
        end_time TIMESTAMP,
        purpose TEXT NOT NULL,
        description TEXT,
        inspector_id UUID NOT NULL,
        inspector_name VARCHAR(255),
        weather_condition VARCHAR(50),
        temperature DECIMAL(5,2),
        humidity INTEGER,
        wind_speed DECIMAL(5,2),
        site_conditions TEXT,
        work_progress_percentage INTEGER,
        workers_on_site INTEGER,
        equipment_on_site TEXT[],
        areas_inspected TEXT[],
        overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
        report_generated BOOLEAN DEFAULT false,
        report_path TEXT,
        follow_up_required BOOLEAN DEFAULT false,
        follow_up_date TIMESTAMP,
        tags TEXT[],
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )`,

      // Site Visit Attendees table
      `CREATE TABLE IF NOT EXISTS site_visit_attendees (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        visit_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        company VARCHAR(255),
        role VARCHAR(100),
        email VARCHAR(255),
        phone VARCHAR(50),
        signature TEXT,
        signed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (visit_id) REFERENCES site_visits(id) ON DELETE CASCADE
      )`,

      // Inspection Issues table
      `CREATE TABLE IF NOT EXISTS inspection_issues (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        visit_id UUID NOT NULL,
        issue_number VARCHAR(50) UNIQUE NOT NULL,
        title VARCHAR(500) NOT NULL,
        description TEXT NOT NULL,
        severity VARCHAR(20) DEFAULT 'minor',
        status VARCHAR(20) DEFAULT 'open',
        location VARCHAR(255) NOT NULL,
        grid_reference VARCHAR(50),
        responsible_party VARCHAR(255),
        due_date TIMESTAMP,
        resolved_date TIMESTAMP,
        resolution_details TEXT,
        cost_impact DECIMAL(15,2),
        time_impact_days INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (visit_id) REFERENCES site_visits(id) ON DELETE CASCADE
      )`,

      // Inspection Checklists table
      `CREATE TABLE IF NOT EXISTS inspection_checklists (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        visit_id UUID NOT NULL,
        category VARCHAR(255) NOT NULL,
        item VARCHAR(500) NOT NULL,
        specification TEXT,
        compliant BOOLEAN DEFAULT false,
        comments TEXT,
        checked_by UUID NOT NULL,
        checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (visit_id) REFERENCES site_visits(id) ON DELETE CASCADE
      )`,

      // Site Photos table
      `CREATE TABLE IF NOT EXISTS site_photos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        visit_id UUID NOT NULL,
        issue_id UUID,
        file_path TEXT NOT NULL,
        thumbnail_path TEXT,
        caption TEXT,
        location VARCHAR(255),
        tags TEXT[],
        gps_latitude DECIMAL(10,8),
        gps_longitude DECIMAL(11,8),
        taken_by UUID NOT NULL,
        taken_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (visit_id) REFERENCES site_visits(id) ON DELETE CASCADE,
        FOREIGN KEY (issue_id) REFERENCES inspection_issues(id) ON DELETE SET NULL
      )`,

      // Site Visit History/Audit log
      `CREATE TABLE IF NOT EXISTS site_visit_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        visit_id UUID NOT NULL,
        user_id UUID NOT NULL,
        action VARCHAR(100) NOT NULL,
        field_changed VARCHAR(100),
        old_value TEXT,
        new_value TEXT,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (visit_id) REFERENCES site_visits(id) ON DELETE CASCADE
      )`,

      // Create indexes
      `CREATE INDEX IF NOT EXISTS idx_site_visits_project_id ON site_visits(project_id)`,
      `CREATE INDEX IF NOT EXISTS idx_site_visits_status ON site_visits(status)`,
      `CREATE INDEX IF NOT EXISTS idx_site_visits_scheduled_date ON site_visits(scheduled_date)`,
      `CREATE INDEX IF NOT EXISTS idx_inspection_issues_visit_id ON inspection_issues(visit_id)`,
      `CREATE INDEX IF NOT EXISTS idx_inspection_issues_status ON inspection_issues(status)`,
      `CREATE INDEX IF NOT EXISTS idx_site_photos_visit_id ON site_photos(visit_id)`
    ];

    for (const query of queries) {
      await pool.query(query);
    }
  }

  /**
   * Generate Site Visit number
   */
  private static async generateVisitNumber(projectId: string): Promise<string> {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM site_visits WHERE project_id = $1`,
      [projectId]
    );
    const count = parseInt(result.rows[0].count) + 1;
    const projectCode = projectId.substring(0, 8).toUpperCase();
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `SV-${projectCode}-${date}-${String(count).padStart(3, '0')}`;
  }

  /**
   * Create new Site Visit
   */
  static async createSiteVisit(data: Partial<SiteVisit>): Promise<SiteVisit> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const visitNumber = await this.generateVisitNumber(data.project_id!);
      const visitId = uuidv4();

      const query = `
        INSERT INTO site_visits (
          id, visit_number, project_id, visit_type, status, scheduled_date,
          purpose, description, inspector_id, inspector_name,
          weather_condition, temperature, humidity, wind_speed,
          site_conditions, areas_inspected, follow_up_required, follow_up_date, tags
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
        ) RETURNING *
      `;

      const values = [
        visitId,
        visitNumber,
        data.project_id,
        data.visit_type || SiteVisitType.ROUTINE_INSPECTION,
        InspectionStatus.SCHEDULED,
        data.scheduled_date,
        data.purpose,
        data.description,
        data.inspector_id,
        data.inspector_name,
        data.weather_condition,
        data.temperature,
        data.humidity,
        data.wind_speed,
        data.site_conditions,
        data.areas_inspected || [],
        data.follow_up_required || false,
        data.follow_up_date,
        data.tags || []
      ];

      const result = await client.query(query, values);

      // Log history
      await this.logHistory(
        client, visitId, data.inspector_id!,
        'created', null, null, null, 'Site visit scheduled'
      );

      // Send notification to inspector
      await this.sendNotification(
        data.inspector_id!,
        'Site Visit Scheduled',
        `Site visit ${visitNumber} scheduled for ${data.scheduled_date}`,
        'site_visit',
        visitId
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
   * Start Site Visit
   */
  static async startVisit(id: string, userId: string): Promise<SiteVisit> {
    const now = new Date();
    const query = `
      UPDATE site_visits
      SET status = 'in_progress',
          actual_date = $1,
          start_time = $1,
          updated_at = $1
      WHERE id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [now, id]);

    await this.logHistory(
      null, id, userId, 'started', null, null, null, 'Site visit started'
    );

    return result.rows[0];
  }

  /**
   * Complete Site Visit
   */
  static async completeVisit(
    id: string,
    userId: string,
    data: {
      overall_rating?: number;
      work_progress_percentage?: number;
      workers_on_site?: number;
      equipment_on_site?: string[];
    }
  ): Promise<SiteVisit> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const now = new Date();
      const query = `
        UPDATE site_visits
        SET status = 'completed',
            end_time = $1,
            overall_rating = $2,
            work_progress_percentage = $3,
            workers_on_site = $4,
            equipment_on_site = $5,
            updated_at = $1
        WHERE id = $6
        RETURNING *
      `;

      const result = await client.query(query, [
        now,
        data.overall_rating,
        data.work_progress_percentage,
        data.workers_on_site,
        data.equipment_on_site || [],
        id
      ]);

      await this.logHistory(
        client, id, userId, 'completed', null, null, null, 'Site visit completed'
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
   * Get Site Visit by ID
   */
  static async getSiteVisitById(id: string): Promise<SiteVisit | null> {
    const query = `SELECT * FROM site_visits WHERE id = $1`;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Get Site Visits by project
   */
  static async getSiteVisitsByProject(projectId: string, filters?: {
    status?: InspectionStatus;
    visit_type?: SiteVisitType;
    from_date?: Date;
    to_date?: Date;
  }): Promise<SiteVisit[]> {
    let query = `SELECT * FROM site_visits WHERE project_id = $1`;
    const values: any[] = [projectId];
    let paramCount = 1;

    if (filters?.status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      values.push(filters.status);
    }

    if (filters?.visit_type) {
      paramCount++;
      query += ` AND visit_type = $${paramCount}`;
      values.push(filters.visit_type);
    }

    if (filters?.from_date) {
      paramCount++;
      query += ` AND scheduled_date >= $${paramCount}`;
      values.push(filters.from_date);
    }

    if (filters?.to_date) {
      paramCount++;
      query += ` AND scheduled_date <= $${paramCount}`;
      values.push(filters.to_date);
    }

    query += ` ORDER BY scheduled_date DESC`;

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Update Site Visit
   */
  static async updateSiteVisit(
    id: string,
    updates: Partial<SiteVisit>,
    userId: string
  ): Promise<SiteVisit> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get current visit for comparison
      const currentVisit = await this.getSiteVisitById(id);
      if (!currentVisit) {
        throw new Error('Site visit not found');
      }

      // Build update query
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCount = 0;

      const allowedFields = [
        'visit_type', 'scheduled_date', 'purpose', 'description',
        'weather_condition', 'temperature', 'humidity', 'wind_speed',
        'site_conditions', 'areas_inspected', 'follow_up_required', 'follow_up_date'
      ];

      for (const field of allowedFields) {
        if (updates[field as keyof SiteVisit] !== undefined) {
          paramCount++;
          updateFields.push(`${field} = $${paramCount}`);
          values.push(updates[field as keyof SiteVisit]);

          // Log field changes
          await this.logHistory(
            client, id, userId, 'updated', field,
            currentVisit[field as keyof SiteVisit]?.toString(),
            updates[field as keyof SiteVisit]?.toString(),
            null
          );
        }
      }

      paramCount++;
      updateFields.push(`updated_at = $${paramCount}`);
      values.push(new Date());

      paramCount++;
      values.push(id);

      const query = `
        UPDATE site_visits
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

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
   * Add Attendee to Site Visit
   */
  static async addAttendee(visitId: string, attendee: Partial<SiteVisitAttendee>): Promise<SiteVisitAttendee> {
    const query = `
      INSERT INTO site_visit_attendees (
        visit_id, name, company, role, email, phone
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await pool.query(query, [
      visitId, attendee.name, attendee.company,
      attendee.role, attendee.email, attendee.phone
    ]);

    return result.rows[0];
  }

  /**
   * Get Attendees for Site Visit
   */
  static async getAttendees(visitId: string): Promise<SiteVisitAttendee[]> {
    const query = `SELECT * FROM site_visit_attendees WHERE visit_id = $1 ORDER BY name`;
    const result = await pool.query(query, [visitId]);
    return result.rows;
  }

  /**
   * Sign attendance
   */
  static async signAttendance(attendeeId: string, signature: string): Promise<SiteVisitAttendee> {
    const query = `
      UPDATE site_visit_attendees
      SET signature = $1, signed_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [signature, attendeeId]);
    return result.rows[0];
  }

  /**
   * Create Issue
   */
  static async createIssue(visitId: string, issue: Partial<InspectionIssue>): Promise<InspectionIssue> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Generate issue number
      const countResult = await client.query(
        `SELECT COUNT(*) as count FROM inspection_issues WHERE visit_id = $1`,
        [visitId]
      );
      const count = parseInt(countResult.rows[0].count) + 1;
      const visit = await this.getSiteVisitById(visitId);
      const issueNumber = `${visit?.visit_number}-ISS-${String(count).padStart(3, '0')}`;

      const issueId = uuidv4();

      const query = `
        INSERT INTO inspection_issues (
          id, visit_id, issue_number, title, description, severity, status,
          location, grid_reference, responsible_party, due_date,
          cost_impact, time_impact_days
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
        ) RETURNING *
      `;

      const result = await client.query(query, [
        issueId,
        visitId,
        issueNumber,
        issue.title,
        issue.description,
        issue.severity || IssueSeverity.MINOR,
        IssueStatus.OPEN,
        issue.location,
        issue.grid_reference,
        issue.responsible_party,
        issue.due_date,
        issue.cost_impact,
        issue.time_impact_days
      ]);

      // Update follow-up required flag if critical issue
      if (issue.severity === IssueSeverity.CRITICAL || issue.severity === IssueSeverity.MAJOR) {
        await client.query(
          `UPDATE site_visits SET follow_up_required = true WHERE id = $1`,
          [visitId]
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
   * Get Issues for Site Visit
   */
  static async getIssues(visitId: string): Promise<InspectionIssue[]> {
    const query = `
      SELECT i.*,
        array_agg(DISTINCT sp.file_path) FILTER (WHERE sp.file_path IS NOT NULL) as photos
      FROM inspection_issues i
      LEFT JOIN site_photos sp ON i.id = sp.issue_id
      WHERE i.visit_id = $1
      GROUP BY i.id
      ORDER BY i.severity DESC, i.created_at DESC
    `;
    const result = await pool.query(query, [visitId]);
    return result.rows;
  }

  /**
   * Update Issue Status
   */
  static async updateIssueStatus(
    issueId: string,
    status: IssueStatus,
    resolution?: string
  ): Promise<InspectionIssue> {
    const query = `
      UPDATE inspection_issues
      SET status = $1,
          resolution_details = $2,
          resolved_date = CASE WHEN $1 = 'resolved' THEN CURRENT_TIMESTAMP ELSE resolved_date END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;

    const result = await pool.query(query, [status, resolution, issueId]);
    return result.rows[0];
  }

  /**
   * Add Checklist Item
   */
  static async addChecklistItem(
    visitId: string,
    item: Partial<InspectionChecklist>
  ): Promise<InspectionChecklist> {
    const query = `
      INSERT INTO inspection_checklists (
        visit_id, category, item, specification, compliant, comments, checked_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await pool.query(query, [
      visitId, item.category, item.item, item.specification,
      item.compliant || false, item.comments, item.checked_by
    ]);

    return result.rows[0];
  }

  /**
   * Get Checklist Items
   */
  static async getChecklistItems(visitId: string): Promise<InspectionChecklist[]> {
    const query = `
      SELECT * FROM inspection_checklists
      WHERE visit_id = $1
      ORDER BY category, item
    `;
    const result = await pool.query(query, [visitId]);
    return result.rows;
  }

  /**
   * Add Photo
   */
  static async addPhoto(
    visitId: string,
    photo: Partial<SitePhoto>
  ): Promise<SitePhoto> {
    const query = `
      INSERT INTO site_photos (
        visit_id, issue_id, file_path, thumbnail_path, caption,
        location, tags, gps_latitude, gps_longitude, taken_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const result = await pool.query(query, [
      visitId, photo.issue_id, photo.file_path, photo.thumbnail_path,
      photo.caption, photo.location, photo.tags || [],
      photo.gps_latitude, photo.gps_longitude, photo.taken_by
    ]);

    return result.rows[0];
  }

  /**
   * Get Photos for Site Visit
   */
  static async getPhotos(visitId: string): Promise<SitePhoto[]> {
    const query = `
      SELECT sp.*, u.name as taken_by_name
      FROM site_photos sp
      LEFT JOIN users u ON sp.taken_by = u.id
      WHERE sp.visit_id = $1
      ORDER BY sp.taken_at DESC
    `;
    const result = await pool.query(query, [visitId]);
    return result.rows;
  }

  /**
   * Generate Site Visit Report
   */
  static async generateReport(visitId: string): Promise<string> {
    // This would typically generate a PDF report
    // For now, we'll just mark the report as generated and return a path

    const reportPath = `/reports/site-visits/${visitId}-report.pdf`;

    await pool.query(
      `UPDATE site_visits
       SET report_generated = true, report_path = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [reportPath, visitId]
    );

    return reportPath;
  }

  /**
   * Get Site Visit Statistics
   */
  static async getStatistics(projectId: string): Promise<any> {
    const query = `
      SELECT
        COUNT(*) as total_visits,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_visits,
        COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled_visits,
        COUNT(*) FILTER (WHERE follow_up_required = true) as follow_up_required,
        AVG(overall_rating) FILTER (WHERE overall_rating IS NOT NULL) as avg_rating,
        AVG(work_progress_percentage) FILTER (WHERE work_progress_percentage IS NOT NULL) as avg_progress,
        (SELECT COUNT(*) FROM inspection_issues ii
         JOIN site_visits sv ON ii.visit_id = sv.id
         WHERE sv.project_id = $1) as total_issues,
        (SELECT COUNT(*) FROM inspection_issues ii
         JOIN site_visits sv ON ii.visit_id = sv.id
         WHERE sv.project_id = $1 AND ii.status = 'open') as open_issues,
        (SELECT COUNT(*) FROM inspection_issues ii
         JOIN site_visits sv ON ii.visit_id = sv.id
         WHERE sv.project_id = $1 AND ii.severity = 'critical') as critical_issues,
        (SELECT COUNT(*) FROM site_photos sp
         JOIN site_visits sv ON sp.visit_id = sv.id
         WHERE sv.project_id = $1) as total_photos
      FROM site_visits
      WHERE project_id = $1
    `;

    const result = await pool.query(query, [projectId]);
    return result.rows[0];
  }

  /**
   * Get Issues by Project
   */
  static async getProjectIssues(projectId: string, openOnly = false): Promise<InspectionIssue[]> {
    let query = `
      SELECT ii.*, sv.visit_number, sv.actual_date
      FROM inspection_issues ii
      JOIN site_visits sv ON ii.visit_id = sv.id
      WHERE sv.project_id = $1
    `;

    const values: any[] = [projectId];

    if (openOnly) {
      query += ` AND ii.status IN ('open', 'in_progress')`;
    }

    query += ` ORDER BY ii.severity DESC, ii.created_at DESC`;

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Log history entry
   */
  private static async logHistory(
    client: any,
    visitId: string,
    userId: string,
    action: string,
    fieldChanged: string | null,
    oldValue: string | null,
    newValue: string | null,
    comment: string | null
  ): Promise<void> {
    const conn = client || pool;
    await conn.query(
      `INSERT INTO site_visit_history (visit_id, user_id, action, field_changed, old_value, new_value, comment)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [visitId, userId, action, fieldChanged, oldValue, newValue, comment]
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
   * Cancel Site Visit
   */
  static async cancelVisit(id: string, userId: string, reason?: string): Promise<SiteVisit> {
    const query = `
      UPDATE site_visits
      SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [id]);

    await this.logHistory(
      null, id, userId, 'cancelled', null, null, null, reason || 'Site visit cancelled'
    );

    return result.rows[0];
  }
}

export default SiteVisitService;