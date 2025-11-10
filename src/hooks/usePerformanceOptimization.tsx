/**
 * Performance Optimization Hooks
 *
 * Collection of hooks to improve React performance:
 * - useDebounce: Debounce rapidly changing values
 * - useThrottle: Throttle function calls
 * - useMemoCompare: Memoize with custom comparison
 * - useIntersectionObserver: Lazy load components
 */

import { useEffect, useRef, useState, useCallback, DependencyList } from 'react';

/**
 * Debounce a value - useful for search inputs
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttle a function call - useful for scroll/resize handlers
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): T {
  const lastRun = useRef(Date.now());

  return useCallback(
    ((...args) => {
      const now = Date.now();
      if (now - lastRun.current >= delay) {
        lastRun.current = now;
        return callback(...args);
      }
    }) as T,
    [callback, delay]
  );
}

/**
 * Memoize with custom comparison function
 */
export function useMemoCompare<T>(
  factory: () => T,
  deps: DependencyList,
  compare: (prev: DependencyList, next: DependencyList) => boolean
): T {
  const ref = useRef<{ deps: DependencyList; value: T }>();

  if (!ref.current || !compare(ref.current.deps, deps)) {
    ref.current = {
      deps,
      value: factory(),
    };
  }

  return ref.current.value;
}

/**
 * Intersection Observer for lazy loading
 */
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [elementRef, options]);

  return isIntersecting;
}

/**
 * Lazy load component when it enters viewport
 */
export function useLazyLoad<T extends HTMLElement>(
  options: IntersectionObserverInit = {}
): [React.RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const isVisible = useIntersectionObserver(ref, {
    threshold: 0.1,
    ...options,
  });

  return [ref, isVisible];
}

/**
 * Track component render performance
 */
export function useRenderCount(componentName: string): void {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    if (import.meta.env.DEV && renderCount.current > 10) {
      console.warn(
        `${componentName} has rendered ${renderCount.current} times. Consider optimization.`
      );
    }
  });
}

export default {
  useDebounce,
  useThrottle,
  useMemoCompare,
  useIntersectionObserver,
  useLazyLoad,
  useRenderCount,
};
