import { Router } from 'express'
import { body, query, param } from 'express-validator'
import {
  createTimeline,
  listTimelines,
  updateTimeline,
  deleteTimeline,
  createMilestone,
  listMilestones,
  updateMilestone,
  deleteMilestone,
  getProjectProgress
} from '../controllers/project-timeline.controller'
import { authenticateMultiTenant, requirePermission } from '../middleware/multi-tenant-auth'
import { validationResult } from 'express-validator'

const router = Router()

// Validation middleware
const validate = (req: any, res: any, next: any) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation error', details: errors.array() })
  }
  next()
}

// Apply multi-tenant auth to all routes
router.use(authenticateMultiTenant)

// Project Timeline Routes

// Create timeline entry for project
router.post('/project/:projectId/timeline', [
  param('projectId').isUUID().withMessage('Project ID must be a valid UUID'),
  body('title').isLength({ min: 1, max: 255 }).withMessage('Title is required and must be less than 255 characters'),
  body('description').optional().isLength({ max: 1000 }),
  body('startDate').isISO8601().withMessage('Start date must be a valid ISO 8601 date'),
  body('endDate').isISO8601().withMessage('End date must be a valid ISO 8601 date'),
  body('color').optional().isHexColor().withMessage('Color must be a valid hex color'),
  validate
], requirePermission('projects.edit'), createTimeline)

// List timeline entries for project
router.get('/project/:projectId/timeline', [
  param('projectId').isUUID().withMessage('Project ID must be a valid UUID'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('sortBy').optional().isIn(['startDate', 'endDate', 'title', 'createdAt']),
  query('sortOrder').optional().isIn(['ASC', 'DESC']),
  validate
], requirePermission('projects.view'), listTimelines)

// Update timeline entry
router.put('/timeline/:timelineId', [
  param('timelineId').isUUID().withMessage('Timeline ID must be a valid UUID'),
  body('title').optional().isLength({ min: 1, max: 255 }),
  body('description').optional().isLength({ max: 1000 }),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('color').optional().isHexColor(),
  validate
], requirePermission('projects.edit'), updateTimeline)

// Delete timeline entry
router.delete('/timeline/:timelineId', [
  param('timelineId').isUUID().withMessage('Timeline ID must be a valid UUID'),
  validate
], requirePermission('projects.edit'), deleteTimeline)

// Project Milestone Routes

// Create milestone for project
router.post('/project/:projectId/milestones', [
  param('projectId').isUUID().withMessage('Project ID must be a valid UUID'),
  body('title').isLength({ min: 1, max: 255 }).withMessage('Title is required and must be less than 255 characters'),
  body('description').optional().isLength({ max: 1000 }),
  body('date').isISO8601().withMessage('Date must be a valid ISO 8601 date'),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  body('status').optional().isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  validate
], requirePermission('projects.edit'), createMilestone)

// List milestones for project
router.get('/project/:projectId/milestones', [
  param('projectId').isUUID().withMessage('Project ID must be a valid UUID'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  query('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  query('sortBy').optional().isIn(['date', 'title', 'priority', 'createdAt']),
  query('sortOrder').optional().isIn(['ASC', 'DESC']),
  validate
], requirePermission('projects.view'), listMilestones)

// Update milestone
router.put('/milestones/:milestoneId', [
  param('milestoneId').isUUID().withMessage('Milestone ID must be a valid UUID'),
  body('title').optional().isLength({ min: 1, max: 255 }),
  body('description').optional().isLength({ max: 1000 }),
  body('date').optional().isISO8601(),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  body('status').optional().isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  validate
], requirePermission('projects.edit'), updateMilestone)

// Delete milestone
router.delete('/milestones/:milestoneId', [
  param('milestoneId').isUUID().withMessage('Milestone ID must be a valid UUID'),
  validate
], requirePermission('projects.edit'), deleteMilestone)

// Project Progress Routes

// Get project progress overview
router.get('/project/:projectId/progress', [
  param('projectId').isUUID().withMessage('Project ID must be a valid UUID'),
  validate
], requirePermission('projects.view'), getProjectProgress)

export default router