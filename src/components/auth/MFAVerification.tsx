import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Smartphone, 
  Mail, 
  Key, 
  RefreshCw, 
  AlertTriangle, 
  Clock,
  CheckCircle2
} from 'lucide-react';
import { useMFAStore } from '@/store/mfaStore';
import { MFAType, MFAChallenge } from '@/types';
import { toast } from 'sonner';

interface MFAVerificationProps {
  userId: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

export default function MFAVerification({ userId, onSuccess, onCancel }: MFAVerificationProps) {
  const { 
    getUserMFASettings, 
    createMFAChallenge, 
    verifyMFA, 
    recordLoginAttempt 
  } = useMFAStore();
  
  const [verificationCode, setVerificationCode] = useState('');
  const [currentChallenge, setCurrentChallenge] = useState<MFAChallenge | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<MFAType>('sms');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [canResend, setCanResend] = useState(false);

  const mfaSettings = getUserMFASettings(userId);

  useEffect(() => {
    if (mfaSettings?.primaryMethod) {
      setSelectedMethod(mfaSettings.primaryMethod.type);
      initiateMFAChallenge(mfaSettings.primaryMethod.type);
    }
  }, [mfaSettings]);

  useEffect(() => {
    if (currentChallenge && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && currentChallenge) {
      setCanResend(true);
    }
  }, [timeRemaining, currentChallenge]);

  const initiateMFAChallenge = async (method: MFAType) => {
    setLoading(true);
    setError('');
    
    try {
      const challenge = await createMFAChallenge(userId, method);
      setCurrentChallenge(challenge);
      setTimeRemaining(300); // 5 minutes
      setCanResend(false);
      
      // Show success message based on method
      const methodMessages = {
        sms: `Verification code sent to ${mfaSettings?.primaryMethod.phoneNumber}`,
        email: `Verification code sent to ${mfaSettings?.primaryMethod.email}`,
        totp: 'Enter code from your authenticator app',
        backup_codes: 'Enter one of your backup codes',
        push: 'Check your device for push notification',
        hardware_key: 'Insert your hardware key'
      };
      
      toast.success(methodMessages[method] || 'Verification code sent');
    } catch (error) {
      setError('Failed to send verification code. Please try again.');
      toast.error('Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentChallenge || !verificationCode.trim()) {
      setError('Please enter verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await verifyMFA(currentChallenge.id, verificationCode.trim());
      
      if (result.success) {
        recordLoginAttempt({
          userId,
          success: true,
          ipAddress: '192.168.1.100',
          location: 'Kuala Lumpur, Malaysia',
          device: navigator.platform,
          browser: navigator.userAgent,
          mfaUsed: true,
          mfaMethod: selectedMethod,
          timestamp: new Date(),
          riskLevel: 'low'
        });
        
        toast.success('Verification successful');
        onSuccess();
      } else {
        setError(result.errorMessage || 'Invalid verification code');
        setVerificationCode('');
        
        if (result.remainingAttempts === 0) {
          toast.error('Maximum attempts exceeded. Please try a different method.');
        }
      }
    } catch (error) {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = () => {
    if (canResend && !loading) {
      initiateMFAChallenge(selectedMethod);
    }
  };

  const handleMethodChange = (method: MFAType) => {
    setSelectedMethod(method);
    setVerificationCode('');
    setError('');
    initiateMFAChallenge(method);
  };

  const getMethodIcon = (method: MFAType) => {
    const icons = {
      sms: Smartphone,
      email: Mail,
      totp: Shield,
      backup_codes: Key,
      push: Smartphone,
      hardware_key: Key
    };
    return icons[method] || Shield;
  };

  const getMethodLabel = (method: MFAType) => {
    const labels = {
      sms: 'SMS',
      email: 'Email',
      totp: 'Authenticator App',
      backup_codes: 'Backup Code',
      push: 'Push Notification',
      hardware_key: 'Hardware Key'
    };
    return labels[method] || method;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!mfaSettings || !mfaSettings.isEnabled) {
    return null;
  }

  const availableMethods = [mfaSettings.primaryMethod, ...mfaSettings.backupMethods]
    .filter(method => method.isActive);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            Please verify your identity to continue
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Method Selection */}
          {availableMethods.length > 1 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Verification Method</label>
              <div className="flex flex-wrap gap-2">
                {availableMethods.map((method) => {
                  const IconComponent = getMethodIcon(method.type);
                  return (
                    <Button
                      key={method.id}
                      variant={selectedMethod === method.type ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleMethodChange(method.type)}
                      disabled={loading}
                      className="flex items-center gap-2"
                    >
                      <IconComponent className="h-4 w-4" />
                      {getMethodLabel(method.type)}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Current Method Info */}
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            {(() => {
              const IconComponent = getMethodIcon(selectedMethod);
              return <IconComponent className="h-5 w-5 text-blue-600" />;
            })()}
            <div className="flex-1">
              <p className="text-sm font-medium">
                {getMethodLabel(selectedMethod)}
              </p>
              {selectedMethod === 'sms' && (
                <p className="text-xs text-muted-foreground">
                  Code sent to {mfaSettings.primaryMethod.phoneNumber}
                </p>
              )}
              {selectedMethod === 'email' && (
                <p className="text-xs text-muted-foreground">
                  Code sent to {mfaSettings.primaryMethod.email}
                </p>
              )}
            </div>
            {timeRemaining > 0 && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {formatTime(timeRemaining)}
              </div>
            )}
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Verification Form */}
          <form onSubmit={handleVerification} className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                {selectedMethod === 'backup_codes' 
                  ? 'Backup Code' 
                  : 'Verification Code'
                }
              </label>
              <Input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder={
                  selectedMethod === 'backup_codes' 
                    ? 'Enter backup code' 
                    : 'Enter 6-digit code'
                }
                className="text-center text-lg font-mono"
                maxLength={selectedMethod === 'backup_codes' ? 8 : 6}
                disabled={loading}
                autoFocus
                required
              />
            </div>

            <div className="flex gap-3">
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={loading || !verificationCode.trim()}
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Verify
                  </>
                )}
              </Button>
              
              {onCancel && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>

          {/* Resend Code */}
          {selectedMethod !== 'totp' && selectedMethod !== 'backup_codes' && (
            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResendCode}
                disabled={!canResend || loading}
                className="text-sm"
              >
                {canResend ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Resend Code
                  </>
                ) : (
                  `Resend available in ${formatTime(timeRemaining)}`
                )}
              </Button>
            </div>
          )}

          {/* Help Text */}
          <div className="text-center text-sm text-muted-foreground">
            {selectedMethod === 'totp' && (
              <p>Open your authenticator app and enter the 6-digit code</p>
            )}
            {selectedMethod === 'backup_codes' && (
              <p>Enter one of your 8-character backup codes</p>
            )}
            {(selectedMethod === 'sms' || selectedMethod === 'email') && (
              <p>Didn't receive the code? Check your spam folder or try resending</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}