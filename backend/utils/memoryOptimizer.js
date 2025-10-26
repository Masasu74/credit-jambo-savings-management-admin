// Memory Optimization Utility for Production Performance
import { performance } from 'perf_hooks';

class MemoryOptimizer {
  constructor() {
    this.memoryThreshold = 0.85; // 85% memory usage threshold (increased from 75%)
    this.cleanupInterval = 2 * 60 * 1000; // 2 minutes between cleanups
    this.lastCleanup = Date.now();
    this.cleanupCallbacks = [];
    this.isCleaningUp = false; // Prevent concurrent cleanups
    
    // Start memory monitoring
    this.startMonitoring();
  }

  // Start memory monitoring
  startMonitoring() {
    // DISABLED: Memory monitoring causing high system load
    // setInterval(() => {
    //   this.checkMemoryUsage();
    // }, 30000); // Check every 30 seconds
    console.log('🧠 Memory optimizer disabled to reduce system load');
  }

  // Check current memory usage
  checkMemoryUsage() {
    const memUsage = process.memoryUsage();
    const memoryUsageRatio = memUsage.heapUsed / memUsage.heapTotal;
    
    // Only log every 5 checks to reduce spam
    if (Math.random() < 0.2) {
      console.log(`📊 Memory Usage: ${(memoryUsageRatio * 100).toFixed(2)}% (${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB / ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)}MB)`);
    }
    
    // Check if cleanup is needed and not already running
    if (memoryUsageRatio > this.memoryThreshold && !this.isCleaningUp) {
      const timeSinceLastCleanup = Date.now() - this.lastCleanup;
      
      // Only trigger cleanup if enough time has passed
      if (timeSinceLastCleanup > this.cleanupInterval) {
        console.warn(`⚠️ HIGH_MEMORY_USAGE: ${(memoryUsageRatio * 100).toFixed(2)}% - Triggering cleanup`);
        this.performCleanup();
      }
    }
  }

  // Perform memory cleanup
  async performCleanup() {
    if (this.isCleaningUp) {
      return; // Already cleaning up
    }
    
    this.isCleaningUp = true;
    const startTime = performance.now();
    console.log('🧹 Starting memory cleanup...');
    
    try {
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        console.log('🗑️ Forced garbage collection completed');
      }
      
      // Execute cleanup callbacks
      for (const callback of this.cleanupCallbacks) {
        try {
          await callback();
        } catch (error) {
          console.error('❌ Cleanup callback error:', error);
        }
      }
      
      // Update last cleanup time
      this.lastCleanup = Date.now();
      
      const endTime = performance.now();
      console.log(`✅ Memory cleanup completed in ${(endTime - startTime).toFixed(2)}ms`);
      
    } catch (error) {
      console.error('❌ Memory cleanup error:', error);
    } finally {
      this.isCleaningUp = false;
    }
  }

  // Add cleanup callback
  addCleanupCallback(callback) {
    this.cleanupCallbacks.push(callback);
  }

  // Get memory statistics
  getMemoryStats() {
    const memUsage = process.memoryUsage();
    return {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
      usageRatio: memUsage.heapUsed / memUsage.heapTotal,
      usagePercentage: (memUsage.heapUsed / memUsage.heapTotal * 100).toFixed(2)
    };
  }

  // Optimize query memory usage
  optimizeQuery(query, options = {}) {
    const { maxTimeMS = 10000, lean = true, select = null } = options;
    
    if (lean) {
      query.lean();
    }
    
    if (maxTimeMS) {
      query.maxTimeMS(maxTimeMS);
    }
    
    if (select) {
      query.select(select);
    }
    
    return query;
  }

  // Batch process large datasets
  async processBatch(items, batchSize, processor) {
    const results = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await processor(batch);
      results.push(...batchResults);
      
      // Check memory usage after each batch
      if (i % (batchSize * 5) === 0) {
        this.checkMemoryUsage();
      }
    }
    
    return results;
  }
}

// Global memory optimizer instance
const memoryOptimizer = new MemoryOptimizer();

// Add cache cleanup to memory optimizer (less aggressive)
// TEMPORARILY DISABLED: Cache cleanup causing import errors
// memoryOptimizer.addCleanupCallback(async () => {
//   try {
//     // Only clear cache, don't log every time to reduce spam
//     const { clearCache } = await import('../middleware/cache.js');
//     clearCache();
//     // Remove log to reduce console spam
//   } catch (error) {
//     console.error('❌ Cache cleanup error:', error);
//   }
// });

// Force garbage collection more aggressively in production
// TEMPORARILY DISABLED: Aggressive GC causing issues in production
// if (process.env.NODE_ENV === 'production') {
//   setInterval(() => {
//     if (global.gc) {
//       global.gc();
//     }
//   }, 5 * 60 * 1000); // Every 5 minutes
// }

export default memoryOptimizer;
