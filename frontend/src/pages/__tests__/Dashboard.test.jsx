import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../../test/test-utils'
import Dashboard from '../Dashboard'
import { createMockUser, createMockCustomer, createMockLoan } from '../../test/test-utils'

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

// Mock fetch
global.fetch = vi.fn()

describe('Dashboard Component', () => {
  const mockFetchCustomers = vi.fn()
  const mockFetchLoans = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders dashboard with loading state initially', () => {
    render(<Dashboard />, {
      appContext: {
        loading: true,
        fetchCustomers: mockFetchCustomers,
        fetchLoans: mockFetchLoans
      }
    })

    expect(screen.getByTestId('loader')).toBeInTheDocument()
  })

  it('renders dashboard cards with correct data', async () => {
    const mockCustomers = [
      createMockCustomer({ _id: '1', customerNo: 'CUST001' }),
      createMockCustomer({ _id: '2', customerNo: 'CUST002' }),
      createMockCustomer({ _id: '3', customerNo: 'CUST003' })
    ]

    const mockLoans = [
      createMockLoan({ _id: '1', status: 'disbursed', amount: 1000000 }),
      createMockLoan({ _id: '2', status: 'approved', amount: 2000000 }),
      createMockLoan({ _id: '3', status: 'completed', amount: 500000, disbursedAmount: 500000 })
    ]

    render(<Dashboard />, {
      appContext: {
        loading: false,
        customers: mockCustomers,
        loans: mockLoans,
        fetchCustomers: mockFetchCustomers,
        fetchLoans: mockFetchLoans
      }
    })

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument() // Total customers
      expect(screen.getByText('1')).toBeInTheDocument() // Ongoing loans
      expect(screen.getByText('1')).toBeInTheDocument() // Approved loans
      expect(screen.getByText('1')).toBeInTheDocument() // Completed loans
    })
  })

  it('displays correct loan statistics', async () => {
    const mockLoans = [
      createMockLoan({ 
        _id: '1', 
        status: 'disbursed', 
        amount: 1000000,
        disbursedAmount: 1000000,
        interestRate: 12,
        durationMonths: 12
      }),
      createMockLoan({ 
        _id: '2', 
        status: 'completed', 
        amount: 500000,
        disbursedAmount: 500000,
        interestRate: 10,
        durationMonths: 6
      })
    ]

    render(<Dashboard />, {
      appContext: {
        loading: false,
        customers: [],
        loans: mockLoans,
        fetchCustomers: mockFetchCustomers,
        fetchLoans: mockFetchLoans
      }
    })

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument() // Ongoing loans
      expect(screen.getByText('1')).toBeInTheDocument() // Completed loans
    })
  })

  it('calculates total interest earned correctly', async () => {
    const mockLoans = [
      createMockLoan({ 
        _id: '1', 
        status: 'completed', 
        amount: 1000000,
        disbursedAmount: 1000000,
        interestRate: 12,
        durationMonths: 12
      }),
      createMockLoan({ 
        _id: '2', 
        status: 'completed', 
        amount: 500000,
        disbursedAmount: 500000,
        interestRate: 10,
        durationMonths: 6
      })
    ]

    render(<Dashboard />, {
      appContext: {
        loading: false,
        customers: [],
        loans: mockLoans,
        fetchCustomers: mockFetchCustomers,
        fetchLoans: mockFetchLoans
      }
    })

    await waitFor(() => {
      // Expected interest: (1000000 * 12 * 12 / 100 / 12) + (500000 * 10 * 6 / 100 / 12) = 120000 + 25000 = 145000
      expect(screen.getByText(/145,000/)).toBeInTheDocument()
    })
  })

  it('handles missing loan data gracefully', async () => {
    const mockLoans = [
      createMockLoan({ 
        _id: '1', 
        status: 'completed', 
        amount: null, // Missing amount
        disbursedAmount: null,
        interestRate: 12,
        durationMonths: 12
      })
    ]

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    render(<Dashboard />, {
      appContext: {
        loading: false,
        customers: [],
        loans: mockLoans,
        fetchCustomers: mockFetchCustomers,
        fetchLoans: mockFetchLoans
      }
    })

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled()
    })

    consoleSpy.mockRestore()
  })

  it('fetches expense statistics on mount', async () => {
    const mockExpenseStats = {
      totalExpenses: 500000,
      monthlyAverage: 50000,
      categoryBreakdown: []
    }

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: mockExpenseStats })
    })

    localStorage.setItem('token', 'test-token')

    render(<Dashboard />, {
      appContext: {
        loading: false,
        customers: [],
        loans: [],
        fetchCustomers: mockFetchCustomers,
        fetchLoans: mockFetchLoans
      }
    })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/expenses/stats', {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      })
    })
  })

  it('handles expense stats fetch error gracefully', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'))

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<Dashboard />, {
      appContext: {
        loading: false,
        customers: [],
        loans: [],
        fetchCustomers: mockFetchCustomers,
        fetchLoans: mockFetchLoans
      }
    })

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching expense stats:', expect.any(Error))
    })

    consoleSpy.mockRestore()
  })

  it('displays zero values when no data is available', async () => {
    render(<Dashboard />, {
      appContext: {
        loading: false,
        customers: [],
        loans: [],
        fetchCustomers: mockFetchCustomers,
        fetchLoans: mockFetchLoans
      }
    })

    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument() // Total customers
      expect(screen.getByText('0')).toBeInTheDocument() // Ongoing loans
      expect(screen.getByText('0')).toBeInTheDocument() // Approved loans
      expect(screen.getByText('0')).toBeInTheDocument() // Completed loans
    })
  })

  it('calls fetch functions on mount', async () => {
    render(<Dashboard />, {
      appContext: {
        loading: false,
        customers: [],
        loans: [],
        fetchCustomers: mockFetchCustomers,
        fetchLoans: mockFetchLoans
      }
    })

    await waitFor(() => {
      expect(mockFetchCustomers).toHaveBeenCalled()
      expect(mockFetchLoans).toHaveBeenCalledWith(true) // Get all loans
    })
  })

  it('displays charts when data is available', async () => {
    const mockLoans = [
      createMockLoan({ status: 'disbursed' }),
      createMockLoan({ status: 'approved' }),
      createMockLoan({ status: 'completed' })
    ]

    render(<Dashboard />, {
      appContext: {
        loading: false,
        customers: [],
        loans: mockLoans,
        fetchCustomers: mockFetchCustomers,
        fetchLoans: mockFetchLoans
      }
    })

    await waitFor(() => {
      // Check for chart containers
      expect(screen.getByText('Loan Status Distribution')).toBeInTheDocument()
    })
  })

  it('handles large numbers correctly', async () => {
    const mockLoans = [
      createMockLoan({ 
        _id: '1', 
        status: 'completed', 
        amount: 1000000000, // 1 billion
        disbursedAmount: 1000000000,
        interestRate: 12,
        durationMonths: 12
      })
    ]

    render(<Dashboard />, {
      appContext: {
        loading: false,
        customers: [],
        loans: mockLoans,
        fetchCustomers: mockFetchCustomers,
        fetchLoans: mockFetchLoans
      }
    })

    await waitFor(() => {
      // Should display 1B instead of 1000M
      expect(screen.getByText(/1B/)).toBeInTheDocument()
    })
  })

  it('applies custom colors from system settings', async () => {
    render(<Dashboard />, {
      appContext: {
        loading: false,
        customers: [],
        loans: [],
        fetchCustomers: mockFetchCustomers,
        fetchLoans: mockFetchLoans
      }
    })

    await waitFor(() => {
      // Check that cards have the primary color applied
      const cards = screen.getAllByText(/0/)
      cards.forEach(card => {
        const cardElement = card.closest('div')
        if (cardElement) {
          expect(cardElement).toHaveStyle({ borderColor: 'rgba(37, 99, 235, 0.2)' })
        }
      })
    })
  })
})
