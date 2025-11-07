import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
    
    // Show toast notification
    toast.error('An unexpected error occurred', {
      description: error.message,
      duration: 5000,
    });

    // Log to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      // Send to error tracking service (Sentry, LogRocket, etc.)
      // reportError(error, errorInfo);
    }
  }

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReportError = () => {
    const { error, errorInfo } = this.state;
    const errorReport = {
      error: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
    
    // Copy error report to clipboard
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
      .then(() => {
        toast.success('Error report copied to clipboard');
      })
      .catch(() => {
        toast.error('Failed to copy error report');
      });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-16 w-16 text-red-500" />
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">
                Something went wrong
              </h2>
              <p className="mt-2 text-gray-600">
                We encountered an unexpected error. Our team has been notified.
              </p>
            </div>

            <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="space-y-4">
                <Button 
                  onClick={this.handleRetry}
                  className="w-full flex items-center justify-center"
                  variant="default"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>

                <Button 
                  onClick={this.handleRefresh}
                  className="w-full flex items-center justify-center"
                  variant="outline"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reload Page
                </Button>

                <Button 
                  onClick={this.handleGoHome}
                  className="w-full flex items-center justify-center"
                  variant="ghost"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Button>

                <Button 
                  onClick={this.handleReportError}
                  className="w-full flex items-center justify-center"
                  variant="outline"
                  size="sm"
                >
                  <Bug className="mr-2 h-4 w-4" />
                  Copy Error Report
                </Button>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-6">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700">
                    Error Details (Development Only)
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-800 overflow-auto">
                    <div className="font-bold text-red-600 mb-2">
                      {this.state.error.toString()}
                    </div>
                    {this.state.errorInfo && (
                      <div className="whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Error ID: {Date.now().toString(36)} • 
                <a 
                  href="mailto:support@daritana.com" 
                  className="text-blue-600 hover:text-blue-500 ml-1"
                >
                  Contact Support
                </a>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for error reporting
export const useErrorReporting = () => {
  const reportError = React.useCallback((error: Error, context?: string) => {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
    
    console.error('Error reported:', errorReport);
    
    // Show toast notification
    toast.error('An error occurred', {
      description: context ? `${context}: ${error.message}` : error.message,
    });
    
    if (process.env.NODE_ENV === 'production') {
      // Send to error tracking service
      // reportError(error, errorInfo);
    }
  }, []);
  
  return { reportError };
};

// Higher-order component for wrapping components with error boundary
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export default ErrorBoundary;