import { Response } from 'express'
import { prisma } from '../server'
import { MultiTenantRequest } from '../middleware/multi-tenant-auth'
import { uploadToS3, deleteFromS3, getPresignedUploadUrl, getPresignedDownloadUrl } from '../services/cloud-storage.service'
import fs from 'fs/promises'
import path from 'path'

/**
 * Upload file to local storage
 */
export const uploadFile = async (req: MultiTenantRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id
    const file = req.file

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    if (!file) {
      return res.status(400).json({ error: 'No file provided' })
    }

    // Save file metadata to database
    const document = await prisma.document.create({
      data: {
        name: file.originalname,
        originalName: file.originalname,
        path: file.path,
        size: file.size,
        mimeType: file.mimetype,
        organizationId,
        uploadedById: req.user?.id!,
        projectId: req.body.projectId || null,
        category: req.body.category || 'general'
      }
    })

    res.status(201).json(document)
  } catch (error) {
    console.error('Error uploading file:', error)
    res.status(500).json({ error: 'Failed to upload file' })
  }
}

/**
 * Upload file to cloud storage (S3)
 */
export const uploadToCloud = async (req: MultiTenantRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id
    const files = req.files as Express.Multer.File[] || (req.file ? [req.file] : [])

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    if (!files.length) {
      return res.status(400).json({ error: 'No files provided' })
    }

    const uploadedFiles = []

    for (const file of files) {
      try {
        // Upload to S3
        const result = await uploadToS3(file, {
          organizationId,
          projectId: req.body.projectId,
          folder: req.body.folder || 'documents'
        })

        // Save metadata to database
        const document = await prisma.document.create({
          data: {
            name: file.originalname,
            path: result.key,
            url: result.url,
            size: file.size,
            mimeType: file.mimetype,
            organizationId,
            uploadedBy: req.user?.id!,
            projectId: req.body.projectId || null,
            category: req.body.category || 'general',
            cloudProvider: 'AWS_S3'
          }
        })

        uploadedFiles.push(document)

        // Clean up temp file
        await fs.unlink(file.path).catch(console.error)
      } catch (error) {
        console.error(`Error uploading ${file.originalname}:`, error)
      }
    }

    res.status(201).json(uploadedFiles)
  } catch (error) {
    console.error('Error uploading to cloud:', error)
    res.status(500).json({ error: 'Failed to upload files' })
  }
}

/**
 * Get presigned URL for direct upload
 */
export const getPresignedUrl = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { filename, contentType } = req.body
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    const key = `organizations/${organizationId}/documents/${Date.now()}-${filename}`
    const url = await getPresignedUploadUrl(key, contentType)

    res.json({ url, key })
  } catch (error) {
    console.error('Error getting presigned URL:', error)
    res.status(500).json({ error: 'Failed to get upload URL' })
  }
}

/**
 * Get organization files
 */
export const getOrganizationFiles = async (req: MultiTenantRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id
    const { projectId, category, search } = req.query

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    const where: any = { organizationId }
    
    if (projectId) where.projectId = projectId
    if (category) where.category = category
    if (search) {
      where.name = {
        contains: search as string,
        mode: 'insensitive'
      }
    }

    const documents = await prisma.document.findMany({
      where,
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Generate download URLs for cloud files
    const documentsWithUrls = await Promise.all(
      documents.map(async (doc) => {
        if (doc.cloudProvider === 'AWS_S3' && doc.path) {
          const downloadUrl = await getPresignedDownloadUrl(doc.path)
          return { ...doc, downloadUrl }
        }
        return doc
      })
    )

    res.json(documentsWithUrls)
  } catch (error) {
    console.error('Error fetching files:', error)
    res.status(500).json({ error: 'Failed to fetch files' })
  }
}

/**
 * Delete file
 */
export const deleteFile = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { fileId } = req.params
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    // Get file details
    const document = await prisma.document.findFirst({
      where: {
        id: fileId,
        organizationId
      }
    })

    if (!document) {
      return res.status(404).json({ error: 'File not found' })
    }

    // Delete from cloud if applicable
    if (document.cloudProvider === 'AWS_S3' && document.path) {
      await deleteFromS3(document.path).catch(console.error)
    } else if (document.path) {
      // Delete local file
      await fs.unlink(document.path).catch(console.error)
    }

    // Delete from database
    await prisma.document.delete({
      where: { id: fileId }
    })

    res.status(204).send()
  } catch (error) {
    console.error('Error deleting file:', error)
    res.status(500).json({ error: 'Failed to delete file' })
  }
}

/**
 * Update file metadata
 */
export const updateFileMetadata = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { fileId } = req.params
    const { name, category, tags } = req.body
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    const document = await prisma.document.update({
      where: {
        id: fileId,
        organizationId
      },
      data: {
        name,
        category,
        tags
      }
    })

    res.json(document)
  } catch (error) {
    console.error('Error updating file metadata:', error)
    res.status(500).json({ error: 'Failed to update metadata' })
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

    // Get total storage used
    const stats = await prisma.document.aggregate({
      where: { organizationId },
      _sum: { size: true },
      _count: true
    })

    // Get storage by category
    const byCategory = await prisma.document.groupBy({
      by: ['category'],
      where: { organizationId },
      _sum: { size: true },
      _count: true
    })

    // Get organization's storage limit
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        plan: {
          select: { maxStorage: true }
        }
      }
    })

    const totalUsed = stats._sum.size || 0
    const maxStorage = (org?.plan?.maxStorage || 5120) * 1024 * 1024 // Convert MB to bytes

    res.json({
      totalUsed,
      maxStorage,
      percentUsed: (totalUsed / maxStorage) * 100,
      fileCount: stats._count,
      byCategory: byCategory.map(cat => ({
        category: cat.category,
        size: cat._sum.size || 0,
        count: cat._count
      }))
    })
  } catch (error) {
    console.error('Error fetching storage stats:', error)
    res.status(500).json({ error: 'Failed to fetch storage stats' })
  }
}