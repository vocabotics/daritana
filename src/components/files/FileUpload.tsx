import React, { useState, useRef } from 'react'
import { Upload, X, File, Image, FileText, Archive, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { filesApi } from '@/lib/api'

interface FileUploadProps {
  projectId: string
  onUploadComplete?: (files: UploadedFile[]) => void
  maxFiles?: number
  maxSize?: number // in MB
  accept?: string[]
}

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url?: string
  progress?: number
  status: 'uploading' | 'success' | 'error'
  error?: string
}

const FILE_ICONS = {
  'image': Image,
  'pdf': FileText,
  'dwg': File,
  'dxf': File,
  'zip': Archive,
  'default': File
}

export function FileUpload({ 
  projectId, 
  onUploadComplete,
  maxFiles = 10,
  maxSize = 100, // 100MB default
  accept = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.dwg', '.dxf', '.zip']
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) return FILE_ICONS.image
    if (ext === 'pdf') return FILE_ICONS.pdf
    if (['dwg', 'dxf'].includes(ext || '')) return FILE_ICONS.dwg
    if (['zip', 'rar', '7z'].includes(ext || '')) return FILE_ICONS.zip
    return FILE_ICONS.default
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `File size exceeds ${maxSize}MB limit`
    }

    // Check file type
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (accept.length > 0 && !accept.includes(ext)) {
      return `File type ${ext} is not allowed`
    }

    return null
  }

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return

    const newFiles: UploadedFile[] = []
    const errors: string[] = []

    // Check max files limit
    if (files.length + selectedFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`)
      return
    }

    Array.from(selectedFiles).forEach(file => {
      const error = validateFile(file)
      if (error) {
        errors.push(`${file.name}: ${error}`)
      } else {
        const newFile: UploadedFile = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: file.size,
          type: file.type,
          progress: 0,
          status: 'uploading'
        }
        // Store the actual File object for upload
        ;(newFile as any).actualFile = file
        newFiles.push(newFile)
      }
    })

    if (errors.length > 0) {
      errors.forEach(error => toast.error(error))
    }

    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles])
      // Upload each file to backend
      newFiles.forEach(file => uploadFile(file))
    }
  }

  const uploadFile = async (file: UploadedFile) => {
    try {
      // Get the actual File object - we need to store it during file selection
      const actualFile = (file as any).actualFile as File
      if (!actualFile) {
        throw new Error('File object not found')
      }
      
      // Upload to backend with progress tracking
      const response = await filesApi.upload(actualFile, {
        projectId,
        description: `Uploaded file: ${file.name}`,
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1))
          setFiles(prev => prev.map(f => 
            f.id === file.id 
              ? { ...f, progress, status: progress === 100 ? 'success' : 'uploading' }
              : f
          ))
        }
      })

      if (response.data.success) {
        // Update file with real URL from backend
        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { 
                ...f, 
                status: 'success', 
                url: response.data.file.url,
                id: response.data.file.id // Use backend file ID
              }
            : f
        ))
        
        toast.success(`${file.name} uploaded successfully`)
        
        // Call completion callback if provided
        if (onUploadComplete) {
          onUploadComplete([response.data.file])
        }
      } else {
        throw new Error(response.data.message || 'Upload failed')
      }
    } catch (error: any) {
      console.error('File upload error:', error)
      
      setFiles(prev => prev.map(f => 
        f.id === file.id 
          ? { ...f, status: 'error', error: error.message || 'Upload failed' }
          : f
      ))
      
      toast.error(`Failed to upload ${file.name}: ${error.message || 'Unknown error'}`)
    }
  }

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card
        className={cn(
          "border-2 border-dashed p-8 text-center cursor-pointer transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-gray-300 hover:border-gray-400"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept.join(',')}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium mb-2">
          Drop files here or click to browse
        </p>
        <p className="text-sm text-muted-foreground">
          Maximum {maxFiles} files, up to {maxSize}MB each
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Supported: {accept.join(', ')}
        </p>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Uploaded Files ({files.length})</h3>
          {files.map(file => {
            const Icon = getFileIcon(file.name)
            return (
              <Card key={file.id} className="p-3">
                <div className="flex items-center gap-3">
                  <Icon className="h-8 w-8 text-gray-500 flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                    
                    {file.status === 'uploading' && (
                      <Progress value={file.progress} className="h-1" />
                    )}
                    
                    {file.status === 'success' && (
                      <p className="text-xs text-green-600">Upload complete</p>
                    )}
                    
                    {file.status === 'error' && (
                      <div className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 text-red-500" />
                        <p className="text-xs text-red-600">{file.error}</p>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFile(file.id)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}