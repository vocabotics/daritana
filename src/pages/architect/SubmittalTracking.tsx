import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Upload,
  Plus,
  Eye,
  Download,
  Paperclip
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import PageWrapper from '@/components/PageWrapper'
import type { Submittal } from '@/types/architect'

export default function SubmittalTracking() {
  const [submittals, setSubmittals] = useState<Submittal[]>([
    {
      id: '1',
      submittalNumber: 'SUB-001',
      projectId: 'proj-1',
      type: 'material',
      category: 'Concrete',
      description: 'Grade 40 concrete mix design and test certificates',
      specSection: '03100',
      submittedBy: 'ABC Construction Sdn Bhd',
      submittedDate: new Date('2024-01-10').toISOString(),
      requiredOnSiteDate: new Date('2024-01-25').toISOString(),
      architectReviewDue: new Date('2024-01-20').toISOString(),
      reviewedBy: 'Ar. Ahmad bin Abdullah',
      reviewedDate: new Date('2024-01-18').toISOString(),
      status: 'approved',
      actionRequired: 'none',
      reviewComments: 'Approved for use as specified. Ensure compliance with BS8110.',
      revisionNumber: 0,
      relatedDrawings: ['S-101', 'S-102'],
      attachments: [
        {
          id: '1',
          name: 'Concrete_Mix_Design.pdf',
          url: '/uploads/concrete-mix.pdf',
          type: 'application/pdf',
          uploadedDate: new Date('2024-01-10').toISOString()
        }
      ],
      createdAt: new Date('2024-01-10').toISOString(),
      updatedAt: new Date('2024-01-18').toISOString()
    },
    {
      id: '2',
      submittalNumber: 'SUB-002',
      projectId: 'proj-1',
      type: 'shop_drawing',
      category: 'Aluminum Works',
      description: 'Curtain wall shop drawings for Tower Block',
      specSection: '08400',
      submittedBy: 'XYZ Facade Systems',
      submittedDate: new Date('2024-01-15').toISOString(),
      architectReviewDue: new Date('2024-01-22').toISOString(),
      status: 'under_review',
      actionRequired: 'architect_review',
      revisionNumber: 1,
      relatedDrawings: ['A-201', 'A-202', 'A-203'],
      attachments: [
        {
          id: '2',
          name: 'Curtain_Wall_Shop_Drawings_Rev1.dwg',
          url: '/uploads/curtain-wall.dwg',
          type: 'application/acad',
          uploadedDate: new Date('2024-01-15').toISOString()
        }
      ],
      createdAt: new Date('2024-01-12').toISOString(),
      updatedAt: new Date('2024-01-15').toISOString()
    },
    {
      id: '3',
      submittalNumber: 'SUB-003',
      projectId: 'proj-1',
      type: 'sample',
      category: 'Finishes',
      description: 'Floor tile samples - Living and dining areas',
      submittedBy: 'ABC Construction Sdn Bhd',
      submittedDate: new Date('2024-01-12').toISOString(),
      requiredOnSiteDate: new Date('2024-02-01').toISOString(),
      architectReviewDue: new Date('2024-01-19').toISOString(),
      reviewedBy: 'Ar. Ahmad bin Abdullah',
      reviewedDate: new Date('2024-01-17').toISOString(),
      status: 'approved_as_noted',
      actionRequired: 'none',
      reviewComments: 'Approved as noted. Use Option B (Porcelain tile - Beige). Ensure anti-slip rating R10 minimum.',
      revisionNumber: 0,
      attachments: [
        {
          id: '3',
          name: 'Tile_Samples_Photos.pdf',
          url: '/uploads/tiles.pdf',
          type: 'application/pdf',
          uploadedDate: new Date('2024-01-12').toISOString()
        }
      ],
      createdAt: new Date('2024-01-12').toISOString(),
      updatedAt: new Date('2024-01-17').toISOString()
    },
    {
      id: '4',
      submittalNumber: 'SUB-004',
      projectId: 'proj-1',
      type: 'method_statement',
      category: 'Formwork',
      description: 'Method statement for post-tensioned slab construction',
      specSection: '03200',
      submittedBy: 'DEF Formwork Specialist',
      submittedDate: new Date('2024-01-20').toISOString(),
      architectReviewDue: new Date('2024-01-27').toISOString(),
      status: 'rejected',
      actionRequired: 'contractor_resubmission',
      reviewComments: 'Rejected. Method does not comply with structural engineer recommendations. Revise and resubmit with structural engineer endorsement.',
      revisionNumber: 0,
      attachments: [
        {
          id: '4',
          name: 'PT_Slab_Method_Statement.pdf',
          url: '/uploads/method.pdf',
          type: 'application/pdf',
          uploadedDate: new Date('2024-01-20').toISOString()
        }
      ],
      createdAt: new Date('2024-01-20').toISOString(),
      updatedAt: new Date('2024-01-23').toISOString()
    }
  ])

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [formData, setFormData] = useState({
    type: 'material' as Submittal['type'],
    category: '',
    description: '',
    specSection: '',
    requiredOnSiteDate: ''
  })

  const getStatusBadge = (status: Submittal['status']) => {
    const config: Record<Submittal['status'], { label: string; className: string; icon: React.ReactNode }> = {
      received: {
        label: 'Received',
        className: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: <FileText className="h-3 w-3" />
      },
      under_review: {
        label: 'Under Review',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: <Clock className="h-3 w-3" />
      },
      approved: {
        label: 'Approved',
        className: 'bg-green-100 text-green-800 border-green-300',
        icon: <CheckCircle className="h-3 w-3" />
      },
      approved_as_noted: {
        label: 'Approved as Noted',
        className: 'bg-teal-100 text-teal-800 border-teal-300',
        icon: <CheckCircle className="h-3 w-3" />
      },
      rejected: {
        label: 'Rejected',
        className: 'bg-red-100 text-red-800 border-red-300',
        icon: <XCircle className="h-3 w-3" />
      },
      resubmit: {
        label: 'Resubmit Required',
        className: 'bg-orange-100 text-orange-800 border-orange-300',
        icon: <AlertTriangle className="h-3 w-3" />
      }
    }

    return (
      <Badge variant="outline" className={cn('flex items-center gap-1', config[status].className)}>
        {config[status].icon}
        {config[status].label}
      </Badge>
    )
  }

  const getTypeLabel = (type: Submittal['type']) => {
    const labels: Record<Submittal['type'], string> = {
      material: 'Material',
      shop_drawing: 'Shop Drawing',
      sample: 'Sample',
      product_data: 'Product Data',
      method_statement: 'Method Statement',
      catalog: 'Catalog'
    }
    return labels[type]
  }

  const getDaysUntilDue = (dueDate: string) => {
    const days = differenceInDays(new Date(dueDate), new Date())
    if (days < 0) return { text: `${Math.abs(days)}d overdue`, className: 'text-red-600 font-medium' }
    if (days === 0) return { text: 'Due today', className: 'text-orange-600 font-medium' }
    if (days <= 3) return { text: `${days}d left`, className: 'text-yellow-600' }
    return { text: `${days}d left`, className: 'text-muted-foreground' }
  }

  const handleReview = (submittalId: string, action: 'approve' | 'approve_as_noted' | 'reject') => {
    const statusMap = {
      approve: 'approved' as const,
      approve_as_noted: 'approved_as_noted' as const,
      reject: 'rejected' as const
    }

    setSubmittals(submittals.map(s =>
      s.id === submittalId
        ? {
            ...s,
            status: statusMap[action],
            reviewedBy: 'Ar. Ahmad bin Abdullah',
            reviewedDate: new Date().toISOString(),
            actionRequired: action === 'reject' ? 'contractor_resubmission' : 'none',
            updatedAt: new Date().toISOString()
          }
        : s
    ))

    const actionLabels = {
      approve: 'approved',
      approve_as_noted: 'approved as noted',
      reject: 'rejected'
    }

    toast.success(`Submittal ${actionLabels[action]}`)
  }

  const stats = {
    total: submittals.length,
    received: submittals.filter(s => s.status === 'received').length,
    underReview: submittals.filter(s => s.status === 'under_review').length,
    approved: submittals.filter(s => s.status === 'approved' || s.status === 'approved_as_noted').length,
    rejected: submittals.filter(s => s.status === 'rejected' || s.status === 'resubmit').length,
    overdue: submittals.filter(s =>
      (s.status === 'received' || s.status === 'under_review') &&
      new Date(s.architectReviewDue) < new Date()
    ).length
  }

  return (
    <PageWrapper title="Submittal Tracking">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Submittals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Received</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.received}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Under Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.underReview}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Overdue Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.overdue}</div>
            </CardContent>
          </Card>
        </div>

        {/* Submittal List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Submittal Register</CardTitle>
              <div className="flex items-center gap-2">
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Log Submittal
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Register
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Submittal No.</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Submitted By</TableHead>
                    <TableHead>Submitted Date</TableHead>
                    <TableHead>Review Due</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submittals.map((submittal) => {
                    const dueStatus = submittal.status === 'under_review' || submittal.status === 'received'
                      ? getDaysUntilDue(submittal.architectReviewDue)
                      : null

                    return (
                      <TableRow key={submittal.id}>
                        <TableCell className="font-medium">
                          <div>
                            {submittal.submittalNumber}
                            {submittal.revisionNumber > 0 && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Rev {submittal.revisionNumber}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{getTypeLabel(submittal.type)}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{submittal.category}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {submittal.description}
                            </p>
                            {submittal.attachments.length > 0 && (
                              <div className="flex items-center gap-1 mt-1">
                                <Paperclip className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {submittal.attachments.length} file(s)
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{submittal.submittedBy}</TableCell>
                        <TableCell>
                          {format(new Date(submittal.submittedDate), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">
                              {format(new Date(submittal.architectReviewDue), 'dd MMM yyyy')}
                            </p>
                            {dueStatus && (
                              <p className={cn('text-xs', dueStatus.className)}>
                                {dueStatus.text}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(submittal.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {(submittal.status === 'received' || submittal.status === 'under_review') && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-green-600"
                                  onClick={() => handleReview(submittal.id, 'approve')}
                                  title="Approve"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-600"
                                  onClick={() => handleReview(submittal.id, 'reject')}
                                  title="Reject"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Create Submittal Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Log New Submittal</DialogTitle>
              <DialogDescription>
                Record a submittal received from contractor or consultant
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="type">Submittal Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: Submittal['type']) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="material">Material</SelectItem>
                      <SelectItem value="shop_drawing">Shop Drawing</SelectItem>
                      <SelectItem value="sample">Sample</SelectItem>
                      <SelectItem value="product_data">Product Data</SelectItem>
                      <SelectItem value="method_statement">Method Statement</SelectItem>
                      <SelectItem value="catalog">Catalog</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Concrete, Steel, Finishes"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of the submittal"
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="specSection">Specification Section</Label>
                  <Input
                    id="specSection"
                    value={formData.specSection}
                    onChange={(e) => setFormData({ ...formData, specSection: e.target.value })}
                    placeholder="e.g., 03100"
                  />
                </div>

                <div>
                  <Label htmlFor="requiredOnSiteDate">Required On-Site Date</Label>
                  <Input
                    id="requiredOnSiteDate"
                    type="date"
                    value={formData.requiredOnSiteDate}
                    onChange={(e) => setFormData({ ...formData, requiredOnSiteDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Drag and drop files here, or click to upload
                </p>
                <Button variant="outline" className="mt-2" size="sm">
                  Choose Files
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                toast.success('Submittal logged successfully')
                setShowCreateDialog(false)
              }}>
                <FileText className="h-4 w-4 mr-2" />
                Log Submittal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageWrapper>
  )
}
