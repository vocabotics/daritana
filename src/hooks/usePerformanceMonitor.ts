import { useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage?: number;
  bundleSize?: number;
  apiResponseTime: number;
  errorRate: number;
  lastUpdated: Date;
}

interface ComponentPerformance {
  componentName: string;
  renderCount: number;
  averageRenderTime: number;
  maxRenderTime: number;
  minRenderTime: number;
  lastRender: Date;
  memoryLeaks: boolean;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private componentMetrics: Map<string, ComponentPerformance> = new Map();
  private observers: Map<string, PerformanceObserver> = new Map();
  private isEnabled: boolean = import.meta.env.DEV;

  private constructor() {
    if (this.isEnabled) {
      this.initializeObservers();
    }
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private initializeObservers() {
    // Long Task Observer
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.duration > 50) { // Tasks longer than 50ms
            console.warn(`Long task detected: ${entry.duration}ms`, entry);
            if (entry.duration > 100) {
              toast.warning(`Performance issue detected`, {
                description: `Long task: ${Math.round(entry.duration)}ms`,
                duration: 3000,
              });
            }
          }
        });
      });

      try {
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.set('longtask', longTaskObserver);
      } catch (e) {
        console.warn('Long task observer not supported');
      }

      // Layout Shift Observer
      const layoutShiftObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        let totalShift = 0;
        
        entries.forEach((entry: any) => {
          totalShift += entry.value;
        });

        if (totalShift > 0.25) { // CLS threshold
          console.warn(`High layout shift detected: ${totalShift}`);
          toast.warning('Layout instability detected', {
            description: `CLS: ${totalShift.toFixed(3)}`,
            duration: 2000,
          });
        }
      });

      try {
        layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('layout-shift', layoutShiftObserver);
      } catch (e) {
        console.warn('Layout shift observer not supported');
      }

      // Largest Contentful Paint Observer
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        if (lastEntry.startTime > 4000) { // LCP threshold
          console.warn(`Slow LCP detected: ${lastEntry.startTime}ms`);
        }
      });

      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('lcp', lcpObserver);
      } catch (e) {
        console.warn('LCP observer not supported');
      }
    }

    // Memory monitoring
    this.startMemoryMonitoring();
  }

  private startMemoryMonitoring() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        const usedMemory = memory.usedJSHeapSize / 1048576; // MB
        const totalMemory = memory.totalJSHeapSize / 1048576; // MB
        
        if (usedMemory > 100) { // More than 100MB
          console.warn(`High memory usage: ${usedMemory.toFixed(2)}MB`);
          
          if (usedMemory > 200) { // Critical threshold
            toast.error('High memory usage detected', {
              description: `${usedMemory.toFixed(2)}MB used`,
              duration: 5000,
            });
          }
        }
        
        // Store metrics
        this.updateMetrics('memory', {
          renderTime: 0,
          memoryUsage: usedMemory,
          apiResponseTime: 0,
          errorRate: 0,
          lastUpdated: new Date(),
        });
      }, 30000); // Check every 30 seconds
    }
  }

  measureComponentRender<T extends React.ComponentType<any>>(
    WrappedComponent: T,
    displayName?: string
  ): T {
    if (!this.isEnabled) return WrappedComponent;

    const componentName = displayName || WrappedComponent.displayName || WrappedComponent.name || 'Unknown';
    
    const MeasuredComponent = React.memo((props: any) => {
      const renderStartTime = useRef<number>(0);
      const renderCount = useRef<number>(0);

      useEffect(() => {
        const startTime = performance.now();
        renderStartTime.current = startTime;
        renderCount.current += 1;

        return () => {
          const endTime = performance.now();
          const renderTime = endTime - renderStartTime.current;
          
          this.recordComponentPerformance(componentName, renderTime);
        };
      });

      return React.createElement(WrappedComponent, props);
    });

    MeasuredComponent.displayName = `Measured(${componentName})`;
    return MeasuredComponent as T;
  }

  private recordComponentPerformance(componentName: string, renderTime: number) {
    const existing = this.componentMetrics.get(componentName);
    
    if (existing) {
      existing.renderCount += 1;
      existing.averageRenderTime = (existing.averageRenderTime * (existing.renderCount - 1) + renderTime) / existing.renderCount;
      existing.maxRenderTime = Math.max(existing.maxRenderTime, renderTime);
      existing.minRenderTime = Math.min(existing.minRenderTime, renderTime);
      existing.lastRender = new Date();
    } else {
      this.componentMetrics.set(componentName, {
        componentName,
        renderCount: 1,
        averageRenderTime: renderTime,
        maxRenderTime: renderTime,
        minRenderTime: renderTime,
        lastRender: new Date(),
        memoryLeaks: false,
      });
    }

    // Warn about slow renders
    if (renderTime > 16.67) { // Slower than 60fps
      console.warn(`Slow render in ${componentName}: ${renderTime.toFixed(2)}ms`);
    }
  }

  measureApiCall = async <T>(
    apiCall: () => Promise<T>,
    endpoint: string
  ): Promise<T> => {
    if (!this.isEnabled) return apiCall();

    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      this.updateMetrics(`api-${endpoint}`, {
        renderTime: 0,
        apiResponseTime: responseTime,
        errorRate: 0,
        lastUpdated: new Date(),
      });

      if (responseTime > 2000) { // Slower than 2 seconds
        toast.warning('Slow API response', {
          description: `${endpoint}: ${Math.round(responseTime)}ms`,
          duration: 3000,
        });
      }

      return result;
    } catch (error) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      this.updateMetrics(`api-${endpoint}`, {
        renderTime: 0,
        apiResponseTime: responseTime,
        errorRate: 1,
        lastUpdated: new Date(),
      });

      throw error;
    }
  };

  private updateMetrics(key: string, metrics: PerformanceMetrics) {
    this.metrics.set(key, metrics);
  }

  getMetrics(): Map<string, PerformanceMetrics> {
    return new Map(this.metrics);
  }

  getComponentMetrics(): Map<string, ComponentPerformance> {
    return new Map(this.componentMetrics);
  }

  getSummary() {
    const components = Array.from(this.componentMetrics.values());
    const apis = Array.from(this.metrics.entries()).filter(([key]) => key.startsWith('api-'));
    
    const slowComponents = components.filter(c => c.averageRenderTime > 16.67);
    const slowApis = apis.filter(([, metrics]) => metrics.apiResponseTime > 1000);
    
    const memoryMetrics = this.metrics.get('memory');
    
    return {
      totalComponents: components.length,
      slowComponents: slowComponents.length,
      totalApis: apis.length,
      slowApis: slowApis.length,
      averageRenderTime: components.reduce((sum, c) => sum + c.averageRenderTime, 0) / components.length || 0,
      averageApiTime: apis.reduce((sum, [, m]) => sum + m.apiResponseTime, 0) / apis.length || 0,
      memoryUsage: memoryMetrics?.memoryUsage || 0,
      recommendations: this.generateRecommendations(),
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const components = Array.from(this.componentMetrics.values());
    const apis = Array.from(this.metrics.entries()).filter(([key]) => key.startsWith('api-'));
    
    const slowComponents = components.filter(c => c.averageRenderTime > 16.67);
    if (slowComponents.length > 0) {
      recommendations.push(`Optimize ${slowComponents.length} slow-rendering components`);
    }

    const slowApis = apis.filter(([, metrics]) => metrics.apiResponseTime > 1000);
    if (slowApis.length > 0) {
      recommendations.push(`Optimize ${slowApis.length} slow API endpoints`);
    }

    const memoryMetrics = this.metrics.get('memory');
    if (memoryMetrics && memoryMetrics.memoryUsage && memoryMetrics.memoryUsage > 100) {
      recommendations.push('Consider memory optimization - usage is high');
    }

    const frequentComponents = components.filter(c => c.renderCount > 100);
    if (frequentComponents.length > 0) {
      recommendations.push(`Check ${frequentComponents.length} frequently re-rendering components for optimization`);
    }

    return recommendations;
  }

  clearMetrics() {
    this.metrics.clear();
    this.componentMetrics.clear();
  }

  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.metrics.clear();
    this.componentMetrics.clear();
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();

// React hook for performance monitoring
export const usePerformanceMonitor = (componentName?: string) => {
  const renderStartTime = useRef<number>(0);

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const startTime = performance.now();
    renderStartTime.current = startTime;

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - renderStartTime.current;
      
      if (componentName) {
        performanceMonitor['recordComponentPerformance'](componentName, renderTime);
      }
    };
  });

  const measureApiCall = useCallback(
    <T>(apiCall: () => Promise<T>, endpoint: string): Promise<T> => {
      return performanceMonitor.measureApiCall(apiCall, endpoint);
    },
    []
  );

  return {
    measureApiCall,
    getMetrics: performanceMonitor.getMetrics.bind(performanceMonitor),
    getSummary: performanceMonitor.getSummary.bind(performanceMonitor),
  };
};

// HOC for measuring component performance
export const withPerformanceMonitoring = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  displayName?: string
) => {
  return performanceMonitor.measureComponentRender(WrappedComponent, displayName);
};

// Hook for detecting memory leaks
export const useMemoryLeakDetection = (componentName: string) => {
  const mountTime = useRef<number>(Date.now());
  const initialMemory = useRef<number>(0);

  useEffect(() => {
    if ('memory' in performance) {
      initialMemory.current = (performance as any).memory.usedJSHeapSize;
    }

    return () => {
      if ('memory' in performance) {
        const finalMemory = (performance as any).memory.usedJSHeapSize;
        const memoryDiff = (finalMemory - initialMemory.current) / 1048576; // MB
        const timeAlive = Date.now() - mountTime.current;
        
        // If component consumed significant memory during its lifetime
        if (memoryDiff > 1 && timeAlive > 10000) { // 1MB over 10 seconds
          console.warn(`Potential memory leak in ${componentName}: +${memoryDiff.toFixed(2)}MB`);
        }
      }
    };
  }, [componentName]);
};

// Development utilities
if (import.meta.env.DEV) {
  (window as any).performanceMonitor = {
    getMetrics: () => performanceMonitor.getMetrics(),
    getComponentMetrics: () => performanceMonitor.getComponentMetrics(),
    getSummary: () => performanceMonitor.getSummary(),
    clearMetrics: () => performanceMonitor.clearMetrics(),
  };
}