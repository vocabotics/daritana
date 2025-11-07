import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  Lock,
  Shield,
  Key,
  AlertTriangle,
  Info,
  Save,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

export function SecuritySettings() {
  const [passwordPolicy, setPasswordPolicy] = useState({
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    preventReuse: 5,
    expirationDays: 90
  });

  const [loginSettings, setLoginSettings] = useState({
    maxAttempts: 5,
    lockoutDuration: 30,
    captchaAfterFails: 3,
    sessionTimeout: 30,
    rememberMeDuration: 30
  });

  const [apiSettings, setApiSettings] = useState({
    enableApiKeys: true,
    keyExpiration: 90,
    rateLimit: 1000,
    ipWhitelist: false,
    requireHttps: true
  });

  const saveSettings = () => {
    toast.success('Security settings updated successfully');
  };

  return (
    <div className="space-y-6">
      {/* Password Policy */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            <CardTitle>Password Policy</CardTitle>
          </div>
          <CardDescription>Configure password requirements for all users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Minimum Password Length</Label>
              <div className="flex items-center gap-4 mt-2">
                <Slider
                  value={[passwordPolicy.minLength]}
                  onValueChange={(value) => setPasswordPolicy({
                    ...passwordPolicy,
                    minLength: value[0]
                  })}
                  min={8}
                  max={32}
                  step={1}
                  className="flex-1"
                />
                <span className="w-12 text-right font-medium">{passwordPolicy.minLength}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2">
                <Switch
                  checked={passwordPolicy.requireUppercase}
                  onCheckedChange={(checked) => setPasswordPolicy({
                    ...passwordPolicy,
                    requireUppercase: checked
                  })}
                />
                <span className="text-sm">Require uppercase letters</span>
              </label>
              
              <label className="flex items-center gap-2">
                <Switch
                  checked={passwordPolicy.requireLowercase}
                  onCheckedChange={(checked) => setPasswordPolicy({
                    ...passwordPolicy,
                    requireLowercase: checked
                  })}
                />
                <span className="text-sm">Require lowercase letters</span>
              </label>
              
              <label className="flex items-center gap-2">
                <Switch
                  checked={passwordPolicy.requireNumbers}
                  onCheckedChange={(checked) => setPasswordPolicy({
                    ...passwordPolicy,
                    requireNumbers: checked
                  })}
                />
                <span className="text-sm">Require numbers</span>
              </label>
              
              <label className="flex items-center gap-2">
                <Switch
                  checked={passwordPolicy.requireSpecialChars}
                  onCheckedChange={(checked) => setPasswordPolicy({
                    ...passwordPolicy,
                    requireSpecialChars: checked
                  })}
                />
                <span className="text-sm">Require special characters</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Password History</Label>
                <Select 
                  value={passwordPolicy.preventReuse.toString()}
                  onValueChange={(value) => setPasswordPolicy({
                    ...passwordPolicy,
                    preventReuse: parseInt(value)
                  })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">Remember last 3 passwords</SelectItem>
                    <SelectItem value="5">Remember last 5 passwords</SelectItem>
                    <SelectItem value="10">Remember last 10 passwords</SelectItem>
                    <SelectItem value="0">No restriction</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Password Expiration</Label>
                <Select 
                  value={passwordPolicy.expirationDays.toString()}
                  onValueChange={(value) => setPasswordPolicy({
                    ...passwordPolicy,
                    expirationDays: parseInt(value)
                  })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="180">180 days</SelectItem>
                    <SelectItem value="0">Never expire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">Current password strength requirement:</p>
                <p className="text-blue-700 mt-1">
                  Minimum {passwordPolicy.minLength} characters with 
                  {passwordPolicy.requireUppercase && ' uppercase,'}
                  {passwordPolicy.requireLowercase && ' lowercase,'}
                  {passwordPolicy.requireNumbers && ' numbers,'}
                  {passwordPolicy.requireSpecialChars && ' special characters'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Login Security */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            <CardTitle>Login Security</CardTitle>
          </div>
          <CardDescription>Configure authentication and session settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Max Login Attempts</Label>
                <Input
                  type="number"
                  value={loginSettings.maxAttempts}
                  onChange={(e) => setLoginSettings({
                    ...loginSettings,
                    maxAttempts: parseInt(e.target.value)
                  })}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label>Lockout Duration (minutes)</Label>
                <Input
                  type="number"
                  value={loginSettings.lockoutDuration}
                  onChange={(e) => setLoginSettings({
                    ...loginSettings,
                    lockoutDuration: parseInt(e.target.value)
                  })}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label>Show CAPTCHA After</Label>
                <Select 
                  value={loginSettings.captchaAfterFails.toString()}
                  onValueChange={(value) => setLoginSettings({
                    ...loginSettings,
                    captchaAfterFails: parseInt(value)
                  })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 failed attempt</SelectItem>
                    <SelectItem value="3">3 failed attempts</SelectItem>
                    <SelectItem value="5">5 failed attempts</SelectItem>
                    <SelectItem value="0">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Session Timeout (minutes)</Label>
                <Input
                  type="number"
                  value={loginSettings.sessionTimeout}
                  onChange={(e) => setLoginSettings({
                    ...loginSettings,
                    sessionTimeout: parseInt(e.target.value)
                  })}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Security */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>API Security</CardTitle>
          </div>
          <CardDescription>Configure API access and rate limiting</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable API Keys</Label>
                <p className="text-sm text-gray-500">Allow API access with authentication keys</p>
              </div>
              <Switch
                checked={apiSettings.enableApiKeys}
                onCheckedChange={(checked) => setApiSettings({
                  ...apiSettings,
                  enableApiKeys: checked
                })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Require HTTPS</Label>
                <p className="text-sm text-gray-500">Force all API requests to use HTTPS</p>
              </div>
              <Switch
                checked={apiSettings.requireHttps}
                onCheckedChange={(checked) => setApiSettings({
                  ...apiSettings,
                  requireHttps: checked
                })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>IP Whitelist</Label>
                <p className="text-sm text-gray-500">Restrict API access to specific IP addresses</p>
              </div>
              <Switch
                checked={apiSettings.ipWhitelist}
                onCheckedChange={(checked) => setApiSettings({
                  ...apiSettings,
                  ipWhitelist: checked
                })}
              />
            </div>
            
            <div>
              <Label>Rate Limit (requests per hour)</Label>
              <div className="flex items-center gap-4 mt-2">
                <Slider
                  value={[apiSettings.rateLimit]}
                  onValueChange={(value) => setApiSettings({
                    ...apiSettings,
                    rateLimit: value[0]
                  })}
                  min={100}
                  max={10000}
                  step={100}
                  className="flex-1"
                />
                <span className="w-16 text-right font-medium">{apiSettings.rateLimit}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset to Defaults
        </Button>
        <Button onClick={saveSettings}>
          <Save className="h-4 w-4 mr-2" />
          Save All Settings
        </Button>
      </div>
    </div>
  );
}