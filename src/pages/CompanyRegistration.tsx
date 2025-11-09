import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, CreditCard, Shield, CheckCircle2, ArrowRight, Globe, Mail, Phone, MapPin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { useOnboardingStore } from '@/store/onboardingStore';

interface CompanyRegistrationData {
  name: string;
  type: 'architecture' | 'engineering' | 'construction' | 'interior_design' | 'landscape' | 'other';
  size: 'solo' | 'small' | 'medium' | 'large' | 'enterprise';
  website?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  postalCode?: string;
  description?: string;
  industry?: string;
  founded?: string;
  adminEmail: string;
  adminFirstName: string;
  adminLastName: string;
  adminPassword: string;
  confirmPassword: string;
  acceptTerms: boolean;
  acceptMarketing: boolean;
}

export const CompanyRegistration: React.FC = () => {
  const navigate = useNavigate();
  const setCompanyRegistrationData = useOnboardingStore((state) => state.setCompanyRegistrationData);
  const [step, setStep] = useState<'registration' | 'onboarding'>('registration');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CompanyRegistrationData>({
    name: '',
    type: 'architecture',
    size: 'small',
    country: 'Malaysia',
    adminEmail: '',
    adminFirstName: '',
    adminLastName: '',
    adminPassword: '',
    confirmPassword: '',
    acceptTerms: false,
    acceptMarketing: false,
  });

  const handleInputChange = (field: keyof CompanyRegistrationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.acceptTerms) {
      toast.error('Please accept the terms and conditions');
      return;
    }

    if (formData.adminPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.adminPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      // Store registration data in onboarding store (memory-only, no localStorage)
      setCompanyRegistrationData({
        companyName: formData.name,
        businessType: formData.type,
        teamSize: formData.size,
        country: formData.country,
        description: formData.description || '',
        registrationNumber: '',
        businessAddress: formData.address || '',
        city: formData.city || '',
        state: formData.state || '',
        postcode: formData.postalCode || '',
        phone: formData.phone || '',
        website: formData.website || '',
      });

      // Move to onboarding wizard
      setStep('onboarding');
      toast.success('Company registration successful! Let\'s set up your workspace.');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'onboarding') {
    return <OnboardingWizard />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-center mb-4">
              <Building2 className="h-12 w-12 text-blue-600 mr-3" />
              <h1 className="text-4xl font-bold text-gray-900">Daritana</h1>
            </div>
            <p className="text-xl text-gray-600 mb-2">Architecture Management Platform</p>
            <p className="text-lg text-gray-500">Join thousands of architecture firms managing their projects efficiently</p>
          </motion.div>
        </div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid md:grid-cols-3 gap-6 mb-8"
        >
          <Card className="text-center">
            <CardHeader>
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Team Collaboration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Real-time collaboration with your team members</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardHeader>
              <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Enterprise Security</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Bank-level security for your sensitive project data</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardHeader>
              <CreditCard className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Flexible Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Start free and scale as you grow</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Registration Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-4xl mx-auto"
        >
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Register Your Company</CardTitle>
              <CardDescription>
                Get started with Daritana in just a few minutes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Company Information */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Company Details</h3>
                    
                    <div>
                      <Label htmlFor="name">Company Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Your Company Name"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="type">Business Type *</Label>
                      <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="architecture">Architecture</SelectItem>
                          <SelectItem value="engineering">Engineering</SelectItem>
                          <SelectItem value="construction">Construction</SelectItem>
                          <SelectItem value="interior_design">Interior Design</SelectItem>
                          <SelectItem value="landscape">Landscape Architecture</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="size">Company Size *</Label>
                      <Select value={formData.size} onValueChange={(value) => handleInputChange('size', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="solo">Solo Practitioner</SelectItem>
                          <SelectItem value="small">Small Team (2-10)</SelectItem>
                          <SelectItem value="medium">Medium Team (11-50)</SelectItem>
                          <SelectItem value="large">Large Team (51-200)</SelectItem>
                          <SelectItem value="enterprise">Enterprise (200+)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={formData.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        placeholder="https://yourcompany.com"
                        type="url"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+60 12-345 6789"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Location</h3>
                    
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        placeholder="Street Address"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          placeholder="City"
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={formData.state}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                          placeholder="State"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="country">Country *</Label>
                        <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Malaysia">Malaysia</SelectItem>
                            <SelectItem value="Singapore">Singapore</SelectItem>
                            <SelectItem value="Indonesia">Indonesia</SelectItem>
                            <SelectItem value="Thailand">Thailand</SelectItem>
                            <SelectItem value="Philippines">Philippines</SelectItem>
                            <SelectItem value="Vietnam">Vietnam</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="postalCode">Postal Code</Label>
                        <Input
                          id="postalCode"
                          value={formData.postalCode}
                          onChange={(e) => handleInputChange('postalCode', e.target.value)}
                          placeholder="Postal Code"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Company Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Tell us about your company..."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                {/* Admin Account */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Account</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="adminFirstName">First Name *</Label>
                      <Input
                        id="adminFirstName"
                        value={formData.adminFirstName}
                        onChange={(e) => handleInputChange('adminFirstName', e.target.value)}
                        placeholder="First Name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="adminLastName">Last Name *</Label>
                      <Input
                        id="adminLastName"
                        value={formData.adminLastName}
                        onChange={(e) => handleInputChange('adminLastName', e.target.value)}
                        placeholder="Last Name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="adminEmail">Email *</Label>
                      <Input
                        id="adminEmail"
                        value={formData.adminEmail}
                        onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                        placeholder="admin@company.com"
                        type="email"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label htmlFor="adminPassword">Password *</Label>
                      <Input
                        id="adminPassword"
                        value={formData.adminPassword}
                        onChange={(e) => handleInputChange('adminPassword', e.target.value)}
                        placeholder="Create a strong password"
                        type="password"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirm Password *</Label>
                      <Input
                        id="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        placeholder="Confirm your password"
                        type="password"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="acceptTerms"
                      checked={formData.acceptTerms}
                      onCheckedChange={(checked) => handleInputChange('acceptTerms', checked)}
                      required
                    />
                    <Label htmlFor="acceptTerms" className="text-sm">
                      I accept the <a href="#" className="text-blue-600 hover:underline">Terms and Conditions</a> and{' '}
                      <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a> *
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="acceptMarketing"
                      checked={formData.acceptMarketing}
                      onCheckedChange={(checked) => handleInputChange('acceptMarketing', checked)}
                    />
                    <Label htmlFor="acceptMarketing" className="text-sm">
                      I would like to receive marketing communications about Daritana features and updates
                    </Label>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="text-center">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isLoading}
                    className="px-8 py-3 text-lg"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Creating Account...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        Create Company Account
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </div>
                    )}
                  </Button>
                </div>

                {/* Login Link */}
                <div className="text-center text-gray-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Sign in here
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-12 text-gray-500"
        >
          <p>&copy; 2025 Daritana. All rights reserved.</p>
        </motion.div>
      </div>
    </div>
  );
};

export default CompanyRegistration;
