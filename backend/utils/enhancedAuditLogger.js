import AuditTrail from '../models/auditTrailModel.js';
import Session from '../models/sessionModel.js';

/**
 * Enhanced Audit Logger for comprehensive system activity tracking
 */
class EnhancedAuditLogger {
  /**
   * Log an audit trail entry with enhanced security analysis
   * @param {Object} options - Audit logging options
   * @param {string} options.userId - User ID who performed the action
   * @param {string} options.sessionId - Session ID (optional)
   * @param {string} options.action - Action performed
   * @param {string} options.entityType - Type of entity affected
   * @param {string} options.entityId - Entity ID (optional)
   * @param {Object} options.details - Additional details
   * @param {Object} options.requestInfo - Request information
   * @param {Object} options.changes - Before/after changes
   * @param {string} options.riskLevel - Risk level (low, medium, high, critical)
   * @param {boolean} options.suspiciousActivity - Whether activity is suspicious
   * @param {Array} options.flags - Security flags
   */
  static async logActivity(options) {
    try {
      const {
        userId,
        sessionId,
        action,
        entityType,
        entityId,
        details = {},
        requestInfo = {},
        changes = {},
        riskLevel = 'low',
        suspiciousActivity = false,
        flags = []
      } = options;

      // Analyze security risk
      const securityAnalysis = await this.analyzeSecurityRisk({
        userId,
        action,
        entityType,
        details,
        requestInfo
      });

      const auditEntry = new AuditTrail({
        user: userId,
        sessionId,
        action,
        entityType,
        entityId,
        details,
        requestInfo,
        changes,
        security: {
          riskLevel: securityAnalysis.riskLevel || riskLevel,
          suspiciousActivity: securityAnalysis.suspiciousActivity || suspiciousActivity,
          flags: [...flags, ...securityAnalysis.flags]
        }
      });

      await auditEntry.save();

      // Update session activity if sessionId is provided
      if (sessionId) {
        await this.updateSessionActivity(sessionId);
      }

      // Log to console in development (only for high-risk activities)
      if (process.env.NODE_ENV === 'development' && (securityAnalysis.riskLevel === 'high' || securityAnalysis.riskLevel === 'critical' || securityAnalysis.suspiciousActivity)) {
        console.log('🔍 Audit Trail:', {
          action,
          entityType,
          entityId,
          riskLevel: auditEntry.security.riskLevel,
          suspiciousActivity: auditEntry.security.suspiciousActivity
        });
      }

      return auditEntry;
    } catch (error) {
      console.error('Enhanced audit logging error:', error);
      // Don't throw error to avoid breaking main functionality
    }
  }

  /**
   * Analyze security risk based on activity patterns
   * @param {Object} options - Analysis options
   * @returns {Object} Security analysis result
   */
  static async analyzeSecurityRisk(options) {
    const { userId, action, entityType, details, requestInfo } = options;
    const analysis = {
      riskLevel: 'low',
      suspiciousActivity: false,
      flags: []
    };

    try {
      // Check for high-risk actions
      const highRiskActions = [
        'user_deleted',
        'system_settings_updated',
        'all_sessions_terminated',
        'loan_approved',
        'loan_rejected',
        'customer_deleted'
      ];

      if (highRiskActions.includes(action)) {
        analysis.riskLevel = 'high';
        analysis.flags.push('high_risk_action');
      }

      // Check for critical actions
      const criticalActions = [
        'system_shutdown',
        'database_backup',
        'user_role_changed',
        'security_settings_modified'
      ];

      if (criticalActions.includes(action)) {
        analysis.riskLevel = 'critical';
        analysis.flags.push('critical_action');
      }

      // Check for unusual activity patterns
      const recentActivities = await AuditTrail.find({
        user: userId,
        timestamp: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // Last 5 minutes
      });

      if (recentActivities.length > 20) {
        analysis.riskLevel = Math.max(analysis.riskLevel === 'critical' ? 4 : 
                                    analysis.riskLevel === 'high' ? 3 :
                                    analysis.riskLevel === 'medium' ? 2 : 1, 3);
        analysis.suspiciousActivity = true;
        analysis.flags.push('high_activity_rate');
      }

      // Check for multiple failed attempts
      const failedAttempts = recentActivities.filter(activity => 
        activity.action.includes('failed') || activity.action.includes('error')
      );

      if (failedAttempts.length > 5) {
        analysis.riskLevel = Math.max(analysis.riskLevel === 'critical' ? 4 : 
                                    analysis.riskLevel === 'high' ? 3 :
                                    analysis.riskLevel === 'medium' ? 2 : 1, 3);
        analysis.suspiciousActivity = true;
        analysis.flags.push('multiple_failures');
      }

      // Check for unusual IP addresses or user agents
      if (requestInfo.ipAddress) {
        const ipActivities = await AuditTrail.find({
          user: userId,
          'requestInfo.ipAddress': requestInfo.ipAddress,
          timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
        });

        if (ipActivities.length === 0) {
          analysis.flags.push('new_ip_address');
        }
      }

      // Convert numeric risk level back to string
      if (typeof analysis.riskLevel === 'number') {
        analysis.riskLevel = analysis.riskLevel === 4 ? 'critical' :
                           analysis.riskLevel === 3 ? 'high' :
                           analysis.riskLevel === 2 ? 'medium' : 'low';
      }

    } catch (error) {
      console.error('Security analysis error:', error);
    }

    return analysis;
  }

  /**
   * Update session activity
   * @param {string} sessionId - Session ID
   */
  static async updateSessionActivity(sessionId) {
    try {
      const session = await Session.findOne({ sessionId, status: 'active' });
      if (session) {
        await session.updateActivity();
      }
    } catch (error) {
      console.error('Session activity update error:', error);
    }
  }

  /**
   * Log user login activity
   * @param {Object} options - Login options
   */
  static async logUserLogin(options) {
    const { userId, sessionId, ipAddress, userAgent, success = true } = options;

    await this.logActivity({
      userId,
      sessionId,
      action: success ? 'user_logged_in' : 'login_failed',
      entityType: 'user',
      entityId: userId,
      details: {
        success,
        ipAddress,
        userAgent
      },
      requestInfo: {
        ipAddress,
        userAgent
      },
      riskLevel: success ? 'low' : 'medium'
    });
  }

  /**
   * Log user logout activity
   * @param {Object} options - Logout options
   */
  static async logUserLogout(options) {
    const { userId, sessionId, reason = 'user_logout' } = options;

    await this.logActivity({
      userId,
      sessionId,
      action: 'user_logged_out',
      entityType: 'user',
      entityId: userId,
      details: {
        reason
      },
      riskLevel: 'low'
    });
  }

  /**
   * Log loan-related activities
   * @param {Object} options - Loan activity options
   */
  static async logLoanActivity(options) {
    const { userId, sessionId, action, loanId, details, changes } = options;

    await this.logActivity({
      userId,
      sessionId,
      action,
      entityType: 'loan',
      entityId: loanId,
      details,
      changes,
      riskLevel: ['loan_approved', 'loan_rejected', 'loan_deleted'].includes(action) ? 'high' : 'medium'
    });
  }

  /**
   * Log customer-related activities
   * @param {Object} options - Customer activity options
   */
  static async logCustomerActivity(options) {
    const { userId, sessionId, action, customerId, details, changes } = options;

    await this.logActivity({
      userId,
      sessionId,
      action,
      entityType: 'customer',
      entityId: customerId,
      details,
      changes,
      riskLevel: ['customer_deleted'].includes(action) ? 'high' : 'medium'
    });
  }

  /**
   * Log system settings changes
   * @param {Object} options - Settings change options
   */
  static async logSettingsChange(options) {
    const { userId, sessionId, setting, oldValue, newValue } = options;

    await this.logActivity({
      userId,
      sessionId,
      action: 'system_settings_updated',
      entityType: 'settings',
      details: {
        setting,
        oldValue,
        newValue
      },
      changes: {
        before: { [setting]: oldValue },
        after: { [setting]: newValue },
        fieldsChanged: [setting]
      },
      riskLevel: 'high'
    });
  }

  /**
   * Log security events
   * @param {Object} options - Security event options
   */
  static async logSecurityEvent(options) {
    const { userId, sessionId, event, details, riskLevel = 'high' } = options;

    await this.logActivity({
      userId,
      sessionId,
      action: 'security_alert',
      entityType: 'security',
      details: {
        event,
        ...details
      },
      riskLevel,
      suspiciousActivity: true
    });
  }
}

export default EnhancedAuditLogger;
