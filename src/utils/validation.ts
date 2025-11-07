import { z } from 'zod';

// Common validation schemas
export const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .min(1, 'Email is required');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  );

export const phoneSchema = z
  .string()
  .regex(/^(\+?6?01)[0-46-9]-*[0-9]{7,8}$/, 'Please enter a valid Malaysian phone number')
  .optional()
  .or(z.literal(''));

export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters long')
  .max(50, 'Name must not exceed 50 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, apostrophes, and hyphens');

// User validation schemas
export const registerSchema = z
  .object({
    firstName: nameSchema,
    lastName: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    role: z.enum(['client', 'designer', 'contractor', 'project_lead', 'staff']),
    companyName: z.string().min(2, 'Company name must be at least 2 characters').optional(),
    phoneNumber: phoneSchema,
    terms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const profileUpdateSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  phoneNumber: phoneSchema,
  companyName: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  website: z.string().url('Please enter a valid website URL').optional().or(z.literal('')),
  linkedin: z.string().url('Please enter a valid LinkedIn URL').optional().or(z.literal('')),
});

// Project validation schemas
export const projectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters').max(100, 'Project name must not exceed 100 characters'),
  description: z.string().max(1000, 'Description must not exceed 1000 characters').optional(),
  type: z.enum(['residential', 'commercial', 'industrial', 'public', 'renovation', 'interior']),
  category: z.string().min(1, 'Category is required'),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']),
  startDate: z.string().datetime('Please enter a valid start date'),
  endDate: z.string().datetime('Please enter a valid end date'),
  estimatedBudget: z.number().positive('Budget must be a positive number').optional(),
  clientId: z.string().uuid('Please select a valid client').optional(),
  managerId: z.string().uuid('Please select a valid project manager').optional(),
  siteAddress: z.string().min(5, 'Site address must be at least 5 characters').max(200),
  siteCity: z.string().min(2, 'City must be at least 2 characters').max(50),
  siteState: z.string().min(2, 'State must be at least 2 characters').max(50),
  sitePostcode: z.string().regex(/^\d{5}$/, 'Please enter a valid Malaysian postcode'),
  siteCountry: z.string().default('Malaysia'),
}).refine(data => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) < new Date(data.endDate);
  }
  return true;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

// Task validation schemas
export const taskSchema = z.object({
  title: z.string().min(2, 'Task title must be at least 2 characters').max(100),
  description: z.string().max(1000, 'Description must not exceed 1000 characters').optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  assignedTo: z.string().uuid('Please select a valid assignee').optional(),
  projectId: z.string().uuid('Please select a valid project'),
  dueDate: z.string().datetime('Please enter a valid due date').optional(),
  estimatedHours: z.number().positive('Estimated hours must be positive').max(1000).optional(),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed').optional(),
});

// File validation schemas
export const fileUploadSchema = z.object({
  name: z.string().min(1, 'File name is required').max(200),
  category: z.enum(['drawing', 'specification', 'photo', 'document', 'model', 'other']),
  description: z.string().max(500).optional(),
  projectId: z.string().uuid().optional(),
  isPublic: z.boolean().default(false),
  tags: z.array(z.string()).max(10).optional(),
});

// Financial validation schemas
export const quotationSchema = z.object({
  projectId: z.string().uuid('Please select a valid project'),
  clientId: z.string().uuid('Please select a valid client'),
  items: z.array(z.object({
    description: z.string().min(1, 'Item description is required'),
    quantity: z.number().positive('Quantity must be positive'),
    unitPrice: z.number().positive('Unit price must be positive'),
    total: z.number().positive('Total must be positive'),
  })).min(1, 'At least one item is required'),
  subtotal: z.number().positive('Subtotal must be positive'),
  tax: z.number().min(0, 'Tax cannot be negative'),
  discount: z.number().min(0, 'Discount cannot be negative'),
  total: z.number().positive('Total must be positive'),
  validUntil: z.string().datetime('Please enter a valid expiry date'),
  notes: z.string().max(1000).optional(),
});

export const invoiceSchema = z.object({
  projectId: z.string().uuid('Please select a valid project'),
  clientId: z.string().uuid('Please select a valid client'),
  quotationId: z.string().uuid().optional(),
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  items: z.array(z.object({
    description: z.string().min(1, 'Item description is required'),
    quantity: z.number().positive('Quantity must be positive'),
    unitPrice: z.number().positive('Unit price must be positive'),
    total: z.number().positive('Total must be positive'),
  })).min(1, 'At least one item is required'),
  subtotal: z.number().positive('Subtotal must be positive'),
  tax: z.number().min(0, 'Tax cannot be negative'),
  discount: z.number().min(0, 'Discount cannot be negative'),
  total: z.number().positive('Total must be positive'),
  dueDate: z.string().datetime('Please enter a valid due date'),
  notes: z.string().max(1000).optional(),
});

// Organization validation schemas
export const organizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters').max(100),
  email: emailSchema,
  phone: phoneSchema,
  website: z.string().url('Please enter a valid website URL').optional().or(z.literal('')),
  address: z.string().min(5, 'Address must be at least 5 characters').max(200),
  city: z.string().min(2, 'City must be at least 2 characters').max(50),
  state: z.string().min(2, 'State must be at least 2 characters').max(50),
  postcode: z.string().regex(/^\d{5}$/, 'Please enter a valid Malaysian postcode'),
  country: z.string().default('Malaysia'),
  businessType: z.enum(['architecture', 'interior_design', 'construction', 'engineering', 'consulting', 'other']),
  registrationNo: z.string().min(1, 'Registration number is required').max(50),
  taxNo: z.string().optional(),
  establishedYear: z.number().min(1900).max(new Date().getFullYear()).optional(),
  employeeCount: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).optional(),
});

// Search validation
export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(100),
  filters: z.object({
    type: z.enum(['all', 'projects', 'tasks', 'files', 'users']).default('all'),
    status: z.string().optional(),
    dateRange: z.object({
      start: z.string().datetime().optional(),
      end: z.string().datetime().optional(),
    }).optional(),
  }).optional(),
});

// Security validation schemas
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine(data => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

export const twoFactorSetupSchema = z.object({
  secret: z.string().min(1, 'Secret is required'),
  token: z.string().length(6, 'Please enter a 6-digit verification code'),
});

// Utility functions
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
    .replace(/on\w+='[^']*'/gi, ''); // Remove event handlers with single quotes
};

export const validateEmail = (email: string): boolean => {
  try {
    emailSchema.parse(email);
    return true;
  } catch {
    return false;
  }
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  try {
    passwordSchema.parse(password);
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(e => e.message),
      };
    }
    return { isValid: false, errors: ['Invalid password'] };
  }
};

export const validatePhone = (phone: string): boolean => {
  try {
    phoneSchema.parse(phone);
    return true;
  } catch {
    return false;
  }
};

// File validation
export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.some(type => {
    if (type.startsWith('.')) {
      return file.name.toLowerCase().endsWith(type.toLowerCase());
    }
    return file.type.toLowerCase().includes(type.toLowerCase());
  });
};

export const validateFileSize = (file: File, maxSizeInMB: number): boolean => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
};

// Common file type groups
export const FILE_TYPES = {
  images: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
  documents: ['.pdf', '.doc', '.docx', '.txt', '.rtf'],
  drawings: ['.dwg', '.dxf', '.pdf', '.svg'],
  models: ['.3ds', '.obj', '.fbx', '.dae', '.ifc'],
  spreadsheets: ['.xls', '.xlsx', '.csv'],
  presentations: ['.ppt', '.pptx'],
  archives: ['.zip', '.rar', '.7z', '.tar', '.gz'],
} as const;

export const MAX_FILE_SIZES = {
  image: 10, // MB
  document: 50, // MB
  model: 100, // MB
  archive: 200, // MB
} as const;

// Export all schemas for use in forms
export const validationSchemas = {
  register: registerSchema,
  login: loginSchema,
  forgotPassword: forgotPasswordSchema,
  resetPassword: resetPasswordSchema,
  profileUpdate: profileUpdateSchema,
  project: projectSchema,
  task: taskSchema,
  fileUpload: fileUploadSchema,
  quotation: quotationSchema,
  invoice: invoiceSchema,
  organization: organizationSchema,
  search: searchSchema,
  changePassword: changePasswordSchema,
  twoFactorSetup: twoFactorSetupSchema,
};

export type ValidationSchemas = typeof validationSchemas;