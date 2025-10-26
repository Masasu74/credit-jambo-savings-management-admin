import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAppContext } from '../context/AppContext';

/**
 * Custom hook for optimized activity data loading
 * Implements lazy loading, pagination, and caching strategies
 */
export const useActivityData = (options = {}) => {
  const { api, user } = useAppContext();
  const {
    autoLoad = false,
    pageSize = 50,
    initialFilters = {},
    enableSummary = true
  } = options;

  // State management
  const [activities, setActivities] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalActivities: 0,
    hasNextPage: false,
    hasPrevPage: false,
    itemsPerPage: pageSize
  });

  // Filters state
  const [filters, setFilters] = useState(initialFilters);

  // Cache for loaded pages - use ref to avoid re-renders
  const pageCacheRef = useRef(new Map());

  /**
   * Load activity summary (lightweight data)
   */
  const loadSummary = useCallback(async (summaryFilters = {}) => {
    if (!enableSummary) return;

    try {
      setSummaryLoading(true);
      setError(null);

      const params = new URLSearchParams();
      Object.entries(summaryFilters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const { data } = await api.get(`/activity/summary?${params}`);
      
      if (data.success) {
        setSummary(data.data);
      } else {
        throw new Error(data.message || 'Failed to load activity summary');
      }
    } catch (err) {
      console.error('Activity summary error:', err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setSummaryLoading(false);
    }
  }, [api, enableSummary]);

  /**
   * Load activities with pagination
   */
  const loadActivities = useCallback(async (page = 1, customFilters = {}) => {
    try {
      setLoading(true);
      setError(null);

      // Debug logging
      console.log('🔄 Loading activities:', { page, customFilters });

      // Check cache first
      const cacheKey = `${page}-${JSON.stringify(customFilters)}`;
      if (pageCacheRef.current.has(cacheKey)) {
        const cached = pageCacheRef.current.get(cacheKey);
        console.log('📦 Using cached data:', cached.activities.length, 'activities');
        setActivities(cached.activities);
        setPagination(cached.pagination);
        return;
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        ...customFilters
      });

      console.log('🌐 Making API request to:', `/activity/list?${params}`);
      const { data } = await api.get(`/activity/list?${params}`);
      
      console.log('📡 API response:', data);
      
      if (data.success) {
        console.log('✅ Activities loaded successfully:', data.data.length, 'activities');
        setActivities(data.data);
        setPagination(data.pagination);

        // Cache the result
        pageCacheRef.current.set(cacheKey, {
          activities: data.data,
          pagination: data.pagination,
          timestamp: Date.now()
        });

        // Clean old cache entries (older than 5 minutes)
        setTimeout(() => {
          const now = Date.now();
          const newCache = new Map();
          for (const [key, value] of pageCacheRef.current.entries()) {
            if (now - value.timestamp < 5 * 60 * 1000) {
              newCache.set(key, value);
            }
          }
          pageCacheRef.current = newCache;
        }, 100);
      } else {
        throw new Error(data.message || 'Failed to load activities');
      }
    } catch (err) {
      console.error('❌ Activity loading error:', err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [api, pageSize]);

  /**
   * Load next page
   */
  const loadNextPage = useCallback(() => {
    if (pagination.hasNextPage) {
      loadActivities(pagination.currentPage + 1, filters);
    }
  }, [pagination.hasNextPage, pagination.currentPage, filters, loadActivities]);

  /**
   * Load previous page
   */
  const loadPrevPage = useCallback(() => {
    if (pagination.hasPrevPage) {
      loadActivities(pagination.currentPage - 1, filters);
    }
  }, [pagination.hasPrevPage, pagination.currentPage, filters, loadActivities]);

  /**
   * Apply filters and reload
   */
  const applyFilters = useCallback((newFilters) => {
    setFilters(newFilters);
    pageCacheRef.current.clear(); // Clear cache when filters change
    loadActivities(1, newFilters);
  }, [loadActivities]);

  /**
   * Refresh data
   */
  const refresh = useCallback(() => {
    pageCacheRef.current.clear(); // Clear cache
    loadActivities(pagination.currentPage, filters);
    if (enableSummary) {
      loadSummary(filters);
    }
  }, [loadActivities, loadSummary, pagination.currentPage, filters, enableSummary]);

  /**
   * Load initial data
   */
  const loadInitialData = useCallback(async () => {
    if (enableSummary) {
      await loadSummary(filters);
    }
    await loadActivities(1, filters);
  }, [loadSummary, loadActivities, filters, enableSummary]);

  // Auto-load on mount if enabled
  useEffect(() => {
    if (autoLoad && user) {
      loadInitialData();
    }
  }, [autoLoad, user, loadInitialData]);

  // Memoized computed values
  const hasData = useMemo(() => activities.length > 0, [activities]);
  const isEmpty = useMemo(() => !loading && activities.length === 0, [loading, activities]);
  const isLoading = useMemo(() => loading || summaryLoading, [loading, summaryLoading]);

  return {
    // Data
    activities,
    summary,
    
    // Loading states
    loading,
    summaryLoading,
    isLoading,
    
    // Error handling
    error,
    
    // Pagination
    pagination,
    hasData,
    isEmpty,
    
    // Actions
    loadActivities,
    loadSummary,
    loadNextPage,
    loadPrevPage,
    applyFilters,
    refresh,
    loadInitialData,
    
    // Filters
    filters,
    setFilters
  };
};
