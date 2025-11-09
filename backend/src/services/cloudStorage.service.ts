/**
 * Cloud Storage Service
 * AWS S3 integration with fallback to local storage
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createReadStream, createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

interface UploadOptions {
  file: Buffer | string;
  key: string;
  contentType?: string;
  acl?: 'private' | 'public-read';
  metadata?: Record<string, string>;
}

interface StorageFile {
  key: string;
  url: string;
  size: number;
  contentType: string;
  uploadedAt: Date;
}

class CloudStorageService {
  private s3Client: S3Client | null = null;
  private bucket: string;
  private region: string;
  private useS3: boolean;
  private localStoragePath: string;

  constructor() {
    this.bucket = process.env.AWS_S3_BUCKET || 'daritana-files';
    this.region = process.env.AWS_REGION || 'ap-southeast-1';
    this.localStoragePath = process.env.UPLOAD_DIRECTORY || './uploads';
    this.useS3 = !!(
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_S3_BUCKET
    );

    if (this.useS3) {
      this.s3Client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      });
    } else {
      // Ensure local storage directory exists
      if (!existsSync(this.localStoragePath)) {
        mkdirSync(this.localStoragePath, { recursive: true });
      }
    }
  }

  async upload(options: UploadOptions): Promise<StorageFile> {
    if (this.useS3 && this.s3Client) {
      return this.uploadToS3(options);
    } else {
      return this.uploadToLocal(options);
    }
  }

  private async uploadToS3(options: UploadOptions): Promise<StorageFile> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: options.key,
      Body: options.file,
      ContentType: options.contentType,
      ACL: options.acl || 'private',
      Metadata: options.metadata,
    });

    await this.s3Client!.send(command);

    const url = process.env.AWS_CLOUDFRONT_DOMAIN
      ? `https://${process.env.AWS_CLOUDFRONT_DOMAIN}/${options.key}`
      : `https://${this.bucket}.s3.${this.region}.amazonaws.com/${options.key}`;

    return {
      key: options.key,
      url,
      size: Buffer.byteLength(options.file),
      contentType: options.contentType || 'application/octet-stream',
      uploadedAt: new Date(),
    };
  }

  private async uploadToLocal(options: UploadOptions): Promise<StorageFile> {
    const filePath = join(this.localStoragePath, options.key);
    const fileBuffer = typeof options.file === 'string' ? Buffer.from(options.file) : options.file;

    // Create directory if it doesn't exist
    const dir = join(this.localStoragePath, options.key.split('/').slice(0, -1).join('/'));
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // Write file
    const writeStream = createWriteStream(filePath);
    writeStream.write(fileBuffer);
    writeStream.end();

    const baseUrl = process.env.VITE_API_URL || 'http://localhost:7001';
    return {
      key: options.key,
      url: `${baseUrl}/uploads/${options.key}`,
      size: fileBuffer.length,
      contentType: options.contentType || 'application/octet-stream',
      uploadedAt: new Date(),
    };
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (this.useS3 && this.s3Client) {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      return getSignedUrl(this.s3Client, command, { expiresIn });
    } else {
      // For local storage, return direct URL
      const baseUrl = process.env.VITE_API_URL || 'http://localhost:7001';
      return `${baseUrl}/uploads/${key}`;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      if (this.useS3 && this.s3Client) {
        const command = new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        });
        await this.s3Client.send(command);
      } else {
        const filePath = join(this.localStoragePath, key);
        if (existsSync(filePath)) {
          const fs = await import('fs/promises');
          await fs.unlink(filePath);
        }
      }
      return true;
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    }
  }

  async list(prefix: string = ''): Promise<StorageFile[]> {
    if (this.useS3 && this.s3Client) {
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
      });
      const response = await this.s3Client.send(command);

      return (response.Contents || []).map((item) => ({
        key: item.Key!,
        url: `https://${this.bucket}.s3.${this.region}.amazonaws.com/${item.Key}`,
        size: item.Size || 0,
        contentType: 'application/octet-stream',
        uploadedAt: item.LastModified || new Date(),
      }));
    } else {
      // List local files
      const fs = await import('fs/promises');
      const path = join(this.localStoragePath, prefix);

      if (!existsSync(path)) {
        return [];
      }

      const files = await fs.readdir(path, { recursive: true });
      const baseUrl = process.env.VITE_API_URL || 'http://localhost:7001';

      return Promise.all(
        files.map(async (file) => {
          const fullPath = join(path, file.toString());
          const stats = await fs.stat(fullPath);
          return {
            key: join(prefix, file.toString()),
            url: `${baseUrl}/uploads/${join(prefix, file.toString())}`,
            size: stats.size,
            contentType: 'application/octet-stream',
            uploadedAt: stats.mtime,
          };
        })
      );
    }
  }

  // Helper method to generate unique key
  generateKey(originalFilename: string, organizationId: string): string {
    const ext = originalFilename.split('.').pop();
    const timestamp = Date.now();
    const uuid = uuidv4().split('-')[0];
    return `${organizationId}/${timestamp}-${uuid}.${ext}`;
  }
}

export const cloudStorageService = new CloudStorageService();
export default cloudStorageService;
