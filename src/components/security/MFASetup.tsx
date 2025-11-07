import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Shield, 
  Smartphone, 
  Mail, 
  Key, 
  QrCode,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Download,
  RefreshCw
} from 'lucide-react';
import { useMFAStore } from '@/store/mfaStore';
import { MFAType } from '@/types';
import { toast } from 'sonner';

interface MFASetupProps {
  userId: string;
}

export default function MFASetup({ userId }: MFASetupProps) {
  const { 
    getUserMFASettings, 
    setupMFA, 
    verifyMFA, 
    disableMFA, 
    generateBackupCodes 
  } = useMFAStore();
  
  const [selectedMethod, setSelectedMethod] = useState<MFAType>('sms');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [currentChallengeId, setCurrentChallengeId] = useState('');
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [showBackupCodesDialog, setShowBackupCodesDialog] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup');

  const mfaSettings = getUserMFASettings(userId);

  const methods = [
    {
      type: 'sms' as MFAType,
      name: 'SMS Text Message',
      description: 'Receive codes via SMS on your phone',
      icon: Smartphone,
      recommended: true
    },
    {
      type: 'email' as MFAType,
      name: 'Email',
      description: 'Receive codes via email',
      icon: Mail,
      recommended: false
    },
    {
      type: 'totp' as MFAType,
      name: 'Authenticator App',
      description: 'Use Google Authenticator or similar app',
      icon: Shield,
      recommended: true
    }
  ];

  const handleSetupMFA = async () => {
    if (!phoneNumber && selectedMethod === 'sms') {
      setError('Please enter your phone number');
      return;
    }
    
    if (!email && selectedMethod === 'email') {
      setError('Please enter your email address');
      return;
    }

    if (!deviceName && selectedMethod === 'totp') {
      setError('Please enter a device name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await setupMFA({
        userId,
        method: selectedMethod,
        phoneNumber: selectedMethod === 'sms' ? phoneNumber : undefined,
        email: selectedMethod === 'email' ? email : undefined,
        deviceName: selectedMethod === 'totp' ? deviceName : undefined
      });

      if (response.success) {
        setCurrentChallengeId(response.challengeId || '');
        setQrCodeUrl(response.qrCodeUrl || '');
        setSecretKey(response.secretKey || '');
        if (response.backupCodes) {
          setBackupCodes(response.backupCodes);
        }
        setStep('verify');
        toast.success('MFA setup initiated. Please verify to complete.');
      } else {
        setError('Failed to set up MFA. Please try again.');
      }
    } catch (error) {
      setError('Failed to set up MFA. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySetup = async () => {
    if (!verificationCode) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await verifyMFA(currentChallengeId, verificationCode);
      
      if (result.success) {
        setStep('complete');
        toast.success('MFA enabled successfully!');
      } else {
        setError(result.errorMessage || 'Invalid verification code');
        setVerificationCode('');
      }
    } catch (error) {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisableMFA = async () => {
    if (!disablePassword) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const success = await disableMFA(userId, disablePassword);
      
      if (success) {
        setShowDisableDialog(false);
        setDisablePassword('');
        toast.success('MFA has been disabled');
      } else {
        setError('Invalid password');
      }
    } catch (error) {
      setError('Failed to disable MFA. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBackupCodes = async () => {
    setLoading(true);
    
    try {
      const codes = await generateBackupCodes(userId);
      setBackupCodes(codes);
      setShowBackupCodesDialog(true);
      toast.success('New backup codes generated');
    } catch (error) {
      toast.error('Failed to generate backup codes');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const copySecretKey = () => {
    copyToClipboard(secretKey);
  };

  const downloadBackupCodes = () => {
    const content = backupCodes.map(code => code).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'daritana-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Backup codes downloaded');
  };

  const resetSetup = () => {
    setStep('setup');
    setVerificationCode('');
    setError('');
    setQrCodeUrl('');
    setSecretKey('');
    setCurrentChallengeId('');
  };

  if (!mfaSettings || !mfaSettings.isEnabled) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
            <p className="text-sm text-muted-foreground">
              Currently disabled. Enable for enhanced security.
            </p>
          </div>
          <Badge variant="outline" className="text-orange-600 border-orange-200">
            Disabled
          </Badge>
        </div>

        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Secure your account with two-factor authentication. This adds an extra layer of 
            security by requiring a second verification step when you sign in.
          </AlertDescription>
        </Alert>

        <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => setShowSetupDialog(true)}>
              <Shield className="mr-2 h-4 w-4" />
              Enable Two-Factor Authentication
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {step === 'setup' && 'Set up Two-Factor Authentication'}
                {step === 'verify' && 'Verify Setup'}
                {step === 'complete' && 'Setup Complete'}
              </DialogTitle>
              <DialogDescription>
                {step === 'setup' && 'Choose your preferred method for two-factor authentication'}
                {step === 'verify' && 'Enter the verification code to complete setup'}
                {step === 'complete' && 'Two-factor authentication is now enabled'}
              </DialogDescription>
            </DialogHeader>

            {step === 'setup' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Authentication Method</Label>
                  <div className="space-y-2">
                    {methods.map((method) => {
                      const IconComponent = method.icon;
                      return (
                        <div
                          key={method.type}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedMethod === method.type
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedMethod(method.type)}
                        >
                          <div className="flex items-start gap-3">
                            <IconComponent className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{method.name}</span>
                                {method.recommended && (
                                  <Badge variant="secondary" className="text-xs">
                                    Recommended
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {method.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {selectedMethod === 'sms' && (
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+60123456789"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                )}

                {selectedMethod === 'email' && (
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                )}

                {selectedMethod === 'totp' && (
                  <div>
                    <Label htmlFor="deviceName">Device Name</Label>
                    <Input
                      id="deviceName"
                      type="text"
                      placeholder="My iPhone"
                      value={deviceName}
                      onChange={(e) => setDeviceName(e.target.value)}
                    />
                  </div>
                )}

                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {step === 'verify' && (
              <div className="space-y-4">
                {selectedMethod === 'totp' && qrCodeUrl && (
                  <div className="text-center space-y-4">
                    <div className="p-4 bg-white border rounded-lg inline-block">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUrl)}`} 
                        alt="QR Code" 
                        className="w-48 h-48"
                      />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Scan this QR code with your authenticator app</p>
                      <p className="mt-2">Or manually enter this key:</p>
                      <div className="mt-2 flex items-center gap-2">
                        <code className="bg-gray-100 px-2 py-1 rounded font-mono text-xs">
                          {secretKey}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={copySecretKey}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="code">Verification Code</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    maxLength={6}
                    className="text-center font-mono text-lg"
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {step === 'complete' && (
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Setup Complete!</h3>
                  <p className="text-sm text-muted-foreground">
                    Two-factor authentication is now enabled for your account.
                  </p>
                </div>

                {backupCodes.length > 0 && (
                  <Alert>
                    <Key className="h-4 w-4" />
                    <AlertDescription>
                      Save your backup codes in a safe place. You can use these to access 
                      your account if you lose access to your primary authentication method.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            <DialogFooter className="flex justify-between">
              {step === 'setup' && (
                <>
                  <Button variant="outline" onClick={() => setShowSetupDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSetupMFA} disabled={loading}>
                    {loading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Setting up...
                      </>
                    ) : (
                      'Continue'
                    )}
                  </Button>
                </>
              )}
              
              {step === 'verify' && (
                <>
                  <Button variant="outline" onClick={resetSetup}>
                    Back
                  </Button>
                  <Button onClick={handleVerifySetup} disabled={loading}>
                    {loading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify'
                    )}
                  </Button>
                </>
              )}
              
              {step === 'complete' && (
                <>
                  {backupCodes.length > 0 && (
                    <Button variant="outline" onClick={() => setShowBackupCodesDialog(true)}>
                      <Download className="mr-2 h-4 w-4" />
                      View Backup Codes
                    </Button>
                  )}
                  <Button onClick={() => setShowSetupDialog(false)}>
                    Done
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
          <p className="text-sm text-muted-foreground">
            Currently enabled with {mfaSettings.primaryMethod.name}
          </p>
        </div>
        <Badge variant="default" className="text-green-600 border-green-200 bg-green-50">
          Enabled
        </Badge>
      </div>

      <Alert>
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription>
          Your account is protected with two-factor authentication.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Primary Method</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Smartphone className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">{mfaSettings.primaryMethod.name}</p>
                <p className="text-sm text-muted-foreground">
                  Last used: {mfaSettings.primaryMethod.lastUsed 
                    ? new Date(mfaSettings.primaryMethod.lastUsed).toLocaleDateString()
                    : 'Never'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Backup Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {mfaSettings.backupCodes.filter(code => !code.used).length} available
                </p>
                <p className="text-sm text-muted-foreground">
                  {mfaSettings.backupCodes.filter(code => code.used).length} used
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleGenerateBackupCodes}
                disabled={loading}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerate
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setShowBackupCodesDialog(true)}>
          <Key className="mr-2 h-4 w-4" />
          View Backup Codes
        </Button>
        
        <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
          <DialogTrigger asChild>
            <Button variant="destructive">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Disable MFA
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
              <DialogDescription>
                This will remove the extra security layer from your account. 
                Are you sure you want to continue?
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="password">Enter your password to confirm</Label>
                <Input
                  id="password"
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  placeholder="Your account password"
                />
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDisableDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDisableMFA}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Disabling...
                  </>
                ) : (
                  'Disable MFA'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Backup Codes Dialog */}
      <Dialog open={showBackupCodesDialog} onOpenChange={setShowBackupCodesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Backup Codes</DialogTitle>
            <DialogDescription>
              Use these codes to access your account if you lose access to your primary method. 
              Each code can only be used once.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <Key className="h-4 w-4" />
              <AlertDescription>
                Save these codes in a secure location. They won't be shown again.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-2 gap-2 font-mono text-sm">
              {mfaSettings.backupCodes.map((code) => (
                <div 
                  key={code.id} 
                  className={`p-2 border rounded ${
                    code.used ? 'bg-gray-50 text-gray-400 line-through' : 'bg-white'
                  }`}
                >
                  {code.code}
                </div>
              ))}
            </div>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={downloadBackupCodes}>
                <Download className="mr-2 h-4 w-4" />
                Download Codes
              </Button>
              <Button onClick={() => setShowBackupCodesDialog(false)}>
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}