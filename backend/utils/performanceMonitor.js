 // Comprehensive Performance Monitoring System
import { performance } from 'perf_hooks';
import { EventEmitter } from 'events';

class PerformanceMonitor extends EventEmitter {
  constructor() {
    super();
    this.metrics = {
      requests: {
        total: 0,
        byMethod: {},
        byEndpoint: {},
        responseTimes: [],
        errors: 0,
        throughput: {
          requestsPerSecond: 0,
          requestsPerMinute: 0,
          requestsPerHour: 0,
          peakThroughput: 0
        }
      },
      latency: {
        p50: 0,
        p95: 0,
        p99: 0,
        average: 0,
        min: Infinity,
        max: 0,
        recent: [] // Last 100 response times
      },
      availability: {
        uptime: 0,
        downtime: 0,
        availabilityPercent: 100,
        lastDownTime: null,
        consecutiveUptime: 0
      },
      userCapacity: {
        currentUsers: 0,
        maxUsers: 0,
        concurrentSessions: 0,
        activeConnections: 0,
        userLoadFactor: 0,
        capacityUtilization: 0
      },
      database: {
        queries: 0,
        slowQueries: 0,
        averageQueryTime: 0,
        connectionPool: {
          active: 0,
          idle: 0,
          total: 0
        },
        queryLatency: {
          p50: 0,
          p95: 0,
          p99: 0,
          average: 0
        }
      },
      memory: {
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        rss: 0,
        memoryPressure: 0
      },
      cache: {
        hits: 0,
        misses: 0,
        hitRate: 0,
        size: 0,
        evictions: 0
      },
      system: {
        cpu: 0,
        uptime: 0,
        loadAverage: [],
        networkIO: {
          bytesIn: 0,
          bytesOut: 0,
          packetsIn: 0,
          packetsOut: 0
        }
      }
    };
    
    this.alerts = [];
    this.thresholds = {
      responseTime: 2000, // 2 seconds
      memoryUsage: 0.8, // 80% of available memory
      cpuUsage: 0.7, // 70% CPU usage
      errorRate: 0.05, // 5% error rate
      throughput: 1000, // requests per minute
      latency: {
        p95: 1000, // 95th percentile latency
        p99: 2000  // 99th percentile latency
      },
      availability: 99.9, // 99.9% availability
      userCapacity: 0.8, // 80% capacity utilization
      databaseLatency: 500 // 500ms database query latency
    };
    
    // Time-based tracking for throughput calculation
    this.requestTimestamps = [];
    this.startTime = Date.now();
    this.lastUptimeCheck = Date.now();
    this.isSystemUp = true;
    
    this.startMonitoring();
  }

  // Start monitoring
  startMonitoring() {
    // Monitor memory usage every 30 seconds
    setInterval(() => this.updateMemoryMetrics(), 30000);
    
    // Monitor system metrics every minute
    setInterval(() => this.updateSystemMetrics(), 60000);
    
    // Generate performance reports every 5 minutes
    setInterval(() => this.generateReport(), 300000);
    
    // Check for alerts every minute
    setInterval(() => this.checkAlerts(), 60000);
    
    console.log('📊 Performance monitoring started');
  }

  // Track request performance
  trackRequest(req, res, next) {
    const startTime = performance.now();
    const method = req.method;
    const endpoint = req.originalUrl.split('?')[0]; // Remove query params
    const timestamp = Date.now();
    
    // Update request counts
    this.metrics.requests.total++;
    this.metrics.requests.byMethod[method] = (this.metrics.requests.byMethod[method] || 0) + 1;
    this.metrics.requests.byEndpoint[endpoint] = (this.metrics.requests.byEndpoint[endpoint] || 0) + 1;
    
    // Track request timestamp for throughput calculation
    this.requestTimestamps.push(timestamp);
    
    // Clean old timestamps (older than 1 hour)
    const oneHourAgo = timestamp - 3600000;
    this.requestTimestamps = this.requestTimestamps.filter(ts => ts > oneHourAgo);
    
    // Override res.json to track response time
    const originalJson = res.json;
    res.json = (data) => {
      const responseTime = performance.now() - startTime;
      this.metrics.requests.responseTimes.push(responseTime);
      
      // Update latency metrics
      this.updateLatencyMetrics(responseTime);
      
      // Keep only last 1000 response times
      if (this.metrics.requests.responseTimes.length > 1000) {
        this.metrics.requests.responseTimes.shift();
      }
      
      // Track errors
      if (data && data.success === false) {
        this.metrics.requests.errors++;
      }
      
      // Update throughput metrics
      this.updateThroughputMetrics();
      
      // Update availability
      this.updateAvailabilityMetrics();
      
      // Emit performance event
      this.emit('request', {
        method,
        endpoint,
        responseTime,
        success: data?.success !== false,
        timestamp: new Date().toISOString()
      });
      
      return originalJson.call(res, data);
    };
    
    next();
  }

  // Track database query performance
  trackDatabaseQuery(query, duration) {
    this.metrics.database.queries++;
    
    if (duration > 1000) { // Slow query threshold
      this.metrics.database.slowQueries++;
      this.emit('slowQuery', { query, duration, timestamp: new Date().toISOString() });
    }
    
    // Update average query time
    const currentAvg = this.metrics.database.averageQueryTime;
    const totalQueries = this.metrics.database.queries;
    this.metrics.database.averageQueryTime = (currentAvg * (totalQueries - 1) + duration) / totalQueries;
    
    // Update database latency metrics
    this.updateDatabaseLatencyMetrics(duration);
  }

  // Update latency metrics
  updateLatencyMetrics(responseTime) {
    this.metrics.latency.recent.push(responseTime);
    
    // Keep only last 100 response times for recent calculations
    if (this.metrics.latency.recent.length > 100) {
      this.metrics.latency.recent.shift();
    }
    
    // Update min/max
    this.metrics.latency.min = Math.min(this.metrics.latency.min, responseTime);
    this.metrics.latency.max = Math.max(this.metrics.latency.max, responseTime);
    
    // Calculate percentiles
    const sortedTimes = [...this.metrics.latency.recent].sort((a, b) => a - b);
    const len = sortedTimes.length;
    
    if (len > 0) {
      this.metrics.latency.p50 = sortedTimes[Math.floor(len * 0.5)];
      this.metrics.latency.p95 = sortedTimes[Math.floor(len * 0.95)];
      this.metrics.latency.p99 = sortedTimes[Math.floor(len * 0.99)];
      this.metrics.latency.average = sortedTimes.reduce((sum, time) => sum + time, 0) / len;
    }
  }

  // Update throughput metrics
  updateThroughputMetrics() {
    const now = Date.now();
    const oneSecondAgo = now - 1000;
    const oneMinuteAgo = now - 60000;
    const oneHourAgo = now - 3600000;
    
    // Calculate requests per second
    const requestsLastSecond = this.requestTimestamps.filter(ts => ts > oneSecondAgo).length;
    this.metrics.requests.throughput.requestsPerSecond = requestsLastSecond;
    
    // Calculate requests per minute
    const requestsLastMinute = this.requestTimestamps.filter(ts => ts > oneMinuteAgo).length;
    this.metrics.requests.throughput.requestsPerMinute = requestsLastMinute;
    
    // Calculate requests per hour
    const requestsLastHour = this.requestTimestamps.filter(ts => ts > oneHourAgo).length;
    this.metrics.requests.throughput.requestsPerHour = requestsLastHour;
    
    // Update peak throughput
    this.metrics.requests.throughput.peakThroughput = Math.max(
      this.metrics.requests.throughput.peakThroughput,
      requestsLastMinute
    );
  }

  // Update availability metrics
  updateAvailabilityMetrics() {
    const now = Date.now();
    const uptime = now - this.startTime;
    
    this.metrics.availability.uptime = uptime;
    this.metrics.availability.consecutiveUptime = now - this.lastUptimeCheck;
    
    // Calculate availability percentage
    const totalTime = uptime + this.metrics.availability.downtime;
    if (totalTime > 0) {
      this.metrics.availability.availabilityPercent = (uptime / totalTime) * 100;
    }
    
    this.isSystemUp = true;
  }

  // Update database latency metrics
  updateDatabaseLatencyMetrics(duration) {
    // This would need to track database query times separately
    // For now, we'll use a simplified approach
    const currentAvg = this.metrics.database.queryLatency.average;
    const totalQueries = this.metrics.database.queries;
    
    if (totalQueries === 1) {
      this.metrics.database.queryLatency.average = duration;
      this.metrics.database.queryLatency.p50 = duration;
      this.metrics.database.queryLatency.p95 = duration;
      this.metrics.database.queryLatency.p99 = duration;
    } else {
      this.metrics.database.queryLatency.average = (currentAvg * (totalQueries - 1) + duration) / totalQueries;
    }
  }

  // Track user capacity
  updateUserCapacity(currentUsers, maxUsers, concurrentSessions, activeConnections) {
    this.metrics.userCapacity.currentUsers = currentUsers;
    this.metrics.userCapacity.maxUsers = maxUsers;
    this.metrics.userCapacity.concurrentSessions = concurrentSessions;
    this.metrics.userCapacity.activeConnections = activeConnections;
    
    // Calculate capacity utilization
    if (maxUsers > 0) {
      this.metrics.userCapacity.capacityUtilization = (currentUsers / maxUsers) * 100;
    }
    
    // Calculate user load factor
    if (maxUsers > 0) {
      this.metrics.userCapacity.userLoadFactor = currentUsers / maxUsers;
    }
  }

  // Update memory metrics
  updateMemoryMetrics() {
    const memUsage = process.memoryUsage();
    this.metrics.memory = {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss
    };
    
    // Check memory threshold
    const memoryUsageRatio = memUsage.heapUsed / memUsage.heapTotal;
    if (memoryUsageRatio > this.thresholds.memoryUsage) {
      this.createAlert('HIGH_MEMORY_USAGE', {
        usage: memoryUsageRatio,
        threshold: this.thresholds.memoryUsage,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal
      });
    }
  }

  // Update system metrics
  updateSystemMetrics() {
    const startUsage = process.cpuUsage();
    const startTime = Date.now();
    
    // Simple CPU usage calculation
    setTimeout(() => {
      const endUsage = process.cpuUsage(startUsage);
      const endTime = Date.now();
      const cpuUsage = (endUsage.user + endUsage.system) / ((endTime - startTime) * 1000);
      
      this.metrics.system.cpu = cpuUsage;
      this.metrics.system.uptime = process.uptime();
      
      // Check CPU threshold
      if (cpuUsage > this.thresholds.cpuUsage) {
        this.createAlert('HIGH_CPU_USAGE', {
          usage: cpuUsage,
          threshold: this.thresholds.cpuUsage
        });
      }
    }, 100);
  }

  // Update cache metrics
  updateCacheMetrics(cacheStats) {
    this.metrics.cache = {
      hits: cacheStats.hits || 0,
      misses: cacheStats.misses || 0,
      hitRate: cacheStats.hitRate || 0,
      size: cacheStats.memoryCacheSize || 0
    };
  }

  // Create performance alert
  createAlert(type, data) {
    const alert = {
      type,
      data,
      timestamp: new Date().toISOString(),
      severity: this.getAlertSeverity(type)
    };
    
    this.alerts.push(alert);
    
    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }
    
    this.emit('alert', alert);
    
    // Log critical alerts
    if (alert.severity === 'critical') {
      console.error(`🚨 CRITICAL ALERT: ${type}`, data);
    } else if (alert.severity === 'warning') {
      console.warn(`⚠️ WARNING: ${type}`, data);
    }
  }

  // Get alert severity
  getAlertSeverity(type) {
    const severityMap = {
      'HIGH_MEMORY_USAGE': 'warning',
      'HIGH_CPU_USAGE': 'warning',
      'SLOW_RESPONSE_TIME': 'warning',
      'HIGH_ERROR_RATE': 'critical',
      'DATABASE_CONNECTION_ISSUE': 'critical',
      'HIGH_P95_LATENCY': 'warning',
      'HIGH_P99_LATENCY': 'critical',
      'HIGH_THROUGHPUT': 'info',
      'LOW_AVAILABILITY': 'critical',
      'HIGH_CAPACITY_UTILIZATION': 'warning',
      'HIGH_DATABASE_LATENCY': 'warning'
    };
    
    return severityMap[type] || 'info';
  }

  // Check for alerts
  checkAlerts() {
    // Check response time
    const avgResponseTime = this.getAverageResponseTime();
    if (avgResponseTime > this.thresholds.responseTime) {
      this.createAlert('SLOW_RESPONSE_TIME', {
        averageResponseTime: avgResponseTime,
        threshold: this.thresholds.responseTime
      });
    }
    
    // Check latency percentiles
    if (this.metrics.latency.p95 > this.thresholds.latency.p95) {
      this.createAlert('HIGH_P95_LATENCY', {
        p95Latency: this.metrics.latency.p95,
        threshold: this.thresholds.latency.p95
      });
    }
    
    if (this.metrics.latency.p99 > this.thresholds.latency.p99) {
      this.createAlert('HIGH_P99_LATENCY', {
        p99Latency: this.metrics.latency.p99,
        threshold: this.thresholds.latency.p99
      });
    }
    
    // Check throughput
    if (this.metrics.requests.throughput.requestsPerMinute > this.thresholds.throughput) {
      this.createAlert('HIGH_THROUGHPUT', {
        requestsPerMinute: this.metrics.requests.throughput.requestsPerMinute,
        threshold: this.thresholds.throughput
      });
    }
    
    // Check availability
    if (this.metrics.availability.availabilityPercent < this.thresholds.availability) {
      this.createAlert('LOW_AVAILABILITY', {
        availabilityPercent: this.metrics.availability.availabilityPercent,
        threshold: this.thresholds.availability
      });
    }
    
    // Check user capacity
    if (this.metrics.userCapacity.capacityUtilization > this.thresholds.userCapacity * 100) {
      this.createAlert('HIGH_CAPACITY_UTILIZATION', {
        capacityUtilization: this.metrics.userCapacity.capacityUtilization,
        threshold: this.thresholds.userCapacity * 100
      });
    }
    
    // Check database latency
    if (this.metrics.database.queryLatency.average > this.thresholds.databaseLatency) {
      this.createAlert('HIGH_DATABASE_LATENCY', {
        averageQueryTime: this.metrics.database.queryLatency.average,
        threshold: this.thresholds.databaseLatency
      });
    }
    
    // Check error rate
    const errorRate = this.getErrorRate();
    if (errorRate > this.thresholds.errorRate) {
      this.createAlert('HIGH_ERROR_RATE', {
        errorRate,
        threshold: this.thresholds.errorRate
      });
    }
  }

  // Generate performance report
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: this.getMetrics(),
      recommendations: this.generateRecommendations(),
      alerts: this.alerts.slice(-10) // Last 10 alerts
    };
    
    this.emit('report', report);
    
    // Log summary
    console.log('📊 Performance Report:', {
      requests: this.metrics.requests.total,
      avgResponseTime: this.getAverageResponseTime().toFixed(2) + 'ms',
      errorRate: (this.getErrorRate() * 100).toFixed(2) + '%',
      memoryUsage: (this.metrics.memory.heapUsed / this.metrics.memory.heapTotal * 100).toFixed(1) + '%',
      cacheHitRate: this.metrics.cache.hitRate.toFixed(1) + '%'
    });
    
    return report;
  }

  // Get current metrics
  getMetrics() {
    return {
      ...this.metrics,
      calculated: {
        averageResponseTime: this.getAverageResponseTime(),
        errorRate: this.getErrorRate(),
        memoryUsageRatio: this.metrics.memory.heapUsed / this.metrics.memory.heapTotal,
        requestsPerMinute: this.getRequestsPerMinute()
      }
    };
  }

  // Calculate average response time
  getAverageResponseTime() {
    const times = this.metrics.requests.responseTimes;
    if (times.length === 0) return 0;
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  // Calculate error rate
  getErrorRate() {
    if (this.metrics.requests.total === 0) return 0;
    return this.metrics.requests.errors / this.metrics.requests.total;
  }

  // Calculate requests per minute
  getRequestsPerMinute() {
    // This would need to be implemented with time-based tracking
    return this.metrics.requests.total; // Simplified for now
  }

  // Generate performance recommendations
  generateRecommendations() {
    const recommendations = [];
    
    // Memory recommendations
    const memoryUsage = this.metrics.memory.heapUsed / this.metrics.memory.heapTotal;
    if (memoryUsage > 0.7) {
      recommendations.push({
        type: 'memory',
        priority: 'high',
        message: 'Consider implementing memory optimization strategies',
        action: 'Review memory usage patterns and implement garbage collection optimization'
      });
    }
    
    // Response time recommendations
    const avgResponseTime = this.getAverageResponseTime();
    if (avgResponseTime > 1000) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: 'Response times are slow, consider database optimization',
        action: 'Review database queries and implement caching strategies'
      });
    }
    
    // Cache recommendations
    if (this.metrics.cache.hitRate < 50) {
      recommendations.push({
        type: 'cache',
        priority: 'medium',
        message: 'Cache hit rate is low',
        action: 'Review cache keys and implement cache warming strategies'
      });
    }
    
    return recommendations;
  }

  // Get performance health status
  getHealthStatus() {
    const avgResponseTime = this.getAverageResponseTime();
    const errorRate = this.getErrorRate();
    const memoryUsage = this.metrics.memory.heapUsed / this.metrics.memory.heapTotal;
    
    let status = 'healthy';
    let issues = [];
    
    if (avgResponseTime > this.thresholds.responseTime) {
      status = 'degraded';
      issues.push('Slow response times');
    }
    
    if (errorRate > this.thresholds.errorRate) {
      status = 'unhealthy';
      issues.push('High error rate');
    }
    
    if (memoryUsage > this.thresholds.memoryUsage) {
      status = 'degraded';
      issues.push('High memory usage');
    }
    
    return {
      status,
      issues,
      timestamp: new Date().toISOString(),
      metrics: {
        averageResponseTime: avgResponseTime,
        errorRate,
        memoryUsage,
        uptime: this.metrics.system.uptime
      }
    };
  }
}

// Global performance monitor instance
const performanceMonitor = new PerformanceMonitor();

// Middleware for tracking requests
export const performanceMiddleware = (req, res, next) => {
  performanceMonitor.trackRequest(req, res, next);
};

// Export functions
export const trackDatabaseQuery = (query, duration) => {
  performanceMonitor.trackDatabaseQuery(query, duration);
};

export const updateCacheMetrics = (cacheStats) => {
  performanceMonitor.updateCacheMetrics(cacheStats);
};

export const updateUserCapacity = (currentUsers, maxUsers, concurrentSessions, activeConnections) => {
  performanceMonitor.updateUserCapacity(currentUsers, maxUsers, concurrentSessions, activeConnections);
};

export const getPerformanceMetrics = () => {
  return performanceMonitor.getMetrics();
};

export const getHealthStatus = () => {
  return performanceMonitor.getHealthStatus();
};

export const generatePerformanceReport = () => {
  return performanceMonitor.generateReport();
};

// New export functions for enhanced metrics
export const getThroughputMetrics = () => {
  return performanceMonitor.metrics.requests.throughput;
};

export const getLatencyMetrics = () => {
  return performanceMonitor.metrics.latency;
};

export const getAvailabilityMetrics = () => {
  return performanceMonitor.metrics.availability;
};

export const getUserCapacityMetrics = () => {
  return performanceMonitor.metrics.userCapacity;
};

export const getDatabaseLatencyMetrics = () => {
  return performanceMonitor.metrics.database.queryLatency;
};

export default performanceMonitor;
