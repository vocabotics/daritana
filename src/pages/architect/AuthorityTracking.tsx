import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building,
  Flame,
  Zap,
  Droplets,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Upload,
  Send,
  Eye,
  Calendar,
  MapPin,
  CheckCheck
} from 'lucide-react';
import PageWrapper from '@/components/PageWrapper';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';

/**
 * Authority Submission Tracking
 * Track submissions to Malaysian authorities:
 * - Local Councils (DBKL, PBT, MPK, etc.)
 * - Bomba (Fire Department)
 * - TNB (Electricity)
 * - IWK (Sewerage)
 * - JKR (Public Works)
 * - DID (Drainage and Irrigation)
 */

interface Submission {
  id: string;
  authority: string;
  type: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'resubmitted';
  submittedDate?: Date;
  reviewedDate?: Date;
  approvedDate?: Date;
  referenceNumber?: string;
  documents: string[];
  comments?: string;
  conditions?: string[];
  nextAction?: string;
  dueDate?: Date;
}

interface Authority {
  id: string;
  name: string;
  shortName: string;
  icon: any;
  color: string;
  submissions: Submission[];
}

export default function AuthorityTracking() {
  const [selectedProject] = useState('proj-1');
  const [selectedAuthority, setSelectedAuthority] = useState<string>('dbkl');

  // Malaysian Authorities
  const authorities: Authority[] = [
    {
      id: 'dbkl',
      name: 'Dewan Bandaraya Kuala Lumpur',
      shortName: 'DBKL',
      icon: Building,
      color: 'blue',
      submissions: [
        {
          id: 'dbkl-1',
          authority: 'DBKL',
          type: 'Building Plan Approval',
          status: 'under_review',
          submittedDate: new Date('2025-10-01'),
          referenceNumber: 'BP/2025/001234',
          documents: [
            'Architectural_Plans.pdf',
            'Structural_Drawings.pdf',
            'M&E_Drawings.pdf',
            'Soil_Investigation_Report.pdf',
          ],
          nextAction: 'Awaiting technical review',
          dueDate: new Date('2025-12-01'),
        },
        {
          id: 'dbkl-2',
          authority: 'DBKL',
          type: 'Amendment to Approved Plans',
          status: 'draft',
          documents: [],
          nextAction: 'Prepare amendment documents',
        },
        {
          id: 'dbkl-3',
          authority: 'DBKL',
          type: 'Certificate of Completion and Compliance (CCC)',
          status: 'draft',
          documents: [],
          nextAction: 'To be submitted upon completion',
        },
      ],
    },
    {
      id: 'bomba',
      name: 'Jabatan Bomba dan Penyelamat Malaysia',
      shortName: 'BOMBA',
      icon: Flame,
      color: 'red',
      submissions: [
        {
          id: 'bomba-1',
          authority: 'BOMBA',
          type: 'Fire Safety Plan (FSP)',
          status: 'submitted',
          submittedDate: new Date('2025-10-15'),
          referenceNumber: 'BOMBA/FSP/2025/5678',
          documents: [
            'Fire_Safety_Plan.pdf',
            'Fire_Protection_System.pdf',
            'Evacuation_Plan.pdf',
          ],
          comments: 'Pending site inspection',
          nextAction: 'Schedule site inspection with Bomba officer',
          dueDate: new Date('2025-11-30'),
        },
        {
          id: 'bomba-2',
          authority: 'BOMBA',
          type: 'Fire Certificate (FC)',
          status: 'draft',
          documents: [],
          nextAction: 'Submit after FSP approval',
        },
      ],
    },
    {
      id: 'tnb',
      name: 'Tenaga Nasional Berhad',
      shortName: 'TNB',
      icon: Zap,
      color: 'yellow',
      submissions: [
        {
          id: 'tnb-1',
          authority: 'TNB',
          type: 'Electricity Supply Application',
          status: 'approved',
          submittedDate: new Date('2025-09-01'),
          approvedDate: new Date('2025-10-01'),
          referenceNumber: 'TNB/APP/2025/9876',
          documents: ['Electrical_Single_Line.pdf', 'Load_Calculation.pdf'],
          conditions: [
            'Install substation as per TNB specifications',
            'Submit meter installation request 2 weeks before TOP',
          ],
        },
        {
          id: 'tnb-2',
          authority: 'TNB',
          type: 'Substation Design Approval',
          status: 'under_review',
          submittedDate: new Date('2025-10-10'),
          referenceNumber: 'TNB/SS/2025/5432',
          documents: ['Substation_Layout.pdf', 'Substation_Specs.pdf'],
          nextAction: 'Awaiting TNB technical review',
        },
      ],
    },
    {
      id: 'iwk',
      name: 'Indah Water Konsortium',
      shortName: 'IWK',
      icon: Droplets,
      color: 'cyan',
      submissions: [
        {
          id: 'iwk-1',
          authority: 'IWK',
          type: 'Sewerage Connection Approval',
          status: 'approved',
          submittedDate: new Date('2025-09-15'),
          approvedDate: new Date('2025-10-05'),
          referenceNumber: 'IWK/SCA/2025/3456',
          documents: ['Sewerage_Layout.pdf', 'Plumbing_Drawings.pdf'],
          conditions: ['Pay connection fees before construction', 'Submit as-built drawings after completion'],
        },
      ],
    },
    {
      id: 'jkr',
      name: 'Jabatan Kerja Raya',
      shortName: 'JKR',
      icon: MapPin,
      color: 'green',
      submissions: [
        {
          id: 'jkr-1',
          authority: 'JKR',
          type: 'Road Access Approval',
          status: 'submitted',
          submittedDate: new Date('2025-10-20'),
          referenceNumber: 'JKR/RA/2025/7890',
          documents: ['Access_Plan.pdf', 'Traffic_Impact_Assessment.pdf'],
          nextAction: 'Awaiting JKR site visit',
        },
      ],
    },
    {
      id: 'did',
      name: 'Department of Irrigation and Drainage',
      shortName: 'DID',
      icon: Droplets,
      color: 'blue',
      submissions: [
        {
          id: 'did-1',
          authority: 'DID',
          type: 'Earthwork and Drainage Approval',
          status: 'under_review',
          submittedDate: new Date('2025-10-05'),
          referenceNumber: 'DID/ED/2025/2345',
          documents: ['Earthwork_Plan.pdf', 'Stormwater_Drainage.pdf', 'OSD_Design.pdf'],
          nextAction: 'Awaiting technical review',
        },
      ],
    },
  ];

  const getStatusBadge = (status: Submission['status']) => {
    const variants = {
      draft: { variant: 'secondary' as const, label: 'Draft', icon: FileText },
      submitted: { variant: 'default' as const, label: 'Submitted', icon: Send },
      under_review: { variant: 'default' as const, label: 'Under Review', icon: Eye },
      approved: { variant: 'default' as const, label: 'Approved', icon: CheckCircle2 },
      rejected: { variant: 'destructive' as const, label: 'Rejected', icon: AlertCircle },
      resubmitted: { variant: 'default' as const, label: 'Resubmitted', icon: Send },
    };

    const config = variants[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const currentAuthority = authorities.find((a) => a.id === selectedAuthority);

  const totalSubmissions = authorities.reduce((sum, auth) => sum + auth.submissions.length, 0);
  const approvedCount = authorities.reduce(
    (sum, auth) => sum + auth.submissions.filter((s) => s.status === 'approved').length,
    0
  );
  const pendingCount = authorities.reduce(
    (sum, auth) =>
      sum +
      auth.submissions.filter(
        (s) => s.status === 'submitted' || s.status === 'under_review'
      ).length,
    0
  );
  const draftCount = authorities.reduce(
    (sum, auth) => sum + auth.submissions.filter((s) => s.status === 'draft').length,
    0
  );

  return (
    <PageWrapper title="Authority Submissions">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Submissions</p>
                <p className="text-2xl font-bold">{totalSubmissions}</p>
              </div>
              <FileText className="w-8 h-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Approved</p>
                <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Review</p>
                <p className="text-2xl font-bold text-blue-600">{pendingCount}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Draft</p>
                <p className="text-2xl font-bold text-gray-600">{draftCount}</p>
              </div>
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Authorities List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Authorities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {authorities.map((auth) => {
              const Icon = auth.icon;
              const pending = auth.submissions.filter(
                (s) => s.status === 'submitted' || s.status === 'under_review'
              ).length;

              return (
                <button
                  key={auth.id}
                  onClick={() => setSelectedAuthority(auth.id)}
                  className={cn(
                    'w-full text-left p-3 rounded-lg transition-all',
                    selectedAuthority === auth.id
                      ? 'bg-black text-white'
                      : 'bg-gray-50 hover:bg-gray-100'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{auth.shortName}</p>
                      <p className="text-xs opacity-70 truncate">{auth.name}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs opacity-70">
                          {auth.submissions.length} submission{auth.submissions.length !== 1 ? 's' : ''}
                        </span>
                        {pending > 0 && (
                          <Badge
                            variant="secondary"
                            className={cn(
                              'text-xs px-1.5 py-0',
                              selectedAuthority === auth.id ? 'bg-white/20 text-white' : ''
                            )}
                          >
                            {pending} pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Submissions Detail */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {currentAuthority && (
                  <>
                    <currentAuthority.icon className="w-6 h-6" />
                    <div>
                      <CardTitle>{currentAuthority.name}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        {currentAuthority.submissions.length} submission{currentAuthority.submissions.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </>
                )}
              </div>
              <Button
                onClick={() =>
                  toast.info('New submission form will be implemented')
                }
              >
                <Send className="w-4 h-4 mr-2" />
                New Submission
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentAuthority?.submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{sub.type}</h4>
                        {getStatusBadge(sub.status)}
                      </div>
                      {sub.referenceNumber && (
                        <p className="text-sm text-gray-500 mt-1 font-mono">
                          Ref: {sub.referenceNumber}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {sub.submittedDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <Send className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-gray-500">Submitted</p>
                          <p className="font-medium">
                            {format(sub.submittedDate, 'dd MMM yyyy')}
                          </p>
                        </div>
                      </div>
                    )}
                    {sub.approvedDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <div>
                          <p className="text-gray-500">Approved</p>
                          <p className="font-medium text-green-600">
                            {format(sub.approvedDate, 'dd MMM yyyy')}
                          </p>
                        </div>
                      </div>
                    )}
                    {sub.dueDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-orange-400" />
                        <div>
                          <p className="text-gray-500">Due Date</p>
                          <p className="font-medium">
                            {format(sub.dueDate, 'dd MMM yyyy')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Documents */}
                  {sub.documents.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">
                        Documents ({sub.documents.length})
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {sub.documents.map((doc, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 text-sm bg-gray-50 px-3 py-2 rounded hover:bg-gray-100 cursor-pointer"
                          >
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span className="flex-1 truncate">{doc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Comments */}
                  {sub.comments && (
                    <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-900">
                        <strong>Comments:</strong> {sub.comments}
                      </p>
                    </div>
                  )}

                  {/* Conditions */}
                  {sub.conditions && sub.conditions.length > 0 && (
                    <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-yellow-900 mb-2">
                        Approval Conditions:
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        {sub.conditions.map((cond, idx) => (
                          <li key={idx} className="text-sm text-yellow-800">
                            {cond}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Next Action */}
                  {sub.nextAction && (
                    <div className="flex items-start gap-2 bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <AlertCircle className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-purple-900">Next Action:</p>
                        <p className="text-sm text-purple-800">{sub.nextAction}</p>
                      </div>
                    </div>
                  )}
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
            <Building className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">
                About Authority Submissions
              </h4>
              <p className="text-sm text-blue-700">
                All building projects in Malaysia require approvals from multiple authorities. This
                module helps you track submissions to local councils (DBKL, PBT, MPK), Bomba (fire
                safety), TNB (electricity), IWK (sewerage), JKR (road access), and DID (drainage).
                Each authority has specific requirements and timeframes.
              </p>
              <p className="text-sm text-blue-700 mt-2">
                <strong>Tip:</strong> Start submissions early as review periods can take 3-6 months.
                Some approvals are sequential (e.g., need building plan approval before Bomba FSP).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
