// Enhanced in-memory cache middleware with better memory management
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100; // Reduced back to 100 entries to save memory
const MEMORY_THRESHOLD = 40 * 1024 * 1024; // 40MB memory threshold (reduced)

// Memory monitoring
const getMemoryUsage = () => {
  const memUsage = process.memoryUsage();
  return memUsage.heapUsed + memUsage.external;
};

// Clean up old cache entries
const cleanupCache = () => {
  const now = Date.now();
  const keysToDelete = [];
  
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      keysToDelete.push(key);
    }
  }
  
  keysToDelete.forEach(key => cache.delete(key));
  
  // If still over size limit, remove oldest entries
  if (cache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    const toRemove = entries.slice(0, cache.size - MAX_CACHE_SIZE);
    toRemove.forEach(([key]) => cache.delete(key));
  }
};

export const cacheMiddleware = (duration = CACHE_DURATION) => {
  return (req, res, next) => {
    try {
      // Skip caching for certain conditions
      if (req.method !== 'GET' || req.query.nocache === 'true') {
        console.log(`🚫 Cache bypassed for ${req.originalUrl} (nocache=true)`);
        return next();
      }
      
      // Create a clean cache key without query parameters that don't affect the data
      const cleanUrl = req.originalUrl.split('?')[0];
      const key = cleanUrl;
      const cachedResponse = cache.get(key);
      
      if (cachedResponse && Date.now() - cachedResponse.timestamp < duration) {
        console.log(`📦 Cache hit for ${key}`);
        return res.json(cachedResponse.data);
      }
      
      // Check memory usage and cleanup if necessary
      if (getMemoryUsage() > MEMORY_THRESHOLD || cache.size > MAX_CACHE_SIZE) {
        cleanupCache();
      }
      
      // Store original send method
      const originalJson = res.json;
      
      // Override json method to cache response
      res.json = function(data) {
        try {
          // Only cache successful responses
          if (data && typeof data === 'object' && data.success !== false) {
            cache.set(key, {
              data,
              timestamp: Date.now()
            });
            console.log(`💾 Cached response for ${key}`);
          }
        } catch (cacheError) {
          console.warn('Cache storage error:', cacheError);
          // Continue without caching if there's an error
        }
        
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      // Continue without caching if there's an error
      next();
    }
  };
};

export const clearCache = () => {
  try {
    cache.clear();
    // Reduced logging to minimize console spam
    if (Math.random() < 0.1) { // Only log 10% of the time
      console.log('✅ Cache cleared successfully');
    }
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
  }
};

// Clear cache entries that match a pattern
export const clearCacheByPattern = (pattern) => {
  try {
    const keysToDelete = [];
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => cache.delete(key));
    console.log(`✅ Cleared ${keysToDelete.length} cache entries matching pattern: ${pattern}`);
    return keysToDelete.length;
  } catch (error) {
    console.error('❌ Error clearing cache by pattern:', error);
    return 0;
  }
};

// Clear cache for specific entity types
export const clearEntityCache = (entityType) => {
  try {
    let totalCleared = 0;
    switch (entityType) {
      case 'loan':
        totalCleared += clearCacheByPattern('/loan/list');
        totalCleared += clearCacheByPattern('/loan/');
        // Also clear any cached loan data with query parameters
        totalCleared += clearCacheByPattern('loan/list');
        // Clear dashboard and summary caches that might include loan data
        totalCleared += clearCacheByPattern('/dashboard');
        totalCleared += clearCacheByPattern('/summary');
        break;
      case 'customer':
        totalCleared += clearCacheByPattern('/customer/list');
        totalCleared += clearCacheByPattern('/customer/');
        // Also clear any cached customer data with query parameters
        totalCleared += clearCacheByPattern('customer/list');
        // Clear dashboard and summary caches that might include customer data
        totalCleared += clearCacheByPattern('/dashboard');
        totalCleared += clearCacheByPattern('/summary');
        break;
      case 'branch':
        totalCleared += clearCacheByPattern('/branch/list');
        totalCleared += clearCacheByPattern('/branch/');
        break;
      case 'user':
        totalCleared += clearCacheByPattern('/user/list');
        totalCleared += clearCacheByPattern('/user/');
        break;
      default:
        clearCache();
        totalCleared = cache.size;
    }
    console.log(`✅ Total cache entries cleared for ${entityType}: ${totalCleared}`);
    return totalCleared;
  } catch (error) {
    console.error('❌ Error clearing entity cache:', error);
    return 0;
  }
};

// Clear all cache entries that might be affected by data changes
export const clearAllRelatedCache = () => {
  try {
    let totalCleared = 0;
    // Clear all list endpoints
    totalCleared += clearCacheByPattern('/list');
    // Clear dashboard and summary endpoints
    totalCleared += clearCacheByPattern('/dashboard');
    totalCleared += clearCacheByPattern('/summary');
    // Clear any cached data with query parameters
    totalCleared += clearCacheByPattern('?');
    console.log(`✅ Total related cache entries cleared: ${totalCleared}`);
    return totalCleared;
  } catch (error) {
    console.error('❌ Error clearing related cache:', error);
    return 0;
  }
};

export const getCacheStats = () => {
  try {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;
    
    for (const [key, value] of cache.entries()) {
      if (now - value.timestamp < CACHE_DURATION) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }
    
    return {
      size: cache.size,
      validEntries,
      expiredEntries,
      memoryUsage: getMemoryUsage(),
      keys: Array.from(cache.keys()).slice(0, 10) // Show first 10 keys only
    };
  } catch (error) {
    console.error('❌ Error getting cache stats:', error);
    return { error: error.message };
  }
};

// Periodic cache cleanup
setInterval(cleanupCache, 5 * 60 * 1000); // Clean up every 5 minutes 