import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../../test/test-utils'
import userEvent from '@testing-library/user-event'
import Login from '../Login'
import { createMockUser } from '../../test/test-utils'

// Mock the hooks
vi.mock('../../hooks/useSystemColors', () => ({
  useSystemColors: () => ({
    colors: {
      primary: '#2563eb',
      secondary: '#64748b',
      accent: '#f59e0b',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444'
    }
  })
}))

describe('Login Component', () => {
  const mockLogin = vi.fn()
  const mockNavigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock useNavigate
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom')
      return {
        ...actual,
        useNavigate: () => mockNavigate,
      }
    })
  })

  it('renders login form with all required elements', () => {
    render(<Login />, {
      appContext: { login: mockLogin, loading: false }
    })

    expect(screen.getByText('Welcome back!')).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('displays company name and slogan from settings', () => {
    render(<Login />, {
      appContext: { login: mockLogin, loading: false },
      systemSettingsContext: {
        settings: {
          companyName: 'Test Company',
          companySlogan: 'Test Slogan'
        }
      }
    })

    expect(screen.getByText('Test Company')).toBeInTheDocument()
    expect(screen.getByText('Test Slogan')).toBeInTheDocument()
  })

  it('handles form submission with valid credentials', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue({ success: true })

    render(<Login />, {
      appContext: { login: mockLogin, loading: false }
    })

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  it('shows loading state during form submission', async () => {
    const user = userEvent.setup()
    mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100)))

    render(<Login />, {
      appContext: { login: mockLogin, loading: false }
    })

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    expect(screen.getByText(/signing in/i)).toBeInTheDocument()
  })

  it('handles login errors gracefully', async () => {
    const user = userEvent.setup()
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockLogin.mockRejectedValue(new Error('Login failed'))

    render(<Login />, {
      appContext: { login: mockLogin, loading: false }
    })

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Login error:', expect.any(Error))
    })

    consoleSpy.mockRestore()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()

    render(<Login />, {
      appContext: { login: mockLogin, loading: false }
    })

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)

    // HTML5 validation should prevent submission
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('redirects to dashboard if user is already logged in', () => {
    const mockUser = createMockUser()
    
    render(<Login />, {
      appContext: { user: mockUser, login: mockLogin, loading: false }
    })

    // Should redirect to dashboard, so login form should not be visible
    expect(screen.queryByText('Welcome back!')).not.toBeInTheDocument()
  })

  it('shows loading spinner when context is loading', () => {
    render(<Login />, {
      appContext: { login: mockLogin, loading: true }
    })

    expect(screen.getByTestId('loader')).toBeInTheDocument()
  })

  it('applies custom colors from system settings', () => {
    render(<Login />, {
      appContext: { login: mockLogin, loading: false }
    })

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)

    // Check that inputs have the primary color applied
    expect(emailInput).toHaveStyle({ borderColor: '#2563eb' })
    expect(passwordInput).toHaveStyle({ borderColor: '#2563eb' })
  })

  it('handles email input changes', async () => {
    const user = userEvent.setup()

    render(<Login />, {
      appContext: { login: mockLogin, loading: false }
    })

    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'test@example.com')

    expect(emailInput.value).toBe('test@example.com')
  })

  it('handles password input changes', async () => {
    const user = userEvent.setup()

    render(<Login />, {
      appContext: { login: mockLogin, loading: false }
    })

    const passwordInput = screen.getByLabelText(/password/i)
    await user.type(passwordInput, 'password123')

    expect(passwordInput.value).toBe('password123')
  })
})
