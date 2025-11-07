import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { 
  Smartphone,
  Mail,
  Key,
  Shield,
  QrCode,
  Copy,
  CheckCircle,
  AlertCircle,
  Download
} from 'lucide-react';
import { toast } from 'sonner';

export function TwoFactorAuth() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [setupStep, setSetupStep] = useState<'choice' | 'app' | 'sms' | 'complete'>('choice');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  const secretKey = 'JBSWY3DPEHPK3PXP'; // Example secret key
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/Daritana:user@example.com?secret=${secretKey}&issuer=Daritana`;

  const generateBackupCodes = () => {
    const codes = Array.from({ length: 8 }, () => 
      Math.random().toString(36).substring(2, 8).toUpperCase()
    );
    setBackupCodes(codes);
  };

  const enable2FA = () => {
    if (verificationCode === '123456') { // Mock verification
      setIsEnabled(true);
      generateBackupCodes();
      setSetupStep('complete');
      toast.success('Two-factor authentication enabled successfully');
    } else {
      toast.error('Invalid verification code');
    }
  };

  const disable2FA = () => {
    setIsEnabled(false);
    setSetupStep('choice');
    setBackupCodes([]);
    toast.info('Two-factor authentication disabled');
  };

  const downloadBackupCodes = () => {
    const content = backupCodes.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'daritana-backup-codes.txt';
    a.click();
    toast.success('Backup codes downloaded');
  };

  return (
    <div className="space-y-6">
      {/* 2FA Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>Add an extra layer of security to your account</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isEnabled ? (
                <Badge variant="success" className="gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Enabled
                </Badge>
              ) : (
                <Badge variant="secondary">Disabled</Badge>
              )}
              <Switch
                checked={isEnabled}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSetupStep('choice');
                  } else {
                    disable2FA();
                  }
                }}
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Setup Process */}
      {!isEnabled && setupStep !== 'choice' && (
        <Card>
          <CardHeader>
            <CardTitle>Setup Two-Factor Authentication</CardTitle>
          </CardHeader>
          <CardContent>
            {setupStep === 'choice' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Choose your preferred 2FA method:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setSetupStep('app')}
                    className="p-4 border rounded-lg hover:bg-gray-50 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="font-semibold">Authenticator App</p>
                        <p className="text-sm text-gray-500">Use Google Authenticator or similar</p>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setSetupStep('sms')}
                    className="p-4 border rounded-lg hover:bg-gray-50 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Mail className="h-8 w-8 text-green-500" />
                      <div>
                        <p className="font-semibold">SMS Text Message</p>
                        <p className="text-sm text-gray-500">Receive codes via SMS</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {setupStep === 'app' && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    Scan this QR code with your authenticator app:
                  </p>
                  <div className="inline-block p-4 bg-white border-2 rounded-lg">
                    <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
                  </div>
                </div>
                
                <div>
                  <Label>Or enter this key manually:</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 p-2 bg-gray-100 rounded font-mono text-sm">
                      {secretKey}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(secretKey);
                        toast.success('Secret key copied');
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="code">Enter verification code</Label>
                  <Input
                    id="code"
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    maxLength={6}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the 6-digit code from your authenticator app
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={enable2FA}>Enable 2FA</Button>
                  <Button variant="outline" onClick={() => setSetupStep('choice')}>
                    Back
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Backup Codes */}
      {isEnabled && backupCodes.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Backup Codes</CardTitle>
                <CardDescription>Save these codes in a safe place</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={downloadBackupCodes}>
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Each backup code can only be used once. Store them securely and generate new ones if needed.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {backupCodes.map((code, i) => (
                <div key={i} className="p-2 bg-gray-100 rounded text-center font-mono text-sm">
                  {code}
                </div>
              ))}
            </div>
            
            <Button variant="outline" className="mt-4" onClick={generateBackupCodes}>
              Generate New Codes
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Trusted Devices */}
      {isEnabled && (
        <Card>
          <CardHeader>
            <CardTitle>Trusted Devices</CardTitle>
            <CardDescription>Devices that won't require 2FA for 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium">MacBook Pro</p>
                    <p className="text-sm text-gray-500">Chrome • Last used today</p>
                  </div>
                </div>
                <Badge variant="outline">Current Device</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium">iPhone 13</p>
                    <p className="text-sm text-gray-500">Safari • Last used 2 days ago</p>
                  </div>
                </div>
                <Button size="sm" variant="ghost">Remove</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}