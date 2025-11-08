import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DollarSign,
  Calendar,
  User,
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  Building
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { ApprovalWorkflow } from './ApprovalWorkflow'
import { ApprovalTimeline } from './ApprovalTimeline'
import type { ChangeOrder } from '@/types/architect'

interface ChangeOrderDetailProps {
  changeOrder: ChangeOrder | null
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUserId: string
  currentUserRole: string
  onApprove: (changeOrderId: string, approvalId: string, comments: string) => Promise<void>
  onReject: (changeOrderId: string, approvalId: string, comments: string) => Promise<void>
}

export function ChangeOrderDetail({
  changeOrder,
  open,
  onOpenChange,
  currentUserId,
  currentUserRole,
  onApprove,
  onReject
}: ChangeOrderDetailProps) {
  if (!changeOrder) return null

  const getStatusBadge = (status: ChangeOrder['status']) => {
    const colors: Record<ChangeOrder['status'], string> = {
      draft: 'bg-gray-100 text-gray-800 border-gray-300',
      pending_review: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      approved: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-300',
      completed: 'bg-gray-100 text-gray-800 border-gray-300'
    }

    return (
      <Badge className={cn('capitalize', colors[status])}>
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const getReasonBadge = (reason: ChangeOrder['reason']) => {
    const labels: Record<ChangeOrder['reason'], string> = {
      design_change: 'Design Change',
      site_condition: 'Site Condition',
      client_request: 'Client Request',
      error_omission: 'Error/Omission',
      regulatory: 'Regulatory',
      other: 'Other'
    }
    return <Badge variant="outline">{labels[reason]}</Badge>
  }

  const handleApprove = async (approvalId: string, comments: string) => {
    await onApprove(changeOrder.id, approvalId, comments)
  }

  const handleReject = async (approvalId: string, comments: string) => {
    await onReject(changeOrder.id, approvalId, comments)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">{changeOrder.changeOrderNumber}</DialogTitle>
              <DialogDescription className="text-lg mt-1">
                {changeOrder.title}
              </DialogDescription>
            </div>
            {getStatusBadge(changeOrder.status)}
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="approvals">
              Approvals
              {changeOrder.approvals && changeOrder.approvals.length > 0 && (
                <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {changeOrder.approvals.filter(a => a.status === 'pending').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4 mt-4">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    Cost Impact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {changeOrder.costImpact > 0 ? (
                      <TrendingUp className="h-5 w-5 text-red-500" />
                    ) : changeOrder.costImpact < 0 ? (
                      <TrendingDown className="h-5 w-5 text-green-500" />
                    ) : null}
                    <span className={cn(
                      "text-2xl font-bold",
                      changeOrder.costImpact > 0 ? "text-red-600" : "text-green-600"
                    )}>
                      RM {Math.abs(changeOrder.costImpact).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    Schedule Impact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    +{changeOrder.scheduleImpact} days
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    Requested By
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <p className="font-medium">{changeOrder.requestedBy.name}</p>
                    <p className="text-sm text-gray-600">{changeOrder.requestedBy.company}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{changeOrder.description}</p>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-gray-600">Reason</span>
                  {getReasonBadge(changeOrder.reason)}
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-gray-600">Project</span>
                  <span className="font-medium">{changeOrder.projectName}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-gray-600">Created Date</span>
                  <span className="font-medium">
                    {format(new Date(changeOrder.createdAt), 'dd MMM yyyy')}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-gray-600">Original Cost</span>
                  <span className="font-medium">RM {changeOrder.originalCost.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">Revised Cost</span>
                  <span className="font-medium">RM {changeOrder.revisedCost.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Approvals Tab */}
          <TabsContent value="approvals" className="mt-4">
            <ApprovalWorkflow
              approvals={changeOrder.approvals || []}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              onApprove={handleApprove}
              onReject={handleReject}
              title="Change Order Approval Workflow"
              description="Multi-level approval required for change order implementation"
            />
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Attached Documents</CardTitle>
              </CardHeader>
              <CardContent>
                {changeOrder.documents && changeOrder.documents.length > 0 ? (
                  <div className="space-y-2">
                    {changeOrder.documents.map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium">{doc.fileName || `Document ${index + 1}`}</p>
                            <p className="text-sm text-gray-600">{doc.type || 'File'}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No documents attached</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Approval Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ApprovalTimeline approvals={changeOrder.approvals || []} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
