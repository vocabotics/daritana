import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  AlertCircle,
  Clock,
  CheckCircle,
  Plus,
  FileText,
  Download,
  Upload,
  Send,
  Eye,
  MessageSquare,
  Calendar,
  User,
  Building,
  Paperclip,
  AlertTriangle,
  Timer,
  Filter,
  Search,
  ArrowUpDown
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import PageWrapper from '@/components/PageWrapper'

interface RFI {
  id: string
  projectId: string
  number: string
  dateSubmitted: Date
  submittedBy: 'contractor' | 'architect' | 'consultant'
  submittedTo: string
  subject: string
  description: string
  attachments: string[]
  status: 'pending' | 'in_review' | 'clarification_requested' | 'answered' | 'closed'
  response?: string
  responseDate?: Date
  respondedBy?: string
  daysOpen: number
  priority: 'low' | 'medium' | 'high' | 'critical'
  category: string
  relatedDrawings?: string[]
  costImpact?: number
  scheduleImpact?: number
}

export default function RFIManagement() {
  const [rfis, setRfis] = useState<RFI[]>([])
  const [selectedRFI, setSelectedRFI] = useState<RFI | null>(null)
  const [showNewRFI, setShowNewRFI] = useState(false)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'status'>('date')

  // Mock data for demonstration
  useEffect(() => {
    const mockRFIs: RFI[] = [
      {
        id: '1',
        projectId: 'proj-1',
        number: 'RFI-001',
        dateSubmitted: new Date('2024-01-15'),
        submittedBy: 'contractor',
        submittedTo: 'Structural Consultant',
        subject: 'Column reinforcement clarification',
        description: 'Need clarification on column C3 reinforcement details as shown on drawing S-101',
        attachments: ['photo1.jpg', 'markup.pdf'],
        status: 'pending',
        daysOpen: 5,
        priority: 'high',
        category: 'Structural',
        relatedDrawings: ['S-101', 'S-102'],
        costImpact: 15000,
        scheduleImpact: 3
      },
      {
        id: '2',
        projectId: 'proj-1',
        number: 'RFI-002',
        dateSubmitted: new Date('2024-01-10'),
        submittedBy: 'architect',
        submittedTo: 'MEP Consultant',
        subject: 'HVAC duct routing conflict',
        description: 'HVAC ducts conflict with structural beam at grid line 5-B',
        attachments: ['clash-detection.pdf'],
        status: 'answered',
        response: 'Reroute duct as per revised drawing MEP-201A',
        responseDate: new Date('2024-01-12'),
        respondedBy: 'John Smith',
        daysOpen: 2,
        priority: 'medium',
        category: 'MEP'
      },
      {
        id: '3',
        projectId: 'proj-1',
        number: 'RFI-003',
        dateSubmitted: new Date('2024-01-18'),
        submittedBy: 'contractor',
        submittedTo: 'Architect',
        subject: 'Facade material specification',
        description: 'Require exact specification for aluminum composite panel finish',
        attachments: [],
        status: 'in_review',
        daysOpen: 2,
        priority: 'low',
        category: 'Architecture'
      }
    ]
    setRfis(mockRFIs)
  }, [])

  const getStatusIcon = (status: RFI['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'in_review':
        return <Eye className="h-4 w-4 text-blue-500" />
      case 'clarification_requested':
        return <MessageSquare className="h-4 w-4 text-orange-500" />
      case 'answered':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'closed':
        return <CheckCircle className="h-4 w-4 text-gray-500" />
      default:
        return null
    }
  }

  const getPriorityBadge = (priority: RFI['priority']) => {
    const variants: Record<RFI['priority'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
      low: 'secondary',
      medium: 'default',
      high: 'destructive',
      critical: 'destructive'
    }
    return (
      <Badge variant={variants[priority]} className={cn(
        priority === 'critical' && 'animate-pulse'
      )}>
        {priority}
      </Badge>
    )
  }

  const filteredRFIs = rfis
    .filter(rfi => {
      if (filter !== 'all' && rfi.status !== filter) return false
      if (searchTerm && !rfi.subject.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !rfi.number.toLowerCase().includes(searchTerm.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        case 'status':
          return a.status.localeCompare(b.status)
        default:
          return b.dateSubmitted.getTime() - a.dateSubmitted.getTime()
      }
    })

  const stats = {
    total: rfis.length,
    pending: rfis.filter(r => r.status === 'pending').length,
    inReview: rfis.filter(r => r.status === 'in_review').length,
    answered: rfis.filter(r => r.status === 'answered').length,
    critical: rfis.filter(r => r.priority === 'critical').length,
    avgResponseTime: Math.round(
      rfis.filter(r => r.responseDate).reduce((sum, r) => sum + r.daysOpen, 0) /
      rfis.filter(r => r.responseDate).length || 1
    )
  }

  return (
    <PageWrapper title="RFI Management">
      <div className="space-y-6">
        {/* Header Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total RFIs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">In Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.inReview}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Answered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.answered}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Critical</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgResponseTime} days</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Request for Information (RFI) Log</CardTitle>
              <div className="flex items-center gap-2">
                <Dialog open={showNewRFI} onOpenChange={setShowNewRFI}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New RFI
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New RFI</DialogTitle>
                      <DialogDescription>
                        Submit a request for information to consultants or contractors
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="rfi-to">Submit To</Label>
                          <Select>
                            <SelectTrigger id="rfi-to">
                              <SelectValue placeholder="Select recipient" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="structural">Structural Consultant</SelectItem>
                              <SelectItem value="mep">MEP Consultant</SelectItem>
                              <SelectItem value="contractor">Main Contractor</SelectItem>
                              <SelectItem value="architect">Architect</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="rfi-priority">Priority</Label>
                          <Select>
                            <SelectTrigger id="rfi-priority">
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="rfi-subject">Subject</Label>
                        <Input id="rfi-subject" placeholder="Brief description of the RFI" />
                      </div>
                      <div>
                        <Label htmlFor="rfi-description">Description</Label>
                        <Textarea
                          id="rfi-description"
                          placeholder="Detailed description of the information needed..."
                          rows={4}
                        />
                      </div>
                      <div>
                        <Label>Related Drawings</Label>
                        <Input placeholder="e.g., A-101, S-201" />
                      </div>
                      <div>
                        <Label>Attachments</Label>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Files
                          </Button>
                          <span className="text-sm text-muted-foreground">
                            Photos, markups, or related documents
                          </span>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowNewRFI(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => {
                        toast.success('RFI created successfully')
                        setShowNewRFI(false)
                      }}>
                        <Send className="h-4 w-4 mr-2" />
                        Submit RFI
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search RFIs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="answered">Answered</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Sort by Date</SelectItem>
                  <SelectItem value="priority">Sort by Priority</SelectItem>
                  <SelectItem value="status">Sort by Status</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* RFI Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>RFI #</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Days Open</TableHead>
                    <TableHead>Impact</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRFIs.map((rfi) => (
                    <TableRow key={rfi.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">{rfi.number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{rfi.subject}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {rfi.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{rfi.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{format(rfi.dateSubmitted, 'dd MMM')}</p>
                          <p className="text-muted-foreground">
                            {rfi.submittedBy}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{rfi.submittedTo}</TableCell>
                      <TableCell>{getPriorityBadge(rfi.priority)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(rfi.status)}
                          <span className="capitalize">{rfi.status.replace('_', ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Timer className="h-4 w-4 text-muted-foreground" />
                          {rfi.daysOpen}
                        </div>
                      </TableCell>
                      <TableCell>
                        {(rfi.costImpact || rfi.scheduleImpact) && (
                          <div className="space-y-1">
                            {rfi.costImpact && (
                              <p className="text-xs text-orange-600">
                                RM {rfi.costImpact.toLocaleString()}
                              </p>
                            )}
                            {rfi.scheduleImpact && (
                              <p className="text-xs text-red-600">
                                {rfi.scheduleImpact} days
                              </p>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedRFI(rfi)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  )
}