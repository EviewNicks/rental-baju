'use client'

import { useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { TransactionFilters, TransactionStatus } from '../types'

/**
 * Custom hook for URL state persistence of transaction filters
 *
 * Features:
 * - Sync filters with URL parameters
 * - Restore filters from URL on page load
 * - Handle invalid URL parameters gracefully
 * - Update URL when filters change
 */
export function useURLFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Parse filters from URL parameters
  const parseFiltersFromURL = useCallback((): TransactionFilters & { page?: number } => {
    const filters: TransactionFilters & { page?: number } = {}

    // Parse status filter
    const status = searchParams.get('status')
    if (
      status &&
      (status === 'all' ||
        ['active', 'diambil', 'selesai', 'terlambat', 'cancelled'].includes(status))
    ) {
      filters.status = status === 'all' ? undefined : (status as TransactionStatus)
    }

    // Parse search filter
    const search = searchParams.get('search')
    if (search && search.trim()) {
      filters.search = search.trim()
    }

    // Parse date filter with validation
    const tglMulai = searchParams.get('tglMulai')
    if (tglMulai) {
      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (dateRegex.test(tglMulai)) {
        // Validate if it's a valid date
        const date = new Date(tglMulai)
        if (!isNaN(date.getTime())) {
          filters.dateFilter = tglMulai
        } else {
          console.warn('Invalid date in URL parameter:', tglMulai)
        }
      } else {
        console.warn('Invalid date format in URL parameter:', tglMulai)
      }
    }

    // Parse dateCreated filter with validation
    const dateCreated = searchParams.get('dateCreated')
    if (dateCreated) {
      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (dateRegex.test(dateCreated)) {
        // Validate if it's a valid date
        const date = new Date(dateCreated)
        if (!isNaN(date.getTime())) {
          filters.dateCreated = dateCreated
        } else {
          console.warn('Invalid dateCreated in URL parameter:', dateCreated)
        }
      } else {
        console.warn('Invalid dateCreated format in URL parameter:', dateCreated)
      }
    }

    // Parse page parameter
    const page = searchParams.get('page')
    if (page && !isNaN(Number(page)) && Number(page) > 0) {
      filters.page = Number(page)
    }

    return filters
  }, [searchParams])

  // Update URL with current filters
  const updateURL = useCallback(
    (filters: TransactionFilters, activeTab: TransactionStatus | 'all', page: number = 1) => {
      const params = new URLSearchParams()

      // Add status parameter
      if (activeTab && activeTab !== 'all') {
        params.set('status', activeTab)
      }

      // Add search parameter
      if (filters.search && filters.search.trim()) {
        params.set('search', filters.search.trim())
      }

      // Add date filter parameter
      if (filters.dateFilter && filters.dateFilter.trim()) {
        params.set('tglMulai', filters.dateFilter.trim())
      }

      // Add dateCreated filter parameter
      if (filters.dateCreated && filters.dateCreated.trim()) {
        params.set('dateCreated', filters.dateCreated.trim())
      }

      // Add page parameter (only if not page 1)
      if (page > 1) {
        params.set('page', page.toString())
      }

      // Update URL without causing a page reload
      const newURL = params.toString() ? `?${params.toString()}` : '/dashboard'

      // Only update if URL actually changed to avoid unnecessary history entries
      const currentURL = window.location.search
      const targetURL = params.toString() ? `?${params.toString()}` : ''

      if (currentURL !== targetURL) {
        router.replace(newURL, { scroll: false })
      }
    },
    [router],
  )

  // Handle URL parameter parsing errors
  const handleURLError = useCallback((error: Error, paramName: string, paramValue: string) => {
    console.warn(
      `URL parameter parsing error for ${paramName}:`,
      error.message,
      'Value:',
      paramValue,
    )

    // For date filter errors, we could show a toast notification
    if (paramName === 'tglMulai') {
      // Note: We could add toast notification here if needed
      console.warn('Invalid date filter in URL, ignoring parameter')
    }
    if (paramName === 'dateCreated') {
      console.warn('Invalid dateCreated filter in URL, ignoring parameter')
    }
  }, [])

  // Validate and sanitize URL parameters
  const validateURLParams = useCallback(() => {
    const currentParams = new URLSearchParams(window.location.search)
    let hasInvalidParams = false

    // Validate date parameter
    const tglMulai = currentParams.get('tglMulai')
    if (tglMulai) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(tglMulai)) {
        currentParams.delete('tglMulai')
        hasInvalidParams = true
        handleURLError(new Error('Invalid date format'), 'tglMulai', tglMulai)
      } else {
        const date = new Date(tglMulai)
        if (isNaN(date.getTime())) {
          currentParams.delete('tglMulai')
          hasInvalidParams = true
          handleURLError(new Error('Invalid date value'), 'tglMulai', tglMulai)
        }
      }
    }

    // Validate dateCreated parameter
    const dateCreated = currentParams.get('dateCreated')
    if (dateCreated) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(dateCreated)) {
        currentParams.delete('dateCreated')
        hasInvalidParams = true
        handleURLError(new Error('Invalid date format'), 'dateCreated', dateCreated)
      } else {
        const date = new Date(dateCreated)
        if (isNaN(date.getTime())) {
          currentParams.delete('dateCreated')
          hasInvalidParams = true
          handleURLError(new Error('Invalid date value'), 'dateCreated', dateCreated)
        }
      }
    }

    // Validate status parameter
    const status = currentParams.get('status')
    if (
      status &&
      !['all', 'active', 'diambil', 'selesai', 'terlambat', 'cancelled'].includes(status)
    ) {
      currentParams.delete('status')
      hasInvalidParams = true
      handleURLError(new Error('Invalid status value'), 'status', status)
    }

    // Clean up URL if we found invalid parameters
    if (hasInvalidParams) {
      const cleanURL = currentParams.toString() ? `?${currentParams.toString()}` : '/dashboard'
      router.replace(cleanURL, { scroll: false })
    }
  }, [router, handleURLError])

  // Initialize URL validation on mount
  useEffect(() => {
    validateURLParams()
  }, [validateURLParams])

  return {
    parseFiltersFromURL,
    updateURL,
    handleURLError,
    validateURLParams,
  }
}
