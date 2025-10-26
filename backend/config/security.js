// Security Configuration
export const SECURITY_CONFIG = {
  // Authentication settings
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshTokenExpiresIn: '7d',
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    maxConcurrentSessions: 3
  },

  // Password policy
  password: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    preventCommonPasswords: true,
    preventUserInfo: true,
    maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
    historyCount: 5
  },

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    authWindowMs: 15 * 60 * 1000,
    authMaxAttempts: 5,
    mfaWindowMs: 5 * 60 * 1000,
    mfaMaxAttempts: 3
  },

  // File upload security
  fileUpload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.xls', '.xlsx'],
    scanForViruses: true,
    encryptFiles: true
  },

  // CORS settings
  cors: {
    allowedOrigins: [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://anchorfinanceportal.com',
      'https://www.anchorfinanceportal.com'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'X-API-Key',
      'X-Client-Version'
    ],
    exposedHeaders: ['Content-Disposition', 'X-Total-Count'],
    maxAge: 86400
  },

  // Security headers
  headers: {
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
    xXSSProtection: '1; mode=block',
    strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload',
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: [
      'geolocation=()',
      'microphone=()',
      'camera=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()',
      'ambient-light-sensor=()',
      'autoplay=()',
      'encrypted-media=()',
      'picture-in-picture=()',
      'publickey-credentials-get=()',
      'screen-wake-lock=()',
      'sync-xhr=()',
      'web-share=()',
      'xr-spatial-tracking=()'
    ].join(', '),
    crossOriginResourcePolicy: 'same-origin',
    crossOriginOpenerPolicy: 'same-origin',
    crossOriginEmbedderPolicy: 'require-corp'
  },

  // Content Security Policy
  csp: {
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
    frameAncestors: ["'none'"],
    upgradeInsecureRequests: true
  },

  // Encryption settings
  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
    saltLength: 64,
    iterations: 100000
  },

  // Session management
  session: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    rolling: true
  },

  // Audit logging
  audit: {
    enabled: true,
    logLevel: 'info',
    sensitiveFields: ['password', 'token', 'secret', 'key'],
    maxLogSize: 10 * 1024 * 1024, // 10MB
    retentionDays: 90
  },

  // Security monitoring
  monitoring: {
    enabled: true,
    alertThresholds: {
      failedLogins: 3,
      suspiciousRequests: 50,
      concurrentSessions: 2,
      unusualActivity: 5
    },
    ipBlocking: {
      enabled: true,
      maxFailedAttempts: 10,
      blockDuration: 60 * 60 * 1000 // 1 hour
    }
  },

  // MFA settings
  mfa: {
    enabled: true,
    requiredForAdmins: true,
    backupCodes: true,
    maxAttempts: 3,
    lockoutDuration: 15 * 60 * 1000 // 15 minutes
  },

  // API security
  api: {
    versioning: true,
    rateLimitByIP: true,
    validateRequests: true,
    sanitizeInputs: true,
    validateResponses: true
  },

  // Database security
  database: {
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
    ssl: process.env.NODE_ENV === 'production'
  },

  // Backup security
  backup: {
    encryption: true,
    compression: true,
    retention: 30, // days
    maxSize: 100 * 1024 * 1024, // 100MB
    schedule: '0 2 * * *' // Daily at 2 AM
  },

  // Environment-specific settings
  environment: {
    development: {
      cors: {
        allowedOrigins: ['http://localhost:5173', 'http://localhost:3000']
      },
      headers: {
        strictTransportSecurity: false
      },
      csp: {
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"]
      }
    },
    production: {
      cors: {
        allowedOrigins: ['https://anchorfinanceportal.com', 'https://www.anchorfinanceportal.com']
      },
      headers: {
        strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload'
      },
      csp: {
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "https://fonts.googleapis.com"]
      }
    }
  }
};

// Get environment-specific configuration
export const getSecurityConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  const baseConfig = { ...SECURITY_CONFIG };
  const envConfig = SECURITY_CONFIG.environment[env] || {};
  
  // Merge environment-specific settings
  Object.keys(envConfig).forEach(key => {
    if (baseConfig[key]) {
      baseConfig[key] = { ...baseConfig[key], ...envConfig[key] };
    } else {
      baseConfig[key] = envConfig[key];
    }
  });
  
  return baseConfig;
};

// Validate security configuration
export const validateSecurityConfig = (config) => {
  const errors = [];
  
  // Check required environment variables
  if (!config.auth.jwtSecret) {
    errors.push('JWT_SECRET environment variable is required');
  }
  
  if (!config.auth.jwtSecret || config.auth.jwtSecret.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long');
  }
  
  // Check password policy
  if (config.password.minLength < 8) {
    errors.push('Password minimum length must be at least 8 characters');
  }
  
  // Check rate limiting
  if (config.rateLimit.maxRequests < 10) {
    errors.push('Rate limit maximum requests must be at least 10');
  }
  
  // Check file upload
  if (config.fileUpload.maxSize > 50 * 1024 * 1024) {
    errors.push('File upload maximum size should not exceed 50MB');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export default SECURITY_CONFIG;
