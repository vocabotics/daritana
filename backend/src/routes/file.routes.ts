import { Router } from 'express'
import multer from 'multer'
import {
  uploadFile,
  uploadToCloud,
  getPresignedUrl,
  getOrganizationFiles,
  deleteFile,
  updateFileMetadata,
  getStorageStats
} from '../controllers/file.controller'

const router = Router()

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/temp/',
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
      'pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'gif', 'dwg', 'dxf'
    ]
    const ext = file.originalname.split('.').pop()?.toLowerCase()
    if (ext && allowedTypes.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error(`File type .${ext} not allowed`))
    }
  }
})

// File upload endpoints
router.post('/upload', upload.single('file'), uploadFile)
router.post('/upload-cloud', upload.single('file'), uploadToCloud)
router.post('/upload-multiple', upload.array('files', 10), uploadToCloud)

// Presigned URL for direct upload
router.post('/presigned-url', getPresignedUrl)

// File management
router.get('/', getOrganizationFiles)
router.delete('/:fileId', deleteFile)
router.put('/:fileId/metadata', updateFileMetadata)

// Storage statistics
router.get('/storage/stats', getStorageStats)

export default router