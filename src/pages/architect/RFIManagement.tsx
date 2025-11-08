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
  ArrowUpDown,
  Loader2
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import PageWrapper from '@/components/PageWrapper'
import { useRFIStore } from '@/store/architect/rfiStore'
import type { RFI } from '@/types/architect'

export default function RFIManagement() {
  // Zustand store
  const {
    rfis,
    statistics,
    loading,
    error,
    searchTerm,
    filters,
    fetchRFIs,
    fetchStatistics,
    setSearchTerm,
    setFilters,
    clearError
  } = useRFIStore()

  // Local UI state
  const [selectedRFI, setSelectedRFI] = useState<RFI | null>(null)
  const [showNewRFI, setShowNewRFI] = useState(false)
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'status'>('date')

  // Load data on mount
  useEffect(() => {
    fetchRFIs()
    fetchStatistics()
  }, [fetchRFIs, fetchStatistics])

  // Clear errors when they occur
  useEffect(() => {
    if (error) {
      toast.error(error)
      clearError()
    }
  }, [error, clearError])

  const getStatusIcon = (status: RFI['status']) => {
    switch (status) {
      case 'open':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'in_review':
        return <Eye className="h-4 w-4 text-blue-500" />
      case 'clarification_needed':
        return <MessageSquare className="h-4 w-4 text-orange-500" />
      case 'responded':
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
      if (searchTerm && !rfi.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !rfi.rfiNumber.toLowerCase().includes(searchTerm.toLowerCase())) return false
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
          return new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
      }
    })

  const stats = statistics || {
    total: rfis.length,
    open: rfis.filter(r => r.status === 'open').length,
    responded: rfis.filter(r => r.status === 'responded').length,
    closed: rfis.filter(r => r.status === 'closed').length,
    avgResponseTime: 0,
    byCategory: {},
    byPriority: { critical: rfis.filter(r => r.priority === 'critical').length, high: 0, medium: 0, low: 0 }
  }

  return (
    <PageWrapper title="RFI Management">
      <div className="space-y-6">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading RFIs...</span>
          </div>
        )}

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
              <CardTitle className="text-sm font-medium">Open</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.open}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Responded</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.responded}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Closed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.closed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Critical</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.byPriority?.critical || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgResponseTime} hrs</div>
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
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="responded">Responded</SelectItem>
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
                  {filteredRFIs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        No RFIs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRFIs.map((rfi) => {
                      const daysOpen = Math.floor((new Date().getTime() - new Date(rfi.dateCreated).getTime()) / (1000 * 60 * 60 * 24))

                      return (
                        <TableRow key={rfi.id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell className="font-medium">{rfi.rfiNumber}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{rfi.title}</p>
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
                              <p>{format(new Date(rfi.dateCreated), 'dd MMM')}</p>
                              <p className="text-muted-foreground">
                                {rfi.requestedBy.name}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{rfi.assignedTo?.name || 'Unassigned'}</TableCell>
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
                              {daysOpen}
                            </div>
                          </TableCell>
                          <TableCell>
                            {(rfi.costImpact || rfi.scheduleImpact) && (
                              <div className="space-y-1">
                                {rfi.costImpact > 0 && (
                                  <p className="text-xs text-orange-600">
                                    RM {rfi.costImpact.toLocaleString()}
                                  </p>
                                )}
                                {rfi.scheduleImpact > 0 && (
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
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  )
}