import { useMFAStore } from '@/store/mfaStore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CheckCircle2, 
  XCircle, 
  Shield, 
  Monitor, 
  Smartphone,
  MapPin,
  Globe,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';

interface LoginHistoryProps {
  userId: string;
}

export default function LoginHistory({ userId }: LoginHistoryProps) {
  const { getRecentLoginAttempts } = useMFAStore();
  
  const loginAttempts = getRecentLoginAttempts(userId, 20);

  const getSuccessIcon = (success: boolean) => {
    return success ? (
      <CheckCircle2 className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  const getRiskBadge = (riskLevel: string) => {
    const riskConfig = {
      low: { variant: 'secondary' as const, label: 'Low Risk' },
      medium: { variant: 'warning' as const, label: 'Medium Risk' },
      high: { variant: 'destructive' as const, label: 'High Risk' }
    };
    
    const config = riskConfig[riskLevel as keyof typeof riskConfig];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getMFABadge = (mfaUsed: boolean, mfaMethod?: string) => {
    if (!mfaUsed) {
      return <Badge variant="outline">No MFA</Badge>;
    }
    
    const methodLabels = {
      sms: 'SMS',
      email: 'Email', 
      totp: 'App',
      backup_codes: 'Backup Code',
      push: 'Push',
      hardware_key: 'Hardware Key'
    };
    
    return (
      <Badge variant="default" className="flex items-center gap-1">
        <Shield className="h-3 w-3" />
        {methodLabels[mfaMethod as keyof typeof methodLabels] || 'MFA'}
      </Badge>
    );
  };

  const getDeviceIcon = (device: string) => {
    if (device.toLowerCase().includes('mobile') || device.toLowerCase().includes('iphone') || device.toLowerCase().includes('android')) {
      return <Smartphone className="h-4 w-4 text-muted-foreground" />;
    }
    return <Monitor className="h-4 w-4 text-muted-foreground" />;
  };

  if (loginAttempts.length === 0) {
    return (
      <div className="text-center py-8">
        <Monitor className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No Login History</h3>
        <p className="text-muted-foreground">
          No recent login attempts found for your account
        </p>
      </div>
    );
  }

  const successfulLogins = loginAttempts.filter(attempt => attempt.success).length;
  const failedLogins = loginAttempts.filter(attempt => !attempt.success).length;
  const mfaUsage = loginAttempts.filter(attempt => attempt.success && attempt.mfaUsed).length;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Successful Logins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successfulLogins}</div>
            <p className="text-xs text-muted-foreground">
              Out of {loginAttempts.length} total attempts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              Failed Attempts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedLogins}</div>
            {failedLogins > 0 && (
              <p className="text-xs text-red-600">
                Review suspicious activity
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-600" />
              MFA Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {successfulLogins > 0 ? Math.round((mfaUsage / successfulLogins) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {mfaUsage} of {successfulLogins} successful logins
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Login History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Device & Browser</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Authentication</TableHead>
                  <TableHead>Risk Level</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loginAttempts.map((attempt) => (
                  <TableRow key={attempt.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getSuccessIcon(attempt.success)}
                        <span className={`text-sm ${
                          attempt.success ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {attempt.success ? 'Success' : 'Failed'}
                        </span>
                      </div>
                      {attempt.blockedReason && (
                        <p className="text-xs text-red-600 mt-1">
                          {attempt.blockedReason}
                        </p>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(attempt.timestamp), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(attempt.timestamp), 'HH:mm:ss')}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {attempt.location ? (
                          <>
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{attempt.location}</span>
                          </>
                        ) : (
                          <>
                            <Globe className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Unknown</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(attempt.device)}
                        <div>
                          <div className="text-sm">{attempt.device}</div>
                          <div className="text-xs text-muted-foreground">
                            {attempt.browser}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {attempt.ipAddress}
                      </code>
                    </TableCell>
                    
                    <TableCell>
                      {getMFABadge(attempt.mfaUsed, attempt.mfaMethod)}
                    </TableCell>
                    
                    <TableCell>
                      {getRiskBadge(attempt.riskLevel)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}