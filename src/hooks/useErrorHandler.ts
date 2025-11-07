import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface ErrorState {
  error: Error | null;
  isError: boolean;
  errorMessage: string | null;
}

export interface AsyncState extends ErrorState {
  isLoading: boolean;
  data: any;
}

export const useErrorHandler = () => {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isError: false,
    errorMessage: null,
  });

  const handleError = useCallback((error: Error | string, context?: string) => {
    const errorObj = error instanceof Error ? error : new Error(error);
    const message = errorObj.message || 'An unexpected error occurred';
    
    setErrorState({
      error: errorObj,
      isError: true,
      errorMessage: message,
    });

    // Log to console for debugging
    console.error(`Error ${context ? `in ${context}` : ''}:`, errorObj);
    
    // Show toast notification
    toast.error(context ? `${context}: ${message}` : message);
  }, []);

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isError: false,
      errorMessage: null,
    });
  }, []);

  const handleAsyncOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T | null> => {
    try {
      clearError();
      const result = await operation();
      return result;
    } catch (error) {
      handleError(error as Error, context);
      return null;
    }
  }, [handleError, clearError]);

  return {
    ...errorState,
    handleError,
    clearError,
    handleAsyncOperation,
  };
};

export const useAsyncState = <T = any>(initialData?: T) => {
  const [state, setState] = useState<AsyncState>({
    isLoading: false,
    data: initialData || null,
    error: null,
    isError: false,
    errorMessage: null,
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const setData = useCallback((data: T) => {
    setState(prev => ({
      ...prev,
      data,
      isLoading: false,
      error: null,
      isError: false,
      errorMessage: null,
    }));
  }, []);

  const setError = useCallback((error: Error | string, context?: string) => {
    const errorObj = error instanceof Error ? error : new Error(error);
    const message = errorObj.message || 'An unexpected error occurred';
    
    setState(prev => ({
      ...prev,
      error: errorObj,
      isError: true,
      errorMessage: message,
      isLoading: false,
    }));

    console.error(`Error ${context ? `in ${context}` : ''}:`, errorObj);
    toast.error(context ? `${context}: ${message}` : message);
  }, []);

  const execute = useCallback(async <R = T>(
    operation: () => Promise<R>,
    context?: string
  ): Promise<R | null> => {
    try {
      setLoading(true);
      setState(prev => ({ ...prev, error: null, isError: false, errorMessage: null }));
      
      const result = await operation();
      setData(result as unknown as T);
      return result;
    } catch (error) {
      setError(error as Error, context);
      return null;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setData, setError]);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      data: initialData || null,
      error: null,
      isError: false,
      errorMessage: null,
    });
  }, [initialData]);

  return {
    ...state,
    setLoading,
    setData,
    setError,
    execute,
    reset,
  };
};