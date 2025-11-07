import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import winston from 'winston';
import { Request } from 'express';
import { FileUpload } from '../types';

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'file' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// File upload configuration
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB default

// Ensure upload directory exists
const ensureUploadDir = async (subDir?: string): Promise<string> => {
  const fullPath = subDir ? path.join(uploadDir, subDir) : uploadDir;
  try {
    await fs.access(fullPath);
  } catch {
    await fs.mkdir(fullPath, { recursive: true });
  }
  return fullPath;
};

// Generate unique filename
const generateUniqueFilename = (originalName: string): string => {
  const ext = path.extname(originalName);
  const name = path.basename(originalName, ext);
  const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
  return `${name}-${uniqueSuffix}${ext}`;
};

// File filter for different upload types
const fileFilters = {
  images: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WebP, and SVG images are allowed.'));
    }
  },
  
  documents: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Word, Excel, TXT, and CSV files are allowed.'));
    }
  },
  
  all: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Accept all file types but check size
    cb(null, true);
  }
};

// Storage configuration
const diskStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      // Determine subdirectory based on file type or request
      let subDir = 'general';
      if (file.mimetype.startsWith('image/')) {
        subDir = 'images';
      } else if (file.mimetype.startsWith('application/')) {
        subDir = 'documents';
      }
      
      const dir = await ensureUploadDir(subDir);
      cb(null, dir);
    } catch (error) {
      cb(error as Error, '');
    }
  },
  filename: (req, file, cb) => {
    const uniqueFilename = generateUniqueFilename(file.originalname);
    cb(null, uniqueFilename);
  }
});

// Create multer upload instances
export const uploadImage = multer({
  storage: diskStorage,
  limits: { fileSize: maxFileSize },
  fileFilter: fileFilters.images
});

export const uploadDocument = multer({
  storage: diskStorage,
  limits: { fileSize: maxFileSize },
  fileFilter: fileFilters.documents
});

export const uploadAny = multer({
  storage: diskStorage,
  limits: { fileSize: maxFileSize },
  fileFilter: fileFilters.all
});

// Memory storage for temporary processing
export const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxFileSize }
});

// Delete file
export const deleteFile = async (filePath: string): Promise<boolean> => {
  try {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
    await fs.unlink(fullPath);
    logger.info('File deleted successfully', { filePath: fullPath });
    return true;
  } catch (error) {
    logger.error('Failed to delete file', { error, filePath });
    return false;
  }
};

// Move file
export const moveFile = async (oldPath: string, newPath: string): Promise<boolean> => {
  try {
    const fullOldPath = path.isAbsolute(oldPath) ? oldPath : path.join(process.cwd(), oldPath);
    const fullNewPath = path.isAbsolute(newPath) ? newPath : path.join(process.cwd(), newPath);
    
    // Ensure destination directory exists
    await fs.mkdir(path.dirname(fullNewPath), { recursive: true });
    
    // Move file
    await fs.rename(fullOldPath, fullNewPath);
    logger.info('File moved successfully', { from: fullOldPath, to: fullNewPath });
    return true;
  } catch (error) {
    logger.error('Failed to move file', { error, oldPath, newPath });
    return false;
  }
};

// Copy file
export const copyFile = async (sourcePath: string, destPath: string): Promise<boolean> => {
  try {
    const fullSourcePath = path.isAbsolute(sourcePath) ? sourcePath : path.join(process.cwd(), sourcePath);
    const fullDestPath = path.isAbsolute(destPath) ? destPath : path.join(process.cwd(), destPath);
    
    // Ensure destination directory exists
    await fs.mkdir(path.dirname(fullDestPath), { recursive: true });
    
    // Copy file
    await fs.copyFile(fullSourcePath, fullDestPath);
    logger.info('File copied successfully', { from: fullSourcePath, to: fullDestPath });
    return true;
  } catch (error) {
    logger.error('Failed to copy file', { error, sourcePath, destPath });
    return false;
  }
};

// Get file info
export const getFileInfo = async (filePath: string): Promise<{
  size: number;
  created: Date;
  modified: Date;
  isFile: boolean;
} | null> => {
  try {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
    const stats = await fs.stat(fullPath);
    
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      isFile: stats.isFile()
    };
  } catch (error) {
    logger.error('Failed to get file info', { error, filePath });
    return null;
  }
};

// Clean up old files
export const cleanupOldFiles = async (directoryPath: string, maxAgeInDays: number): Promise<number> => {
  let deletedCount = 0;
  
  try {
    const fullPath = path.isAbsolute(directoryPath) ? directoryPath : path.join(process.cwd(), directoryPath);
    const files = await fs.readdir(fullPath);
    const maxAgeMs = maxAgeInDays * 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    for (const file of files) {
      const filePath = path.join(fullPath, file);
      const stats = await fs.stat(filePath);
      
      if (stats.isFile() && (now - stats.mtime.getTime()) > maxAgeMs) {
        await fs.unlink(filePath);
        deletedCount++;
        logger.info('Deleted old file', { filePath, age: now - stats.mtime.getTime() });
      }
    }
    
    logger.info('Cleanup completed', { directoryPath, deletedCount });
  } catch (error) {
    logger.error('Failed to cleanup old files', { error, directoryPath });
  }
  
  return deletedCount;
};

// Generate file URL
export const generateFileUrl = (filePath: string): string => {
  const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
  const relativePath = filePath.replace(/\\/g, '/').replace(process.cwd().replace(/\\/g, '/'), '');
  return `${baseUrl}/files${relativePath}`;
};

// Validate file size
export const validateFileSize = (size: number, maxSizeMB: number = 10): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return size <= maxSizeBytes;
};

// Get file extension
export const getFileExtension = (filename: string): string => {
  return path.extname(filename).toLowerCase();
};

// Check if file exists
export const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
    await fs.access(fullPath);
    return true;
  } catch {
    return false;
  }
};

// Create directory if not exists
export const ensureDirectory = async (dirPath: string): Promise<void> => {
  const fullPath = path.isAbsolute(dirPath) ? dirPath : path.join(process.cwd(), dirPath);
  await fs.mkdir(fullPath, { recursive: true });
};

// List files in directory
export const listFiles = async (dirPath: string, extensions?: string[]): Promise<string[]> => {
  try {
    const fullPath = path.isAbsolute(dirPath) ? dirPath : path.join(process.cwd(), dirPath);
    const files = await fs.readdir(fullPath);
    
    if (extensions && extensions.length > 0) {
      return files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return extensions.includes(ext);
      });
    }
    
    return files;
  } catch (error) {
    logger.error('Failed to list files', { error, dirPath });
    return [];
  }
};

// Calculate directory size
export const getDirectorySize = async (dirPath: string): Promise<number> => {
  let totalSize = 0;
  
  try {
    const fullPath = path.isAbsolute(dirPath) ? dirPath : path.join(process.cwd(), dirPath);
    const files = await fs.readdir(fullPath);
    
    for (const file of files) {
      const filePath = path.join(fullPath, file);
      const stats = await fs.stat(filePath);
      
      if (stats.isFile()) {
        totalSize += stats.size;
      } else if (stats.isDirectory()) {
        totalSize += await getDirectorySize(filePath);
      }
    }
  } catch (error) {
    logger.error('Failed to calculate directory size', { error, dirPath });
  }
  
  return totalSize;
};