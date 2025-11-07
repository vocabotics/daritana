import React, { useState, useEffect } from 'react'
import { 
  Folder, 
  File, 
  Image, 
  FileText, 
  Download, 
  Trash2,
  Share2,
  Eye,
  MoreVertical,
  Search,
  Grid,
  List,
  Filter,
  Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { FileUpload } from './FileUpload'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface FileItem {
  id: string
  name: string
  type: 'file' | 'folder'
  size?: number
  mimeType?: string
  createdAt: string
  modifiedAt: string
  createdBy: string
  tags?: string[]
  parentId?: string
  shared?: boolean
  version?: number
}

interface FileManagerProps {
  projectId: string
}

export function FileManager({ projectId }: FileManagerProps) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadFiles()
  }, [currentFolder])

  const loadFiles = async () => {
    setLoading(true)
    // Simulate loading files
    setTimeout(() => {
      setFiles([
        {
          id: '1',
          name: 'Design Documents',
          type: 'folder',
          createdAt: '2024-01-15',
          modifiedAt: '2024-01-20',
          createdBy: 'Ahmad Rahman',
          tags: ['designs', 'approved']
        },
        {
          id: '2',
          name: 'Floor Plans',
          type: 'folder',
          createdAt: '2024-01-10',
          modifiedAt: '2024-01-18',
          createdBy: 'Sarah Chen',
          tags: ['drawings']
        },
        {
          id: '3',
          name: 'KLCC_Tower_Layout.dwg',
          type: 'file',
          size: 15728640,
          mimeType: 'application/dwg',
          createdAt: '2024-01-12',
          modifiedAt: '2024-01-19',
          createdBy: 'Ahmad Rahman',
          tags: ['CAD', 'structural'],
          version: 3,
          shared: true
        },
        {
          id: '4',
          name: 'Interior_Concept.pdf',
          type: 'file',
          size: 8388608,
          mimeType: 'application/pdf',
          createdAt: '2024-01-14',
          modifiedAt: '2024-01-14',
          createdBy: 'Marina Wong',
          tags: ['concept', 'client-approved'],
          version: 1
        },
        {
          id: '5',
          name: 'Material_Samples.jpg',
          type: 'file',
          size: 2097152,
          mimeType: 'image/jpeg',
          createdAt: '2024-01-16',
          modifiedAt: '2024-01-16',
          createdBy: 'Sarah Chen',
          tags: ['materials', 'reference']
        },
        {
          id: '6',
          name: 'Project_Brief.docx',
          type: 'file',
          size: 524288,
          mimeType: 'application/docx',
          createdAt: '2024-01-05',
          modifiedAt: '2024-01-10',
          createdBy: 'Ahmad Rahman',
          tags: ['documentation'],
          version: 2
        }
      ])
      setLoading(false)
    }, 1000)
  }

  const getFileIcon = (file: FileItem) => {
    if (file.type === 'folder') return Folder
    if (file.mimeType?.startsWith('image/')) return Image
    if (file.mimeType === 'application/pdf') return FileText
    return File
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const handleFileAction = (action: string, file: FileItem) => {
    switch (action) {
      case 'open':
        if (file.type === 'folder') {
          setCurrentFolder(file.id)
        } else {
          // Preview file
          toast.info(`Opening ${file.name}...`)
        }
        break
      case 'download':
        toast.success(`Downloading ${file.name}...`)
        break
      case 'share':
        toast.info(`Sharing ${file.name}...`)
        break
      case 'delete':
        if (confirm(`Delete ${file.name}?`)) {
          setFiles(prev => prev.filter(f => f.id !== file.id))
          toast.success(`${file.name} deleted`)
        }
        break
    }
  }

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search files and folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'bg-secondary' : ''}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-secondary' : ''}
          >
            <List className="h-4 w-4" />
          </Button>
          
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Upload Files
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload Files</DialogTitle>
                <DialogDescription>
                  Upload files to your project. Supported formats include documents, images, and CAD files.
                </DialogDescription>
              </DialogHeader>
              <FileUpload 
                projectId={projectId}
                onUploadComplete={() => {
                  setShowUploadDialog(false)
                  loadFiles()
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button 
          variant="link" 
          size="sm" 
          className="p-0 h-auto"
          onClick={() => setCurrentFolder(null)}
        >
          Project Files
        </Button>
        {currentFolder && (
          <>
            <span>/</span>
            <span>{files.find(f => f.id === currentFolder)?.name}</span>
          </>
        )}
      </div>

      {/* File Grid/List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredFiles.map(file => {
            const Icon = getFileIcon(file)
            return (
              <Card
                key={file.id}
                className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                onDoubleClick={() => handleFileAction('open', file)}
              >
                <div className="flex flex-col items-center text-center space-y-2">
                  <Icon className="h-12 w-12 text-gray-500" />
                  <p className="text-sm font-medium truncate w-full">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {file.type === 'folder' ? `${Math.floor(Math.random() * 10 + 1)} items` : formatFileSize(file.size)}
                  </p>
                  
                  {file.shared && (
                    <Badge variant="secondary" className="text-xs">
                      <Share2 className="h-3 w-3 mr-1" />
                      Shared
                    </Badge>
                  )}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleFileAction('open', file)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Open
                      </DropdownMenuItem>
                      {file.type === 'file' && (
                        <DropdownMenuItem onClick={() => handleFileAction('download', file)}>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleFileAction('share', file)}>
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleFileAction('delete', file)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <div className="divide-y">
            {filteredFiles.map(file => {
              const Icon = getFileIcon(file)
              return (
                <div
                  key={file.id}
                  className="flex items-center gap-4 p-4 hover:bg-secondary/50 cursor-pointer"
                  onDoubleClick={() => handleFileAction('open', file)}
                >
                  <Icon className="h-8 w-8 text-gray-500 flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{file.name}</p>
                      {file.version && (
                        <Badge variant="outline" className="text-xs">
                          v{file.version}
                        </Badge>
                      )}
                      {file.shared && (
                        <Badge variant="secondary" className="text-xs">
                          <Share2 className="h-3 w-3 mr-1" />
                          Shared
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{file.type === 'folder' ? 'Folder' : formatFileSize(file.size)}</span>
                      <span>Modified {file.modifiedAt}</span>
                      <span>by {file.createdBy}</span>
                    </div>
                    {file.tags && file.tags.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {file.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleFileAction('open', file)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Open
                      </DropdownMenuItem>
                      {file.type === 'file' && (
                        <DropdownMenuItem onClick={() => handleFileAction('download', file)}>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleFileAction('share', file)}>
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleFileAction('delete', file)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}