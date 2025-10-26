import { describe, it, expect } from 'vitest'

// Mock color utility functions
const formatCurrency = (amount) => {
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(1)}B`
  } else if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`
  }
  return amount.toString()
}

const validateHexColor = (color) => {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  return hexRegex.test(color)
}

const lightenColor = (color, percent) => {
  // Simple color lightening function
  if (!color.startsWith('#')) return color
  
  const num = parseInt(color.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = (num >> 16) + amt
  const G = (num >> 8 & 0x00FF) + amt
  const B = (num & 0x0000FF) + amt
  
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1)
}

describe('Color Utils', () => {
  describe('formatCurrency', () => {
    it('formats large numbers correctly', () => {
      expect(formatCurrency(1000000000)).toBe('1.0B')
      expect(formatCurrency(1500000000)).toBe('1.5B')
      expect(formatCurrency(1000000)).toBe('1.0M')
      expect(formatCurrency(1500000)).toBe('1.5M')
      expect(formatCurrency(1000)).toBe('1.0K')
      expect(formatCurrency(1500)).toBe('1.5K')
    })

    it('handles small numbers', () => {
      expect(formatCurrency(500)).toBe('500')
      expect(formatCurrency(0)).toBe('0')
      expect(formatCurrency(999)).toBe('999')
    })

    it('handles edge cases', () => {
      expect(formatCurrency(999999)).toBe('1000.0K')
      expect(formatCurrency(999999999)).toBe('1000.0M')
    })
  })

  describe('validateHexColor', () => {
    it('validates correct hex colors', () => {
      expect(validateHexColor('#ff0000')).toBe(true)
      expect(validateHexColor('#00ff00')).toBe(true)
      expect(validateHexColor('#0000ff')).toBe(true)
      expect(validateHexColor('#fff')).toBe(true)
      expect(validateHexColor('#000')).toBe(true)
      expect(validateHexColor('#123456')).toBe(true)
    })

    it('rejects invalid hex colors', () => {
      expect(validateHexColor('ff0000')).toBe(false)
      expect(validateHexColor('#ff')).toBe(false)
      expect(validateHexColor('#ffff')).toBe(false)
      expect(validateHexColor('#fffffff')).toBe(false)
      expect(validateHexColor('red')).toBe(false)
      expect(validateHexColor('')).toBe(false)
      expect(validateHexColor('#gg0000')).toBe(false)
    })
  })

  describe('lightenColor', () => {
    it('lightens colors correctly', () => {
      expect(lightenColor('#000000', 50)).toBe('#7f7f7f')
      expect(lightenColor('#ffffff', 0)).toBe('#ffffff')
    })

    it('handles invalid colors', () => {
      expect(lightenColor('red', 50)).toBe('red')
      expect(lightenColor('', 50)).toBe('')
    })
  })
})
