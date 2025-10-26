import express from 'express';
import mongoose from 'mongoose';
import memoryOptimizer from '../utils/memoryOptimizer.js';
import { getCacheStats } from '../middleware/cache.js';

const healthRouter = express.Router();

// Health check endpoint
healthRouter.get('/health', async (req, res) => {
  try {
    const memStats = memoryOptimizer.getMemoryStats();
    const cacheStats = getCacheStats();
    
    // Check database connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Test a simple database query
    let dbQueryTime = null;
    let dbError = null;
    try {
      const startTime = Date.now();
      await mongoose.connection.db.admin().ping();
      dbQueryTime = Date.now() - startTime;
    } catch (error) {
      dbError = error.message;
    }
    
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        queryTime: dbQueryTime,
        error: dbError
      },
      memory: {
        usage: memStats.usagePercentage + '%',
        heapUsed: Math.round(memStats.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memStats.heapTotal / 1024 / 1024) + 'MB',
        alert: memStats.usagePercentage > 80 ? 'HIGH_MEMORY_USAGE' : null
      },
      cache: {
        size: cacheStats.size,
        validEntries: cacheStats.validEntries,
        expiredEntries: cacheStats.expiredEntries
      },
      uptime: Math.round(process.uptime())
    };
    
    // Determine overall health status
    if (dbStatus === 'disconnected' || dbError) {
      healthData.status = 'unhealthy';
    } else if (memStats.usagePercentage > 90 || (dbQueryTime && dbQueryTime > 2000)) {
      healthData.status = 'degraded';
    }
    
    const statusCode = healthData.status === 'healthy' ? 200 : 
                      healthData.status === 'degraded' ? 206 : 503;
    
    res.status(statusCode).json(healthData);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Savings accounts health check - specific for debugging savings account issues
healthRouter.get('/health/savings-accounts', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Import here to avoid circular dependency
    const { default: SavingsAccount } = await import('../models/savingsAccountModel.js');
    
    // Test savings account count query
    const accountCount = await Promise.race([
      SavingsAccount.countDocuments(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), 5000)
      )
    ]);
    
    const queryTime = Date.now() - startTime;
    
    res.json({
      status: 'healthy',
      accountCount,
      queryTime: queryTime + 'ms',
      timestamp: new Date().toISOString(),
      alert: queryTime > 1000 ? 'SLOW_QUERY' : null
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default healthRouter;
