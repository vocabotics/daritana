import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Globe,
  Link,
  CheckCircle,
  XCircle,
  Settings,
  Building,
  Users,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';

export function SingleSignOn() {
  const [providers, setProviders] = useState([
    {
      id: 'google',
      name: 'Google Workspace',
      icon: '🔷',
      status: 'connected',
      users: 145,
      domain: 'company.com',
      lastSync: '2 hours ago'
    },
    {
      id: 'microsoft',
      name: 'Microsoft Azure AD',
      icon: '🟦',
      status: 'disconnected',
      users: 0,
      domain: '',
      lastSync: 'Never'
    },
    {
      id: 'okta',
      name: 'Okta',
      icon: '🔵',
      status: 'disconnected',
      users: 0,
      domain: '',
      lastSync: 'Never'
    },
    {
      id: 'saml',
      name: 'SAML 2.0',
      icon: '🔐',
      status: 'disconnected',
      users: 0,
      domain: '',
      lastSync: 'Never'
    }
  ]);

  const connectProvider = (providerId: string) => {
    // Simulate OAuth flow
    window.open(`https://auth.provider.com/${providerId}`, '_blank');
    setTimeout(() => {
      setProviders(providers.map(p => 
        p.id === providerId 
          ? { ...p, status: 'connected', users: Math.floor(Math.random() * 200) + 50 }
          : p
      ));
      toast.success(`Connected to ${providers.find(p => p.id === providerId)?.name}`);
    }, 2000);
  };

  const disconnectProvider = (providerId: string) => {
    setProviders(providers.map(p => 
      p.id === providerId 
        ? { ...p, status: 'disconnected', users: 0 }
        : p
    ));
    toast.info('SSO provider disconnected');
  };

  return (
    <div className="space-y-6">
      {/* SSO Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Single Sign-On Configuration</CardTitle>
              <CardDescription>Manage SSO providers and authentication settings</CardDescription>
            </div>
            <Badge variant="outline">
              <Users className="h-3 w-3 mr-1" />
              145 SSO Users
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* SSO Providers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {providers.map(provider => (
          <Card key={provider.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{provider.icon}</span>
                  <div>
                    <CardTitle className="text-lg">{provider.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      {provider.status === 'connected' ? (
                        <Badge variant="success" className="text-xs gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <XCircle className="h-3 w-3" />
                          Not Connected
                        </Badge>
                      )}
                      {provider.users > 0 && (
                        <span className="text-xs text-gray-500">{provider.users} users</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {provider.status === 'connected' ? (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Domain</Label>
                    <p className="text-sm font-medium">{provider.domain || 'Not configured'}</p>
                  </div>
                  <div>
                    <Label className="text-xs">Last Sync</Label>
                    <p className="text-sm font-medium">{provider.lastSync}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Settings className="h-3 w-3 mr-1" />
                      Configure
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => disconnectProvider(provider.id)}
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500">
                    Connect your {provider.name} account to enable SSO
                  </p>
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => connectProvider(provider.id)}
                  >
                    <Link className="h-3 w-3 mr-1" />
                    Connect {provider.name}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* SSO Settings */}
      <Card>
        <CardHeader>
          <CardTitle>SSO Settings</CardTitle>
          <CardDescription>Configure single sign-on behavior</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enforce SSO</Label>
                <p className="text-sm text-gray-500">Require all users to sign in via SSO</p>
              </div>
              <Switch />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-provision Users</Label>
                <p className="text-sm text-gray-500">Automatically create accounts for new SSO users</p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Just-in-Time Provisioning</Label>
                <p className="text-sm text-gray-500">Create user accounts on first login</p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Default Role Assignment</Label>
                <p className="text-sm text-gray-500">Automatically assign roles based on SSO attributes</p>
              </div>
              <Switch />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Domain Verification */}
      <Card>
        <CardHeader>
          <CardTitle>Domain Verification</CardTitle>
          <CardDescription>Verify your domain ownership for SSO</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="domain">Domain Name</Label>
              <div className="flex gap-2 mt-1">
                <Input id="domain" placeholder="example.com" />
                <Button>Verify</Button>
              </div>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium mb-2">Verification Methods:</p>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Add a TXT record to your DNS</li>
                <li>• Upload an HTML file to your website</li>
                <li>• Add a meta tag to your homepage</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}