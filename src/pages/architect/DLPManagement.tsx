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
  CheckCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  Calendar,
  Plus,
  Eye,
  Download,
  Shield,
  Loader2
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import PageWrapper from '@/components/PageWrapper'
import type { DLPManagement, DLPDefect } from '@/types/architect'
import { useDLPStore } from '@/store/architect/dlpStore'

export default function DLPManagementPage() {
  // ✅ Connect to backend store
  const { records, loading, error, fetchRecords, clearError } = useDLPStore();

  // ✅ Fetch data from backend on mount
  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // ✅ Loading state
  if (loading) {
    return (
      <PageWrapper title="DLP Management">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Loading DLP records...</span>
        </div>
      </PageWrapper>
    );
  }

  // ✅ Error state
  if (error) {
    return (
      <PageWrapper title="DLP Management">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-900 font-medium">Error: {error}</p>
          <Button
            onClick={() => {
              clearError();
              fetchRecords();
            }}
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </PageWrapper>
    );
  }


  const getDaysRemaining = (expiryDate: string) => {
    const days = differenceInDays(new Date(expiryDate), new Date())
    if (days < 0) return { text: 'Expired', className: 'text-red-600 font-medium' }
    if (days === 0) return { text: 'Expires today', className: 'text-orange-600 font-medium' }
    if (days <= 30) return { text: `${days} days left`, className: 'text-yellow-600' }
    return { text: `${days} days left`, className: 'text-muted-foreground' }
  }

  const getDefectStatusBadge = (status: DLPDefect['status']) => {
    const config: Record<DLPDefect['status'], { label: string; className: string; icon: React.ReactNode }> = {
      reported: {
        label: 'Reported',
        className: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: <AlertTriangle className="h-3 w-3" />
      },
      acknowledged: {
        label: 'Acknowledged',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: <Clock className="h-3 w-3" />
      },
      in_progress: {
        label: 'In Progress',
        className: 'bg-purple-100 text-purple-800 border-purple-300',
        icon: <Clock className="h-3 w-3" />
      },
      completed: {
        label: 'Completed',
        className: 'bg-teal-100 text-teal-800 border-teal-300',
        icon: <CheckCircle className="h-3 w-3" />
      },
      verified: {
        label: 'Verified',
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

  const getSeverityBadge = (severity: DLPDefect['severity']) => {
    const config: Record<DLPDefect['severity'], string> = {
      critical: 'bg-red-100 text-red-800 border-red-300',
      major: 'bg-orange-100 text-orange-800 border-orange-300',
      minor: 'bg-yellow-100 text-yellow-800 border-yellow-300'
    }

    return (
      <Badge variant="outline" className={config[severity]}>
        {severity.toUpperCase()}
      </Badge>
    )
  }

  const allDefects = records.flatMap(p => (p.defects || []).map(d => ({ ...d, projectName: p.projectName })))

  const stats = {
    totalProjects: records.length,
    activeProjects: records.filter(p => p.status === 'active').length,
    totalRetentionHeld: records.reduce((sum, p) => sum + (p.finalRetentionAmount || 0), 0),
    totalDefects: allDefects.length,
    openDefects: allDefects.filter(d => d.status !== 'verified' && d.status !== 'completed').length,
    criticalDefects: allDefects.filter(d => d.severity === 'critical').length
  }

  return (
    <PageWrapper title="Defects Liability Period (DLP) Management">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeProjects}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Retention Held</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                RM {(stats.totalRetentionHeld / 1000).toFixed(0)}k
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Defects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDefects}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Open Defects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.openDefects}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Critical</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.criticalDefects}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Inspections Due</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">2</div>
            </CardContent>
          </Card>
        </div>

        {/* DLP Projects */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>DLP Projects</CardTitle>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {records.map((project) => {
                const daysLeft = getDaysRemaining(project.dlpExpiryDate)
                const defects = project.defects || []
                const progressPercentage = defects.length > 0
                  ? (defects.filter(d => d.status === 'verified' || d.status === 'completed').length / defects.length) * 100
                  : 100

                return (
                  <Card key={project.id} className="border-l-4 border-l-blue-500">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-blue-600" />
                            <h3 className="text-lg font-semibold">{project.projectName}</h3>
                          </div>
                          <div className="mt-2 grid gap-2 text-sm">
                            <div className="flex items-center gap-6">
                              <div>
                                <span className="text-muted-foreground">PC Date: </span>
                                <span className="font-medium">
                                  {format(new Date(project.practicalCompletionDate), 'dd MMM yyyy')}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">DLP Period: </span>
                                <span className="font-medium">{project.dlpPeriod} months</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Expires: </span>
                                <span className="font-medium">
                                  {format(new Date(project.dlpExpiryDate), 'dd MMM yyyy')}
                                </span>
                                <span className={cn('ml-2', daysLeft.className)}>
                                  ({daysLeft.text})
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Total Retention</div>
                          <div className="text-2xl font-bold text-blue-600">
                            RM {(project.totalRetentionHeld / 1000).toFixed(0)}k
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Retention Release Status */}
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="text-sm font-medium">Half Retention (50%)</p>
                            <p className="text-xs text-muted-foreground">
                              Due: {format(new Date(project.halfDLPDate), 'dd MMM yyyy')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">
                              RM {(project.halfRetentionAmount / 1000).toFixed(0)}k
                            </p>
                            {project.halfRetentionReleased ? (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Released
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-800">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="text-sm font-medium">Final Retention (50%)</p>
                            <p className="text-xs text-muted-foreground">
                              Due: {format(new Date(project.dlpExpiryDate), 'dd MMM yyyy')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">
                              RM {(project.finalRetentionAmount / 1000).toFixed(0)}k
                            </p>
                            {project.finalRetentionReleased ? (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Released
                              </Badge>
                            ) : (
                              <Badge className="bg-blue-100 text-blue-800">
                                <Calendar className="h-3 w-3 mr-1" />
                                Scheduled
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Defects Summary */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">Defects Progress</h4>
                          <span className="text-sm text-muted-foreground">
                            {defects.filter(d => d.status === 'verified' || d.status === 'completed').length}/{defects.length} resolved
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all"
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toast.info('View defects list')}
                          >
                            View All Defects ({defects.length})
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toast.info('Add defect')}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Report Defect
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toast.info('Schedule inspection')}
                          >
                            Schedule Inspection
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Defects */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Defects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Defect No.</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Target Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allDefects.slice(0, 5).map((defect) => (
                    <TableRow key={defect.id}>
                      <TableCell className="font-medium">{defect.defectNumber}</TableCell>
                      <TableCell className="text-sm">{defect.projectName}</TableCell>
                      <TableCell className="text-sm">{defect.description}</TableCell>
                      <TableCell className="text-sm">{defect.location}</TableCell>
                      <TableCell>{getSeverityBadge(defect.severity)}</TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(defect.targetCompletionDate), 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell>{getDefectStatusBadge(defect.status)}</TableCell>
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
