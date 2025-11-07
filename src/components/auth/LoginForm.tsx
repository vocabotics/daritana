import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import MFAVerification from './MFAVerification';
import { Building, Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { login, isLoading, error, clearError, requiresMFA, pendingUserId, completeMFALogin } = useAuthStore();
  const [rememberMe, setRememberMe] = useState(true); // Default to remember me
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: true
    }
  });
  
  const onSubmit = async (data: LoginFormData) => {
    clearError(); // Clear any previous errors
    
    // Store remember me preference
    if (data.rememberMe) {
      localStorage.setItem('rememberMe', 'true');
    } else {
      localStorage.setItem('rememberMe', 'false');
    }
    
    const result = await login(data.email, data.password);
    if (!result.success) {
      // Error is handled in the store and will be displayed in the UI
      return;
    }
    
    if (result.requiresMFA) {
      // MFA verification will be shown below
      return;
    }
    
    // Check if this is a new organization that needs onboarding
    if (result.isNewOrg) {
      navigate('/onboarding');
    }
  };
  
  const handleMFASuccess = () => {
    if (pendingUserId) {
      completeMFALogin(pendingUserId);
    }
  };
  
  
  // Show MFA verification if required
  if (requiresMFA && pendingUserId) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">Two-Factor Authentication</h3>
          <p className="text-sm text-gray-600 mb-4">
            Please verify your identity to complete sign in
          </p>
        </div>
        <MFAVerification
          userId={pendingUserId}
          onSuccess={handleMFASuccess}
          onCancel={() => {
            clearError();
            // Reset MFA state by clearing store
            window.location.reload();
          }}
        />
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
          {error}
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          {...register('email')}
          className="architect-border"
        />
        {errors.email && (
          <p className="text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          {...register('password')}
          className="architect-border"
        />
        {errors.password && (
          <p className="text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="rememberMe" 
          defaultChecked={true}
          onCheckedChange={(checked) => setRememberMe(checked as boolean)}
          {...register('rememberMe')}
        />
        <Label 
          htmlFor="rememberMe" 
          className="text-sm font-normal cursor-pointer"
        >
          Remember me for 7 days
        </Label>
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-black hover:bg-gray-800"
        disabled={isLoading}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sign In
      </Button>
      
      <div className="text-xs text-gray-500 text-center space-y-1">
        <div>Test Accounts (password: password123):</div>
        <div>admin@daritana.com | lead@daritana.com | designer@daritana.com</div>
        <div>contractor@daritana.com | client@daritana.com</div>
      </div>
      
      <div className="text-center pt-4 border-t">
        <p className="text-sm text-gray-600 mb-2">
          Don't have a company account?
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/register')}
          className="w-full"
        >
          Register Your Company
        </Button>
      </div>
    </form>
  );
}

export function LoginPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <h1 className="text-4xl font-light architect-heading">daritana</h1>
          </div>
          <p className="text-gray-600 architect-text">
            Professional Architect & Interior Designer Management System
          </p>
          <div className="mt-4 text-sm text-gray-500">
            Streamlining design projects across Malaysia
          </div>
        </div>
        
        <div className="architect-grid p-8 rounded-lg minimal-shadow">
          <Card className="max-w-md mx-auto architect-border">
            <CardHeader className="text-center">
              <CardTitle className="architect-heading">Welcome Back</CardTitle>
              <CardDescription className="architect-text">
                Sign in to access your workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm />
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-8 text-center text-xs text-gray-400">
          © 2024 daritana Architecture & Design Management System
        </div>
      </div>
    </div>
  );
}