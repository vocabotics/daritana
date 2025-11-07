import { Response } from 'express'
import { prisma } from '../server'
import { MultiTenantRequest } from '../middleware/multi-tenant-auth'
import { 
  uploadToS3, 
  deleteFromS3, 
  getSignedUrl, 
  generatePresignedPost,
  calculateStorageUsage 
} from '../services/cloud-storage.service'
import multer from 'multer'
import path from 'path'

// Configure multer for memory storage
const storage = multer.memoryStorage()

const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  // Define allowed file types
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'text/csv',
    'application/zip', 'application/x-rar-compressed',
    'video/mp4', 'video/quicktime', 'video/x-msvideo',
    'audio/mpeg', 'audio/wav', 'audio/mp3',
    'application/dwg', 'application/dxf', // CAD files
    'model/3dm', 'model/obj', 'model/fbx' // 3D models
  ]

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false)
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
})

/**
 * Upload files to cloud storage
 */
export const uploadFiles = async (req: MultiTenantRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    // Check storage limits
    const currentUsage = await calculateStorageUsage(organizationId)
    const maxStorage = (req.organization?.limits?.maxStorage || 0) * 1024 * 1024 // Convert MB to bytes

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: 'No files provided' })
    }

    const files = req.files as Express.Multer.File[]
    const totalUploadSize = files.reduce((sum, file) => sum + file.size, 0)

    if (currentUsage + totalUploadSize > maxStorage) {
      return res.status(413).json({
        error: 'Storage limit exceeded',
        current: currentUsage,
        limit: maxStorage,
        attempting: totalUploadSize
      })
    }

    const { projectId, taskId, folder = 'documents', isPublic = false } = req.body

    const uploadResults = []

    for (const file of files) {
      try {
        // Upload to S3
        const uploadResult = await uploadToS3(file, {
          folder,
          organizationId,
          userId: req.user?.id,
          makePublic: isPublic
        })

        // Create database record
        const document = await prisma.document.create({
          data: {
            organizationId,
            name: path.parse(file.originalname).name,
            originalName: file.originalname,
            description: req.body.description || null,
            mimeType: file.mimetype,
            size: file.size,
            path: uploadResult.key,
            url: uploadResult.url,
            type: getDocumentType(file.mimetype),
            category: req.body.category || null,
            tags: req.body.tags || [],
            projectId: projectId || null,
            taskId: taskId || null,
            uploadedById: req.user!.id,
            isPublic: isPublic,
            accessLevel: isPublic ? 'PUBLIC' : (projectId ? 'PROJECT' : 'ORGANIZATION')
          }
        })

        uploadResults.push({
          id: document.id,
          name: document.name,
          originalName: document.originalName,
          size: document.size,
          mimeType: document.mimeType,
          url: document.url,
          type: document.type
        })

        // Update organization storage usage
        await prisma.organization.update({
          where: { id: organizationId },
          data: {
            usedStorage: {
              increment: Math.ceil(file.size / (1024 * 1024)) // Convert to MB
            }
          }
        })

      } catch (error) {
        console.error(`Upload failed for ${file.originalname}:`, error)
        uploadResults.push({
          originalName: file.originalname,
          error: 'Upload failed'
        })
      }
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: req.user!.id,
        action: 'create',
        resource: 'documents',
        newValues: { 
          count: uploadResults.filter(r => !r.error).length,
          totalSize: totalUploadSize,
          projectId,
          taskId 
        }
      }
    })

    res.status(201).json({
      success: true,
      uploaded: uploadResults
    })
  } catch (error) {
    console.error('Upload files error:', error)
    res.status(500).json({ error: 'Failed to upload files' })
  }
}

/**
 * Get presigned upload URL for direct uploads
 */
export const getUploadUrl = async (req: MultiTenantRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    const { filename, contentType, folder = 'documents', maxSize } = req.body

    if (!filename || !contentType) {
      return res.status(400).json({ error: 'Filename and content type are required' })
    }

    // Generate unique key
    const timestamp = Date.now()
    const key = `${organizationId}/${folder}/${timestamp}_${filename}`

    const presignedPost = await generatePresignedPost(
      key,
      contentType,
      maxSize || 100 * 1024 * 1024, // 100MB default
      300 // 5 minutes
    )

    res.json({
      uploadUrl: presignedPost.url,
      fields: presignedPost.fields,
      key
    })
  } catch (error) {
    console.error('Get upload URL error:', error)
    res.status(500).json({ error: 'Failed to generate upload URL' })
  }
}

/**
 * List documents with filtering
 */
export const listDocuments = async (req: MultiTenantRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    const {
      page = 1,
      limit = 20,
      projectId,
      taskId,
      type,
      category,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    const skip = (Number(page) - 1) * Number(limit)

    const where: any = { organizationId, deletedAt: null }

    if (projectId) where.projectId = projectId
    if (taskId) where.taskId = taskId
    if (type) where.type = type
    if (category) where.category = category

    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { originalName: { contains: String(search), mode: 'insensitive' } },
        { description: { contains: String(search), mode: 'insensitive' } }
      ]
    }

    // Check access permissions
    if (req.user?.organizationRole !== 'ORG_ADMIN' && req.user?.organizationRole !== 'PROJECT_LEAD') {
      where.OR = [
        { uploadedById: req.user?.id },
        { isPublic: true },
        { 
          project: {
            members: {
              some: { userId: req.user?.id }
            }
          }
        }
      ]
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          uploadedBy: {
            select: {
              id: true,
              email: true,
              name: true,
              avatar: true
            }
          },
          project: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          task: {
            select: {
              id: true,
              title: true
            }
          },
          _count: {
            select: {
              versions: true,
              documentComments: true
            }
          }
        },
        skip,
        take: Number(limit),
        orderBy: { [String(sortBy)]: sortOrder }
      }),
      prisma.document.count({ where })
    ])

    res.json({
      documents,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('List documents error:', error)
    res.status(500).json({ error: 'Failed to list documents' })
  }
}

/**
 * Get document details with download URL
 */
export const getDocument = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { id } = req.params
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    const document = await prisma.document.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        task: {
          select: {
            id: true,
            title: true
          }
        },
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 5
        }
      }
    })

    if (!document) {
      return res.status(404).json({ error: 'Document not found' })
    }

    // Check access permissions
    const hasAccess = document.isPublic ||
                     document.uploadedById === req.user?.id ||
                     req.user?.organizationRole === 'ORG_ADMIN' ||
                     req.user?.organizationRole === 'PROJECT_LEAD'

    if (!hasAccess && document.projectId) {
      const projectMember = await prisma.projectMember.findFirst({
        where: {
          projectId: document.projectId,
          userId: req.user?.id
        }
      })
      
      if (!projectMember) {
        return res.status(403).json({ error: 'No access to this document' })
      }
    }

    // Generate download URL for private files
    let downloadUrl = document.url
    if (!document.isPublic && document.path) {
      downloadUrl = await getSignedUrl(document.path, 3600) // 1 hour expiry
    }

    res.json({
      ...document,
      downloadUrl
    })
  } catch (error) {
    console.error('Get document error:', error)
    res.status(500).json({ error: 'Failed to get document' })
  }
}

/**
 * Delete document
 */
export const deleteDocument = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { id } = req.params
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    const document = await prisma.document.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null
      }
    })

    if (!document) {
      return res.status(404).json({ error: 'Document not found' })
    }

    // Check permissions
    const canDelete = document.uploadedById === req.user?.id ||
                     req.user?.organizationRole === 'ORG_ADMIN' ||
                     req.user?.organizationRole === 'PROJECT_LEAD'

    if (!canDelete) {
      return res.status(403).json({ error: 'No permission to delete this document' })
    }

    // Soft delete in database
    await prisma.document.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    // Delete from S3 (async)
    if (document.path) {
      deleteFromS3(document.path).catch(err => {
        console.error('Failed to delete from S3:', err)
      })
    }

    // Update storage usage
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        usedStorage: {
          decrement: Math.ceil(document.size / (1024 * 1024))
        }
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: req.user!.id,
        action: 'delete',
        resource: 'document',
        resourceId: id,
        oldValues: { name: document.name, size: document.size }
      }
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Delete document error:', error)
    res.status(500).json({ error: 'Failed to delete document' })
  }
}

/**
 * Get storage statistics
 */
export const getStorageStats = async (req: MultiTenantRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    const [
      totalFiles,
      totalSize,
      typeDistribution,
      recentFiles
    ] = await Promise.all([
      prisma.document.count({
        where: { organizationId, deletedAt: null }
      }),
      prisma.document.aggregate({
        where: { organizationId, deletedAt: null },
        _sum: { size: true }
      }),
      prisma.document.groupBy({
        by: ['type'],
        where: { organizationId, deletedAt: null },
        _count: true,
        _sum: { size: true }
      }),
      prisma.document.findMany({
        where: { organizationId, deletedAt: null },
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ])

    const limits = req.organization?.limits
    const usedStorageMB = Math.ceil((totalSize._sum.size || 0) / (1024 * 1024))

    res.json({
      totalFiles,
      totalSize: totalSize._sum.size || 0,
      usedStorageMB,
      maxStorageMB: limits?.maxStorage || 0,
      availableStorageMB: (limits?.maxStorage || 0) - usedStorageMB,
      typeDistribution: typeDistribution.map(t => ({
        type: t.type,
        count: t._count,
        size: t._sum.size || 0
      })),
      recentFiles
    })
  } catch (error) {
    console.error('Get storage stats error:', error)
    res.status(500).json({ error: 'Failed to get storage statistics' })
  }
}

/**
 * Helper function to determine document type from MIME type
 */
function getDocumentType(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'IMAGE'
  if (mimeType.startsWith('video/')) return 'VIDEO'
  if (mimeType === 'application/pdf') return 'PDF'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'SPREADSHEET'
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'PRESENTATION'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'DOCUMENT'
  if (mimeType.includes('dwg') || mimeType.includes('dxf')) return 'DRAWING'
  if (mimeType.startsWith('text/')) return 'DOCUMENT'
  return 'OTHER'
}