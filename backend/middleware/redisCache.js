import { redisGet, redisSet, redisDel, redisDelPattern, isRedisAvailable } from '../config/redis.js';

/**
 * Redis-based caching middleware with fallback to in-memory cache
 */

// In-memory cache fallback
const memoryCache = new Map();
const MEMORY_CACHE_MAX_SIZE = 100;
const MEMORY_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Clean up old memory cache entries
 */
const cleanupMemoryCache = () => {
  const now = Date.now();
  const keysToDelete = [];
  
  for (const [key, value] of memoryCache.entries()) {
    if (now - value.timestamp > MEMORY_CACHE_DURATION) {
      keysToDelete.push(key);
    }
  }
  
  keysToDelete.forEach(key => memoryCache.delete(key));
  
  // If still over size limit, remove oldest entries
  if (memoryCache.size > MEMORY_CACHE_MAX_SIZE) {
    const entries = Array.from(memoryCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    const toRemove = entries.slice(0, memoryCache.size - MEMORY_CACHE_MAX_SIZE);
    toRemove.forEach(([key]) => memoryCache.delete(key));
  }
};

/**
 * Get from memory cache
 */
const getFromMemory = (key) => {
  const cached = memoryCache.get(key);
  if (cached && Date.now() - cached.timestamp < MEMORY_CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

/**
 * Set in memory cache
 */
const setInMemory = (key, data) => {
  if (memoryCache.size >= MEMORY_CACHE_MAX_SIZE) {
    cleanupMemoryCache();
  }
  
  memoryCache.set(key, {
    data,
    timestamp: Date.now()
  });
};

/**
 * Redis cache middleware
 * @param {number} duration - Cache duration in seconds (default: 300 = 5 minutes)
 * @param {string} keyPrefix - Optional key prefix for cache namespacing
 */
export const redisCacheMiddleware = (duration = 300, keyPrefix = 'cache') => {
  return async (req, res, next) => {
    try {
      // Only cache GET requests
      if (req.method !== 'GET') {
        return next();
      }
      
      // Skip caching if nocache parameter is present
      if (req.query.nocache === 'true') {
        return next();
      }
      
      // Generate cache key
      const cacheKey = `${keyPrefix}:${req.originalUrl}`;
      
      // Try to get from Redis first
      let cachedResponse = null;
      
      if (isRedisAvailable()) {
        cachedResponse = await redisGet(cacheKey);
        if (cachedResponse) {
          console.log(`📦 Redis cache hit: ${cacheKey}`);
          return res.json(cachedResponse);
        }
      } else {
        // Fallback to memory cache
        cachedResponse = getFromMemory(cacheKey);
        if (cachedResponse) {
          console.log(`📦 Memory cache hit: ${cacheKey}`);
          return res.json(cachedResponse);
        }
      }
      
      // Store original json method
      const originalJson = res.json;
      
      // Override json method to cache response
      res.json = function(data) {
        // Only cache successful responses
        if (data && typeof data === 'object' && data.success !== false) {
          if (isRedisAvailable()) {
            // Cache in Redis
            redisSet(cacheKey, data, duration)
              .then(() => console.log(`💾 Cached in Redis: ${cacheKey}`))
              .catch(err => console.error('Redis cache error:', err.message));
          } else {
            // Fallback to memory cache
            setInMemory(cacheKey, data);
            console.log(`💾 Cached in memory: ${cacheKey}`);
          }
        }
        
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      // Continue without caching on error
      next();
    }
  };
};

/**
 * Clear cache by pattern
 * @param {string} pattern - Pattern to match (e.g., 'cache:loan:*')
 * @returns {Promise<number>} Number of keys deleted
 */
export const clearCacheByPattern = async (pattern) => {
  try {
    let cleared = 0;
    
    if (isRedisAvailable()) {
      cleared = await redisDelPattern(pattern);
      console.log(`✅ Cleared ${cleared} Redis cache entries matching: ${pattern}`);
    } else {
      // Clear from memory cache
      const keysToDelete = [];
      for (const key of memoryCache.keys()) {
        if (key.includes(pattern.replace('*', ''))) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(key => memoryCache.delete(key));
      cleared = keysToDelete.length;
      console.log(`✅ Cleared ${cleared} memory cache entries matching: ${pattern}`);
    }
    
    return cleared;
  } catch (error) {
    console.error('Clear cache error:', error);
    return 0;
  }
};

/**
 * Clear specific cache key
 * @param {string} key - Cache key to delete
 * @returns {Promise<boolean>} Success status
 */
export const clearCacheKey = async (key) => {
  try {
    if (isRedisAvailable()) {
      await redisDel(key);
    } else {
      memoryCache.delete(key);
    }
    console.log(`✅ Cleared cache key: ${key}`);
    return true;
  } catch (error) {
    console.error('Clear cache key error:', error);
    return false;
  }
};

/**
 * Clear entity-specific cache
 * @param {string} entityType - Entity type (loan, customer, user, etc.)
 * @returns {Promise<number>} Number of keys deleted
 */
export const clearEntityCache = async (entityType) => {
  try {
    let totalCleared = 0;
    
    const patterns = {
      loan: ['cache:*/loan/*', 'cache:*/dashboard*', 'cache:*/summary*'],
      customer: ['cache:*/customer/*', 'cache:*/dashboard*', 'cache:*/summary*'],
      user: ['cache:*/user/*'],
      branch: ['cache:*/branch/*'],
      repayment: ['cache:*/repayment/*', 'cache:*/loan/*'],
      expense: ['cache:*/expense/*', 'cache:*/financial*'],
      all: ['cache:*']
    };
    
    const patternsToCheck = patterns[entityType] || patterns.all;
    
    for (const pattern of patternsToCheck) {
      const cleared = await clearCacheByPattern(pattern);
      totalCleared += cleared;
    }
    
    console.log(`✅ Total cache entries cleared for ${entityType}: ${totalCleared}`);
    return totalCleared;
  } catch (error) {
    console.error('Clear entity cache error:', error);
    return 0;
  }
};

/**
 * Get cache statistics
 * @returns {Promise<Object>} Cache statistics
 */
export const getCacheStats = async () => {
  try {
    if (isRedisAvailable()) {
      const { redisStats } = await import('../config/redis.js');
      return await redisStats();
    } else {
      // Memory cache stats
      const now = Date.now();
      let validEntries = 0;
      let expiredEntries = 0;
      
      for (const [key, value] of memoryCache.entries()) {
        if (now - value.timestamp < MEMORY_CACHE_DURATION) {
          validEntries++;
        } else {
          expiredEntries++;
        }
      }
      
      return {
        type: 'memory',
        size: memoryCache.size,
        validEntries,
        expiredEntries,
        keys: Array.from(memoryCache.keys()).slice(0, 10)
      };
    }
  } catch (error) {
    console.error('Get cache stats error:', error);
    return { error: error.message };
  }
};

// Periodic cleanup for memory cache
setInterval(cleanupMemoryCache, 5 * 60 * 1000); // Clean up every 5 minutes

export default redisCacheMiddleware;

