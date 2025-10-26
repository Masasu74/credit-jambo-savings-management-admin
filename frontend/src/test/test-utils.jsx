import React from 'react'
import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { SystemSettingsContext } from '../context/SystemSettingsContext'
import { NotificationContext } from '../context/NotificationContext'
import { ThemeProvider } from '../context/ThemeContext'

// Default context values for testing
const defaultAppContext = {
  user: null,
  customers: [],
  loans: [],
  loading: false,
  customersLoading: false,
  loansLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
  fetchCustomers: vi.fn(),
  fetchLoans: vi.fn(),
  addCustomer: vi.fn(),
  updateCustomer: vi.fn(),
  deleteCustomer: vi.fn(),
  addLoan: vi.fn(),
  updateLoan: vi.fn(),
  deleteLoan: vi.fn(),
}

const defaultSystemSettingsContext = {
  settings: {
    companyName: 'Test Company',
    companySlogan: 'Test Slogan',
    logo: null,
  },
  loading: false,
  updateSettings: vi.fn(),
}

const defaultNotificationContext = {
  notifications: [],
  addNotification: vi.fn(),
  removeNotification: vi.fn(),
  clearNotifications: vi.fn(),
}

const defaultThemeContext = {
  darkMode: false,
  toggleDarkMode: vi.fn(),
}

// Custom render function that includes all providers
const AllTheProviders = ({ children, appContext = {}, systemSettingsContext = {}, notificationContext = {}, themeContext = {} }) => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <SystemSettingsContext.Provider value={{ ...defaultSystemSettingsContext, ...systemSettingsContext }}>
          <NotificationContext.Provider value={{ ...defaultNotificationContext, ...notificationContext }}>
            <AppContext.Provider value={{ ...defaultAppContext, ...appContext }}>
              {children}
            </AppContext.Provider>
          </NotificationContext.Provider>
        </SystemSettingsContext.Provider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

const customRender = (ui, options = {}) => {
  const {
    appContext = {},
    systemSettingsContext = {},
    notificationContext = {},
    themeContext = {},
    ...renderOptions
  } = options

  const Wrapper = ({ children }) => (
    <AllTheProviders
      appContext={appContext}
      systemSettingsContext={systemSettingsContext}
      notificationContext={notificationContext}
      themeContext={themeContext}
    >
      {children}
    </AllTheProviders>
  )

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Helper function to create mock user
export const createMockUser = (overrides = {}) => ({
  _id: 'user123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'admin',
  branch: 'main',
  permissions: ['read', 'write'],
  ...overrides,
})

// Helper function to create mock customer
export const createMockCustomer = (overrides = {}) => ({
  _id: 'customer123',
  customerNo: 'CUST001',
  personalInfo: {
    fullName: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
  },
  status: 'active',
  ...overrides,
})

// Helper function to create mock loan
export const createMockLoan = (overrides = {}) => ({
  _id: 'loan123',
  loanNo: 'LOAN001',
  customer: createMockCustomer(),
  amount: 1000000,
  disbursedAmount: 1000000,
  interestRate: 12,
  durationMonths: 12,
  status: 'disbursed',
  disbursementDate: '2024-01-01',
  ...overrides,
})

// Helper function to mock API responses
export const mockApiResponse = (data, status = 200) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  })
}

// Helper function to mock API error
export const mockApiError = (message = 'API Error', status = 500) => {
  return Promise.reject(new Error(message))
}
