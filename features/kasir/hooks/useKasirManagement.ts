import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { kasirApi } from '../api'
import type { Kasir, KasirListResponse, UpdateKasirRequest } from '../types'

interface UseKasirManagementOptions {
  onSuccess?: (kasir: Kasir) => void
  onError?: (error: Error) => void
}

export function useKasirManagement(options: UseKasirManagementOptions = {}) {
  const queryClient = useQueryClient()

  // Queries
  const kasirListQuery = useQuery({
    queryKey: ['kasir', 'list'],
    queryFn: () => kasirApi.kasir.getAll(),
    select: (response: KasirListResponse) => response.data,
  })

  const kasirListPaginatedQuery = useQuery({
    queryKey: ['kasir', 'list', 'paginated'],
    queryFn: () => kasirApi.kasir.getAll({ page: 1, limit: 20 }),
  })

  const availableKasirQuery = useQuery({
    queryKey: ['kasir', 'available'],
    queryFn: () => kasirApi.kasir.getForSelection(),
    select: (response) => response,
  })

  // Mutations
  const createKasirMutation = useMutation({
    mutationFn: kasirApi.kasir.create,
    onSuccess: (kasir) => {
      toast.success('Kasir berhasil ditambahkan')
      queryClient.invalidateQueries({ queryKey: ['kasir'] })
      options.onSuccess?.(kasir)
    },
    onError: (error) => {
      const errorMessage = error.message || 'Gagal menambahkan kasir'
      toast.error(errorMessage)
      options.onError?.(error)
    },
  })

  const updateKasirMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateKasirRequest }) =>
      kasirApi.kasir.update(id, data),
    onSuccess: (kasir) => {
      toast.success('Data kasir berhasil diperbarui')
      queryClient.invalidateQueries({ queryKey: ['kasir'] })
      options.onSuccess?.(kasir)
    },
    onError: (error) => {
      const errorMessage = error.message || 'Gagal memperbarui data kasir'
      toast.error(errorMessage)
      options.onError?.(error)
    },
  })

  const deleteKasirMutation = useMutation({
    mutationFn: kasirApi.kasir.delete,
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['kasir', 'list'] })

      // Snapshot the previous value
      //eslint-disable-next-line @typescript-eslint/no-explicit-any
      const previousKasirs: any = queryClient.getQueryData(['kasir', 'list'])

      // Optimistically update to the new value
      //eslint-disable-next-line @typescript-eslint/no-explicit-any
      queryClient.setQueryData(['kasir', 'list'], (old: any) => {
        if (!old?.data) return old
        return {
          ...old,
          data: old.data.filter((kasir: Kasir) => kasir.id !== id),
          pagination: {
            ...old.pagination,
            total: Math.max(0, old.pagination.total - 1),
          },
          summary: {
            ...old.summary,
            total: Math.max(0, old.summary.total - 1),
            active: previousKasirs?.find?.((k: Kasir) => k.id === id)?.isActive
              ? Math.max(0, old.summary.active - 1)
              : old.summary.active,
          },
        }
      })

      // Return a context object with the snapshotted value
      return { previousKasirs }
    },
    onError: (error, id, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousKasirs) {
        queryClient.setQueryData(['kasir', 'list'], context.previousKasirs)
      }
      toast.error('Gagal menghapus kasir')
      options.onError?.(error)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['kasir', 'list'] })
    },
  })

  // Utility functions
  const getKasirById = (id: string) => {
    return queryClient.getQueryData<Kasir>(['kasir', id])
  }

  const invalidateKasirQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['kasir'] })
  }

  const prefetchKasir = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: ['kasir', id],
      queryFn: () => kasirApi.kasir.getById(id),
    })
  }

  // Filter out system kasir (owner-system) from available kasirs for transaction selection
  const filteredAvailableKasirs = (availableKasirQuery.data || []).filter(
    kasir => kasir.id !== 'owner-system'
  )

  return {
    // Query data
    kasirs: kasirListQuery.data || [],
    kasirsPaginated: kasirListPaginatedQuery.data,
    availableKasirs: filteredAvailableKasirs,

    // Loading states
    isLoadingKasirs: kasirListQuery.isLoading,
    isLoadingAvailable: availableKasirQuery.isLoading,

    // Error states
    kasirsError: kasirListQuery.error,
    availableError: availableKasirQuery.error,

    // Mutations
    createKasir: createKasirMutation.mutate,
    updateKasir: updateKasirMutation.mutate,
    deleteKasir: deleteKasirMutation.mutate,

    // Mutation states
    isCreating: createKasirMutation.isPending,
    isUpdating: updateKasirMutation.isPending,
    isDeleting: deleteKasirMutation.isPending,

    // Utility functions
    getKasirById,
    invalidateKasirQueries,
    prefetchKasir,
  }
}