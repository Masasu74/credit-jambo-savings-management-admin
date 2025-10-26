import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Loader from '../Loader'

describe('Loader Component', () => {
  it('renders loading spinner', () => {
    render(<Loader />)
    
    expect(screen.getByTestId('loader')).toBeInTheDocument()
  })

  it('renders with custom message', () => {
    render(<Loader message="Loading data..." />)
    
    expect(screen.getByText('Loading data...')).toBeInTheDocument()
  })

  it('renders with default message when no message provided', () => {
    render(<Loader />)
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('applies custom size class', () => {
    render(<Loader size="lg" />)
    
    const loader = screen.getByTestId('loader')
    expect(loader).toHaveClass('w-8', 'h-8')
  })

  it('applies custom color class', () => {
    render(<Loader color="blue" />)
    
    const loader = screen.getByTestId('loader')
    expect(loader).toHaveClass('text-blue-500')
  })
})
