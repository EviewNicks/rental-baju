/**
 * useCreatePengeluaran Hook
 * 
 * React Query mutation hook for creating new expense
 * 
 * Features:
 * - Form data validation
 * - API call to POST /api/kasir/pengeluaran
 * - Cache invalidation after success
 * - Error handling
 * 
 * Requirements: 2.1, 2.2, 2.3
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CreatePengeluaranRequest, PengeluaranKasir } from '../types'


/**
 * Create new expense
 */
async function createPengeluaran(data: CreatePengeluaranRequest): Promise<PengeluaranKasir> {
  const response = await fetch('/api/kasir/pengeluaran', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Gagal membuat pengeluaran')
  }

  const result = await response.json()
  return result.data
}

/**
 * Hook for creating expense
 */
export function useCreatePengeluaran() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreatePengeluaranRequest) => createPengeluaran(data),
    onSuccess: () => {
      // Invalidate dana summary queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['dana-summary'] })
    },
    onError: (error: Error) => {
      console.error('Create pengeluaran error:', error)
    },
  })
}
