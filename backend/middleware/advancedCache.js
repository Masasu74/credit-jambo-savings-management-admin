// Advanced Caching Middleware with Redis-like Features
import { createHash } from 'crypto';

// Enhanced cache with multiple storage tiers
class AdvancedCache {
  constructor() {
    this.memoryCache = new Map();
    this.persistentCache = new Map(); // Simulates Redis-like persistence
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    this.MAX_MEMORY_SIZE = 500; // Increased for scale
    this.MAX_PERSISTENT_SIZE = 1000;
    this.MEMORY_THRESHOLD = 100 * 1024 * 1024; // 100MB
    
    // Cache statistics
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      memoryUsage: 0
    };
    
    // Start cleanup intervals
    this.startCleanup();
  }

  // Generate cache key with hash
  generateKey(url, params = {}) {
    const keyData = JSON.stringify({ url, params });
    return createHash('md5').update(keyData).digest('hex');
  }

  // Get from cache with fallback
  get(key) {
    // Try memory cache first (fastest)
    const memoryResult = this.memoryCache.get(key);
    if (memoryResult && Date.now() - memoryResult.timestamp < this.CACHE_DURATION) {
      this.stats.hits++;
      return memoryResult.data;
    }

    // Try persistent cache
    const persistentResult = this.persistentCache.get(key);
    if (persistentResult && Date.now() - persistentResult.timestamp < this.CACHE_DURATION) {
      this.stats.hits++;
      // Move to memory cache for faster access
      this.memoryCache.set(key, persistentResult);
      return persistentResult.data;
    }

    this.stats.misses++;
    return null;
  }

  // Set cache with tiered storage
  set(key, data, duration = this.CACHE_DURATION) {
    const cacheEntry = {
      data,
      timestamp: Date.now(),
      duration
    };

    // Always store in persistent cache
    this.persistentCache.set(key, cacheEntry);
    this.stats.sets++;

    // Store in memory cache if space available
    if (this.memoryCache.size < this.MAX_MEMORY_SIZE) {
      this.memoryCache.set(key, cacheEntry);
    }

    // Update memory usage
    this.updateMemoryUsage();
  }

  // Delete from both caches
  delete(key) {
    this.memoryCache.delete(key);
    this.persistentCache.delete(key);
    this.stats.deletes++;
  }

  // Clear cache by pattern
  clearByPattern(pattern) {
    const keysToDelete = [];
    
    // Check memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }
    
    // Check persistent cache
    for (const key of this.persistentCache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.delete(key));
    return keysToDelete.length;
  }

  // Update memory usage statistics
  updateMemoryUsage() {
    const memUsage = process.memoryUsage();
    this.stats.memoryUsage = memUsage.heapUsed + memUsage.external;
  }

  // Cleanup expired entries
  cleanup() {
    const now = Date.now();
    
    // Clean memory cache
    for (const [key, value] of this.memoryCache.entries()) {
      if (now - value.timestamp > value.duration) {
        this.memoryCache.delete(key);
      }
    }
    
    // Clean persistent cache
    for (const [key, value] of this.persistentCache.entries()) {
      if (now - value.timestamp > value.duration) {
        this.persistentCache.delete(key);
      }
    }
    
    // Size-based cleanup
    if (this.memoryCache.size > this.MAX_MEMORY_SIZE) {
      const entries = Array.from(this.memoryCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, this.memoryCache.size - this.MAX_MEMORY_SIZE);
      toRemove.forEach(([key]) => this.memoryCache.delete(key));
    }
    
    if (this.persistentCache.size > this.MAX_PERSISTENT_SIZE) {
      const entries = Array.from(this.persistentCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, this.persistentCache.size - this.MAX_PERSISTENT_SIZE);
      toRemove.forEach(([key]) => this.persistentCache.delete(key));
    }
    
    this.updateMemoryUsage();
  }

  // Start periodic cleanup
  startCleanup() {
    setInterval(() => this.cleanup(), 2 * 60 * 1000); // Every 2 minutes
  }

  // Get cache statistics
  getStats() {
    return {
      ...this.stats,
      memoryCacheSize: this.memoryCache.size,
      persistentCacheSize: this.persistentCache.size,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) * 100
    };
  }

  // Clear all cache
  clear() {
    this.memoryCache.clear();
    this.persistentCache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      memoryUsage: 0
    };
  }
}

// Global cache instance
const advancedCache = new AdvancedCache();

// Advanced cache middleware
export const advancedCacheMiddleware = (duration = 5 * 60 * 1000, options = {}) => {
  return (req, res, next) => {
    try {
      // Skip caching for certain conditions
      if (req.method !== 'GET' || 
          req.query.nocache === 'true' ||
          req.headers['cache-control'] === 'no-cache') {
        return next();
      }

      // Generate cache key with query parameters
      const cacheKey = advancedCache.generateKey(req.originalUrl, req.query);
      
      // Check cache
      const cachedResponse = advancedCache.get(cacheKey);
      if (cachedResponse) {
        return res.json(cachedResponse);
      }

      // Store original send method
      const originalJson = res.json;
      
      // Override json method to cache response
      res.json = function(data) {
        try {
          // Only cache successful responses
          if (data && typeof data === 'object' && data.success !== false) {
            // Add cache metadata
            const cacheData = {
              ...data,
              _cached: true,
              _cacheTime: new Date().toISOString()
            };
            
            advancedCache.set(cacheKey, cacheData, duration);
          }
        } catch (cacheError) {
          console.warn('Advanced cache storage error:', cacheError);
        }
        
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      console.error('Advanced cache middleware error:', error);
      next();
    }
  };
};

// Entity-specific cache clearing
export const clearEntityCache = (entityType) => {
  const patterns = {
    'loan': ['/loan/', '/loans/'],
    'customer': ['/customer/', '/customers/'],
    'user': ['/user/', '/users/'],
    'activity': ['/activity/', '/activities/'],
    'expense': ['/expense/', '/expenses/'],
    'employee': ['/employee/', '/employees/'],
    'application': ['/application/', '/applications/'],
    'repayment': ['/repayment/', '/repayments/'],
    'task': ['/task/', '/tasks/'],
    'attendance': ['/attendance/', '/attendances/']
  };

  const entityPatterns = patterns[entityType] || [];
  let totalCleared = 0;
  
  entityPatterns.forEach(pattern => {
    totalCleared += advancedCache.clearByPattern(pattern);
  });

  console.log(`✅ Cleared ${totalCleared} cache entries for ${entityType}`);
  return totalCleared;
};

// Clear all cache
export const clearAllCache = () => {
  advancedCache.clear();
  console.log('✅ All cache cleared');
};

// Get cache statistics
export const getCacheStats = () => {
  return advancedCache.getStats();
};

// Cache warming function for frequently accessed data
export const warmCache = async (endpoints = []) => {
  console.log('🔥 Warming cache for frequently accessed endpoints...');
  
  const defaultEndpoints = [
    '/api/loan/list?limit=20',
    '/api/customer/list?limit=20',
    '/api/user/list?limit=20',
    '/api/activity/summary',
    '/api/expense/list?limit=10'
  ];

  const endpointsToWarm = endpoints.length > 0 ? endpoints : defaultEndpoints;
  
  // This would typically make HTTP requests to warm the cache
  // For now, we'll just log the intention
  console.log('📋 Cache warming endpoints:', endpointsToWarm);
  
  return endpointsToWarm.length;
};

export default advancedCache;
