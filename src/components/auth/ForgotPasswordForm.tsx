import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { Building, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const { forgotPassword, isLoading, error, clearError } = useAuthStore();
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [submittedEmail, setSubmittedEmail] = React.useState('');
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });
  
  const onSubmit = async (data: ForgotPasswordFormData) => {
    clearError();
    const success = await forgotPassword(data.email);
    if (success) {
      setSubmittedEmail(data.email);
      setIsSuccess(true);
    }
  };

  if (isSuccess) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-green-600">Email Sent!</CardTitle>
          <CardDescription>
            We've sent password reset instructions to <strong>{submittedEmail}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600 text-center">
            <p>Didn't receive the email? Check your spam folder or try again in a few minutes.</p>
          </div>
          
          <div className="space-y-2">
            <Button 
              onClick={() => {
                setIsSuccess(false);
                setSubmittedEmail('');
              }}
              variant="outline"
              className="w-full"
            >
              Try Different Email
            </Button>
            
            <Link to="/login">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="architect-heading">Reset Your Password</CardTitle>
        <CardDescription className="architect-text">
          Enter your email address and we'll send you instructions to reset your password
        </CardDescription>
      </CardHeader>
      <CardContent>
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
              placeholder="Enter your registered email"
              {...register('email')}
              className="architect-border"
              autoFocus
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-black hover:bg-gray-800"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Reset Instructions
          </Button>
          
          <div className="text-center">
            <Link to="/login" className="text-sm text-gray-600 hover:text-black hover:underline">
              <ArrowLeft className="mr-1 h-3 w-3 inline" />
              Back to Login
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Reset Password Form (for when user clicks the link in email)
const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const { resetPassword, isLoading, error, clearError } = useAuthStore();
  const [isSuccess, setIsSuccess] = React.useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });
  
  const onSubmit = async (data: ResetPasswordFormData) => {
    clearError();
    const success = await resetPassword(token, data.password, data.confirmPassword);
    if (success) {
      setIsSuccess(true);
    }
  };

  if (isSuccess) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-green-600">Password Reset Successfully!</CardTitle>
          <CardDescription>
            Your password has been updated. You can now sign in with your new password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/login">
            <Button className="w-full">
              Go to Login
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="architect-heading">Create New Password</CardTitle>
        <CardDescription className="architect-text">
          Please enter your new password below
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter new password"
              {...register('password')}
              className="architect-border"
              autoFocus
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
            <p className="text-xs text-gray-500">
              Must contain at least 8 characters with uppercase, lowercase, and numbers
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              {...register('confirmPassword')}
              className="architect-border"
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-black hover:bg-gray-800"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Building className="h-12 w-12 mr-3" />
            <h1 className="text-4xl font-light architect-heading">Daritana</h1>
          </div>
          <p className="text-gray-600 architect-text">
            Password Recovery
          </p>
        </div>
        
        <div className="architect-grid p-8 rounded-lg minimal-shadow">
          <ForgotPasswordForm />
        </div>
        
        <div className="mt-8 text-center text-xs text-gray-400">
          © 2024 Daritana Architecture & Design Management System
        </div>
      </div>
    </div>
  );
}

interface ResetPasswordPageProps {
  token: string;
}

export function ResetPasswordPage({ token }: ResetPasswordPageProps) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Building className="h-12 w-12 mr-3" />
            <h1 className="text-4xl font-light architect-heading">Daritana</h1>
          </div>
          <p className="text-gray-600 architect-text">
            Password Reset
          </p>
        </div>
        
        <div className="architect-grid p-8 rounded-lg minimal-shadow">
          <ResetPasswordForm token={token} />
        </div>
        
        <div className="mt-8 text-center text-xs text-gray-400">
          © 2024 Daritana Architecture & Design Management System
        </div>
      </div>
    </div>
  );
}