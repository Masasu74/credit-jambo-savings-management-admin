import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Redis Configuration for Distributed Caching
 * Provides connection pooling, error handling, and fallback mechanisms
 */
class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 5;
  }

  /**
   * Initialize Redis connection
   */
  async connect() {
    try {
      // Check if Redis is enabled
      if (process.env.REDIS_ENABLED === "false") {
        console.log('📦 Redis is disabled, using in-memory cache fallback');
        return false;
      }

      const redisConfig = {
        host: process.env.REDIS_HOST || 'redis',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || "SecureRedisPass123",
        db: parseInt(process.env.REDIS_DB) || 0,
        
        // Connection pooling
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        enableOfflineQueue: true,
        
        // Retry strategy
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          if (times > this.maxConnectionAttempts) {
            console.error('❌ Redis: Maximum connection attempts reached');
            return null; // Stop retrying
          }
          return delay;
        },
        
        // Connection timeout
        connectTimeout: 10000,
        
        // Lazy connect for better startup
        lazyConnect: true,
      };

      // Create Redis client
      this.client = new Redis(redisConfig);

      // Event handlers
      this.client.on('connect', () => {
        console.log('🔗 Redis: Connecting...');
        this.connectionAttempts++;
      });

      this.client.on('ready', () => {
        console.log('✅ Redis: Connected and ready');
        this.isConnected = true;
        this.connectionAttempts = 0;
      });

      this.client.on('error', (err) => {
        console.error('❌ Redis Error:', err.message);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        console.warn('⚠️ Redis: Connection closed');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        console.log('🔄 Redis: Reconnecting...');
      });

      // Attempt to connect
      await this.client.connect();

      // Test connection
      await this.client.ping();
      
      return true;
    } catch (error) {
      console.error('❌ Redis connection failed:', error.message);
      console.log('📦 Falling back to in-memory cache');
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Get Redis client instance
   * @returns {Redis|null} Redis client or null if not connected
   */
  getClient() {
    if (this.isConnected && this.client) {
      return this.client;
    }
    return null;
  }

  /**
   * Check if Redis is available
   * @returns {boolean} Connection status
   */
  isAvailable() {
    return this.isConnected && this.client !== null;
  }

  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {Promise<any>} Cached value or null
   */
  async get(key) {
    if (!this.isAvailable()) return null;
    
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis GET error:', error.message);
      return null;
    }
  }

  /**
   * Set a value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds (default: 300)
   * @returns {Promise<boolean>} Success status
   */
  async set(key, value, ttl = 300) {
    if (!this.isAvailable()) return false;
    
    try {
      const serialized = JSON.stringify(value);
      await this.client.setex(key, ttl, serialized);
      return true;
    } catch (error) {
      console.error('Redis SET error:', error.message);
      return false;
    }
  }

  /**
   * Delete a key from cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} Success status
   */
  async del(key) {
    if (!this.isAvailable()) return false;
    
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Redis DEL error:', error.message);
      return false;
    }
  }

  /**
   * Delete keys matching a pattern
   * @param {string} pattern - Pattern to match (e.g., 'cache:loan:*')
   * @returns {Promise<number>} Number of keys deleted
   */
  async delPattern(pattern) {
    if (!this.isAvailable()) return 0;
    
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) return 0;
      
      await this.client.del(...keys);
      return keys.length;
    } catch (error) {
      console.error('Redis DEL PATTERN error:', error.message);
      return 0;
    }
  }

  /**
   * Clear all cache
   * @returns {Promise<boolean>} Success status
   */
  async flush() {
    if (!this.isAvailable()) return false;
    
    try {
      await this.client.flushdb();
      console.log('✅ Redis cache cleared');
      return true;
    } catch (error) {
      console.error('Redis FLUSH error:', error.message);
      return false;
    }
  }

  /**
   * Get cache statistics
   * @returns {Promise<Object>} Cache statistics
   */
  async getStats() {
    if (!this.isAvailable()) {
      return {
        connected: false,
        keys: 0,
        memory: 0,
        hits: 0,
        misses: 0
      };
    }
    
    try {
      const info = await this.client.info('stats');
      const dbSize = await this.client.dbsize();
      const memory = await this.client.info('memory');
      
      // Parse stats
      const statsMatch = info.match(/keyspace_hits:(\d+)\r\nkeyspace_misses:(\d+)/);
      const memoryMatch = memory.match(/used_memory_human:(.+)\r\n/);
      
      return {
        connected: true,
        keys: dbSize,
        memory: memoryMatch ? memoryMatch[1] : 'N/A',
        hits: statsMatch ? parseInt(statsMatch[1]) : 0,
        misses: statsMatch ? parseInt(statsMatch[2]) : 0,
        hitRate: statsMatch ? 
          (parseInt(statsMatch[1]) / (parseInt(statsMatch[1]) + parseInt(statsMatch[2])) * 100).toFixed(2) + '%' : 
          'N/A'
      };
    } catch (error) {
      console.error('Redis STATS error:', error.message);
      return { connected: false, error: error.message };
    }
  }

  /**
   * Close Redis connection
   */
  async disconnect() {
    if (this.client) {
      await this.client.quit();
      console.log('🔌 Redis: Disconnected');
      this.isConnected = false;
    }
  }
}

// Create singleton instance
const redisClient = new RedisClient();

// Export functions
export const connectRedis = () => redisClient.connect();
export const getRedisClient = () => redisClient.getClient();
export const isRedisAvailable = () => redisClient.isAvailable();
export const redisGet = (key) => redisClient.get(key);
export const redisSet = (key, value, ttl) => redisClient.set(key, value, ttl);
export const redisDel = (key) => redisClient.del(key);
export const redisDelPattern = (pattern) => redisClient.delPattern(pattern);
export const redisFlush = () => redisClient.flush();
export const redisStats = () => redisClient.getStats();
export const disconnectRedis = () => redisClient.disconnect();

export default redisClient;

