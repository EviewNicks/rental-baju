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
 * Fetch dana summary from API
 */
async function fetchDanaSummary(date: Date): Promise<DanaSummaryResponse> {
  const dateStr = formatWITADate(date)
  const response = await fetch(`/api/kasir/dana-summary?date=${dateStr}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Failed to fetch dana summary')
  }

  const result = await response.json()
  return result.data
}

/**
 * Hook for fetching dana summary
 */
export function useDanaSummary(date: Date) {
  const dateStr = formatWITADate(date)

  return useQuery({
    queryKey: ['dana-summary', dateStr],
    queryFn: () => fetchDanaSummary(date),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
}
