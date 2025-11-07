import { S3 } from 'aws-sdk';
import multer from 'multer';
import multerS3 from 'multer-s3';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Storage configuration
interface StorageConfig {
  type: 'local' | 's3' | 'azure';
  local?: {
    uploadDir: string;
    publicPath: string;
  };
  s3?: {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    cloudFrontUrl?: string;
  };
  azure?: {
    connectionString: string;
    containerName: string;
  };
}

// File validation configuration
interface FileValidation {
  maxSize: number; // bytes
  allowedTypes: string[];
  allowedExtensions: string[];
  scanForVirus?: boolean;
}

class StorageService {
  private s3Client: S3 | null = null;
  private config: StorageConfig;
  private validation: FileValidation;

  constructor() {
    this.config = this.loadConfig();
    this.validation = this.loadValidation();
    
    if (this.config.type === 's3' && this.config.s3) {
      this.s3Client = new S3({
        region: this.config.s3.region,
        accessKeyId: this.config.s3.accessKeyId,
        secretAccessKey: this.config.s3.secretAccessKey
      });
    }
  }

  private loadConfig(): StorageConfig {
    const type = (process.env.STORAGE_TYPE || 'local') as StorageConfig['type'];
    
    const config: StorageConfig = { type };
    
    if (type === 'local') {
      config.local = {
        uploadDir: process.env.UPLOAD_DIR || './uploads',
        publicPath: process.env.PUBLIC_PATH || '/uploads'
      };
    } else if (type === 's3') {
      config.s3 = {
        bucket: process.env.AWS_S3_BUCKET || '',
        region: process.env.AWS_REGION || 'us-east-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        cloudFrontUrl: process.env.AWS_CLOUDFRONT_URL
      };
    }
    
    return config;
  }

  private loadValidation(): FileValidation {
    return {
      maxSize: parseInt(process.env.MAX_FILE_SIZE || '104857600'), // 100MB default
      allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,application/pdf').split(','),
      allowedExtensions: (process.env.ALLOWED_FILE_EXTENSIONS || '.jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.dwg,.dxf,.skp,.rvt').split(','),
      scanForVirus: process.env.SCAN_FOR_VIRUS === 'true'
    };
  }

  /**
   * Create multer upload middleware
   */
  createUploadMiddleware(options?: {
    fieldName?: string;
    maxFiles?: number;
    fileFilter?: (file: Express.Multer.File) => boolean;
  }) {
    const fieldName = options?.fieldName || 'file';
    const maxFiles = options?.maxFiles || 10;

    if (this.config.type === 's3' && this.s3Client && this.config.s3) {
      // S3 Storage
      return multer({
        storage: multerS3({
          s3: this.s3Client,
          bucket: this.config.s3.bucket,
          acl: 'private',
          contentType: multerS3.AUTO_CONTENT_TYPE,
          key: (req, file, cb) => {
            const uniqueName = this.generateUniqueFileName(file.originalname);
            const organizationId = (req as any).user?.organizationId || 'unknown';
            const key = `${organizationId}/${uniqueName}`;
            cb(null, key);
          }
        }),
        limits: {
          fileSize: this.validation.maxSize,
          files: maxFiles
        },
        fileFilter: (req, file, cb) => {
          if (!this.validateFile(file)) {
            cb(new Error('Invalid file type or extension'));
          } else if (options?.fileFilter && !options.fileFilter(file)) {
            cb(new Error('File rejected by custom filter'));
          } else {
            cb(null, true);
          }
        }
      }).array(fieldName, maxFiles);
    } else {
      // Local Storage
      return multer({
        storage: multer.diskStorage({
          destination: async (req, file, cb) => {
            const organizationId = (req as any).user?.organizationId || 'unknown';
            const uploadPath = path.join(this.config.local!.uploadDir, organizationId);
            
            try {
              await fs.mkdir(uploadPath, { recursive: true });
              cb(null, uploadPath);
            } catch (error: any) {
              cb(error, uploadPath);
            }
          },
          filename: (req, file, cb) => {
            const uniqueName = this.generateUniqueFileName(file.originalname);
            cb(null, uniqueName);
          }
        }),
        limits: {
          fileSize: this.validation.maxSize,
          files: maxFiles
        },
        fileFilter: (req, file, cb) => {
          if (!this.validateFile(file)) {
            cb(new Error('Invalid file type or extension'));
          } else if (options?.fileFilter && !options.fileFilter(file)) {
            cb(new Error('File rejected by custom filter'));
          } else {
            cb(null, true);
          }
        }
      }).array(fieldName, maxFiles);
    }
  }

  /**
   * Upload file with chunking support
   */
  async uploadChunked(
    chunk: Buffer,
    metadata: {
      fileName: string;
      chunkIndex: number;
      totalChunks: number;
      uploadId: string;
      organizationId: string;
    }
  ): Promise<{ completed: boolean; url?: string }> {
    const chunkDir = path.join(this.config.local!.uploadDir, 'chunks', metadata.uploadId);
    await fs.mkdir(chunkDir, { recursive: true });
    
    // Save chunk
    const chunkPath = path.join(chunkDir, `chunk_${metadata.chunkIndex}`);
    await fs.writeFile(chunkPath, chunk);
    
    // Check if all chunks are uploaded
    const files = await fs.readdir(chunkDir);
    if (files.length === metadata.totalChunks) {
      // Combine chunks
      const finalPath = path.join(
        this.config.local!.uploadDir,
        metadata.organizationId,
        this.generateUniqueFileName(metadata.fileName)
      );
      
      await fs.mkdir(path.dirname(finalPath), { recursive: true });
      
      const writeStream = require('fs').createWriteStream(finalPath);
      
      for (let i = 0; i < metadata.totalChunks; i++) {
        const chunkData = await fs.readFile(path.join(chunkDir, `chunk_${i}`));
        writeStream.write(chunkData);
      }
      
      writeStream.end();
      
      // Clean up chunks
      await fs.rm(chunkDir, { recursive: true });
      
      // Generate URL
      const url = await this.getFileUrl(finalPath);
      
      return { completed: true, url };
    }
    
    return { completed: false };
  }

  /**
   * Process image (resize, optimize)
   */
  async processImage(
    filePath: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'jpeg' | 'png' | 'webp';
      thumbnail?: boolean;
    }
  ): Promise<string> {
    const outputPath = filePath.replace(
      path.extname(filePath),
      `_processed.${options.format || 'jpeg'}`
    );
    
    let pipeline = sharp(filePath);
    
    // Resize if dimensions provided
    if (options.width || options.height) {
      pipeline = pipeline.resize(options.width, options.height, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }
    
    // Convert format
    if (options.format) {
      if (options.format === 'jpeg') {
        pipeline = pipeline.jpeg({ quality: options.quality || 85 });
      } else if (options.format === 'png') {
        pipeline = pipeline.png({ quality: options.quality || 90 });
      } else if (options.format === 'webp') {
        pipeline = pipeline.webp({ quality: options.quality || 85 });
      }
    }
    
    await pipeline.toFile(outputPath);
    
    // Generate thumbnail if requested
    if (options.thumbnail) {
      const thumbnailPath = filePath.replace(
        path.extname(filePath),
        '_thumb.jpeg'
      );
      
      await sharp(filePath)
        .resize(200, 200, { fit: 'cover' })
        .jpeg({ quality: 70 })
        .toFile(thumbnailPath);
    }
    
    return outputPath;
  }

  /**
   * Get signed URL for secure file access
   */
  async getSignedUrl(
    fileKey: string,
    expiresIn: number = 3600
  ): Promise<string> {
    if (this.config.type === 's3' && this.s3Client && this.config.s3) {
      const params = {
        Bucket: this.config.s3.bucket,
        Key: fileKey,
        Expires: expiresIn
      };
      
      return this.s3Client.getSignedUrl('getObject', params);
    } else {
      // For local storage, return direct URL
      return this.getFileUrl(fileKey);
    }
  }

  /**
   * Delete file
   */
  async deleteFile(fileKey: string): Promise<void> {
    if (this.config.type === 's3' && this.s3Client && this.config.s3) {
      await this.s3Client.deleteObject({
        Bucket: this.config.s3.bucket,
        Key: fileKey
      }).promise();
    } else {
      const filePath = path.join(this.config.local!.uploadDir, fileKey);
      await fs.unlink(filePath);
    }
  }

  /**
   * Copy file
   */
  async copyFile(sourceKey: string, destKey: string): Promise<string> {
    if (this.config.type === 's3' && this.s3Client && this.config.s3) {
      await this.s3Client.copyObject({
        Bucket: this.config.s3.bucket,
        CopySource: `${this.config.s3.bucket}/${sourceKey}`,
        Key: destKey
      }).promise();
      
      return destKey;
    } else {
      const sourcePath = path.join(this.config.local!.uploadDir, sourceKey);
      const destPath = path.join(this.config.local!.uploadDir, destKey);
      
      await fs.mkdir(path.dirname(destPath), { recursive: true });
      await fs.copyFile(sourcePath, destPath);
      
      return destKey;
    }
  }

  /**
   * Check file exists
   */
  async fileExists(fileKey: string): Promise<boolean> {
    try {
      if (this.config.type === 's3' && this.s3Client && this.config.s3) {
        await this.s3Client.headObject({
          Bucket: this.config.s3.bucket,
          Key: fileKey
        }).promise();
        
        return true;
      } else {
        const filePath = path.join(this.config.local!.uploadDir, fileKey);
        await fs.access(filePath);
        return true;
      }
    } catch {
      return false;
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileKey: string): Promise<{
    size: number;
    contentType: string;
    lastModified: Date;
  }> {
    if (this.config.type === 's3' && this.s3Client && this.config.s3) {
      const result = await this.s3Client.headObject({
        Bucket: this.config.s3.bucket,
        Key: fileKey
      }).promise();
      
      return {
        size: result.ContentLength || 0,
        contentType: result.ContentType || 'application/octet-stream',
        lastModified: result.LastModified || new Date()
      };
    } else {
      const filePath = path.join(this.config.local!.uploadDir, fileKey);
      const stats = await fs.stat(filePath);
      
      return {
        size: stats.size,
        contentType: 'application/octet-stream', // Would need file-type package for accurate detection
        lastModified: stats.mtime
      };
    }
  }

  /**
   * Save file record to database
   */
  async saveFileRecord(fileData: {
    organizationId: string;
    projectId?: string;
    uploadedById: string;
    name: string;
    path: string;
    size: number;
    mimeType: string;
    category?: string;
  }) {
    return await prisma.file.create({
      data: {
        organizationId: fileData.organizationId,
        projectId: fileData.projectId,
        uploadedById: fileData.uploadedById,
        name: fileData.name,
        path: fileData.path,
        size: fileData.size,
        mimeType: fileData.mimeType,
        category: fileData.category || 'general',
        storageType: this.config.type
      }
    });
  }

  // Helper methods
  private validateFile(file: Express.Multer.File): boolean {
    const ext = path.extname(file.originalname).toLowerCase();
    
    // Check extension
    if (!this.validation.allowedExtensions.includes(ext)) {
      return false;
    }
    
    // Check MIME type
    if (!this.validation.allowedTypes.includes(file.mimetype)) {
      // Allow some flexibility for known issues
      if (ext === '.pdf' && file.mimetype === 'application/octet-stream') {
        return true;
      }
      return false;
    }
    
    return true;
  }

  private generateUniqueFileName(originalName: string): string {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, ext)
      .replace(/[^a-zA-Z0-9]/g, '-')
      .substring(0, 50);
    
    return `${timestamp}_${randomString}_${nameWithoutExt}${ext}`;
  }

  private async getFileUrl(filePath: string): Promise<string> {
    if (this.config.type === 's3' && this.config.s3?.cloudFrontUrl) {
      const key = path.relative(this.config.local!.uploadDir, filePath);
      return `${this.config.s3.cloudFrontUrl}/${key}`;
    } else {
      const relativePath = path.relative(this.config.local!.uploadDir, filePath);
      return `${this.config.local!.publicPath}/${relativePath.replace(/\\/g, '/')}`;
    }
  }

  /**
   * Get storage statistics for organization
   */
  async getStorageStats(organizationId: string): Promise<{
    totalSize: number;
    fileCount: number;
    byCategory: Record<string, { size: number; count: number }>;
  }> {
    const files = await prisma.file.findMany({
      where: { organizationId },
      select: { size: true, category: true }
    });

    const stats = {
      totalSize: 0,
      fileCount: files.length,
      byCategory: {} as Record<string, { size: number; count: number }>
    };

    files.forEach(file => {
      stats.totalSize += file.size;
      
      if (!stats.byCategory[file.category]) {
        stats.byCategory[file.category] = { size: 0, count: 0 };
      }
      
      stats.byCategory[file.category].size += file.size;
      stats.byCategory[file.category].count += 1;
    });

    return stats;
  }
}

export default new StorageService();