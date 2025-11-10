import { useState, useEffect } from 'react';

interface UseDataFetchOptions<T> {
  fetchFn: () => Promise<T>;
  dependencies?: any[];
  enabled?: boolean;
}

interface UseDataFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  isEmpty: boolean;
}

/**
 * Custom hook for data fetching with built-in loading, error, and empty states
 * @param options Configuration for data fetching
 * @returns Object with data, loading, error, refetch, and isEmpty
 */
export function useDataFetch<T>({
  fetchFn,
  dependencies = [],
  enabled = true,
}: UseDataFetchOptions<T>): UseDataFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
      console.error('Data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...dependencies]);

  const isEmpty = data === null || 
    (Array.isArray(data) && data.length === 0) ||
    (typeof data === 'object' && Object.keys(data).length === 0);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    isEmpty,
  };
}

/**
 * Hook for fetching list/array data with automatic empty detection
 */
export function useListFetch<T>({
  fetchFn,
  dependencies = [],
  enabled = true,
}: UseDataFetchOptions<T[]>): UseDataFetchResult<T[]> & { items: T[] } {
  const result = useDataFetch<T[]>({ fetchFn, dependencies, enabled });
  
  return {
    ...result,
    items: result.data || [],
    isEmpty: !result.data || result.data.length === 0,
  };
}
