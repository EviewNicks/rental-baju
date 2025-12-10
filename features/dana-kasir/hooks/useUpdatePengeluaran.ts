/**
 * useUpdatePengeluaran Hook
 * 
 * React Query mutation hook for updating existing expense
 * 
 * Features:
 * - Form data validation
 * - API call to PUT /api/kasir/pengeluaran/[id]
 * - Cache invalidation after success
 * - Error handling
 * 
 * Requirements: 2.5, 3.2, 3.3
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { UpdatePengeluaranRequest, PengeluaranKasir } from '../types'

interface UpdatePengeluaranParams {
  id: string
  data: UpdatePengeluaranRequest
}

/**
 * Update existing expense
 */
async function updatePengeluaran(id: string, data: UpdatePengeluaranRequest): Promise<PengeluaranKasir> {
  const response = await fetch(`/api/kasir/pengeluaran/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Gagal memperbarui pengeluaran')
  }

  const result = await response.json()
  return result.data
}

/**
 * Hook for updating expense
 */
export function useUpdatePengeluaran() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: UpdatePengeluaranParams) => updatePengeluaran(id, data),
    onSuccess: () => {
      // Invalidate dana summary queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['dana-summary'] })
    },
    onError: (error: Error) => {
      console.error('Update pengeluaran error:', error)
    },
  })
}
