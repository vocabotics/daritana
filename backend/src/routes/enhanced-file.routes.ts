import { Router } from 'express'
import { body, query, param } from 'express-validator'
import {
  uploadFiles,
  getUploadUrl,
  listDocuments,
  getDocument,
  deleteDocument,
  getStorageStats,
  upload
} from '../controllers/enhanced-file.controller'
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

// Upload files to cloud storage
router.post('/upload', upload.array('files', 10), [
  body('projectId').optional().isUUID().withMessage('Project ID must be a valid UUID'),
  body('type').optional().isIn(['document', 'image', 'cad', 'model_3d', 'spreadsheet', 'presentation', 'other']),
  body('category').optional().isLength({ max: 100 }),
  body('description').optional().isLength({ max: 500 }),
  body('isPublic').optional().isBoolean(),
  body('tags').optional().isArray(),
  validate
], uploadFiles)

// Get presigned upload URL for large files
router.post('/upload-url', [
  body('fileName').isLength({ min: 1, max: 255 }).withMessage('File name is required'),
  body('fileSize').isInt({ min: 1 }).withMessage('File size must be a positive integer'),
  body('fileType').isLength({ min: 1, max: 100 }).withMessage('File type is required'),
  body('projectId').optional().isUUID().withMessage('Project ID must be a valid UUID'),
  body('category').optional().isLength({ max: 100 }),
  validate
], getUploadUrl)

// List documents with advanced filtering
router.get('/documents', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('projectId').optional().isUUID().withMessage('Project ID must be a valid UUID'),
  query('type').optional().isIn(['document', 'image', 'cad', 'model_3d', 'spreadsheet', 'presentation', 'other']),
  query('category').optional().isLength({ min: 1 }),
  query('status').optional().isIn(['draft', 'in_review', 'approved', 'rejected']),
  query('search').optional().isLength({ min: 1 }),
  query('tags').optional(),
  query('sortBy').optional().isIn(['createdAt', 'name', 'fileSize', 'type', 'lastModified']),
  query('sortOrder').optional().isIn(['ASC', 'DESC']),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
  validate
], listDocuments)

// Get single document details
router.get('/documents/:documentId', [
  param('documentId').isUUID().withMessage('Document ID must be a valid UUID'),
  validate
], getDocument)

// Delete document from cloud storage
router.delete('/documents/:documentId', [
  param('documentId').isUUID().withMessage('Document ID must be a valid UUID'),
  validate
], requirePermission('files.delete'), deleteDocument)

// Get storage usage statistics
router.get('/storage/stats', getStorageStats)

// Get project documents (alias for backward compatibility)
router.get('/project/:projectId/documents', [
  param('projectId').isUUID().withMessage('Project ID must be a valid UUID'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('type').optional().isIn(['document', 'image', 'cad', 'model_3d', 'spreadsheet', 'presentation', 'other']),
  query('category').optional().isLength({ min: 1 }),
  query('status').optional().isIn(['draft', 'in_review', 'approved', 'rejected']),
  query('search').optional().isLength({ min: 1 }),
  query('sortBy').optional().isIn(['createdAt', 'name', 'fileSize', 'type']),
  query('sortOrder').optional().isIn(['ASC', 'DESC']),
  validate
], async (req: any, res: any) => {
  // Redirect to main documents endpoint with projectId filter
  req.query.projectId = req.params.projectId
  return listDocuments(req, res)
})

export default router