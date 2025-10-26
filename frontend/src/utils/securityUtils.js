// Frontend Security Utilities
import DOMPurify from 'dompurify';

class SecurityUtils {
  // Sanitize HTML content to prevent XSS
  static sanitizeHTML(html) {
    if (typeof html !== 'string') return html;
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [], // No HTML tags allowed
      ALLOWED_ATTR: [], // No attributes allowed
      KEEP_CONTENT: true
    });
  }

  // Sanitize text content
  static sanitizeText(text) {
    if (typeof text !== 'string') return text;
    
    // Remove HTML tags
    const withoutTags = text.replace(/<[^>]*>/g, '');
    
    // Escape special characters
    return withoutTags
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // Validate email format
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate password strength
  static validatePassword(password) {
    const errors = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate phone number
  static isValidPhone(phone) {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  // Validate file type
  static isValidFileType(file, allowedTypes) {
    return allowedTypes.includes(file.type);
  }

  // Validate file size
  static isValidFileSize(file, maxSize) {
    return file.size <= maxSize;
  }

  // Generate secure random string
  static generateSecureString(length = 32) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Hash sensitive data (client-side)
  static async hashData(data) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Encrypt sensitive data (client-side)
  static async encryptData(data, key) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(JSON.stringify(data));
    
    // Generate a random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Import the key
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(key),
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );
    
    // Encrypt the data
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      dataBuffer
    );
    
    // Convert to base64
    const encryptedArray = new Uint8Array(encryptedBuffer);
    const encryptedBase64 = btoa(String.fromCharCode(...encryptedArray));
    const ivBase64 = btoa(String.fromCharCode(...iv));
    
    return {
      encrypted: encryptedBase64,
      iv: ivBase64
    };
  }

  // Decrypt data (client-side)
  static async decryptData(encryptedData, key) {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    // Convert from base64
    const encryptedArray = new Uint8Array(
      atob(encryptedData.encrypted).split('').map(char => char.charCodeAt(0))
    );
    const iv = new Uint8Array(
      atob(encryptedData.iv).split('').map(char => char.charCodeAt(0))
    );
    
    // Import the key
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(key),
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    
    // Decrypt the data
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      encryptedArray
    );
    
    return JSON.parse(decoder.decode(decryptedBuffer));
  }

  // Secure storage with encryption
  static async secureSetItem(key, value, encryptionKey = 'default-key') {
    try {
      const encrypted = await this.encryptData(value, encryptionKey);
      localStorage.setItem(key, JSON.stringify(encrypted));
    } catch (error) {
      console.error('Error storing encrypted data:', error);
      // Fallback to regular storage for non-sensitive data
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  // Secure retrieval with decryption
  static async secureGetItem(key, encryptionKey = 'default-key') {
    try {
      const encrypted = JSON.parse(localStorage.getItem(key));
      if (!encrypted || !encrypted.encrypted) {
        return null;
      }
      return await this.decryptData(encrypted, encryptionKey);
    } catch (error) {
      console.error('Error retrieving encrypted data:', error);
      // Fallback to regular retrieval
      try {
        return JSON.parse(localStorage.getItem(key));
      } catch {
        return null;
      }
    }
  }

  // Clear sensitive data
  static clearSensitiveData() {
    const sensitiveKeys = [
      'authToken',
      'refreshToken',
      'userData',
      'sessionData',
      'tempData'
    ];
    
    sensitiveKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  }

  // Validate URL
  static isValidURL(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Validate API response
  static validateAPIResponse(response) {
    if (!response || typeof response !== 'object') {
      return false;
    }
    
    // Check for required fields
    if (response.success === undefined) {
      return false;
    }
    
    // Check for suspicious content
    const responseString = JSON.stringify(response);
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /eval\s*\(/i,
      /document\./i,
      /window\./i
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(responseString)) {
        console.warn('Suspicious content detected in API response');
        return false;
      }
    }
    
    return true;
  }

  // Sanitize form data
  static sanitizeFormData(formData) {
    const sanitized = {};
    
    for (const [key, value] of Object.entries(formData)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeText(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeFormData(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  // Validate and sanitize user input
  static validateUserInput(input, type = 'text') {
    const validators = {
      text: (value) => ({
        isValid: typeof value === 'string' && value.length <= 1000,
        sanitized: this.sanitizeText(value)
      }),
      email: (value) => ({
        isValid: this.isValidEmail(value),
        sanitized: this.sanitizeText(value).toLowerCase()
      }),
      phone: (value) => ({
        isValid: this.isValidPhone(value),
        sanitized: this.sanitizeText(value)
      }),
      number: (value) => ({
        isValid: !isNaN(value) && isFinite(value),
        sanitized: parseFloat(value)
      }),
      url: (value) => ({
        isValid: this.isValidURL(value),
        sanitized: this.sanitizeText(value)
      })
    };
    
    const validator = validators[type] || validators.text;
    return validator(input);
  }

  // Prevent clickjacking
  static preventClickjacking() {
    if (window.self !== window.top) {
      window.top.location = window.self.location;
    }
  }

  // Check for secure context
  static isSecureContext() {
    return window.isSecureContext;
  }

  // Get client fingerprint
  static getClientFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Client fingerprint', 2, 2);
    
    const fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      canvas: canvas.toDataURL(),
      webgl: this.getWebGLFingerprint(),
      fonts: this.getFontFingerprint()
    };
    
    return this.hashData(JSON.stringify(fingerprint));
  }

  // Get WebGL fingerprint
  static getWebGLFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return null;
      
      return gl.getParameter(gl.VENDOR) + '~' + gl.getParameter(gl.RENDERER);
    } catch {
      return null;
    }
  }

  // Get font fingerprint
  static getFontFingerprint() {
    const fonts = [
      'Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia',
      'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS', 'Trebuchet MS',
      'Arial Black', 'Impact'
    ];
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const baseFont = 'monospace';
    const baseSize = 20;
    const testString = 'mmmmmmmmmmlli';
    
    ctx.font = `${baseSize}px ${baseFont}`;
    const baseWidth = ctx.measureText(testString).width;
    
    const availableFonts = fonts.filter(font => {
      ctx.font = `${baseSize}px ${font}`;
      return ctx.measureText(testString).width !== baseWidth;
    });
    
    return availableFonts.join(',');
  }

  // Rate limiting for client-side actions
  static createRateLimiter(maxAttempts, windowMs) {
    const attempts = new Map();
    
    return (key) => {
      const now = Date.now();
      const userAttempts = attempts.get(key) || [];
      
      // Remove old attempts
      const recentAttempts = userAttempts.filter(
        timestamp => now - timestamp < windowMs
      );
      
      if (recentAttempts.length >= maxAttempts) {
        return false; // Rate limited
      }
      
      recentAttempts.push(now);
      attempts.set(key, recentAttempts);
      return true; // Allowed
    };
  }

  // Secure logout
  static async secureLogout() {
    try {
      // Clear all sensitive data
      this.clearSensitiveData();
      
      // Clear any cached data
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(name => caches.delete(name))
        );
      }
      
      // Clear service worker cache
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map(registration => registration.unregister())
        );
      }
      
      // Redirect to login page
      window.location.href = '/login';
    } catch (error) {
      console.error('Error during secure logout:', error);
      // Force redirect even if cleanup fails
      window.location.href = '/login';
    }
  }
}

export default SecurityUtils;
