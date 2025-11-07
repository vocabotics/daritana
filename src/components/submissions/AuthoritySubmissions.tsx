import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Search,
  Filter,
  Building2,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Calendar,
  MapPin,
  User,
  TrendingUp,
  Download,
  Eye,
  Edit,
  MoreVertical,
  RefreshCw,
  Upload
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { authorityService } from '@/services/authorityService';
import { useAuthStore } from '@/store/authStore';
import { useProjectStore } from '@/store/projectStore';
import SubmissionFormWizard from './SubmissionFormWizard';
import { useAuthoritySync } from '@/hooks/useAuthoritySync';
import { toast } from 'sonner';
import type { 
  BuildingSubmission, 
  SubmissionStatus, 
  BuildingAuthority,
  SubmissionStats,
  getStatusColor,
  getStatusLabel
} from '@/types/authority';

interface AuthoritySubmissionsProps {
  projectId?: string; // Optional - if provided, shows submissions for specific project only
  showWizard?: boolean;
  setShowWizard?: (show: boolean) => void;
  hideHeader?: boolean;
}

export const AuthoritySubmissions: React.FC<AuthoritySubmissionsProps> = ({ 
  projectId, 
  showWizard: externalShowWizard, 
  setShowWizard: externalSetShowWizard,
  hideHeader = false 
}) => {
  const { user } = useAuthStore();
  const { projects } = useProjectStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [submissions, setSubmissions] = useState<BuildingSubmission[]>([]);
  const [authorities, setAuthorities] = useState<BuildingAuthority[]>([]);
  const [stats, setStats] = useState<SubmissionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | 'all'>('all');
  const [authorityFilter, setAuthorityFilter] = useState('all');
  const [internalShowWizard, setInternalShowWizard] = useState(false);
  
  // Use external wizard state if provided, otherwise use internal
  const showWizard = externalShowWizard !== undefined ? externalShowWizard : internalShowWizard;
  const setShowWizard = externalSetShowWizard || setInternalShowWizard;

  // Filter submissions based on search and filters
  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = !searchQuery || 
      submission.internal_reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.project?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.authority?.name_en.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
    const matchesAuthority = authorityFilter === 'all' || submission.authority_id === authorityFilter;
    
    return matchesSearch && matchesStatus && matchesAuthority;
  });

  const canManageSubmissions = user?.role === 'project_lead' || user?.role === 'staff' || user?.role === 'architect';

  // Real-time syncing hook - DISABLED for now to prevent fake notifications
  const [syncStatus, triggerSync] = useAuthoritySync(submissions, {
    interval: 30000, // Sync every 30 seconds
    enabled: false, // DISABLED - no automatic syncing
    onStatusChange: (submission, oldStatus) => {
      // Removed toast notification - too noisy for demo
      loadData(); // Reload all data when status changes
    },
    onError: (error) => {
      // Silent error handling
      console.error('Sync error:', error);
    }
  });

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load authorities
      const authoritiesResult = await authorityService.getAuthorities();
      if (authoritiesResult.success && authoritiesResult.data) {
        setAuthorities(authoritiesResult.data);
      }

      // Load submissions
      const submissionsParams = projectId ? { project_id: projectId } : {};
      const submissionsResult = await authorityService.getSubmissions(submissionsParams);
      if (submissionsResult.success && submissionsResult.data) {
        setSubmissions(submissionsResult.data.submissions);
      }

      // Load statistics
      const statsParams = projectId ? { project_id: projectId } : {};
      const statsResult = await authorityService.getSubmissionStats(statsParams);
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }
    } catch (error) {
      console.error('Failed to load authority submissions data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (submissionId: string) => {
    try {
      await authorityService.syncWithAuthority(submissionId);
      loadData(); // Reload data after sync
    } catch (error) {
      console.error('Failed to sync with authority:', error);
    }
  };

  const handleWizardComplete = (submissionId: string) => {
    setShowWizard(false);
    loadData(); // Reload data to show new submission
    // Optionally show success toast or navigate to submission details
  };

  const handleWizardCancel = () => {
    setShowWizard(false);
  };

  const getStatusColor = (status: SubmissionStatus): string => {
    const colors: Record<SubmissionStatus, string> = {
      'draft': 'bg-gray-100 text-gray-800',
      'submitted': 'bg-blue-100 text-blue-800',
      'acknowledged': 'bg-cyan-100 text-cyan-800',
      'under_review': 'bg-yellow-100 text-yellow-800',
      'additional_info_required': 'bg-orange-100 text-orange-800',
      'site_inspection_scheduled': 'bg-purple-100 text-purple-800',
      'site_inspection_completed': 'bg-indigo-100 text-indigo-800',
      'conditionally_approved': 'bg-lime-100 text-lime-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'expired': 'bg-gray-100 text-gray-800',
      'withdrawn': 'bg-gray-100 text-gray-800',
      'suspended': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: SubmissionStatus): string => {
    const labels: Record<SubmissionStatus, string> = {
      'draft': 'Draft',
      'submitted': 'Submitted',
      'acknowledged': 'Acknowledged',
      'under_review': 'Under Review',
      'additional_info_required': 'Info Required',
      'site_inspection_scheduled': 'Inspection Scheduled',
      'site_inspection_completed': 'Inspection Completed',
      'conditionally_approved': 'Conditionally Approved',
      'approved': 'Approved',
      'rejected': 'Rejected',
      'expired': 'Expired',
      'withdrawn': 'Withdrawn',
      'suspended': 'Suspended'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show wizard if active
  if (showWizard) {
    return (
      <SubmissionFormWizard
        projectId={projectId}
        onComplete={handleWizardComplete}
        onCancel={handleWizardCancel}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - only show when not hidden and not in project context */}
      {!projectId && !hideHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Authority Submissions</h2>
            <p className="text-gray-600">Manage building authority submissions and approvals</p>
            {syncStatus.lastSync && (
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                {syncStatus.syncing ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Syncing {syncStatus.pendingSubmissions} submissions...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    Last synced {formatDistanceToNow(syncStatus.lastSync, { addSuffix: true })}
                  </>
                )}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => triggerSync()}
              disabled={syncStatus.syncing}
            >
              <RefreshCw className={`h-4 w-4 ${syncStatus.syncing ? 'animate-spin' : ''}`} />
            </Button>
            {canManageSubmissions && (
              <Button onClick={() => setShowWizard(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Submission
              </Button>
            )}
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Active
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Completed
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            All Submissions
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.total_submissions}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Clock className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Pending</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.pending_submissions}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Approved</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.approved_submissions}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Fees Paid</p>
                        <p className="text-2xl font-bold text-gray-900">
                          RM {stats.total_fees_paid.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Submissions</CardTitle>
              <CardDescription>Latest submission activities and status updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {submissions.slice(0, 5).map((submission) => (
                  <div key={submission.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{submission.internal_reference}</p>
                        <p className="text-sm text-gray-600">{submission.project?.name}</p>
                        <p className="text-xs text-gray-500">
                          {submission.authority?.name_en}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(submission.status)}>
                        {getStatusLabel(submission.status)}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {submission.updated_at && formatDistanceToNow(new Date(submission.updated_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Submissions Tab */}
        <TabsContent value="active" className="space-y-4">
          {/* Search and Filter */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search submissions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={authorityFilter} onValueChange={setAuthorityFilter}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Filter by authority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Authorities</SelectItem>
                    {authorities.map((authority) => (
                      <SelectItem key={authority.id} value={authority.id}>
                        {authority.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Active Submissions List */}
          <div className="grid gap-4">
            {filteredSubmissions
              .filter(s => !['approved', 'rejected', 'expired', 'withdrawn'].includes(s.status))
              .map((submission) => (
                <motion.div
                  key={submission.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group"
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{submission.internal_reference}</h3>
                            <p className="text-sm text-gray-600">{submission.project?.name}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {submission.authority?.name_en}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {submission.submission_date && format(new Date(submission.submission_date), 'dd MMM yyyy')}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {submission.project?.client_name}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Badge className={getStatusColor(submission.status)}>
                            {getStatusLabel(submission.status)}
                          </Badge>
                          <div className="text-right">
                            <p className="font-semibold">RM {submission.total_fees.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">{submission.payment_status}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleSync(submission.id)}>
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
          </div>
        </TabsContent>

        {/* Completed Tab */}
        <TabsContent value="completed" className="space-y-4">
          <div className="grid gap-4">
            {filteredSubmissions
              .filter(s => ['approved', 'rejected'].includes(s.status))
              .map((submission) => (
                <Card key={submission.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          submission.status === 'approved' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {submission.status === 'approved' ? (
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                          ) : (
                            <AlertCircle className="h-6 w-6 text-red-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{submission.internal_reference}</h3>
                          <p className="text-sm text-gray-600">{submission.project?.name}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {submission.decision_date && `Decided on ${format(new Date(submission.decision_date), 'dd MMM yyyy')}`}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Badge className={getStatusColor(submission.status)}>
                          {getStatusLabel(submission.status)}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Certificate
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        {/* All Submissions Tab */}
        <TabsContent value="all" className="space-y-4">
          {/* Search and Filter */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search submissions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as SubmissionStatus | 'all')}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={authorityFilter} onValueChange={setAuthorityFilter}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Filter by authority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Authorities</SelectItem>
                    {authorities.map((authority) => (
                      <SelectItem key={authority.id} value={authority.id}>
                        {authority.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* All Submissions Grid */}
          <div className="grid gap-4">
            {filteredSubmissions.map((submission) => (
              <Card key={submission.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{submission.internal_reference}</h3>
                        <p className="text-sm text-gray-600">{submission.project?.name}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>{submission.authority?.name_en}</span>
                          <span>{submission.submission_date && format(new Date(submission.submission_date), 'dd MMM yyyy')}</span>
                          <span>RM {submission.total_fees.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Badge className={getStatusColor(submission.status)}>
                        {getStatusLabel(submission.status)}
                      </Badge>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredSubmissions.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No submissions found</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery || statusFilter !== 'all' || authorityFilter !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'Create your first authority submission to get started'
                  }
                </p>
                {canManageSubmissions && !hideHeader && (
                  <Button onClick={() => setShowWizard(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Submission
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AuthoritySubmissions;