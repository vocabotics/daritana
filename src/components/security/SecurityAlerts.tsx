import { useMFAStore } from '@/store/mfaStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  Shield, 
  Monitor, 
  Key, 
  Lock,
  CheckCircle2,
  Clock,
  Info
} from 'lucide-react';
import { format } from 'date-fns';

interface SecurityAlertsProps {
  userId: string;
}

export default function SecurityAlerts({ userId }: SecurityAlertsProps) {
  const { securityAlerts, acknowledgeSecurityAlert } = useMFAStore();
  
  const userAlerts = securityAlerts.filter(alert => alert.userId === userId);
  const unacknowledgedAlerts = userAlerts.filter(alert => !alert.acknowledged);

  const getAlertIcon = (type: string) => {
    const icons = {
      suspicious_login: AlertTriangle,
      new_device_login: Monitor,
      failed_mfa_attempts: Shield,
      mfa_disabled: Key,
      backup_codes_used: Key,
      password_changed: Lock,
      email_changed: Info,
      phone_changed: Info,
      account_locked: Lock
    };
    return icons[type as keyof typeof icons] || AlertTriangle;
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      critical: 'destructive',
      high: 'destructive', 
      medium: 'warning',
      low: 'secondary'
    };
    return colors[severity as keyof typeof colors] || 'secondary';
  };

  const getSeverityIcon = (severity: string) => {
    if (severity === 'critical' || severity === 'high') return AlertTriangle;
    if (severity === 'medium') return Info;
    return CheckCircle2;
  };

  const handleAcknowledge = (alertId: string) => {
    acknowledgeSecurityAlert(alertId);
  };

  if (userAlerts.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">All Clear</h3>
        <p className="text-muted-foreground">
          No security alerts for your account
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {unacknowledgedAlerts.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have {unacknowledgedAlerts.length} unacknowledged security alert
            {unacknowledgedAlerts.length > 1 ? 's' : ''} requiring your attention.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        {userAlerts.map((alert) => {
          const IconComponent = getAlertIcon(alert.type);
          const SeverityIcon = getSeverityIcon(alert.severity);
          
          return (
            <Card key={alert.id} className={`${
              !alert.acknowledged ? 'border-orange-200 bg-orange-50/50' : ''
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      alert.severity === 'critical' || alert.severity === 'high' 
                        ? 'bg-red-100' 
                        : alert.severity === 'medium'
                        ? 'bg-yellow-100'
                        : 'bg-blue-100'
                    }`}>
                      <IconComponent className={`h-4 w-4 ${
                        alert.severity === 'critical' || alert.severity === 'high'
                          ? 'text-red-600'
                          : alert.severity === 'medium'
                          ? 'text-yellow-600'
                          : 'text-blue-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-base">{alert.title}</CardTitle>
                        <Badge variant={getSeverityColor(alert.severity) as any}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                        {!alert.acknowledged && (
                          <Badge variant="outline" className="text-orange-600 border-orange-200">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {alert.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(alert.timestamp), 'MMM dd, yyyy HH:mm')}
                        </div>
                        {alert.metadata.location && (
                          <span>📍 {alert.metadata.location}</span>
                        )}
                        {alert.metadata.device && (
                          <span>💻 {alert.metadata.device}</span>
                        )}
                        {alert.metadata.ipAddress && (
                          <span>🌐 {alert.metadata.ipAddress}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {!alert.acknowledged && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAcknowledge(alert.id)}
                    >
                      Acknowledge
                    </Button>
                  )}
                </div>
              </CardHeader>
              
              {alert.acknowledged && (
                <CardContent className="pt-0">
                  <div className="text-xs text-muted-foreground">
                    Acknowledged on {alert.acknowledgedAt && format(new Date(alert.acknowledgedAt), 'MMM dd, yyyy HH:mm')}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}