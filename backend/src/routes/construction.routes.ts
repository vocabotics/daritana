import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.middleware';
import pool from '../config/database';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/construction');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// ============================================
// CONSTRUCTION SITES
// ============================================

// Create new construction site
router.post('/sites',
  authenticateToken,
  [
    body('project_id').isUUID(),
    body('site_name').notEmpty().isLength({ max: 255 }),
    body('site_type').isIn(['residential', 'commercial', 'industrial', 'infrastructure', 'mixed']),
    body('address').isObject(),
    body('site_area_sqm').optional().isFloat({ min: 0 }),
    body('groundbreaking_date').optional().isISO8601(),
    body('estimated_completion').optional().isISO8601()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        project_id,
        site_name,
        site_type,
        address,
        coordinates,
        site_area_sqm,
        site_boundaries,
        site_manager_id,
        safety_officer_id,
        quality_inspector_id,
        groundbreaking_date,
        estimated_completion,
        whatsapp_group_id,
        whatsapp_group_name
      } = req.body;

      // Generate site code
      const siteCode = `SITE-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const result = await pool.query(
        `INSERT INTO construction.sites (
          project_id, organization_id, site_code, site_name, site_type,
          address, coordinates, site_area_sqm, site_boundaries,
          site_manager_id, safety_officer_id, quality_inspector_id,
          groundbreaking_date, estimated_completion,
          whatsapp_group_id, whatsapp_group_name
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *`,
        [
          project_id,
          req.user.organization_id,
          siteCode,
          site_name,
          site_type,
          JSON.stringify(address),
          coordinates ? `(${coordinates.lat},${coordinates.lng})` : null,
          site_area_sqm,
          site_boundaries ? JSON.stringify(site_boundaries) : null,
          site_manager_id,
          safety_officer_id,
          quality_inspector_id,
          groundbreaking_date,
          estimated_completion,
          whatsapp_group_id,
          whatsapp_group_name
        ]
      );

      // Create default phases for the site
      await createDefaultPhases(result.rows[0].id);

      res.status(201).json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error creating construction site:', error);
      res.status(500).json({ error: 'Failed to create construction site' });
    }
  }
);

// Get site progress data
router.get('/sites/:id/progress',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { start_date, end_date } = req.query;

      // Get site information
      const siteResult = await pool.query(
        'SELECT * FROM construction.sites WHERE id = $1 AND organization_id = $2',
        [id, req.user.organization_id]
      );

      if (siteResult.rows.length === 0) {
        return res.status(404).json({ error: 'Site not found' });
      }

      // Get overall progress
      const progressResult = await pool.query(
        'SELECT construction.calculate_site_progress($1) as overall_progress',
        [id]
      );

      // Get phases with progress
      const phasesResult = await pool.query(
        `SELECT * FROM construction.phases 
         WHERE site_id = $1 
         ORDER BY sequence_order`,
        [id]
      );

      // Get recent progress updates
      let progressQuery = `
        SELECT pu.*, u.first_name, u.last_name 
        FROM construction.progress_updates pu
        LEFT JOIN core.users u ON pu.recorded_by = u.id
        WHERE pu.site_id = $1
      `;
      const queryParams = [id];

      if (start_date && end_date) {
        progressQuery += ' AND pu.recorded_at BETWEEN $2 AND $3';
        queryParams.push(start_date as string, end_date as string);
      }

      progressQuery += ' ORDER BY pu.recorded_at DESC LIMIT 100';

      const updatesResult = await pool.query(progressQuery, queryParams);

      // Get worker count for today
      const workerResult = await pool.query(
        `SELECT COUNT(DISTINCT worker_id) as workers_present
         FROM construction.worker_attendance
         WHERE site_id = $1 AND attendance_date = CURRENT_DATE`,
        [id]
      );

      // Get active equipment
      const equipmentResult = await pool.query(
        `SELECT COUNT(*) as equipment_active
         FROM construction.equipment
         WHERE site_id = $1 AND operational_status = 'in_use'`,
        [id]
      );

      // Get material status
      const materialResult = await pool.query(
        `SELECT 
          COUNT(*) FILTER (WHERE status = 'delivered') as materials_delivered,
          COUNT(*) FILTER (WHERE status = 'in_transit') as materials_in_transit,
          COUNT(*) FILTER (WHERE remaining_quantity < planned_quantity * 0.2) as materials_low_stock
         FROM construction.materials
         WHERE site_id = $1`,
        [id]
      );

      // Get recent incidents
      const incidentResult = await pool.query(
        `SELECT COUNT(*) as incidents_this_week
         FROM construction.incidents
         WHERE site_id = $1 
         AND occurred_at >= CURRENT_DATE - INTERVAL '7 days'`,
        [id]
      );

      // Get weather impact
      const weatherResult = await pool.query(
        `SELECT * FROM construction.weather_logs
         WHERE site_id = $1 
         AND DATE(recorded_at) = CURRENT_DATE
         ORDER BY recorded_at DESC
         LIMIT 1`,
        [id]
      );

      res.json({
        success: true,
        data: {
          site: siteResult.rows[0],
          overall_progress: progressResult.rows[0].overall_progress,
          phases: phasesResult.rows,
          recent_updates: updatesResult.rows,
          statistics: {
            workers_present: workerResult.rows[0].workers_present,
            equipment_active: equipmentResult.rows[0].equipment_active,
            materials: materialResult.rows[0],
            incidents_this_week: incidentResult.rows[0].incidents_this_week
          },
          weather: weatherResult.rows[0] || null
        }
      });
    } catch (error) {
      console.error('Error fetching site progress:', error);
      res.status(500).json({ error: 'Failed to fetch site progress' });
    }
  }
);

// Submit progress update
router.post('/progress',
  authenticateToken,
  upload.array('photos', 10),
  [
    body('site_id').isUUID(),
    body('update_type').isIn(['daily', 'hourly', 'milestone', 'incident', 'weather', 'automated']),
    body('overall_progress').optional().isFloat({ min: 0, max: 100 }),
    body('phase_id').optional().isUUID(),
    body('phase_progress').optional().isFloat({ min: 0, max: 100 }),
    body('work_completed').optional().isString(),
    body('work_planned_next').optional().isString(),
    body('workers_present').optional().isInt({ min: 0 }),
    body('weather_conditions').optional().isObject()
  ],
  async (req: Request, res: Response) => {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        site_id,
        update_type,
        phase_id,
        overall_progress,
        phase_progress,
        work_completed,
        work_planned_next,
        workers_present,
        workers_by_trade,
        contractor_teams,
        equipment_on_site,
        equipment_utilization,
        materials_received,
        materials_used,
        material_issues,
        weather_conditions,
        weather_delays,
        weather_impact_hours,
        issues_encountered,
        safety_incidents,
        quality_issues
      } = req.body;

      // Process uploaded photos if any
      let photoIds = [];
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          // Store file info in site_media table
          const mediaResult = await client.query(
            `INSERT INTO construction.site_media (
              site_id, media_type, file_name, file_size, mime_type,
              storage_url, captured_at, captured_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id`,
            [
              site_id,
              'photo',
              file.filename,
              file.size,
              file.mimetype,
              `/uploads/construction/${file.filename}`,
              new Date(),
              req.user.id
            ]
          );
          photoIds.push(mediaResult.rows[0].id);

          // Queue for AI vision analysis
          await queueForAIAnalysis(mediaResult.rows[0].id, file.path);
        }
      }

      // Insert progress update
      const result = await client.query(
        `INSERT INTO construction.progress_updates (
          site_id, update_type, phase_id, recorded_by,
          overall_progress, phase_progress, work_completed, work_planned_next,
          workers_present, workers_by_trade, contractor_teams,
          equipment_on_site, equipment_utilization,
          materials_received, materials_used, material_issues,
          weather_conditions, weather_delays, weather_impact_hours,
          issues_encountered, safety_incidents, quality_issues,
          photos
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
        RETURNING *`,
        [
          site_id,
          update_type,
          phase_id,
          req.user.id,
          overall_progress,
          phase_progress,
          work_completed,
          work_planned_next,
          workers_present,
          workers_by_trade ? JSON.stringify(workers_by_trade) : null,
          contractor_teams ? JSON.stringify(contractor_teams) : null,
          equipment_on_site ? JSON.stringify(equipment_on_site) : null,
          equipment_utilization,
          materials_received ? JSON.stringify(materials_received) : null,
          materials_used ? JSON.stringify(materials_used) : null,
          material_issues,
          weather_conditions ? JSON.stringify(weather_conditions) : null,
          weather_delays,
          weather_impact_hours,
          issues_encountered,
          safety_incidents,
          quality_issues,
          photoIds
        ]
      );

      await client.query('COMMIT');

      // Trigger AI predictions update
      await updateAIPredictions(site_id);

      res.status(201).json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error submitting progress update:', error);
      res.status(500).json({ error: 'Failed to submit progress update' });
    } finally {
      client.release();
    }
  }
);

// AI vision analysis for site photos
router.post('/images/analyze',
  authenticateToken,
  upload.single('image'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image provided' });
      }

      const { site_id, phase_id, capture_area } = req.body;

      // Store image in database
      const mediaResult = await pool.query(
        `INSERT INTO construction.site_media (
          site_id, media_type, file_name, file_size, mime_type,
          storage_url, captured_at, captured_by, capture_area
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id`,
        [
          site_id,
          'photo',
          req.file.filename,
          req.file.size,
          req.file.mimetype,
          `/uploads/construction/${req.file.filename}`,
          new Date(),
          req.user.id,
          capture_area
        ]
      );

      const mediaId = mediaResult.rows[0].id;

      // Perform AI vision analysis
      const analysisResult = await performAIVisionAnalysis(req.file.path, site_id, phase_id);

      // Update media record with AI results
      await pool.query(
        `UPDATE construction.site_media
         SET ai_processed = true,
             ai_processed_at = NOW(),
             ai_detected_objects = $1,
             ai_progress_detected = $2,
             ai_safety_issues = $3,
             ai_quality_issues = $4
         WHERE id = $5`,
        [
          JSON.stringify(analysisResult.detected_objects),
          analysisResult.progress_percentage,
          JSON.stringify(analysisResult.safety_issues),
          JSON.stringify(analysisResult.quality_issues),
          mediaId
        ]
      );

      res.json({
        success: true,
        data: {
          media_id: mediaId,
          analysis: analysisResult
        }
      });
    } catch (error) {
      console.error('Error analyzing image:', error);
      res.status(500).json({ error: 'Failed to analyze image' });
    }
  }
);

// Get material tracking data
router.get('/materials/:siteId',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;
      const { status, category } = req.query;

      let query = `
        SELECT * FROM construction.materials
        WHERE site_id = $1
      `;
      const queryParams = [siteId];

      if (status) {
        query += ` AND status = $${queryParams.length + 1}`;
        queryParams.push(status as string);
      }

      if (category) {
        query += ` AND category = $${queryParams.length + 1}`;
        queryParams.push(category as string);
      }

      query += ' ORDER BY expected_delivery ASC';

      const result = await pool.query(query, queryParams);

      // Calculate material statistics
      const statsResult = await pool.query(
        `SELECT 
          COUNT(*) as total_materials,
          COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
          COUNT(*) FILTER (WHERE status = 'in_transit') as in_transit,
          COUNT(*) FILTER (WHERE remaining_quantity < planned_quantity * 0.2) as low_stock,
          SUM(total_cost) as total_value
         FROM construction.materials
         WHERE site_id = $1`,
        [siteId]
      );

      res.json({
        success: true,
        data: {
          materials: result.rows,
          statistics: statsResult.rows[0]
        }
      });
    } catch (error) {
      console.error('Error fetching materials:', error);
      res.status(500).json({ error: 'Failed to fetch materials' });
    }
  }
);

// Worker check-in/out
router.post('/workers/checkin',
  authenticateToken,
  [
    body('site_id').isUUID(),
    body('worker_id').notEmpty(),
    body('action').isIn(['check_in', 'check_out']),
    body('location').optional().isObject()
  ],
  async (req: Request, res: Response) => {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const { site_id, worker_id, action, location, photo_url } = req.body;

      // Check if worker exists
      let workerResult = await client.query(
        'SELECT id FROM construction.workers WHERE site_id = $1 AND worker_id = $2',
        [site_id, worker_id]
      );

      if (workerResult.rows.length === 0) {
        return res.status(404).json({ error: 'Worker not found' });
      }

      const workerId = workerResult.rows[0].id;

      // Get or create today's attendance record
      const today = new Date().toISOString().split('T')[0];
      let attendanceResult = await client.query(
        'SELECT * FROM construction.worker_attendance WHERE worker_id = $1 AND attendance_date = $2',
        [workerId, today]
      );

      if (action === 'check_in') {
        if (attendanceResult.rows.length === 0) {
          // Create new attendance record
          attendanceResult = await client.query(
            `INSERT INTO construction.worker_attendance (
              site_id, worker_id, attendance_date, check_in_time,
              check_in_method, check_in_photo_url, check_in_location
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [
              site_id,
              workerId,
              today,
              new Date(),
              'manual',
              photo_url,
              location ? `(${location.lat},${location.lng})` : null
            ]
          );
        } else {
          // Update existing record
          attendanceResult = await client.query(
            `UPDATE construction.worker_attendance
             SET check_in_time = $1, check_in_photo_url = $2, check_in_location = $3
             WHERE worker_id = $4 AND attendance_date = $5
             RETURNING *`,
            [
              new Date(),
              photo_url,
              location ? `(${location.lat},${location.lng})` : null,
              workerId,
              today
            ]
          );
        }

        // Update worker's last check-in
        await client.query(
          'UPDATE construction.workers SET last_check_in = $1 WHERE id = $2',
          [new Date(), workerId]
        );
      } else { // check_out
        if (attendanceResult.rows.length === 0) {
          return res.status(400).json({ error: 'No check-in record found for today' });
        }

        const checkInTime = new Date(attendanceResult.rows[0].check_in_time);
        const checkOutTime = new Date();
        const hoursWorked = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

        attendanceResult = await client.query(
          `UPDATE construction.worker_attendance
           SET check_out_time = $1, hours_worked = $2
           WHERE worker_id = $3 AND attendance_date = $4
           RETURNING *`,
          [checkOutTime, hoursWorked, workerId, today]
        );

        // Update worker's last check-out and total days
        await client.query(
          `UPDATE construction.workers 
           SET last_check_out = $1, 
               total_days_worked = total_days_worked + 1
           WHERE id = $2`,
          [checkOutTime, workerId]
        );
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        data: attendanceResult.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error processing worker check-in/out:', error);
      res.status(500).json({ error: 'Failed to process check-in/out' });
    } finally {
      client.release();
    }
  }
);

// Get comprehensive dashboard data
router.get('/dashboard/:siteId',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;
      const { period = '7days' } = req.query;

      // Calculate date range
      let dateFilter = "CURRENT_DATE - INTERVAL '7 days'";
      if (period === '30days') {
        dateFilter = "CURRENT_DATE - INTERVAL '30 days'";
      } else if (period === 'month') {
        dateFilter = "DATE_TRUNC('month', CURRENT_DATE)";
      }

      // Get site overview
      const siteResult = await pool.query(
        `SELECT s.*, 
          construction.calculate_site_progress(s.id) as overall_progress,
          p.name as project_name,
          p.client_id,
          u1.first_name as manager_first_name,
          u1.last_name as manager_last_name
         FROM construction.sites s
         JOIN projects.projects p ON s.project_id = p.id
         LEFT JOIN core.users u1 ON s.site_manager_id = u1.id
         WHERE s.id = $1`,
        [siteId]
      );

      if (siteResult.rows.length === 0) {
        return res.status(404).json({ error: 'Site not found' });
      }

      // Get phase progress
      const phasesResult = await pool.query(
        `SELECT * FROM construction.phases
         WHERE site_id = $1
         ORDER BY sequence_order`,
        [siteId]
      );

      // Get worker statistics
      const workerStatsResult = await pool.query(
        `SELECT 
          COUNT(DISTINCT worker_id) as total_workers,
          COUNT(DISTINCT worker_id) FILTER (WHERE attendance_date = CURRENT_DATE) as workers_today,
          AVG(hours_worked) as avg_hours_per_day,
          SUM(hours_worked) as total_hours_worked
         FROM construction.worker_attendance
         WHERE site_id = $1 AND attendance_date >= ${dateFilter}`,
        [siteId]
      );

      // Get equipment utilization
      const equipmentResult = await pool.query(
        `SELECT 
          e.category,
          COUNT(*) as count,
          AVG(eu.productive_hours / NULLIF(eu.total_hours, 0) * 100) as avg_utilization
         FROM construction.equipment e
         LEFT JOIN construction.equipment_usage eu ON e.id = eu.equipment_id
         WHERE e.site_id = $1
         GROUP BY e.category`,
        [siteId]
      );

      // Get material status
      const materialStatsResult = await pool.query(
        `SELECT 
          COUNT(*) as total_materials,
          COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
          COUNT(*) FILTER (WHERE status = 'ordered') as ordered,
          COUNT(*) FILTER (WHERE remaining_quantity < planned_quantity * 0.2) as critical_stock,
          SUM(total_cost) as total_material_value
         FROM construction.materials
         WHERE site_id = $1`,
        [siteId]
      );

      // Get safety statistics
      const safetyResult = await pool.query(
        `SELECT 
          COUNT(*) as total_incidents,
          COUNT(*) FILTER (WHERE severity = 'critical' OR severity = 'fatal') as critical_incidents,
          COUNT(*) FILTER (WHERE incident_type = 'safety') as safety_incidents,
          COUNT(*) FILTER (WHERE DATE(occurred_at) = CURRENT_DATE) as incidents_today
         FROM construction.incidents
         WHERE site_id = $1 AND occurred_at >= ${dateFilter}`,
        [siteId]
      );

      // Get recent progress trend
      const progressTrendResult = await pool.query(
        `SELECT 
          DATE(recorded_at) as date,
          MAX(overall_progress) as progress
         FROM construction.progress_updates
         WHERE site_id = $1 AND recorded_at >= ${dateFilter}
         GROUP BY DATE(recorded_at)
         ORDER BY date`,
        [siteId]
      );

      // Get upcoming inspections
      const inspectionsResult = await pool.query(
        `SELECT * FROM construction.inspections
         WHERE site_id = $1 
         AND scheduled_date >= CURRENT_DATE
         AND status = 'scheduled'
         ORDER BY scheduled_date
         LIMIT 5`,
        [siteId]
      );

      // Get AI predictions
      const predictionsResult = await pool.query(
        `SELECT * FROM construction.ai_predictions
         WHERE site_id = $1
         AND alert_acknowledged = false
         ORDER BY created_at DESC
         LIMIT 5`,
        [siteId]
      );

      res.json({
        success: true,
        data: {
          site: siteResult.rows[0],
          phases: phasesResult.rows,
          statistics: {
            workers: workerStatsResult.rows[0],
            equipment: equipmentResult.rows,
            materials: materialStatsResult.rows[0],
            safety: safetyResult.rows[0]
          },
          progress_trend: progressTrendResult.rows,
          upcoming_inspections: inspectionsResult.rows,
          ai_predictions: predictionsResult.rows
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
  }
);

// WhatsApp webhook for messages
router.post('/whatsapp/webhook',
  async (req: Request, res: Response) => {
    try {
      const { entry } = req.body;

      if (entry && entry[0] && entry[0].changes && entry[0].changes[0]) {
        const change = entry[0].changes[0];
        if (change.value && change.value.messages) {
          for (const message of change.value.messages) {
            await processWhatsAppMessage(message);
          }
        }
      }

      res.sendStatus(200);
    } catch (error) {
      console.error('Error processing WhatsApp webhook:', error);
      res.sendStatus(500);
    }
  }
);

// Get AI predictions and insights
router.get('/predictions/:siteId',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;
      const { type, alert_level } = req.query;

      let query = `
        SELECT * FROM construction.ai_predictions
        WHERE site_id = $1
      `;
      const queryParams = [siteId];

      if (type) {
        query += ` AND prediction_type = $${queryParams.length + 1}`;
        queryParams.push(type as string);
      }

      if (alert_level) {
        query += ` AND alert_level = $${queryParams.length + 1}`;
        queryParams.push(alert_level as string);
      }

      query += ' ORDER BY prediction_date DESC LIMIT 50';

      const result = await pool.query(query, queryParams);

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Error fetching predictions:', error);
      res.status(500).json({ error: 'Failed to fetch predictions' });
    }
  }
);

// Log inspection results
router.post('/inspections',
  authenticateToken,
  [
    body('site_id').isUUID(),
    body('inspection_type').notEmpty(),
    body('inspector_name').notEmpty(),
    body('checklist_results').isObject(),
    body('compliance_score').isFloat({ min: 0, max: 100 })
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        site_id,
        phase_id,
        inspection_type,
        inspector_name,
        inspector_company,
        checklist_template,
        checklist_results,
        total_items_checked,
        items_passed,
        items_failed,
        critical_issues,
        major_issues,
        minor_issues,
        compliance_score,
        safety_score,
        quality_score,
        corrective_actions,
        preventive_actions,
        deadline_for_actions
      } = req.body;

      // Generate inspection code
      const inspectionCode = `INSP-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const result = await pool.query(
        `INSERT INTO construction.inspections (
          site_id, phase_id, inspection_type, inspection_code,
          actual_date, inspector_name, inspector_company, inspector_id,
          checklist_template, checklist_results,
          total_items_checked, items_passed, items_failed,
          critical_issues, major_issues, minor_issues,
          compliance_score, safety_score, quality_score,
          corrective_actions, preventive_actions, deadline_for_actions,
          status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
        RETURNING *`,
        [
          site_id,
          phase_id,
          inspection_type,
          inspectionCode,
          new Date(),
          inspector_name,
          inspector_company,
          req.user.id,
          JSON.stringify(checklist_template),
          JSON.stringify(checklist_results),
          total_items_checked,
          items_passed,
          items_failed,
          critical_issues || 0,
          major_issues || 0,
          minor_issues || 0,
          compliance_score,
          safety_score,
          quality_score,
          JSON.stringify(corrective_actions || []),
          JSON.stringify(preventive_actions || []),
          deadline_for_actions,
          'completed'
        ]
      );

      // Create incidents if critical issues found
      if (critical_issues > 0) {
        await createIncidentFromInspection(site_id, result.rows[0].id, 'critical');
      }

      res.status(201).json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error logging inspection:', error);
      res.status(500).json({ error: 'Failed to log inspection' });
    }
  }
);

// ============================================
// HELPER FUNCTIONS
// ============================================

async function createDefaultPhases(siteId: string) {
  const defaultPhases = [
    { code: 'SITE_PREP', name: 'Site Preparation', type: 'preparation', order: 1, weight: 5 },
    { code: 'FOUNDATION', name: 'Foundation Work', type: 'foundation', order: 2, weight: 15 },
    { code: 'STRUCTURE', name: 'Structural Work', type: 'structure', order: 3, weight: 30 },
    { code: 'ROOFING', name: 'Roofing', type: 'roofing', order: 4, weight: 10 },
    { code: 'MEP_ROUGH', name: 'MEP Rough-In', type: 'mep', order: 5, weight: 15 },
    { code: 'EXTERIOR', name: 'Exterior Finishing', type: 'finishing', order: 6, weight: 10 },
    { code: 'INTERIOR', name: 'Interior Finishing', type: 'finishing', order: 7, weight: 10 },
    { code: 'FINAL_MEP', name: 'Final MEP', type: 'mep', order: 8, weight: 3 },
    { code: 'LANDSCAPING', name: 'Landscaping', type: 'landscaping', order: 9, weight: 2 }
  ];

  for (const phase of defaultPhases) {
    await pool.query(
      `INSERT INTO construction.phases (
        site_id, phase_code, phase_name, phase_type, 
        sequence_order, weight_factor
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (site_id, phase_code) DO NOTHING`,
      [siteId, phase.code, phase.name, phase.type, phase.order, phase.weight]
    );
  }
}

async function queueForAIAnalysis(mediaId: string, filePath: string) {
  // This would typically queue the image for AI processing
  // For now, we'll call the AI analysis directly
  setTimeout(async () => {
    try {
      const result = await performAIVisionAnalysis(filePath, '', '');
      await pool.query(
        `UPDATE construction.site_media
         SET ai_processed = true,
             ai_processed_at = NOW(),
             ai_detected_objects = $1,
             ai_progress_detected = $2,
             ai_safety_issues = $3,
             ai_quality_issues = $4
         WHERE id = $5`,
        [
          JSON.stringify(result.detected_objects),
          result.progress_percentage,
          JSON.stringify(result.safety_issues),
          JSON.stringify(result.quality_issues),
          mediaId
        ]
      );
    } catch (error) {
      console.error('Error in AI analysis queue:', error);
    }
  }, 1000);
}

async function performAIVisionAnalysis(imagePath: string, siteId: string, phaseId: string) {
  // This would integrate with an AI vision service
  // For demonstration, returning mock data
  return {
    detected_objects: {
      workers: Math.floor(Math.random() * 20),
      equipment: ['excavator', 'crane'],
      materials: ['concrete', 'steel_beams'],
      safety_equipment: ['hard_hats', 'safety_vests']
    },
    progress_percentage: Math.random() * 100,
    safety_issues: Math.random() > 0.8 ? ['Missing hard hat detected'] : [],
    quality_issues: Math.random() > 0.9 ? ['Visible crack in concrete'] : [],
    confidence: 0.85
  };
}

async function updateAIPredictions(siteId: string) {
  // This would run AI models to update predictions
  // For demonstration, creating sample predictions
  
  const predictions = [
    {
      type: 'completion_date',
      value: { date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), delay_days: 5 },
      confidence: 0.78,
      factors: ['Weather delays', 'Material shortage'],
      recommendations: ['Accelerate foundation work', 'Order materials in advance']
    },
    {
      type: 'cost_overrun',
      value: { percentage: 8.5, amount: 125000 },
      confidence: 0.82,
      factors: ['Material price increase', 'Additional labor'],
      recommendations: ['Negotiate bulk material purchases', 'Optimize workforce allocation']
    }
  ];

  for (const prediction of predictions) {
    await pool.query(
      `INSERT INTO construction.ai_predictions (
        site_id, prediction_type, prediction_date,
        model_name, model_version,
        predicted_value, confidence_score,
        contributing_factors, recommendations,
        alert_level
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        siteId,
        prediction.type,
        new Date(),
        'ConstructionAI',
        '1.0',
        JSON.stringify(prediction.value),
        prediction.confidence,
        JSON.stringify(prediction.factors),
        prediction.recommendations,
        prediction.type === 'cost_overrun' ? 'warning' : 'info'
      ]
    );
  }
}

async function processWhatsAppMessage(message: any) {
  try {
    // Store the message
    await pool.query(
      `INSERT INTO construction.whatsapp_messages (
        site_id, message_id, from_number, from_name,
        message_type, message_text, media_url, received_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        message.site_id, // This would need to be determined from the group or number
        message.id,
        message.from,
        message.profile?.name,
        message.type,
        message.text?.body,
        message.image?.url || message.video?.url,
        new Date(message.timestamp * 1000)
      ]
    );

    // Process with AI for categorization
    // This would integrate with NLP service
  } catch (error) {
    console.error('Error processing WhatsApp message:', error);
  }
}

async function createIncidentFromInspection(siteId: string, inspectionId: string, severity: string) {
  const incidentCode = `INC-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  
  await pool.query(
    `INSERT INTO construction.incidents (
      site_id, incident_code, incident_type, severity,
      occurred_at, description, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      siteId,
      incidentCode,
      'quality',
      severity,
      new Date(),
      `Critical issues found during inspection ${inspectionId}`,
      'open'
    ]
  );
}

export default router;