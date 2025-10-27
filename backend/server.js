// 📁 index.js or server.js
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import savingsAccountRouter from './routes/savingsAccountRoute.js';
import transactionRouter from './routes/transactionRoute.js';
import deviceVerificationRouter from './routes/deviceVerificationRoute.js';
import savingsCustomerRouter from './routes/savingsCustomerRoute.js';
import userRouter from './routes/userRoute.js';
import customerAuthRouter from './routes/customerAuthRoute.js';
import 'dotenv/config.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import cron from 'node-cron';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import InputValidation from './middleware/inputValidation.js';
import { 
  securityHeaders, 
  corsConfig, 
  rateLimitHeaders, 
  securityMonitoringHeaders,
  fileUploadSecurityHeaders,
  apiSecurityHeaders 
} from './middleware/securityHeaders.js';
import auditLogger from './utils/auditLogger.js';
import { decryptData, encryptData } from './utils/encryption.js';
import { authorize } from './middleware/rbac.js';
import { startReminderScheduler } from './utils/reminderScheduler.js';
import notificationRouter from './routes/notificationRoute.js';
import healthRouter from './routes/healthRoute.js';
import systemSettingsRouter from './routes/systemSettingsRoute.js';
import { upload } from './utils/upload.js';
import multer from 'multer';
import mongoose from 'mongoose';

// 🚀 Performance Optimization Imports
import { advancedCacheMiddleware } from './middleware/advancedCache.js';
import { queryOptimizer, queryPerformanceMonitor } from './middleware/queryOptimizer.js';
import { performanceMiddleware, getPerformanceMetrics, getHealthStatus, generatePerformanceReport } from './utils/performanceMonitor.js';

// 🚀 Redis Caching Imports
import { connectRedis, isRedisAvailable, redisStats } from './config/redis.js';
import { redisCacheMiddleware, clearEntityCache, getCacheStats } from './middleware/redisCache.js';

const app = express();   

const port = process.env.PORT || 4000;
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 👇 Import uploads configuration
import { uploadsDir } from './config/uploadsConfig.js';

// 👇 Ensure uploads directory exists (handled in uploadsConfig.js)
console.log(`Using uploads directory: ${uploadsDir}`);

// 🚀 Enhanced Performance Optimizations
app.use(compression({
  level: 6, // Balanced compression level
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Performance monitoring middleware
app.use(performanceMiddleware);

// Query optimization middleware for better database performance
app.use(queryOptimizer());

// Query performance monitoring
app.use(queryPerformanceMonitor);

// Enhanced Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "same-origin" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: "deny" },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  ieNoOpen: true,
  noSniff: true,
  permittedCrossDomainPolicies: { permittedPolicies: "none" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true
}));

// Enhanced CORS configuration
app.use(cors(corsConfig));

// Additional CORS middleware for API routes
app.use('/api', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-API-Key, X-Client-Version');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
});

// Security headers
app.use(securityHeaders);
app.use(rateLimitHeaders);
app.use(securityMonitoringHeaders);
app.use(fileUploadSecurityHeaders);
app.use(apiSecurityHeaders);

// Body parsing middleware with optimized limits
app.use(express.json({ 
  limit: '10mb', // Increased for file uploads
  strict: true 
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  parameterLimit: 1000 // Limit number of parameters
}));

// Enhanced logging with performance metrics
app.use(morgan('combined', {
  stream: {
    write: (message) => {
      console.log(message.trim());
    }
  }
}));

// 🚀 Advanced Caching for Static Assets
app.use('/uploads', express.static(uploadsDir, {
  maxAge: '1y', // Cache static files for 1 year
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    // Set appropriate cache headers based on file type
    if (path.endsWith('.pdf')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (path.endsWith('.jpg') || path.endsWith('.png') || path.endsWith('.jpeg')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day for other files
    }
  }
}));

// 🚀 Performance Monitoring Endpoints
app.get('/api/performance/metrics', (req, res) => {
  try {
    const metrics = getPerformanceMetrics();
    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get performance metrics'
    });
  }
});

app.get('/api/performance/health', (req, res) => {
  try {
    const health = getHealthStatus();
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Error getting health status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get health status'
    });
  }
});

app.get('/api/performance/report', (req, res) => {
  try {
    const report = generatePerformanceReport();
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error generating performance report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate performance report'
    });
  }
});

// 🚀 Cache Management Endpoints
app.get('/api/cache/stats', async (req, res) => {
  try {
    const stats = await getCacheStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cache stats'
    });
  }
});

app.post('/api/cache/clear/:entityType?', async (req, res) => {
  try {
    const { entityType } = req.params;
    const cleared = await clearEntityCache(entityType || 'all');
    res.json({
      success: true ,
      message: `Cleared ${cleared} cache entries`,
      data: { cleared, entityType: entityType || 'all' }
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache'
    });
  }
});

// 🚀 Redis Caching for API Routes
// Apply Redis caching to read-heavy endpoints (with in-memory fallback)
// app.use('/api/loan/list', redisCacheMiddleware(120)); // 2 minutes - removed as this is a savings system
app.use('/api/customer/list', redisCacheMiddleware(180)); // 3 minutes

// 🧠 Memory Optimization and Monitoring
let memoryWarningCount = 0;
const MEMORY_THRESHOLD = 0.8; // 80% memory usage threshold
const MEMORY_CRITICAL_THRESHOLD = 0.9; // 90% memory usage threshold

// Memory monitoring function
const monitorMemory = () => {
  const memUsage = process.memoryUsage();
  const usage = memUsage.heapUsed / memUsage.heapTotal;
  
  if (usage > MEMORY_CRITICAL_THRESHOLD) {
    console.error(`🚨 CRITICAL: Memory usage at ${(usage * 100).toFixed(1)}% - Forcing garbage collection`);
    if (global.gc) {
      global.gc();
      memoryWarningCount++;
    }
  } else if (usage > MEMORY_THRESHOLD) {
    console.warn(`⚠️ WARNING: HIGH_MEMORY_USAGE { usage: ${usage}, threshold: ${MEMORY_THRESHOLD}, heapUsed: ${memUsage.heapUsed}, heapTotal: ${memUsage.heapTotal} }`);
    if (global.gc && memoryWarningCount % 3 === 0) { // GC every 3rd warning
      global.gc();
    }
    memoryWarningCount++;
  }
};

// Monitor memory every 30 seconds
setInterval(monitorMemory, 30000);

// Force garbage collection on high memory usage
process.on('warning', (warning) => {
  if (warning.name === 'MaxListenersExceededWarning') {
    console.warn('⚠️ Max listeners exceeded warning:', warning.message);
  }
});
app.use('/api/user/list', redisCacheMiddleware(300)); // 5 minutes
app.use('/api/activity/summary', redisCacheMiddleware(60)); // 1 minute
app.use('/api/expense/list', redisCacheMiddleware(120)); // 2 minutes
app.use('/api/branch/list', redisCacheMiddleware(300)); // 5 minutes
// app.use('/api/loan-products', redisCacheMiddleware(600)); // 10 minutes - removed as this is a savings system

// Utility Functions
const sanitizeFilename = (name) => name.replace(/[^a-zA-Z0-9-_.]/g, '_').substring(0, 100).toLowerCase();
const getContentType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const types = {
    '.pdf': 'application/pdf', 
    '.jpg': 'image/jpeg', 
    '.jpeg': 'image/jpeg', 
    '.png': 'image/png',
    '.ico': 'image/x-icon',
    '.doc': 'application/msword', 
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel', 
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };
  return types[ext] || 'application/octet-stream';
};

// Serve Uploaded Files with caching
app.get('/uploads/:filename', (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    
    // Use the same sanitization as upload configuration
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    
    const filePath = path.join(uploadsDir, sanitizedFilename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // Add CORS headers for uploads
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    // Add caching headers for images and documents
    const ext = path.extname(filename).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.gif', '.ico', '.pdf'].includes(ext)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
    }

    const fileStream = fs.createReadStream(filePath);
    fileStream.on('open', () => {
      res.setHeader('Content-Type', getContentType(filename));
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);
      fileStream.pipe(res);
    });

    fileStream.on('error', (err) => {
      console.error('File stream error:', err);
      if (!res.headersSent) res.status(500).json({ success: false, message: 'Error reading file' });
    });
  } catch (err) {
    console.error('File handling error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Also serve uploads with /api prefix for backward compatibility
app.get('/api/uploads/:filename', (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    
    // Use the same sanitization as upload configuration
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    
    const filePath = path.join(uploadsDir, sanitizedFilename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // Add CORS headers for uploads
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    // Add caching headers for images and documents
    const ext = path.extname(filename).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.gif', '.ico', '.pdf'].includes(ext)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
    }

    const fileStream = fs.createReadStream(filePath);
    fileStream.on('open', () => {
      res.setHeader('Content-Type', getContentType(filename));
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);
      fileStream.pipe(res);
    });

    fileStream.on('error', (err) => {
      console.error('File stream error:', err);
      if (!res.headersSent) res.status(500).json({ success: false, message: 'Error reading file' });
    });
  } catch (err) {
    console.error('File handling error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Connect DB and Redis
connectDB();
connectRedis().catch(err => {
  console.warn('⚠️ Redis connection failed, using in-memory cache fallback:', err.message);
});
startReminderScheduler();

// Cron job - Daily system maintenance at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('Running daily system maintenance...');
  try {
    // Add any daily maintenance tasks here
    console.log('Daily system maintenance completed successfully');
  } catch (error) {
    console.error('Daily system maintenance failed:', error);
  }
});

// Cron job - Daily backup at 2:00 AM
cron.schedule('0 2 * * *', async () => {
  console.log('Running daily backup...');
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    const backupScript = path.join(__dirname, 'scripts', 'backup.js');
    await execAsync(`node "${backupScript}"`);
    console.log('Daily backup completed successfully');
  } catch (error) {
    console.error('Daily backup failed:', error);
  }
});

// Cron job - DISABLED: Manual loan completion only
// cron.schedule('0 0 * * *', async () => {
//   console.log('Running daily loan status check...');
//   try {
//     await checkLoanCompletions(null, { json: (data) => console.log(data.message) });
//   } catch (error) {
//     console.error('Loan status check failed:', error);
//   }
// });

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    // Check database connection
    const { checkDBHealth } = await import('./config/db.js');
    const dbHealth = await checkDBHealth();
    
    // Check cache statistics (Redis or in-memory)
    const cacheStats = await getCacheStats();
    
    // Check uploads directory status
    let uploadsStatus = 'unknown';
    let uploadsFileCount = 0;
    
    try {
      if (fs.existsSync(uploadsDir)) {
        uploadsStatus = 'exists';
        const files = fs.readdirSync(uploadsDir);
        uploadsFileCount = files.length;
      } else {
        uploadsStatus = 'missing';
      }
    } catch (error) {
      uploadsStatus = 'error';
    }
    
    res.json({
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: dbHealth.healthy ? 'connected' : 'disconnected',
        readyState: mongoose.connection.readyState,
        details: dbHealth
      },
      cache: cacheStats,
      redis: {
        available: isRedisAvailable(),
        type: isRedisAvailable() ? 'redis' : 'memory'
      },
      uploads: {
        path: uploadsDir,
        status: uploadsStatus,
        fileCount: uploadsFileCount
      },
      performance: {
        uptime: Math.floor(uptime),
        memoryUsage: {
          rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
          external: Math.round(memUsage.external / 1024 / 1024) + ' MB'
        },
        nodeVersion: process.version,
        platform: process.platform
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

// API Routes - Savings Management System
// Core API routes for savings management system
app.use('/api/savings-accounts', savingsAccountRouter);
app.use('/api/transactions', transactionRouter);
app.use('/api/device-verifications', deviceVerificationRouter);
app.use('/api/customers', savingsCustomerRouter);
app.use('/api/customer-auth', customerAuthRouter);
app.use('/api/user', userRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/system-settings', systemSettingsRouter);
app.use('/api', healthRouter);

// Error handling middleware for multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    console.error('Multer error:', error);
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum allowed size is 10MB'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Only one file allowed'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${error.message}`
    });
  }
  next(error);
});

// File upload endpoint for system settings
app.post('/api/uploads', upload.single('file'), (req, res) => {
  console.log('Upload request received:', {
    contentType: req.headers['content-type'],
    contentLength: req.headers['content-length'],
    hasFile: !!req.file
  });

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  console.log('File uploaded successfully:', {
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
    destination: req.file.destination
  });

  const filePath = `/api/uploads/${req.file.filename}`;
  
  res.status(200).json({
    success: true,
    message: 'File uploaded successfully',
    filePath: filePath,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size
  });
});

// Health check with performance metrics
app.get('/', (req, res) => {
  const memUsage = process.memoryUsage();
  const uptime = process.uptime();
  
  // Check uploads directory status
  let uploadsStatus = 'unknown';
  let uploadsFileCount = 0;
  
  try {
    if (fs.existsSync(uploadsDir)) {
      uploadsStatus = 'exists';
      const files = fs.readdirSync(uploadsDir);
      uploadsFileCount = files.length;
    } else {
      uploadsStatus = 'missing';
    }
  } catch (error) {
    uploadsStatus = 'error';
  }
  
  res.json({
    success: true,
    message: 'Credit Jambo Savings API Running 🚀',
    environment: process.env.NODE_ENV,
    uploads: {
      path: uploadsDir,
      status: uploadsStatus,
      fileCount: uploadsFileCount
    },
    serverTime: new Date().toISOString(),
    performance: {
      uptime: Math.floor(uptime),
      memoryUsage: {
        rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB'
      },
      nodeVersion: process.version,
      platform: process.platform
    }
  });
});



// Error handler
app.use((err, req, res, next) => {
  auditLogger.logError(err, req);
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message;
  res.status(statusCode).json({ success: false, message, ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }) });
});

process.on('unhandledRejection', (reason, promise) => console.error('Unhandled Rejection at:', promise, 'reason:', reason));
process.on('uncaughtException', (error) => { console.error('Uncaught Exception:', error); process.exit(1); });

app.listen(port, () => {
  console.log(`\n  Server started on port: ${port}\n  Environment: ${process.env.NODE_ENV}\n  Uploads Directory: ${uploadsDir}\n`);
});
