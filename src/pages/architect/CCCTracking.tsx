import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Shield,
  FileCheck,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Building,
  FileText,
  Upload,
  Download,
  Eye,
  Plus,
  Search,
  Filter,
  Loader2
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { toast } from 'sonner'
import PageWrapper from '@/components/PageWrapper'
import { cn } from '@/lib/utils'
import type { CCCTracking, CCCInspection, CCCDocument } from '@/types/architect'
import { useCCCApplicationsStore } from '@/store/architect/cccApplicationsStore'

export default function CCCTrackingPage() {
  // ✅ Connect to backend store
  const { applications, loading, error, fetchApplications, clearError } = useCCCApplicationsStore();

  // ✅ Fetch data from backend on mount
  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // ✅ Loading state
  if (loading) {
    return (
      <PageWrapper title="CCC Tracking System">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Loading CCC applications...</span>
        </div>
      </PageWrapper>
    );
  }

  // ✅ Error state
  if (error) {
    return (
      <PageWrapper title="CCC Tracking System">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-900 font-medium">Error: {error}</p>
          <Button
            onClick={() => {
              clearError();
              fetchApplications();
            }}
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </PageWrapper>
    );
  }

  const [showNewApplication, setShowNewApplication] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<CCCTracking | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)

  const getStatusBadge = (status: CCCTracking['status']) => {
    const config: Record<CCCTracking['status'], { label: string; className: string; icon: React.ReactNode }> = {
      draft: { label: 'Draft', className: 'bg-gray-100 text-gray-800 border-gray-300', icon: <FileText className="h-3 w-3" /> },
      submitted: { label: 'Submitted', className: 'bg-blue-100 text-blue-800 border-blue-300', icon: <Upload className="h-3 w-3" /> },
      under_review: { label: 'Under Review', className: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: <Clock className="h-3 w-3" /> },
      pending_documents: { label: 'Pending Documents', className: 'bg-orange-100 text-orange-800 border-orange-300', icon: <AlertTriangle className="h-3 w-3" /> },
      inspections_scheduled: { label: 'Inspections Scheduled', className: 'bg-purple-100 text-purple-800 border-purple-300', icon: <Calendar className="h-3 w-3" /> },
      inspections_completed: { label: 'Inspections Completed', className: 'bg-indigo-100 text-indigo-800 border-indigo-300', icon: <CheckCircle className="h-3 w-3" /> },
      approved: { label: 'Approved', className: 'bg-green-100 text-green-800 border-green-300', icon: <CheckCircle className="h-3 w-3" /> },
      rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800 border-red-300', icon: <XCircle className="h-3 w-3" /> },
      issued: { label: 'CCC Issued', className: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: <Shield className="h-3 w-3" /> }
    }

    return (
      <Badge variant="outline" className={cn('flex items-center gap-1', config[status].className)}>
        {config[status].icon}
        {config[status].label}
      </Badge>
    )
  }

  const getInspectionStatusBadge = (status: CCCInspection['status']) => {
    const config = {
      scheduled: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      passed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      rescheduled: 'bg-orange-100 text-orange-800'
    }

    return <Badge variant="outline" className={config[status]}>
      {status.replace('_', ' ')}
    </Badge>
  }

  const getDocumentStatusBadge = (status: CCCDocument['status']) => {
    const config = {
      pending: 'bg-gray-100 text-gray-800',
      uploaded: 'bg-blue-100 text-blue-800',
      verified: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      expired: 'bg-orange-100 text-orange-800'
    }

    return <Badge variant="outline" className={config[status]}>
      {status}
    </Badge>
  }

  const getAuthorityName = (code: string): string => {
    const authorities: Record<string, string> = {
      'DBKL': 'Dewan Bandaraya Kuala Lumpur',
      'MBPJ': 'Majlis Bandaraya Petaling Jaya',
      'MPPJ': 'Majlis Perbandaran Petaling Jaya',
      'MBSA': 'Majlis Bandaraya Shah Alam',
      'MPS': 'Majlis Perbandaran Selayang',
      'MPAJ': 'Majlis Perbandaran Ampang Jaya',
      'MPSJ': 'Majlis Perbandaran Subang Jaya'
    }
    return authorities[code] || code
  }

  const getDaysRemaining = (targetDate: string | null) => {
    if (!targetDate) return null

    const days = differenceInDays(new Date(targetDate), new Date())
    if (days < 0) return { text: `${Math.abs(days)}d overdue`, className: 'text-red-600 font-medium' }
    if (days === 0) return { text: 'Due today', className: 'text-orange-600 font-medium' }
    if (days <= 7) return { text: `${days}d left`, className: 'text-yellow-600' }
    return { text: `${days}d left`, className: 'text-muted-foreground' }
  }

  const handleViewDetails = (application: CCCTracking) => {
    setSelectedApplication(application)
    setShowDetailDialog(true)
  }

  const stats = {
    total: applications.length,
    submitted: applications.filter(c => c.status === 'submitted').length,
    underReview: applications.filter(c => c.status === 'under_review').length,
    approved: applications.filter(c => c.status === 'approved').length,
    issued: applications.filter(c => c.status === 'issued').length,
    pendingInspections: applications.reduce((sum, c) =>
      sum + (c.inspections?.filter(i => i.status === 'scheduled' || i.status === 'in_progress').length || 0), 0
    )
  }

  return (
    <PageWrapper title="CCC Tracking System">
      <div className="space-y-6">
        {/* Header Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Submitted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.submitted}</div>
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
              <CardTitle className="text-sm font-medium">CCC Issued</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{stats.issued}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Inspections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pendingInspections}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>CCC Applications</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Certificate of Completion & Compliance tracking for all projects
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Dialog open={showNewApplication} onOpenChange={setShowNewApplication}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New CCC Application
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>New CCC Application</DialogTitle>
                      <DialogDescription>
                        Submit a new Certificate of Completion & Compliance application
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="project-name">Project Name</Label>
                        <Input id="project-name" placeholder="Enter project name" />
                      </div>
                      <div>
                        <Label htmlFor="project-address">Project Address</Label>
                        <Textarea id="project-address" placeholder="Full project address" rows={2} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="authority">Local Authority</Label>
                          <Select>
                            <SelectTrigger id="authority">
                              <SelectValue placeholder="Select authority" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="DBKL">DBKL - Kuala Lumpur</SelectItem>
                              <SelectItem value="MBPJ">MBPJ - Petaling Jaya</SelectItem>
                              <SelectItem value="MPPJ">MPPJ - Petaling Jaya</SelectItem>
                              <SelectItem value="MBSA">MBSA - Shah Alam</SelectItem>
                              <SelectItem value="MPS">MPS - Selayang</SelectItem>
                              <SelectItem value="MPAJ">MPAJ - Ampang Jaya</SelectItem>
                              <SelectItem value="MPSJ">MPSJ - Subang Jaya</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="building-type">Building Type</Label>
                          <Select>
                            <SelectTrigger id="building-type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="residential">Residential</SelectItem>
                              <SelectItem value="commercial">Commercial</SelectItem>
                              <SelectItem value="industrial">Industrial</SelectItem>
                              <SelectItem value="institutional">Institutional</SelectItem>
                              <SelectItem value="mixed_use">Mixed Use</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="gfa">Gross Floor Area (m²)</Label>
                          <Input id="gfa" type="number" placeholder="0" />
                        </div>
                        <div>
                          <Label htmlFor="storeys">No. of Storeys</Label>
                          <Input id="storeys" type="number" placeholder="0" />
                        </div>
                        <div>
                          <Label htmlFor="occupancy">Occupancy Load</Label>
                          <Input id="occupancy" type="number" placeholder="0" />
                        </div>
                      </div>
                      <div>
                        <Label>Required Documents</Label>
                        <div className="mt-2 space-y-2 text-sm">
                          <p className="text-muted-foreground">Please prepare the following documents:</p>
                          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            <li>Approved building plans</li>
                            <li>Structural engineer's certificate</li>
                            <li>MEP engineer's certificate</li>
                            <li>Fire safety compliance certificate</li>
                            <li>Accessibility compliance report</li>
                            <li>Environmental compliance certificate</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowNewApplication(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => {
                        toast.success('CCC application created')
                        setShowNewApplication(false)
                      }}>
                        Create Application
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Application #</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Authority</TableHead>
                    <TableHead>Building Type</TableHead>
                    <TableHead>Submission Date</TableHead>
                    <TableHead>Target Date</TableHead>
                    <TableHead>Inspections</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((application) => {
                    const daysRemaining = getDaysRemaining(application.targetCompletionDate)
                    const passedInspections = application.inspections?.filter(i => i.status === 'passed').length || 0
                    const totalInspections = application.inspections?.length || 0

                    return (
                      <TableRow key={application.id}>
                        <TableCell className="font-medium">{application.applicationNumber}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{application.projectName}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {application.projectAddress}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{application.authority}</p>
                            <p className="text-xs text-muted-foreground">{getAuthorityName(application.authority)}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {application.buildingType.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(application.submissionDate), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{format(new Date(application.targetCompletionDate), 'dd MMM')}</p>
                            {daysRemaining && (
                              <p className={daysRemaining.className}>
                                {daysRemaining.text}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {totalInspections > 0 ? (
                            <div className="text-sm">
                              <p className="font-medium">{passedInspections}/{totalInspections}</p>
                              <p className="text-muted-foreground">passed</p>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">None scheduled</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(application.status)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetails(application)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* CCC Application Detail Dialog */}
        {selectedApplication && (
          <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{selectedApplication.applicationNumber}</DialogTitle>
                <DialogDescription>{selectedApplication.projectName}</DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Application Info */}
                <div>
                  <h4 className="font-semibold mb-3">Application Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Authority</p>
                      <p className="font-medium">{getAuthorityName(selectedApplication.authority)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Building Type</p>
                      <p className="font-medium capitalize">{selectedApplication.buildingType.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Gross Floor Area</p>
                      <p className="font-medium">{selectedApplication.grossFloorArea.toLocaleString()} m²</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Number of Storeys</p>
                      <p className="font-medium">{selectedApplication.numberOfStoreys}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      {getStatusBadge(selectedApplication.status)}
                    </div>
                    <div>
                      <p className="text-muted-foreground">Target Completion</p>
                      <p className="font-medium">{format(new Date(selectedApplication.targetCompletionDate), 'dd MMM yyyy')}</p>
                    </div>
                  </div>
                </div>

                {/* Compliance Checklist */}
                <div>
                  <h4 className="font-semibold mb-3">Compliance Checklist</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(selectedApplication.complianceChecklist).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                        {value ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="text-sm capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Inspections */}
                {selectedApplication.inspections.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Inspections</h4>
                    <div className="space-y-2">
                      {selectedApplication.inspections.map((inspection) => (
                        <div key={inspection.id} className="border rounded-lg p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium capitalize">
                                  {inspection.inspectionType.replace('_', ' ')} Inspection
                                </p>
                                {getInspectionStatusBadge(inspection.status)}
                              </div>
                              <div className="text-sm text-muted-foreground space-y-1">
                                <p>Inspector: {inspection.inspector}</p>
                                <p>Scheduled: {format(new Date(inspection.scheduledDate), 'dd MMM yyyy')}</p>
                                {inspection.completedDate && (
                                  <p>Completed: {format(new Date(inspection.completedDate), 'dd MMM yyyy')}</p>
                                )}
                                {inspection.findings && (
                                  <p className="mt-2 text-foreground">{inspection.findings}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Documents */}
                <div>
                  <h4 className="font-semibold mb-3">Required Documents</h4>
                  <div className="space-y-2">
                    {selectedApplication.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{doc.documentName}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {doc.documentType.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getDocumentStatusBadge(doc.status)}
                          {doc.status === 'pending' && (
                            <Button variant="outline" size="sm">
                              <Upload className="h-3 w-3 mr-1" />
                              Upload
                            </Button>
                          )}
                          {doc.status === 'verified' && (
                            <Button variant="ghost" size="sm">
                              <Download className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Remarks */}
                {selectedApplication.remarks && (
                  <div>
                    <h4 className="font-semibold mb-2">Remarks</h4>
                    <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded">
                      {selectedApplication.remarks}
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                  Close
                </Button>
                <Button>
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </PageWrapper>
  )
}
