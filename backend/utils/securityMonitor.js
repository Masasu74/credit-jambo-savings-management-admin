import { logActivity } from './logActivity.js';
import User from '../models/userModel.js';
import Session from '../models/sessionModel.js';

// Security monitoring configuration
const SECURITY_CONFIG = {
  // Failed login thresholds
  maxFailedLogins: 5,
  failedLoginWindow: 15 * 60 * 1000, // 15 minutes
  
  // Suspicious activity thresholds
  maxRequestsPerMinute: 100,
  maxRequestsPerHour: 1000,
  maxConcurrentSessions: 3,
  
  // Geographic restrictions
  allowedCountries: ['RW', 'KE', 'UG', 'TZ'], // Rwanda, Kenya, Uganda, Tanzania
  
  // Time-based restrictions
  allowedHours: {
    start: 6, // 6 AM
    end: 22   // 10 PM
  },
  
  // IP-based restrictions
  maxFailedAttemptsPerIP: 10,
  ipBlockDuration: 60 * 60 * 1000, // 1 hour
  
  // Alert thresholds
  alertThresholds: {
    failedLogins: 3,
    suspiciousRequests: 50,
    concurrentSessions: 2,
    unusualActivity: 5
  }
};

class SecurityMonitor {
  constructor() {
    this.activityLog = new Map();
    this.ipBlacklist = new Map();
    this.suspiciousIPs = new Map();
    this.userSessions = new Map();
    this.alerts = [];
  }

  // Monitor login attempts
  async monitorLoginAttempt(userId, email, ip, userAgent, success) {
    const key = `login_${ip}`;
    const now = Date.now();
    
    // Initialize activity log for this IP
    if (!this.activityLog.has(key)) {
      this.activityLog.set(key, []);
    }
    
    const attempts = this.activityLog.get(key);
    attempts.push({
      timestamp: now,
      userId,
      email,
      ip,
      userAgent,
      success
    });
    
    // Remove old attempts outside the window
    const cutoff = now - SECURITY_CONFIG.failedLoginWindow;
    const recentAttempts = attempts.filter(attempt => attempt.timestamp > cutoff);
    this.activityLog.set(key, recentAttempts);
    
    // Check for suspicious activity
    const failedAttempts = recentAttempts.filter(attempt => !attempt.success);
    
    if (failedAttempts.length >= SECURITY_CONFIG.alertThresholds.failedLogins) {
      await this.triggerAlert('failed_login_threshold', {
        ip,
        failedAttempts: failedAttempts.length,
        attempts: failedAttempts
      });
    }
    
    // Block IP if too many failed attempts
    if (failedAttempts.length >= SECURITY_CONFIG.maxFailedAttemptsPerIP) {
      this.blockIP(ip, SECURITY_CONFIG.ipBlockDuration);
      await this.triggerAlert('ip_blocked', {
        ip,
        reason: 'Too many failed login attempts',
        duration: SECURITY_CONFIG.ipBlockDuration
      });
    }
    
    // Log the attempt
    await logActivity({
      user: userId,
      action: success ? 'login_success' : 'login_failed',
      entityType: 'User',
      entityId: userId,
      details: {
        ip,
        userAgent,
        email,
        success,
        timestamp: now
      }
    });
  }

  // Monitor API requests
  async monitorAPIRequest(userId, endpoint, method, ip, userAgent) {
    const key = `api_${ip}`;
    const now = Date.now();
    
    // Initialize activity log for this IP
    if (!this.activityLog.has(key)) {
      this.activityLog.set(key, []);
    }
    
    const requests = this.activityLog.get(key);
    requests.push({
      timestamp: now,
      userId,
      endpoint,
      method,
      ip,
      userAgent
    });
    
    // Remove old requests (keep last hour)
    const cutoff = now - (60 * 60 * 1000);
    const recentRequests = requests.filter(req => req.timestamp > cutoff);
    this.activityLog.set(key, recentRequests);
    
    // Check for suspicious activity
    const requestsPerMinute = recentRequests.filter(
      req => req.timestamp > now - (60 * 1000)
    ).length;
    
    if (requestsPerMinute > SECURITY_CONFIG.maxRequestsPerMinute) {
      await this.triggerAlert('high_request_rate', {
        ip,
        requestsPerMinute,
        endpoint,
        userId
      });
    }
    
    // Check for unusual patterns
    const uniqueEndpoints = new Set(recentRequests.map(req => req.endpoint));
    if (uniqueEndpoints.size > 20) {
      await this.triggerAlert('unusual_endpoint_access', {
        ip,
        uniqueEndpoints: uniqueEndpoints.size,
        endpoints: Array.from(uniqueEndpoints),
        userId
      });
    }
  }

  // Monitor user sessions
  async monitorUserSessions(userId, sessionId, ip, userAgent) {
    const now = Date.now();
    
    // Initialize user sessions
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, []);
    }
    
    const sessions = this.userSessions.get(userId);
    sessions.push({
      sessionId,
      ip,
      userAgent,
      timestamp: now
    });
    
    // Remove old sessions (keep last 24 hours)
    const cutoff = now - (24 * 60 * 60 * 1000);
    const recentSessions = sessions.filter(session => session.timestamp > cutoff);
    this.userSessions.set(userId, recentSessions);
    
    // Check for concurrent sessions
    const activeSessions = recentSessions.filter(
      session => session.timestamp > now - (30 * 60 * 1000) // Last 30 minutes
    );
    
    if (activeSessions.length > SECURITY_CONFIG.maxConcurrentSessions) {
      await this.triggerAlert('concurrent_sessions', {
        userId,
        activeSessions: activeSessions.length,
        sessions: activeSessions
      });
    }
    
    // Check for multiple IPs
    const uniqueIPs = new Set(activeSessions.map(session => session.ip));
    if (uniqueIPs.size > 2) {
      await this.triggerAlert('multiple_ips', {
        userId,
        uniqueIPs: uniqueIPs.size,
        ips: Array.from(uniqueIPs)
      });
    }
  }

  // Monitor file uploads
  async monitorFileUpload(userId, filename, fileSize, fileType, ip) {
    // Check file size
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (fileSize > maxSize) {
      await this.triggerAlert('large_file_upload', {
        userId,
        filename,
        fileSize,
        fileType,
        ip
      });
    }
    
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword'];
    if (!allowedTypes.includes(fileType)) {
      await this.triggerAlert('suspicious_file_type', {
        userId,
        filename,
        fileType,
        ip
      });
    }
    
    // Check for suspicious filenames
    const suspiciousPatterns = [
      /\.(exe|bat|cmd|com|pif|scr|vbs|js|jar|war|ear|apk)$/i,
      /(script|exec|system|cmd|shell)/i
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(filename)) {
        await this.triggerAlert('suspicious_filename', {
          userId,
          filename,
          pattern: pattern.source,
          ip
        });
        break;
      }
    }
  }

  // Monitor data access
  async monitorDataAccess(userId, dataType, action, recordId, ip) {
    const now = Date.now();
    const key = `data_${userId}`;
    
    // Initialize data access log
    if (!this.activityLog.has(key)) {
      this.activityLog.set(key, []);
    }
    
    const accesses = this.activityLog.get(key);
    accesses.push({
      timestamp: now,
      dataType,
      action,
      recordId,
      ip
    });
    
    // Remove old accesses (keep last 24 hours)
    const cutoff = now - (24 * 60 * 60 * 1000);
    const recentAccesses = accesses.filter(access => access.timestamp > cutoff);
    this.activityLog.set(key, recentAccesses);
    
    // Check for unusual data access patterns
    const accessesPerHour = recentAccesses.filter(
      access => access.timestamp > now - (60 * 60 * 1000)
    ).length;
    
    if (accessesPerHour > 100) {
      await this.triggerAlert('high_data_access', {
        userId,
        accessesPerHour,
        dataType,
        action
      });
    }
    
    // Check for bulk data access
    const uniqueRecords = new Set(recentAccesses.map(access => access.recordId));
    if (uniqueRecords.size > 1000) {
      await this.triggerAlert('bulk_data_access', {
        userId,
        uniqueRecords: uniqueRecords.size,
        dataType
      });
    }
  }

  // Check if IP is blocked
  isIPBlocked(ip) {
    const blockInfo = this.ipBlacklist.get(ip);
    if (!blockInfo) return false;
    
    if (Date.now() > blockInfo.until) {
      this.ipBlacklist.delete(ip);
      return false;
    }
    
    return true;
  }

  // Block an IP address
  blockIP(ip, duration) {
    this.ipBlacklist.set(ip, {
      blockedAt: Date.now(),
      until: Date.now() + duration
    });
  }

  // Unblock an IP address
  unblockIP(ip) {
    this.ipBlacklist.delete(ip);
  }

  // Trigger security alert
  async triggerAlert(type, details) {
    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      details,
      timestamp: new Date(),
      severity: this.getAlertSeverity(type)
    };
    
    this.alerts.push(alert);
    
    // Log the alert
    await logActivity({
      user: details.userId || 'system',
      action: 'security_alert',
      entityType: 'Security',
      entityId: alert.id,
      details: {
        alertType: type,
        severity: alert.severity,
        ...details
      }
    });
    
    // Send notification for high severity alerts
    if (alert.severity === 'high' || alert.severity === 'critical') {
      await this.sendSecurityNotification(alert);
    }
    
    // Keep only last 1000 alerts
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }
    
    console.log(`🚨 Security Alert [${alert.severity.toUpperCase()}]: ${type}`, details);
  }

  // Get alert severity
  getAlertSeverity(type) {
    const severityMap = {
      'failed_login_threshold': 'medium',
      'ip_blocked': 'high',
      'high_request_rate': 'medium',
      'unusual_endpoint_access': 'high',
      'concurrent_sessions': 'medium',
      'multiple_ips': 'high',
      'large_file_upload': 'low',
      'suspicious_file_type': 'high',
      'suspicious_filename': 'critical',
      'high_data_access': 'medium',
      'bulk_data_access': 'high'
    };
    
    return severityMap[type] || 'low';
  }

  // Send security notification
  async sendSecurityNotification(alert) {
    try {
      // This would integrate with your notification system
      // For now, we'll just log it
      console.log(`🔔 Security Notification: ${alert.type} - ${alert.severity}`);
      
      // You could send email, SMS, or push notification here
      // await sendEmail({
      //   to: 'security@anchorfinance.com',
      //   subject: `Security Alert: ${alert.type}`,
      //   body: JSON.stringify(alert, null, 2)
      // });
    } catch (error) {
      console.error('Error sending security notification:', error);
    }
  }

  // Get security statistics
  getSecurityStats() {
    const now = Date.now();
    const last24Hours = now - (24 * 60 * 60 * 1000);
    
    const recentAlerts = this.alerts.filter(alert => alert.timestamp > last24Hours);
    const blockedIPs = Array.from(this.ipBlacklist.entries()).filter(
      ([ip, info]) => info.until > now
    );
    
    return {
      totalAlerts: this.alerts.length,
      alertsLast24Hours: recentAlerts.length,
      blockedIPs: blockedIPs.length,
      activeSessions: this.userSessions.size,
      severityBreakdown: {
        low: recentAlerts.filter(a => a.severity === 'low').length,
        medium: recentAlerts.filter(a => a.severity === 'medium').length,
        high: recentAlerts.filter(a => a.severity === 'high').length,
        critical: recentAlerts.filter(a => a.severity === 'critical').length
      }
    };
  }

  // Clean up old data
  cleanup() {
    const now = Date.now();
    
    // Clean up activity logs older than 7 days
    for (const [key, activities] of this.activityLog.entries()) {
      const cutoff = now - (7 * 24 * 60 * 60 * 1000);
      const recentActivities = activities.filter(activity => activity.timestamp > cutoff);
      
      if (recentActivities.length === 0) {
        this.activityLog.delete(key);
      } else {
        this.activityLog.set(key, recentActivities);
      }
    }
    
    // Clean up expired IP blocks
    for (const [ip, blockInfo] of this.ipBlacklist.entries()) {
      if (now > blockInfo.until) {
        this.ipBlacklist.delete(ip);
      }
    }
    
    // Clean up old alerts (keep last 30 days)
    const alertCutoff = now - (30 * 24 * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(alert => alert.timestamp > alertCutoff);
  }
}

// Create singleton instance
const securityMonitor = new SecurityMonitor();

// Cleanup every hour
setInterval(() => {
  securityMonitor.cleanup();
}, 60 * 60 * 1000);

export default securityMonitor;
