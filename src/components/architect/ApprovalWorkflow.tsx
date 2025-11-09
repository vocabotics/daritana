import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  MessageSquare,
  AlertCircle,
  CheckCheck
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Approval {
  id: string
  approverId: string
  approverName: string
  approverRole: string
  status: 'pending' | 'approved' | 'rejected'
  comments?: string
  date?: string
  signature?: string
}

interface ApprovalWorkflowProps {
  approvals: Approval[]
  currentUserId: string
  currentUserRole: string
  onApprove: (approvalId: string, comments: string) => Promise<void>
  onReject: (approvalId: string, comments: string) => Promise<void>
  title?: string
  description?: string
}

export function ApprovalWorkflow({
  approvals,
  currentUserId,
  currentUserRole,
  onApprove,
  onReject,
  title = 'Approval Workflow',
  description = 'Review and approve this item'
}: ApprovalWorkflowProps) {
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve')
  const [comments, setComments] = useState('')
  const [currentApprovalId, setCurrentApprovalId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Find the current user's pending approval
  const myPendingApproval = approvals.find(
    approval => approval.approverId === currentUserId && approval.status === 'pending'
  )

  // Check if all approvals are complete
  const allApproved = approvals.length > 0 && approvals.every(a => a.status === 'approved')
  const anyRejected = approvals.some(a => a.status === 'rejected')
  const pendingApprovals = approvals.filter(a => a.status === 'pending').length

  const handleApprovalAction = async () => {
    if (!currentApprovalId) return

    setSubmitting(true)
    try {
      if (approvalAction === 'approve') {
        await onApprove(currentApprovalId, comments)
        toast.success('Approved successfully')
      } else {
        await onReject(currentApprovalId, comments)
        toast.success('Rejected with comments')
      }
      setShowApprovalDialog(false)
      setComments('')
      setCurrentApprovalId(null)
    } catch (error) {
      toast.error('Failed to process approval')
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  const openApprovalDialog = (action: 'approve' | 'reject') => {
    if (!myPendingApproval) {
      toast.error('No pending approval found for your role')
      return
    }
    setApprovalAction(action)
    setCurrentApprovalId(myPendingApproval.id)
    setShowApprovalDialog(true)
  }

  const getStatusIcon = (status: Approval['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: Approval['status']) => {
    const variants: Record<Approval['status'], 'default' | 'secondary' | 'destructive'> = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive'
    }

    const colors: Record<Approval['status'], string> = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      approved: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300'
    }

    return (
      <Badge variant={variants[status]} className={cn('capitalize', colors[status])}>
        {status}
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {title}
              {allApproved && <CheckCheck className="h-5 w-5 text-green-600" />}
              {anyRejected && <AlertCircle className="h-5 w-5 text-red-600" />}
            </CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {allApproved && (
              <Badge className="bg-green-100 text-green-800 border-green-300">
                All Approved
              </Badge>
            )}
            {anyRejected && (
              <Badge className="bg-red-100 text-red-800 border-red-300">
                Rejected
              </Badge>
            )}
            {!allApproved && !anyRejected && pendingApprovals > 0 && (
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                {pendingApprovals} Pending
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Approval Actions (if user has pending approval) */}
        {myPendingApproval && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-blue-900">Action Required</p>
                <p className="text-sm text-blue-700 mt-1">
                  You need to review and approve/reject this item as {currentUserRole}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                  onClick={() => openApprovalDialog('reject')}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => openApprovalDialog('approve')}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Approval History */}
        <div className="space-y-4">
          {approvals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No approvals configured</p>
            </div>
          ) : (
            approvals.map((approval, index) => (
              <div
                key={approval.id}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-lg border",
                  approval.status === 'approved' && "bg-green-50 border-green-200",
                  approval.status === 'rejected' && "bg-red-50 border-red-200",
                  approval.status === 'pending' && "bg-gray-50 border-gray-200"
                )}
              >
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(approval.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900">
                        {approval.approverName}
                      </p>
                      <p className="text-sm text-gray-600">{approval.approverRole}</p>
                    </div>
                    {getStatusBadge(approval.status)}
                  </div>

                  {approval.date && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(approval.date), 'dd MMM yyyy, HH:mm')}</span>
                    </div>
                  )}

                  {approval.comments && (
                    <div className="mt-2 p-3 bg-white rounded border border-gray-200">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5" />
                        <p className="text-sm text-gray-700">{approval.comments}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalAction === 'approve' ? 'Approve Item' : 'Reject Item'}
            </DialogTitle>
            <DialogDescription>
              {approvalAction === 'approve'
                ? 'Please provide any comments about your approval (optional)'
                : 'Please provide a reason for rejection (required)'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="comments">Comments</Label>
              <Textarea
                id="comments"
                placeholder={
                  approvalAction === 'approve'
                    ? 'Add any comments or conditions...'
                    : 'Please explain why you are rejecting this...'
                }
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowApprovalDialog(false)
                setComments('')
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              className={cn(
                approvalAction === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              )}
              onClick={handleApprovalAction}
              disabled={submitting || (approvalAction === 'reject' && !comments.trim())}
            >
              {submitting ? 'Processing...' : approvalAction === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
