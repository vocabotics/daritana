// Real-time Authority Submission Sync Hook
// Simulates periodic syncing with Malaysian building authorities

import { useEffect, useRef, useCallback, useState } from 'react';
import { authorityService } from '@/services/authorityService';
import type { BuildingSubmission } from '@/types/authority';

interface SyncConfig {
  interval?: number; // Sync interval in milliseconds (default: 30 seconds)
  enabled?: boolean; // Whether syncing is enabled
  onStatusChange?: (submission: BuildingSubmission, oldStatus: string) => void;
  onError?: (error: Error) => void;
}

interface SyncStatus {
  lastSync: Date | null;
  syncing: boolean;
  error: Error | null;
  pendingSubmissions: number;
}

export function useAuthoritySync(
  submissions: BuildingSubmission[],
  config: SyncConfig = {}
): [SyncStatus, () => Promise<void>] {
  const {
    interval = 30000, // 30 seconds default
    enabled = true,
    onStatusChange,
    onError
  } = config;

  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSync: null,
    syncing: false,
    error: null,
    pendingSubmissions: 0
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Get submissions that need syncing (not in final states)
  const getSubmissionsToSync = useCallback(() => {
    return submissions.filter(sub => 
      !['approved', 'rejected', 'expired', 'withdrawn'].includes(sub.status) &&
      sub.status !== 'draft'
    );
  }, [submissions]);

  // Simulate status progression for demo
  const simulateStatusProgression = (currentStatus: string): string => {
    const statusFlow: Record<string, string[]> = {
      'submitted': ['acknowledged', 'under_review'],
      'acknowledged': ['under_review', 'additional_info_required'],
      'under_review': ['site_inspection_scheduled', 'conditionally_approved', 'additional_info_required'],
      'additional_info_required': ['under_review'],
      'site_inspection_scheduled': ['site_inspection_completed'],
      'site_inspection_completed': ['conditionally_approved', 'approved', 'rejected'],
      'conditionally_approved': ['approved', 'rejected']
    };

    const possibleNextStatuses = statusFlow[currentStatus];
    if (!possibleNextStatuses || possibleNextStatuses.length === 0) {
      return currentStatus;
    }

    // 70% chance of progression, 30% chance of staying same
    if (Math.random() > 0.7) {
      return currentStatus;
    }

    // Random progression with weighted probabilities
    const weights = possibleNextStatuses.map((_, index) => {
      // Favor positive progression
      if (possibleNextStatuses[index].includes('approved') || 
          possibleNextStatuses[index].includes('completed')) {
        return 3;
      }
      if (possibleNextStatuses[index].includes('rejected')) {
        return 1;
      }
      return 2;
    });

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < possibleNextStatuses.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return possibleNextStatuses[i];
      }
    }

    return possibleNextStatuses[0];
  };

  // Perform sync for a single submission
  const syncSubmission = async (submission: BuildingSubmission): Promise<boolean> => {
    try {
      // In production, this would call the actual authority API
      // For now, simulate with mock progression
      const oldStatus = submission.status;
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
      
      // Simulate status change (only sometimes)
      const newStatus = simulateStatusProgression(oldStatus);
      
      if (newStatus !== oldStatus) {
        // In production, update via API
        // For demo, we'll trigger the callback
        if (onStatusChange) {
          onStatusChange(
            { ...submission, status: newStatus } as BuildingSubmission,
            oldStatus
          );
        }
        return true; // Status changed
      }
      
      return false; // No change
    } catch (error) {
      console.error(`Failed to sync submission ${submission.id}:`, error);
      throw error;
    }
  };

  // Main sync function
  const performSync = useCallback(async () => {
    if (!enabled || syncStatus.syncing) return;

    const submissionsToSync = getSubmissionsToSync();
    if (submissionsToSync.length === 0) return;

    setSyncStatus(prev => ({
      ...prev,
      syncing: true,
      error: null,
      pendingSubmissions: submissionsToSync.length
    }));

    try {
      // Sync submissions in parallel batches of 3
      const batchSize = 3;
      let changedCount = 0;
      
      for (let i = 0; i < submissionsToSync.length; i += batchSize) {
        const batch = submissionsToSync.slice(i, i + batchSize);
        const results = await Promise.all(
          batch.map(sub => syncSubmission(sub).catch(() => false))
        );
        changedCount += results.filter(Boolean).length;
      }

      if (isMountedRef.current) {
        setSyncStatus(prev => ({
          ...prev,
          lastSync: new Date(),
          syncing: false,
          pendingSubmissions: 0
        }));
      }

      // Log sync results
      console.log(`Authority sync completed: ${changedCount} status changes out of ${submissionsToSync.length} submissions`);
      
    } catch (error) {
      if (isMountedRef.current) {
        const err = error instanceof Error ? error : new Error('Sync failed');
        setSyncStatus(prev => ({
          ...prev,
          syncing: false,
          error: err
        }));
        
        if (onError) {
          onError(err);
        }
      }
    }
  }, [enabled, syncStatus.syncing, getSubmissionsToSync, onStatusChange, onError]);

  // Set up automatic syncing
  useEffect(() => {
    if (!enabled) return;

    // Initial sync after mount
    const initialTimer = setTimeout(() => {
      performSync();
    }, 2000);

    // Set up interval for periodic syncing
    intervalRef.current = setInterval(() => {
      performSync();
    }, interval);

    return () => {
      clearTimeout(initialTimer);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, interval, performSync]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Manual sync trigger
  const triggerSync = useCallback(async () => {
    await performSync();
  }, [performSync]);

  return [syncStatus, triggerSync];
}

// Hook for monitoring specific submission
export function useSubmissionMonitor(
  submissionId: string,
  options: {
    interval?: number;
    onUpdate?: (submission: BuildingSubmission) => void;
  } = {}
) {
  const { interval = 10000, onUpdate } = options;
  const [submission, setSubmission] = useState<BuildingSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let mounted = true;

    const fetchSubmission = async () => {
      try {
        setLoading(true);
        const result = await authorityService.getSubmission(submissionId);
        
        if (mounted && result.success && result.data) {
          setSubmission(result.data);
          setError(null);
          
          if (onUpdate) {
            onUpdate(result.data);
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch submission'));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Initial fetch
    fetchSubmission();

    // Set up polling
    intervalId = setInterval(fetchSubmission, interval);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [submissionId, interval, onUpdate]);

  return { submission, loading, error };
}

// Hook for batch status monitoring
export function useBatchStatusMonitor(
  submissionIds: string[],
  options: {
    interval?: number;
    onBatchUpdate?: (submissions: BuildingSubmission[]) => void;
  } = {}
) {
  const { interval = 15000, onBatchUpdate } = options;
  const [submissions, setSubmissions] = useState<BuildingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let mounted = true;

    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        
        // Fetch all submissions in parallel
        const promises = submissionIds.map(id => 
          authorityService.getSubmission(id)
        );
        
        const results = await Promise.all(promises);
        const validSubmissions = results
          .filter(r => r.success && r.data)
          .map(r => r.data!);
        
        if (mounted) {
          setSubmissions(validSubmissions);
          setError(null);
          
          if (onBatchUpdate) {
            onBatchUpdate(validSubmissions);
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch submissions'));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Initial fetch
    fetchSubmissions();

    // Set up polling
    intervalId = setInterval(fetchSubmissions, interval);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [submissionIds.join(','), interval, onBatchUpdate]);

  return { submissions, loading, error };
}