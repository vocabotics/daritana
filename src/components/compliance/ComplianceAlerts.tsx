import { useState } from 'react';
import { useComplianceStore } from '@/store/complianceStore';
import { useProjectStore } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Search,
  Filter,
  Bell,
  Calendar,
  User,
  Building
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function ComplianceAlerts() {
  const { complianceAlerts, acknowledgeAlert, resolveAlert } = useComplianceStore();
  const { projects } = useProjectStore();
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredAlerts = complianceAlerts.filter(alert => {
    const project = projects.find(p => p.id === alert.projectId);
    const projectName = project?.name || '';
    
    const matchesSearch = 
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      projectName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
    const matchesType = typeFilter === 'all' || alert.type === typeFilter;
    
    let matchesStatus = true;
    if (statusFilter === 'active') {
      matchesStatus = !alert.resolved;
    } else if (statusFilter === 'acknowledged') {
      matchesStatus = alert.acknowledged && !alert.resolved;
    } else if (statusFilter === 'unacknowledged') {
      matchesStatus = !alert.acknowledged && !alert.resolved;
    } else if (statusFilter === 'resolved') {
      matchesStatus = alert.resolved;
    }
    
    return matchesSearch && matchesSeverity && matchesType && matchesStatus;
  });

  const getSeverityConfig = (severity: string) => {
    const configs = {
      critical: { 
        color: 'bg-red-100 border-red-300 text-red-800', 
        badge: 'destructive' as const,
        icon: 'text-red-600'
      },
      high: { 
        color: 'bg-orange-100 border-orange-300 text-orange-800', 
        badge: 'destructive' as const,
        icon: 'text-orange-600'
      },
      medium: { 
        color: 'bg-yellow-100 border-yellow-300 text-yellow-800', 
        badge: 'warning' as const,
        icon: 'text-yellow-600'
      },
      low: { 
        color: 'bg-blue-100 border-blue-300 text-blue-800', 
        badge: 'default' as const,
        icon: 'text-blue-600'
      }
    };
    return configs[severity as keyof typeof configs] || configs.medium;
  };

  const getTypeLabel = (type: string) => {
    const typeLabels = {
      non_compliance_detected: 'Non-Compliance Detected',
      submission_overdue: 'Submission Overdue',
      approval_expiring: 'Approval Expiring',
      inspection_required: 'Inspection Required',
      document_missing: 'Document Missing',
      calculation_error: 'Calculation Error',
      rule_update: 'Rule Update',
      authority_response: 'Authority Response',
      corrective_action_overdue: 'Corrective Action Overdue'
    };
    return typeLabels[type as keyof typeof typeLabels] || type;
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  const handleAcknowledge = (alertId: string) => {
    if (!user) return;
    acknowledgeAlert(alertId, user.id);
    toast.success('Alert acknowledged');
  };

  const handleResolve = (alertId: string) => {
    if (confirm('Mark this alert as resolved?')) {
      resolveAlert(alertId);
      toast.success('Alert resolved');
    }
  };

  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    // Sort by severity first (critical > high > medium > low)
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const severityDiff = severityOrder[a.severity as keyof typeof severityOrder] - 
                        severityOrder[b.severity as keyof typeof severityOrder];
    
    if (severityDiff !== 0) return severityDiff;
    
    // Then by date (newest first)
    return new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime();
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search alerts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="unacknowledged">Unacknowledged</SelectItem>
            <SelectItem value="acknowledged">Acknowledged</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Alert Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="non_compliance_detected">Non-Compliance</SelectItem>
            <SelectItem value="submission_overdue">Submission Overdue</SelectItem>
            <SelectItem value="approval_expiring">Approval Expiring</SelectItem>
            <SelectItem value="inspection_required">Inspection Required</SelectItem>
            <SelectItem value="document_missing">Document Missing</SelectItem>
            <SelectItem value="calculation_error">Calculation Error</SelectItem>
            <SelectItem value="rule_update">Rule Update</SelectItem>
            <SelectItem value="authority_response">Authority Response</SelectItem>
            <SelectItem value="corrective_action_overdue">Action Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {sortedAlerts.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <p className="text-lg font-medium">No alerts found</p>
                <p className="text-sm text-muted-foreground">
                  {statusFilter === 'active' ? 'All compliance alerts are resolved' : 'No alerts match your filters'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          sortedAlerts.map((alert) => {
            const severityConfig = getSeverityConfig(alert.severity);
            
            return (
              <Card key={alert.id} className={`${severityConfig.color} border-l-4`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className={`h-5 w-5 mt-0.5 ${severityConfig.icon}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg">{alert.title}</CardTitle>
                          <Badge variant={severityConfig.badge}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                          {alert.actionRequired && (
                            <Badge variant="outline">
                              <Clock className="h-3 w-3 mr-1" />
                              Action Required
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                          <div className="flex items-center gap-1">
                            <Building className="h-4 w-4" />
                            {getProjectName(alert.projectId)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Bell className="h-4 w-4" />
                            {getTypeLabel(alert.type)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(alert.triggeredAt), 'MMM dd, yyyy HH:mm')}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {alert.resolved ? (
                        <Badge variant="success">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Resolved
                        </Badge>
                      ) : (
                        <>
                          {!alert.acknowledged && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAcknowledge(alert.id)}
                            >
                              Acknowledge
                            </Button>
                          )}
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleResolve(alert.id)}
                          >
                            Resolve
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="mb-4">{alert.message}</p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      {alert.dueDate && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          Due: {format(new Date(alert.dueDate), 'MMM dd, yyyy')}
                        </div>
                      )}
                      
                      {alert.acknowledged && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <User className="h-4 w-4" />
                          Acknowledged by {alert.acknowledgedBy} on{' '}
                          {alert.acknowledgedAt && format(new Date(alert.acknowledgedAt), 'MMM dd, yyyy')}
                        </div>
                      )}
                    </div>
                    
                    {alert.resolved && alert.resolvedAt && (
                      <div className="text-green-600 text-sm">
                        Resolved on {format(new Date(alert.resolvedAt), 'MMM dd, yyyy HH:mm')}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}