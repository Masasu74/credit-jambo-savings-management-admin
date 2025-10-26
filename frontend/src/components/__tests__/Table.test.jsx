import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../../test/test-utils'
import userEvent from '@testing-library/user-event'
import Table from '../Table'

describe('Table Component', () => {
  const mockData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'inactive' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'active' }
  ]

  const mockColumns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'status', label: 'Status', sortable: false }
  ]

  const defaultProps = {
    data: mockData,
    columns: mockColumns,
    onRowClick: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn()
  }

  it('renders table with data correctly', () => {
    render(<Table {...defaultProps} />)

    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
    expect(screen.getByText('active')).toBeInTheDocument()
  })

  it('renders empty state when no data', () => {
    render(<Table {...defaultProps} data={[]} />)

    expect(screen.getByText(/no data available/i)).toBeInTheDocument()
  })

  it('handles row click events', async () => {
    const user = userEvent.setup()
    const mockOnRowClick = vi.fn()

    render(<Table {...defaultProps} onRowClick={mockOnRowClick} />)

    const firstRow = screen.getByText('John Doe').closest('tr')
    await user.click(firstRow)

    expect(mockOnRowClick).toHaveBeenCalledWith(mockData[0])
  })

  it('handles edit button clicks', async () => {
    const user = userEvent.setup()
    const mockOnEdit = vi.fn()

    render(<Table {...defaultProps} onEdit={mockOnEdit} />)

    const editButtons = screen.getAllByRole('button', { name: /edit/i })
    await user.click(editButtons[0])

    expect(mockOnEdit).toHaveBeenCalledWith(mockData[0])
  })

  it('handles delete button clicks', async () => {
    const user = userEvent.setup()
    const mockOnDelete = vi.fn()

    render(<Table {...defaultProps} onDelete={mockOnDelete} />)

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    await user.click(deleteButtons[0])

    expect(mockOnDelete).toHaveBeenCalledWith(mockData[0])
  })

  it('handles sorting when column is sortable', async () => {
    const user = userEvent.setup()
    const mockOnSort = vi.fn()

    render(<Table {...defaultProps} onSort={mockOnSort} />)

    const nameHeader = screen.getByText('Name')
    await user.click(nameHeader)

    expect(mockOnSort).toHaveBeenCalledWith('name', 'asc')
  })

  it('does not trigger sort for non-sortable columns', async () => {
    const user = userEvent.setup()
    const mockOnSort = vi.fn()

    render(<Table {...defaultProps} onSort={mockOnSort} />)

    const statusHeader = screen.getByText('Status')
    await user.click(statusHeader)

    expect(mockOnSort).not.toHaveBeenCalled()
  })

  it('displays loading state', () => {
    render(<Table {...defaultProps} loading={true} />)

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('handles pagination', async () => {
    const user = userEvent.setup()
    const mockOnPageChange = vi.fn()

    render(
      <Table 
        {...defaultProps} 
        pagination={{
          currentPage: 1,
          totalPages: 3,
          totalItems: 30,
          itemsPerPage: 10
        }}
        onPageChange={mockOnPageChange}
      />
    )

    const nextButton = screen.getByRole('button', { name: /next/i })
    await user.click(nextButton)

    expect(mockOnPageChange).toHaveBeenCalledWith(2)
  })

  it('handles search functionality', async () => {
    const user = userEvent.setup()
    const mockOnSearch = vi.fn()

    render(<Table {...defaultProps} onSearch={mockOnSearch} searchable />)

    const searchInput = screen.getByPlaceholderText(/search/i)
    await user.type(searchInput, 'john')

    expect(mockOnSearch).toHaveBeenCalledWith('john')
  })

  it('displays custom cell renderers', () => {
    const customColumns = [
      { 
        key: 'status', 
        label: 'Status',
        render: (value) => (
          <span className={`status-${value}`}>
            {value === 'active' ? '✅' : '❌'} {value}
          </span>
        )
      }
    ]

    render(<Table {...defaultProps} columns={customColumns} />)

    expect(screen.getByText('✅ active')).toBeInTheDocument()
    expect(screen.getByText('❌ inactive')).toBeInTheDocument()
  })

  it('handles bulk actions', async () => {
    const user = userEvent.setup()
    const mockOnBulkAction = vi.fn()

    render(
      <Table 
        {...defaultProps} 
        selectable
        onBulkAction={mockOnBulkAction}
      />
    )

    const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all/i })
    await user.click(selectAllCheckbox)

    const bulkActionButton = screen.getByRole('button', { name: /delete selected/i })
    await user.click(bulkActionButton)

    expect(mockOnBulkAction).toHaveBeenCalledWith('delete', mockData)
  })

  it('handles individual row selection', async () => {
    const user = userEvent.setup()
    const mockOnSelectionChange = vi.fn()

    render(
      <Table 
        {...defaultProps} 
        selectable
        onSelectionChange={mockOnSelectionChange}
      />
    )

    const firstRowCheckbox = screen.getAllByRole('checkbox')[1] // First row checkbox
    await user.click(firstRowCheckbox)

    expect(mockOnSelectionChange).toHaveBeenCalledWith([mockData[0]])
  })

  it('displays custom empty state message', () => {
    render(
      <Table 
        {...defaultProps} 
        data={[]} 
        emptyMessage="No customers found"
      />
    )

    expect(screen.getByText('No customers found')).toBeInTheDocument()
  })

  it('handles custom row styling', () => {
    const mockGetRowClassName = vi.fn().mockReturnValue('custom-row-class')

    render(<Table {...defaultProps} getRowClassName={mockGetRowClassName} />)

    const rows = screen.getAllByRole('row')
    rows.forEach((row, index) => {
      if (index > 0) { // Skip header row
        expect(mockGetRowClassName).toHaveBeenCalledWith(mockData[index - 1], index - 1)
      }
    })
  })

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup()
    const mockOnRowClick = vi.fn()

    render(<Table {...defaultProps} onRowClick={mockOnRowClick} />)

    const firstRow = screen.getByText('John Doe').closest('tr')
    firstRow.focus()
    
    await user.keyboard('{Enter}')

    expect(mockOnRowClick).toHaveBeenCalledWith(mockData[0])
  })

  it('displays tooltips for truncated content', () => {
    const longData = [
      { 
        id: 1, 
        name: 'This is a very long name that should be truncated and show a tooltip when hovered',
        email: 'test@example.com'
      }
    ]

    render(<Table {...defaultProps} data={longData} />)

    const longNameCell = screen.getByText(/This is a very long name/)
    expect(longNameCell).toHaveAttribute('title', longData[0].name)
  })

  it('handles responsive design', () => {
    render(<Table {...defaultProps} responsive />)

    const table = screen.getByRole('table')
    expect(table).toHaveClass('responsive-table')
  })

  it('displays summary information', () => {
    render(
      <Table 
        {...defaultProps} 
        summary={{
          total: 3,
          filtered: 2,
          selected: 1
        }}
      />
    )

    expect(screen.getByText(/showing 2 of 3 entries/i)).toBeInTheDocument()
  })

  it('handles column resizing', async () => {
    const user = userEvent.setup()
    const mockOnColumnResize = vi.fn()

    render(<Table {...defaultProps} onColumnResize={mockOnColumnResize} resizable />)

    const resizeHandle = screen.getByTestId('resize-handle-0')
    await user.click(resizeHandle)

    expect(mockOnColumnResize).toHaveBeenCalled()
  })

  it('maintains accessibility features', () => {
    render(<Table {...defaultProps} />)

    const table = screen.getByRole('table')
    const headers = screen.getAllByRole('columnheader')
    const rows = screen.getAllByRole('row')

    expect(table).toBeInTheDocument()
    expect(headers).toHaveLength(mockColumns.length)
    expect(rows).toHaveLength(mockData.length + 1) // +1 for header row
  })
})
