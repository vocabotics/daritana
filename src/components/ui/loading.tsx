import React from 'react';
import { Loader2, Building2, FileText, Users, BarChart3, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  return (
    <Loader2 
      className={cn(
        'animate-spin text-blue-600',
        sizeClasses[size],
        className
      )} 
    />
  );
};

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
  avatar?: boolean;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  className, 
  lines = 3, 
  avatar = false 
}) => {
  return (
    <div className={cn('animate-pulse', className)}>
      <div className="flex items-start space-x-4">
        {avatar && (
          <div className="rounded-full bg-gray-200 dark:bg-gray-700 h-10 w-10"></div>
        )}
        <div className="flex-1 space-y-2">
          {Array.from({ length: lines }, (_, i) => (
            <div
              key={i}
              className={cn(
                'h-4 bg-gray-200 dark:bg-gray-700 rounded',
                i === lines - 1 ? 'w-3/4' : 'w-full'
              )}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface PageLoadingProps {
  title?: string;
  description?: string;
}

export const PageLoading: React.FC<PageLoadingProps> = ({ 
  title = 'Loading...', 
  description = 'Please wait while we load your data' 
}) => {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="xl" className="mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-500">{description}</p>
      </div>
    </div>
  );
};

interface FullPageLoadingProps {
  message?: string;
  progress?: number;
}

export const FullPageLoading: React.FC<FullPageLoadingProps> = ({ 
  message = 'Loading Daritana...', 
  progress 
}) => {
  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <div className="text-3xl font-bold text-blue-600 mb-2">d</div>
          <p className="text-xl font-medium text-gray-700">Daritana</p>
          <p className="text-sm text-gray-500">Architecture Management</p>
        </div>
        
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-600 mb-4">{message}</p>
        
        {progress !== undefined && (
          <div className="w-64 bg-gray-200 rounded-full h-2 mx-auto">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

interface DataLoadingProps {
  type: 'projects' | 'tasks' | 'files' | 'analytics' | 'team';
  count?: number;
}

export const DataLoading: React.FC<DataLoadingProps> = ({ type, count = 3 }) => {
  const icons = {
    projects: Building2,
    tasks: FileText,
    files: FileText,
    analytics: BarChart3,
    team: Users,
  };

  const Icon = icons[type];

  return (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="border rounded-lg p-4 animate-pulse">
          <div className="flex items-start space-x-3">
            <div className="bg-gray-200 rounded p-2">
              <Icon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="flex space-x-2">
                <div className="h-2 bg-gray-200 rounded w-16"></div>
                <div className="h-2 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

interface LoadingButtonProps {
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({ 
  loading = false, 
  children, 
  className,
  onClick,
  disabled,
  variant = 'default'
}) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background";
  
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-300 bg-transparent hover:bg-gray-50",
    ghost: "hover:bg-gray-100",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        baseClasses,
        variants[variant],
        "h-10 py-2 px-4",
        className
      )}
    >
      {loading && <LoadingSpinner size="sm" className="mr-2" />}
      {children}
    </button>
  );
};

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  showPercentage?: boolean;
  color?: 'blue' | 'green' | 'yellow' | 'red';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  className,
  showPercentage = true,
  color = 'blue'
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-600',
    red: 'bg-red-600',
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="flex justify-between text-sm text-gray-600 mb-1">
        {showPercentage && (
          <span>{Math.round(percentage)}%</span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={cn(
            'h-2 rounded-full transition-all duration-300',
            colorClasses[color]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

interface LoadingStateProps {
  isLoading: boolean;
  error?: Error | string | null;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  onRetry?: () => void;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  isLoading,
  error,
  children,
  loadingComponent,
  errorComponent,
  onRetry,
  className,
}) => {
  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center p-4', className)}>
        {loadingComponent || (
          <div className="flex flex-col items-center gap-2">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        )}
      </div>
    );
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return (
      <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
        {errorComponent || (
          <>
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Something went wrong
            </h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md">
              {errorMessage || 'An unexpected error occurred. Please try again.'}
            </p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  return <>{children}</>;
};

export interface InlineLoadingProps {
  isLoading: boolean;
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
  isLoading,
  size = 'sm',
  text,
  className,
}) => {
  if (!isLoading) return null;

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <LoadingSpinner size={size} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
};

export default {
  LoadingSpinner,
  LoadingSkeleton,
  PageLoading,
  FullPageLoading,
  DataLoading,
  LoadingButton,
  ProgressBar,
  LoadingState,
  InlineLoading,
};