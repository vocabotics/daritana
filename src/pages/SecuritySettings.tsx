import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import MFASetup from '@/components/security/MFASetup';
import SecurityAlerts from '@/components/security/SecurityAlerts';
import LoginHistory from '@/components/security/LoginHistory';
import TrustedDevices from '@/components/security/TrustedDevices';
import { 
  Shield, 
  Smartphone, 
  History, 
  Monitor,
  AlertTriangle
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useMFAStore } from '@/store/mfaStore';

export default function SecuritySettings() {
  const { user } = useAuthStore();
  const { getUserMFASettings, getUnacknowledgedAlerts } = useMFAStore();
  
  const mfaSettings = user ? getUserMFASettings(user.id) : null;
  const unacknowledgedAlerts = user ? getUnacknowledgedAlerts(user.id) : [];

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Shield className="h-8 w-8 text-blue-600" />
          Security Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your account security and authentication settings
        </p>
      </div>

      <Tabs defaultValue="mfa" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="mfa" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Multi-Factor Auth
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2 relative">
            <AlertTriangle className="h-4 w-4" />
            Security Alerts
            {unacknowledgedAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unacknowledgedAlerts.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Login History
          </TabsTrigger>
          <TabsTrigger value="devices" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Trusted Devices
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mfa" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Multi-Factor Authentication
              </CardTitle>
              <CardDescription>
                Add an extra layer of security to your account by enabling multi-factor authentication
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MFASetup userId={user.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Security Alerts
              </CardTitle>
              <CardDescription>
                Monitor security events and alerts for your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SecurityAlerts userId={user.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Login History
              </CardTitle>
              <CardDescription>
                Review your recent login activity and identify any suspicious access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoginHistory userId={user.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Trusted Devices
              </CardTitle>
              <CardDescription>
                Manage devices that are trusted for your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TrustedDevices userId={user.id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}