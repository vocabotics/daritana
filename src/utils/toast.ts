import { toast as sonnerToast } from 'sonner';

/**
 * Consistent toast notification utility
 * Provides standardized notifications across the application
 */

interface ToastOptions {
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const toast = {
  /**
   * Success notification
   */
  success: (message: string, options?: ToastOptions) => {
    sonnerToast.success(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      action: options?.action,
    });
  },

  /**
   * Error notification
   */
  error: (message: string, options?: ToastOptions) => {
    sonnerToast.error(message, {
      description: options?.description,
      duration: options?.duration || 5000,
      action: options?.action,
    });
  },

  /**
   * Warning notification
   */
  warning: (message: string, options?: ToastOptions) => {
    sonnerToast.warning(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      action: options?.action,
    });
  },

  /**
   * Info notification
   */
  info: (message: string, options?: ToastOptions) => {
    sonnerToast.info(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      action: options?.action,
    });
  },

  /**
   * Loading notification
   */
  loading: (message: string, options?: { description?: string }) => {
    return sonnerToast.loading(message, {
      description: options?.description,
    });
  },

  /**
   * Promise notification (shows loading, then success/error)
   */
  promise: <T,>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading,
      success,
      error,
    });
  },

  /**
   * Dismiss a specific toast
   */
  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  },
};

// Predefined notification templates for common actions

export const notifications = {
  // Project notifications
  project: {
    created: () => toast.success('Project created successfully'),
    updated: () => toast.success('Project updated successfully'),
    deleted: () => toast.success('Project deleted successfully'),
    error: (action: string) => toast.error(`Failed to ${action} project`, {
      description: 'Please try again or contact support if the issue persists.',
    }),
  },

  // Task notifications
  task: {
    created: () => toast.success('Task created successfully'),
    updated: () => toast.success('Task updated successfully'),
    deleted: () => toast.success('Task deleted successfully'),
    assigned: (assignee: string) => toast.success(`Task assigned to ${assignee}`),
    completed: () => toast.success('Task marked as complete', {
      description: 'Great job!',
    }),
    error: (action: string) => toast.error(`Failed to ${action} task`),
  },

  // Document notifications
  document: {
    uploaded: (count: number = 1) => toast.success(
      count === 1 ? 'Document uploaded successfully' : `${count} documents uploaded successfully`
    ),
    deleted: () => toast.success('Document deleted successfully'),
    shared: (recipient: string) => toast.success(`Document shared with ${recipient}`),
    downloading: () => toast.loading('Downloading document...'),
    error: (action: string) => toast.error(`Failed to ${action} document`),
  },

  // Team notifications
  team: {
    memberAdded: (name: string) => toast.success(`${name} added to team`),
    memberRemoved: (name: string) => toast.success(`${name} removed from team`),
    inviteSent: (email: string) => toast.success(`Invitation sent to ${email}`),
    roleUpdated: (name: string, role: string) => toast.success(`${name}'s role updated to ${role}`),
    error: (action: string) => toast.error(`Failed to ${action} team member`),
  },

  // Settings notifications
  settings: {
    saved: () => toast.success('Settings saved successfully'),
    reset: () => toast.info('Settings reset to defaults'),
    error: () => toast.error('Failed to save settings'),
  },

  // Authentication notifications
  auth: {
    loginSuccess: () => toast.success('Welcome back!'),
    logoutSuccess: () => toast.info('You have been logged out'),
    sessionExpired: () => toast.warning('Your session has expired', {
      description: 'Please log in again to continue.',
    }),
    passwordChanged: () => toast.success('Password changed successfully'),
    error: (message?: string) => toast.error(message || 'Authentication failed'),
  },

  // File operations
  file: {
    uploading: (filename: string) => toast.loading(`Uploading ${filename}...`),
    uploaded: (filename: string) => toast.success(`${filename} uploaded successfully`),
    downloadStarted: () => toast.info('Download started'),
    error: (action: string) => toast.error(`Failed to ${action} file`),
  },

  // Form validation
  form: {
    invalidFields: () => toast.error('Please fix the errors in the form'),
    requiredFields: () => toast.warning('Please fill in all required fields'),
    saved: () => toast.success('Form saved successfully'),
  },

  // Network notifications
  network: {
    offline: () => toast.warning('You are offline', {
      description: 'Some features may be unavailable.',
    }),
    online: () => toast.success('Connection restored'),
    slowConnection: () => toast.warning('Slow network detected', {
      description: 'Some operations may take longer than usual.',
    }),
  },

  // Generic notifications
  generic: {
    copied: () => toast.success('Copied to clipboard'),
    saved: () => toast.success('Saved successfully'),
    deleted: () => toast.success('Deleted successfully'),
    error: (message?: string) => toast.error(message || 'An error occurred'),
    comingSoon: () => toast.info('Coming soon!', {
      description: 'This feature is currently in development.',
    }),
  },
};

// Example usage:
/*
import { toast, notifications } from '@/utils/toast';

// Basic usage
toast.success('Operation completed');
toast.error('Something went wrong');

// With description
toast.success('Project created', {
  description: 'You can now add tasks and team members',
});

// With action
toast.success('Changes saved', {
  action: {
    label: 'Undo',
    onClick: () => console.log('Undo clicked'),
  },
});

// Promise-based (automatically shows loading, then success/error)
toast.promise(
  fetch('/api/projects').then(r => r.json()),
  {
    loading: 'Loading projects...',
    success: 'Projects loaded successfully',
    error: 'Failed to load projects',
  }
);

// Using predefined notifications
notifications.project.created();
notifications.task.assigned('John Doe');
notifications.document.uploaded(3);
notifications.auth.sessionExpired();
*/
