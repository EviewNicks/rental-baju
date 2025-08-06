import { useState, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { TransaksiDetail } from '../types'
import { kasirApi } from '../api'

interface ItemCondition {
  kondisiAkhir: string
  jumlahKembali: number
}

interface PenaltyCalculation {
  totalPenalty: number
  lateDays: number
  breakdown: {
    itemId: string
    itemName: string
    latePenalty: number
    conditionPenalty: number
    totalItemPenalty: number
    kondisiAkhir: string
    jumlahKembali: number
    isLostItem: boolean
  }[]
  summary: {
    onTimeItems: number
    lateItems: number
    damagedItems: number
    lostItems: number
  }
}

interface UseReturnProcessReturn {
  // State
  currentStep: number
  transaction: TransaksiDetail | null
  itemConditions: Record<string, ItemCondition>
  penaltyCalculation: PenaltyCalculation | null
  isProcessing: boolean
  error: string | null

  // Actions
  setCurrentStep: (step: number) => void
  setTransaction: (transaction: TransaksiDetail) => void
  setItemConditions: (conditions: Record<string, ItemCondition>) => void
  setPenaltyCalculation: (calculation: PenaltyCalculation) => void
  processReturn: (notes?: string) => Promise<void>
  resetProcess: () => void
}

export function useReturnProcess(): UseReturnProcessReturn {
  const [currentStep, setCurrentStep] = useState(1)
  const [transaction, setTransaction] = useState<TransaksiDetail | null>(null)
  const [itemConditions, setItemConditions] = useState<Record<string, ItemCondition>>({})
  const [penaltyCalculation, setPenaltyCalculation] = useState<PenaltyCalculation | null>(null)
  const [error, setError] = useState<string | null>(null)

  const queryClient = useQueryClient()

  // Process return mutation
  const { mutateAsync: processReturnMutation, isPending: isProcessing } = useMutation({
    mutationFn: async ({ transactionId, returnData }: { 
      transactionId: string
      returnData: {
        items: Array<{
          itemId: string
          kondisiAkhir: string
          jumlahKembali: number
        }>
        catatan?: string
        tglKembali?: string
      }
    }) => {
      // Use the existing API endpoint from Phase 1
      return kasirApi.processReturn(transactionId, returnData)
    },
    onSuccess: () => {
      toast.success('Pengembalian berhasil diproses')
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['transaction-detail', transaction?.id] })
      queryClient.invalidateQueries({ queryKey: ['transaction-detail', transaction?.kode] })
      
      // Clear error
      setError(null)
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat memproses pengembalian'
      setError(errorMessage)
      toast.error(errorMessage)
    }
  })

  // Process return function
  const processReturn = useCallback(async (notes?: string) => {
    if (!transaction) {
      throw new Error('Transaksi tidak ditemukan')
    }

    if (Object.keys(itemConditions).length === 0) {
      throw new Error('Kondisi barang belum ditentukan')
    }

    // Prepare return data
    const returnData = {
      items: Object.entries(itemConditions).map(([itemId, condition]) => ({
        itemId,
        kondisiAkhir: condition.kondisiAkhir,
        jumlahKembali: condition.jumlahKembali
      })),
      catatan: notes,
      tglKembali: new Date().toISOString()
    }

    try {
      await processReturnMutation({
        transactionId: transaction.kode, // Use transaction code as identifier
        returnData
      })
    } catch (error) {
      // Error is handled by mutation onError
      throw error
    }
  }, [transaction, itemConditions, processReturnMutation])

  // Reset process to initial state
  const resetProcess = useCallback(() => {
    setCurrentStep(1)
    setTransaction(null)
    setItemConditions({})
    setPenaltyCalculation(null)
    setError(null)
  }, [])

  // Simple setters without auto-advancement - manual navigation only
  const setTransactionWithValidation = useCallback((newTransaction: TransaksiDetail) => {
    setTransaction(newTransaction)
    setError(null) // Clear any previous errors
  }, [])

  const setItemConditionsWithValidation = useCallback((newConditions: Record<string, ItemCondition>) => {
    setItemConditions(newConditions)
    setError(null) // Clear any previous errors
    
    // Debug logging to track state changes
    console.log('🔄 ItemConditions updated:', {
      conditionsCount: Object.keys(newConditions).length,
      hasValidConditions: Object.values(newConditions).every(condition => 
        condition.kondisiAkhir && condition.jumlahKembali !== undefined
      ),
      conditions: newConditions
    })
  }, [])

  return {
    // State
    currentStep,
    transaction,
    itemConditions,
    penaltyCalculation,
    isProcessing,
    error,

    // Actions
    setCurrentStep,
    setTransaction: setTransactionWithValidation,
    setItemConditions: setItemConditionsWithValidation,
    setPenaltyCalculation,
    processReturn,
    resetProcess
  }
}