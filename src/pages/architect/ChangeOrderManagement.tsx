import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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
  DollarSign,
  Calendar,
  FileText,
  Plus,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Edit,
  Eye,
  Send,
  Calculator
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import PageWrapper from '@/components/PageWrapper'

interface ChangeOrder {
  id: string
  projectId: string
  number: string
  title: string
  description: string
  requestedBy: string
  dateRequested: Date
  category: 'client_request' | 'site_condition' | 'design_error' | 'code_compliance' | 'value_engineering'
  status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'in_progress' | 'completed'
  costImpact: number
  scheduleImpact: number // days
  originalContractAmount: number
  approvedBy?: string
  approvalDate?: Date
  attachments: string[]
  relatedRFIs?: string[]
}

export default function ChangeOrderManagement() {
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([])
  const [showNewChangeOrder, setShowNewChangeOrder] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<ChangeOrder | null>(null)
  const [filter, setFilter] = useState('all')

  // Mock data
  useEffect(() => {
    const mockOrders: ChangeOrder[] = [
      {
        id: '1',
        projectId: 'proj-1',
        number: 'CO-001',
        title: 'Additional Solar Panels Installation',
        description: 'Client requested additional 20 solar panels on roof',
        requestedBy: 'Client - Mr. Ahmad',
        dateRequested: new Date('2024-01-10'),
        category: 'client_request',
        status: 'approved',
        costImpact: 85000,
        scheduleImpact: 14,
        originalContractAmount: 2500000,
        approvedBy: 'Project Manager',
        approvalDate: new Date('2024-01-12'),
        attachments: ['solar-spec.pdf', 'revised-electrical.dwg'],
        relatedRFIs: ['RFI-015', 'RFI-016']
      },
      {
        id: '2',
        projectId: 'proj-1',
        number: 'CO-002',
        title: 'Foundation Redesign - Rock Layer',
        description: 'Unexpected rock layer requires foundation modification',
        requestedBy: 'Site Engineer',
        dateRequested: new Date('2024-01-15'),
        category: 'site_condition',
        status: 'pending_review',
        costImpact: 120000,
        scheduleImpact: 21,
        originalContractAmount: 2500000,
        attachments: ['soil-report.pdf', 'foundation-revision.dwg']
      },
      {
        id: '3',
        projectId: 'proj-1',
        number: 'CO-003',
        title: 'Premium Marble Flooring Upgrade',
        description: 'Upgrade from standard tiles to imported marble',
        requestedBy: 'Client - Mrs. Lee',
        dateRequested: new Date('2024-01-18'),
        category: 'client_request',
        status: 'draft',
        costImpact: 45000,
        scheduleImpact: 7,
        originalContractAmount: 2500000,
        attachments: ['material-samples.pdf']
      }
    ]
    setChangeOrders(mockOrders)
  }, [])

  const getStatusBadge = (status: ChangeOrder['status']) => {
    const variants: Record<ChangeOrder['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
      draft: 'secondary',
      pending_review: 'default',
      approved: 'default',
      rejected: 'destructive',
      in_progress: 'default',
      completed: 'secondary'
    }

    const colors: Record<ChangeOrder['status'], string> = {
      draft: 'text-gray-600',
      pending_review: 'text-yellow-600',
      approved: 'text-green-600',
      rejected: 'text-red-600',
      in_progress: 'text-blue-600',
      completed: 'text-gray-600'
    }

    return (
      <Badge variant={variants[status]} className={colors[status]}>
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const getCategoryBadge = (category: ChangeOrder['category']) => {
    const labels: Record<ChangeOrder['category'], string> = {
      client_request: 'Client Request',
      site_condition: 'Site Condition',
      design_error: 'Design Error',
      code_compliance: 'Code Compliance',
      value_engineering: 'Value Engineering'
    }
    return <Badge variant="outline">{labels[category]}</Badge>
  }

  const filteredOrders = changeOrders.filter(order => {
    if (filter === 'all') return true
    return order.status === filter
  })

  const stats = {
    total: changeOrders.length,
    pending: changeOrders.filter(o => o.status === 'pending_review').length,
    approved: changeOrders.filter(o => o.status === 'approved').length,
    totalCostImpact: changeOrders
      .filter(o => o.status === 'approved')
      .reduce((sum, o) => sum + o.costImpact, 0),
    totalScheduleImpact: changeOrders
      .filter(o => o.status === 'approved')
      .reduce((sum, o) => sum + o.scheduleImpact, 0),
    percentChange: ((changeOrders
      .filter(o => o.status === 'approved')
      .reduce((sum, o) => sum + o.costImpact, 0) / 2500000) * 100).toFixed(2)
  }

  return (
    <PageWrapper title="Change Order Management">
      <div className="space-y-6">
        {/* Header Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Changes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
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
              <CardTitle className="text-sm font-medium">Cost Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                RM {stats.totalCostImpact.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.percentChange}% of contract
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Schedule Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalScheduleImpact} days</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Change Orders</CardTitle>
              <div className="flex items-center gap-2">
                <Dialog open={showNewChangeOrder} onOpenChange={setShowNewChangeOrder}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New Change Order
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create Change Order</DialogTitle>
                      <DialogDescription>
                        Document changes to the original contract scope
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="co-title">Title</Label>
                        <Input id="co-title" placeholder="Brief description of change" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="co-category">Category</Label>
                          <Select>
                            <SelectTrigger id="co-category">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="client_request">Client Request</SelectItem>
                              <SelectItem value="site_condition">Site Condition</SelectItem>
                              <SelectItem value="design_error">Design Error</SelectItem>
                              <SelectItem value="code_compliance">Code Compliance</SelectItem>
                              <SelectItem value="value_engineering">Value Engineering</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="co-requested">Requested By</Label>
                          <Input id="co-requested" placeholder="Name of requestor" />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="co-description">Description</Label>
                        <Textarea
                          id="co-description"
                          placeholder="Detailed description of the change..."
                          rows={4}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="co-cost">Cost Impact (RM)</Label>
                          <Input
                            id="co-cost"
                            type="number"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <Label htmlFor="co-schedule">Schedule Impact (days)</Label>
                          <Input
                            id="co-schedule"
                            type="number"
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Related RFIs</Label>
                        <Input placeholder="e.g., RFI-001, RFI-002" />
                      </div>
                      <div>
                        <Label>Attachments</Label>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Files
                          </Button>
                          <span className="text-sm text-muted-foreground">
                            Drawings, specifications, quotes
                          </span>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowNewChangeOrder(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => {
                        toast.success('Change order created')
                        setShowNewChangeOrder(false)
                      }}>
                        Create Draft
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" size="icon">
                  <Calculator className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex items-center gap-4 mb-6">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_review">Pending Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Change Orders Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CO #</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Cost Impact</TableHead>
                    <TableHead>Schedule Impact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {order.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{getCategoryBadge(order.category)}</TableCell>
                      <TableCell>{order.requestedBy}</TableCell>
                      <TableCell>{format(order.dateRequested, 'dd MMM yyyy')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {order.costImpact > 0 ? (
                            <TrendingUp className="h-4 w-4 text-red-500" />
                          ) : order.costImpact < 0 ? (
                            <TrendingDown className="h-4 w-4 text-green-500" />
                          ) : null}
                          <span className={order.costImpact > 0 ? 'text-red-600' : 'text-green-600'}>
                            RM {Math.abs(order.costImpact).toLocaleString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.scheduleImpact > 0 && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-orange-500" />
                            <span className="text-orange-600">
                              +{order.scheduleImpact} days
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {order.status === 'pending_review' && (
                            <>
                              <Button variant="ghost" size="icon" className="text-green-600">
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-red-600">
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Summary */}
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Contract Summary</p>
                  <p className="text-xs text-muted-foreground">Impact on original contract</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">Original Contract: RM 2,500,000</p>
                  <p className="text-sm text-red-600">
                    Approved Changes: +RM {stats.totalCostImpact.toLocaleString()}
                  </p>
                  <p className="text-sm font-bold">
                    Revised Contract: RM {(2500000 + stats.totalCostImpact).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  )
}