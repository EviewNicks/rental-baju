import { useState, useCallback, useRef } from 'react'
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

  // Request deduplication system (CRITICAL FIX - prevent triple API calls)
  const lastRequestRef = useRef<{
    fingerprint: string
    timestamp: number
    promise: Promise<unknown> | null
  }>({ fingerprint: '', timestamp: 0, promise: null })

  // Generate request fingerprint for deduplication (CRITICAL FIX - remove timestamp)
  const generateRequestFingerprint = useCallback((transactionCode: string, returnData: unknown) => {
    // Create stable fingerprint based on transaction + data only (no timestamp)
    // This ensures same transaction with same data always generates same fingerprint
    return `${transactionCode}:${JSON.stringify(returnData)}`
  }, [])

  // Check if request should be deduplicated
  const shouldDeduplicateRequest = useCallback((fingerprint: string) => {
    const now = Date.now()
    const timeDiff = now - lastRequestRef.current.timestamp
    const DEDUPLICATION_WINDOW = 30000 // 30 seconds cooldown
    
    // Same request within cooldown window
    if (lastRequestRef.current.fingerprint === fingerprint && timeDiff < DEDUPLICATION_WINDOW) {
      return { shouldBlock: true, remainingTime: DEDUPLICATION_WINDOW - timeDiff }
    }
    
    return { shouldBlock: false, remainingTime: 0 }
  }, [])

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

  // Process return function with deduplication (CRITICAL FIX)
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

    // Generate request fingerprint for deduplication
    const requestFingerprint = generateRequestFingerprint(transaction.kode, returnData)
    
    // Check for duplicate request
    const deduplicationCheck = shouldDeduplicateRequest(requestFingerprint)
    
    // CRITICAL DEBUGGING: Verify deduplication logic is executing
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 DEDUPLICATION CHECK:', {
        transactionCode: transaction.kode,
        fingerprint: requestFingerprint.substring(0, 30) + '...',
        shouldBlock: deduplicationCheck.shouldBlock,
        remainingTime: deduplicationCheck.remainingTime,
        lastFingerprint: lastRequestRef.current.fingerprint.substring(0, 30) + '...',
        timeDiff: Date.now() - lastRequestRef.current.timestamp
      })
    }
    
    if (deduplicationCheck.shouldBlock) {
      const remainingSeconds = Math.ceil(deduplicationCheck.remainingTime / 1000)
      
      // Log deduplication blocking (strategic logging)
      console.log('🛡️ DEDUPLICATION BLOCK:', {
        transactionCode: transaction.kode,
        fingerprint: requestFingerprint.substring(0, 50) + '...',
        remainingTime: remainingSeconds,
        blockType: 'same_fingerprint'
      })
      
      toast.warning(
        `Request sedang diproses. Harap tunggu ${remainingSeconds} detik sebelum mencoba lagi.`,
        { duration: 3000 }
      )
      return // Block duplicate request
    }

    // If there's an ongoing request for the same transaction, wait for it
    if (lastRequestRef.current.promise && 
        lastRequestRef.current.fingerprint.startsWith(transaction.kode + ':')) {
      try {
        // Log promise-based blocking (strategic logging)
        console.log('🛡️ PROMISE BLOCK:', {
          transactionCode: transaction.kode,
          ongoingFingerprint: lastRequestRef.current.fingerprint.substring(0, 50) + '...',
          blockType: 'ongoing_request'
        })
        
        toast.info('Menunggu request sebelumnya selesai...', { duration: 2000 })
        await lastRequestRef.current.promise
        return // Previous request completed, no need to send duplicate
      } catch {
        // Previous request failed, continue with new request
        console.log('🔄 Previous request failed, continuing with new request')
      }
    }

    try {
      // Update tracking info
      lastRequestRef.current = {
        fingerprint: requestFingerprint,
        timestamp: Date.now(),
        promise: null
      }

      // Log successful request processing (strategic logging)
      console.log('✅ PROCESSING REQUEST:', {
        transactionCode: transaction.kode,
        fingerprint: requestFingerprint.substring(0, 50) + '...',
        timestamp: new Date().toISOString()
      })

      // Create and track the request promise
      const requestPromise = processReturnMutation({
        transactionId: transaction.kode,
        returnData
      })
      
      lastRequestRef.current.promise = requestPromise
      
      await requestPromise
      
    } catch (error) {
      // Handle specific error cases for better UX
      if (error instanceof Error) {
        // Check for already returned error
        if (error.message.includes('sudah dikembalikan') || 
            error.message.includes('ALREADY_RETURNED')) {
          toast.info('Transaksi ini sudah dikembalikan sebelumnya.', { duration: 4000 })
          return // Don't re-throw for already returned
        }
      }
      
      // Error is handled by mutation onError for other cases
      throw error
    } finally {
      // Enhanced promise tracking cleanup (strategic logging)
      if (lastRequestRef.current.promise) {
        console.log('🧹 CLEANUP:', {
          transactionCode: transaction.kode,
          fingerprintCleared: lastRequestRef.current.fingerprint.substring(0, 30) + '...',
          cleanupType: 'promise_reference'
        })
        lastRequestRef.current.promise = null
      }
    }
  }, [transaction, itemConditions, processReturnMutation, generateRequestFingerprint, shouldDeduplicateRequest])

  // Reset process to initial state with enhanced cleanup
  const resetProcess = useCallback(() => {
    setCurrentStep(1)
    setTransaction(null)
    setItemConditions({})
    setPenaltyCalculation(null)
    setError(null)
    
    // Clear any pending request state during reset
    if (lastRequestRef.current.promise || lastRequestRef.current.fingerprint) {
      console.log('🧹 RESET CLEANUP:', {
        hadPendingRequest: !!lastRequestRef.current.promise,
        fingerprintCleared: lastRequestRef.current.fingerprint || 'none',
        cleanupType: 'process_reset'
      })
      lastRequestRef.current = { fingerprint: '', timestamp: 0, promise: null }
    }
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