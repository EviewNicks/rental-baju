/**
 * Integration Test: Pagination State Management
 *
 * Tests the interaction between:
 * - useTransactions hook (pagination state)
 * - useURLFilters hook (URL synchronization)
 * - TransactionsDashboard component (user interactions)
 *
 * Focus: State management, not UI rendering (leave that for E2E)
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import { useTransactions } from '../useTransactions'
import { useURLFilters } from '../useURLFilters'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSearchParams, useRouter } from 'next/navigation'
import type { ReactNode } from 'react'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
  useRouter: jest.fn(),
}))

// Mock kasir API
jest.mock('../../api', () => ({
  kasirApi: {
    transaksi: {
      getAll: jest.fn(),
    },
  },
}))

const mockPush = jest.fn()
const mockReplace = jest.fn()

describe('Pagination Integration Tests', () => {
  let queryClient: QueryClient
  let originalLocation: Location

  beforeAll(() => {
    // Save original location
    originalLocation = window.location
    // Delete and redefine location once for all tests
    delete (window as any).location
    window.location = { search: '' } as any
  })

  afterAll(() => {
    // Restore original location
    window.location = originalLocation
  })

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    })

    // Reset mocks
    jest.clearAllMocks()

    // Reset location search
    window.location.search = ''

    // Setup router mock
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    })
  })

  afterEach(() => {
    queryClient.clear()
  })

  const wrapper = ({ children }: { children: ReactNode }) => {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }

  describe('useTransactions - Page State Management', () => {
    it('should initialize with page 1', () => {
      const { result } = renderHook(() => useTransactions(), { wrapper })

      expect(result.current.currentPage).toBe(1)
    })

    it('should update page when setPage is called', () => {
      const { result } = renderHook(() => useTransactions(), { wrapper })

      act(() => {
        result.current.setPage(2)
      })

      expect(result.current.currentPage).toBe(2)
    })

    it('should reset to page 1 when resetAllFilters is called', () => {
      const { result } = renderHook(() => useTransactions(), { wrapper })

      act(() => {
        result.current.setPage(3)
      })

      expect(result.current.currentPage).toBe(3)

      act(() => {
        result.current.resetAllFilters()
      })

      expect(result.current.currentPage).toBe(1)
    })

    it('should NOT reset page when updateFilters is called with resetPage: false', () => {
      const { result } = renderHook(() => useTransactions(), { wrapper })

      act(() => {
        result.current.setPage(3)
      })

      expect(result.current.currentPage).toBe(3)

      act(() => {
        result.current.updateFilters({ search: 'test' }, { resetPage: false })
      })

      // Page should remain 3
      expect(result.current.currentPage).toBe(3)
      expect(result.current.filters.search).toBe('test')
    })

    it('should reset page when updateFilters is called with user filter changes (default behavior)', () => {
      const { result } = renderHook(() => useTransactions(), { wrapper })

      act(() => {
        result.current.setPage(3)
      })

      expect(result.current.currentPage).toBe(3)

      act(() => {
        // Default behavior - should reset page for user filter changes
        result.current.updateFilters({ search: 'test' })
      })

      // Page should reset to 1 because it's a user filter change
      expect(result.current.currentPage).toBe(1)
      expect(result.current.filters.search).toBe('test')
    })
  })

  describe('useURLFilters - URL Parsing', () => {
    it('should parse page parameter from URL', () => {
      // Mock URL with page parameter
      const mockSearchParams = new URLSearchParams('?page=3&status=active')
      ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)

      const { result } = renderHook(() => useURLFilters())

      const filters = result.current.parseFiltersFromURL()

      expect(filters.page).toBe(3)
      expect(filters.status).toBe('active')
    })

    it('should ignore invalid page parameter', () => {
      // Mock URL with invalid page
      const mockSearchParams = new URLSearchParams('?page=invalid&status=active')
      ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)

      const { result } = renderHook(() => useURLFilters())

      const filters = result.current.parseFiltersFromURL()

      expect(filters.page).toBeUndefined()
      expect(filters.status).toBe('active')
    })

    it('should ignore negative page parameter', () => {
      // Mock URL with negative page
      const mockSearchParams = new URLSearchParams('?page=-1&status=active')
      ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)

      const { result } = renderHook(() => useURLFilters())

      const filters = result.current.parseFiltersFromURL()

      expect(filters.page).toBeUndefined()
      expect(filters.status).toBe('active')
    })

    it('should ignore page=0', () => {
      // Mock URL with page=0
      const mockSearchParams = new URLSearchParams('?page=0')
      ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)

      const { result } = renderHook(() => useURLFilters())

      const filters = result.current.parseFiltersFromURL()

      expect(filters.page).toBeUndefined()
    })

    it('should update URL with page parameter', () => {
      const mockSearchParams = new URLSearchParams()
      ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)

      const { result } = renderHook(() => useURLFilters())

      act(() => {
        result.current.updateURL({ search: 'test' }, 'all', 2)
      })

      expect(mockReplace).toHaveBeenCalledWith('?search=test&page=2', { scroll: false })
    })

    it('should NOT include page parameter if page is 1', () => {
      const mockSearchParams = new URLSearchParams()
      ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)

      const { result } = renderHook(() => useURLFilters())

      act(() => {
        result.current.updateURL({ search: 'test' }, 'all', 1)
      })

      // Should not include page=1 in URL
      expect(mockReplace).toHaveBeenCalledWith('?search=test', { scroll: false })
    })
  })

  describe('Integration: Pagination State Flow', () => {
    it('should maintain correct page state through filter changes', async () => {
      const mockSearchParams = new URLSearchParams()
      ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)

      const { result } = renderHook(() => useTransactions(), { wrapper })

      // Step 1: User navigates to page 3
      act(() => {
        result.current.setPage(3)
      })
      expect(result.current.currentPage).toBe(3)

      // Step 2: User changes search (should reset to page 1)
      act(() => {
        result.current.updateFilters({ search: 'customer' })
      })
      expect(result.current.currentPage).toBe(1)
      expect(result.current.filters.search).toBe('customer')

      // Step 3: User navigates to page 2
      act(() => {
        result.current.setPage(2)
      })
      expect(result.current.currentPage).toBe(2)

      // Step 4: User changes tab (should reset to page 1)
      act(() => {
        result.current.updateFilters({ status: 'active' })
      })
      expect(result.current.currentPage).toBe(1)
      expect(result.current.filters.status).toBe('active')
    })

    it('should correctly restore page state from URL on initialization', () => {
      // Mock URL with page and filters
      const mockSearchParams = new URLSearchParams('?page=5&status=active&search=test')
      ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)

      const { result: urlResult } = renderHook(() => useURLFilters())
      const { result: transactionResult } = renderHook(() => useTransactions(), { wrapper })

      // Parse filters from URL
      const urlFilters = urlResult.current.parseFiltersFromURL()

      expect(urlFilters.page).toBe(5)
      expect(urlFilters.status).toBe('active')
      expect(urlFilters.search).toBe('test')

      // Simulate initialization process
      act(() => {
        if (urlFilters.page) {
          transactionResult.current.setPage(urlFilters.page)
        }
        const { page: _, ...filtersWithoutPage } = urlFilters
        transactionResult.current.updateFilters(filtersWithoutPage, { resetPage: false })
      })

      // Verify state
      expect(transactionResult.current.currentPage).toBe(5)
      expect(transactionResult.current.filters.status).toBe('active')
      expect(transactionResult.current.filters.search).toBe('test')
    })

    it('should prevent circular updates between page state and URL', async () => {
      const mockSearchParams = new URLSearchParams()
      ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)

      const { result: urlResult } = renderHook(() => useURLFilters())
      const { result: transactionResult } = renderHook(() => useTransactions(), { wrapper })

      // Clear previous calls
      mockReplace.mockClear()

      // Step 1: User clicks page 2
      act(() => {
        transactionResult.current.setPage(2)
      })

      // Step 2: Update URL
      act(() => {
        urlResult.current.updateURL(
          transactionResult.current.filters,
          'all',
          transactionResult.current.currentPage,
        )
      })

      // Step 3: Parse URL (simulating re-render)
      const parsedFilters = urlResult.current.parseFiltersFromURL()

      // Should only call replace once, not trigger circular updates
      expect(mockReplace).toHaveBeenCalledTimes(1)
      expect(parsedFilters.page).toBe(2)
      expect(transactionResult.current.currentPage).toBe(2)
    })
      const parsedFilters = urlResult.current.parseFiltersFromURL()

      // Should only call replace once, not trigger circular updates
      expect(mockReplace).toHaveBeenCalledTimes(1)
      expect(parsedFilters.page).toBe(2)
      expect(transactionResult.current.currentPage).toBe(2)
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid page changes correctly', () => {
      const { result } = renderHook(() => useTransactions(), { wrapper })

      // Rapidly change pages
      act(() => {
        result.current.setPage(2)
        result.current.setPage(3)
        result.current.setPage(4)
      })

      // Should be on page 4
      expect(result.current.currentPage).toBe(4)
    })

    it('should handle page change during filter update', () => {
      const { result } = renderHook(() => useTransactions(), { wrapper })

      act(() => {
        result.current.setPage(5)
        result.current.updateFilters({ search: 'test' })
        // Page should reset to 1 due to filter change
      })

      expect(result.current.currentPage).toBe(1)
      expect(result.current.filters.search).toBe('test')
    })
  })
})
