import React, { memo, useMemo, useCallback, lazy, Suspense } from 'react';
import { debounce, throttle } from 'lodash-es';

// Virtual scrolling utilities
export interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
}

export const useVirtualList = <T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5,
}: Omit<VirtualListProps<T>, 'renderItem'>) => {
  const [scrollTop, setScrollTop] = React.useState(0);

  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight) + overscan,
      items.length
    );
    
    return {
      start: Math.max(0, start - overscan),
      end,
    };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      item,
      index: visibleRange.start + index,
    }));
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
  };
};

// Memoization utilities
export const createMemoizedComponent = <P extends object>(
  Component: React.ComponentType<P>,
  propsAreEqual?: (prevProps: P, nextProps: P) => boolean
) => {
  const MemoizedComponent = memo(Component, propsAreEqual);
  MemoizedComponent.displayName = `Memo(${Component.displayName || Component.name})`;
  return MemoizedComponent;
};

// Deep comparison for complex objects
export const deepEqual = (a: any, b: any): boolean => {
  if (a === b) return true;
  
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  
  if (typeof a === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    return keysA.every(key => deepEqual(a[key], b[key]));
  }
  
  return false;
};

// Shallow comparison for props
export const shallowEqual = (a: any, b: any): boolean => {
  if (a === b) return true;
  
  if (typeof a !== 'object' || typeof b !== 'object' || a == null || b == null) {
    return false;
  }
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  return keysA.every(key => a[key] === b[key]);
};

// Optimized event handlers
export const useOptimizedHandlers = () => {
  const createDebouncedHandler = useCallback(
    <T extends (...args: any[]) => any>(
      handler: T,
      delay: number = 300
    ): T => {
      return debounce(handler, delay) as T;
    },
    []
  );

  const createThrottledHandler = useCallback(
    <T extends (...args: any[]) => any>(
      handler: T,
      delay: number = 100
    ): T => {
      return throttle(handler, delay) as T;
    },
    []
  );

  return {
    createDebouncedHandler,
    createThrottledHandler,
  };
};

// Intersection Observer for lazy loading
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
) => {
  const [entry, setEntry] = React.useState<IntersectionObserverEntry | null>(null);
  const elementRef = React.useRef<HTMLElement | null>(null);
  const observerRef = React.useRef<IntersectionObserver | null>(null);

  React.useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => setEntry(entry),
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observerRef.current.observe(element);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [options]);

  return [elementRef, entry] as const;
};

// Lazy loading component
interface LazyComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  rootMargin?: string;
  threshold?: number;
}

export const LazyComponent: React.FC<LazyComponentProps> = ({
  children,
  fallback,
  className,
  rootMargin = '50px',
  threshold = 0.1,
}) => {
  const defaultFallback = React.createElement('div', null, 'Loading...');
  const [ref, entry] = useIntersectionObserver({
    rootMargin,
    threshold,
  });

  const isVisible = entry?.isIntersecting;

  return React.createElement(
    'div',
    { ref, className },
    isVisible ? children : (fallback || defaultFallback)
  );
};

// Image optimization utilities
export const useImageOptimization = () => {
  const createOptimizedImageUrl = useCallback((
    url: string,
    width?: number,
    height?: number,
    quality: number = 80
  ) => {
    // This would typically integrate with a service like Cloudinary or similar
    const params = new URLSearchParams();
    
    if (width) params.append('w', width.toString());
    if (height) params.append('h', height.toString());
    params.append('q', quality.toString());
    params.append('f', 'auto');
    
    const hasQuery = url.includes('?');
    return `${url}${hasQuery ? '&' : '?'}${params.toString()}`;
  }, []);

  return { createOptimizedImageUrl };
};

// Optimized Image component
interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  lazy?: boolean;
  fallback?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  quality = 80,
  lazy = true,
  fallback,
  className,
  ...props
}) => {
  const { createOptimizedImageUrl } = useImageOptimization();
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const [ref, entry] = useIntersectionObserver();

  const shouldLoad = !lazy || entry?.isIntersecting;
  const optimizedSrc = createOptimizedImageUrl(src, width, height, quality);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  if (hasError && fallback) {
    return React.createElement('img', {
      src: fallback,
      alt,
      className,
      ...props
    });
  }

  return React.createElement(
    'div',
    { ref, className: `relative ${className || ''}` },
    shouldLoad && React.createElement('img', {
      src: optimizedSrc,
      alt,
      onLoad: handleLoad,
      onError: handleError,
      className: `transition-opacity duration-300 ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      }`,
      ...props
    }),
    !isLoaded && shouldLoad && React.createElement('div', {
      className: 'absolute inset-0 bg-gray-200 animate-pulse'
    })
  );
};

// Bundle splitting utilities
export const createLazyComponent = <P extends object>(
  importFunc: () => Promise<{ default: React.ComponentType<P> }>,
  fallback?: React.ReactNode
) => {
  const LazyComponent = lazy(importFunc);
  const defaultFallback = React.createElement('div', null, 'Loading...');
  
  const WrappedComponent: React.FC<P> = (props) =>
    React.createElement(
      Suspense,
      { fallback: fallback || defaultFallback },
      React.createElement(LazyComponent, props)
    );
  
  WrappedComponent.displayName = 'LazyComponent';
  return WrappedComponent;
};

// Performance profiling utilities
export const useRenderProfiler = (componentName: string) => {
  React.useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      if (import.meta.env.DEV && renderTime > 16.67) {
        console.warn(
          `Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`
        );
      }
    };
  });
};

// Memory optimization utilities
export const useMemoryOptimizer = () => {
  const cleanupRefs = React.useRef<(() => void)[]>([]);

  const addCleanup = useCallback((cleanup: () => void) => {
    cleanupRefs.current.push(cleanup);
  }, []);

  const forceCleanup = useCallback(() => {
    cleanupRefs.current.forEach(cleanup => cleanup());
    cleanupRefs.current = [];
    
    // Force garbage collection if available (development only)
    if (import.meta.env.DEV && 'gc' in window) {
      (window as any).gc();
    }
  }, []);

  React.useEffect(() => {
    return () => {
      forceCleanup();
    };
  }, [forceCleanup]);

  return { addCleanup, forceCleanup };
};

// Batch updates utility
export const useBatchUpdates = <T>(
  initialState: T,
  batchDelay: number = 100
) => {
  const [state, setState] = React.useState<T>(initialState);
  const pendingUpdatesRef = React.useRef<Partial<T>[]>([]);
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  const batchUpdate = useCallback((update: Partial<T>) => {
    pendingUpdatesRef.current.push(update);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const updates = pendingUpdatesRef.current;
      pendingUpdatesRef.current = [];

      setState(prevState => 
        updates.reduce((acc, update) => ({ ...acc, ...update }), prevState)
      );
    }, batchDelay);
  }, [batchDelay]);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [state, batchUpdate] as const;
};

// HOC for performance monitoring
export const withPerformanceMonitoring = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) => {
  const displayName = componentName || WrappedComponent.displayName || WrappedComponent.name;
  
  const MonitoredComponent: React.FC<P> = (props) => {
    useRenderProfiler(displayName);
    return React.createElement(WrappedComponent, props);
  };

  MonitoredComponent.displayName = `Monitored(${displayName})`;
  return MonitoredComponent;
};

// React.memo with performance comparison
export const createPerformantMemo = <P extends object>(
  Component: React.ComponentType<P>,
  compare?: (prevProps: P, nextProps: P) => boolean
) => {
  return memo(Component, compare || shallowEqual);
};

// Utility for detecting unnecessary re-renders
export const useWhyDidYouUpdate = (name: string, props: Record<string, any>) => {
  const previous = React.useRef<Record<string, any>>();
  
  React.useEffect(() => {
    if (previous.current) {
      const allKeys = Object.keys({ ...previous.current, ...props });
      const changedProps: Record<string, { from: any; to: any }> = {};
      
      allKeys.forEach(key => {
        if (previous.current![key] !== props[key]) {
          changedProps[key] = {
            from: previous.current![key],
            to: props[key],
          };
        }
      });
      
      if (Object.keys(changedProps).length) {
        console.log('[why-did-you-update]', name, changedProps);
      }
    }
    
    previous.current = props;
  });
};

// Export common performance patterns
export const PerformancePatterns = {
  // Memoized callback that doesn't change reference
  useStableCallback: <T extends (...args: any[]) => any>(callback: T): T => {
    const callbackRef = React.useRef(callback);
    callbackRef.current = callback;
    
    return React.useCallback(((...args: any[]) => {
      return callbackRef.current(...args);
    }) as T, []);
  },

  // Memoized value with deep comparison
  useDeepMemo: <T>(factory: () => T, deps: React.DependencyList): T => {
    const ref = React.useRef<{ deps: React.DependencyList; value: T }>();
    
    if (!ref.current || !deepEqual(ref.current.deps, deps)) {
      ref.current = { deps, value: factory() };
    }
    
    return ref.current.value;
  },

  // Optimized list rendering
  useOptimizedList: <T>(
    items: T[],
    renderItem: (item: T, index: number) => React.ReactNode,
    keyExtractor: (item: T, index: number) => string | number
  ) => {
    return useMemo(() => 
      items.map((item, index) => (
        React.createElement(
          'div',
          { key: keyExtractor(item, index) },
          renderItem(item, index)
        )
      )), 
      [items, renderItem, keyExtractor]
    );
  },
};