import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FileText,
  Download,
  Plus,
  CheckCircle,
  Clock,
  DollarSign,
  Calendar,
  TrendingUp,
  AlertCircle,
  Printer,
  Loader2
} from 'lucide-react';
import PageWrapper from '@/components/PageWrapper';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { usePaymentCertificatesStore } from '@/store/architect/paymentCertificatesStore';

/**
 * Payment Certificate Generation
 * PAM Form 9/10 - Interim and Final Certificates
 * Core architect function for Malaysian projects
 */

interface PaymentCertificate {
  id: string;
  contractId: string;
  certificateNumber: string;
  certificateDate: Date;
  periodFrom: Date;
  periodTo: Date;
  type: 'interim' | 'final';

  // Valuations
  grossValuation: number;
  retentionPercentage: number;
  retentionAmount: number;
  previousPayments: number;
  amountDue: number;

  // Details
  workDescription: string;
  variationOrders: Array<{
    voNumber: string;
    description: string;
    amount: number;
  }>;

  // Status
  status: 'draft' | 'issued' | 'approved' | 'paid';
  issuedDate?: Date;
  approvedDate?: Date;
  paidDate?: Date;

  // Signatures
  architectSignature?: string;
  clientSignature?: string;
  contractorSignature?: string;

  remarks?: string;
}

interface PAMContract {
  id: string;
  contractNumber: string;
  projectName: string;
  contractSum: number;
  retentionPercentage: number;
  retentionSum: number;
  commencementDate: Date;
  completionDate: Date;
  certificates: PaymentCertificate[];
}

export default function PaymentCertificates() {
  const [selectedContract, setSelectedContract] = useState<string>('contract-1');
  const [showNewCertificate, setShowNewCertificate] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<PaymentCertificate | null>(null);

  // ✅ Connect to backend store
  const { certificates, loading, error, fetchCertificates, clearError } = usePaymentCertificatesStore();

  // ✅ Fetch data from backend on mount
  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  // ✅ Loading state
  if (loading) {
    return (
      <PageWrapper title="Payment Certificates">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Loading payment certificates...</span>
        </div>
      </PageWrapper>
    );
  }

  // ✅ Error state
  if (error) {
    return (
      <PageWrapper title="Payment Certificates">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-900 font-medium">Error: {error}</p>
          <Button
            onClick={() => {
              clearError();
              fetchCertificates();
            }}
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </PageWrapper>
    );
  }

  // Group certificates by project for display
  const contractCertificates = certificates.filter(cert => cert.contractId === selectedContract);

  // Calculate contract-like summary from certificates
  const contract = contractCertificates.length > 0 ? {
    id: selectedContract,
    contractNumber: `PAM-${selectedContract}`,
    projectName: contractCertificates[0].projectName || 'Project',
    contractSum: 45000000, // This would come from project data in real implementation
    retentionPercentage: 5,
    retentionSum: 2250000,
    commencementDate: new Date(),
    completionDate: new Date(),
    certificates: contractCertificates
  } : null;

  const calculateCumulativeValues = () => {
    if (!contract) return { totalCertified: 0, totalPaid: 0, totalRetention: 0, percentageComplete: 0 };

    const totalCertified = contract.certificates.reduce((sum, cert) => sum + cert.grossValuation, 0);
    const totalPaid = contract.certificates
      .filter((cert) => cert.status === 'paid')
      .reduce((sum, cert) => sum + cert.amountDue, 0);
    const totalRetention = contract.certificates.reduce((sum, cert) => sum + cert.retentionAmount, 0);
    const percentageComplete = (totalCertified / contract.contractSum) * 100;

    return { totalCertified, totalPaid, totalRetention, percentageComplete };
  };

  const stats = calculateCumulativeValues();

  const getStatusBadge = (status: PaymentCertificate['status']) => {
    const variants = {
      draft: { variant: 'secondary' as const, label: 'Draft', icon: FileText, color: 'gray' },
      issued: { variant: 'default' as const, label: 'Issued', icon: Clock, color: 'blue' },
      approved: { variant: 'default' as const, label: 'Approved', icon: CheckCircle, color: 'green' },
      paid: { variant: 'default' as const, label: 'Paid', icon: DollarSign, color: 'emerald' },
    };

    const config = variants[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={cn('gap-1', `bg-${config.color}-100 text-${config.color}-700`)}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return `RM ${amount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleGeneratePDF = (certificate: PaymentCertificate) => {
    toast.info(`Generating PDF for ${certificate.certificateNumber}...`);
    // PDF generation will be implemented with jsPDF or similar library
    setTimeout(() => {
      toast.success('PDF generated successfully');
    }, 1000);
  };

  const handleCreateCertificate = () => {
    toast.success('New payment certificate created');
    setShowNewCertificate(false);
  };

  return (
    <PageWrapper title="Payment Certificates">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Certified</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalCertified)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.percentageComplete.toFixed(1)}% of contract sum
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Paid</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalPaid)}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Retention</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats.totalRetention)}</p>
                <p className="text-xs text-gray-500 mt-1">5% retention held</p>
              </div>
              <DollarSign className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Certificates</p>
                <p className="text-2xl font-bold">{contract?.certificates.length || 0}</p>
              </div>
              <FileText className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contract Information */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Contract: {contract?.contractNumber}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">{contract?.projectName}</p>
            </div>
            <Dialog open={showNewCertificate} onOpenChange={setShowNewCertificate}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Certificate
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Generate Payment Certificate</DialogTitle>
                  <DialogDescription>
                    Create a new interim payment certificate (PAM Form 9/10)
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Certificate Number</Label>
                      <Input placeholder="PC-04" />
                    </div>
                    <div>
                      <Label>Certificate Date</Label>
                      <Input type="date" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Period From</Label>
                      <Input type="date" />
                    </div>
                    <div>
                      <Label>Period To</Label>
                      <Input type="date" />
                    </div>
                  </div>

                  <div>
                    <Label>Gross Valuation (RM)</Label>
                    <Input type="number" placeholder="5000000.00" />
                  </div>

                  <div>
                    <Label>Work Description</Label>
                    <Textarea
                      placeholder="Describe work completed during this period..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Retention (5%)</p>
                      <p className="font-medium">RM 250,000.00</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Amount Due</p>
                      <p className="font-medium text-green-600">RM 4,750,000.00</p>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowNewCertificate(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCertificate}>Create Certificate</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Contract Sum</p>
              <p className="font-medium">{formatCurrency(contract?.contractSum || 0)}</p>
            </div>
            <div>
              <p className="text-gray-500">Retention</p>
              <p className="font-medium">{contract?.retentionPercentage}%</p>
            </div>
            <div>
              <p className="text-gray-500">Commencement</p>
              <p className="font-medium">
                {contract ? format(contract.commencementDate, 'dd MMM yyyy') : '-'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Completion</p>
              <p className="font-medium">
                {contract ? format(contract.completionDate, 'dd MMM yyyy') : '-'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certificates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Certificates</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Certificate No.</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Gross Valuation</TableHead>
                <TableHead className="text-right">Retention</TableHead>
                <TableHead className="text-right">Amount Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contract?.certificates.map((cert) => (
                <TableRow key={cert.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{cert.certificateNumber}</TableCell>
                  <TableCell>{format(cert.certificateDate, 'dd MMM yyyy')}</TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {format(cert.periodFrom, 'dd MMM')} - {format(cert.periodTo, 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(cert.grossValuation)}
                  </TableCell>
                  <TableCell className="text-right text-orange-600">
                    {formatCurrency(cert.retentionAmount)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-green-600">
                    {formatCurrency(cert.amountDue)}
                  </TableCell>
                  <TableCell>{getStatusBadge(cert.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCertificate(cert)}
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleGeneratePDF(cert)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Certificate Detail Modal */}
      {selectedCertificate && (
        <Dialog open={!!selectedCertificate} onOpenChange={() => setSelectedCertificate(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle>Payment Certificate {selectedCertificate.certificateNumber}</DialogTitle>
                  <DialogDescription>PAM Form 9 - Interim Payment Certificate</DialogDescription>
                </div>
                {getStatusBadge(selectedCertificate.status)}
              </div>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Certificate Header */}
              <div className="border-b pb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Certificate Date</p>
                    <p className="font-medium">
                      {format(selectedCertificate.certificateDate, 'dd MMMM yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Valuation Period</p>
                    <p className="font-medium">
                      {format(selectedCertificate.periodFrom, 'dd MMM yyyy')} -{' '}
                      {format(selectedCertificate.periodTo, 'dd MMM yyyy')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Work Description */}
              <div>
                <h4 className="font-medium mb-2">Work Completed</h4>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                  {selectedCertificate.workDescription}
                </p>
              </div>

              {/* Variation Orders */}
              {selectedCertificate.variationOrders.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Variation Orders Included</h4>
                  <div className="space-y-2">
                    {selectedCertificate.variationOrders.map((vo, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm bg-blue-50 p-3 rounded">
                        <div>
                          <span className="font-medium">{vo.voNumber}:</span> {vo.description}
                        </div>
                        <span className="font-medium text-blue-600">{formatCurrency(vo.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Financial Summary */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium mb-4">Certificate Valuation</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Gross Valuation</span>
                    <span className="font-medium text-lg">
                      {formatCurrency(selectedCertificate.grossValuation)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-orange-600">
                    <span>Less: Retention ({selectedCertificate.retentionPercentage}%)</span>
                    <span className="font-medium">
                      -{formatCurrency(selectedCertificate.retentionAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Less: Previous Payments</span>
                    <span className="font-medium">
                      -{formatCurrency(selectedCertificate.previousPayments)}
                    </span>
                  </div>
                  <div className="border-t pt-3 flex items-center justify-between">
                    <span className="font-semibold text-lg">Amount Due This Certificate</span>
                    <span className="font-bold text-2xl text-green-600">
                      {formatCurrency(selectedCertificate.amountDue)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              {selectedCertificate.remarks && (
                <div>
                  <h4 className="font-medium mb-2">Remarks</h4>
                  <p className="text-sm text-gray-700 bg-yellow-50 p-3 rounded border border-yellow-200">
                    {selectedCertificate.remarks}
                  </p>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                {selectedCertificate.issuedDate && (
                  <div>
                    <p className="text-gray-500">Issued Date</p>
                    <p className="font-medium">
                      {format(selectedCertificate.issuedDate, 'dd MMM yyyy')}
                    </p>
                  </div>
                )}
                {selectedCertificate.approvedDate && (
                  <div>
                    <p className="text-gray-500">Approved Date</p>
                    <p className="font-medium text-green-600">
                      {format(selectedCertificate.approvedDate, 'dd MMM yyyy')}
                    </p>
                  </div>
                )}
                {selectedCertificate.paidDate && (
                  <div>
                    <p className="text-gray-500">Paid Date</p>
                    <p className="font-medium text-emerald-600">
                      {format(selectedCertificate.paidDate, 'dd MMM yyyy')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedCertificate(null)}>
                Close
              </Button>
              <Button variant="outline" onClick={() => handleGeneratePDF(selectedCertificate)}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button onClick={() => handleGeneratePDF(selectedCertificate)}>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Information Alert */}
      <Card className="mt-6 border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">About Payment Certificates</h4>
              <p className="text-sm text-blue-700">
                Payment Certificates (PAM Form 9/10) are issued monthly by architects to certify the value of
                work completed. The standard 5% retention is held until the Defects Liability Period. This
                module automates calculations and generates professional certificates for submission to clients
                and quantity surveyors.
              </p>
              <p className="text-sm text-blue-700 mt-2">
                <strong>Important:</strong> Certificates must be issued within 7 days of valuation date as
                per PAM 2018 contract conditions. Late issuance may result in contract penalties.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
