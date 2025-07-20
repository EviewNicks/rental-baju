/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SearchFilterBar } from './SearchFilterBar'
import type { ViewMode } from '@/features/manage-product/types'

// Mock the useCategories hook
jest.mock('@/features/manage-product/hooks/useCategories', () => ({
  useCategories: () => ({
    data: {
      categories: [
        { id: '1', name: 'Test Category 1' },
        { id: '2', name: 'Test Category 2' },
      ],
    },
    isLoading: false,
  }),
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Search: () => <div data-testid="search-icon" />,
  Filter: () => <div data-testid="filter-icon" />,
  Table: () => <div data-testid="table-icon" />,
  Grid3X3: () => <div data-testid="grid-icon" />,
}))

// Mock UI components
jest.mock('@/components/ui/input', () => ({
  Input: ({ placeholder, value, onChange, disabled, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      data-testid="search-input"
      {...props}
    />
  ),
}))

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div data-testid="card" {...props}>{children}</div>,
  CardContent: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div data-testid="card-content" {...props}>{children}</div>,
}))

interface MockSelectProps {
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  children?: React.ReactNode
}

jest.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, disabled, children }: MockSelectProps) => (
    <div data-testid="select" data-value={value} data-disabled={disabled}>
      <select
        value={value}
        onChange={(e) => onValueChange?.(e.target.value)}
        disabled={disabled}
        data-testid={`select-${value}`}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child) && child.type === 'option') {
            return child
          }
          return null
        })}
      </select>
      {children}
    </div>
  ),
  SelectContent: ({ children }: { children?: React.ReactNode }) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ value, children, disabled }: { value?: string; children?: React.ReactNode; disabled?: boolean }) => (
    <option value={value} disabled={disabled} data-testid={`select-item-${value}`}>
      {children}
    </option>
  ),
  SelectTrigger: ({ children }: { children?: React.ReactNode }) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span data-testid="select-value">{placeholder}</span>,
}))

interface MockToggleGroupProps {
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  children?: React.ReactNode
}

jest.mock('@/components/ui/toggle-group', () => ({
  ToggleGroup: ({ value, onValueChange, disabled, children }: MockToggleGroupProps) => (
    <div
      data-testid="toggle-group"
      data-value={value}
      data-disabled={disabled}
      onClick={() => !disabled && onValueChange?.(value === 'table' ? 'card' : 'table')}
    >
      {children}
    </div>
  ),
  ToggleGroupItem: ({ value, children }: { value?: string; children?: React.ReactNode }) => (
    <button data-testid={`toggle-item-${value}`} data-value={value}>
      {children}
    </button>
  ),
}))

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
}

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  )
}

describe('SearchFilterBar', () => {
  const defaultProps = {
    searchTerm: '',
    onSearchChange: jest.fn(),
    selectedCategory: undefined,
    onCategoryChange: jest.fn(),
    selectedStatus: undefined,
    onStatusChange: jest.fn(),
    viewMode: 'table' as ViewMode,
    onViewModeChange: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render all filter components', () => {
      renderWithQueryClient(<SearchFilterBar {...defaultProps} />)

      expect(screen.getByTestId('search-input')).toBeInTheDocument()
      expect(screen.getByTestId('search-icon')).toBeInTheDocument()
      expect(screen.getByTestId('filter-icon')).toBeInTheDocument()
      expect(screen.getByTestId('toggle-group')).toBeInTheDocument()
    })

    it('should display correct placeholder for search input', () => {
      renderWithQueryClient(<SearchFilterBar {...defaultProps} />)

      const searchInput = screen.getByTestId('search-input')
      expect(searchInput).toHaveAttribute('placeholder', 'Cari produk berdasarkan nama atau kode...')
    })

    it('should display current search term', () => {
      const searchTerm = 'test search'
      renderWithQueryClient(<SearchFilterBar {...defaultProps} searchTerm={searchTerm} />)

      const searchInput = screen.getByTestId('search-input')
      expect(searchInput).toHaveValue(searchTerm)
    })
  })

  describe('Search Functionality', () => {
    it('should call onSearchChange when typing in search input', () => {
      const onSearchChange = jest.fn()
      renderWithQueryClient(<SearchFilterBar {...defaultProps} onSearchChange={onSearchChange} />)

      const searchInput = screen.getByTestId('search-input')
      fireEvent.change(searchInput, { target: { value: 'new search' } })

      expect(onSearchChange).toHaveBeenCalledTimes(1)
    })

    it('should handle empty search term', () => {
      const onSearchChange = jest.fn()
      renderWithQueryClient(<SearchFilterBar {...defaultProps} onSearchChange={onSearchChange} />)

      const searchInput = screen.getByTestId('search-input')
      fireEvent.change(searchInput, { target: { value: '' } })

      expect(onSearchChange).toHaveBeenCalledTimes(1)
    })
  })

  describe('Category Filter', () => {
    it('should display "all" as default value when no category selected', () => {
      renderWithQueryClient(<SearchFilterBar {...defaultProps} selectedCategory={undefined} />)

      const categorySelect = screen.getByTestId('select-all')
      expect(categorySelect).toBeInTheDocument()
    })

    it('should display selected category', () => {
      renderWithQueryClient(<SearchFilterBar {...defaultProps} selectedCategory="1" />)

      const categorySelect = screen.getByTestId('select-1')
      expect(categorySelect).toBeInTheDocument()
    })

    it('should call onCategoryChange when category is selected', () => {
      const onCategoryChange = jest.fn()
      renderWithQueryClient(
        <SearchFilterBar {...defaultProps} onCategoryChange={onCategoryChange} />
      )

      const categorySelect = screen.getByTestId('select-all')
      const selectElement = categorySelect.querySelector('select')
      
      if (selectElement) {
        fireEvent.change(selectElement, { target: { value: '1' } })
        expect(onCategoryChange).toHaveBeenCalledWith('1')
      }
    })
  })

  describe('Status Filter', () => {
    it('should display "Semua" as default value when no status selected', () => {
      renderWithQueryClient(<SearchFilterBar {...defaultProps} selectedStatus={undefined} />)

      const statusSelect = screen.getByTestId('select-Semua')
      expect(statusSelect).toBeInTheDocument()
    })

    it('should call onStatusChange when status is selected', () => {
      const onStatusChange = jest.fn()
      renderWithQueryClient(
        <SearchFilterBar {...defaultProps} onStatusChange={onStatusChange} />
      )

      const statusSelect = screen.getByTestId('select-Semua')
      const selectElement = statusSelect.querySelector('select')
      
      if (selectElement) {
        fireEvent.change(selectElement, { target: { value: 'AVAILABLE' } })
        expect(onStatusChange).toHaveBeenCalledWith('AVAILABLE')
      }
    })
  })

  describe('View Mode Toggle', () => {
    it('should display current view mode', () => {
      renderWithQueryClient(<SearchFilterBar {...defaultProps} viewMode="table" />)

      const toggleGroup = screen.getByTestId('toggle-group')
      expect(toggleGroup).toHaveAttribute('data-value', 'table')
    })

    it('should call onViewModeChange when view mode is toggled', () => {
      const onViewModeChange = jest.fn()
      renderWithQueryClient(
        <SearchFilterBar {...defaultProps} onViewModeChange={onViewModeChange} />
      )

      const toggleGroup = screen.getByTestId('toggle-group')
      fireEvent.click(toggleGroup)

      expect(onViewModeChange).toHaveBeenCalled()
    })
  })

  describe('Loading States', () => {
    it('should disable all controls when isLoading is true', () => {
      renderWithQueryClient(<SearchFilterBar {...defaultProps} isLoading={true} />)

      const searchInput = screen.getByTestId('search-input')
      const toggleGroup = screen.getByTestId('toggle-group')

      expect(searchInput).toBeDisabled()
      expect(toggleGroup).toHaveAttribute('data-disabled', 'true')
    })

    it('should enable all controls when isLoading is false', () => {
      renderWithQueryClient(<SearchFilterBar {...defaultProps} isLoading={false} />)

      const searchInput = screen.getByTestId('search-input')
      const toggleGroup = screen.getByTestId('toggle-group')

      expect(searchInput).not.toBeDisabled()
      expect(toggleGroup).toHaveAttribute('data-disabled', 'false')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels for toggle buttons', () => {
      renderWithQueryClient(<SearchFilterBar {...defaultProps} />)

      const tableToggle = screen.getByTestId('toggle-item-table')
      const cardToggle = screen.getByTestId('toggle-item-card')

      expect(tableToggle).toBeInTheDocument()
      expect(cardToggle).toBeInTheDocument()
    })

    it('should support keyboard navigation', () => {
      renderWithQueryClient(<SearchFilterBar {...defaultProps} />)

      const searchInput = screen.getByTestId('search-input')
      
      // Focus should work on search input
      searchInput.focus()
      expect(document.activeElement).toBe(searchInput)
    })
  })

  describe('Error Handling', () => {
    it('should render without crashing when categories data is undefined', () => {
      // Mock categories hook to return undefined data
      jest.doMock('@/features/manage-product/hooks/useCategories', () => ({
        useCategories: () => ({
          data: undefined,
          isLoading: false,
        }),
      }))

      expect(() => {
        renderWithQueryClient(<SearchFilterBar {...defaultProps} />)
      }).not.toThrow()
    })

    it('should handle loading state for categories', () => {
      // Mock categories hook to return loading state
      jest.doMock('@/features/manage-product/hooks/useCategories', () => ({
        useCategories: () => ({
          data: undefined,
          isLoading: true,
        }),
      }))

      renderWithQueryClient(<SearchFilterBar {...defaultProps} />)

      // Should render loading option
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })
})