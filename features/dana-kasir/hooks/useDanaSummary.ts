/**
 * React Query Hook for Dana Summary
 * 
 * Fetches daily summary data including:
 * - Summary (income, expense, net balance)
 * - Income list (rental transactions)
 * - Expense list (pengeluaran)
 * 
 * Requirements: 11.1, 11.2, 11.3
 */

import { useQuery } from '@tanstack/react-query'
import { DanaSummaryResponse } from '../types'
import { formatWITADate } from '../utils/timezone'

/**
 * Fetch dana summary from API with role-based filtering
 * 
 * User role is determined by API from Clerk authentication
 * Role-based visibility is handled server-side
 */
async function fetchDanaSummary(
  date: Date, 
  kasirId?: string
): Promise<DanaSummaryResponse> {
  const dateStr = formatWITADate(date)
  const params = new URLSearchParams({ date: dateStr })
  if (kasirId) params.append('kasirId', kasirId)
  
  const response = await fetch(`/api/kasir/dana-summary?${params}`)

  if (!response.ok) {
    const error = await response.json()
    // Provide more detailed error information for debugging
    const errorMessage = error.error?.message || 'Failed to fetch dana summary'
    const errorCode = error.error?.code || 'UNKNOWN_ERROR'
    throw new Error(`${errorMessage} (Code: ${errorCode})`)
  }

  const result = await response.json()
  return result.data
}

/**
 * Hook for fetching dana summary with role-based filtering
 * 
 * @param date - Date to fetch summary for
 * @param kasirId - Optional kasir filter
 * 
 * Role-based visibility is automatically handled server-side:
 * - Kasir users: Only see expenses from other kasir (not Owner)
 * - Owner users: See all expenses with optional kasir filter
 */
export function useDanaSummary(
  date: Date, 
  kasirId?: string
) {
  const dateStr = formatWITADate(date)
  
  // Build query key (simplified - no roleFilter needed)
  const queryKey = [
    'dana-summary', 
    dateStr,
    ...(kasirId ? [kasirId] : [])
  ]

  return useQuery({
    queryKey,
    queryFn: () => fetchDanaSummary(date, kasirId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      // Don't retry on authentication/authorization errors
      if (error.message.includes('UNAUTHORIZED') || error.message.includes('KASIR_NOT_FOUND')) {
        return false
      }
      // Retry up to 3 times for other errors
      return failureCount < 3
    },
  })
}
