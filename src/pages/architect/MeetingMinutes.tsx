import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  FileText,
  CheckCircle,
  Clock,
  Users,
  Plus,
  Eye,
  Download,
  ClipboardList,
  Loader2
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import PageWrapper from '@/components/PageWrapper'
import type { MeetingMinutes } from '@/types/architect'
import { useMeetingMinutesStore } from '@/store/architect/meetingMinutesStore'

export default function MeetingMinutesManagement() {
  // ✅ Connect to backend store
  const { minutes, loading, error, fetchMinutes, clearError } = useMeetingMinutesStore();

  // ✅ Fetch data from backend on mount
  useEffect(() => {
    fetchMinutes();
  }, [fetchMinutes]);

  // ✅ Loading state
  if (loading) {
    return (
      <PageWrapper title="Meeting Minutes">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Loading meeting minutes...</span>
        </div>
      </PageWrapper>
    );
  }

  // ✅ Error state
  if (error) {
    return (
      <PageWrapper title="Meeting Minutes">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-900 font-medium">Error: {error}</p>
          <Button
            onClick={() => {
              clearError();
              fetchMinutes();
            }}
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </PageWrapper>
    );
  }


  const getStatusBadge = (status: MeetingMinutes['status']) => {
    const config: Record<MeetingMinutes['status'], { label: string; className: string; icon: React.ReactNode }> = {
      draft: {
        label: 'Draft',
        className: 'bg-gray-100 text-gray-800 border-gray-300',
        icon: <FileText className="h-3 w-3" />
      },
      circulated: {
        label: 'Circulated',
        className: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: <Clock className="h-3 w-3" />
      },
      approved: {
        label: 'Approved',
        className: 'bg-green-100 text-green-800 border-green-300',
        icon: <CheckCircle className="h-3 w-3" />
      }
    }

    return (
      <Badge variant="outline" className={cn('flex items-center gap-1', config[status].className)}>
        {config[status].icon}
        {config[status].label}
      </Badge>
    )
  }

  const getMeetingTypeLabel = (type: MeetingMinutes['meetingType']) => {
    const labels: Record<MeetingMinutes['meetingType'], string> = {
      site_progress: 'Site Progress',
      coordination: 'Coordination',
      safety: 'Safety',
      design_review: 'Design Review',
      client: 'Client Meeting',
      pre_construction: 'Pre-Construction'
    }
    return labels[type]
  }

  const stats = {
    total: minutes.length,
    draft: minutes.filter(m => m.status === 'draft').length,
    circulated: minutes.filter(m => m.status === 'circulated').length,
    approved: minutes.filter(m => m.status === 'approved').length,
    totalActionItems: minutes.reduce((sum, m) => sum + (m.actionItems?.length || 0), 0),
    pendingActions: minutes.reduce((sum, m) =>
      sum + (m.actionItems?.filter(a => a.status === 'pending' || a.status === 'in_progress').length || 0), 0
    )
  }

  return (
    <PageWrapper title="Meeting Minutes">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Meetings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Draft</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Circulated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.circulated}</div>
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
              <CardTitle className="text-sm font-medium">Total Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.totalActionItems}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pendingActions}</div>
            </CardContent>
          </Card>
        </div>

        {/* Meeting List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Meeting Minutes Register</CardTitle>
              <div className="flex items-center gap-2">
                <Button onClick={() => toast.info('Create meeting dialog')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Minutes
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
                    <TableHead>MOM No.</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Meeting</TableHead>
                    <TableHead>Attendees</TableHead>
                    <TableHead>Action Items</TableHead>
                    <TableHead>Decisions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {minutes.map((meeting) => (
                    <TableRow key={meeting.id}>
                      <TableCell className="font-medium">{meeting.meetingNumber}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{format(new Date(meeting.date), 'dd MMM yyyy')}</p>
                          <p className="text-muted-foreground">
                            {meeting.startTime} - {meeting.endTime}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <Badge variant="secondary" className="mb-1">
                            {getMeetingTypeLabel(meeting.meetingType)}
                          </Badge>
                          <p className="font-medium text-sm">{meeting.title}</p>
                          <p className="text-xs text-muted-foreground">{meeting.venue}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {meeting.attendees.filter(a => a.present).length} present
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <ClipboardList className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{meeting.actionItems?.length || 0} actions</span>
                          {(meeting.actionItems?.filter(a => a.status === 'pending' || a.status === 'in_progress').length || 0) > 0 && (
                            <Badge variant="outline" className="ml-1 text-xs bg-orange-50">
                              {meeting.actionItems?.filter(a => a.status === 'pending' || a.status === 'in_progress').length || 0} pending
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{meeting.decisions.length}</span>
                      </TableCell>
                      <TableCell>{getStatusBadge(meeting.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
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
