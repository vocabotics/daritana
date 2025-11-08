import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileText,
  DollarSign,
  Calendar,
  User,
  Building,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Download,
  Upload,
  Edit,
  Shield,
  Briefcase,
  Calculator,
  Receipt,
  Loader2
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import PageWrapper from '@/components/PageWrapper'
import { usePAMContractStore } from '@/store/architect/pamContractStore'
import type { PAMContract } from '@/types/architect'

export default function PAMContractAdmin() {
  // Zustand store
  const {
    contracts,
    currentContract,
    loading,
    error,
    fetchContracts,
    fetchContract,
    clearError
  } = usePAMContractStore()

  // Load data on mount
  useEffect(() => {
    fetchContracts()
    // Load first contract if available
    if (contracts.length > 0 && !currentContract) {
      fetchContract(contracts[0].id)
    }
  }, [fetchContracts, fetchContract, contracts.length, currentContract])

  // Error handling
  useEffect(() => {
    if (error) {
      toast.error(error)
      clearError()
    }
  }, [error, clearError])

  // Use first contract as active, or current contract from store
  const activeContract = currentContract || contracts[0]
  const certificates = activeContract?.certificates || []

  const contractProgress = 35
  const timeElapsed = 18 // weeks
  const totalDuration = 52 // weeks

  const totalCertified = certificates
    .filter(c => c.status !== 'draft')
    .reduce((sum, c) => sum + c.workCompleted + c.materials, 0)

  const totalRetention = certificates
    .filter(c => c.status !== 'draft')
    .reduce((sum, c) => sum + c.retention, 0)

  const stats = {
    contractSum: activeContract.contractSum,
    certified: totalCertified,
    paid: certificates.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.netPayment, 0),
    retention: totalRetention,
    remaining: activeContract.contractSum - totalCertified,
    progress: contractProgress
  }

  return (
    <PageWrapper title="PAM Contract Administration">
      <div className="space-y-6">
        {/* Contract Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Contract Overview</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {activeContract.contractNumber} - {activeContract.contractor}
                </p>
              </div>
              <Badge variant={activeContract.status === 'active' ? 'default' : 'secondary'}>
                {activeContract.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Contract Type</p>
                <div className="flex items-center gap-2 mt-1">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">PAM Contract 2018</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contract Period</p>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <span className="font-medium">
                    {format(activeContract.commencementDate, 'dd MMM yyyy')} -
                    {format(activeContract.completionDate, 'dd MMM yyyy')}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Performance Bond</p>
                <div className="flex items-center gap-2 mt-1">
                  <Briefcase className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">
                    RM {activeContract.performanceBond.toLocaleString()} (5%)
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Contract Progress</span>
                  <span className="text-sm text-muted-foreground">{contractProgress}%</span>
                </div>
                <Progress value={contractProgress} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Time Elapsed</span>
                  <span className="text-sm text-muted-foreground">
                    {timeElapsed} of {totalDuration} weeks
                  </span>
                </div>
                <Progress value={(timeElapsed / totalDuration) * 100} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Contract Sum</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                RM {(stats.contractSum / 1000000).toFixed(2)}M
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Certified</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                RM {(stats.certified / 1000000).toFixed(2)}M
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                RM {(stats.paid / 1000000).toFixed(2)}M
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Retention</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                RM {stats.retention.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                RM {(stats.remaining / 1000000).toFixed(2)}M
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.progress}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="certificates" className="space-y-4">
          <TabsList>
            <TabsTrigger value="certificates">Payment Certificates</TabsTrigger>
            <TabsTrigger value="variations">Variations</TabsTrigger>
            <TabsTrigger value="extensions">Extensions of Time</TabsTrigger>
            <TabsTrigger value="claims">Claims</TabsTrigger>
            <TabsTrigger value="bonds">Bonds & Insurance</TabsTrigger>
          </TabsList>

          <TabsContent value="certificates">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Interim Payment Certificates</CardTitle>
                  <Button>
                    <Calculator className="h-4 w-4 mr-2" />
                    New Certificate
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {certificates.map((cert) => (
                    <div key={cert.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-4">
                            <h3 className="font-semibold">{cert.certificateNumber}</h3>
                            <Badge variant="outline">
                              {format(cert.date, 'dd MMM yyyy')}
                            </Badge>
                            <Badge
                              variant={cert.status === 'paid' ? 'default' :
                                      cert.status === 'issued' ? 'secondary' : 'outline'}
                              className={cert.status === 'paid' ? 'bg-green-100 text-green-800' : ''}
                            >
                              {cert.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-3">
                            <div>
                              <p className="text-xs text-muted-foreground">Work Done</p>
                              <p className="font-medium">RM {cert.workCompleted.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Materials</p>
                              <p className="font-medium">RM {cert.materials.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Retention</p>
                              <p className="font-medium text-orange-600">
                                -RM {cert.retention.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Previous</p>
                              <p className="font-medium">
                                RM {cert.previousPayments.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Net Payment</p>
                              <p className="font-bold text-green-600">
                                RM {cert.netPayment.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="variations">
            <Card>
              <CardHeader>
                <CardTitle>Variation Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Track and manage contract variations and their financial impact
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="extensions">
            <Card>
              <CardHeader>
                <CardTitle>Extensions of Time (EOT)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Manage time extension requests and approvals
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="claims">
            <Card>
              <CardHeader>
                <CardTitle>Claims Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Track contractor claims and disputes
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bonds">
            <Card>
              <CardHeader>
                <CardTitle>Bonds & Insurance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Performance Bond</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Amount</p>
                        <p className="font-medium">RM {activeContract.performanceBond.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Bank</p>
                        <p className="font-medium">Maybank</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Valid Until</p>
                        <p className="font-medium">{format(activeContract.completionDate, 'dd MMM yyyy')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Status</p>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Insurance Policies</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Contractor's All Risk (CAR)</span>
                        <Badge className="bg-green-100 text-green-800">Valid</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Public Liability Insurance</span>
                        <Badge className="bg-green-100 text-green-800">Valid</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Workmen's Compensation</span>
                        <Badge className="bg-green-100 text-green-800">Valid</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageWrapper>
  )
}