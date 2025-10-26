import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useSystemColors } from '../useSystemColors'

// Mock fetch
global.fetch = vi.fn()

describe('useSystemColors Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns default colors when no settings are available', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404
    })

    const { result } = renderHook(() => useSystemColors())

    await waitFor(() => {
      expect(result.current.colors).toEqual({
        primary: '#2563eb',
        secondary: '#64748b',
        accent: '#f59e0b',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444'
      })
    })
  })

  it('fetches and returns custom colors from API', async () => {
    const mockColors = {
      primary: '#ff0000',
      secondary: '#00ff00',
      accent: '#0000ff',
      success: '#00ffff',
      warning: '#ffff00',
      error: '#ff00ff'
    }

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { colors: mockColors } })
    })

    const { result } = renderHook(() => useSystemColors())

    await waitFor(() => {
      expect(result.current.colors).toEqual(mockColors)
    })
  })

  it('handles API errors gracefully', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useSystemColors())

    await waitFor(() => {
      expect(result.current.colors).toEqual({
        primary: '#2563eb',
        secondary: '#64748b',
        accent: '#f59e0b',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444'
      })
    })
  })

  it('handles malformed API responses', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { colors: null } })
    })

    const { result } = renderHook(() => useSystemColors())

    await waitFor(() => {
      expect(result.current.colors).toEqual({
        primary: '#2563eb',
        secondary: '#64748b',
        accent: '#f59e0b',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444'
      })
    })
  })

  it('caches colors after successful fetch', async () => {
    const mockColors = {
      primary: '#ff0000',
      secondary: '#00ff00',
      accent: '#0000ff',
      success: '#00ffff',
      warning: '#ffff00',
      error: '#ff00ff'
    }

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { colors: mockColors } })
    })

    const { result, rerender } = renderHook(() => useSystemColors())

    await waitFor(() => {
      expect(result.current.colors).toEqual(mockColors)
    })

    // Rerender should not trigger another fetch
    rerender()

    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('handles partial color updates', async () => {
    const partialColors = {
      primary: '#ff0000',
      secondary: '#00ff00'
    }

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { colors: partialColors } })
    })

    const { result } = renderHook(() => useSystemColors())

    await waitFor(() => {
      expect(result.current.colors.primary).toBe('#ff0000')
      expect(result.current.colors.secondary).toBe('#00ff00')
      // Should fall back to defaults for missing colors
      expect(result.current.colors.accent).toBe('#f59e0b')
      expect(result.current.colors.success).toBe('#10b981')
    })
  })

  it('validates color format', async () => {
    const invalidColors = {
      primary: 'not-a-color',
      secondary: '#invalid',
      accent: '#12345', // Too short
      success: '#1234567' // Too long
    }

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { colors: invalidColors } })
    })

    const { result } = renderHook(() => useSystemColors())

    await waitFor(() => {
      // Should fall back to defaults for invalid colors
      expect(result.current.colors.primary).toBe('#2563eb')
      expect(result.current.colors.secondary).toBe('#64748b')
      expect(result.current.colors.accent).toBe('#f59e0b')
      expect(result.current.colors.success).toBe('#10b981')
    })
  })

  it('handles empty colors object', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { colors: {} } })
    })

    const { result } = renderHook(() => useSystemColors())

    await waitFor(() => {
      expect(result.current.colors).toEqual({
        primary: '#2563eb',
        secondary: '#64748b',
        accent: '#f59e0b',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444'
      })
    })
  })

  it('handles 500 server errors', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    })

    const { result } = renderHook(() => useSystemColors())

    await waitFor(() => {
      expect(result.current.colors).toEqual({
        primary: '#2563eb',
        secondary: '#64748b',
        accent: '#f59e0b',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444'
      })
    })
  })

  it('handles timeout errors', async () => {
    global.fetch.mockImplementation(() => 
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 100)
      )
    )

    const { result } = renderHook(() => useSystemColors())

    await waitFor(() => {
      expect(result.current.colors).toEqual({
        primary: '#2563eb',
        secondary: '#64748b',
        accent: '#f59e0b',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444'
      })
    })
  })
})
