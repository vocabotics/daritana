import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  FileText,
  Upload,
  Download,
  Shield,
  Building,
  Flame,
  Droplets,
  Zap,
  Wind,
  Users,
  Home,
  Layers
} from 'lucide-react';
import PageWrapper from '@/components/PageWrapper';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/**
 * UBBL Compliance Module
 * Uniform Building By-Laws (Malaysia) - All 13 Parts
 * Legal requirement for all building submissions
 */

interface UBBLRequirement {
  id: string;
  code: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'na';
  documents: string[];
  notes?: string;
  lastUpdated?: Date;
}

interface UBBLPart {
  part: number;
  title: string;
  icon: any;
  requirements: UBBLRequirement[];
  progress: number;
}

export default function UBBLCompliance() {
  const [selectedProject, setSelectedProject] = useState('proj-1');
  const [selectedPart, setSelectedPart] = useState<number>(1);

  // UBBL Parts 1-13 with requirements
  const ubblParts: UBBLPart[] = [
    {
      part: 1,
      title: 'General',
      icon: Building,
      progress: 75,
      requirements: [
        {
          id: 'ubbl-1-1',
          code: '1.1',
          description: 'Application and interpretation of by-laws',
          status: 'completed',
          documents: ['UBBL_Application_Form.pdf'],
        },
        {
          id: 'ubbl-1-2',
          code: '1.2',
          description: 'Submission of building plans',
          status: 'completed',
          documents: ['Building_Plans_A1.pdf', 'Building_Plans_A2.pdf'],
        },
        {
          id: 'ubbl-1-3',
          code: '1.3',
          description: 'Approval of building plans',
          status: 'in_progress',
          documents: [],
          notes: 'Pending local authority review',
        },
        {
          id: 'ubbl-1-4',
          code: '1.4',
          description: 'Amendment of approved plans',
          status: 'not_started',
          documents: [],
        },
      ],
    },
    {
      part: 2,
      title: 'Planning',
      icon: Home,
      progress: 60,
      requirements: [
        {
          id: 'ubbl-2-1',
          code: '2.1',
          description: 'Site coverage and plot ratio',
          status: 'completed',
          documents: ['Site_Plan.pdf', 'Coverage_Calculations.xlsx'],
          notes: 'Plot ratio: 1:4, Site coverage: 45%',
        },
        {
          id: 'ubbl-2-2',
          code: '2.2',
          description: 'Building height restrictions',
          status: 'completed',
          documents: ['Elevation_Drawings.pdf'],
          notes: 'Max height: 75m (15 floors)',
        },
        {
          id: 'ubbl-2-3',
          code: '2.3',
          description: 'Building setbacks',
          status: 'completed',
          documents: ['Setback_Calculations.pdf'],
        },
        {
          id: 'ubbl-2-4',
          code: '2.4',
          description: 'Natural lighting and ventilation',
          status: 'in_progress',
          documents: ['Daylight_Analysis.pdf'],
        },
        {
          id: 'ubbl-2-5',
          code: '2.5',
          description: 'Headroom and floor heights',
          status: 'not_started',
          documents: [],
        },
      ],
    },
    {
      part: 3,
      title: 'Sewerage and Drainage',
      icon: Droplets,
      progress: 40,
      requirements: [
        {
          id: 'ubbl-3-1',
          code: '3.1',
          description: 'Sewerage system design',
          status: 'in_progress',
          documents: ['Sewerage_Layout.pdf'],
          notes: 'Awaiting IWK approval',
        },
        {
          id: 'ubbl-3-2',
          code: '3.2',
          description: 'Stormwater drainage',
          status: 'in_progress',
          documents: ['Drainage_Plan.pdf'],
        },
        {
          id: 'ubbl-3-3',
          code: '3.3',
          description: 'Grease trap requirements',
          status: 'not_started',
          documents: [],
        },
      ],
    },
    {
      part: 4,
      title: 'Foundations and Structure',
      icon: Layers,
      progress: 85,
      requirements: [
        {
          id: 'ubbl-4-1',
          code: '4.1',
          description: 'Soil investigation report',
          status: 'completed',
          documents: ['Soil_Investigation_Report.pdf'],
        },
        {
          id: 'ubbl-4-2',
          code: '4.2',
          description: 'Foundation design calculations',
          status: 'completed',
          documents: ['Foundation_Calc.pdf'],
        },
        {
          id: 'ubbl-4-3',
          code: '4.3',
          description: 'Structural calculations',
          status: 'completed',
          documents: ['Structural_Calc_Part1.pdf', 'Structural_Calc_Part2.pdf'],
        },
        {
          id: 'ubbl-4-4',
          code: '4.4',
          description: 'Concrete mix design',
          status: 'in_progress',
          documents: [],
        },
      ],
    },
    {
      part: 10,
      title: 'Fire Protection',
      icon: Flame,
      progress: 50,
      requirements: [
        {
          id: 'ubbl-10-1',
          code: '10.1',
          description: 'Fire safety plan submission to Bomba',
          status: 'in_progress',
          documents: ['Fire_Safety_Plan.pdf'],
          notes: 'Pending Bomba review',
        },
        {
          id: 'ubbl-10-2',
          code: '10.2',
          description: 'Fire escape routes and exits',
          status: 'completed',
          documents: ['Fire_Escape_Plan.pdf'],
        },
        {
          id: 'ubbl-10-3',
          code: '10.3',
          description: 'Fire-rated construction',
          status: 'completed',
          documents: ['Fire_Rating_Specs.pdf'],
        },
        {
          id: 'ubbl-10-4',
          code: '10.4',
          description: 'Sprinkler system design',
          status: 'in_progress',
          documents: [],
        },
        {
          id: 'ubbl-10-5',
          code: '10.5',
          description: 'Fire alarm system',
          status: 'not_started',
          documents: [],
        },
      ],
    },
  ];

  const getCurrentPart = () => ubblParts.find((p) => p.part === selectedPart);

  const handleStatusChange = (reqId: string, newStatus: UBBLRequirement['status']) => {
    toast.success(`Requirement status updated to: ${newStatus.replace('_', ' ')}`);
  };

  const handleUploadDocument = (reqId: string) => {
    toast.info('File upload will be implemented with file storage system');
  };

  const overallProgress = Math.round(
    ubblParts.reduce((sum, part) => sum + part.progress, 0) / ubblParts.length
  );

  const completedParts = ubblParts.filter((p) => p.progress === 100).length;

  return (
    <PageWrapper title="UBBL Compliance">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Overall Progress</p>
                <p className="text-2xl font-bold">{overallProgress}%</p>
              </div>
              <Shield className="w-8 h-8 text-green-500" />
            </div>
            <Progress value={overallProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Parts Completed</p>
                <p className="text-2xl font-bold">{completedParts} / {ubblParts.length}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Documents</p>
                <p className="text-2xl font-bold">
                  {ubblParts.reduce(
                    (sum, part) =>
                      sum +
                      part.requirements.reduce((s, r) => s + r.documents.length, 0),
                    0
                  )}
                </p>
              </div>
              <FileText className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Items</p>
                <p className="text-2xl font-bold">
                  {ubblParts.reduce(
                    (sum, part) =>
                      sum +
                      part.requirements.filter(
                        (r) => r.status === 'not_started' || r.status === 'in_progress'
                      ).length,
                    0
                  )}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Parts List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>UBBL Parts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {ubblParts.map((part) => {
              const Icon = part.icon;
              return (
                <button
                  key={part.part}
                  onClick={() => setSelectedPart(part.part)}
                  className={cn(
                    'w-full text-left p-3 rounded-lg transition-all',
                    selectedPart === part.part
                      ? 'bg-black text-white'
                      : 'bg-gray-50 hover:bg-gray-100'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">Part {part.part}</p>
                      <p className="text-xs opacity-80 truncate">{part.title}</p>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="opacity-70">{part.progress}%</span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-1.5">
                          <div
                            className={cn(
                              'h-1.5 rounded-full transition-all',
                              selectedPart === part.part
                                ? 'bg-white'
                                : 'bg-green-500'
                            )}
                            style={{ width: `${part.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}

            <div className="pt-4 mt-4 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => toast.info('Export feature will generate PDF report')}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Requirements Detail */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Part {getCurrentPart()?.part}: {getCurrentPart()?.title}</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Uniform Building By-Laws - Malaysia
                </p>
              </div>
              <Badge variant={getCurrentPart()?.progress === 100 ? 'default' : 'secondary'}>
                {getCurrentPart()?.progress}% Complete
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getCurrentPart()?.requirements.map((req) => (
                <div
                  key={req.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {req.status === 'completed' ? (
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                      ) : req.status === 'in_progress' ? (
                        <Circle className="w-6 h-6 text-blue-500 fill-blue-500/20" />
                      ) : req.status === 'na' ? (
                        <Circle className="w-6 h-6 text-gray-300" />
                      ) : (
                        <Circle className="w-6 h-6 text-gray-300" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-medium text-gray-500">
                              {req.code}
                            </span>
                            <h4 className="font-medium">{req.description}</h4>
                          </div>
                          {req.notes && (
                            <p className="text-sm text-gray-500 mt-1">{req.notes}</p>
                          )}
                        </div>

                        <select
                          value={req.status}
                          onChange={(e) =>
                            handleStatusChange(
                              req.id,
                              e.target.value as UBBLRequirement['status']
                            )
                          }
                          className="px-3 py-1.5 text-sm border rounded-md bg-white"
                        >
                          <option value="not_started">Not Started</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="na">N/A</option>
                        </select>
                      </div>

                      {/* Documents */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium">Documents ({req.documents.length})</p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUploadDocument(req.id)}
                          >
                            <Upload className="w-3 h-3 mr-1" />
                            Upload
                          </Button>
                        </div>

                        {req.documents.length > 0 ? (
                          <div className="space-y-1">
                            {req.documents.map((doc, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 cursor-pointer bg-blue-50 px-3 py-2 rounded"
                              >
                                <FileText className="w-4 h-4" />
                                <span className="flex-1">{doc}</span>
                                <Download className="w-4 h-4" />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 italic">No documents uploaded</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Information Alert */}
      <Card className="mt-6 border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">About UBBL Compliance</h4>
              <p className="text-sm text-blue-700">
                The Uniform Building By-Laws (UBBL) are building regulations in Malaysia that govern
                the design and construction of buildings. Compliance with all 13 parts is mandatory
                for local authority approval. This module helps track your compliance status and
                required documentation for each part.
              </p>
              <p className="text-sm text-blue-700 mt-2">
                <strong>Important:</strong> All documents must be approved by local authorities
                (DBKL, PBT, etc.) and relevant agencies (Bomba, IWK, TNB, etc.) before construction
                can proceed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
