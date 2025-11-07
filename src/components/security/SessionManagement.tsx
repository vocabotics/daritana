import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Monitor,
  Smartphone,
  Globe,
  MapPin,
  Clock,
  LogOut,
  AlertTriangle,
  Shield,
  Chrome,
  Laptop,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { securityService } from '@/services/security.service';

interface Session {
  id: string;
  device: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  location: string;
  ip: string;
  lastActive: string;
  current: boolean;
  trusted: boolean;
  userAgent: string;
  createdAt: string;
  expiresAt?: string;
}

interface SessionSettings {
  timeout: number; // minutes
  maxSessions: number;
  requireReauth: boolean;
  alertNewDevice: boolean;
  enable2FA: boolean;
  requirePasswordChange: boolean;
}

export function SessionManagement() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionSettings, setSessionSettings] = useState<SessionSettings>({
    timeout: 30,
    maxSessions: 5,
    requireReauth: true,
    alertNewDevice: true,
    enable2FA: false,
    requirePasswordChange: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    loadSessionData();
  }, []);

  const loadSessionData = async () => {
    try {
      setIsLoadingData(true);
      
      // Load data in parallel
      const [sessionsData, settingsData] = await Promise.all([
        securityService.getActiveSessions(),
        securityService.getSessionSettings()
      ]);

      setSessions(sessionsData || []);
      setSessionSettings(settingsData || sessionSettings);
    } catch (error) {
      console.error('Error loading session data:', error);
      toast.error('Failed to load session data');
    } finally {
      setIsLoadingData(false);
    }
  };

  const terminateSession = async (sessionId: string) => {
    try {
      setIsLoading(true);
      await securityService.terminateSession(sessionId);
      
      // Update local state
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      toast.success('Session terminated successfully');
    } catch (error) {
      console.error('Failed to terminate session:', error);
      toast.error('Failed to terminate session');
    } finally {
      setIsLoading(false);
    }
  };

  const terminateAllSessions = async () => {
    try {
      setIsLoading(true);
      await securityService.terminateAllOtherSessions();
      
      // Update local state - keep only current session
      setSessions(prev => prev.filter(s => s.current));
      toast.success('All other sessions terminated');
    } catch (error) {
      console.error('Failed to terminate all sessions:', error);
      toast.error('Failed to terminate all sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSessionSettings = async (newSettings: Partial<SessionSettings>) => {
    try {
      setIsLoading(true);
      const updatedSettings = await securityService.updateSessionSettings(newSettings);
      setSessionSettings(updatedSettings);
      toast.success('Session settings updated successfully');
    } catch (error) {
      console.error('Failed to update session settings:', error);
      toast.error('Failed to update session settings');
    } finally {
      setIsLoading(false);
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile': return <Smartphone className="h-5 w-5" />;
      case 'tablet': return <Laptop className="h-5 w-5" />;
      default: return <Monitor className="h-5 w-5" />;
    }
  };

  const getBrowserIcon = (browser: string) => {
    if (browser.toLowerCase().includes('chrome')) return <Chrome className="h-3 w-3" />;
    if (browser.toLowerCase().includes('safari')) return <Globe className="h-3 w-3" />;
    if (browser.toLowerCase().includes('edge')) return <Monitor className="h-3 w-3" />;
    if (browser.toLowerCase().includes('firefox')) return <Globe className="h-3 w-3" />;
    return <Globe className="h-3 w-3" />;
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading session management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Sessions Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>Manage your active login sessions across devices</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline">
                {sessions.length} Active Sessions
              </Badge>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={terminateAllSessions}
                disabled={isLoading || sessions.filter(s => !s.current).length === 0}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <LogOut className="h-4 w-4 mr-2" />
                )}
                End All Other Sessions
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Security Alert */}
      {sessions.some(s => !s.trusted && !s.current) && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription>
            <strong>Security Notice:</strong> We detected login from a new device. If this wasn't you, terminate the session immediately.
          </AlertDescription>
        </Alert>
      )}

      {/* Session List */}
      {sessions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Monitor className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No active sessions</h3>
            <p className="text-gray-600 mb-4">
              You don't have any active sessions at the moment
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sessions.map(session => (
            <Card key={session.id} className={session.current ? 'border-blue-500' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${
                      session.current ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      {getDeviceIcon(session.deviceType)}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{session.device}</p>
                        {session.current && (
                          <Badge variant="default" className="text-xs">Current Session</Badge>
                        )}
                        {session.trusted && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Shield className="h-3 w-3" />
                            Trusted
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          {getBrowserIcon(session.browser)}
                          {session.browser}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {session.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {session.ip}
                        </span>
                      </div>
                      
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Last active: {session.lastActive}
                      </p>
                      
                      <p className="text-xs text-gray-400 mt-1">
                        Created: {new Date(session.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {!session.current && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => terminateSession(session.id)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <LogOut className="h-4 w-4 mr-1" />
                      )}
                      End Session
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Session Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Session Settings</CardTitle>
          <CardDescription>Configure your session security preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Session Timeout (minutes)</label>
              <input
                type="number"
                min="5"
                max="480"
                value={sessionSettings.timeout}
                onChange={(e) => updateSessionSettings({ timeout: parseInt(e.target.value) })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Maximum Sessions</label>
              <input
                type="number"
                min="1"
                max="10"
                value={sessionSettings.maxSessions}
                onChange={(e) => updateSessionSettings({ maxSessions: parseInt(e.target.value) })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Require Re-authentication</label>
                <p className="text-xs text-gray-500">Ask for password when changing sensitive settings</p>
              </div>
              <input
                type="checkbox"
                checked={sessionSettings.requireReauth}
                onChange={(e) => updateSessionSettings({ requireReauth: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Alert on New Device</label>
                <p className="text-xs text-gray-500">Notify when logging in from an unrecognized device</p>
              </div>
              <input
                type="checkbox"
                checked={sessionSettings.alertNewDevice}
                onChange={(e) => updateSessionSettings({ alertNewDevice: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Enable Two-Factor Authentication</label>
                <p className="text-xs text-gray-500">Add an extra layer of security to your account</p>
              </div>
              <input
                type="checkbox"
                checked={sessionSettings.enable2FA}
                onChange={(e) => updateSessionSettings({ enable2FA: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Require Password Change</label>
                <p className="text-xs text-gray-500">Force password change on next login</p>
              </div>
              <input
                type="checkbox"
                checked={sessionSettings.requirePasswordChange}
                onChange={(e) => updateSessionSettings({ requirePasswordChange: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Security Recommendations</CardTitle>
          <CardDescription>Best practices to keep your account secure</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">Enable Two-Factor Authentication</p>
              <p className="text-xs text-blue-700">Add an extra layer of security to prevent unauthorized access</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
            <Monitor className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-900">Regular Session Review</p>
              <p className="text-xs text-green-700">Periodically review and terminate suspicious sessions</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-orange-900">Strong Passwords</p>
              <p className="text-xs text-orange-700">Use unique, complex passwords for each account</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}