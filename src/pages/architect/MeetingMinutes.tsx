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

  // ❌ MOCK DATA - TO BE REMOVED IN PHASE 2
  // TODO: Restructure UI to use store.minutes data
  // For now, keeping mock data for UI structure until Phase 2 refactoring
  const meetings: MeetingMinutes[] = [
    {
      id: '1',
      meetingNumber: 'MOM-001',
      projectId: 'proj-1',
      meetingType: 'site_progress',
      title: 'Monthly Site Progress Meeting - January 2024',
      date: new Date('2024-01-15').toISOString(),
      startTime: '10:00',
      endTime: '12:00',
      venue: 'Site Office, KLCC Project',
      chairperson: 'Ar. Ahmad bin Abdullah',
      attendees: [
        { id: '1', name: 'Ahmad bin Abdullah', company: 'XYZ Architects', role: 'Principal Architect', present: true },
        { id: '2', name: 'John Tan', company: 'ABC Construction', role: 'Project Manager', present: true },
        { id: '3', name: 'Siti Aminah', company: 'Client Rep', role: 'Project Owner', present: true },
        { id: '4', name: 'Ir. Kumar', company: 'ABC Consulting', role: 'Structural Engineer', present: true }
      ],
      apologies: ['Ir. Lee - M&E Consultant'],
      agenda: [
        { id: '1', number: '1.0', title: 'Review of Previous Minutes' },
        { id: '2', number: '2.0', title: 'Project Progress Update' },
        { id: '3', number: '3.0', title: 'Outstanding Issues' },
        { id: '4', number: '4.0', title: 'Any Other Business' }
      ],
      previousMinutesReview: { reviewed: true, comments: 'All action items from MOM-001 have been completed' },
      matters: [
        {
          id: '1',
          agendaItemNumber: '2.0',
          matter: 'Overall project progress is at 45%, slightly behind schedule due to recent rain delays',
          discussionPoints: [
            'Concrete works for Level 5 completed',
            'Formwork for Level 6 in progress',
            'MEP rough-in on Levels 1-3 ongoing'
          ]
        }
      ],
      actionItems: [
        {
          id: '1',
          actionNumber: 'A-001',
          description: 'Submit revised construction schedule accounting for rain delays',
          assignedTo: 'Project Manager',
          company: 'ABC Construction',
          dueDate: new Date('2024-01-22').toISOString(),
          priority: 'high',
          status: 'pending'
        },
        {
          id: '2',
          actionNumber: 'A-002',
          description: 'Provide shop drawings for curtain wall system',
          assignedTo: 'Facade Contractor',
          company: 'XYZ Facade',
          dueDate: new Date('2024-01-29').toISOString(),
          priority: 'urgent',
          status: 'in_progress'
        }
      ],
      decisions: [
        {
          id: '1',
          decisionNumber: 'D-001',
          decision: 'Approved extension of 7 days for concrete works due to weather delays',
          madeBy: 'Ar. Ahmad & Client Rep',
          impact: 'time'
        }
      ],
      nextMeetingDate: new Date('2024-02-15').toISOString(),
      status: 'approved',
      circulatedDate: new Date('2024-01-16').toISOString(),
      preparedBy: 'Site Clerk of Works',
      createdAt: new Date('2024-01-15').toISOString(),
      updatedAt: new Date('2024-01-16').toISOString()
    }
  ];

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
    total: meetings.length,
    draft: meetings.filter(m => m.status === 'draft').length,
    circulated: meetings.filter(m => m.status === 'circulated').length,
    approved: meetings.filter(m => m.status === 'approved').length,
    totalActionItems: meetings.reduce((sum, m) => sum + m.actionItems.length, 0),
    pendingActions: meetings.reduce((sum, m) =>
      sum + m.actionItems.filter(a => a.status === 'pending' || a.status === 'in_progress').length, 0
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
                  {meetings.map((meeting) => (
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
                          <span className="text-sm">{meeting.actionItems.length} actions</span>
                          {meeting.actionItems.filter(a => a.status === 'pending' || a.status === 'in_progress').length > 0 && (
                            <Badge variant="outline" className="ml-1 text-xs bg-orange-50">
                              {meeting.actionItems.filter(a => a.status === 'pending' || a.status === 'in_progress').length} pending
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
