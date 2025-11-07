import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  FileCheck,
  Building,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  FileText
} from 'lucide-react';
import { complianceService, ComplianceDashboard as DashboardData, ComplianceAlert } from '@/services/compliance.service';
import { toast } from 'sonner';

export default function ComplianceDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const [dashboard, alertsData] = await Promise.all([
        complianceService.getDashboard(),
        complianceService.getAlerts()
      ]);
      setDashboardData(dashboard);
      setAlerts(alertsData);
    } catch (error) {
      console.error('Error fetching compliance dashboard:', error);
      toast.error('Failed to load compliance dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getSeverityColor = (severity: string) => {
    const colors = {
      error: 'text-red-600',
      warning: 'text-orange-600',
      info: 'text-blue-600'
    };
    return colors[severity as keyof typeof colors] || 'text-gray-600';
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, 'destructive' | 'warning' | 'default'> = {
      error: 'destructive',
      warning: 'warning',
      info: 'default'
    };
    return variants[severity] || 'default';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'REJECTED':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'SUBMITTED':
        return <Clock className="h-4 w-4 text-orange-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-2 w-full mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Failed to load compliance dashboard</p>
          <Button variant="outline" className="mt-4" onClick={fetchDashboardData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { summary, recentActivity } = dashboardData;
  const criticalAlerts = alerts.filter(a => a.type === 'error').length;
  const warningAlerts = alerts.filter(a => a.type === 'warning').length;

  return (
    <div className="space-y-6">
      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={fetchDashboardData}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Compliance</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.complianceScore}%</div>
            <Progress value={summary.complianceScore} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {summary.compliantProjects} of {summary.totalProjects} projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects with Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{summary.projectsWithIssues}</div>
            <p className="text-xs text-muted-foreground">
              Requiring attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Submissions</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{summary.pendingSubmissions}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.rejectedSubmissions}</div>
            <p className="text-xs text-muted-foreground">
              Need resubmission
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliant Projects</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summary.compliantProjects}
            </div>
            <p className="text-xs text-muted-foreground">
              Fully compliant
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm">Critical Issues</span>
                </div>
                <Badge variant="destructive">{criticalAlerts}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">Warnings</span>
                </div>
                <Badge variant="warning">{warningAlerts}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Information</span>
                </div>
                <Badge variant="default">{alerts.length - criticalAlerts - warningAlerts}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Compliance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32">
              {summary.complianceScore >= 80 ? (
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-green-600">Good Compliance</p>
                  <p className="text-xs text-muted-foreground">Maintain current standards</p>
                </div>
              ) : summary.complianceScore >= 60 ? (
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-orange-600">Needs Improvement</p>
                  <p className="text-xs text-muted-foreground">Focus on pending items</p>
                </div>
              ) : (
                <div className="text-center">
                  <TrendingDown className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-red-600">Critical</p>
                  <p className="text-xs text-muted-foreground">Immediate action required</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Submissions Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.slice(0, 10).map((submission) => (
                <div key={submission.id} className="flex items-start gap-3 p-3 rounded-lg border">
                  {getStatusIcon(submission.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium">{submission.submissionType}</h4>
                      <Badge variant={
                        submission.status === 'APPROVED' ? 'success' :
                        submission.status === 'REJECTED' ? 'destructive' :
                        submission.status === 'SUBMITTED' ? 'warning' :
                        'secondary'
                      }>
                        {submission.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {submission.authority?.name} • Ref: {submission.referenceNumber || 'N/A'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(submission.updatedAt).toLocaleDateString()} • 
                      Project: {submission.project?.name || 'Unknown'}
                    </p>
                    {submission.rejectionReason && (
                      <p className="text-xs text-red-600 mt-1">
                        Reason: {submission.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent submission activity</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Compliance Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts.length > 0 ? (
              alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg border">
                  <AlertTriangle className={`h-5 w-5 mt-0.5 ${getSeverityColor(alert.type)}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium">{alert.message}</h4>
                      <Badge variant={getSeverityBadge(alert.type)}>
                        {alert.type}
                      </Badge>
                    </div>
                    {alert.project && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Project: {alert.project.name} ({alert.project.code})
                      </p>
                    )}
                    {alert.authority && (
                      <p className="text-xs text-muted-foreground">
                        Authority: {alert.authority.name}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(alert.createdAt).toLocaleDateString()} • 
                      Type: {alert.submissionType || 'General'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No active compliance alerts</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}