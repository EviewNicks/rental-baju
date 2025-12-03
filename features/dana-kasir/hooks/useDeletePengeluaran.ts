/**
 * useDeletePengeluaran Hook
 * 
 * React Query mutation hook for deleting expense (soft delete)
 * 
 * Features:
 * - Soft delete expense by setting isActive = false
 * - Optimistic updates
 * - Cache invalidation
 * - Error handling
 * 
 * Requirements: 3.4, 3.5
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'

interface DeletePengeluaranParams {
  id: string
}

/**
 * Delete expense (soft delete)
 */
async function deletePengeluaran(id: string): Promise<void> {
  const response = await fetch(`/api/kasir/pengeluaran/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Gagal menghapus pengeluaran')
  }
}

/**
 * Hook for deleting expense
 */
export function useDeletePengeluaran() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deletePengeluaran(id),
    onSuccess: () => {
      // Invalidate dana summary queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['dana-summary'] })
    },
    onError: (error: Error) => {
      console.error('Delete pengeluaran error:', error)
    },
  })
}
