import React from 'react'
import { CheckCircle, XCircle, Clock, Circle } from 'lucide-react'
import { format } from 'date-fns'
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

interface ApprovalTimelineProps {
  approvals: Approval[]
  className?: string
}

export function ApprovalTimeline({ approvals, className }: ApprovalTimelineProps) {
  if (approvals.length === 0) {
    return (
      <div className={cn("text-center py-8 text-muted-foreground", className)}>
        <Circle className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No approval steps configured</p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-0", className)}>
      {approvals.map((approval, index) => {
        const isLast = index === approvals.length - 1
        const isPending = approval.status === 'pending'
        const isApproved = approval.status === 'approved'
        const isRejected = approval.status === 'rejected'

        return (
          <div key={approval.id} className="relative">
            {/* Connector line */}
            {!isLast && (
              <div
                className={cn(
                  "absolute left-[15px] top-[36px] w-0.5 h-full",
                  isApproved ? "bg-green-300" : "bg-gray-300"
                )}
              />
            )}

            {/* Timeline item */}
            <div className="flex gap-4 pb-8">
              {/* Icon */}
              <div className="flex-shrink-0 relative z-10">
                {isApproved && (
                  <div className="w-8 h-8 rounded-full bg-green-100 border-2 border-green-500 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                )}
                {isRejected && (
                  <div className="w-8 h-8 rounded-full bg-red-100 border-2 border-red-500 flex items-center justify-center">
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                )}
                {isPending && (
                  <div className="w-8 h-8 rounded-full bg-yellow-100 border-2 border-yellow-500 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <p className="font-medium text-gray-900">{approval.approverName}</p>
                    <p className="text-sm text-gray-600">{approval.approverRole}</p>
                  </div>
                  {approval.date && (
                    <p className="text-sm text-gray-500">
                      {format(new Date(approval.date), 'dd MMM yyyy')}
                    </p>
                  )}
                </div>

                {/* Status */}
                <div className="mt-2">
                  {isApproved && (
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Approved
                    </div>
                  )}
                  {isRejected && (
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Rejected
                    </div>
                  )}
                  {isPending && (
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Pending Review
                    </div>
                  )}
                </div>

                {/* Comments */}
                {approval.comments && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-700 italic">"{approval.comments}"</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
