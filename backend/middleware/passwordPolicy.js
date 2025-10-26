import bcrypt from 'bcryptjs';
import User from '../models/userModel.js';
import { logActivity } from '../utils/logActivity.js';

// Password Policy Configuration
const PASSWORD_POLICY = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
  preventUserInfo: true,
  maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days in milliseconds
  historyCount: 5, // Remember last 5 passwords
  maxFailedAttempts: 5,
  lockoutDuration: 15 * 60 * 1000 // 15 minutes
};

// Common passwords to prevent
const COMMON_PASSWORDS = [
  'password', '123456', '123456789', 'qwerty', 'abc123',
  'password123', 'admin', 'letmein', 'welcome', 'monkey',
  'dragon', 'master', 'hello', 'freedom', 'whatever',
  'qazwsx', 'trustno1', 'jordan', 'harley', 'ranger',
  'iwantu', 'jennifer', 'hunter', 'buster', 'soccer',
  'baseball', 'tequila', 'charlie', 'andrew', 'michelle',
  'love', 'jessica', 'asshole', '2000', 'chelsea',
  'summer', 'corvette', 'tiger', 'robert', 'thomas',
  'hockey', 'russia', 'george', 'ass', 'porsche',
  'marlboro', 'matrix', 'falcon', 'dallas', 'maverick',
  'chicken', 'anthony', 'sandwich', 'jordan1', 'eagle1',
  'marvin', 'gandalf', 'wizard', 'cooper', '1212',
  'crystal', 'panther', 'cowboy', 'silver', 'midnight',
  '999999', 'orange', 'sierra', 'parker', '888888',
  'victor', 'alex', 'dakota', '555555', 'steve',
  'viking', 'jack', 'tiger1', 'red123', 'golf',
  '1234567890', 'secret', 'absolut', 'black', 'blue',
  '007007', 'matt', 'test', 'baby', 'angel',
  'mother', 'friend', 'football', 'jordan23', 'harley1',
  'monster', 'purple', 'johnson', 'chester', 'london',
  'midnight', 'blue', 'fishing', '000000', 'hannah',
  'slayer', '111111', 'rachel', 'test123', 'bitch',
  'john', 'michelle', 'spider', 'lovely', 'andrea',
  'angela', 'scott', 'tiger', 'madison', 'summer',
  'arturo', 'andrew', 'william', 'teacher', 'joshua',
  'jessica', 'amanda', 'justin', 'soccer', 'lovely',
  'mickey', 'secret', 'summer', 'intern', 'service',
  'canada', 'george', 'service', 'intern', 'canada'
];

class PasswordPolicy {
  // Validate password strength
  static validatePassword(password, user = null) {
    const errors = [];

    // Check minimum length
    if (password.length < PASSWORD_POLICY.minLength) {
      errors.push(`Password must be at least ${PASSWORD_POLICY.minLength} characters long`);
    }

    // Check maximum length
    if (password.length > PASSWORD_POLICY.maxLength) {
      errors.push(`Password must not exceed ${PASSWORD_POLICY.maxLength} characters`);
    }

    // Check for uppercase letters
    if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    // Check for lowercase letters
    if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    // Check for numbers
    if (PASSWORD_POLICY.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    // Check for special characters
    if (PASSWORD_POLICY.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check against common passwords
    if (PASSWORD_POLICY.preventCommonPasswords && COMMON_PASSWORDS.includes(password.toLowerCase())) {
      errors.push('Password is too common. Please choose a more unique password');
    }

    // Check against user information
    if (PASSWORD_POLICY.preventUserInfo && user) {
      const userInfo = [
        user.email?.toLowerCase(),
        user.firstName?.toLowerCase(),
        user.lastName?.toLowerCase(),
        user.username?.toLowerCase()
      ].filter(Boolean);

      const passwordLower = password.toLowerCase();
      for (const info of userInfo) {
        if (info && passwordLower.includes(info)) {
          errors.push('Password cannot contain your personal information');
          break;
        }
      }
    }

    // Check for sequential characters
    if (this.hasSequentialChars(password)) {
      errors.push('Password cannot contain sequential characters (e.g., 123, abc)');
    }

    // Check for repeated characters
    if (this.hasRepeatedChars(password)) {
      errors.push('Password cannot contain repeated characters (e.g., aaa, 111)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Check for sequential characters
  static hasSequentialChars(password) {
    const sequences = [
      'abcdefghijklmnopqrstuvwxyz',
      'zyxwvutsrqponmlkjihgfedcba',
      '0123456789',
      '9876543210'
    ];

    for (const seq of sequences) {
      for (let i = 0; i <= seq.length - 3; i++) {
        const sequence = seq.substring(i, i + 3);
        if (password.toLowerCase().includes(sequence)) {
          return true;
        }
      }
    }
    return false;
  }

  // Check for repeated characters
  static hasRepeatedChars(password) {
    for (let i = 0; i < password.length - 2; i++) {
      if (password[i] === password[i + 1] && password[i] === password[i + 2]) {
        return true;
      }
    }
    return false;
  }

  // Check password history
  static async checkPasswordHistory(userId, newPassword) {
    try {
      const user = await User.findById(userId).select('passwordHistory');
      if (!user || !user.passwordHistory) return true;

      for (const oldPassword of user.passwordHistory) {
        const isMatch = await bcrypt.compare(newPassword, oldPassword.hash);
        if (isMatch) {
          return false; // Password found in history
        }
      }
      return true; // Password not in history
    } catch (error) {
      console.error('Error checking password history:', error);
      return true; // Allow if error occurs
    }
  }

  // Check password age
  static async checkPasswordAge(userId) {
    try {
      const user = await User.findById(userId).select('passwordChangedAt');
      if (!user || !user.passwordChangedAt) return true;

      const age = Date.now() - new Date(user.passwordChangedAt).getTime();
      return age < PASSWORD_POLICY.maxAge;
    } catch (error) {
      console.error('Error checking password age:', error);
      return true; // Allow if error occurs
    }
  }

  // Update password history
  static async updatePasswordHistory(userId, newPasswordHash) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      // Initialize password history if it doesn't exist
      if (!user.passwordHistory) {
        user.passwordHistory = [];
      }

      // Add new password to history
      user.passwordHistory.push({
        hash: newPasswordHash,
        changedAt: new Date()
      });

      // Keep only the last N passwords
      if (user.passwordHistory.length > PASSWORD_POLICY.historyCount) {
        user.passwordHistory = user.passwordHistory.slice(-PASSWORD_POLICY.historyCount);
      }

      await user.save();
    } catch (error) {
      console.error('Error updating password history:', error);
    }
  }

  // Track failed login attempts
  static async trackFailedAttempt(userId, ip) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      // Initialize failed attempts if it doesn't exist
      if (!user.failedLoginAttempts) {
        user.failedLoginAttempts = [];
      }

      // Add failed attempt
      user.failedLoginAttempts.push({
        timestamp: new Date(),
        ip: ip
      });

      // Remove attempts older than lockout duration
      const cutoff = new Date(Date.now() - PASSWORD_POLICY.lockoutDuration);
      user.failedLoginAttempts = user.failedLoginAttempts.filter(
        attempt => new Date(attempt.timestamp) > cutoff
      );

      // Check if account should be locked
      if (user.failedLoginAttempts.length >= PASSWORD_POLICY.maxFailedAttempts) {
        user.isLocked = true;
        user.lockoutUntil = new Date(Date.now() + PASSWORD_POLICY.lockoutDuration);
      }

      await user.save();

      // Log failed attempt
      await logActivity({
        user: userId,
        action: 'failed_login_attempt',
        entityType: 'User',
        entityId: userId,
        details: {
          ip: ip,
          attemptCount: user.failedLoginAttempts.length,
          isLocked: user.isLocked
        }
      });
    } catch (error) {
      console.error('Error tracking failed attempt:', error);
    }
  }

  // Reset failed login attempts
  static async resetFailedAttempts(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      user.failedLoginAttempts = [];
      user.isLocked = false;
      user.lockoutUntil = null;
      await user.save();
    } catch (error) {
      console.error('Error resetting failed attempts:', error);
    }
  }

  // Check if account is locked
  static async isAccountLocked(userId) {
    try {
      const user = await User.findById(userId).select('isLocked lockoutUntil');
      if (!user) return false;

      if (!user.isLocked) return false;

      // Check if lockout period has expired
      if (user.lockoutUntil && new Date() > new Date(user.lockoutUntil)) {
        // Unlock account
        user.isLocked = false;
        user.lockoutUntil = null;
        await user.save();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking account lock status:', error);
      return false;
    }
  }

  // Generate secure password
  static generateSecurePassword(length = 12) {
    const charset = {
      lowercase: 'abcdefghijklmnopqrstuvwxyz',
      uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      numbers: '0123456789',
      symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
    };

    let password = '';
    
    // Ensure at least one character from each required set
    password += charset.lowercase[Math.floor(Math.random() * charset.lowercase.length)];
    password += charset.uppercase[Math.floor(Math.random() * charset.uppercase.length)];
    password += charset.numbers[Math.floor(Math.random() * charset.numbers.length)];
    password += charset.symbols[Math.floor(Math.random() * charset.symbols.length)];

    // Fill the rest with random characters
    const allChars = charset.lowercase + charset.uppercase + charset.numbers + charset.symbols;
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  // Middleware for password validation
  static validatePasswordMiddleware() {
    return async (req, res, next) => {
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Password is required'
        });
      }

      const validation = this.validatePassword(password, req.user);
      
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Password does not meet security requirements',
          errors: validation.errors
        });
      }

      // Check password history if user is changing password
      if (req.user) {
        const historyCheck = await this.checkPasswordHistory(req.user._id, password);
        if (!historyCheck) {
          return res.status(400).json({
            success: false,
            message: 'Password has been used recently. Please choose a different password'
          });
        }
      }

      next();
    };
  }
}

export default PasswordPolicy;
