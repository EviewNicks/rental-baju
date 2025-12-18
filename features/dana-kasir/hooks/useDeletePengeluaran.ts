/**
 * useDeletePengeluaran Hook
 *
 * React Query mutation hook for deleting (soft delete) expense
 *
 * Features:
 * - API call to DELETE /api/kasir/pengeluaran/[id]
 * - Soft delete (sets isActive = false)
 * - Cache invalidation after success
 * - Error handling
 *
 * Requirements: 3.4, 3.5
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'

/**
 * Delete (soft delete) existing expense
 */
async function deletePengeluaran(id: string): Promise<void> {
  const response = await fetch(`/api/kasir/pengeluaran/${id}`, {
    method: 'DELETE',
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
