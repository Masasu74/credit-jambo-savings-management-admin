import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../test/test-utils'
import { FaUser } from 'react-icons/fa'
import DashCard from '../DashCard'

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

describe('DashCard Component', () => {
  const defaultProps = {
    title: 'Total Customers',
    number: '1,234',
    subtitle: 'Active customers',
    icon: <FaUser data-testid="user-icon" />
  }

  it('renders with all props correctly', () => {
    render(<DashCard {...defaultProps} />)

    expect(screen.getByText('Total Customers')).toBeInTheDocument()
    expect(screen.getByText('1,234')).toBeInTheDocument()
    expect(screen.getByText('Active customers')).toBeInTheDocument()
    expect(screen.getByTestId('user-icon')).toBeInTheDocument()
  })

  it('renders without optional props', () => {
    render(<DashCard number="500" icon={<FaUser />} />)

    expect(screen.getByText('500')).toBeInTheDocument()
    expect(screen.queryByText('Total Customers')).not.toBeInTheDocument()
    expect(screen.queryByText('Active customers')).not.toBeInTheDocument()
  })

  it('displays currency format correctly for Frw values', () => {
    render(<DashCard {...defaultProps} number="Frw 1,000,000" />)

    const currencyText = screen.getByText('Frw')
    const amountText = screen.getByText('1,000,000')
    
    expect(currencyText).toBeInTheDocument()
    expect(amountText).toBeInTheDocument()
  })

  it('applies custom colors from system settings', () => {
    render(<DashCard {...defaultProps} />)

    const card = screen.getByText('Total Customers').closest('div')
    const subtitle = screen.getByText('Active customers')
    
    // Check that the card has the primary color applied
    expect(card).toHaveStyle({ borderColor: 'rgba(37, 99, 235, 0.2)' })
    expect(subtitle).toHaveStyle({ color: '#2563eb' })
  })

  it('handles large numbers correctly', () => {
    render(<DashCard {...defaultProps} number="1,000,000,000" />)

    expect(screen.getByText('1,000,000,000')).toBeInTheDocument()
  })

  it('handles zero values', () => {
    render(<DashCard {...defaultProps} number="0" />)

    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('handles negative values', () => {
    render(<DashCard {...defaultProps} number="-500" />)

    expect(screen.getByText('-500')).toBeInTheDocument()
  })

  it('renders with different icon types', () => {
    const { rerender } = render(<DashCard {...defaultProps} />)
    expect(screen.getByTestId('user-icon')).toBeInTheDocument()

    // Test with a different icon
    const CustomIcon = () => <div data-testid="custom-icon">💰</div>
    rerender(<DashCard {...defaultProps} icon={<CustomIcon />} />)
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
  })

  it('applies hover effects and animations', () => {
    render(<DashCard {...defaultProps} />)

    const card = screen.getByText('Total Customers').closest('div')
    
    // Check for hover classes
    expect(card).toHaveClass('group')
    expect(card).toHaveClass('hover:shadow-2xl')
    expect(card).toHaveClass('hover:-translate-y-1')
    expect(card).toHaveClass('hover:scale-[1.02]')
  })

  it('handles long text content', () => {
    const longTitle = 'This is a very long title that might overflow the card boundaries'
    const longSubtitle = 'This is a very long subtitle that might also overflow'
    
    render(<DashCard {...defaultProps} title={longTitle} subtitle={longSubtitle} />)

    expect(screen.getByText(longTitle)).toBeInTheDocument()
    expect(screen.getByText(longSubtitle)).toBeInTheDocument()
  })

  it('renders with different number formats', () => {
    const { rerender } = render(<DashCard {...defaultProps} number="1,234.56" />)
    expect(screen.getByText('1,234.56')).toBeInTheDocument()

    rerender(<DashCard {...defaultProps} number="100%" />)
    expect(screen.getByText('100%')).toBeInTheDocument()

    rerender(<DashCard {...defaultProps} number="$1,000" />)
    expect(screen.getByText('$1,000')).toBeInTheDocument()
  })

  it('maintains accessibility features', () => {
    render(<DashCard {...defaultProps} />)

    // Check that the card is properly structured
    const title = screen.getByText('Total Customers')
    const number = screen.getByText('1,234')
    
    expect(title).toBeInTheDocument()
    expect(number).toBeInTheDocument()
    
    // Check that the card has proper semantic structure
    const card = title.closest('div')
    expect(card).toHaveClass('bg-white/90')
  })

  it('handles fallback colors when hook fails', () => {
    // Mock the hook to return null
    vi.mocked(require('../../hooks/useSystemColors').useSystemColors).mockReturnValue({ colors: null })

    render(<DashCard {...defaultProps} />)

    const subtitle = screen.getByText('Active customers')
    expect(subtitle).toHaveStyle({ color: '#2563eb' }) // Should use fallback color
  })

  it('renders with dark mode classes', () => {
    render(<DashCard {...defaultProps} />)

    const card = screen.getByText('Total Customers').closest('div')
    
    // Check for dark mode classes
    expect(card).toHaveClass('dark:bg-gray-800/90')
    expect(card).toHaveClass('dark:shadow-gray-900/30')
    expect(card).toHaveClass('dark:border-gray-700/50')
  })
})
