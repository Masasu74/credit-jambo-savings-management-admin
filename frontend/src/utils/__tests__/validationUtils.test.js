import { describe, it, expect } from 'vitest'

// Mock validation utility functions
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && !email.includes('..')
}

const validatePhone = (phone) => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/
  return phoneRegex.test(phone)
}

const validatePassword = (password) => {
  const minLength = 8
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  
  return {
    isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
    errors: {
      length: password.length < minLength ? `Password must be at least ${minLength} characters` : null,
      uppercase: !hasUpperCase ? 'Password must contain at least one uppercase letter' : null,
      lowercase: !hasLowerCase ? 'Password must contain at least one lowercase letter' : null,
      numbers: !hasNumbers ? 'Password must contain at least one number' : null,
      special: !hasSpecialChar ? 'Password must contain at least one special character' : null
    }
  }
}

const validateRequired = (value) => {
  return value !== null && value !== undefined && value.toString().trim() !== ''
}

const validateNumber = (value, min = null, max = null) => {
  const num = parseFloat(value)
  if (isNaN(num)) return false
  if (min !== null && num < min) return false
  if (max !== null && num > max) return false
  // Check for multiple decimal points
  if (value.toString().split('.').length > 2) return false
  return true
}

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('validates correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name@domain.co.uk')).toBe(true)
      expect(validateEmail('test+tag@example.org')).toBe(true)
    })

    it('rejects invalid email addresses', () => {
      expect(validateEmail('invalid-email')).toBe(false)
      expect(validateEmail('test@')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
      expect(validateEmail('')).toBe(false)
      expect(validateEmail('test..test@example.com')).toBe(false)
    })
  })

  describe('validatePhone', () => {
    it('validates correct phone numbers', () => {
      expect(validatePhone('+1234567890')).toBe(true)
      expect(validatePhone('123-456-7890')).toBe(true)
      expect(validatePhone('(123) 456-7890')).toBe(true)
      expect(validatePhone('123 456 7890')).toBe(true)
    })

    it('rejects invalid phone numbers', () => {
      expect(validatePhone('123')).toBe(false)
      expect(validatePhone('abc-def-ghij')).toBe(false)
      expect(validatePhone('')).toBe(false)
    })
  })

  describe('validatePassword', () => {
    it('validates strong passwords', () => {
      const result = validatePassword('StrongPass123!')
      expect(result.isValid).toBe(true)
      expect(result.errors.length).toBeNull()
      expect(result.errors.uppercase).toBeNull()
      expect(result.errors.lowercase).toBeNull()
      expect(result.errors.numbers).toBeNull()
      expect(result.errors.special).toBeNull()
    })

    it('rejects weak passwords', () => {
      const result = validatePassword('weak')
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeTruthy()
      expect(result.errors.uppercase).toBeTruthy()
      expect(result.errors.numbers).toBeTruthy()
      expect(result.errors.special).toBeTruthy()
    })

    it('provides specific error messages', () => {
      const result = validatePassword('weakpass')
      expect(result.errors.uppercase).toBe('Password must contain at least one uppercase letter')
      expect(result.errors.numbers).toBe('Password must contain at least one number')
      expect(result.errors.special).toBe('Password must contain at least one special character')
    })
  })

  describe('validateRequired', () => {
    it('validates non-empty values', () => {
      expect(validateRequired('test')).toBe(true)
      expect(validateRequired('0')).toBe(true)
      expect(validateRequired('false')).toBe(true)
    })

    it('rejects empty values', () => {
      expect(validateRequired('')).toBe(false)
      expect(validateRequired('   ')).toBe(false)
      expect(validateRequired(null)).toBe(false)
      expect(validateRequired(undefined)).toBe(false)
    })
  })

  describe('validateNumber', () => {
    it('validates numbers within range', () => {
      expect(validateNumber('10', 0, 100)).toBe(true)
      expect(validateNumber('0', 0, 100)).toBe(true)
      expect(validateNumber('100', 0, 100)).toBe(true)
    })

    it('rejects numbers outside range', () => {
      expect(validateNumber('-1', 0, 100)).toBe(false)
      expect(validateNumber('101', 0, 100)).toBe(false)
    })

    it('rejects non-numeric values', () => {
      expect(validateNumber('abc')).toBe(false)
      expect(validateNumber('')).toBe(false)
      expect(validateNumber('10.5.5')).toBe(false)
    })

    it('handles decimal numbers', () => {
      expect(validateNumber('10.5', 0, 100)).toBe(true)
      expect(validateNumber('99.99', 0, 100)).toBe(true)
    })
  })
})
