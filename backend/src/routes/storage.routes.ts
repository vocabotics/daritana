import { Router } from 'express'
import { body, query, param } from 'express-validator'
import { authenticate, authorize } from '../middleware/auth'
import { validationResult } from 'express-validator'
import { prisma } from '../server'
import multer from 'multer'
import AWS from 'aws-sdk'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import fs from 'fs/promises'
import sharp from 'sharp'
import crypto from 'crypto'

const router = Router()

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'ap-southeast-1' // Singapore region for Malaysia
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'daritana-storage'
const CDN_URL = process.env.CDN_URL || `https://${BUCKET_NAME}.s3.amazonaws.com`

// Configure multer for file uploads
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB default
  },
  fileFilter: (req, file, cb) => {
    // Check file type restrictions based on user's plan
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/zip',
      'model/gltf-binary',
      'model/gltf+json',
      'application/dwg',
      'application/dxf'
    ]

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`))
    }
  }
})

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

// Upload file to cloud storage
router.post('/upload', upload.single('file'), async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided'
      })
    }

    const organizationId = req.user.organizationId
    const { projectId, folderId, description, tags } = req.body

    // Check storage limits
    const subscription = await prisma.subscription.findFirst({
      where: {
        organizationId,
        status: 'ACTIVE'
      },
      include: { plan: true }
    })

    if (!subscription) {
      return res.status(403).json({
        success: false,
        error: 'No active subscription'
      })
    }

    // Check file size limit
    if (req.file.size > subscription.plan.maxFileSize) {
      return res.status(413).json({
        success: false,
        error: 'File size exceeds plan limit',
        maxSize: subscription.plan.maxFileSize
      })
    }

    // Check total storage limit
    const storageUsed = await prisma.file.aggregate({
      where: { organizationId },
      _sum: { size: true }
    })

    const totalStorage = (storageUsed._sum.size || 0) + req.file.size
    if (totalStorage > subscription.plan.maxStorage) {
      return res.status(413).json({
        success: false,
        error: 'Storage limit exceeded',
        used: storageUsed._sum.size,
        limit: subscription.plan.maxStorage
      })
    }

    // Generate unique file key
    const fileExt = path.extname(req.file.originalname)
    const fileKey = `${organizationId}/${projectId || 'general'}/${uuidv4()}${fileExt}`

    // Calculate file hash for deduplication
    const fileHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex')

    // Check if file already exists (deduplication)
    const existingFile = await prisma.file.findFirst({
      where: {
        organizationId,
        hash: fileHash
      }
    })

    if (existingFile) {
      // File already exists, create a reference
      const fileReference = await prisma.file.create({
        data: {
          organizationId,
          projectId,
          folderId,
          uploadedBy: req.user.id,
          fileName: req.file.originalname,
          fileType: req.file.mimetype,
          size: req.file.size,
          url: existingFile.url,
          thumbnailUrl: existingFile.thumbnailUrl,
          s3Key: existingFile.s3Key,
          hash: fileHash,
          description,
          tags: tags || [],
          metadata: {
            deduplicated: true,
            originalFileId: existingFile.id
          }
        }
      })

      return res.status(201).json({
        success: true,
        file: fileReference,
        deduplicated: true
      })
    }

    // Upload to S3
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: fileKey,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      Metadata: {
        organizationId,
        uploadedBy: req.user.id,
        originalName: req.file.originalname
      }
    }

    const s3Result = await s3.upload(uploadParams).promise()

    // Generate thumbnail for images
    let thumbnailUrl = null
    if (req.file.mimetype.startsWith('image/')) {
      try {
        const thumbnailBuffer = await sharp(req.file.buffer)
          .resize(200, 200, { fit: 'cover' })
          .jpeg({ quality: 80 })
          .toBuffer()

        const thumbnailKey = `${organizationId}/thumbnails/${uuidv4()}.jpg`
        await s3.upload({
          Bucket: BUCKET_NAME,
          Key: thumbnailKey,
          Body: thumbnailBuffer,
          ContentType: 'image/jpeg'
        }).promise()

        thumbnailUrl = `${CDN_URL}/${thumbnailKey}`
      } catch (error) {
        console.error('Thumbnail generation failed:', error)
      }
    }

    // Save file record to database
    const file = await prisma.file.create({
      data: {
        organizationId,
        projectId,
        folderId,
        uploadedBy: req.user.id,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        size: req.file.size,
        url: s3Result.Location,
        thumbnailUrl,
        s3Key: fileKey,
        hash: fileHash,
        description,
        tags: tags || [],
        metadata: {
          etag: s3Result.ETag,
          versionId: s3Result.VersionId
        }
      }
    })

    // Log activity
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: req.user.id,
        action: 'FILE_UPLOADED',
        entityType: 'FILE',
        entityId: file.id,
        metadata: {
          fileName: req.file.originalname,
          fileSize: req.file.size,
          projectId
        }
      }
    })

    res.status(201).json({
      success: true,
      file
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to upload file',
      message: error.message
    })
  }
})

// Get files
router.get('/files', [
  query('projectId').optional().isUUID(),
  query('folderId').optional().isUUID(),
  query('type').optional(),
  query('search').optional(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  validate
], async (req: any, res: any) => {
  try {
    const { projectId, folderId, type, search, limit = 50, offset = 0 } = req.query
    const organizationId = req.user.organizationId

    const where: any = { organizationId }
    if (projectId) where.projectId = projectId
    if (folderId) where.folderId = folderId
    if (type) where.fileType = { contains: type }
    if (search) {
      where.OR = [
        { fileName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where,
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
        orderBy: { createdAt: 'desc' },
        include: {
          uploadedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          folder: {
            select: {
              id: true,
              name: true,
              path: true
            }
          }
        }
      }),
      prisma.file.count({ where })
    ])

    res.json({
      success: true,
      files,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch files',
      message: error.message
    })
  }
})

// Get file by ID
router.get('/files/:id', [
  param('id').isUUID(),
  validate
], async (req: any, res: any) => {
  try {
    const { id } = req.params
    const organizationId = req.user.organizationId

    const file = await prisma.file.findFirst({
      where: {
        id,
        organizationId
      },
      include: {
        uploadedByUser: true,
        versions: {
          orderBy: { version: 'desc' },
          take: 10
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      })
    }

    res.json({
      success: true,
      file
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch file',
      message: error.message
    })
  }
})

// Generate presigned URL for direct upload
router.post('/presigned-url', [
  body('fileName').notEmpty(),
  body('fileType').notEmpty(),
  body('fileSize').isInt({ min: 1 }),
  validate
], async (req: any, res: any) => {
  try {
    const { fileName, fileType, fileSize } = req.body
    const organizationId = req.user.organizationId

    // Check limits
    const subscription = await prisma.subscription.findFirst({
      where: {
        organizationId,
        status: 'ACTIVE'
      },
      include: { plan: true }
    })

    if (!subscription) {
      return res.status(403).json({
        success: false,
        error: 'No active subscription'
      })
    }

    if (fileSize > subscription.plan.maxFileSize) {
      return res.status(413).json({
        success: false,
        error: 'File size exceeds plan limit'
      })
    }

    // Generate presigned URL
    const fileKey = `${organizationId}/uploads/${uuidv4()}/${fileName}`
    const params = {
      Bucket: BUCKET_NAME,
      Key: fileKey,
      ContentType: fileType,
      Expires: 3600, // 1 hour
      Metadata: {
        organizationId,
        uploadedBy: req.user.id
      }
    }

    const uploadUrl = await s3.getSignedUrlPromise('putObject', params)

    res.json({
      success: true,
      uploadUrl,
      fileKey,
      expiresIn: 3600
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate presigned URL',
      message: error.message
    })
  }
})

// Create folder
router.post('/folders', [
  body('name').notEmpty(),
  body('parentId').optional().isUUID(),
  body('projectId').optional().isUUID(),
  validate
], async (req: any, res: any) => {
  try {
    const { name, parentId, projectId } = req.body
    const organizationId = req.user.organizationId

    // Build folder path
    let path = '/'
    if (parentId) {
      const parent = await prisma.folder.findFirst({
        where: {
          id: parentId,
          organizationId
        }
      })
      if (parent) {
        path = `${parent.path}${parent.name}/`
      }
    }

    const folder = await prisma.folder.create({
      data: {
        organizationId,
        projectId,
        name,
        path,
        parentId,
        createdBy: req.user.id
      }
    })

    res.status(201).json({
      success: true,
      folder
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to create folder',
      message: error.message
    })
  }
})

// Move file
router.put('/files/:id/move', [
  param('id').isUUID(),
  body('folderId').optional().isUUID().nullable(),
  body('projectId').optional().isUUID().nullable(),
  validate
], async (req: any, res: any) => {
  try {
    const { id } = req.params
    const { folderId, projectId } = req.body
    const organizationId = req.user.organizationId

    const file = await prisma.file.findFirst({
      where: {
        id,
        organizationId
      }
    })

    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      })
    }

    const updated = await prisma.file.update({
      where: { id },
      data: {
        folderId,
        projectId: projectId !== undefined ? projectId : file.projectId
      }
    })

    res.json({
      success: true,
      file: updated
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to move file',
      message: error.message
    })
  }
})

// Delete file
router.delete('/files/:id', [
  param('id').isUUID(),
  validate
], async (req: any, res: any) => {
  try {
    const { id } = req.params
    const organizationId = req.user.organizationId

    const file = await prisma.file.findFirst({
      where: {
        id,
        organizationId
      }
    })

    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      })
    }

    // Soft delete - move to trash
    await prisma.file.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: req.user.id
      }
    })

    // Schedule permanent deletion after 30 days
    // This would be handled by a background job in production

    res.json({
      success: true,
      message: 'File moved to trash'
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete file',
      message: error.message
    })
  }
})

// Share file
router.post('/files/:id/share', [
  param('id').isUUID(),
  body('userIds').optional().isArray(),
  body('emails').optional().isArray(),
  body('expiresAt').optional().isISO8601(),
  body('permissions').optional().isIn(['view', 'edit', 'download']),
  validate
], async (req: any, res: any) => {
  try {
    const { id } = req.params
    const { userIds, emails, expiresAt, permissions = 'view' } = req.body
    const organizationId = req.user.organizationId

    const file = await prisma.file.findFirst({
      where: {
        id,
        organizationId
      }
    })

    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      })
    }

    // Generate share link
    const shareToken = crypto.randomBytes(32).toString('hex')
    const shareLink = await prisma.fileShare.create({
      data: {
        fileId: id,
        sharedBy: req.user.id,
        token: shareToken,
        permissions,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        userIds: userIds || [],
        emails: emails || []
      }
    })

    const shareUrl = `${process.env.FRONTEND_URL}/shared/${shareToken}`

    res.json({
      success: true,
      shareUrl,
      shareLink
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to share file',
      message: error.message
    })
  }
})

// Get storage statistics
router.get('/statistics', async (req: any, res: any) => {
  try {
    const organizationId = req.user.organizationId

    const [
      totalFiles,
      totalSize,
      filesByType,
      recentFiles,
      subscription
    ] = await Promise.all([
      prisma.file.count({
        where: { organizationId, deletedAt: null }
      }),
      prisma.file.aggregate({
        where: { organizationId, deletedAt: null },
        _sum: { size: true }
      }),
      prisma.file.groupBy({
        by: ['fileType'],
        where: { organizationId, deletedAt: null },
        _count: true,
        _sum: { size: true }
      }),
      prisma.file.findMany({
        where: { organizationId, deletedAt: null },
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fileName: true,
          size: true,
          createdAt: true
        }
      }),
      prisma.subscription.findFirst({
        where: { organizationId, status: 'ACTIVE' },
        include: { plan: true }
      })
    ])

    const storageUsed = totalSize._sum.size || 0
    const storageLimit = subscription?.plan.maxStorage || 0
    const storagePercentage = storageLimit > 0 ? (storageUsed / storageLimit) * 100 : 0

    res.json({
      success: true,
      statistics: {
        totalFiles,
        storageUsed,
        storageLimit,
        storagePercentage,
        filesByType: filesByType.map(ft => ({
          type: ft.fileType,
          count: ft._count,
          size: ft._sum.size
        })),
        recentFiles
      }
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch storage statistics',
      message: error.message
    })
  }
})

export default router