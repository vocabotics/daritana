import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GitBranch,
  GitCommit,
  GitMerge,
  GitPullRequest,
  History,
  Clock,
  User,
  Users,
  FileText,
  FolderOpen,
  Lock,
  Unlock,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  RefreshCw,
  Download,
  Upload,
  Share2,
  Copy,
  Trash2,
  Archive,
  Tag,
  Hash,
  Calendar,
  Filter,
  Search,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Plus,
  Minus,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Edit3,
  Save,
  X,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { documentApi } from '@/lib/api'

export interface DocumentVersion {
  id: string
  documentId: string
  version: string
  branch: string
  parentVersion?: string
  author: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  timestamp: Date
  message: string
  description?: string
  changes: {
    additions: number
    deletions: number
    modifications: number
    files: Array<{
      name: string
      status: 'added' | 'modified' | 'deleted'
      changes: number
    }>
  }
  status: 'draft' | 'pending_review' | 'in_review' | 'approved' | 'rejected' | 'merged' | 'archived'
  reviewers: Array<{
    id: string
    name: string
    avatar?: string
    role: string
    status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'changes_requested'
    comments?: string
    timestamp?: Date
  }>
  tags: string[]
  metadata: {
    fileSize: number
    checksum: string
    format: string
    pages?: number
  }
  permissions: {
    canEdit: boolean
    canReview: boolean
    canApprove: boolean
    canMerge: boolean
    canDelete: boolean
  }
  workflow?: {
    stage: string
    requiredApprovals: number
    currentApprovals: number
    blockers: string[]
  }
}

export interface ChangeRequest {
  id: string
  title: string
  description: string
  fromVersion: string
  toVersion: string
  author: {
    id: string
    name: string
    avatar?: string
  }
  createdAt: Date
  updatedAt: Date
  status: 'open' | 'reviewing' | 'approved' | 'rejected' | 'merged' | 'closed'
  reviewers: string[]
  comments: number
  conflicts: boolean
  mergeable: boolean
}

interface DocumentVersionControlProps {
  documentId: string
  currentVersion?: DocumentVersion
  onVersionChange?: (version: DocumentVersion) => void
  onCreateVersion?: (data: any) => void
  onMergeVersions?: (source: string, target: string) => void
}

export const DocumentVersionControl: React.FC<DocumentVersionControlProps> = ({
  documentId,
  currentVersion,
  onVersionChange,
  onCreateVersion,
  onMergeVersions,
}) => {
  const [versions, setVersions] = useState<DocumentVersion[]>([])
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([])
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null)
  const [compareMode, setCompareMode] = useState(false)
  const [compareVersions, setCompareVersions] = useState<[string?, string?]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showMergeDialog, setShowMergeDialog] = useState(false)
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Load document versions from API
  useEffect(() => {
    const loadDocumentVersions = async () => {
      if (!documentId) return;
      
      try {
        const response = await documentApi.getDocumentVersions(documentId);
        if (response.data?.versions) {
          const formattedVersions = response.data.versions.map((version: any) => ({
            id: version.id,
            documentId: version.documentId || documentId,
            version: version.version || version.versionNumber,
            branch: version.branch || 'main',
            parentVersion: version.parentVersion,
            author: {
              id: version.author?.id || version.userId,
              name: version.author?.name || version.user?.name || 'Unknown User',
              email: version.author?.email || version.user?.email || '',
              avatar: version.author?.avatar || version.user?.avatar,
            },
            timestamp: new Date(version.timestamp || version.createdAt),
            message: version.message || version.commitMessage || 'Version update',
            description: version.description,
            changes: {
              additions: version.changes?.additions || 0,
              deletions: version.changes?.deletions || 0,
              modifications: version.changes?.modifications || 0,
              files: version.changes?.files || [],
            },
            status: version.status || 'draft',
            reviewers: version.reviewers || [],
            tags: version.tags || [],
            metadata: {
              fileSize: version.metadata?.fileSize || 0,
              checksum: version.metadata?.checksum || '',
              format: version.metadata?.format || 'Unknown',
              pages: version.metadata?.pages || 1,
            },
            permissions: {
              canEdit: version.permissions?.canEdit || false,
              canReview: version.permissions?.canReview || false,
              canApprove: version.permissions?.canApprove || false,
              canMerge: version.permissions?.canMerge || false,
              canDelete: version.permissions?.canDelete || false,
            },
            workflow: {
              stage: version.workflow?.stage || 'draft',
              requiredApprovals: version.workflow?.requiredApprovals || 1,
              currentApprovals: version.workflow?.currentApprovals || 0,
              blockers: version.workflow?.blockers || [],
            },
          }));
          setVersions(formattedVersions);
          if (formattedVersions.length > 0) {
            setSelectedVersion(formattedVersions[0]);
          }
        }
      } catch (error) {
        console.error('Failed to load document versions:', error);
        toast.error('Failed to load document versions');
      }
    };

    loadDocumentVersions();
  }, [documentId, currentVersion]);

  const handleVersionSelect = (version: DocumentVersion) => {
    setSelectedVersion(version)
    onVersionChange?.(version)
  }

  const handleCompare = (versionId: string) => {
    if (!compareMode) {
      setCompareMode(true)
      setCompareVersions([versionId])
    } else if (compareVersions.length === 1) {
      setCompareVersions([compareVersions[0], versionId])
    } else {
      setCompareMode(false)
      setCompareVersions([])
    }
  }

  const handleCreateVersion = (data: any) => {
    onCreateVersion?.(data)
    setShowCreateDialog(false)
    toast.success('New version created successfully')
  }

  const handleMergeVersions = (source: string, target: string) => {
    onMergeVersions?.(source, target)
    setShowMergeDialog(false)
    toast.success('Versions merged successfully')
  }

  const filteredVersions = versions.filter(v => {
    if (filter !== 'all' && v.status !== filter) return false
    if (searchQuery && !v.message.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Version Control</h2>
          <p className="text-sm text-gray-500">
            Manage document versions and change requests
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCompareMode(!compareMode)}
            className={cn(compareMode && "bg-violet-50 border-violet-300")}
          >
            <GitBranch className="h-4 w-4 mr-2" />
            {compareMode ? 'Cancel Compare' : 'Compare'}
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Version
          </Button>
        </div>
      </div>

      {/* Current Version Info */}
      {selectedVersion && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <GitCommit className="h-5 w-5" />
                  Version {selectedVersion.version}
                </CardTitle>
                <CardDescription className="mt-1">
                  {selectedVersion.message}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={
                  selectedVersion.status === 'approved' ? 'default' :
                  selectedVersion.status === 'rejected' ? 'destructive' :
                  selectedVersion.status === 'draft' ? 'secondary' :
                  'outline'
                }>
                  {selectedVersion.status}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Author</p>
                <div className="flex items-center gap-2 mt-1">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={selectedVersion.author.avatar} />
                    <AvatarFallback>{selectedVersion.author.name[0]}</AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-medium">{selectedVersion.author.name}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Branch</p>
                <p className="text-sm font-medium mt-1">{selectedVersion.branch}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="text-sm font-medium mt-1">
                  {new Date(selectedVersion.timestamp).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Changes</p>
                <div className="flex items-center gap-2 mt-1 text-sm">
                  <span className="text-green-600">+{selectedVersion.changes.additions}</span>
                  <span className="text-red-600">-{selectedVersion.changes.deletions}</span>
                  <span className="text-blue-600">~{selectedVersion.changes.modifications}</span>
                </div>
              </div>
            </div>

            {selectedVersion.workflow && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500">Approval Progress</p>
                  <p className="text-sm font-medium">
                    {selectedVersion.workflow.currentApprovals}/{selectedVersion.workflow.requiredApprovals} approvals
                  </p>
                </div>
                <Progress 
                  value={(selectedVersion.workflow.currentApprovals / selectedVersion.workflow.requiredApprovals) * 100}
                  className="h-2"
                />
                {selectedVersion.workflow.blockers.length > 0 && (
                  <div className="mt-2">
                    {selectedVersion.workflow.blockers.map((blocker, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-orange-600">
                        <AlertTriangle className="h-3 w-3" />
                        {blocker}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedVersion.reviewers.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-2">Reviewers</p>
                <div className="space-y-2">
                  {selectedVersion.reviewers.map((reviewer) => (
                    <div key={reviewer.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={reviewer.avatar} />
                          <AvatarFallback>{reviewer.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{reviewer.name}</p>
                          <p className="text-xs text-gray-500">{reviewer.role}</p>
                        </div>
                      </div>
                      <Badge variant={
                        reviewer.status === 'approved' ? 'default' :
                        reviewer.status === 'rejected' ? 'destructive' :
                        reviewer.status === 'changes_requested' ? 'outline' :
                        'secondary'
                      } className="text-xs">
                        {reviewer.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="versions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="versions">
            <History className="h-4 w-4 mr-2" />
            Version History
          </TabsTrigger>
          <TabsTrigger value="changes">
            <GitPullRequest className="h-4 w-4 mr-2" />
            Change Requests
          </TabsTrigger>
          <TabsTrigger value="tree">
            <GitBranch className="h-4 w-4 mr-2" />
            Version Tree
          </TabsTrigger>
        </TabsList>

        {/* Version History Tab */}
        <TabsContent value="versions" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search versions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Versions</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Version List */}
          <div className="space-y-3">
            {filteredVersions.map((version) => (
              <Card
                key={version.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  selectedVersion?.id === version.id && "ring-2 ring-violet-600",
                  compareVersions.includes(version.id) && "bg-violet-50 dark:bg-violet-900/20"
                )}
                onClick={() => handleVersionSelect(version)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {compareMode && (
                        <input
                          type="checkbox"
                          checked={compareVersions.includes(version.id)}
                          onChange={() => handleCompare(version.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1"
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">v{version.version}</p>
                          <Badge variant="outline" className="text-xs">
                            {version.branch}
                          </Badge>
                          <Badge variant={
                            version.status === 'approved' ? 'default' :
                            version.status === 'rejected' ? 'destructive' :
                            'secondary'
                          } className="text-xs">
                            {version.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {version.message}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={version.author.avatar} />
                              <AvatarFallback>{version.author.name[0]}</AvatarFallback>
                            </Avatar>
                            <span>{version.author.name}</span>
                          </div>
                          <span>{new Date(version.timestamp).toLocaleDateString()}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-green-600">+{version.changes.additions}</span>
                            <span className="text-red-600">-{version.changes.deletions}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Download</DropdownMenuItem>
                        <DropdownMenuItem>Create Branch</DropdownMenuItem>
                        <DropdownMenuItem>Revert to This</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Change Requests Tab */}
        <TabsContent value="changes" className="space-y-4">
          <div className="space-y-3">
            {changeRequests.map((cr) => (
              <Card key={cr.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <GitPullRequest className="h-4 w-4" />
                        <p className="font-semibold">{cr.title}</p>
                        <Badge variant={
                          cr.status === 'merged' ? 'default' :
                          cr.status === 'rejected' ? 'destructive' :
                          cr.status === 'approved' ? 'outline' :
                          'secondary'
                        }>
                          {cr.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {cr.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={cr.author.avatar} />
                            <AvatarFallback>{cr.author.name[0]}</AvatarFallback>
                          </Avatar>
                          <span>{cr.author.name}</span>
                        </div>
                        <span>{cr.fromVersion} → {cr.toVersion}</span>
                        <span>{cr.comments} comments</span>
                        {cr.conflicts && (
                          <Badge variant="destructive" className="text-xs">
                            Conflicts
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Review
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Version Tree Tab */}
        <TabsContent value="tree">
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-gray-500">
                <GitBranch className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Version tree visualization coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Version Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Version</DialogTitle>
            <DialogDescription>
              Create a new version of the document with your changes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Version Number</Label>
              <Input placeholder="e.g., 1.2.0" />
            </div>
            <div>
              <Label>Branch</Label>
              <Select defaultValue="main">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">main</SelectItem>
                  <SelectItem value="feature">New Feature Branch</SelectItem>
                  <SelectItem value="hotfix">Hotfix Branch</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Commit Message</Label>
              <Input placeholder="Brief description of changes" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea placeholder="Detailed description of what changed and why" />
            </div>
            <div>
              <Label>Tags</Label>
              <Input placeholder="Enter tags separated by commas" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleCreateVersion({})}>
              Create Version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}