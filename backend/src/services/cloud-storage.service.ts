import AWS from 'aws-sdk'
import { MulterRequest } from '../types/api.types'
import crypto from 'crypto'
import path from 'path'

// Initialize AWS SDK
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'ap-southeast-1'
})

const bucket = process.env.AWS_S3_BUCKET || 'daritana-files'

export interface UploadResult {
  key: string
  url: string
  size: number
  mimeType: string
  originalName: string
}

export interface CloudStorageOptions {
  folder?: string
  organizationId: string
  userId?: string
  makePublic?: boolean
}

/**
 * Upload file to S3
 */
export const uploadToS3 = async (
  file: Express.Multer.File,
  options: CloudStorageOptions
): Promise<UploadResult> => {
  try {
    const { folder = 'documents', organizationId, userId, makePublic = false } = options

    // Generate unique key
    const timestamp = Date.now()
    const randomString = crypto.randomBytes(8).toString('hex')
    const extension = path.extname(file.originalname)
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')
    
    const key = `${organizationId}/${folder}/${timestamp}_${randomString}_${sanitizedName}`

    // Upload parameters
    const uploadParams: AWS.S3.PutObjectRequest = {
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        originalName: file.originalname,
        organizationId,
        uploadedBy: userId || 'system',
        uploadedAt: new Date().toISOString()
      }
    }

    // Make public if specified
    if (makePublic) {
      uploadParams.ACL = 'public-read'
    }

    // Upload to S3
    const result = await s3.upload(uploadParams).promise()

    return {
      key,
      url: result.Location,
      size: file.size,
      mimeType: file.mimetype,
      originalName: file.originalname
    }
  } catch (error) {
    console.error('S3 upload error:', error)
    throw new Error('Failed to upload file to cloud storage')
  }
}

/**
 * Delete file from S3
 */
export const deleteFromS3 = async (key: string): Promise<void> => {
  try {
    await s3.deleteObject({
      Bucket: bucket,
      Key: key
    }).promise()
  } catch (error) {
    console.error('S3 delete error:', error)
    throw new Error('Failed to delete file from cloud storage')
  }
}

/**
 * Get signed URL for private file access
 */
export const getSignedUrl = async (
  key: string,
  expiresIn: number = 3600
): Promise<string> => {
  try {
    return await s3.getSignedUrlPromise('getObject', {
      Bucket: bucket,
      Key: key,
      Expires: expiresIn
    })
  } catch (error) {
    console.error('Get signed URL error:', error)
    throw new Error('Failed to generate signed URL')
  }
}

/**
 * Copy file to new location
 */
export const copyFile = async (
  sourceKey: string,
  destinationKey: string,
  makePublic: boolean = false
): Promise<string> => {
  try {
    const copyParams: AWS.S3.CopyObjectRequest = {
      Bucket: bucket,
      CopySource: `${bucket}/${sourceKey}`,
      Key: destinationKey
    }

    if (makePublic) {
      copyParams.ACL = 'public-read'
    }

    const result = await s3.copyObject(copyParams).promise()
    
    return makePublic 
      ? `https://${bucket}.s3.${process.env.AWS_REGION || 'ap-southeast-1'}.amazonaws.com/${destinationKey}`
      : destinationKey
  } catch (error) {
    console.error('S3 copy error:', error)
    throw new Error('Failed to copy file')
  }
}

/**
 * List files in folder
 */
export const listFiles = async (
  prefix: string,
  maxKeys: number = 1000
): Promise<AWS.S3.Object[]> => {
  try {
    const result = await s3.listObjectsV2({
      Bucket: bucket,
      Prefix: prefix,
      MaxKeys: maxKeys
    }).promise()

    return result.Contents || []
  } catch (error) {
    console.error('S3 list error:', error)
    throw new Error('Failed to list files')
  }
}

/**
 * Get file metadata
 */
export const getFileMetadata = async (key: string): Promise<AWS.S3.HeadObjectOutput> => {
  try {
    return await s3.headObject({
      Bucket: bucket,
      Key: key
    }).promise()
  } catch (error) {
    console.error('Get metadata error:', error)
    throw new Error('Failed to get file metadata')
  }
}

/**
 * Generate presigned POST URL for direct uploads
 */
export const generatePresignedPost = async (
  key: string,
  contentType: string,
  maxSize: number = 100 * 1024 * 1024, // 100MB default
  expiresIn: number = 300 // 5 minutes
): Promise<AWS.S3.PresignedPost> => {
  try {
    return await s3.createPresignedPost({
      Bucket: bucket,
      Fields: {
        key,
        'Content-Type': contentType
      },
      Conditions: [
        ['content-length-range', 0, maxSize],
        ['eq', '$Content-Type', contentType]
      ],
      Expires: expiresIn
    })
  } catch (error) {
    console.error('Generate presigned POST error:', error)
    throw new Error('Failed to generate presigned upload URL')
  }
}

/**
 * Check if file exists
 */
export const fileExists = async (key: string): Promise<boolean> => {
  try {
    await s3.headObject({
      Bucket: bucket,
      Key: key
    }).promise()
    return true
  } catch (error: any) {
    if (error.code === 'NotFound') {
      return false
    }
    throw error
  }
}

/**
 * Calculate storage usage for organization
 */
export const calculateStorageUsage = async (organizationId: string): Promise<number> => {
  try {
    const objects = await listFiles(`${organizationId}/`)
    return objects.reduce((total, obj) => total + (obj.Size || 0), 0)
  } catch (error) {
    console.error('Calculate storage usage error:', error)
    return 0
  }
}

/**
 * Cleanup old files (for cleanup jobs)
 */
export const cleanupOldFiles = async (
  organizationId: string,
  olderThanDays: number = 30
): Promise<number> => {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    const objects = await listFiles(`${organizationId}/temp/`)
    const oldFiles = objects.filter(obj => 
      obj.LastModified && obj.LastModified < cutoffDate
    )

    if (oldFiles.length === 0) {
      return 0
    }

    // Delete in batches
    const deleteParams: AWS.S3.DeleteObjectsRequest = {
      Bucket: bucket,
      Delete: {
        Objects: oldFiles.map(obj => ({ Key: obj.Key! }))
      }
    }

    await s3.deleteObjects(deleteParams).promise()
    return oldFiles.length
  } catch (error) {
    console.error('Cleanup old files error:', error)
    return 0
  }
}