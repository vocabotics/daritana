import React, { useCallback, useRef } from 'react';
import { useForm, UseFormReturn, FieldValues, Path, PathValue } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSanitization, SANITIZATION_PRESETS } from '@/hooks/useSanitization';
import { securityManager } from '@/utils/security';
import { toast } from 'sonner';
import { LoadingButton } from '@/components/ui/loading';

interface SecureFormProps<T extends FieldValues> {
  schema: z.ZodSchema<T>;
  onSubmit: (data: T) => Promise<void> | void;
  onError?: (errors: Record<string, string>) => void;
  children: (methods: UseFormReturn<T> & SecureFormMethods<T>) => React.ReactNode;
  defaultValues?: Partial<T>;
  className?: string;
  enableCSRF?: boolean;
  enableRateLimit?: boolean;
  rateLimitKey?: string;
  maxAttempts?: number;
  sanitizationPresets?: Record<keyof T, keyof typeof SANITIZATION_PRESETS>;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

interface SecureFormMethods<T extends FieldValues> {
  sanitizeField: (fieldName: keyof T, value: any) => any;
  validateField: (fieldName: keyof T, value: any) => Promise<boolean>;
  isFieldSafe: (fieldName: keyof T, value: any) => { safe: boolean; threats: string[] };
  resetSecurityState: () => void;
}

export function SecureForm<T extends FieldValues>({
  schema,
  onSubmit,
  onError,
  children,
  defaultValues,
  className,
  enableCSRF = true,
  enableRateLimit = true,
  rateLimitKey,
  maxAttempts = 5,
  sanitizationPresets,
  autoSave = false,
  autoSaveDelay = 2000,
}: SecureFormProps<T>) {
  const methods = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onBlur',
  });

  const { sanitizeText, sanitizeObject, isContentSafe } = useSanitization();
  const csrfTokenRef = useRef<string | null>(null);
  const lastAutoSaveRef = useRef<number>(0);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Generate CSRF token on mount
  React.useEffect(() => {
    if (enableCSRF) {
      csrfTokenRef.current = securityManager.generateCSRFToken();
    }
  }, [enableCSRF]);

  // Auto-save functionality
  React.useEffect(() => {
    if (!autoSave) return;

    const subscription = methods.watch((data) => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      autoSaveTimeoutRef.current = setTimeout(() => {
        const now = Date.now();
        if (now - lastAutoSaveRef.current > autoSaveDelay) {
          saveFormData(data as T);
          lastAutoSaveRef.current = now;
        }
      }, autoSaveDelay);
    });

    return () => {
      subscription.unsubscribe();
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [autoSave, autoSaveDelay, methods]);

  const saveFormData = useCallback((data: T) => {
    try {
      const sanitized = sanitizeFormData(data);
      securityManager.setSecureItem('form_autosave', sanitized);
      toast.success('Form auto-saved', { duration: 2000 });
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, []);

  const sanitizeFormData = useCallback((data: T): T => {
    const sanitized = { ...data };

    for (const [fieldName, value] of Object.entries(sanitized)) {
      if (typeof value === 'string') {
        const presetKey = sanitizationPresets?.[fieldName as keyof T];
        const preset = presetKey ? SANITIZATION_PRESETS[presetKey] : undefined;
        sanitized[fieldName as keyof T] = sanitizeText(value, preset) as PathValue<T, Path<T>>;
      }
    }

    return sanitizeObject(sanitized);
  }, [sanitizeObject, sanitizeText, sanitizationPresets]);

  const handleSubmit = methods.handleSubmit(async (data) => {
    try {
      // Rate limiting check
      if (enableRateLimit) {
        const identifier = rateLimitKey || securityManager.generateDeviceFingerprint();
        const rateCheck = securityManager.checkRateLimit(identifier, maxAttempts);
        
        if (!rateCheck.allowed) {
          const resetTime = rateCheck.resetTime ? new Date(rateCheck.resetTime) : null;
          toast.error('Too many attempts', {
            description: resetTime 
              ? `Try again after ${resetTime.toLocaleTimeString()}`
              : 'Please wait before trying again',
          });
          return;
        }

        if (rateCheck.remainingAttempts <= 2) {
          toast.warning(`${rateCheck.remainingAttempts} attempts remaining`, {
            description: 'Please be careful with your inputs',
          });
        }
      }

      // CSRF token validation
      if (enableCSRF && csrfTokenRef.current) {
        if (!securityManager.validateCSRFToken(csrfTokenRef.current)) {
          toast.error('Security validation failed', {
            description: 'Please refresh the page and try again',
          });
          return;
        }
      }

      // Sanitize form data
      const sanitizedData = sanitizeFormData(data);

      // Validate sanitized data
      const validationResult = schema.safeParse(sanitizedData);
      if (!validationResult.success) {
        const errors: Record<string, string> = {};
        validationResult.error.errors.forEach((error) => {
          if (error.path[0]) {
            errors[error.path[0].toString()] = error.message;
          }
        });
        
        onError?.(errors);
        toast.error('Validation failed', {
          description: 'Please check your inputs and try again',
        });
        return;
      }

      // Security scan
      const securityIssues: string[] = [];
      for (const [fieldName, value] of Object.entries(sanitizedData)) {
        if (typeof value === 'string') {
          const safetyCheck = isContentSafe(value);
          if (!safetyCheck.safe) {
            securityIssues.push(`${fieldName}: ${safetyCheck.threats.join(', ')}`);
          }
        }
      }

      if (securityIssues.length > 0) {
        console.warn('Security issues detected:', securityIssues);
        toast.error('Security validation failed', {
          description: 'Potentially harmful content detected',
        });
        return;
      }

      // Submit the form
      await onSubmit(validationResult.data);

      // Clear rate limit on successful submission
      if (enableRateLimit && rateLimitKey) {
        securityManager.clearRateLimit(rateLimitKey);
      }

      // Clear auto-save data on successful submission
      if (autoSave) {
        securityManager.removeSecureItem('form_autosave');
      }

    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Submission failed', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    }
  });

  // Extended methods for secure form operations
  const secureFormMethods: SecureFormMethods<T> = {
    sanitizeField: useCallback((fieldName: keyof T, value: any) => {
      if (typeof value !== 'string') return value;
      
      const presetKey = sanitizationPresets?.[fieldName];
      const preset = presetKey ? SANITIZATION_PRESETS[presetKey] : undefined;
      return sanitizeText(value, preset);
    }, [sanitizeText, sanitizationPresets]),

    validateField: useCallback(async (fieldName: keyof T, value: any): Promise<boolean> => {
      try {
        const fieldSchema = schema.shape[fieldName as string];
        if (!fieldSchema) return true;
        
        await fieldSchema.parseAsync(value);
        return true;
      } catch (error) {
        return false;
      }
    }, [schema]),

    isFieldSafe: useCallback((fieldName: keyof T, value: any) => {
      if (typeof value !== 'string') {
        return { safe: true, threats: [] };
      }
      return isContentSafe(value);
    }, [isContentSafe]),

    resetSecurityState: useCallback(() => {
      if (enableCSRF) {
        csrfTokenRef.current = securityManager.generateCSRFToken();
      }
      if (enableRateLimit && rateLimitKey) {
        securityManager.clearRateLimit(rateLimitKey);
      }
    }, [enableCSRF, enableRateLimit, rateLimitKey]),
  };

  return (
    <form onSubmit={handleSubmit} className={className} noValidate>
      {/* CSRF token hidden field */}
      {enableCSRF && csrfTokenRef.current && (
        <input
          type="hidden"
          name="_csrf"
          value={csrfTokenRef.current}
        />
      )}
      
      {children({ ...methods, ...secureFormMethods })}
    </form>
  );
}

// Secure input component with built-in sanitization
interface SecureInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  name: string;
  label?: string;
  error?: string;
  sanitizationPreset?: keyof typeof SANITIZATION_PRESETS;
  onChange?: (sanitizedValue: string) => void;
  showSecurityIndicator?: boolean;
}

export const SecureInput: React.FC<SecureInputProps> = ({
  name,
  label,
  error,
  sanitizationPreset = 'name',
  onChange,
  showSecurityIndicator = false,
  className = '',
  ...props
}) => {
  const { sanitizeText, isContentSafe } = useSanitization();
  const [securityStatus, setSecurityStatus] = React.useState<{ safe: boolean; threats: string[] }>({ safe: true, threats: [] });

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value;
    const preset = SANITIZATION_PRESETS[sanitizationPreset];
    const sanitizedValue = sanitizeText(rawValue, preset);
    
    // Check security
    if (showSecurityIndicator) {
      const safetyCheck = isContentSafe(sanitizedValue);
      setSecurityStatus(safetyCheck);
    }
    
    // Update the input value
    event.target.value = sanitizedValue;
    onChange?.(sanitizedValue);
  }, [sanitizeText, sanitizationPreset, showSecurityIndicator, isContentSafe, onChange]);

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      <div className="relative">
        <input
          {...props}
          id={name}
          name={name}
          onChange={handleChange}
          className={`
            block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500
            ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
            ${className}
          `}
        />
        
        {showSecurityIndicator && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div
              className={`w-2 h-2 rounded-full ${
                securityStatus.safe ? 'bg-green-400' : 'bg-red-400'
              }`}
              title={
                securityStatus.safe 
                  ? 'Content appears safe' 
                  : `Security issues: ${securityStatus.threats.join(', ')}`
              }
            />
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      
      {showSecurityIndicator && !securityStatus.safe && (
        <p className="text-xs text-red-600">
          Security warning: {securityStatus.threats.join(', ')}
        </p>
      )}
    </div>
  );
};

// Secure form submit button with built-in loading and rate limiting
interface SecureSubmitButtonProps {
  children: React.ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  showRateLimit?: boolean;
  remainingAttempts?: number;
}

export const SecureSubmitButton: React.FC<SecureSubmitButtonProps> = ({
  children,
  isLoading = false,
  disabled = false,
  className = '',
  showRateLimit = false,
  remainingAttempts,
}) => {
  return (
    <div className="space-y-2">
      <LoadingButton
        type="submit"
        loading={isLoading}
        disabled={disabled}
        className={`w-full ${className}`}
      >
        {children}
      </LoadingButton>
      
      {showRateLimit && remainingAttempts !== undefined && remainingAttempts <= 3 && (
        <p className="text-xs text-amber-600 text-center">
          {remainingAttempts} attempts remaining
        </p>
      )}
    </div>
  );
};