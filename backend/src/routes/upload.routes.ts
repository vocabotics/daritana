import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import storageService from '../services/storage.service';
import { prisma } from '../server';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Single/Multiple file upload
router.post('/upload',
  storageService.createUploadMiddleware({
    fieldName: 'files',
    maxFiles: 10
  }),
  async (req: any, res: any) => {
    try {
      const files = req.files as Express.Multer.File[];
      const { projectId, category } = req.body;
      const organizationId = req.user.organizationId;
      const uploadedById = req.user.id;

      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const uploadedFiles = [];

      for (const file of files) {
        // Save file record to database
        const fileRecord = await storageService.saveFileRecord({
          organizationId,
          projectId,
          uploadedById,
          name: file.originalname,
          path: file.path || file.key || file.filename,
          size: file.size,
          mimeType: file.mimetype,
          category
        });

        // Process image if applicable
        if (file.mimetype.startsWith('image/')) {
          try {
            await storageService.processImage(file.path || file.key, {
              width: 1920,
              height: 1080,
              quality: 85,
              format: 'jpeg',
              thumbnail: true
            });
          } catch (error) {
            console.error('Image processing error:', error);
          }
        }

        uploadedFiles.push({
          id: fileRecord.id,
          name: fileRecord.name,
          size: fileRecord.size,
          mimeType: fileRecord.mimeType,
          url: await storageService.getSignedUrl(fileRecord.path),
          uploadedAt: fileRecord.createdAt
        });
      }

      // Update organization storage usage
      const storageStats = await storageService.getStorageStats(organizationId);
      await prisma.organization.update({
        where: { id: organizationId },
        data: { usedStorage: Math.round(storageStats.totalSize / 1048576) } // Convert to MB
      });

      res.json({
        success: true,
        files: uploadedFiles,
        message: `${uploadedFiles.length} file(s) uploaded successfully`
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(500).json({ 
        error: 'File upload failed',
        message: error.message 
      });
    }
  }
);

// Chunked upload initialization
router.post('/upload/init',
  body('fileName').notEmpty(),
  body('fileSize').isInt({ min: 1 }),
  body('totalChunks').isInt({ min: 1 }),
  validate,
  async (req: any, res: any) => {
    try {
      const { fileName, fileSize, totalChunks } = req.body;
      const organizationId = req.user.organizationId;

      // Check storage limits
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        include: { plan: true }
      });

      if (!org) {
        return res.status(404).json({ error: 'Organization not found' });
      }

      const maxStorage = (org.plan?.maxStorage || 5120) * 1048576; // Convert MB to bytes
      const currentUsage = (org.usedStorage || 0) * 1048576;
      
      if (currentUsage + fileSize > maxStorage) {
        return res.status(403).json({ 
          error: 'Storage limit exceeded',
          limit: maxStorage,
          current: currentUsage,
          requested: fileSize
        });
      }

      // Generate upload ID
      const uploadId = crypto.randomBytes(16).toString('hex');

      // Create upload session
      await prisma.uploadSession.create({
        data: {
          id: uploadId,
          organizationId,
          fileName,
          fileSize,
          totalChunks,
          uploadedChunks: 0,
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }
      });

      res.json({
        success: true,
        uploadId,
        chunkSize: 5 * 1024 * 1024, // 5MB chunks
        totalChunks
      });
    } catch (error: any) {
      console.error('Upload init error:', error);
      res.status(500).json({ 
        error: 'Failed to initialize upload',
        message: error.message 
      });
    }
  }
);

// Upload chunk
router.post('/upload/chunk',
  body('uploadId').notEmpty(),
  body('chunkIndex').isInt({ min: 0 }),
  validate,
  async (req: any, res: any) => {
    try {
      const { uploadId, chunkIndex } = req.body;
      const chunk = req.body.chunk; // Base64 encoded chunk
      const organizationId = req.user.organizationId;

      // Verify upload session
      const session = await prisma.uploadSession.findFirst({
        where: {
          id: uploadId,
          organizationId,
          status: 'PENDING'
        }
      });

      if (!session) {
        return res.status(404).json({ error: 'Upload session not found or expired' });
      }

      // Decode and save chunk
      const chunkBuffer = Buffer.from(chunk, 'base64');
      const result = await storageService.uploadChunked(chunkBuffer, {
        fileName: session.fileName,
        chunkIndex,
        totalChunks: session.totalChunks,
        uploadId,
        organizationId
      });

      // Update session
      await prisma.uploadSession.update({
        where: { id: uploadId },
        data: {
          uploadedChunks: session.uploadedChunks + 1,
          status: result.completed ? 'COMPLETED' : 'PENDING'
        }
      });

      if (result.completed) {
        // Save file record
        const fileRecord = await storageService.saveFileRecord({
          organizationId,
          uploadedById: req.user.id,
          name: session.fileName,
          path: result.url!,
          size: session.fileSize,
          mimeType: 'application/octet-stream', // Would need proper detection
          category: 'general'
        });

        res.json({
          success: true,
          completed: true,
          file: {
            id: fileRecord.id,
            name: fileRecord.name,
            url: result.url
          }
        });
      } else {
        res.json({
          success: true,
          completed: false,
          chunksUploaded: session.uploadedChunks + 1,
          totalChunks: session.totalChunks
        });
      }
    } catch (error: any) {
      console.error('Chunk upload error:', error);
      res.status(500).json({ 
        error: 'Chunk upload failed',
        message: error.message 
      });
    }
  }
);

// Get file by ID
router.get('/files/:fileId',
  param('fileId').isUUID(),
  validate,
  async (req: any, res: any) => {
    try {
      const { fileId } = req.params;
      const organizationId = req.user.organizationId;

      const file = await prisma.file.findFirst({
        where: {
          id: fileId,
          organizationId
        },
        include: {
          uploadedBy: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Get signed URL for secure access
      const url = await storageService.getSignedUrl(file.path);

      res.json({
        success: true,
        file: {
          ...file,
          url
        }
      });
    } catch (error: any) {
      console.error('Get file error:', error);
      res.status(500).json({ 
        error: 'Failed to get file',
        message: error.message 
      });
    }
  }
);

// Delete file
router.delete('/files/:fileId',
  param('fileId').isUUID(),
  validate,
  async (req: any, res: any) => {
    try {
      const { fileId } = req.params;
      const organizationId = req.user.organizationId;

      const file = await prisma.file.findFirst({
        where: {
          id: fileId,
          organizationId
        }
      });

      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Delete from storage
      await storageService.deleteFile(file.path);

      // Delete from database
      await prisma.file.delete({
        where: { id: fileId }
      });

      // Update storage usage
      await prisma.organization.update({
        where: { id: organizationId },
        data: {
          usedStorage: {
            decrement: Math.round(file.size / 1048576)
          }
        }
      });

      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } catch (error: any) {
      console.error('Delete file error:', error);
      res.status(500).json({ 
        error: 'Failed to delete file',
        message: error.message 
      });
    }
  }
);

// List files
router.get('/files',
  query('projectId').optional().isUUID(),
  query('category').optional(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  validate,
  async (req: any, res: any) => {
    try {
      const { projectId, category, limit = 20, offset = 0 } = req.query;
      const organizationId = req.user.organizationId;

      const where: any = { organizationId };
      if (projectId) where.projectId = projectId;
      if (category) where.category = category;

      const [files, total] = await Promise.all([
        prisma.file.findMany({
          where,
          include: {
            uploadedBy: {
              select: { id: true, name: true, email: true }
          },
          project: {
            select: { id: true, name: true }
          }
        },
        take: parseInt(limit),
        skip: parseInt(offset),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.file.count({ where })
      ]);

      // Get signed URLs
      const filesWithUrls = await Promise.all(
        files.map(async file => ({
          ...file,
          url: await storageService.getSignedUrl(file.path)
        }))
      );

      res.json({
        success: true,
        files: filesWithUrls,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error: any) {
      console.error('List files error:', error);
      res.status(500).json({ 
        error: 'Failed to list files',
        message: error.message 
      });
    }
  }
);

// Get storage statistics
router.get('/storage/stats',
  async (req: any, res: any) => {
    try {
      const organizationId = req.user.organizationId;

      const [org, stats] = await Promise.all([
        prisma.organization.findUnique({
          where: { id: organizationId },
          include: { plan: true }
        }),
        storageService.getStorageStats(organizationId)
      ]);

      if (!org) {
        return res.status(404).json({ error: 'Organization not found' });
      }

      const maxStorage = org.plan?.maxStorage || 5120; // MB
      const usedStorage = Math.round(stats.totalSize / 1048576); // Convert to MB
      const percentageUsed = (usedStorage / maxStorage) * 100;

      res.json({
        success: true,
        stats: {
          used: usedStorage,
          limit: maxStorage,
          percentageUsed: percentageUsed.toFixed(2),
          fileCount: stats.fileCount,
          byCategory: stats.byCategory
        }
      });
    } catch (error: any) {
      console.error('Storage stats error:', error);
      res.status(500).json({ 
        error: 'Failed to get storage statistics',
        message: error.message 
      });
    }
  }
);

// Create file version
router.post('/files/:fileId/versions',
  param('fileId').isUUID(),
  storageService.createUploadMiddleware({
    fieldName: 'file',
    maxFiles: 1
  }),
  async (req: any, res: any) => {
    try {
      const { fileId } = req.params;
      const file = req.files?.[0];
      const organizationId = req.user.organizationId;

      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Get original file
      const originalFile = await prisma.file.findFirst({
        where: {
          id: fileId,
          organizationId
        }
      });

      if (!originalFile) {
        return res.status(404).json({ error: 'Original file not found' });
      }

      // Create version
      const version = await prisma.fileVersion.create({
        data: {
          fileId,
          version: await getNextVersion(fileId),
          path: file.path || file.key || file.filename,
          size: file.size,
          uploadedById: req.user.id,
          comment: req.body.comment
        }
      });

      res.json({
        success: true,
        version: {
          id: version.id,
          version: version.version,
          uploadedAt: version.createdAt,
          url: await storageService.getSignedUrl(version.path)
        }
      });
    } catch (error: any) {
      console.error('Create version error:', error);
      res.status(500).json({ 
        error: 'Failed to create file version',
        message: error.message 
      });
    }
  }
);

// Helper function to get next version number
async function getNextVersion(fileId: string): Promise<number> {
  const latestVersion = await prisma.fileVersion.findFirst({
    where: { fileId },
    orderBy: { version: 'desc' }
  });
  return (latestVersion?.version || 0) + 1;
}

export default router;