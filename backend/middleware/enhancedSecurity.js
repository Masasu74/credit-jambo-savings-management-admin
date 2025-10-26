import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import Redis from 'ioredis';
import crypto from 'crypto';
import User from '../models/userModel.js';
import MFA from '../models/mfaModel.js';
import { logActivity } from '../utils/logActivity.js';

// Redis client for rate limiting and session management
let redis = null;
let redisStore = null;

// Try to connect to Redis if REDIS_URL is set
if (process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL);
    redisStore = new Redis({
      host: process.env.REDIS_HOST || 'redis',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || 'SecureRedisPass123',
      keyPrefix: 'rate_limit:'
    });
    console.log('✅ Redis connected successfully');
  } catch (error) {
    console.log('⚠️  Redis connection failed, using in-memory fallback');
    redis = null;
    redisStore = null;
  }
} else {
  console.log('⚠️  Redis not configured, using in-memory fallback');
}

// Rate limiting configurations
const createRateLimiter = (windowMs, max, message) => {
  const config = {
    windowMs,
    max,
    message: {
      success: false,
      message: message || 'Too many requests, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
  };
  
  // Use Redis store if available, otherwise use default in-memory store
  if (redisStore) {
    config.store = redisStore;
  }
  
  return rateLimit(config);
};

// General API rate limiter - Increased for production
export const apiRateLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  500, // Increased from 100 to 500 requests per window for production
  'API rate limit exceeded. Please try again later.'
);

// Authentication rate limiter
export const authRateLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  10, // Increased from 5 to 10 login attempts per window
  'Too many login attempts, please try again later'
);

// MFA rate limiter
export const mfaRateLimiter = createRateLimiter(
  5 * 60 * 1000, // 5 minutes
  5, // Increased from 3 to 5 MFA attempts per window
  'Too many MFA attempts, please try again later'
);

// Special rate limiter for loan endpoints - More permissive
export const loanApiRateLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  1000, // 1000 requests per window for loan operations
  'Loan API rate limit exceeded. Please try again later.'
);

// Enhanced JWT verification middleware
export const verifyJWT = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Check if token is blacklisted
    if (redis) {
      const isBlacklisted = await redis.get(`blacklist:${token}`);
      if (isBlacklisted) {
        return res.status(401).json({
          success: false,
          message: 'Token has been revoked'
        });
      }
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists and is active
    const user = await User.findById(decoded.userId).select('-password');
    if (!user || user.isDeleted) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    // Check if user is locked
    if (user.isLocked) {
      return res.status(401).json({
        success: false,
        message: 'Account is locked'
      });
    }

    // Add user to request
    req.user = user;
    
    // Log successful authentication
    await logActivity({
      user: user._id,
      action: 'api_authentication',
      entityType: 'User',
      entityId: user._id,
      details: {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.originalUrl
      }
    });

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    console.error('JWT verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// MFA verification middleware
export const verifyMFA = async (req, res, next) => {
  try {
    const { mfaToken, mfaType = 'totp' } = req.body;
    
    if (!mfaToken) {
      return res.status(400).json({
        success: false,
        message: 'MFA token required'
      });
    }

    const mfa = await MFA.findOne({ user: req.user._id });
    if (!mfa || !mfa.isEnabled) {
      return res.status(400).json({
        success: false,
        message: 'MFA not enabled'
      });
    }

    // Check if MFA is locked
    if (mfa.isLockedOut()) {
      return res.status(423).json({
        success: false,
        message: 'MFA is temporarily locked due to too many failed attempts'
      });
    }

    let isValid = false;

    switch (mfaType) {
      case 'totp':
        isValid = mfa.verifyTOTP(mfaToken);
        break;
      case 'sms':
        isValid = mfa.verifySMSCode(mfaToken);
        break;
      case 'email':
        isValid = mfa.verifyEmailCode(mfaToken);
        break;
      case 'backup':
        isValid = mfa.verifyBackupCode(mfaToken);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid MFA type'
        });
    }

    if (!isValid) {
      mfa.failedAttempts++;
      
      // Lock MFA if too many failed attempts
      if (mfa.failedAttempts >= mfa.maxAttempts) {
        mfa.isLocked = true;
        mfa.lockoutUntil = new Date(Date.now() + mfa.lockoutDuration * 60 * 1000);
      }
      
      await mfa.save();
      
      return res.status(401).json({
        success: false,
        message: 'Invalid MFA token'
      });
    }

    // Reset failed attempts on successful verification
    mfa.resetFailedAttempts();
    mfa.lastLogin = new Date();
    await mfa.save();

    // Log successful MFA verification
    await logActivity({
      user: req.user._id,
      action: 'mfa_verification_success',
      entityType: 'MFA',
      entityId: mfa._id,
      details: { mfaType }
    });

    next();
  } catch (error) {
    console.error('MFA verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'MFA verification error'
    });
  }
};

// API Key verification middleware
export const verifyAPIKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.headers.authorization?.replace('Bearer ', '');
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key required'
      });
    }

    // Check if API key exists and is valid
    if (!redis) {
      return res.status(401).json({
        success: false,
        message: 'API key verification not available'
      });
    }
    
    const keyData = await redis.get(`api_key:${apiKey}`);
    if (!keyData) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key'
      });
    }

    const keyInfo = JSON.parse(keyData);
    
    // Check if key is active
    if (!keyInfo.isActive) {
      return res.status(401).json({
        success: false,
        message: 'API key is inactive'
      });
    }

    // Check if key has expired
    if (keyInfo.expiresAt && new Date() > new Date(keyInfo.expiresAt)) {
      return res.status(401).json({
        success: false,
        message: 'API key has expired'
      });
    }

    // Check permissions
    if (keyInfo.permissions && keyInfo.permissions.length > 0) {
      const requiredPermission = req.baseUrl.split('/')[2]; // Extract resource from URL
      if (!keyInfo.permissions.includes(requiredPermission) && !keyInfo.permissions.includes('*')) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }
    }

    // Add API key info to request
    req.apiKey = keyInfo;
    
    // Log API key usage
    await logActivity({
      user: keyInfo.userId,
      action: 'api_key_usage',
      entityType: 'APIKey',
      entityId: keyInfo.id,
      details: {
        endpoint: req.originalUrl,
        method: req.method,
        ip: req.ip
      }
    });

    next();
  } catch (error) {
    console.error('API key verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'API key verification error'
    });
  }
};

// OAuth 2.0 middleware
export const oauth2Middleware = {
  // Generate authorization code
  generateAuthCode: async (clientId, userId, scope, redirectUri) => {
    if (!redis) {
      throw new Error('Redis not available for OAuth operations');
    }
    
    const authCode = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    await redis.setex(`oauth_auth_code:${authCode}`, 600, JSON.stringify({
      clientId,
      userId,
      scope,
      redirectUri,
      expiresAt
    }));
    
    return authCode;
  },

  // Verify authorization code
  verifyAuthCode: async (authCode, clientId, redirectUri) => {
    if (!redis) {
      return null;
    }
    
    const codeData = await redis.get(`oauth_auth_code:${authCode}`);
    if (!codeData) {
      return null;
    }

    const codeInfo = JSON.parse(codeData);
    
    if (codeInfo.clientId !== clientId || 
        codeInfo.redirectUri !== redirectUri ||
        new Date() > new Date(codeInfo.expiresAt)) {
      return null;
    }

    // Delete the auth code after use
    await redis.del(`oauth_auth_code:${authCode}`);
    
    return codeInfo;
  },

  // Generate access token
  generateAccessToken: async (userId, clientId, scope) => {
    if (!redis) {
      throw new Error('Redis not available for OAuth operations');
    }
    
    const accessToken = crypto.randomBytes(32).toString('hex');
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    
    const tokenData = {
      userId,
      clientId,
      scope,
      expiresAt
    };
    
    await redis.setex(`oauth_access_token:${accessToken}`, 3600, JSON.stringify(tokenData));
    await redis.setex(`oauth_refresh_token:${refreshToken}`, 30 * 24 * 60 * 60, JSON.stringify(tokenData)); // 30 days
    
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 3600,
      token_type: 'Bearer'
    };
  },

  // Verify access token
  verifyAccessToken: async (accessToken) => {
    if (!redis) {
      return null;
    }
    
    const tokenData = await redis.get(`oauth_access_token:${accessToken}`);
    if (!tokenData) {
      return null;
    }

    const tokenInfo = JSON.parse(tokenData);
    
    if (new Date() > new Date(tokenInfo.expiresAt)) {
      await redis.del(`oauth_access_token:${accessToken}`);
      return null;
    }
    
    return tokenInfo;
  }
};

// Session management middleware
export const sessionMiddleware = {
  // Create session
  createSession: async (userId, deviceInfo) => {
    if (!redis) {
      throw new Error('Redis not available for session management');
    }
    
    const sessionId = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    const sessionData = {
      userId,
      deviceInfo,
      createdAt: new Date(),
      expiresAt
    };
    
    await redis.setex(`session:${sessionId}`, 86400, JSON.stringify(sessionData));
    
    return sessionId;
  },

  // Verify session
  verifySession: async (sessionId) => {
    if (!redis) {
      return null;
    }
    
    const sessionData = await redis.get(`session:${sessionId}`);
    if (!sessionData) {
      return null;
    }

    const session = JSON.parse(sessionData);
    
    if (new Date() > new Date(session.expiresAt)) {
      await redis.del(`session:${sessionId}`);
      return null;
    }
    
    return session;
  },

  // Revoke session
  revokeSession: async (sessionId) => {
    if (redis) {
      await redis.del(`session:${sessionId}`);
    }
  },

  // Revoke all user sessions
  revokeAllUserSessions: async (userId) => {
    if (!redis) {
      return;
    }
    
    const keys = await redis.keys(`session:*`);
    for (const key of keys) {
      const sessionData = await redis.get(key);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        if (session.userId === userId) {
          await redis.del(key);
        }
      }
    }
  }
};

// Security headers middleware
export const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Strict transport security
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Content security policy
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';");
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
};

// Request logging middleware
export const requestLogger = async (req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - ${req.ip}`);
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime;
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

export default {
  apiRateLimiter,
  authRateLimiter,
  mfaRateLimiter,
  verifyJWT,
  verifyMFA,
  verifyAPIKey,
  oauth2Middleware,
  sessionMiddleware,
  securityHeaders,
  requestLogger
};
