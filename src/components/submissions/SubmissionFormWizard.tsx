import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Building2,
  MapPin,
  FileText,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertTriangle,
  Info,
  Calculator,
  Upload,
  X,
  Eye
} from 'lucide-react';
import { authorityService } from '@/services/authorityService';
import { useProjectStore } from '@/store/projectStore';
import type {
  BuildingAuthority,
  SubmissionCategory,
  SubmissionFormData,
  DocumentUploadData,
  FeeCalculationResponse
} from '@/types/authority';

interface SubmissionFormWizardProps {
  projectId?: string;
  onComplete?: (submissionId: string) => void;
  onCancel?: () => void;
}

const WIZARD_STEPS = [
  { id: 'project', title: 'Project Selection', description: 'Choose project and basic information' },
  { id: 'authority', title: 'Authority & Category', description: 'Select building authority and submission type' },
  { id: 'details', title: 'Project Details', description: 'Enter project specifications and requirements' },
  { id: 'documents', title: 'Documents', description: 'Upload required documents' },
  { id: 'review', title: 'Review & Calculate', description: 'Review details and calculate fees' },
  { id: 'submit', title: 'Submit', description: 'Final submission to authority' }
];

export const SubmissionFormWizard: React.FC<SubmissionFormWizardProps> = ({ 
  projectId, 
  onComplete, 
  onCancel 
}) => {
  const { projects } = useProjectStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Data states
  const [authorities, setAuthorities] = useState<BuildingAuthority[]>([]);
  const [categories, setCategories] = useState<SubmissionCategory[]>([]);
  const [feeCalculation, setFeeCalculation] = useState<FeeCalculationResponse | null>(null);
  
  // Form data
  const [formData, setFormData] = useState<SubmissionFormData>({
    project_id: projectId || '',
    authority_id: '',
    category_id: '',
    submission_type: 'new',
    submission_method: 'online',
    site_address: '',
    building_use: '',
    priority: 'normal'
  });
  
  const [documents, setDocuments] = useState<File[]>([]);
  const [requiredDocuments, setRequiredDocuments] = useState<string[]>([]);

  const currentStepData = WIZARD_STEPS[currentStep];
  const progress = ((currentStep + 1) / WIZARD_STEPS.length) * 100;

  useEffect(() => {
    loadAuthorities();
  }, []);

  useEffect(() => {
    if (formData.authority_id) {
      loadCategories(formData.authority_id);
    }
  }, [formData.authority_id]);

  useEffect(() => {
    if (formData.category_id) {
      const category = categories.find(c => c.id === formData.category_id);
      if (category) {
        setRequiredDocuments(category.required_documents);
      }
    }
  }, [formData.category_id, categories]);

  const loadAuthorities = async () => {
    const result = await authorityService.getAuthorities();
    if (result.success && result.data) {
      setAuthorities(result.data);
    }
  };

  const loadCategories = async (authorityId: string) => {
    const result = await authorityService.getSubmissionCategories(authorityId);
    if (result.success && result.data) {
      setCategories(result.data);
    }
  };

  const calculateFees = async () => {
    if (!formData.authority_id || !formData.category_id) return;
    
    setLoading(true);
    try {
      const result = await authorityService.calculateFees(formData);
      if (result.success && result.data) {
        setFeeCalculation(result);
      }
    } catch (error) {
      console.error('Failed to calculate fees:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch (step) {
      case 0: // Project Selection
        if (!formData.project_id) newErrors.project_id = 'Please select a project';
        if (!formData.site_address) newErrors.site_address = 'Site address is required';
        break;
        
      case 1: // Authority & Category
        if (!formData.authority_id) newErrors.authority_id = 'Please select an authority';
        if (!formData.category_id) newErrors.category_id = 'Please select a submission category';
        break;
        
      case 2: // Project Details
        if (!formData.building_use) newErrors.building_use = 'Building use is required';
        if (formData.built_up_area && formData.built_up_area <= 0) {
          newErrors.built_up_area = 'Built-up area must be greater than 0';
        }
        break;
        
      case 3: // Documents
        if (documents.length === 0 && requiredDocuments.length > 0) {
          newErrors.documents = 'At least one document is required';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 4) { // Before review step
        calculateFees();
      }
      setCurrentStep(prev => Math.min(prev + 1, WIZARD_STEPS.length - 1));
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Create submission
      const result = await authorityService.createSubmission(formData);
      if (result.success && result.data) {
        // Upload documents
        for (const file of documents) {
          const documentData: DocumentUploadData = {
            document_type: 'general', // You might want to categorize this better
            title: file.name,
            revision: '1.0',
            file
          };
          await authorityService.uploadDocument(result.data.id, documentData);
        }
        
        onComplete?.(result.data.id);
      } else {
        setErrors({ submit: result.error || 'Failed to create submission' });
      }
    } catch (error) {
      setErrors({ submit: 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    setDocuments(prev => [...prev, ...Array.from(files)]);
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const selectedProject = projects.find(p => p.id === formData.project_id);
  const selectedAuthority = authorities.find(a => a.id === formData.authority_id);
  const selectedCategory = categories.find(c => c.id === formData.category_id);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{currentStepData.title}</CardTitle>
              <CardDescription>{currentStepData.description}</CardDescription>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Step {currentStep + 1} of {WIZARD_STEPS.length}</p>
              <Progress value={progress} className="w-32" />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step 0: Project Selection */}
              {currentStep === 0 && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="project_id">Select Project *</Label>
                        <Select 
                          value={formData.project_id} 
                          onValueChange={(value) => setFormData(prev => ({ ...prev, project_id: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a project" />
                          </SelectTrigger>
                          <SelectContent>
                            {projects.map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                <div>
                                  <p className="font-medium">{project.name}</p>
                                  <p className="text-sm text-gray-500">{project.clientName}</p>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.project_id && (
                          <p className="text-sm text-red-600 mt-1">{errors.project_id}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="submission_type">Submission Type</Label>
                        <Select 
                          value={formData.submission_type} 
                          onValueChange={(value) => setFormData(prev => ({ ...prev, submission_type: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New Application</SelectItem>
                            <SelectItem value="amendment">Amendment</SelectItem>
                            <SelectItem value="renewal">Renewal</SelectItem>
                            <SelectItem value="variation">Variation</SelectItem>
                            <SelectItem value="extension">Extension</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="site_address">Site Address *</Label>
                        <Textarea
                          id="site_address"
                          placeholder="Enter the full site address"
                          value={formData.site_address}
                          onChange={(e) => setFormData(prev => ({ ...prev, site_address: e.target.value }))}
                          rows={3}
                        />
                        {errors.site_address && (
                          <p className="text-sm text-red-600 mt-1">{errors.site_address}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="lot_number">Lot Number</Label>
                          <Input
                            id="lot_number"
                            placeholder="e.g., Lot 1234"
                            value={formData.lot_number || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, lot_number: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="plan_number">Plan Number</Label>
                          <Input
                            id="plan_number"
                            placeholder="e.g., Plan 5678"
                            value={formData.plan_number || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, plan_number: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedProject && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Project:</strong> {selectedProject.name} | 
                        <strong> Client:</strong> {selectedProject.clientName} | 
                        <strong> Type:</strong> {selectedProject.type}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* Step 1: Authority & Category */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="authority_id">Building Authority *</Label>
                      <Select 
                        value={formData.authority_id} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, authority_id: value, category_id: '' }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select building authority" />
                        </SelectTrigger>
                        <SelectContent>
                          {authorities.map((authority) => (
                            <SelectItem key={authority.id} value={authority.id}>
                              <div>
                                <p className="font-medium">{authority.name_en}</p>
                                <p className="text-sm text-gray-500">{authority.jurisdiction}</p>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.authority_id && (
                        <p className="text-sm text-red-600 mt-1">{errors.authority_id}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="category_id">Submission Category *</Label>
                      <Select 
                        value={formData.category_id} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                        disabled={!formData.authority_id}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select submission type" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              <div>
                                <p className="font-medium">{category.name_en}</p>
                                <p className="text-sm text-gray-500">
                                  RM {category.submission_fee} + RM {category.processing_fee}
                                </p>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.category_id && (
                        <p className="text-sm text-red-600 mt-1">{errors.category_id}</p>
                      )}
                    </div>
                  </div>

                  {selectedAuthority && (
                    <Alert>
                      <Building2 className="h-4 w-4" />
                      <AlertDescription>
                        <strong>{selectedAuthority.name_en}</strong><br />
                        {selectedAuthority.contact_info.address}<br />
                        Phone: {selectedAuthority.contact_info.phone} | 
                        Email: {selectedAuthority.contact_info.email}
                      </AlertDescription>
                    </Alert>
                  )}

                  {selectedCategory && (
                    <Alert>
                      <FileText className="h-4 w-4" />
                      <AlertDescription>
                        <strong>{selectedCategory.name_en}</strong><br />
                        Processing time: {selectedCategory.typical_processing_days} days<br />
                        Required documents: {selectedCategory.required_documents.length} items
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* Step 2: Project Details */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="building_use">Building Use *</Label>
                        <Select 
                          value={formData.building_use} 
                          onValueChange={(value) => setFormData(prev => ({ ...prev, building_use: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select building use" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Single Family Residential">Single Family Residential</SelectItem>
                            <SelectItem value="Multi Family Residential">Multi Family Residential</SelectItem>
                            <SelectItem value="Commercial Office">Commercial Office</SelectItem>
                            <SelectItem value="Retail">Retail</SelectItem>
                            <SelectItem value="Mixed Development">Mixed Development</SelectItem>
                            <SelectItem value="Industrial">Industrial</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.building_use && (
                          <p className="text-sm text-red-600 mt-1">{errors.building_use}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="land_area">Land Area (sqm)</Label>
                        <Input
                          id="land_area"
                          type="number"
                          placeholder="0"
                          value={formData.land_area || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, land_area: Number(e.target.value) }))}
                        />
                      </div>

                      <div>
                        <Label htmlFor="built_up_area">Built-up Area (sqm)</Label>
                        <Input
                          id="built_up_area"
                          type="number"
                          placeholder="0"
                          value={formData.built_up_area || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, built_up_area: Number(e.target.value) }))}
                        />
                        {errors.built_up_area && (
                          <p className="text-sm text-red-600 mt-1">{errors.built_up_area}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="building_height">Building Height (m)</Label>
                        <Input
                          id="building_height"
                          type="number"
                          step="0.1"
                          placeholder="0.0"
                          value={formData.building_height || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, building_height: Number(e.target.value) }))}
                        />
                      </div>

                      <div>
                        <Label htmlFor="number_of_floors">Number of Floors</Label>
                        <Input
                          id="number_of_floors"
                          type="number"
                          placeholder="0"
                          value={formData.number_of_floors || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, number_of_floors: Number(e.target.value) }))}
                        />
                      </div>

                      <div>
                        <Label htmlFor="occupancy_load">Occupancy Load</Label>
                        <Input
                          id="occupancy_load"
                          type="number"
                          placeholder="0"
                          value={formData.occupancy_load || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, occupancy_load: Number(e.target.value) }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="priority">Priority Level</Label>
                    <Select 
                      value={formData.priority} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Step 3: Documents */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <Alert>
                    <FileText className="h-4 w-4" />
                    <AlertDescription>
                      The following documents are required for {selectedCategory?.name_en}:
                      <ul className="mt-2 space-y-1">
                        {requiredDocuments.map((doc, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <Check className="h-3 w-3 text-green-600" />
                            {doc.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div>
                      <Label>Upload Documents</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 mb-2">Drag and drop files here, or click to browse</p>
                        <Input
                          type="file"
                          multiple
                          accept=".pdf,.dwg,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(e.target.files)}
                          className="hidden"
                          id="file-upload"
                        />
                        <Button variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
                          Choose Files
                        </Button>
                      </div>
                      {errors.documents && (
                        <p className="text-sm text-red-600 mt-1">{errors.documents}</p>
                      )}
                    </div>

                    {documents.length > 0 && (
                      <div className="space-y-2">
                        <Label>Uploaded Documents ({documents.length})</Label>
                        <div className="space-y-2">
                          {documents.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded">
                              <div className="flex items-center gap-3">
                                <FileText className="h-4 w-4 text-blue-600" />
                                <div>
                                  <p className="font-medium text-sm">{file.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeDocument(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 4: Review & Calculate */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Submission Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Project</p>
                          <p className="font-medium">{selectedProject?.name}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Authority</p>
                          <p className="font-medium">{selectedAuthority?.name_en}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Category</p>
                          <p className="font-medium">{selectedCategory?.name_en}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Building Use</p>
                          <p className="font-medium">{formData.building_use}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Documents</p>
                          <p className="font-medium">{documents.length} files uploaded</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Calculator className="h-5 w-5" />
                          Fee Calculation
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {loading ? (
                          <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-sm text-gray-600 mt-2">Calculating fees...</p>
                          </div>
                        ) : feeCalculation?.success && feeCalculation.data ? (
                          <div className="space-y-3">
                            {feeCalculation.data.fees.map((fee, index) => (
                              <div key={index} className="flex justify-between">
                                <span className="text-sm">{fee.description}</span>
                                <span className="font-medium">RM {fee.total_amount.toFixed(2)}</span>
                              </div>
                            ))}
                            <hr />
                            <div className="flex justify-between font-bold">
                              <span>Total Amount</span>
                              <span>RM {feeCalculation.data.total_amount.toFixed(2)}</span>
                            </div>
                          </div>
                        ) : (
                          <Button onClick={calculateFees} disabled={loading}>
                            <Calculator className="h-4 w-4 mr-2" />
                            Calculate Fees
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Step 5: Submit */}
              {currentStep === 5 && (
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <Check className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Ready to Submit</h3>
                    <p className="text-gray-600">
                      Your submission is ready. Click submit to send it to {selectedAuthority?.name_en}.
                    </p>
                  </div>
                  
                  {errors.submit && (
                    <Alert className="border-red-200">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-red-600">
                        {errors.submit}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-center gap-4">
                    <Button variant="outline" onClick={handlePrev}>
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Review Again
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading} className="min-w-32">
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      {loading ? 'Submitting...' : 'Submit Application'}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Navigation */}
      {currentStep < 5 && (
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handlePrev}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionFormWizard;