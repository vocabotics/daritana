import React, { Suspense } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoadingState, PageLoading } from '@/components/ui/loading';
import { useAsyncState } from '@/hooks/useErrorHandler';

interface PageWrapperProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  requiresAuth?: boolean;
  requiredPermissions?: string[];
}

export const PageWrapper: React.FC<PageWrapperProps> = ({
  children,
  title,
  description,
  className,
  fallback,
  onError,
  requiresAuth = false,
  requiredPermissions = [],
}) => {
  return (
    <ErrorBoundary 
      fallback={fallback} 
      onError={onError}
    >
      <Suspense 
        fallback={
          <PageLoading 
            title={title ? `Loading ${title}...` : "Loading..."}
            description={description || "Please wait while we load your content"}
            className={className}
          />
        }
      >
        <div className={className}>
          {children}
        </div>
      </Suspense>
    </ErrorBoundary>
  );
};

// Hook for page-level async operations
export const usePageData = <T>(
  loadData: () => Promise<T>,
  dependencies: any[] = [],
  options?: {
    retryCount?: number;
    retryDelay?: number;
    loadingMessage?: string;
    errorMessage?: string;
  }
) => {
  const asyncState = useAsyncState<T>();

  React.useEffect(() => {
    asyncState.execute(
      async () => {
        // Add retry logic
        const { retryCount = 3, retryDelay = 1000 } = options || {};
        let lastError: Error;

        for (let attempt = 1; attempt <= retryCount; attempt++) {
          try {
            return await loadData();
          } catch (error) {
            lastError = error as Error;
            
            if (attempt === retryCount) {
              throw lastError;
            }
            
            await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
          }
        }
        
        throw lastError!;
      },
      options?.loadingMessage || 'Loading page data'
    );
  }, dependencies);

  return {
    ...asyncState,
    retry: () => asyncState.execute(loadData, options?.loadingMessage || 'Retrying...'),
  };
};

// Higher-order component for page-level error handling
export const withPageWrapper = <P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<PageWrapperProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <PageWrapper {...options}>
      <Component {...props} />
    </PageWrapper>
  );
  
  WrappedComponent.displayName = `withPageWrapper(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};