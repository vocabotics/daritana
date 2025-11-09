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
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  AlertTriangle,
  Receipt,
  Calendar,
  Download,
  Eye,
  FileText,
  Building,
  Loader2
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { toast } from 'sonner'
import PageWrapper from '@/components/PageWrapper'
import { cn } from '@/lib/utils'
import type { RetentionTracking } from '@/types/architect'
import { useRetentionStore } from '@/store/architect/retentionStore'

export default function RetentionTrackingPage() {
  // ✅ Connect to backend store
  const { records, loading, error, fetchRecords, clearError } = useRetentionStore();

  // ✅ Fetch data from backend on mount
  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // ✅ Loading state
  if (loading) {
    return (
      <PageWrapper title="Retention Tracking">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Loading retention records...</span>
        </div>
      </PageWrapper>
    );
  }

  // ✅ Error state
  if (error) {
    return (
      <PageWrapper title="Retention Tracking">
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

  // ❌ MOCK DATA - TO BE REMOVED IN PHASE 2
  // TODO: Restructure UI to use store.records data
  // For now, keeping mock data for UI structure until Phase 2 refactoring
  const retentionRecords: RetentionTracking[] = [
    {
      id: 'ret-1',
      projectId: 'proj-1',
      projectName: 'Residential Bungalow - Damansara Heights',
      contractSum: 2500000,
      retentionPercentage: 5,
      totalRetentionHeld: 125000,
      halfRetentionAmount: 62500,
      finalRetentionAmount: 62500,
      halfRetentionReleased: true,
      halfRetentionReleaseDate: new Date('2024-01-15').toISOString(),
      halfRetentionReleasedAmount: 62500,
      finalRetentionReleased: false,
      finalRetentionReleaseDate: null,
      finalRetentionReleasedAmount: 0,
      currentRetentionHeld: 62500,
      practicalCompletionDate: new Date('2023-07-15').toISOString(),
      dlpExpiryDate: new Date('2024-07-15').toISOString(),
      retentionSchedule: [
        {
          certificateNumber: 'PC-01',
          certificateDate: new Date('2023-03-15').toISOString(),
          certifiedAmount: 500000,
          retentionDeducted: 25000,
          retentionReleased: 25000,
          releaseDate: new Date('2024-01-15').toISOString(),
          status: 'released'
        },
        {
          certificateNumber: 'PC-02',
          certificateDate: new Date('2023-04-15').toISOString(),
          certifiedAmount: 500000,
          retentionDeducted: 25000,
          retentionReleased: 25000,
          releaseDate: new Date('2024-01-15').toISOString(),
          status: 'released'
        },
        {
          certificateNumber: 'PC-03',
          certificateDate: new Date('2023-05-15').toISOString(),
          certifiedAmount: 500000,
          retentionDeducted: 25000,
          retentionReleased: 12500,
          releaseDate: new Date('2024-01-15').toISOString(),
          status: 'partially_released'
        },
        {
          certificateNumber: 'PC-04',
          certificateDate: new Date('2023-06-15').toISOString(),
          certifiedAmount: 500000,
          retentionDeducted: 25000,
          retentionReleased: 0,
          releaseDate: null,
          status: 'held'
        },
        {
          certificateNumber: 'PC-Final',
          certificateDate: new Date('2023-07-15').toISOString(),
          certifiedAmount: 500000,
          retentionDeducted: 25000,
          retentionReleased: 0,
          releaseDate: null,
          status: 'held'
        }
      ],
      status: 'half_released',
      contractor: 'ABC Construction Sdn Bhd',
      architect: 'Ar. Ahmad bin Abdullah',
      remarks: 'Half retention released upon 6 months DLP. Final retention pending DLP completion.',
      createdAt: new Date('2023-03-15').toISOString(),
      updatedAt: new Date('2024-01-15').toISOString()
    },
    {
      id: 'ret-2',
      projectId: 'proj-2',
      projectName: 'Commercial Office Tower - KLCC',
      contractSum: 58000000,
      retentionPercentage: 5,
      totalRetentionHeld: 2900000,
      halfRetentionAmount: 1450000,
      finalRetentionAmount: 1450000,
      halfRetentionReleased: false,
      halfRetentionReleaseDate: null,
      halfRetentionReleasedAmount: 0,
      finalRetentionReleased: false,
      finalRetentionReleaseDate: null,
      finalRetentionReleasedAmount: 0,
      currentRetentionHeld: 2900000,
      practicalCompletionDate: new Date('2024-01-01').toISOString(),
      dlpExpiryDate: new Date('2026-01-01').toISOString(),
      retentionSchedule: [
        {
          certificateNumber: 'PC-01',
          certificateDate: new Date('2023-01-15').toISOString(),
          certifiedAmount: 5000000,
          retentionDeducted: 250000,
          retentionReleased: 0,
          releaseDate: null,
          status: 'held'
        },
        {
          certificateNumber: 'PC-02',
          certificateDate: new Date('2023-03-15').toISOString(),
          certifiedAmount: 8000000,
          retentionDeducted: 400000,
          retentionReleased: 0,
          releaseDate: null,
          status: 'held'
        },
        {
          certificateNumber: 'PC-03',
          certificateDate: new Date('2023-06-15').toISOString(),
          certifiedAmount: 10000000,
          retentionDeducted: 500000,
          retentionReleased: 0,
          releaseDate: null,
          status: 'held'
        },
        {
          certificateNumber: 'PC-04',
          certificateDate: new Date('2023-09-15').toISOString(),
          certifiedAmount: 12000000,
          retentionDeducted: 600000,
          retentionReleased: 0,
          releaseDate: null,
          status: 'held'
        },
        {
          certificateNumber: 'PC-05',
          certificateDate: new Date('2023-12-15').toISOString(),
          certifiedAmount: 15000000,
          retentionDeducted: 750000,
          retentionReleased: 0,
          releaseDate: null,
          status: 'held'
        },
        {
          certificateNumber: 'PC-Final',
          certificateDate: new Date('2024-01-01').toISOString(),
          certifiedAmount: 8000000,
          retentionDeducted: 400000,
          retentionReleased: 0,
          releaseDate: null,
          status: 'held'
        }
      ],
      status: 'active',
      contractor: 'DEF Construction Sdn Bhd',
      architect: 'Ar. Sarah Lee',
      remarks: 'Practical completion achieved. DLP period of 24 months.',
      createdAt: new Date('2023-01-15').toISOString(),
      updatedAt: new Date('2024-01-01').toISOString()
    }
  ];

  const [selectedRecord, setSelectedRecord] = useState<RetentionTracking | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)

  const getStatusBadge = (status: RetentionTracking['status']) => {
    const config = {
      active: { label: 'Active', className: 'bg-blue-100 text-blue-800', icon: <Clock className="h-3 w-3" /> },
      half_released: { label: 'Half Released', className: 'bg-yellow-100 text-yellow-800', icon: <TrendingUp className="h-3 w-3" /> },
      fully_released: { label: 'Fully Released', className: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3" /> },
      overdue: { label: 'Release Overdue', className: 'bg-red-100 text-red-800', icon: <AlertTriangle className="h-3 w-3" /> }
    }

    return (
      <Badge variant="outline" className={cn('flex items-center gap-1', config[status].className)}>
        {config[status].icon}
        {config[status].label}
      </Badge>
    )
  }

  const getCertificateStatusBadge = (status: 'held' | 'partially_released' | 'released') => {
    const config = {
      held: 'bg-gray-100 text-gray-800',
      partially_released: 'bg-yellow-100 text-yellow-800',
      released: 'bg-green-100 text-green-800'
    }

    return (
      <Badge variant="outline" className={config[status]}>
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const getDaysToRelease = (dlpExpiryDate: string, isHalfRelease: boolean) => {
    const targetDate = isHalfRelease
      ? new Date(new Date(dlpExpiryDate).getTime() - (365 * 24 * 60 * 60 * 1000)) // 1 year before expiry (assumes 2-year DLP)
      : new Date(dlpExpiryDate)

    const days = differenceInDays(targetDate, new Date())

    if (days < 0) return { text: `${Math.abs(days)}d overdue`, className: 'text-red-600 font-medium', overdue: true }
    if (days === 0) return { text: 'Release today', className: 'text-orange-600 font-medium', overdue: false }
    if (days <= 30) return { text: `${days}d until release`, className: 'text-yellow-600', overdue: false }
    return { text: `${days}d until release`, className: 'text-muted-foreground', overdue: false }
  }

  const handleViewDetails = (record: RetentionTracking) => {
    setSelectedRecord(record)
    setShowDetailDialog(true)
  }

  const handleReleaseRetention = (recordId: string, releaseType: 'half' | 'full') => {
    setRetentionRecords(records =>
      records.map(r => {
        if (r.id !== recordId) return r

        if (releaseType === 'half') {
          return {
            ...r,
            halfRetentionReleased: true,
            halfRetentionReleaseDate: new Date().toISOString(),
            halfRetentionReleasedAmount: r.halfRetentionAmount,
            currentRetentionHeld: r.finalRetentionAmount,
            status: 'half_released' as const,
            updatedAt: new Date().toISOString()
          }
        } else {
          return {
            ...r,
            finalRetentionReleased: true,
            finalRetentionReleaseDate: new Date().toISOString(),
            finalRetentionReleasedAmount: r.finalRetentionAmount,
            currentRetentionHeld: 0,
            status: 'fully_released' as const,
            updatedAt: new Date().toISOString()
          }
        }
      })
    )

    toast.success(`${releaseType === 'half' ? 'Half' : 'Full'} retention release processed`)
  }

  const stats = {
    totalProjects: retentionRecords.length,
    totalHeld: retentionRecords.reduce((sum, r) => sum + r.currentRetentionHeld, 0),
    totalReleased: retentionRecords.reduce((sum, r) =>
      sum + r.halfRetentionReleasedAmount + r.finalRetentionReleasedAmount, 0
    ),
    pendingRelease: retentionRecords.filter(r =>
      !r.halfRetentionReleased || !r.finalRetentionReleased
    ).length,
    overdueReleases: retentionRecords.filter(r => {
      if (!r.halfRetentionReleased) {
        const halfRelease = getDaysToRelease(r.dlpExpiryDate, true)
        if (halfRelease.overdue) return true
      }
      if (!r.finalRetentionReleased) {
        const fullRelease = getDaysToRelease(r.dlpExpiryDate, false)
        if (fullRelease.overdue) return true
      }
      return false
    }).length
  }

  return (
    <PageWrapper title="Retention Money Tracking">
      <div className="space-y-6">
        {/* Header Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProjects}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Held</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                RM {(stats.totalHeld / 1000).toFixed(0)}k
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Released</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                RM {(stats.totalReleased / 1000).toFixed(0)}k
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Release</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingRelease}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Overdue Releases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.overdueReleases}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Retention Tracking</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Track retention money deductions and releases across all projects
                </p>
              </div>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Contractor</TableHead>
                    <TableHead>Contract Sum</TableHead>
                    <TableHead>Retention %</TableHead>
                    <TableHead>Total Held</TableHead>
                    <TableHead>Current Held</TableHead>
                    <TableHead>Released</TableHead>
                    <TableHead>DLP Expiry</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {retentionRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{record.projectName}</p>
                          <p className="text-xs text-muted-foreground">{record.projectId}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{record.contractor}</TableCell>
                      <TableCell className="font-medium">
                        RM {(record.contractSum / 1000).toFixed(0)}k
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{record.retentionPercentage}%</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        RM {(record.totalRetentionHeld / 1000).toFixed(0)}k
                      </TableCell>
                      <TableCell className="font-bold text-blue-600">
                        RM {(record.currentRetentionHeld / 1000).toFixed(0)}k
                      </TableCell>
                      <TableCell className="text-green-600">
                        RM {((record.halfRetentionReleasedAmount + record.finalRetentionReleasedAmount) / 1000).toFixed(0)}k
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(record.dlpExpiryDate), 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDetails(record)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Retention Detail Dialog */}
        {selectedRecord && (
          <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{selectedRecord.projectName}</DialogTitle>
                <DialogDescription>Retention tracking and release schedule</DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Project Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Contract Sum</p>
                    <p className="text-2xl font-bold">RM {selectedRecord.contractSum.toLocaleString()}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Retention ({selectedRecord.retentionPercentage}%)</p>
                    <p className="text-2xl font-bold">RM {selectedRecord.totalRetentionHeld.toLocaleString()}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Current Held</p>
                    <p className="text-2xl font-bold text-blue-600">
                      RM {selectedRecord.currentRetentionHeld.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Retention Release Status */}
                <div>
                  <h4 className="font-semibold mb-3">Retention Release Status</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Half Retention */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm font-medium">Half Retention (50%)</p>
                          <p className="text-xs text-muted-foreground">
                            Released at 6 months or mid-DLP
                          </p>
                        </div>
                        <Badge className={selectedRecord.halfRetentionReleased ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {selectedRecord.halfRetentionReleased ? (
                            <><CheckCircle className="h-3 w-3 mr-1" /> Released</>
                          ) : (
                            <><Clock className="h-3 w-3 mr-1" /> Pending</>
                          )}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Amount:</span>
                          <span className="font-medium">RM {selectedRecord.halfRetentionAmount.toLocaleString()}</span>
                        </div>
                        {selectedRecord.halfRetentionReleased ? (
                          <>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Released:</span>
                              <span className="font-medium text-green-600">
                                RM {selectedRecord.halfRetentionReleasedAmount.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Release Date:</span>
                              <span className="font-medium">
                                {selectedRecord.halfRetentionReleaseDate &&
                                  format(new Date(selectedRecord.halfRetentionReleaseDate), 'dd MMM yyyy')}
                              </span>
                            </div>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            className="w-full mt-2"
                            onClick={() => handleReleaseRetention(selectedRecord.id, 'half')}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Release Half Retention
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Final Retention */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm font-medium">Final Retention (50%)</p>
                          <p className="text-xs text-muted-foreground">
                            Released at DLP expiry: {format(new Date(selectedRecord.dlpExpiryDate), 'dd MMM yyyy')}
                          </p>
                        </div>
                        <Badge className={selectedRecord.finalRetentionReleased ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {selectedRecord.finalRetentionReleased ? (
                            <><CheckCircle className="h-3 w-3 mr-1" /> Released</>
                          ) : (
                            <><Clock className="h-3 w-3 mr-1" /> Pending</>
                          )}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Amount:</span>
                          <span className="font-medium">RM {selectedRecord.finalRetentionAmount.toLocaleString()}</span>
                        </div>
                        {selectedRecord.finalRetentionReleased ? (
                          <>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Released:</span>
                              <span className="font-medium text-green-600">
                                RM {selectedRecord.finalRetentionReleasedAmount.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Release Date:</span>
                              <span className="font-medium">
                                {selectedRecord.finalRetentionReleaseDate &&
                                  format(new Date(selectedRecord.finalRetentionReleaseDate), 'dd MMM yyyy')}
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Days to release:</span>
                              <span className={getDaysToRelease(selectedRecord.dlpExpiryDate, false).className}>
                                {getDaysToRelease(selectedRecord.dlpExpiryDate, false).text}
                              </span>
                            </div>
                            <Button
                              size="sm"
                              className="w-full mt-2"
                              onClick={() => handleReleaseRetention(selectedRecord.id, 'full')}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Release Final Retention
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Certificate Schedule */}
                <div>
                  <h4 className="font-semibold mb-3">Payment Certificate Schedule</h4>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Certificate #</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Certified Amount</TableHead>
                          <TableHead>Retention Deducted</TableHead>
                          <TableHead>Retention Released</TableHead>
                          <TableHead>Release Date</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedRecord.retentionSchedule.map((cert, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{cert.certificateNumber}</TableCell>
                            <TableCell className="text-sm">
                              {format(new Date(cert.certificateDate), 'dd MMM yyyy')}
                            </TableCell>
                            <TableCell>RM {cert.certifiedAmount.toLocaleString()}</TableCell>
                            <TableCell className="text-red-600">
                              -RM {cert.retentionDeducted.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-green-600">
                              {cert.retentionReleased > 0
                                ? `+RM ${cert.retentionReleased.toLocaleString()}`
                                : '-'}
                            </TableCell>
                            <TableCell className="text-sm">
                              {cert.releaseDate
                                ? format(new Date(cert.releaseDate), 'dd MMM yyyy')
                                : '-'}
                            </TableCell>
                            <TableCell>{getCertificateStatusBadge(cert.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Cash Flow Impact */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold mb-2 text-blue-900">Cash Flow Impact</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-blue-700">Total Deducted:</p>
                      <p className="text-lg font-bold text-blue-900">
                        RM {selectedRecord.totalRetentionHeld.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-700">Total Released:</p>
                      <p className="text-lg font-bold text-green-600">
                        RM {(selectedRecord.halfRetentionReleasedAmount + selectedRecord.finalRetentionReleasedAmount).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-700">Still Held:</p>
                      <p className="text-lg font-bold text-orange-600">
                        RM {selectedRecord.currentRetentionHeld.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Remarks */}
                {selectedRecord.remarks && (
                  <div>
                    <h4 className="font-semibold mb-2">Remarks</h4>
                    <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded">
                      {selectedRecord.remarks}
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
                  Export Retention Report
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </PageWrapper>
  )
}
