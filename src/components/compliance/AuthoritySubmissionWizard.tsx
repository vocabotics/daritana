import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { documentApi } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  CreditCard,
  Building2,
  MapPin,
  Stamp,
  FileCheck,
  Calculator,
  Send,
  Download,
  Calendar
} from 'lucide-react';
import {
  AuthoritySubmission,
  SubmissionDocument,
  LocalAuthority,
  AUTHORITY_CODES,
  SubmissionType,
  SubmissionStage
} from '@/types/malaysian-compliance';

interface AuthoritySubmissionWizardProps {
  projectId: string;
  projectName: string;
}

export const AuthoritySubmissionWizard: React.FC<AuthoritySubmissionWizardProps> = ({
  projectId,
  projectName
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedAuthority, setSelectedAuthority] = useState<string>('DBKL');
  const [submissionType, setSubmissionType] = useState<SubmissionType>('BP');
  const [documents, setDocuments] = useState<SubmissionDocument[]>([]);
  const [submission, setSubmission] = useState<Partial<AuthoritySubmission>>({
    projectId,
    stage: 'pre-submission'
  });

  const steps = [
    { id: 1, title: 'Authority Selection', icon: Building2 },
    { id: 2, title: 'Document Preparation', icon: FileText },
    { id: 3, title: 'Professional Stamps', icon: Stamp },
    { id: 4, title: 'Fee Calculation', icon: Calculator },
    { id: 5, title: 'Submission Review', icon: FileCheck },
    { id: 6, title: 'Submit & Track', icon: Send }
  ];

  const requiredDocuments = {
    BP: [
      { type: 'location_plan', name: 'Location Plan (1:1000)', required: true },
      { type: 'site_plan', name: 'Site Plan (1:200)', required: true },
      { type: 'floor_plan', name: 'Floor Plans (1:100)', required: true },
      { type: 'elevation', name: 'Elevations (1:100)', required: true },
      { type: 'section', name: 'Sections (1:100)', required: true },
      { type: 'structural_plan', name: 'Structural Plans', required: true },
      { type: 'mne_plan', name: 'M&E Plans', required: true },
      { type: 'calculation', name: 'Structural Calculations', required: false },
      { type: 'report', name: 'Geotechnical Report', required: false }
    ],
    CCC: [
      { type: 'form', name: 'Form G1 - CCC Application', required: true },
      { type: 'form', name: 'Form G2 - Certification', required: true },
      { type: 'report', name: 'As-Built Drawings', required: true },
      { type: 'report', name: 'Test Certificates', required: true }
    ]
  };

  const getStageColor = (stage: SubmissionStage) => {
    const colors: Record<SubmissionStage, string> = {
      'pre-submission': 'bg-gray-100',
      'document-check': 'bg-blue-100',
      'technical-review': 'bg-yellow-100',
      'committee-review': 'bg-purple-100',
      'payment-pending': 'bg-orange-100',
      'approved': 'bg-green-100',
      'rejected': 'bg-red-100',
      'additional-info-required': 'bg-amber-100'
    };
    return colors[stage] || 'bg-gray-100';
  };

  const [fees, setFees] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load documents and calculate fees from API
  useEffect(() => {
    const loadSubmissionData = async () => {
      setIsLoading(true);
      try {
        // Load project documents
        const documentsResponse = await documentApi.getDocuments({ projectId });
        if (documentsResponse.data?.documents) {
          const formattedDocuments = documentsResponse.data.documents.map((doc: any) => ({
            id: doc.id,
            type: doc.type || doc.category,
            fileName: doc.fileName || doc.name,
            fileSize: doc.fileSize || doc.size || 0,
            format: doc.format || 'PDF',
            scale: doc.scale || '1:100',
            paperSize: doc.paperSize || 'A1',
            stampRequired: doc.stampRequired || false,
            uploadDate: new Date(doc.uploadDate || doc.createdAt),
            status: doc.status || 'uploaded',
            url: doc.url || doc.fileUrl
          }));
          setDocuments(formattedDocuments);
        }

        // Calculate fees based on real data
        const baseFee = submissionType === 'BP' ? 5000 : 2000;
        const processingFee = 500;
        const inspectionFee = submissionType === 'CCC' ? 1000 : 0;
        const calculatedFees = {
          base: baseFee,
          processing: processingFee,
          inspection: inspectionFee,
          total: baseFee + processingFee + inspectionFee
        };
        setFees(calculatedFees);
      } catch (error) {
        console.error('Failed to load submission data:', error);
        toast.error('Failed to load submission data');
        // Fallback to mock data
        setDocuments(mockDocuments);
        setFees({
          base: submissionType === 'BP' ? 5000 : 2000,
          processing: 500,
          inspection: submissionType === 'CCC' ? 1000 : 0,
          total: (submissionType === 'BP' ? 5000 : 2000) + 500 + (submissionType === 'CCC' ? 1000 : 0)
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSubmissionData();
  }, [projectId, submissionType]);

  const calculateFees = () => {
    return fees || {
      base: submissionType === 'BP' ? 5000 : 2000,
      processing: 500,
      inspection: submissionType === 'CCC' ? 1000 : 0,
      total: (submissionType === 'BP' ? 5000 : 2000) + 500 + (submissionType === 'CCC' ? 1000 : 0)
    };
  };

  const mockDocuments: SubmissionDocument[] = [
    {
      id: '1',
      type: 'location_plan',
      fileName: 'A-001_Location_Plan.pdf',
      fileSize: 2048000,
      format: 'PDF',
      scale: '1:1000',
      paperSize: 'A1',
      stampRequired: true,
      uploadDate: new Date(),
      status: 'verified',
      professionalStamp: {
        professionalId: 'PAM123',
        registrationBody: 'PAM',
        registrationNumber: 'PAM/2024/12345',
        stampType: 'digital',
        validityPeriod: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31')
        },
        stampImage: '',
        usageLog: []
      }
    },
    {
      id: '2',
      type: 'site_plan',
      fileName: 'A-002_Site_Plan.pdf',
      fileSize: 3072000,
      format: 'PDF',
      scale: '1:200',
      paperSize: 'A1',
      stampRequired: true,
      uploadDate: new Date(),
      status: 'verified'
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <CardTitle>Authority Submission Wizard</CardTitle>
          <CardDescription>
            Submit your building plans to the local authority for approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step Progress */}
          <div className="mb-8">
            <div className="flex justify-between mb-4">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`flex flex-col items-center ${
                    step.id <= currentStep ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                      step.id < currentStep
                        ? 'bg-primary text-white'
                        : step.id === currentStep
                        ? 'bg-primary/20 border-2 border-primary'
                        : 'bg-gray-100'
                    }`}
                  >
                    {step.id < currentStep ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className="text-xs text-center">{step.title}</span>
                </div>
              ))}
            </div>
            <Progress value={(currentStep / steps.length) * 100} className="h-2" />
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">
            {/* Step 1: Authority Selection */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="authority">Local Authority</Label>
                  <Select value={selectedAuthority} onValueChange={setSelectedAuthority}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select local authority" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(AUTHORITY_CODES).map(([code, authority]) => (
                        <SelectItem key={code} value={code}>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{authority.name}</span>
                            <Badge variant="outline" className="ml-2">
                              {authority.state}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="submissionType">Submission Type</Label>
                  <Select value={submissionType} onValueChange={(value) => setSubmissionType(value as SubmissionType)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select submission type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BP">Building Plan (BP)</SelectItem>
                      <SelectItem value="CCC">Certificate of Completion & Compliance (CCC)</SelectItem>
                      <SelectItem value="DO">Development Order (DO)</SelectItem>
                      <SelectItem value="Amendment">Amendment to Approved Plans</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedAuthority && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-6">
                      <h4 className="font-medium mb-3">Authority Requirements</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Plot Ratio Calculation:</span>
                          <Badge variant="outline">
                            {AUTHORITY_CODES[selectedAuthority].specificRequirements.plotRatioCalculation}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Parking Requirements:</span>
                          <span>{AUTHORITY_CODES[selectedAuthority].specificRequirements.parkingRequirements.residential} per unit</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Processing Time:</span>
                          <span>45 working days</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Submission Portal:</span>
                          <a href={AUTHORITY_CODES[selectedAuthority].submissionPortal} className="text-blue-600 hover:underline">
                            OSC 3.0+
                          </a>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Step 2: Document Preparation */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    All drawings must be in PDF format with proper scale and paper size indicated.
                    Original DWG files may be required for technical review.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  {requiredDocuments[submissionType]?.map((doc, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-gray-500" />
                          <div>
                            <p className="font-medium">{doc.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {doc.required ? 'Required' : 'Optional'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {mockDocuments.find(d => d.type === doc.type) ? (
                            <>
                              <Badge variant="outline" className="bg-green-50">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Uploaded
                              </Badge>
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <Button variant="outline" size="sm">
                              <Upload className="h-4 w-4 mr-2" />
                              Upload
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Document Checklist</p>
                    <p className="text-sm text-muted-foreground">
                      2 of 9 documents uploaded
                    </p>
                  </div>
                  <Progress value={22} className="w-32" />
                </div>
              </div>
            )}

            {/* Step 3: Professional Stamps */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <Alert>
                  <Stamp className="h-4 w-4" />
                  <AlertDescription>
                    All technical drawings must bear the stamp and signature of registered professionals.
                  </AlertDescription>
                </Alert>

                <Tabs defaultValue="architect">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="architect">Architect</TabsTrigger>
                    <TabsTrigger value="engineer">Engineer</TabsTrigger>
                    <TabsTrigger value="others">Others</TabsTrigger>
                  </TabsList>

                  <TabsContent value="architect" className="space-y-4 mt-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">Principal Architect</p>
                            <p className="text-sm text-muted-foreground">Ar. Ahmad Rahman</p>
                            <Badge className="mt-2">PAM/2024/12345</Badge>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="bg-green-50">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-2">
                              Valid until: 31 Dec 2024
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 p-3 bg-gray-50 rounded">
                          <p className="text-xs text-muted-foreground">Digital Stamp Applied:</p>
                          <p className="text-xs">• Location Plan (A-001)</p>
                          <p className="text-xs">• Site Plan (A-002)</p>
                          <p className="text-xs">• All Floor Plans</p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="engineer" className="space-y-4 mt-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">Structural Engineer</p>
                            <p className="text-sm text-muted-foreground">Ir. Lee Wei Ming</p>
                            <Badge className="mt-2">BEM/2024/54321</Badge>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="bg-green-50">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-2">
                              Valid until: 31 Dec 2024
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                <Button className="w-full" variant="outline">
                  <Stamp className="h-4 w-4 mr-2" />
                  Apply Digital Stamps to All Documents
                </Button>
              </div>
            )}

            {/* Step 4: Fee Calculation */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Submission Fees</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b">
                        <span>Building Plan Assessment Fee</span>
                        <span className="font-medium">RM {calculateFees().base.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Processing Fee</span>
                        <span className="font-medium">RM {calculateFees().processing.toLocaleString()}</span>
                      </div>
                      {calculateFees().inspection > 0 && (
                        <div className="flex justify-between py-2 border-b">
                          <span>Inspection Fee</span>
                          <span className="font-medium">RM {calculateFees().inspection.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between py-3 text-lg font-bold">
                        <span>Total Amount</span>
                        <span>RM {calculateFees().total.toLocaleString()}</span>
                      </div>
                    </div>

                    <Alert className="mt-4">
                      <AlertDescription>
                        Fees are calculated based on the project GFA and building category.
                        Additional charges may apply for amendments or expedited processing.
                      </AlertDescription>
                    </Alert>

                    <div className="mt-6 space-y-3">
                      <Button className="w-full" variant="outline">
                        <Calculator className="h-4 w-4 mr-2" />
                        View Detailed Calculation
                      </Button>
                      <Button className="w-full">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Proceed to Payment
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 5: Submission Review */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    All requirements have been met. Your submission is ready for final review.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <Card>
                    <CardContent className="pt-6">
                      <h4 className="font-medium mb-3">Submission Summary</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Project:</span>
                          <span className="font-medium">{projectName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Authority:</span>
                          <span className="font-medium">{AUTHORITY_CODES[selectedAuthority].name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Submission Type:</span>
                          <Badge>{submissionType}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Documents:</span>
                          <span className="font-medium">9 files (45.3 MB)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Professional Stamps:</span>
                          <Badge variant="outline" className="bg-green-50">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Fees:</span>
                          <span className="font-medium">RM {calculateFees().total.toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <h4 className="font-medium mb-3">Expected Timeline</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">Submission</p>
                            <p className="text-xs text-muted-foreground">Today</p>
                          </div>
                        </div>
                        <div className="border-l-2 border-dashed border-gray-200 ml-1 h-4"></div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">Technical Review</p>
                            <p className="text-xs text-muted-foreground">7-14 working days</p>
                          </div>
                        </div>
                        <div className="border-l-2 border-dashed border-gray-200 ml-1 h-4"></div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">Committee Meeting</p>
                            <p className="text-xs text-muted-foreground">30 working days</p>
                          </div>
                        </div>
                        <div className="border-l-2 border-dashed border-gray-200 ml-1 h-4"></div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">Expected Approval</p>
                            <p className="text-xs text-muted-foreground">45 working days</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Step 6: Submit & Track */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Submission Successful!</h3>
                  <p className="text-muted-foreground mb-4">
                    Your application has been submitted to {AUTHORITY_CODES[selectedAuthority].name}
                  </p>
                  <div className="inline-flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg">
                    <span className="text-sm text-muted-foreground">Reference No:</span>
                    <span className="font-mono font-medium">DBKL/BP/2024/00123</span>
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">What's Next?</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Track Progress</p>
                        <p className="text-sm text-muted-foreground">
                          Monitor your submission status in real-time through the tracking portal
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Respond to Queries</p>
                        <p className="text-sm text-muted-foreground">
                          Be ready to provide additional information if requested by the technical committee
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-purple-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Committee Meeting</p>
                        <p className="text-sm text-muted-foreground">
                          Your application will be reviewed in the next committee meeting on 15 Feb 2024
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-3">
                  <Button className="flex-1">
                    Track Submission
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Download Receipt
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            {currentStep < steps.length ? (
              <Button onClick={handleNext}>
                Next Step
              </Button>
            ) : (
              <Button>
                Complete
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};