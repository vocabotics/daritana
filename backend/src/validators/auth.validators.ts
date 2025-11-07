import { z } from 'zod';

// Password validation schema
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password must be less than 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character');

// User registration schema
export const registerSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email('Invalid email address')
      .max(255, 'Email must be less than 255 characters'),
    password: passwordSchema,
    confirmPassword: z.string(),
    firstName: z
      .string()
      .min(1, 'First name is required')
      .max(50, 'First name must be less than 50 characters')
      .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .max(50, 'Last name must be less than 50 characters')
      .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),
    phone: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^\+?[1-9]\d{1,14}$/.test(val),
        'Invalid phone number format'
      ),
    role: z
      .enum(['CLIENT', 'CONTRACTOR', 'STAFF', 'DESIGNER', 'PROJECT_LEAD'])
      .optional()
      .default('CLIENT'),
    company: z.string().max(100).optional(),
    position: z.string().max(100).optional(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
});

// User login schema
export const loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email('Invalid email address')
      .max(255, 'Email must be less than 255 characters'),
    password: z
      .string()
      .min(1, 'Password is required'),
    rememberMe: z.boolean().optional().default(false),
  })
});

// Refresh token schema
export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  })
});

// Forgot password schema
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email('Invalid email address')
      .max(255, 'Email must be less than 255 characters'),
  })
});

// Reset password schema
export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Reset token is required'),
    password: passwordSchema,
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }),
  params: z.object({
    token: z.string().min(1, 'Token parameter is required'),
  })
});

// Change password schema
export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }).refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  })
});

// Verify email schema
export const verifyEmailSchema = z.object({
  params: z.object({
    token: z.string().min(1, 'Verification token is required'),
  })
});

// Resend verification email schema
export const resendVerificationSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email('Invalid email address')
      .max(255, 'Email must be less than 255 characters'),
  })
});

// Update profile schema
export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z
      .string()
      .min(1, 'First name is required')
      .max(50, 'First name must be less than 50 characters')
      .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes')
      .optional(),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .max(50, 'Last name must be less than 50 characters')
      .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes')
      .optional(),
    phone: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^\+?[1-9]\d{1,14}$/.test(val),
        'Invalid phone number format'
      ),
    bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
    company: z.string().max(100, 'Company name must be less than 100 characters').optional(),
    position: z.string().max(100, 'Position must be less than 100 characters').optional(),
    website: z
      .string()
      .url('Invalid website URL')
      .optional()
      .or(z.literal('')),
    linkedin: z
      .string()
      .url('Invalid LinkedIn URL')
      .optional()
      .or(z.literal('')),
    address: z.string().max(200, 'Address must be less than 200 characters').optional(),
    city: z.string().max(100, 'City must be less than 100 characters').optional(),
    state: z.string().max(100, 'State must be less than 100 characters').optional(),
    postcode: z.string().max(20, 'Postcode must be less than 20 characters').optional(),
    country: z.string().max(100, 'Country must be less than 100 characters').optional().default('Malaysia'),
    language: z.enum(['en', 'ms', 'zh']).optional().default('en'),
    timezone: z.string().optional().default('Asia/Kuala_Lumpur'),
    currency: z.enum(['MYR', 'USD', 'EUR', 'GBP']).optional().default('MYR'),
    dateFormat: z.enum(['dd/mm/yyyy', 'mm/dd/yyyy', 'yyyy-mm-dd']).optional().default('dd/mm/yyyy'),
    theme: z.enum(['light', 'dark', 'auto']).optional().default('light'),
  })
});

// Update notification preferences schema
export const updateNotificationPreferencesSchema = z.object({
  body: z.object({
    emailNotifications: z.boolean().optional().default(true),
    smsNotifications: z.boolean().optional().default(false),
    pushNotifications: z.boolean().optional().default(true),
  })
});

// UUID parameter validation
export const uuidParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid ID format'),
  })
});