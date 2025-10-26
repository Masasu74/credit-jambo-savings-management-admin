import { body, validationResult, param, query } from 'express-validator';
import sanitizeHtml from 'sanitize-html';
import xss from 'xss';

// Input validation middleware
class InputValidation {
  // Sanitize HTML content
  static sanitizeHtml(input) {
    if (typeof input !== 'string') return input;
    
    return sanitizeHtml(input, {
      allowedTags: [], // No HTML tags allowed
      allowedAttributes: {}, // No attributes allowed
      disallowedTagsMode: 'recursiveEscape'
    });
  }

  // Sanitize XSS
  static sanitizeXSS(input) {
    if (typeof input !== 'string') return input;
    return xss(input, {
      whiteList: {}, // No tags allowed
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script']
    });
  }

  // Deep sanitize object
  static deepSanitize(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return typeof obj === 'string' ? this.sanitizeXSS(this.sanitizeHtml(obj)) : obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.deepSanitize(item));
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = this.deepSanitize(value);
    }
    return sanitized;
  }

  // Validate MongoDB ObjectId
  static isValidObjectId(id) {
    return /^[0-9a-fA-F]{24}$/.test(id);
  }

  // Validate email format
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate phone number (international format)
  static isValidPhone(phone) {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  // Validate date format
  static isValidDate(date) {
    const d = new Date(date);
    return d instanceof Date && !isNaN(d);
  }

  // Validate currency amount
  static isValidAmount(amount) {
    return !isNaN(amount) && parseFloat(amount) >= 0;
  }

  // Validate file type
  static isValidFileType(filename, allowedTypes) {
    const ext = filename.toLowerCase().split('.').pop();
    return allowedTypes.includes(ext);
  }

  // Validate file size
  static isValidFileSize(size, maxSize) {
    return size <= maxSize;
  }

  // Common validation rules
  static commonRules = {
    // User validation
    user: {
      email: body('email')
        .trim()
        .isEmail()
        .normalizeEmail()
        .withMessage('Invalid email format'),
      
      password: body('password')
        .isLength({ min: 8, max: 128 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must be 8-128 characters with uppercase, lowercase, number, and special character'),
      
      name: body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Name must be 2-50 characters, letters only'),
      
      phone: body('phone')
        .trim()
        .custom(value => {
          if (!this.isValidPhone(value)) {
            throw new Error('Invalid phone number format');
          }
          return true;
        })
    },

    // Loan validation
    loan: {
      amount: body('amount')
        .isFloat({ min: 0.01 })
        .withMessage('Loan amount must be a positive number'),
      
      term: body('term')
        .isInt({ min: 1, max: 360 })
        .withMessage('Loan term must be 1-360 months'),
      
      interestRate: body('interestRate')
        .isFloat({ min: 0, max: 100 })
        .withMessage('Interest rate must be 0-100%')
    },

    // Customer validation
    customer: {
      nationalId: body('nationalId')
        .trim()
        .isLength({ min: 5, max: 20 })
        .matches(/^[A-Za-z0-9-]+$/)
        .withMessage('Invalid national ID format'),
      
      address: body('address')
        .trim()
        .isLength({ min: 10, max: 200 })
        .withMessage('Address must be 10-200 characters')
    },

    // File validation
    file: {
      filename: body('filename')
        .trim()
        .isLength({ min: 1, max: 255 })
        .matches(/^[a-zA-Z0-9._-]+$/)
        .withMessage('Invalid filename format'),
      
      size: body('size')
        .isInt({ min: 1, max: 10485760 }) // 10MB max
        .withMessage('File size must be 1-10MB')
    }
  };

  // Validation middleware
  static validate(validations) {
    return async (req, res, next) => {
      // Apply validations
      await Promise.all(validations.map(validation => validation.run(req)));

      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array().map(error => ({
            field: error.path,
            message: error.msg,
            value: error.value
          }))
        });
      }

      // Sanitize request body
      if (req.body) {
        req.body = this.deepSanitize(req.body);
      }

      // Sanitize query parameters
      if (req.query) {
        req.query = this.deepSanitize(req.query);
      }

      // Sanitize URL parameters
      if (req.params) {
        req.params = this.deepSanitize(req.params);
      }

      next();
    };
  }

  // Specific validation middleware functions
  static validateUserRegistration() {
    return this.validate([
      this.commonRules.user.email,
      this.commonRules.user.password,
      this.commonRules.user.name,
      this.commonRules.user.phone
    ]);
  }

  static validateUserLogin() {
    return this.validate([
      this.commonRules.user.email,
      body('password').notEmpty().withMessage('Password is required')
    ]);
  }

  static validateLoanCreation() {
    return this.validate([
      this.commonRules.loan.amount,
      this.commonRules.loan.term,
      this.commonRules.loan.interestRate,
      body('customerId').custom(value => {
        if (!this.isValidObjectId(value)) {
          throw new Error('Invalid customer ID');
        }
        return true;
      }),
      body('purpose').trim().isLength({ min: 10, max: 500 }).withMessage('Purpose must be 10-500 characters')
    ]);
  }

  static validateCustomerCreation() {
    return this.validate([
      this.commonRules.customer.nationalId,
      this.commonRules.customer.address,
      this.commonRules.user.name,
      this.commonRules.user.phone,
      this.commonRules.user.email
    ]);
  }

  static validateFileUpload() {
    return this.validate([
      this.commonRules.file.filename,
      this.commonRules.file.size
    ]);
  }

  static validateObjectId(paramName) {
    return this.validate([
      param(paramName).custom(value => {
        if (!this.isValidObjectId(value)) {
          throw new Error(`Invalid ${paramName} format`);
        }
        return true;
      })
    ]);
  }

  static validatePagination() {
    return this.validate([
      query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
      query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
      query('sort').optional().isIn(['asc', 'desc']).withMessage('Sort must be asc or desc')
    ]);
  }

  static validateDateRange() {
    return this.validate([
      query('startDate').optional().custom(value => {
        if (!this.isValidDate(value)) {
          throw new Error('Invalid start date');
        }
        return true;
      }),
      query('endDate').optional().custom(value => {
        if (!this.isValidDate(value)) {
          throw new Error('Invalid end date');
        }
        return true;
      })
    ]);
  }

  // Custom validation for specific business rules
  static validateLoanAmount(amount, customerCreditScore) {
    const maxAmount = customerCreditScore * 1000; // Example business rule
    return parseFloat(amount) <= maxAmount;
  }

  static validateInterestRate(rate, loanType) {
    const maxRates = {
      personal: 15,
      business: 12,
      mortgage: 8
    };
    return parseFloat(rate) <= maxRates[loanType] || 15;
  }

  // Rate limiting validation
  static validateRateLimit(attempts, maxAttempts, windowMs) {
    return attempts < maxAttempts;
  }

  // Session validation
  static validateSession(session, maxAge) {
    if (!session || !session.createdAt) return false;
    const age = Date.now() - new Date(session.createdAt).getTime();
    return age < maxAge;
  }
}

export default InputValidation;
