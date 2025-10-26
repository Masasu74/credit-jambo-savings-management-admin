import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

/**
 * Custom hook for pre-loading data before component renders
 * Shows "no data" view initially, then fetches data and displays it
 */
export const usePreloadData = (fetchFunction, options = {}) => {
  const {
    initialData = [],
    autoLoad = true,
    dependencies = [],
    delay = 0, // Optional delay before showing data
    onDataLoaded = null,
    onError = null
  } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [showNoData, setShowNoData] = useState(true);
  
  // Use ref to prevent multiple simultaneous loads
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);

  const loadData = useCallback(async (forceRefresh = false) => {
    // Prevent multiple simultaneous loads
    if (loadingRef.current && !forceRefresh) {
      return;
    }

    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);

      // Show no data view initially
      if (!hasLoaded) {
        setShowNoData(true);
      }

      // Add optional delay
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      // Check if component is still mounted
      if (!mountedRef.current) {
        return;
      }

      const result = await fetchFunction();
      
      // Check if component is still mounted before updating state
      if (!mountedRef.current) {
        return;
      }

      setData(result);
      setHasLoaded(true);
      setShowNoData(false);
      
      // Call callback if provided
      if (onDataLoaded) {
        onDataLoaded(result);
      }
    } catch (err) {
      if (!mountedRef.current) {
        return;
      }
      
      console.error('Preload data error:', err);
      setError(err);
      setShowNoData(false);
      
      // Call error callback if provided
      if (onError) {
        onError(err);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        loadingRef.current = false;
      }
    }
  }, [hasLoaded, delay, onDataLoaded, onError]); // Removed fetchFunction from dependencies

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      loadData();
    }
  }, [autoLoad, loadData]);

  // Reload when dependencies change
  useEffect(() => {
    if (autoLoad && dependencies.length > 0) {
      loadData(true);
    }
  }, dependencies);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(() => {
    loadData(true);
  }, [loadData]);

  const reset = useCallback(() => {
    setData(initialData);
    setHasLoaded(false);
    setShowNoData(true);
    setError(null);
    setLoading(false);
  }, [initialData]);

  return {
    data,
    loading,
    error,
    hasLoaded,
    showNoData,
    refresh,
    reset,
    loadData
  };
};

/**
 * Hook for managing data view states with preloading
 */
export const useDataViewState = (fetchFunction, options = {}) => {
  const {
    title = '',
    description = '',
    showNoDataInitially = true,
    ...preloadOptions
  } = options;

  const preloadState = usePreloadData(fetchFunction, preloadOptions);
  
  const [filters, setFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    let filtered = preloadState.data;

    // Apply search term
    if (searchTerm) {
      filtered = filtered.filter(item => {
        return Object.values(item).some(value => {
          if (typeof value === 'string') {
            return value.toLowerCase().includes(searchTerm.toLowerCase());
          }
          if (typeof value === 'object' && value !== null) {
            return Object.values(value).some(subValue => {
              if (typeof subValue === 'string') {
                return subValue.toLowerCase().includes(searchTerm.toLowerCase());
              }
              return false;
            });
          }
          return false;
        });
      });
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        filtered = filtered.filter(item => {
          const itemValue = item[key];
          if (typeof itemValue === 'string') {
            return itemValue.toLowerCase().includes(value.toLowerCase());
          }
          return itemValue === value;
        });
      }
    });

    return filtered;
  }, [preloadState.data, searchTerm, filters]);

  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchTerm('');
  }, []);

  const applyFilters = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  return {
    ...preloadState,
    filteredData,
    filters,
    searchTerm,
    setSearchTerm,
    applyFilters,
    clearFilters,
    title,
    description
  };
};
