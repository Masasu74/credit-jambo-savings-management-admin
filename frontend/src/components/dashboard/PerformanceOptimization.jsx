import React, { useState, useEffect, useMemo, useCallback, memo, lazy, Suspense, useRef } from 'react';
import { FaSpinner, FaMemory, FaClock, FaNetworkWired, FaDatabase } from 'react-icons/fa';

// Lazy load heavy components
const LazyChart = lazy(() => import('./EnhancedCharts'));
const LazyPerformanceMetrics = lazy(() => import('./PerformanceMetrics'));

// Memoized components for better performance
const MemoizedDashCard = memo(({ title, value, icon, description }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
        {icon}
      </div>
    </div>
    <div className="mb-2">
      <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
        {value}
      </h4>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {title}
      </p>
    </div>
    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
      {description}
    </p>
  </div>
));

// Performance monitoring hook
const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    memoryUsage: 0,
    networkRequests: 0,
    cacheHitRate: 0
  });

  useEffect(() => {
    const startTime = performance.now();
    
    // Monitor render performance
    const measureRender = () => {
      const endTime = performance.now();
      setMetrics(prev => ({
        ...prev,
        renderTime: endTime - startTime
      }));
    };

    // Monitor memory usage (if available)
    const measureMemory = () => {
      if (performance.memory) {
        setMetrics(prev => ({
          ...prev,
          memoryUsage: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)
        }));
      }
    };

    // Monitor network requests
    const originalFetch = window.fetch;
    let requestCount = 0;
    
    window.fetch = (...args) => {
      requestCount++;
      setMetrics(prev => ({
        ...prev,
        networkRequests: requestCount
      }));
      return originalFetch(...args);
    };

    // Measure after component mount
    const timer = setTimeout(() => {
      measureRender();
      measureMemory();
    }, 100);

    return () => {
      clearTimeout(timer);
      window.fetch = originalFetch;
    };
  }, []);

  return metrics;
};

// Data caching hook
const useDataCache = (key, fetcher, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(0);

  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  const fetchData = useCallback(async () => {
    const now = Date.now();
    
    // Check if we have cached data that's still fresh
    if (data && (now - lastFetch) < CACHE_DURATION) {
      return data;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      setData(result);
      setLastFetch(now);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [data, lastFetch, fetcher]);

  useEffect(() => {
    fetchData();
  }, dependencies);

  return { data, loading, error, refetch: fetchData };
};

// Virtual scrolling hook for large lists
const useVirtualScroll = (items, itemHeight, containerHeight) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );

    return items.slice(startIndex, endIndex).map((item, index) => ({
      ...item,
      index: startIndex + index
    }));
  }, [items, itemHeight, containerHeight, scrollTop]);

  const totalHeight = items.length * itemHeight;
  const offsetY = Math.floor(scrollTop / itemHeight) * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop
  };
};

// Debounced search hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Performance optimization component
const PerformanceOptimization = ({ children }) => {
  const metrics = usePerformanceMonitor();
  const [showMetrics, setShowMetrics] = useState(false);

  // Memoize expensive calculations
  const expensiveCalculation = useMemo(() => {
    // Simulate expensive calculation
    let result = 0;
    for (let i = 0; i < 1000000; i++) {
      result += Math.random();
    }
    return result;
  }, []);

  // Optimize re-renders with useCallback
  const handleOptimizedAction = useCallback((action) => {
    // Perform action with minimal re-renders
    console.log('Optimized action:', action);
  }, []);

  return (
    <div className="relative">
      {children}
      
      {/* Performance Metrics Toggle */}
      <button
        onClick={() => setShowMetrics(!showMetrics)}
        className="fixed bottom-6 left-6 p-3 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700 transition-colors z-40"
        title="Performance Metrics"
      >
        <FaMemory size={16} />
      </button>

      {/* Performance Metrics Panel */}
      {showMetrics && (
        <div className="fixed bottom-20 left-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-40 min-w-[250px]">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Performance Metrics
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <FaClock className="text-blue-500" size={12} />
                <span className="text-gray-600 dark:text-gray-400">Render Time</span>
              </div>
              <span className="font-mono text-gray-900 dark:text-white">
                {metrics.renderTime.toFixed(2)}ms
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <FaMemory className="text-green-500" size={12} />
                <span className="text-gray-600 dark:text-gray-400">Memory Usage</span>
              </div>
              <span className="font-mono text-gray-900 dark:text-white">
                {metrics.memoryUsage}MB
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <FaNetworkWired className="text-orange-500" size={12} />
                <span className="text-gray-600 dark:text-gray-400">Network Requests</span>
              </div>
              <span className="font-mono text-gray-900 dark:text-white">
                {metrics.networkRequests}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <FaDatabase className="text-purple-500" size={12} />
                <span className="text-gray-600 dark:text-gray-400">Cache Hit Rate</span>
              </div>
              <span className="font-mono text-gray-900 dark:text-white">
                {metrics.cacheHitRate}%
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Lazy loading wrapper
const LazyWrapper = ({ children, fallback = <div className="flex items-center justify-center p-8"><FaSpinner className="animate-spin" /></div> }) => (
  <Suspense fallback={fallback}>
    {children}
  </Suspense>
);

// Intersection Observer hook for lazy loading
const useIntersectionObserver = (ref, options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [ref, options]);

  return isIntersecting;
};

// Image lazy loading component
const LazyImage = ({ src, alt, className, ...props }) => {
  const imgRef = useRef();
  const isVisible = useIntersectionObserver(imgRef, { threshold: 0.1 });
  const [loaded, setLoaded] = useState(false);

  return (
    <div ref={imgRef} className={className}>
      {isVisible && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          className={`transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          {...props}
        />
      )}
    </div>
  );
};

export {
  PerformanceOptimization,
  usePerformanceMonitor,
  useDataCache,
  useVirtualScroll,
  useDebounce,
  LazyWrapper,
  useIntersectionObserver,
  LazyImage,
  MemoizedDashCard,
  LazyChart,
  LazyPerformanceMetrics
};
