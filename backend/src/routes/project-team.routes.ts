import { Router } from 'express'
import { body, query, param } from 'express-validator'
import {
  addProjectMember,
  listProjectMembers,
  updateProjectMember,
  removeProjectMember,
  bulkAssignMembers,
  getProjectMemberStats
} from '../controllers/project-team.controller'
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

// Add team member to project
router.post('/:projectId/members', [
  param('projectId').isUUID().withMessage('Project ID must be a valid UUID'),
  body('userId').isUUID().withMessage('User ID must be a valid UUID'),
  body('role').optional().isIn(['LEAD', 'MEMBER', 'VIEWER']).withMessage('Invalid role'),
  body('permissions').optional().isArray().withMessage('Permissions must be an array'),
  body('permissions.*').optional().isIn(['view', 'edit', 'comment', 'upload', 'delete', 'manage_team']),
  validate
], requirePermission('projects.manage_team'), addProjectMember)

// List project team members
router.get('/:projectId/members', [
  param('projectId').isUUID().withMessage('Project ID must be a valid UUID'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('role').optional().isIn(['LEAD', 'MEMBER', 'VIEWER']),
  query('search').optional().isLength({ min: 1 }),
  query('sortBy').optional().isIn(['joinedAt', 'name', 'role']),
  query('sortOrder').optional().isIn(['ASC', 'DESC']),
  validate
], requirePermission('projects.view'), listProjectMembers)

// Update project member role/permissions
router.put('/:projectId/members/:memberId', [
  param('projectId').isUUID().withMessage('Project ID must be a valid UUID'),
  param('memberId').isUUID().withMessage('Member ID must be a valid UUID'),
  body('role').optional().isIn(['LEAD', 'MEMBER', 'VIEWER']).withMessage('Invalid role'),
  body('permissions').optional().isArray().withMessage('Permissions must be an array'),
  body('permissions.*').optional().isIn(['view', 'edit', 'comment', 'upload', 'delete', 'manage_team']),
  validate
], requirePermission('projects.manage_team'), updateProjectMember)

// Remove member from project
router.delete('/:projectId/members/:memberId', [
  param('projectId').isUUID().withMessage('Project ID must be a valid UUID'),
  param('memberId').isUUID().withMessage('Member ID must be a valid UUID'),
  validate
], requirePermission('projects.manage_team'), removeProjectMember)

// Bulk assign team members
router.post('/:projectId/members/bulk', [
  param('projectId').isUUID().withMessage('Project ID must be a valid UUID'),
  body('members').isArray({ min: 1 }).withMessage('Members array is required'),
  body('members.*.userId').isUUID().withMessage('Each member must have a valid user ID'),
  body('members.*.role').optional().isIn(['LEAD', 'MEMBER', 'VIEWER']).withMessage('Invalid role'),
  body('members.*.permissions').optional().isArray().withMessage('Permissions must be an array'),
  validate
], requirePermission('projects.manage_team'), bulkAssignMembers)

// Get project member statistics
router.get('/:projectId/members/stats', [
  param('projectId').isUUID().withMessage('Project ID must be a valid UUID'),
  validate
], requirePermission('projects.view'), getProjectMemberStats)

export default router