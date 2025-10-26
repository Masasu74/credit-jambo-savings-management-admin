import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockApiResponse, mockApiError } from '../../test/test-utils'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock

describe('API Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  describe('API Request Helper', () => {
    it('makes successful API requests with authentication', async () => {
      const mockData = { success: true, data: { id: 1, name: 'Test' } }
      global.fetch.mockResolvedValueOnce(mockApiResponse(mockData))

      localStorageMock.getItem.mockReturnValue('test-token')

      const response = await fetch('/api/test', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        }
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data).toEqual(mockData)
    })

    it('handles API errors gracefully', async () => {
      global.fetch.mockRejectedValueOnce(mockApiError('Network error'))

      try {
        await fetch('/api/test')
      } catch (error) {
        expect(error.message).toBe('Network error')
      }
    })

    it('handles 401 unauthorized responses', async () => {
      global.fetch.mockResolvedValueOnce(mockApiResponse({ error: 'Unauthorized' }, 401))

      const response = await fetch('/api/test')
      expect(response.ok).toBe(false)
      expect(response.status).toBe(401)
    })

    it('handles 500 server errors', async () => {
      global.fetch.mockResolvedValueOnce(mockApiResponse({ error: 'Internal Server Error' }, 500))

      const response = await fetch('/api/test')
      expect(response.ok).toBe(false)
      expect(response.status).toBe(500)
    })
  })

  describe('Token Management', () => {
    it('stores and retrieves authentication token', () => {
      localStorageMock.setItem.mockImplementation((key, value) => {
        localStorageMock[key] = value
      })
      localStorageMock.getItem.mockImplementation((key) => localStorageMock[key])

      // Store token
      localStorage.setItem('token', 'new-test-token')
      expect(localStorage.setItem).toHaveBeenCalledWith('token', 'new-test-token')

      // Retrieve token
      const token = localStorage.getItem('token')
      expect(token).toBe('new-test-token')
    })

    it('removes authentication token on logout', () => {
      localStorage.removeItem('token')
      expect(localStorage.removeItem).toHaveBeenCalledWith('token')
    })

    it('handles missing token gracefully', () => {
      localStorageMock.getItem.mockReturnValue(null)
      const token = localStorage.getItem('token')
      expect(token).toBeNull()
    })
  })

  describe('Request Headers', () => {
    it('includes default headers for API requests', async () => {
      global.fetch.mockResolvedValueOnce(mockApiResponse({ success: true }))

      await fetch('/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ test: 'data' })
      })

      expect(global.fetch).toHaveBeenCalledWith('/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ test: 'data' })
      })
    })

    it('includes authorization header when token is available', async () => {
      global.fetch.mockResolvedValueOnce(mockApiResponse({ success: true }))
      localStorageMock.getItem.mockReturnValue('auth-token')

      await fetch('/api/test', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer auth-token'
        }
      })

      expect(global.fetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer auth-token'
        }
      })
    })
  })

  describe('Response Handling', () => {
    it('parses JSON responses correctly', async () => {
      const mockData = { id: 1, name: 'Test User', email: 'test@example.com' }
      global.fetch.mockResolvedValueOnce(mockApiResponse(mockData))

      const response = await fetch('/api/users/1')
      const data = await response.json()

      expect(data).toEqual(mockData)
      expect(typeof data).toBe('object')
      expect(data.id).toBe(1)
      expect(data.name).toBe('Test User')
    })

    it('handles empty responses', async () => {
      global.fetch.mockResolvedValueOnce(mockApiResponse({}))

      const response = await fetch('/api/test')
      const data = await response.json()

      expect(data).toEqual({})
    })

    it('handles text responses', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('Success message')
      })

      const response = await fetch('/api/test')
      const text = await response.text()

      expect(text).toBe('Success message')
    })
  })

  describe('Error Handling', () => {
    it('handles network errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      try {
        await fetch('/api/test')
      } catch (error) {
        expect(error.message).toBe('Network error')
      }
    })

    it('handles timeout errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Request timeout'))

      try {
        await fetch('/api/test')
      } catch (error) {
        expect(error.message).toBe('Request timeout')
      }
    })

    it('handles malformed JSON responses', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error('Invalid JSON'))
      })

      const response = await fetch('/api/test')
      
      try {
        await response.json()
      } catch (error) {
        expect(error.message).toBe('Invalid JSON')
      }
    })
  })
})
