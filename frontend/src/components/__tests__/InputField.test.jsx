import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../../test/test-utils'
import userEvent from '@testing-library/user-event'
import InputField from '../InputField'

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

describe('InputField Component', () => {
  const defaultProps = {
    label: 'Email',
    name: 'email',
    type: 'email',
    placeholder: 'Enter your email',
    required: true
  }

  it('renders with all props correctly', () => {
    render(<InputField {...defaultProps} />)

    expect(screen.getByLabelText('Email *')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email')
    expect(screen.getByRole('textbox')).toHaveAttribute('name', 'email')
    expect(screen.getByRole('textbox')).toBeRequired()
  })

  it('renders without required indicator when not required', () => {
    render(<InputField {...defaultProps} required={false} />)

    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.queryByText('*')).not.toBeInTheDocument()
  })

  it('handles value changes', async () => {
    const user = userEvent.setup()
    const mockOnChange = vi.fn()

    render(<InputField {...defaultProps} onChange={mockOnChange} />)

    const input = screen.getByRole('textbox')
    await user.type(input, 'test@example.com')

    expect(mockOnChange).toHaveBeenCalled()
    expect(input.value).toBe('test@example.com')
  })

  it('displays error message when provided', () => {
    render(<InputField {...defaultProps} error="Email is required" />)

    expect(screen.getByText('Email is required')).toBeInTheDocument()
    expect(screen.getByText('Email is required')).toHaveClass('text-red-500')
  })

  it('applies error styling when error is present', () => {
    render(<InputField {...defaultProps} error="Email is required" />)

    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('border-red-500')
  })

  it('applies custom colors from system settings', () => {
    render(<InputField {...defaultProps} />)

    const input = screen.getByRole('textbox')
    expect(input).toHaveStyle({ borderColor: '#2563eb' })
  })

  it('handles different input types', () => {
    const { rerender } = render(<InputField {...defaultProps} type="password" />)
    expect(screen.getByLabelText('Email *')).toHaveAttribute('type', 'password')

    rerender(<InputField {...defaultProps} type="number" />)
    expect(screen.getByLabelText('Email *')).toHaveAttribute('type', 'number')

    rerender(<InputField {...defaultProps} type="tel" />)
    expect(screen.getByLabelText('Email *')).toHaveAttribute('type', 'tel')
  })

  it('handles disabled state', () => {
    render(<InputField {...defaultProps} disabled />)

    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
    expect(input).toHaveClass('opacity-50')
    expect(input).toHaveClass('cursor-not-allowed')
  })

  it('handles read-only state', () => {
    render(<InputField {...defaultProps} readOnly />)

    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('readonly')
  })

  it('handles custom className', () => {
    render(<InputField {...defaultProps} className="custom-class" />)

    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('custom-class')
  })

  it('handles custom value', () => {
    render(<InputField {...defaultProps} value="test@example.com" />)

    const input = screen.getByRole('textbox')
    expect(input.value).toBe('test@example.com')
  })

  it('handles controlled component pattern', async () => {
    const user = userEvent.setup()
    const mockOnChange = vi.fn()

    render(<InputField {...defaultProps} value="" onChange={mockOnChange} />)

    const input = screen.getByRole('textbox')
    await user.type(input, 'a')

    expect(mockOnChange).toHaveBeenCalled()
  })

  it('handles focus and blur events', async () => {
    const user = userEvent.setup()
    const mockOnFocus = vi.fn()
    const mockOnBlur = vi.fn()

    render(<InputField {...defaultProps} onFocus={mockOnFocus} onBlur={mockOnBlur} />)

    const input = screen.getByRole('textbox')
    
    await user.click(input)
    expect(mockOnFocus).toHaveBeenCalled()

    await user.tab()
    expect(mockOnBlur).toHaveBeenCalled()
  })

  it('handles long labels gracefully', () => {
    const longLabel = 'This is a very long label that might wrap to multiple lines'
    render(<InputField {...defaultProps} label={longLabel} />)

    expect(screen.getByText(longLabel)).toBeInTheDocument()
  })

  it('handles special characters in labels', () => {
    const specialLabel = 'Email Address (Primary)'
    render(<InputField {...defaultProps} label={specialLabel} />)

    expect(screen.getByText(specialLabel)).toBeInTheDocument()
  })

  it('maintains accessibility features', () => {
    render(<InputField {...defaultProps} id="email-input" />)

    const input = screen.getByRole('textbox')
    const label = screen.getByText('Email *')

    expect(input).toHaveAttribute('id', 'email-input')
    expect(label).toHaveAttribute('for', 'email-input')
  })

  it('handles multiple error messages', () => {
    const errors = ['Email is required', 'Email format is invalid']
    render(<InputField {...defaultProps} error={errors} />)

    errors.forEach(error => {
      expect(screen.getByText(error)).toBeInTheDocument()
    })
  })

  it('handles custom validation attributes', () => {
    render(
      <InputField 
        {...defaultProps} 
        minLength={5}
        maxLength={50}
        pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
      />
    )

    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('minlength', '5')
    expect(input).toHaveAttribute('maxlength', '50')
    expect(input).toHaveAttribute('pattern', '[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$')
  })
})
