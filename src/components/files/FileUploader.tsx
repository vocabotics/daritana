import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, X, File, Image, FileText, FileSpreadsheet, 
  Film, Music, Archive, Cloud, HardDrive,
  CheckCircle, AlertCircle, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { cloudStorage, CloudFile } from '@/lib/cloudStorage';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FileUploadItem {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  cloudFile?: CloudFile;
  destination: 'local' | 'google' | 'microsoft';
}

interface FileUploaderProps {
  onUploadComplete?: (files: CloudFile[]) => void;
  maxSize?: number; // in MB
  accept?: string[];
  multiple?: boolean;
}

export function FileUploader({ 
  onUploadComplete, 
  maxSize = 100,
  accept,
  multiple = true 
}: FileUploaderProps) {
  const [uploadQueue, setUploadQueue] = useState<FileUploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [defaultDestination, setDefaultDestination] = useState<'local' | 'google' | 'microsoft'>('local');

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-5 w-5" />;
    if (type.startsWith('video/')) return <Film className="h-5 w-5" />;
    if (type.startsWith('audio/')) return <Music className="h-5 w-5" />;
    if (type.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    if (type.includes('sheet') || type.includes('excel')) return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
    if (type.includes('zip') || type.includes('rar')) return <Archive className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    rejectedFiles.forEach((rejection) => {
      const error = rejection.errors[0];
      if (error.code === 'file-too-large') {
        toast.error(`${rejection.file.name} is too large. Max size is ${maxSize}MB`);
      } else {
        toast.error(`${rejection.file.name} was rejected: ${error.message}`);
      }
    });

    // Add accepted files to queue
    const newFiles: FileUploadItem[] = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substring(7),
      progress: 0,
      status: 'pending' as const,
      destination: defaultDestination
    }));

    setUploadQueue(prev => [...prev, ...newFiles]);
  }, [maxSize, defaultDestination]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: maxSize * 1024 * 1024, // Convert MB to bytes
    multiple,
    accept: accept ? 
      accept.reduce((acc, type) => ({ ...acc, [type]: [] }), {}) : 
      undefined
  });

  const uploadFile = async (item: FileUploadItem) => {
    // Update status to uploading
    setUploadQueue(prev => prev.map(f => 
      f.id === item.id ? { ...f, status: 'uploading' } : f
    ));

    try {
      let cloudFile: CloudFile | null = null;

      // Upload to server storage
      if (item.destination === 'local') {
        // Track upload progress
        const progressInterval = setInterval(() => {
          setUploadQueue(prev => prev.map(f => {
            if (f.id === item.id && f.progress < 90) {
              return { ...f, progress: f.progress + 10 };
            }
            return f;
          }));
        }, 200);

        // Upload to server
        cloudFile = await cloudStorage.uploadToLocalServer(item.file);
        
        clearInterval(progressInterval);
        
        // Set progress to 100%
        setUploadQueue(prev => prev.map(f => 
          f.id === item.id ? { ...f, progress: 100 } : f
        ));
      } else if (item.destination === 'google') {
        // Upload to Google Drive
        cloudFile = await cloudStorage.uploadToGoogleDrive(item.file);
        setUploadQueue(prev => prev.map(f => 
          f.id === item.id ? { ...f, progress: 100 } : f
        ));
      } else if (item.destination === 'microsoft') {
        // Upload to OneDrive
        cloudFile = await cloudStorage.uploadToOneDrive(item.file);
        setUploadQueue(prev => prev.map(f => 
          f.id === item.id ? { ...f, progress: 100 } : f
        ));
      }

      if (cloudFile) {
        setUploadQueue(prev => prev.map(f => 
          f.id === item.id ? { ...f, status: 'success', cloudFile } : f
        ));
        toast.success(`${item.file.name} uploaded successfully`);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadQueue(prev => prev.map(f => 
        f.id === item.id ? { 
          ...f, 
          status: 'error', 
          error: 'Upload failed. Please try again.' 
        } : f
      ));
      toast.error(`Failed to upload ${item.file.name}`);
    }
  };

  const startUpload = async () => {
    setIsUploading(true);
    const pendingFiles = uploadQueue.filter(f => f.status === 'pending');
    
    // Upload files sequentially
    for (const file of pendingFiles) {
      await uploadFile(file);
    }

    setIsUploading(false);

    // Call onUploadComplete with successful uploads
    const successfulUploads = uploadQueue
      .filter(f => f.status === 'success' && f.cloudFile)
      .map(f => f.cloudFile!);
    
    if (successfulUploads.length > 0 && onUploadComplete) {
      onUploadComplete(successfulUploads);
    }
  };

  const removeFile = (id: string) => {
    setUploadQueue(prev => prev.filter(f => f.id !== id));
  };

  const changeDestination = (id: string, destination: 'local' | 'google' | 'microsoft') => {
    setUploadQueue(prev => prev.map(f => 
      f.id === id ? { ...f, destination } : f
    ));
  };

  const clearCompleted = () => {
    setUploadQueue(prev => prev.filter(f => f.status !== 'success'));
  };

  return (
    <div className="space-y-4">
      {/* Cloud Storage Selection */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Default Upload Destination:</span>
          <Select value={defaultDestination} onValueChange={(v: any) => setDefaultDestination(v)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="local">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  Local Storage
                </div>
              </SelectItem>
              <SelectItem value="google">
                <div className="flex items-center gap-2">
                  <Cloud className="h-4 w-4 text-blue-500" />
                  Google Drive
                </div>
              </SelectItem>
              <SelectItem value="microsoft">
                <div className="flex items-center gap-2">
                  <Cloud className="h-4 w-4 text-blue-600" />
                  OneDrive
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-lg font-medium mb-2">
          {isDragActive ? "Drop files here..." : "Drag & drop files here"}
        </p>
        <p className="text-sm text-gray-500 mb-4">
          or click to browse from your computer
        </p>
        <p className="text-xs text-gray-400">
          Maximum file size: {maxSize}MB
        </p>
      </div>

      {/* Upload Queue */}
      {uploadQueue.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Upload Queue ({uploadQueue.length} files)</h3>
            <div className="flex gap-2">
              {uploadQueue.some(f => f.status === 'success') && (
                <Button variant="ghost" size="sm" onClick={clearCompleted}>
                  Clear Completed
                </Button>
              )}
              {uploadQueue.some(f => f.status === 'pending') && (
                <Button 
                  size="sm" 
                  onClick={startUpload}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Start Upload
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {uploadQueue.map((item) => (
              <div key={item.id} className="border rounded p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-3">
                    {getFileIcon(item.file.type)}
                    <div>
                      <p className="font-medium text-sm">{item.file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(item.file.size)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.status === 'pending' && (
                      <Select 
                        value={item.destination} 
                        onValueChange={(v: any) => changeDestination(item.id, v)}
                      >
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="local">Local</SelectItem>
                          <SelectItem value="google">Google Drive</SelectItem>
                          <SelectItem value="microsoft">OneDrive</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    {item.status === 'success' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {item.status === 'error' && (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    {item.status === 'uploading' && (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeFile(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {item.status === 'uploading' && (
                  <Progress value={item.progress} className="h-2" />
                )}

                {item.status === 'error' && (
                  <p className="text-xs text-red-500 mt-1">{item.error}</p>
                )}

                {item.status === 'success' && item.cloudFile && (
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {item.destination === 'local' ? 'Local' : 
                       item.destination === 'google' ? 'Google Drive' : 'OneDrive'}
                    </Badge>
                    {item.cloudFile.webUrl && (
                      <a 
                        href={item.cloudFile.webUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline"
                      >
                        View File
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}