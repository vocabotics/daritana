import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Users, Plus, Mail, Globe, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface OrganizationOnboardingProps {
  onComplete: () => void;
}

export const OrganizationOnboarding: React.FC<OrganizationOnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState<'choose' | 'join' | 'create'>('choose');
  const [joinCode, setJoinCode] = useState('');
  const [organizationData, setOrganizationData] = useState({
    name: '',
    slug: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    postcode: '',
    country: 'Malaysia',
    businessType: '',
    employeeCount: '1-10'
  });

  const handleJoinOrganization = async () => {
    try {
      // TODO: Implement join organization logic
      toast.success('Organization joined successfully!');
      onComplete();
    } catch (error) {
      toast.error('Failed to join organization');
    }
  };

  const handleCreateOrganization = async () => {
    try {
      // TODO: Implement create organization logic
      toast.success('Organization created successfully!');
      onComplete();
    } catch (error) {
      toast.error('Failed to create organization');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Welcome to Daritana!</CardTitle>
          <CardDescription>
            To get started, you need to be part of an organization. You can either join an existing one or create your own.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 'choose' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card 
                className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-transparent hover:border-blue-200"
                onClick={() => setStep('join')}
              >
                <CardContent className="p-6 text-center">
                  <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Join Organization</h3>
                  <p className="text-sm text-gray-600">
                    Join an existing organization using an invitation code or email
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-transparent hover:border-green-200"
                onClick={() => setStep('create')}
              >
                <CardContent className="p-6 text-center">
                  <Plus className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Create Organization</h3>
                  <p className="text-sm text-gray-600">
                    Start your own organization and invite team members
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {step === 'join' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Button variant="ghost" size="sm" onClick={() => setStep('choose')}>
                  ← Back
                </Button>
                <h3 className="text-lg font-semibold">Join Organization</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="joinCode">Invitation Code or Email</Label>
                  <Input
                    id="joinCode"
                    placeholder="Enter invitation code or organization email"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                  />
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleJoinOrganization}
                  disabled={!joinCode.trim()}
                >
                  Join Organization
                </Button>

                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Don't have an invitation?{' '}
                    <button 
                      className="text-blue-600 hover:underline"
                      onClick={() => setStep('create')}
                    >
                      Create your own organization
                    </button>
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 'create' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Button variant="ghost" size="sm" onClick={() => setStep('choose')}>
                  ← Back
                </Button>
                <h3 className="text-lg font-semibold">Create Organization</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Organization Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter organization name"
                    value={organizationData.name}
                    onChange={(e) => setOrganizationData({...organizationData, name: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="slug">URL Slug *</Label>
                  <Input
                    id="slug"
                    placeholder="your-org-name"
                    value={organizationData.slug}
                    onChange={(e) => setOrganizationData({...organizationData, slug: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contact@organization.com"
                    value={organizationData.email}
                    onChange={(e) => setOrganizationData({...organizationData, email: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="+60 12-345 6789"
                    value={organizationData.phone}
                    onChange={(e) => setOrganizationData({...organizationData, phone: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="businessType">Business Type</Label>
                  <Select 
                    value={organizationData.businessType} 
                    onValueChange={(value) => setOrganizationData({...organizationData, businessType: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="architecture">Architecture & Design</SelectItem>
                      <SelectItem value="construction">Construction</SelectItem>
                      <SelectItem value="engineering">Engineering</SelectItem>
                      <SelectItem value="consulting">Consulting</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="employeeCount">Team Size</Label>
                  <Select 
                    value={organizationData.employeeCount} 
                    onValueChange={(value) => setOrganizationData({...organizationData, employeeCount: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10 employees</SelectItem>
                      <SelectItem value="11-50">11-50 employees</SelectItem>
                      <SelectItem value="51-200">51-200 employees</SelectItem>
                      <SelectItem value="200+">200+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  placeholder="Enter full address"
                  value={organizationData.address}
                  onChange={(e) => setOrganizationData({...organizationData, address: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="Kuala Lumpur"
                    value={organizationData.city}
                    onChange={(e) => setOrganizationData({...organizationData, city: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    placeholder="Selangor"
                    value={organizationData.state}
                    onChange={(e) => setOrganizationData({...organizationData, state: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="postcode">Postcode</Label>
                  <Input
                    id="postcode"
                    placeholder="50000"
                    value={organizationData.postcode}
                    onChange={(e) => setOrganizationData({...organizationData, postcode: e.target.value})}
                  />
                </div>
              </div>

              <Button 
                className="w-full" 
                onClick={handleCreateOrganization}
                disabled={!organizationData.name || !organizationData.slug || !organizationData.email}
              >
                Create Organization
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
