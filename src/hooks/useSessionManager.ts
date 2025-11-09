import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface SessionConfig {
  // Session timeout in minutes (default: 30 minutes)
  sessionTimeout?: number;
  // Warning before timeout in minutes (default: 5 minutes)
  warningTime?: number;
  // Check interval in minutes (default: 1 minute)
  checkInterval?: number;
  // Auto logout when tab becomes visible after timeout
  autoLogoutOnVisible?: boolean;
  // Show session warnings
  showWarnings?: boolean;
}

export const useSessionManager = (config: SessionConfig = {}) => {
  const {
    sessionTimeout = 30,
    warningTime = 5,
    checkInterval = 1,
    autoLogoutOnVisible = true,
    showWarnings = true,
  } = config;

  const { isAuthenticated, logout } = useAuth();
  const lastActivityRef = useRef<number>(Date.now());
  const warningShownRef = useRef<boolean>(false);
  const timeoutIdRef = useRef<NodeJS.Timeout>();
  const intervalIdRef = useRef<NodeJS.Timeout>();

  // Update last activity time
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    warningShownRef.current = false;

    // SECURITY: Removed localStorage - activity tracked by HTTP-Only cookie expiration
    // Cookies handle cross-tab session automatically
  }, []);

  // Check if session has expired (based on local activity tracking)
  // Note: Actual session validity is managed by HTTP-Only cookies on backend
  const isSessionExpired = useCallback((): boolean => {
    const timeElapsed = Date.now() - lastActivityRef.current;
    const timeoutMs = sessionTimeout * 60 * 1000;

    return timeElapsed > timeoutMs;
  }, [sessionTimeout]);

  // Check if warning should be shown (based on local activity)
  const shouldShowWarning = useCallback((): boolean => {
    const timeElapsed = Date.now() - lastActivityRef.current;
    const warningMs = (sessionTimeout - warningTime) * 60 * 1000;

    return timeElapsed > warningMs && !warningShownRef.current;
  }, [sessionTimeout, warningTime]);

  // Show session warning
  const showSessionWarning = useCallback(() => {
    if (!showWarnings || warningShownRef.current) return;
    
    warningShownRef.current = true;
    
    toast.warning('Session expiring soon', {
      description: `Your session will expire in ${warningTime} minutes due to inactivity`,
      duration: 10000,
      action: {
        label: 'Stay logged in',
        onClick: () => updateActivity(),
      },
    });
  }, [showWarnings, warningTime, updateActivity]);

  // Handle session expiry
  const handleSessionExpiry = useCallback(async () => {
    toast.error('Session expired', {
      description: 'Your session has expired due to inactivity',
      duration: 5000,
    });
    
    await logout();
  }, [logout]);

  // Session check function
  const checkSession = useCallback(() => {
    if (!isAuthenticated) return;

    if (isSessionExpired()) {
      handleSessionExpiry();
    } else if (shouldShowWarning()) {
      showSessionWarning();
    }
  }, [isAuthenticated, isSessionExpired, shouldShowWarning, showSessionWarning, handleSessionExpiry]);

  // Setup activity listeners
  useEffect(() => {
    if (!isAuthenticated) return;

    const activityEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    const handleActivity = () => updateActivity();

    // Add event listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Initial activity update
    updateActivity();

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [isAuthenticated, updateActivity]);

  // Setup session monitoring
  useEffect(() => {
    if (!isAuthenticated) {
      // Clear any existing timers
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
      return;
    }

    // Check session periodically
    intervalIdRef.current = setInterval(() => {
      checkSession();
    }, checkInterval * 60 * 1000);

    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
    };
  }, [isAuthenticated, checkSession, checkInterval]);

  // Handle page visibility changes
  useEffect(() => {
    if (!isAuthenticated || !autoLogoutOnVisible) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Page became visible, check if session expired
        if (isSessionExpired()) {
          handleSessionExpiry();
        } else {
          // Update activity if still within session
          updateActivity();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, autoLogoutOnVisible, isSessionExpired, handleSessionExpiry, updateActivity]);

  // Handle storage changes (cross-tab synchronization)
  // SECURITY: Removed localStorage sync - HTTP-Only cookies handle cross-tab sessions automatically
  // When one tab logs out, cookies are cleared and all tabs become unauthenticated
  useEffect(() => {
    // No-op: Cross-tab session handled by shared HTTP-Only cookies
  }, [isAuthenticated]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
    };
  }, []);

  return {
    updateActivity,
    isSessionExpired: isSessionExpired(),
    getTimeRemaining: () => {
      const timeElapsed = Date.now() - lastActivityRef.current;
      const timeoutMs = sessionTimeout * 60 * 1000;
      return Math.max(0, timeoutMs - timeElapsed);
    },
    extendSession: updateActivity,
  };
};