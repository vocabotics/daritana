import React, { useState, useEffect } from 'react';
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
  CheckCheck,
  Loader2
} from 'lucide-react';
import PageWrapper from '@/components/PageWrapper';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuthoritySubmissionsStore } from '@/store/architect/authoritySubmissionsStore';

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

  // ✅ Connect to backend store
  const { submissions, loading, error, fetchSubmissions, clearError } = useAuthoritySubmissionsStore();

  // ✅ Fetch data from backend on mount
  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  // ✅ Loading state
  if (loading) {
    return (
      <PageWrapper title="Authority Submissions">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Loading authority submissions...</span>
        </div>
      </PageWrapper>
    );
  }

  // ✅ Error state
  if (error) {
    return (
      <PageWrapper title="Authority Submissions">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-900 font-medium">Error: {error}</p>
          <Button
            onClick={() => {
              clearError();
              fetchSubmissions();
            }}
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </PageWrapper>
    );
  }

  // ✅ Group submissions by authority from backend data
  const groupSubmissionsByAuthority = () => {
    const grouped = submissions.reduce((acc, submission) => {
      const authorityId = submission.authority || 'other';
      if (!acc[authorityId]) {
        acc[authorityId] = [];
      }
      acc[authorityId].push(submission);
      return acc;
    }, {} as Record<string, typeof submissions>);

    return grouped;
  };

  // ✅ Define authority metadata (UI display data only)
  const authorityMetadata: Record<string, { name: string; shortName: string; icon: any; color: string }> = {
    'dbkl': {
      name: 'Dewan Bandaraya Kuala Lumpur',
      shortName: 'DBKL',
      icon: Building,
      color: 'blue',
    },
    'bomba': {
      name: 'Jabatan Bomba dan Penyelamat',
      shortName: 'Bomba',
      icon: Flame,
      color: 'red',
    },
    'tnb': {
      name: 'Tenaga Nasional Berhad',
      shortName: 'TNB',
      icon: Zap,
      color: 'yellow',
    },
    'iwk': {
      name: 'Indah Water Konsortium',
      shortName: 'IWK',
      icon: Droplets,
      color: 'cyan',
    },
  };

  const groupedSubmissions = groupSubmissionsByAuthority();
  const authorities = Object.keys(groupedSubmissions).map(authorityId => ({
    id: authorityId,
    ...authorityMetadata[authorityId] || {
      name: authorityId.toUpperCase(),
      shortName: authorityId.toUpperCase(),
      icon: FileText,
      color: 'gray',
    },
    submissions: groupedSubmissions[authorityId],
  }));

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
