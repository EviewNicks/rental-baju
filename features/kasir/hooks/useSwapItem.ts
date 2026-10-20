'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { kasirApi } from '../api'
import { queryKeys } from '@/lib/react-query'
import type { TukarItemRequest, UbahTanggalRequest, TukarSarungRequest } from '../lib/validation/kasirSchema'
import type { TransactionDetail } from '../types'

interface UseSwapItemOptions {
  onSuccess?: () => void
  onError?: (error: Error) => void
}

/**
 * Custom hook untuk menukar baju/ukuran, sarung pairing, dan mengubah jadwal sewa
 */
export function useSwapItem(
  transactionCode: string,
  options: UseSwapItemOptions = {},
) {
  const queryClient = useQueryClient()
  const { onSuccess, onError } = options

  // Mutation untuk menukar item (ukuran / model)
  const swapMutation = useMutation({
    mutationFn: async (payload: TukarItemRequest) => {
      return kasirApi.tukarItem(transactionCode, payload)
    },
    onSuccess: async () => {
      // Invalidate transaction detail & list cache
      await queryClient.invalidateQueries({
        queryKey: queryKeys.kasir.transaksi.detail(transactionCode),
      })
      await queryClient.invalidateQueries({
        queryKey: queryKeys.kasir.transaksi.lists(),
      })
      onSuccess?.()
    },
    onError: (error: Error) => {
      console.error('❌ Error swapping item:', error)
      onError?.(error)
    },
  })

  // Mutation untuk menukar sarung pairing (sarung gratis) dengan Optimistic UI Update 0ms
  const sarungMutation = useMutation({
    mutationFn: async (payload: TukarSarungRequest) => {
      return kasirApi.tukarSarung(transactionCode, payload)
    },
    onMutate: async (newSarungData: TukarSarungRequest) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.kasir.transaksi.detail(transactionCode),
      })

      const detailKey = queryKeys.kasir.transaksi.detail(transactionCode)
      const transformedKey = [...detailKey, 'transformed']

      const previousApiData = queryClient.getQueryData(detailKey)
      const previousTransformed = queryClient.getQueryData<TransactionDetail>(transformedKey)

      if (previousTransformed) {
        const updatedProducts = previousTransformed.products?.map((p) => {
          if (p.id === newSarungData.parentTransaksiItemId) {
            let existingKondisi = {}
            try {
              if (p.kondisiAwal?.startsWith('{')) {
                existingKondisi = JSON.parse(p.kondisiAwal)
              }
            } catch {}
            const existingLinkedSarung = p.linkedSarung
            const updatedLinkedSarung = {
              productId: newSarungData.newSarung.produkId,
              productSizeId: newSarungData.newSarung.productSizeId,
              quantity: p.quantity,
              selectedSize: {
                id: newSarungData.newSarung.productSizeId,
                size: newSarungData.newSarung.size,
                ageCategory: newSarungData.newSarung.ageCategory,
              },
              product: existingLinkedSarung?.product ? {
                ...existingLinkedSarung.product,
                id: newSarungData.newSarung.produkId,
              } : undefined,
            }

            return {
              ...p,
              linkedSarung: updatedLinkedSarung,
              kondisiAwal: JSON.stringify({
                ...existingKondisi,
                linkedSarung: updatedLinkedSarung,
              }),
            }
          }
          return p
        })

        queryClient.setQueryData<TransactionDetail>(transformedKey, {
          ...previousTransformed,
          products: updatedProducts,
        })
      }

      return { previousApiData, previousTransformed }
    },
    onError: (error: Error, _newSarung, context) => {
      console.error('❌ Error swapping sarung:', error)
      if (context?.previousTransformed) {
        queryClient.setQueryData(
          [...queryKeys.kasir.transaksi.detail(transactionCode), 'transformed'],
          context.previousTransformed,
        )
      }
      if (context?.previousApiData) {
        queryClient.setQueryData(
          queryKeys.kasir.transaksi.detail(transactionCode),
          context.previousApiData,
        )
      }
      onError?.(error)
    },
    onSuccess: () => {
      onSuccess?.()
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.kasir.transaksi.detail(transactionCode),
      })
      await queryClient.invalidateQueries({
        queryKey: queryKeys.kasir.transaksi.lists(),
      })
    },
  })

  // Mutation untuk mengubah tanggal sewa (reschedule) dengan Optimistic UI Update 0ms
  const rescheduleMutation = useMutation({
    mutationFn: async (payload: UbahTanggalRequest) => {
      return kasirApi.ubahTanggalSewa(transactionCode, payload)
    },
    onMutate: async (newDates: UbahTanggalRequest) => {
      // 1. Cancel ongoing refetches agar tidak menimpa pembaruan optimis
      await queryClient.cancelQueries({
        queryKey: queryKeys.kasir.transaksi.detail(transactionCode),
      })

      // 2. Snapshot state sebelumnya untuk rollback jika request gagal
      const detailKey = queryKeys.kasir.transaksi.detail(transactionCode)
      const transformedKey = [...detailKey, 'transformed']

      const previousApiData = queryClient.getQueryData(detailKey)
      const previousTransformed = queryClient.getQueryData<TransactionDetail>(transformedKey)

      // 3. Optimistic Update: Perbarui cache UI seketika (0ms)
      if (previousTransformed) {
        queryClient.setQueryData<TransactionDetail>(transformedKey, {
          ...previousTransformed,
          startDate: newDates.tglMulai,
          endDate: newDates.tglSelesai || previousTransformed.endDate,
        })
      }

      // Perbarui juga data mentah jika ada di cache
      if (previousApiData) {
        queryClient.setQueryData(detailKey, (old: unknown) => {
          if (!old || typeof old !== 'object') return old
          const record = old as Record<string, unknown>
          if (record.data && typeof record.data === 'object') {
            return {
              ...record,
              data: {
                ...(record.data as Record<string, unknown>),
                tglMulai: newDates.tglMulai,
                tglSelesai: newDates.tglSelesai,
                startDate: newDates.tglMulai,
                endDate: newDates.tglSelesai,
              },
            }
          }
          return {
            ...record,
            tglMulai: newDates.tglMulai,
            tglSelesai: newDates.tglSelesai,
            startDate: newDates.tglMulai,
            endDate: newDates.tglSelesai,
          }
        })
      }

      return { previousApiData, previousTransformed }
    },
    onError: (error: Error, _newDates, context) => {
      console.error('❌ Error rescheduling transaction:', error)
      // Rollback ke state sebelumnya jika terjadi error
      if (context?.previousTransformed) {
        queryClient.setQueryData(
          [...queryKeys.kasir.transaksi.detail(transactionCode), 'transformed'],
          context.previousTransformed,
        )
      }
      if (context?.previousApiData) {
        queryClient.setQueryData(
          queryKeys.kasir.transaksi.detail(transactionCode),
          context.previousApiData,
        )
      }
      onError?.(error)
    },
    onSuccess: () => {
      onSuccess?.()
    },
    onSettled: async () => {
      // Re-fetch di background untuk menyinkronkan data final dengan server
      await queryClient.invalidateQueries({
        queryKey: queryKeys.kasir.transaksi.detail(transactionCode),
      })
      await queryClient.invalidateQueries({
        queryKey: queryKeys.kasir.transaksi.lists(),
      })
    },
  })

  return {
    tukarItem: swapMutation.mutateAsync,
    isSwapping: swapMutation.isPending,
    swapError: swapMutation.error,

    tukarSarung: sarungMutation.mutateAsync,
    isSwappingSarung: sarungMutation.isPending,
    sarungError: sarungMutation.error,

    ubahTanggalSewa: rescheduleMutation.mutateAsync,
    isRescheduling: rescheduleMutation.isPending,
    rescheduleError: rescheduleMutation.error,
  }
}
