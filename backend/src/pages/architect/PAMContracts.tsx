import React, { useState, useEffect } from 'react';
import { FileText, DollarSign, Calendar, Shield, TrendingUp, Plus, Edit, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePAMContractStore } from '@/store/architect/pamContractStore';
import { useProjectStore } from '@/store/projectStore';
import { PAMContract, PaymentCertificate, Variation } from '@/types/architect';
import { toast } from 'sonner';

const PAMContracts: React.FC = () => {
  const {
    contracts,
    currentContract,
    pamClauses,
    loading,
    error,
    fetchContracts,
    fetchContract,
    createContract,
    createPaymentCertificate,
    certifyPayment,
    createVariation,
    approveVariation,
    fetchPAMClauses,
    generateContractDocument,
    clearError,
  } = usePAMContractStore();

  const { projects } = useProjectStore();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showVariationDialog, setShowVariationDialog] = useState(false);
  const [selectedContract, setSelectedContract] = useState<PAMContract | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedProject, setSelectedProject] = useState('');

  // Form state for creating contract
  const [contractForm, setContractForm] = useState({
    projectId: '',
    contractType: 'PAM2018' as PAMContract['contractType'],
    title: '',
    employer: { name: '', company: '', address: '', registrationNumber: '' },
    contractor: { name: '', company: '', address: '', registrationNumber: '', cidbGrade: '' },
    contractSum: 0,
    commencementDate: '',
    completionDate: '',
    defectsLiabilityPeriod: 12,
    retentionPercentage: 5,
    liquidatedDamages: 0,
  });

  // Payment certificate form
  const [paymentForm, setPaymentForm] = useState({
    periodFrom: '',
    periodTo: '',
    workDone: 0,
    materials: 0,
    variations: 0,
    previousCertified: 0,
  });

  // Variation form
  const [variationForm, setVariationForm] = useState({
    description: '',
    reason: '',
    amount: 0,
  });

  useEffect(() => {
    fetchContracts(selectedProject);
    fetchPAMClauses('PAM2018');
  }, [selectedProject]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error]);

  const handleCreateContract = async () => {
    try {
      const newContract = await createContract({
        ...contractForm,
        projectName: projects.find(p => p.id === contractForm.projectId)?.name || '',
        status: 'draft',
        insurances: [],
        variations: [],
        certificates: [],
        clauses: pamClauses.filter(c => c.mandatory),
        amendments: [],
      });

      toast.success('Contract created successfully');
      setShowCreateDialog(false);
      setContractForm({
        projectId: '',
        contractType: 'PAM2018',
        title: '',
        employer: { name: '', company: '', address: '', registrationNumber: '' },
        contractor: { name: '', company: '', address: '', registrationNumber: '', cidbGrade: '' },
        contractSum: 0,
        commencementDate: '',
        completionDate: '',
        defectsLiabilityPeriod: 12,
        retentionPercentage: 5,
        liquidatedDamages: 0,
      });
    } catch (err) {
      toast.error('Failed to create contract');
    }
  };

  const handleViewContract = (contract: PAMContract) => {
    setSelectedContract(contract);
    fetchContract(contract.id);
    setShowDetailDialog(true);
  };

  const handleCreatePaymentCertificate = async () => {
    if (!selectedContract) return;

    try {
      const currentCertified = paymentForm.workDone + paymentForm.materials + paymentForm.variations;
      const retention = (currentCertified * selectedContract.retentionPercentage) / 100;
      const netPayment = currentCertified - retention;

      await createPaymentCertificate(selectedContract.id, {
        ...paymentForm,
        currentCertified,
        retention,
        releaseRetention: 0,
        netPayment,
        status: 'draft',
      });

      toast.success('Payment certificate created');
      setShowPaymentDialog(false);
      setPaymentForm({
        periodFrom: '',
        periodTo: '',
        workDone: 0,
        materials: 0,
        variations: 0,
        previousCertified: 0,
      });
    } catch (err) {
      toast.error('Failed to create payment certificate');
    }
  };

  const handleCreateVariation = async () => {
    if (!selectedContract) return;

    try {
      await createVariation(selectedContract.id, {
        ...variationForm,
        status: 'pending',
      });

      toast.success('Variation order created');
      setShowVariationDialog(false);
      setVariationForm({
        description: '',
        reason: '',
        amount: 0,
      });
    } catch (err) {
      toast.error('Failed to create variation');
    }
  };

  const handleGenerateDocument = async (contractId: string) => {
    try {
      const documentUrl = await generateContractDocument(contractId);
      window.open(documentUrl, '_blank');
      toast.success('Contract document generated');
    } catch (err) {
      toast.error('Failed to generate document');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const calculateProgress = (contract: PAMContract) => {
    const totalCertified = contract.certificates.reduce((sum, cert) =>
      sum + (cert.status === 'paid' ? cert.currentCertified : 0), 0
    );
    return (totalCertified / contract.contractSum) * 100;
  };

  const getStatusColor = (status: PAMContract['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-500';
      case 'active': return 'bg-green-500';
      case 'suspended': return 'bg-yellow-500';
      case 'terminated': return 'bg-red-500';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-gray-400';
    }
  };

  if (loading && contracts.length === 0) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">PAM Contracts</h1>
          <p className="text-muted-foreground">Malaysian standard construction contracts</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Projects</SelectItem>
              {projects.map(project => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Contract
          </Button>
        </div>
      </div>

      {/* Contract Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contracts.map(contract => {
          const progress = calculateProgress(contract);
          const totalVariations = contract.variations.reduce((sum, v) =>
            sum + (v.status === 'approved' ? v.amount : 0), 0
          );
          const revisedContract = contract.contractSum + totalVariations;

          return (
            <Card key={contract.id} className="cursor-pointer" onClick={() => handleViewContract(contract)}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{contract.contractNumber}</CardTitle>
                    <CardDescription>{contract.projectName}</CardDescription>
                  </div>
                  <Badge className={getStatusColor(contract.status)}>
                    {contract.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Contract Type</p>
                      <p className="font-medium">{contract.contractType}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Contractor</p>
                      <p className="font-medium">{contract.contractor.company}</p>
                      {contract.contractor.cidbGrade && (
                        <Badge variant="outline" className="text-xs">
                          CIDB {contract.contractor.cidbGrade}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Original Contract</span>
                      <span className="font-medium">{formatCurrency(contract.contractSum)}</span>
                    </div>
                    {totalVariations > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Variations</span>
                        <span className="font-medium text-orange-600">
                          +{formatCurrency(totalVariations)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-semibold">
                      <span>Revised Contract</span>
                      <span>{formatCurrency(revisedContract)}</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Commencement</p>
                      <p className="font-medium">
                        {format(new Date(contract.commencementDate), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Completion</p>
                      <p className="font-medium">
                        {format(new Date(contract.completionDate), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateDocument(contract.id);
                      }}
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      Document
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedContract(contract);
                        setShowPaymentDialog(true);
                      }}
                    >
                      <DollarSign className="h-3 w-3 mr-1" />
                      Payment
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create Contract Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create PAM Contract</DialogTitle>
            <DialogDescription>
              Set up a new Malaysian standard construction contract
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project">Project</Label>
                <Select
                  value={contractForm.projectId}
                  onValueChange={(value) => setContractForm({ ...contractForm, projectId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contractType">Contract Type</Label>
                <Select
                  value={contractForm.contractType}
                  onValueChange={(value) => setContractForm({ ...contractForm, contractType: value as PAMContract['contractType'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PAM2018">PAM 2018</SelectItem>
                    <SelectItem value="PAM2006">PAM 2006</SelectItem>
                    <SelectItem value="PWD203A">PWD 203A</SelectItem>
                    <SelectItem value="CIDB2000">CIDB 2000</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Contract Title</Label>
              <Input
                id="title"
                value={contractForm.title}
                onChange={(e) => setContractForm({ ...contractForm, title: e.target.value })}
                placeholder="Main Building Contract - Project Name"
              />
            </div>

            <Separator />

            {/* Employer Details */}
            <div>
              <h3 className="font-semibold mb-3">Employer Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input
                    value={contractForm.employer.company}
                    onChange={(e) => setContractForm({
                      ...contractForm,
                      employer: { ...contractForm.employer, company: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Registration No.</Label>
                  <Input
                    value={contractForm.employer.registrationNumber}
                    onChange={(e) => setContractForm({
                      ...contractForm,
                      employer: { ...contractForm.employer, registrationNumber: e.target.value }
                    })}
                    placeholder="123456-K"
                  />
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <Label>Address</Label>
                <Textarea
                  value={contractForm.employer.address}
                  onChange={(e) => setContractForm({
                    ...contractForm,
                    employer: { ...contractForm.employer, address: e.target.value }
                  })}
                  rows={2}
                />
              </div>
            </div>

            <Separator />

            {/* Contractor Details */}
            <div>
              <h3 className="font-semibold mb-3">Contractor Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input
                    value={contractForm.contractor.company}
                    onChange={(e) => setContractForm({
                      ...contractForm,
                      contractor: { ...contractForm.contractor, company: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CIDB Grade</Label>
                  <Select
                    value={contractForm.contractor.cidbGrade}
                    onValueChange={(value) => setContractForm({
                      ...contractForm,
                      contractor: { ...contractForm.contractor, cidbGrade: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="G1">G1</SelectItem>
                      <SelectItem value="G2">G2</SelectItem>
                      <SelectItem value="G3">G3</SelectItem>
                      <SelectItem value="G4">G4</SelectItem>
                      <SelectItem value="G5">G5</SelectItem>
                      <SelectItem value="G6">G6</SelectItem>
                      <SelectItem value="G7">G7</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Contract Details */}
            <div>
              <h3 className="font-semibold mb-3">Contract Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contract Sum (RM)</Label>
                  <Input
                    type="number"
                    value={contractForm.contractSum}
                    onChange={(e) => setContractForm({ ...contractForm, contractSum: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Retention %</Label>
                  <Input
                    type="number"
                    value={contractForm.retentionPercentage}
                    onChange={(e) => setContractForm({ ...contractForm, retentionPercentage: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Commencement Date</Label>
                  <Input
                    type="date"
                    value={contractForm.commencementDate}
                    onChange={(e) => setContractForm({ ...contractForm, commencementDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Completion Date</Label>
                  <Input
                    type="date"
                    value={contractForm.completionDate}
                    onChange={(e) => setContractForm({ ...contractForm, completionDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>DLP Period (months)</Label>
                  <Input
                    type="number"
                    value={contractForm.defectsLiabilityPeriod}
                    onChange={(e) => setContractForm({ ...contractForm, defectsLiabilityPeriod: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>LAD (RM/day)</Label>
                  <Input
                    type="number"
                    value={contractForm.liquidatedDamages}
                    onChange={(e) => setContractForm({ ...contractForm, liquidatedDamages: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateContract}>Create Contract</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contract Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedContract && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>{selectedContract.contractNumber}</span>
                  <Badge className={getStatusColor(selectedContract.status)}>
                    {selectedContract.status}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  {selectedContract.title}
                </DialogDescription>
              </DialogHeader>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="certificates">Certificates</TabsTrigger>
                  <TabsTrigger value="variations">Variations</TabsTrigger>
                  <TabsTrigger value="insurances">Insurance</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Contract Value</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{formatCurrency(selectedContract.contractSum)}</p>
                        <p className="text-xs text-muted-foreground">Original contract sum</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Contract Period</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm font-medium">
                          {format(new Date(selectedContract.commencementDate), 'MMM yyyy')} -
                          {format(new Date(selectedContract.completionDate), 'MMM yyyy')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {Math.ceil((new Date(selectedContract.completionDate).getTime() -
                            new Date(selectedContract.commencementDate).getTime()) / (1000 * 60 * 60 * 24 * 30))} months
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Parties</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm font-medium">Employer</p>
                        <p className="text-sm">{selectedContract.employer.company}</p>
                        <p className="text-xs text-muted-foreground">{selectedContract.employer.address}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Contractor</p>
                        <p className="text-sm">{selectedContract.contractor.company}</p>
                        {selectedContract.contractor.cidbGrade && (
                          <Badge variant="outline" className="text-xs mt-1">
                            CIDB Grade {selectedContract.contractor.cidbGrade}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {selectedContract.performanceBond && (
                    <Alert>
                      <Shield className="h-4 w-4" />
                      <AlertDescription>
                        Performance Bond: {formatCurrency(selectedContract.performanceBond.amount)} |
                        Bank: {selectedContract.performanceBond.bank} |
                        Valid until: {format(new Date(selectedContract.performanceBond.validUntil), 'MMM yyyy')}
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>

                <TabsContent value="certificates" className="space-y-4">
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => {
                        setShowPaymentDialog(true);
                        setShowDetailDialog(false);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New Certificate
                    </Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Certificate No.</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Work Done</TableHead>
                        <TableHead>Current Certified</TableHead>
                        <TableHead>Retention</TableHead>
                        <TableHead>Net Payment</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedContract.certificates.map(cert => (
                        <TableRow key={cert.id}>
                          <TableCell className="font-medium">{cert.certificateNumber}</TableCell>
                          <TableCell>
                            {format(new Date(cert.periodFrom), 'MMM dd')} -
                            {format(new Date(cert.periodTo), 'MMM dd')}
                          </TableCell>
                          <TableCell>{formatCurrency(cert.workDone)}</TableCell>
                          <TableCell>{formatCurrency(cert.currentCertified)}</TableCell>
                          <TableCell>{formatCurrency(cert.retention)}</TableCell>
                          <TableCell className="font-semibold">{formatCurrency(cert.netPayment)}</TableCell>
                          <TableCell>
                            <Badge variant={cert.status === 'paid' ? 'default' : 'outline'}>
                              {cert.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="variations" className="space-y-4">
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => {
                        setShowVariationDialog(true);
                        setShowDetailDialog(false);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New Variation
                    </Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>VO Number</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Approved By</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedContract.variations.map(variation => (
                        <TableRow key={variation.id}>
                          <TableCell className="font-medium">{variation.variationNumber}</TableCell>
                          <TableCell>{variation.description}</TableCell>
                          <TableCell>{variation.reason}</TableCell>
                          <TableCell className="font-semibold">{formatCurrency(variation.amount)}</TableCell>
                          <TableCell>
                            <Badge variant={variation.status === 'approved' ? 'default' : 'outline'}>
                              {variation.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{variation.approvedBy || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="insurances" className="space-y-4">
                  {selectedContract.insurances.map(insurance => (
                    <Card key={insurance.id}>
                      <CardHeader>
                        <CardTitle className="text-sm flex justify-between items-center">
                          {insurance.type.replace('_', ' ').toUpperCase()}
                          <Badge variant={insurance.status === 'active' ? 'default' : 'destructive'}>
                            {insurance.status}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Provider</p>
                            <p className="font-medium">{insurance.provider}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Policy Number</p>
                            <p className="font-medium">{insurance.policyNumber}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Coverage</p>
                            <p className="font-medium">{formatCurrency(insurance.amount)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Valid Until</p>
                            <p className="font-medium">
                              {format(new Date(insurance.validTo), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Certificate Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Payment Certificate</DialogTitle>
            <DialogDescription>
              Issue a new interim payment certificate
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Period From</Label>
                <Input
                  type="date"
                  value={paymentForm.periodFrom}
                  onChange={(e) => setPaymentForm({ ...paymentForm, periodFrom: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Period To</Label>
                <Input
                  type="date"
                  value={paymentForm.periodTo}
                  onChange={(e) => setPaymentForm({ ...paymentForm, periodTo: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Work Done (RM)</Label>
                <Input
                  type="number"
                  value={paymentForm.workDone}
                  onChange={(e) => setPaymentForm({ ...paymentForm, workDone: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Materials on Site (RM)</Label>
                <Input
                  type="number"
                  value={paymentForm.materials}
                  onChange={(e) => setPaymentForm({ ...paymentForm, materials: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Variations (RM)</Label>
                <Input
                  type="number"
                  value={paymentForm.variations}
                  onChange={(e) => setPaymentForm({ ...paymentForm, variations: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Previous Certified (RM)</Label>
                <Input
                  type="number"
                  value={paymentForm.previousCertified}
                  onChange={(e) => setPaymentForm({ ...paymentForm, previousCertified: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            {selectedContract && (
              <Alert>
                <DollarSign className="h-4 w-4" />
                <AlertDescription className="space-y-1">
                  <p>Current Amount: {formatCurrency(paymentForm.workDone + paymentForm.materials + paymentForm.variations)}</p>
                  <p>Retention ({selectedContract.retentionPercentage}%): {formatCurrency((paymentForm.workDone + paymentForm.materials + paymentForm.variations) * selectedContract.retentionPercentage / 100)}</p>
                  <p className="font-semibold">Net Payment: {formatCurrency((paymentForm.workDone + paymentForm.materials + paymentForm.variations) * (100 - selectedContract.retentionPercentage) / 100)}</p>
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePaymentCertificate}>Create Certificate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Variation Dialog */}
      <Dialog open={showVariationDialog} onOpenChange={setShowVariationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Variation Order</DialogTitle>
            <DialogDescription>
              Document a contract variation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={variationForm.description}
                onChange={(e) => setVariationForm({ ...variationForm, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input
                value={variationForm.reason}
                onChange={(e) => setVariationForm({ ...variationForm, reason: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Amount (RM)</Label>
              <Input
                type="number"
                value={variationForm.amount}
                onChange={(e) => setVariationForm({ ...variationForm, amount: parseFloat(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVariationDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateVariation}>Create Variation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PAMContracts;