import { useState, useCallback } from 'react';
import { toast } from '@/utils/toast';

interface OptimisticUpdateOptions<T> {
  mutationFn: () => Promise<T>;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
}

/**
 * Hook for optimistic updates - immediately updates UI, then syncs with server
 * 
 * @example
 * const { execute, isLoading } = useOptimisticUpdate({
 *   mutationFn: () => projectService.update(id, data),
 *   onSuccess: (updated) => setProject(updated),
 *   successMessage: 'Project updated'
 * });
 * 
 * // Update UI immediately
 * setProject({ ...project, name: newName });
 * // Sync with server
 * execute();
 */
export function useOptimisticUpdate<T>({
  mutationFn,
  onSuccess,
  onError,
  successMessage,
  errorMessage,
}: OptimisticUpdateOptions<T>) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await mutationFn();
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      if (successMessage) {
        toast.success(successMessage);
      }
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred');
      setError(error);
      
      if (onError) {
        onError(error);
      }
      
      if (errorMessage) {
        toast.error(errorMessage);
      } else {
        toast.error('Operation failed', {
          description: error.message,
        });
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [mutationFn, onSuccess, onError, successMessage, errorMessage]);

  return {
    execute,
    isLoading,
    error,
  };
}

/**
 * Hook for optimistic list updates (add/remove/update items)
 */
export function useOptimisticList<T extends { id: string | number }>(
  initialItems: T[]
) {
  const [items, setItems] = useState<T[]>(initialItems);
  const [pendingChanges, setPendingChanges] = useState<Set<string | number>>(new Set());

  const addOptimistic = useCallback((item: T, mutationFn: () => Promise<T>) => {
    // Add immediately
    setItems(prev => [...prev, item]);
    setPendingChanges(prev => new Set(prev).add(item.id));

    // Sync with server
    mutationFn()
      .then(serverItem => {
        setItems(prev => prev.map(i => i.id === item.id ? serverItem : i));
      })
      .catch(() => {
        // Revert on error
        setItems(prev => prev.filter(i => i.id !== item.id));
        toast.error('Failed to add item');
      })
      .finally(() => {
        setPendingChanges(prev => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
      });
  }, []);

  const updateOptimistic = useCallback((id: string | number, updates: Partial<T>, mutationFn: () => Promise<T>) => {
    // Update immediately
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
    setPendingChanges(prev => new Set(prev).add(id));

    // Sync with server
    mutationFn()
      .then(serverItem => {
        setItems(prev => prev.map(i => i.id === id ? serverItem : i));
      })
      .catch(() => {
        // Revert on error
        setItems(prev => prev.map(item =>
          item.id === id ? { ...item, ...updates } : item
        ));
        toast.error('Failed to update item');
      })
      .finally(() => {
        setPendingChanges(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      });
  }, []);

  const removeOptimistic = useCallback((id: string | number, mutationFn: () => Promise<void>) => {
    // Store item for potential revert
    const item = items.find(i => i.id === id);
    
    // Remove immediately
    setItems(prev => prev.filter(i => i.id !== id));
    setPendingChanges(prev => new Set(prev).add(id));

    // Sync with server
    mutationFn()
      .catch(() => {
        // Revert on error
        if (item) {
          setItems(prev => [...prev, item]);
        }
        toast.error('Failed to remove item');
      })
      .finally(() => {
        setPendingChanges(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      });
  }, [items]);

  const isPending = useCallback((id: string | number) => {
    return pendingChanges.has(id);
  }, [pendingChanges]);

  return {
    items,
    setItems,
    addOptimistic,
    updateOptimistic,
    removeOptimistic,
    isPending,
    hasPendingChanges: pendingChanges.size > 0,
  };
}
