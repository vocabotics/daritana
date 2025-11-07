import { Router } from 'express'
import { body, query, param } from 'express-validator'
import { ProjectController } from '../controllers/project.prisma.controller'
import { authenticate } from '../middleware/auth'
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

// All routes require authentication
router.use(authenticate)

// Search projects (accessible to all authenticated users)
router.get('/search', [
  query('q').isLength({ min: 2 }).withMessage('Search query must be at least 2 characters'),
  query('status').optional().isIn(['draft', 'planning', 'in_progress', 'on_hold', 'completed', 'cancelled']),
  query('type').optional().isIn(['residential', 'commercial', 'industrial', 'institutional', 'renovation', 'interior_design', 'landscape']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validate
], ProjectController.searchProjects)

// Get dashboard statistics (accessible to all authenticated users)
router.get('/dashboard/statistics', ProjectController.getDashboardStatistics)

// Get all projects with filtering and pagination
router.get('/', ProjectController.getAllProjects)

// Create new project
router.post('/', [
  body('name').notEmpty().withMessage('Project name is required').isLength({ max: 255 }),
  body('description').optional().isLength({ max: 2000 }),
  body('type').optional().isIn(['residential', 'commercial', 'industrial', 'institutional', 'renovation', 'interior_design', 'landscape']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('budget').optional().isNumeric().isFloat({ min: 0 }),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('address').optional().isLength({ max: 500 }),
  body('city').optional().isLength({ max: 100 }),
  body('state').optional().isLength({ max: 100 }),
  body('postalCode').optional().isLength({ max: 20 }),
  body('country').optional().isLength({ max: 100 }),
  body('clientId').optional().isUUID(),
  body('projectLeadId').optional().isUUID(),
  body('designerId').optional().isUUID(),
  body('culturalConsiderations').optional().isObject(),
  body('sustainabilityFeatures').optional().isArray(),
  body('complianceRequirements').optional().isArray(),
  validate
], ProjectController.createProject)

// Get project by ID
router.get('/:id', [
  param('id').isUUID(),
  validate
], ProjectController.getProjectById)

// Update project
router.put('/:id', [
  param('id').isUUID(),
  body('name').optional().isLength({ max: 255 }),
  body('description').optional().isLength({ max: 2000 }),
  body('type').optional().isIn(['residential', 'commercial', 'industrial', 'institutional', 'renovation', 'interior_design', 'landscape']),
  body('status').optional().isIn(['draft', 'planning', 'in_progress', 'on_hold', 'completed', 'cancelled']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('budget').optional().isNumeric().isFloat({ min: 0 }),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('actualStartDate').optional().isISO8601(),
  body('actualEndDate').optional().isISO8601(),
  body('address').optional().isLength({ max: 500 }),
  body('city').optional().isLength({ max: 100 }),
  body('state').optional().isLength({ max: 100 }),
  body('postalCode').optional().isLength({ max: 20 }),
  body('country').optional().isLength({ max: 100 }),
  body('clientId').optional().isUUID(),
  body('projectLeadId').optional().isUUID(),
  body('designerId').optional().isUUID(),
  body('progress').optional().isInt({ min: 0, max: 100 }),
  body('culturalConsiderations').optional().isObject(),
  body('sustainabilityFeatures').optional().isArray(),
  body('complianceRequirements').optional().isArray(),
  validate
], ProjectController.updateProject)

// Get project statistics
router.get('/:id/statistics', [
  param('id').isUUID(),
  validate
], ProjectController.getProjectStatistics)

// Get project team members
router.get('/:id/team', [
  param('id').isUUID(),
  validate
], ProjectController.getProjectTeam)

// Update project progress
router.post('/:id/update-progress', [
  param('id').isUUID(),
  validate
], ProjectController.updateProjectProgress)

// Delete project (soft delete)
router.delete('/:id', [
  param('id').isUUID(),
  validate
], ProjectController.deleteProject)

export default router