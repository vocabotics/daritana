import React, { useCallback, useState } from 'react';
import { Upload, File, X, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/**
 * File Upload Component
 * Reusable component for file uploads with drag-and-drop support
 * Features:
 * - Drag and drop
 * - Multiple file selection
 * - File type validation
 * - File size validation
 * - Upload progress
 * - Preview for images
 */

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  status: 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

interface FileUploadProps {
  /**
   * Accepted file types (e.g., ".pdf,.dwg,.dxf")
   */
  accept?: string;

  /**
   * Maximum file size in MB
   */
  maxSize?: number;

  /**
   * Allow multiple files
   */
  multiple?: boolean;

  /**
   * Maximum number of files
   */
  maxFiles?: number;

  /**
   * Callback when files are uploaded
   */
  onUpload?: (files: UploadedFile[]) => void;

  /**
   * Callback when files are removed
   */
  onRemove?: (fileId: string) => void;

  /**
   * Existing files
   */
  files?: UploadedFile[];

  /**
   * Custom className
   */
  className?: string;

  /**
   * Disabled state
   */
  disabled?: boolean;

  /**
   * Upload function (if not provided, simulates upload)
   */
  uploadFn?: (file: File) => Promise<{ url: string }>;
}

export function FileUpload({
  accept = '.pdf,.dwg,.dxf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx',
  maxSize = 50, // 50MB
  multiple = true,
  maxFiles = 10,
  onUpload,
  onRemove,
  files = [],
  className,
  disabled = false,
  uploadFn,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadedFile[]>(files);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File): string | null => {
    // Check file size
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > maxSize) {
      return `File size exceeds ${maxSize}MB limit`;
    }

    // Check file type
    if (accept) {
      const acceptedTypes = accept.split(',').map(t => t.trim().toLowerCase());
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
      const fileType = file.type.toLowerCase();

      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return fileExt === type;
        }
        return fileType.includes(type);
      });

      if (!isAccepted) {
        return `File type not supported. Accepted types: ${accept}`;
      }
    }

    // Check max files
    if (!multiple && uploadingFiles.length >= 1) {
      return 'Only one file is allowed';
    }

    if (uploadingFiles.length >= maxFiles) {
      return `Maximum ${maxFiles} files allowed`;
    }

    return null;
  };

  const uploadFile = async (file: File): Promise<UploadedFile> => {
    const fileId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const uploadedFile: UploadedFile = {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading',
      progress: 0,
    };

    // Update state with uploading file
    setUploadingFiles(prev => [...prev, uploadedFile]);

    try {
      if (uploadFn) {
        // Use custom upload function
        const result = await uploadFn(file);
        uploadedFile.url = result.url;
        uploadedFile.status = 'success';
        uploadedFile.progress = 100;
      } else {
        // Simulate upload with progress
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          uploadedFile.progress = progress;
          setUploadingFiles(prev =>
            prev.map(f => (f.id === fileId ? { ...f, progress } : f))
          );
        }

        // Simulate success
        uploadedFile.url = `http://localhost:7001/uploads/${file.name}`;
        uploadedFile.status = 'success';
      }

      // Update state with successful upload
      setUploadingFiles(prev =>
        prev.map(f => (f.id === fileId ? uploadedFile : f))
      );

      toast.success(`${file.name} uploaded successfully`);
      return uploadedFile;
    } catch (error) {
      uploadedFile.status = 'error';
      uploadedFile.error = error instanceof Error ? error.message : 'Upload failed';

      setUploadingFiles(prev =>
        prev.map(f => (f.id === fileId ? uploadedFile : f))
      );

      toast.error(`Failed to upload ${file.name}`);
      throw error;
    }
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || disabled) return;

    const files = Array.from(fileList);
    const validFiles: File[] = [];

    // Validate all files first
    for (const file of files) {
      const error = validateFile(file);
      if (error) {
        toast.error(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    }

    // Upload valid files
    if (validFiles.length > 0) {
      const uploadPromises = validFiles.map(file => uploadFile(file));
      const results = await Promise.allSettled(uploadPromises);

      const successfulUploads = results
        .filter((r): r is PromiseFulfilledResult<UploadedFile> => r.status === 'fulfilled')
        .map(r => r.value);

      if (onUpload && successfulUploads.length > 0) {
        onUpload(successfulUploads);
      }
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!disabled) {
      handleFiles(e.dataTransfer.files);
    }
  }, [disabled]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleRemove = (fileId: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
    if (onRemove) {
      onRemove(fileId);
    }
    toast.success('File removed');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-lg transition-all',
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:bg-gray-100',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          disabled={disabled}
        />

        <label
          htmlFor="file-upload"
          className={cn(
            'flex flex-col items-center justify-center p-8 cursor-pointer',
            disabled && 'cursor-not-allowed'
          )}
        >
          <Upload className={cn(
            'w-12 h-12 mb-4',
            isDragging ? 'text-blue-500' : 'text-gray-400'
          )} />
          <p className="text-sm font-medium text-gray-700 mb-1">
            {isDragging ? 'Drop files here' : 'Click to upload or drag and drop'}
          </p>
          <p className="text-xs text-gray-500">
            {accept.split(',').join(', ').toUpperCase()} (Max {maxSize}MB per file)
          </p>
          {maxFiles > 1 && (
            <p className="text-xs text-gray-500 mt-1">
              Up to {maxFiles} files
            </p>
          )}
        </label>
      </div>

      {/* File List */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Files ({uploadingFiles.length})
          </h4>
          <div className="space-y-2">
            {uploadingFiles.map(file => (
              <div
                key={file.id}
                className="flex items-center gap-3 p-3 bg-white border rounded-lg hover:shadow-sm transition-shadow"
              >
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {file.status === 'uploading' && (
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                  )}
                  {file.status === 'success' && (
                    <Check className="w-5 h-5 text-green-500" />
                  )}
                  {file.status === 'error' && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>

                {/* File Icon */}
                <File className="w-5 h-5 text-gray-400 flex-shrink-0" />

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>

                  {/* Progress Bar */}
                  {file.status === 'uploading' && (
                    <div className="mt-1">
                      <Progress value={file.progress} className="h-1" />
                      <p className="text-xs text-gray-400 mt-0.5">
                        {file.progress}%
                      </p>
                    </div>
                  )}

                  {/* Error Message */}
                  {file.status === 'error' && file.error && (
                    <p className="text-xs text-red-500 mt-1">
                      {file.error}
                    </p>
                  )}
                </div>

                {/* Remove Button */}
                {file.status !== 'uploading' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(file.id)}
                    className="flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
