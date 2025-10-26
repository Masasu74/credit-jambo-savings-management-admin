// Security Headers Middleware
export const securityHeaders = (req, res, next) => {
  // Prevent clickjacking attacks
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Strict Transport Security (HTTPS only)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ');
  
  res.setHeader('Content-Security-Policy', csp);
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy (formerly Feature Policy)
  const permissionsPolicy = [
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
  ].join(', ');
  
  res.setHeader('Permissions-Policy', permissionsPolicy);
  
  // Cross-Origin Resource Policy - Allow cross-origin for uploads
  if (req.path.startsWith('/api/uploads') || req.path.startsWith('/uploads')) {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  } else {
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  }
  
  // Cross-Origin Opener Policy
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  
  // Cross-Origin Embedder Policy - Disable for uploads to allow file access
  if (req.path.startsWith('/api/uploads') || req.path.startsWith('/uploads')) {
    // Don't set Cross-Origin-Embedder-Policy for uploads
  } else {
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  }
  
  // Origin-Agent-Cluster
  res.setHeader('Origin-Agent-Cluster', '?1');
  
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');
  
  // Add custom security headers
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  
  // Cache control for sensitive endpoints
  if (req.path.startsWith('/api/auth') || req.path.startsWith('/api/user')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  next();
};

// CORS Configuration
export const corsConfig = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      'https://anchorfinanceportal.com',
      'https://www.anchorfinanceportal.com',
      "https://anchorfinance.ndfitrack.com",
      "https://www.ndfitrack.com",
      "https://ndfitrack.com"
    ];
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    // In development, be more permissive
    if (process.env.NODE_ENV === 'development') {
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
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
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Rate limiting headers
export const rateLimitHeaders = (req, res, next) => {
  res.setHeader('X-RateLimit-Limit', process.env.RATE_LIMIT_MAX_REQUESTS || '100');
  res.setHeader('X-RateLimit-Remaining', req.rateLimit?.remaining || '100');
  res.setHeader('X-RateLimit-Reset', req.rateLimit?.resetTime || Date.now() + 900000);
  
  next();
};

// Security monitoring headers
export const securityMonitoringHeaders = (req, res, next) => {
  // Add request ID for tracking
  req.requestId = req.headers['x-request-id'] || generateRequestId();
  res.setHeader('X-Request-ID', req.requestId);
  
  // Add security context
  res.setHeader('X-Security-Context', 'anchor-finance-v1');
  
  // Add API version
  res.setHeader('X-API-Version', '1.0.0');
  
  next();
};

// Generate unique request ID
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Content Security Policy for different environments
export const getCSP = (environment = 'production') => {
  const baseCSP = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ];

  if (environment === 'development') {
    baseCSP.push("script-src 'self' 'unsafe-inline' 'unsafe-eval'");
    baseCSP.push("style-src 'self' 'unsafe-inline'");
  }

  return baseCSP.join('; ');
};

// Security headers for file uploads
export const fileUploadSecurityHeaders = (req, res, next) => {
  if (req.path.startsWith('/api/uploads') || req.path.startsWith('/uploads')) {
    // Allow inline display for images and documents
    const ext = req.path.toLowerCase();
    if (ext.includes('.jpg') || ext.includes('.jpeg') || ext.includes('.png') || ext.includes('.gif') || ext.includes('.ico') || ext.includes('.pdf')) {
      res.setHeader('Content-Disposition', 'inline');
    } else {
      res.setHeader('Content-Disposition', 'attachment');
    }
    
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Cache control for uploaded files
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    
    // Allow cross-origin access for uploads
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  
  next();
};

// Security headers for API responses
export const apiSecurityHeaders = (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    // Prevent caching of API responses
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Add API security headers
    res.setHeader('X-API-Security', 'enabled');
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
  
  next();
};

export default {
  securityHeaders,
  corsConfig,
  rateLimitHeaders,
  securityMonitoringHeaders,
  fileUploadSecurityHeaders,
  apiSecurityHeaders,
  getCSP
};
