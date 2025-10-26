// Query Optimization Middleware for Database Performance
import mongoose from 'mongoose';

// Query optimization configuration
const QUERY_OPTIMIZATION_CONFIG = {
  // Default limits for different entity types
  defaultLimits: {
    loans: 50,
    customers: 50,
    users: 30,
    activities: 100,
    expenses: 25,
    employees: 30,
    applications: 25,
    repayments: 50,
    tasks: 20,
    attendances: 30
  },
  
  // Maximum limits to prevent excessive data loading
  maxLimits: {
    loans: 200,
    customers: 200,
    users: 100,
    activities: 500,
    expenses: 100,
    employees: 100,
    applications: 100,
    repayments: 200,
    tasks: 50,
    attendances: 100
  },
  
  // Fields to always exclude for performance
  excludedFields: {
    loans: ['__v', 'updatedAt'],
    customers: ['__v', 'updatedAt', 'documents'],
    users: ['__v', 'password', 'updatedAt'],
    activities: ['__v'],
    expenses: ['__v', 'updatedAt'],
    employees: ['__v', 'updatedAt'],
    applications: ['__v', 'updatedAt'],
    repayments: ['__v', 'updatedAt'],
    tasks: ['__v', 'updatedAt'],
    attendances: ['__v', 'updatedAt']
  },
  
  // Lean query optimization
  leanQueries: [
    '/api/loan/list',
    '/api/customer/list',
    '/api/user/list',
    '/api/activity/list',
    '/api/expense/list',
    '/api/employee/list',
    '/api/application/list',
    '/api/repayment/list',
    '/api/task/list',
    '/api/attendance/list'
  ]
};

// Query optimization middleware
export const queryOptimizer = (entityType = null) => {
  return (req, res, next) => {
    try {
      // Determine entity type from URL if not provided
      const urlEntityType = entityType || getEntityTypeFromUrl(req.originalUrl);
      
      if (!urlEntityType) {
        return next();
      }

      // Optimize query parameters
      optimizeQueryParams(req, urlEntityType);
      
      // Add optimization metadata to request
      req.queryOptimization = {
        entityType: urlEntityType,
        optimized: true,
        timestamp: new Date().toISOString()
      };

      // Store original query for comparison
      req.originalQuery = { ...req.query };

      next();
    } catch (error) {
      console.error('Query optimization error:', error);
      next();
    }
  };
};

// Optimize query parameters
const optimizeQueryParams = (req, entityType) => {
  const config = QUERY_OPTIMIZATION_CONFIG;
  
  // Set default limit if not provided
  if (!req.query.limit) {
    req.query.limit = config.defaultLimits[entityType] || 20;
  }
  
  // Enforce maximum limits
  const currentLimit = parseInt(req.query.limit);
  const maxLimit = config.maxLimits[entityType] || 100;
  
  if (currentLimit > maxLimit) {
    req.query.limit = maxLimit;
    console.log(`⚠️ Limit reduced from ${currentLimit} to ${maxLimit} for ${entityType}`);
  }
  
  // Optimize page parameter
  if (req.query.page) {
    const page = parseInt(req.query.page);
    if (page < 1) {
      req.query.page = 1;
    }
  }
  
  // Add lean parameter for read-only queries
  if (shouldUseLean(req.originalUrl)) {
    req.query.lean = 'true';
  }
  
  // Optimize sort parameters
  optimizeSortParams(req, entityType);
  
  // Optimize select fields
  optimizeSelectFields(req, entityType);
};

// Determine entity type from URL
const getEntityTypeFromUrl = (url) => {
  const entityPatterns = {
    'loans': /\/loan/,
    'customers': /\/customer/,
    'users': /\/user/,
    'activities': /\/activity/,
    'expenses': /\/expense/,
    'employees': /\/employee/,
    'applications': /\/application/,
    'repayments': /\/repayment/,
    'tasks': /\/task/,
    'attendances': /\/attendance/
  };
  
  for (const [entityType, pattern] of Object.entries(entityPatterns)) {
    if (pattern.test(url)) {
      return entityType;
    }
  }
  
  return null;
};

// Check if query should use lean
const shouldUseLean = (url) => {
  return QUERY_OPTIMIZATION_CONFIG.leanQueries.some(pattern => 
    url.includes(pattern)
  );
};

// Optimize sort parameters
const optimizeSortParams = (req, entityType) => {
  const defaultSorts = {
    loans: { createdAt: -1 },
    customers: { createdAt: -1 },
    users: { createdAt: -1 },
    activities: { timestamp: -1 },
    expenses: { expenseDate: -1 },
    employees: { createdAt: -1 },
    applications: { createdAt: -1 },
    repayments: { paymentDate: -1 },
    tasks: { dueDate: 1, priority: -1 },
    attendances: { date: -1 }
  };
  
  if (!req.query.sortBy && !req.query.sort) {
    const defaultSort = defaultSorts[entityType];
    if (defaultSort) {
      req.query.sortBy = Object.keys(defaultSort)[0];
      req.query.sortOrder = defaultSort[Object.keys(defaultSort)[0]] === -1 ? 'desc' : 'asc';
    }
  }
};

// Optimize select fields
const optimizeSelectFields = (req, entityType) => {
  const excludedFields = QUERY_OPTIMIZATION_CONFIG.excludedFields[entityType] || [];
  
  if (excludedFields.length > 0 && !req.query.select) {
    // This would be applied in the controller to exclude unnecessary fields
    req.query.excludeFields = excludedFields.join(' ');
  }
};

// Enhanced query builder for controllers
export const buildOptimizedQuery = (model, req, options = {}) => {
  const {
    defaultSort = { createdAt: -1 },
    allowedFilters = [],
    allowedSorts = [],
    maxLimit = 100,
    useLean = true
  } = options;

  // Build filter object
  const filter = {};
  allowedFilters.forEach(field => {
    if (req.query[field]) {
      filter[field] = req.query[field];
    }
  });

  // Build sort object
  let sort = defaultSort;
  if (req.query.sortBy && allowedSorts.includes(req.query.sortBy)) {
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    sort = { [req.query.sortBy]: sortOrder };
  }

  // Build query
  let query = model.find(filter);

  // Apply pagination
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, maxLimit);
  const skip = (page - 1) * limit;

  query = query.skip(skip).limit(limit);

  // Apply sorting
  query = query.sort(sort);

  // Apply lean if requested
  if (useLean && req.query.lean === 'true') {
    query = query.lean();
  }

  // Apply field selection
  if (req.query.select) {
    query = query.select(req.query.select);
  }

  // Apply field exclusion
  if (req.query.excludeFields) {
    const excludeFields = req.query.excludeFields.split(' ').join(' -');
    query = query.select(`-${excludeFields}`);
  }

  return query;
};

// Performance monitoring for queries
export const queryPerformanceMonitor = (req, res, next) => {
  const startTime = Date.now();
  
  // Override res.json to measure response time
  const originalJson = res.json;
  res.json = function(data) {
    const responseTime = Date.now() - startTime;
    
    // Log slow queries
    if (responseTime > 1000) {
      console.warn(`🐌 Slow query detected: ${req.method} ${req.originalUrl} - ${responseTime}ms`);
    }
    
    // Add performance metadata
    if (data && typeof data === 'object') {
      data._performance = {
        responseTime,
        timestamp: new Date().toISOString(),
        optimized: req.queryOptimization?.optimized || false
      };
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

// Database connection health check
export const checkDatabaseHealth = async () => {
  try {
    const startTime = Date.now();
    await mongoose.connection.db.admin().ping();
    const responseTime = Date.now() - startTime;
    
    return {
      healthy: true,
      responseTime,
      status: mongoose.connection.readyState,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
      status: mongoose.connection.readyState,
      timestamp: new Date().toISOString()
    };
  }
};

// Query statistics tracking
const queryStats = {
  totalQueries: 0,
  slowQueries: 0,
  averageResponseTime: 0,
  entityTypeStats: {}
};

export const getQueryStats = () => {
  return {
    ...queryStats,
    timestamp: new Date().toISOString()
  };
};

export default queryOptimizer;
