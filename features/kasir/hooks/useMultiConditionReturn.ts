import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { TransaksiDetail } from '../types'
import type {
  ConditionSplit,
  EnhancedItemCondition,
  MultiConditionFormValidation,
  MultiConditionPenaltyResult,
  ProcessingMode,
  EnhancedReturnRequest,
  ReturnProcessingResult,
  ConditionValidationResult
} from '../types/multiConditionReturn'
import { kasirApi } from '../api'

/**
 * Enhanced Return Process Hook with Multi-Condition Support
 * Extends existing useReturnProcess with multi-condition capabilities
 */
interface UseMultiConditionReturnResult {
  // Enhanced State
  currentStep: number
  transaction: TransaksiDetail | null
  itemConditions: Record<string, EnhancedItemCondition>
  validation: MultiConditionFormValidation
  penaltyCalculation: MultiConditionPenaltyResult | null
  processingMode: ProcessingMode
  isProcessing: boolean
  isCalculatingPenalty: boolean
  error: string | null

  // Actions
  setCurrentStep: (step: number) => void
  setTransaction: (transaction: TransaksiDetail) => void
  setItemCondition: (itemId: string, condition: EnhancedItemCondition) => void
  setItemMode: (itemId: string, mode: 'single' | 'multi') => void
  validateAllItems: () => boolean
  calculatePenalties: () => Promise<void>
  processEnhancedReturn: (notes?: string) => Promise<ReturnProcessingResult>
  resetProcess: () => void

  // Utilities
  canProceedToNext: (step: number) => boolean
  getProcessingModeForTransaction: () => ProcessingMode
  convertToApiRequest: () => EnhancedReturnRequest | null
}

export function useMultiConditionReturn(): UseMultiConditionReturnResult {
  // Core state
  const [currentStep, setCurrentStep] = useState(1)
  const [transaction, setTransaction] = useState<TransaksiDetail | null>(null)
  const [itemConditions, setItemConditions] = useState<Record<string, EnhancedItemCondition>>({})
  const [validation, setValidation] = useState<MultiConditionFormValidation>({
    itemValidations: {},
    isFormValid: false,
    canProceed: false,
    errors: [],
    warnings: []
  })
  const [penaltyCalculation, setPenaltyCalculation] = useState<MultiConditionPenaltyResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const queryClient = useQueryClient()

  // Request deduplication (inherited from original hook)
  const lastRequestRef = useRef<{
    fingerprint: string
    timestamp: number
    promise: Promise<unknown> | null
  }>({ fingerprint: '', timestamp: 0, promise: null })

  // Auto-detect processing mode
  const processingMode = useMemo(() => {
    if (!transaction || Object.keys(itemConditions).length === 0) {
      return 'single-condition'
    }

    let hasSimple = 0
    let hasMulti = 0

    for (const condition of Object.values(itemConditions)) {
      if (condition.mode === 'multi' && condition.conditions.length > 1) {
        hasMulti++
      } else {
        hasSimple++
      }
    }

    if (hasMulti === 0) return 'single-condition'
    if (hasSimple === 0) return 'multi-condition'
    return 'mixed'
  }, [transaction, itemConditions])

  // Penalty calculation query (real-time)
  const { 
    isLoading: isCalculatingPenalty,
    refetch: refetchPenalties 
  } = useQuery({
    queryKey: ['penalty-calculation', transaction?.id, itemConditions],
    queryFn: async () => {
      if (!transaction || Object.keys(itemConditions).length === 0) {
        return null
      }

      const apiRequest = convertToApiRequest()
      if (!apiRequest) return null

      // Use enhanced penalty calculation endpoint
      return kasirApi.calculateEnhancedPenalties(transaction.kode, apiRequest)
    },
    enabled: false, // Manual triggering only
    retry: 1,
  })

  // Enhanced return processing mutation
  const { mutateAsync: processReturnMutation, isPending: isProcessing } = useMutation({
    mutationFn: async (returnRequest: EnhancedReturnRequest & { transactionId: string }) => {
      return kasirApi.processEnhancedReturn(returnRequest.transactionId, returnRequest)
    },
    onSuccess: (result: ReturnProcessingResult) => {
      toast.success(`Pengembalian berhasil diproses (${result.processingMode} mode)`)
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['transaction-detail', transaction?.id] })
      queryClient.invalidateQueries({ queryKey: ['transaction-detail', transaction?.kode] })
      
      setError(null)
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat memproses pengembalian'
      setError(errorMessage)
      toast.error(errorMessage)
    }
  })

  // Validate single item condition
  const validateItemCondition = useCallback((condition: EnhancedItemCondition): ConditionValidationResult => {
    const totalReturned = condition.conditions.reduce((sum, c) => sum + (c.jumlahKembali || 0), 0)
    const remaining = condition.totalQuantity - totalReturned
    const hasValidConditions = condition.conditions.every(c => c.kondisiAkhir && c.jumlahKembali !== undefined)
    
    let error: string | undefined
    const warnings: string[] = []
    
    if (totalReturned > condition.totalQuantity) {
      error = `Total ${totalReturned} melebihi maksimal ${condition.totalQuantity} unit`
    } else if (totalReturned === 0) {
      error = 'Minimal harus mengembalikan 1 unit atau tandai sebagai hilang'
    } else if (!hasValidConditions) {
      error = 'Semua kondisi harus diisi dengan lengkap'
    }

    // Warnings for edge cases
    if (remaining > 0 && !error) {
      warnings.push(`Masih ada ${remaining} unit yang belum dialokasikan`)
    }

    if (condition.mode === 'multi' && condition.conditions.length > 5) {
      warnings.push('Terlalu banyak kondisi berbeda, pertimbangkan untuk menggabungkan yang serupa')
    }

    return {
      isValid: !error,
      remaining,
      totalReturned,
      maxAllowed: condition.totalQuantity,
      error,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  }, [])

  // Set item condition with validation
  const setItemCondition = useCallback((itemId: string, condition: EnhancedItemCondition) => {
    setItemConditions(prev => ({
      ...prev,
      [itemId]: condition
    }))

    // Update validation for this item
    const itemValidation = validateItemCondition(condition)
    setValidation(prev => ({
      ...prev,
      itemValidations: {
        ...prev.itemValidations,
        [itemId]: itemValidation
      }
    }))

    setError(null)
  }, [validateItemCondition])

  // Set item mode (single/multi) with data preservation
  const setItemMode = useCallback((itemId: string, mode: 'single' | 'multi') => {
    setItemConditions(prev => {
      const existing = prev[itemId]
      if (!existing) return prev

      // Convert between modes while preserving data
      let newConditions: ConditionSplit[]

      if (mode === 'single' && existing.conditions.length > 0) {
        // Multi → Single: Take first condition or create default
        newConditions = [existing.conditions[0] || { kondisiAkhir: '', jumlahKembali: existing.totalQuantity }]
      } else if (mode === 'multi' && existing.mode === 'single') {
        // Single → Multi: Convert single condition to array
        newConditions = existing.conditions.length > 0 
          ? existing.conditions 
          : [{ kondisiAkhir: '', jumlahKembali: existing.totalQuantity }]
      } else {
        newConditions = existing.conditions
      }

      const updatedCondition: EnhancedItemCondition = {
        ...existing,
        mode,
        conditions: newConditions
      }

      return {
        ...prev,
        [itemId]: updatedCondition
      }
    })
  }, [])

  // Validate all items and update form validation
  const validateAllItems = useCallback(() => {
    if (!transaction) return false

    const itemValidations: Record<string, ConditionValidationResult> = {}
    const errors: string[] = []
    const warnings: string[] = []

    let allValid = true

    for (const [itemId, condition] of Object.entries(itemConditions)) {
      const itemValidation = validateItemCondition(condition)
      itemValidations[itemId] = itemValidation

      if (!itemValidation.isValid) {
        allValid = false
        if (itemValidation.error) {
          errors.push(`${condition.itemId}: ${itemValidation.error}`)
        }
      }

      if (itemValidation.warnings) {
        warnings.push(...itemValidation.warnings.map(w => `${condition.itemId}: ${w}`))
      }
    }

    // Check that all transaction items have conditions
    const transactionItemIds = transaction.items?.map(item => item.id) || []
    const conditionItemIds = Object.keys(itemConditions)
    const missingItems = transactionItemIds.filter(id => !conditionItemIds.includes(id))

    if (missingItems.length > 0) {
      allValid = false
      errors.push(`Kondisi belum ditentukan untuk ${missingItems.length} item`)
    }

    const newValidation: MultiConditionFormValidation = {
      itemValidations,
      isFormValid: allValid && errors.length === 0,
      canProceed: allValid && errors.length === 0,
      errors,
      warnings
    }

    setValidation(newValidation)
    return newValidation.canProceed
  }, [transaction, itemConditions, validateItemCondition])

  // Calculate penalties for current conditions
  const calculatePenalties = useCallback(async () => {
    if (validateAllItems()) {
      try {
        const result = await refetchPenalties()
        if (result.data) {
          setPenaltyCalculation(result.data)
        }
      } catch (error) {
        console.error('Error calculating penalties:', error)
        toast.error('Gagal menghitung penalty')
      }
    }
  }, [validateAllItems, refetchPenalties])

  // Convert current state to API request format
  const convertToApiRequest = useCallback((): EnhancedReturnRequest | null => {
    if (!transaction || Object.keys(itemConditions).length === 0) {
      return null
    }

    const items = Object.entries(itemConditions).map(([itemId, condition]) => {
      if (condition.mode === 'multi' && condition.conditions.length > 1) {
        // Multi-condition format
        return {
          itemId,
          conditions: condition.conditions.map(c => ({
            kondisiAkhir: c.kondisiAkhir,
            jumlahKembali: c.jumlahKembali,
            modalAwal: c.modalAwal
          }))
        }
      } else {
        // Single-condition format (backward compatible)
        const singleCondition = condition.conditions[0] || { kondisiAkhir: '', jumlahKembali: 0 }
        return {
          itemId,
          kondisiAkhir: singleCondition.kondisiAkhir,
          jumlahKembali: singleCondition.jumlahKembali
        }
      }
    })

    return {
      items,
      tglKembali: new Date().toISOString()
    }
  }, [transaction, itemConditions])

  // Enhanced return processing with deduplication
  const processEnhancedReturn = useCallback(async (notes?: string): Promise<ReturnProcessingResult> => {
    if (!transaction) {
      throw new Error('Transaksi tidak ditemukan')
    }

    if (!validateAllItems()) {
      throw new Error('Kondisi barang belum valid')
    }

    const apiRequest = convertToApiRequest()
    if (!apiRequest) {
      throw new Error('Gagal menyiapkan data pengembalian')
    }

    // Add notes if provided
    if (notes) {
      apiRequest.catatan = notes
    }

    // Deduplication logic (same as original)
    const requestFingerprint = `${transaction.kode}:${JSON.stringify(apiRequest)}`
    const now = Date.now()
    const timeDiff = now - lastRequestRef.current.timestamp
    const DEDUPLICATION_WINDOW = 30000 // 30 seconds

    if (lastRequestRef.current.fingerprint === requestFingerprint && timeDiff < DEDUPLICATION_WINDOW) {
      const remainingSeconds = Math.ceil((DEDUPLICATION_WINDOW - timeDiff) / 1000)
      toast.warning(`Request sedang diproses. Harap tunggu ${remainingSeconds} detik.`)
      throw new Error('Duplicate request blocked')
    }

    // Process the enhanced return
    const requestWithId = {
      ...apiRequest,
      transactionId: transaction.kode
    }

    lastRequestRef.current = {
      fingerprint: requestFingerprint,
      timestamp: now,
      promise: null
    }

    try {
      const result = await processReturnMutation(requestWithId)
      return result
    } finally {
      lastRequestRef.current.promise = null
    }
  }, [transaction, validateAllItems, convertToApiRequest, processReturnMutation])

  // Check if can proceed to next step
  const canProceedToNext = useCallback((step: number) => {
    switch (step) {
      case 1: // Item conditions step
        return validation.canProceed && Object.keys(itemConditions).length > 0
      case 2: // Penalty calculation step
        return penaltyCalculation !== null
      case 3: // Confirmation step
        return !isProcessing
      default:
        return false
    }
  }, [validation.canProceed, itemConditions, penaltyCalculation, isProcessing])

  // Get processing mode for current transaction
  const getProcessingModeForTransaction = useCallback(() => {
    return processingMode
  }, [processingMode])

  // Initialize item conditions when transaction is set
  useEffect(() => {
    if (transaction && transaction.items && Object.keys(itemConditions).length === 0) {
      const initialConditions: Record<string, EnhancedItemCondition> = {}

      for (const item of transaction.items) {
        initialConditions[item.id] = {
          itemId: item.id,
          mode: 'single', // Default to single mode
          conditions: [{ kondisiAkhir: '', jumlahKembali: item.jumlahDiambil }],
          isValid: false,
          totalQuantity: item.jumlahDiambil,
          remainingQuantity: item.jumlahDiambil,
        }
      }

      setItemConditions(initialConditions)
    }
  }, [transaction, itemConditions])

  // Auto-validate when item conditions change
  useEffect(() => {
    if (Object.keys(itemConditions).length > 0) {
      validateAllItems()
    }
  }, [itemConditions, validateAllItems])

  // Reset process to initial state
  const resetProcess = useCallback(() => {
    setCurrentStep(1)
    setTransaction(null)
    setItemConditions({})
    setValidation({
      itemValidations: {},
      isFormValid: false,
      canProceed: false,
      errors: [],
      warnings: []
    })
    setPenaltyCalculation(null)
    setError(null)
    
    // Clear request tracking
    lastRequestRef.current = { fingerprint: '', timestamp: 0, promise: null }
  }, [])

  return {
    // Enhanced State
    currentStep,
    transaction,
    itemConditions,
    validation,
    penaltyCalculation,
    processingMode,
    isProcessing,
    isCalculatingPenalty,
    error,

    // Actions
    setCurrentStep,
    setTransaction,
    setItemCondition,
    setItemMode,
    validateAllItems,
    calculatePenalties,
    processEnhancedReturn,
    resetProcess,

    // Utilities
    canProceedToNext,
    getProcessingModeForTransaction,
    convertToApiRequest
  }
}