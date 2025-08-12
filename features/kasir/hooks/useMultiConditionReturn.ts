import { useState, useCallback, useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { TransaksiDetail } from '../types'
import type {
  EnhancedItemCondition,
  MultiConditionFormValidation,
  MultiConditionPenaltyResult,
  EnhancedReturnRequest,
  ConditionValidationResult,
} from '../types'
import { kasirApi } from '../api'
import { kasirLogger } from '../lib/logger'
import { PenaltyCalculator } from '../lib/utils/penaltyCalculator'

/**
 * Unified Return Process Hook - TSK-24 Phase-2 Simplified Architecture
 * Eliminates dual-mode complexity with unified multi-condition approach
 */
interface UseMultiConditionReturnResult {
  // Unified State
  currentStep: number
  transaction: TransaksiDetail | null
  itemConditions: Record<string, EnhancedItemCondition>
  validation: MultiConditionFormValidation
  penaltyCalculation: MultiConditionPenaltyResult | null
  isProcessing: boolean
  isCalculatingPenalty: boolean
  error: string | null

  // Actions
  setCurrentStep: (step: number) => void
  setTransaction: (transaction: TransaksiDetail) => void
  setItemCondition: (itemId: string, condition: EnhancedItemCondition) => void
  validateAllItems: () => boolean
  calculatePenalties: () => Promise<void>
  processEnhancedReturn: (notes?: string) => Promise<{
    success: boolean
    processingMode: 'single-condition' | 'multi-condition' | 'mixed'
    transactionId: string
    itemsProcessed: number
    conditionSplitsProcessed: number
    totalPenalty: number
    message: string
    errors?: string[]
    warnings?: string[]
  }>
  resetProcess: () => void

  // Utilities
  canProceedToNext: (step: number) => boolean
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
    warnings: [],
  })
  const [penaltyCalculation, setPenaltyCalculation] = useState<MultiConditionPenaltyResult | null>(
    null,
  )
  const [error, setError] = useState<string | null>(null)

  const queryClient = useQueryClient()

  // Request deduplication (inherited from original hook)
  const lastRequestRef = useRef<{
    fingerprint: string
    timestamp: number
    promise: Promise<unknown> | null
  }>({ fingerprint: '', timestamp: 0, promise: null })

  // Simplified processing - no mode detection needed
  // All returns use unified ConditionSplit[] structure

  // Penalty calculation query (real-time)
  const { isLoading: isCalculatingPenalty } = useQuery({
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
    mutationFn: async (
      returnRequest: EnhancedReturnRequest & { transactionId: string },
    ): Promise<{
      success: boolean
      processingMode: 'single-condition' | 'multi-condition' | 'mixed'
      transactionId: string
      itemsProcessed: number
      conditionSplitsProcessed: number
      totalPenalty: number
      message: string
      errors?: string[]
      warnings?: string[]
    }> => {
      const timer = kasirLogger.performance.startTimer(
        'processReturnMutation',
        'Enhanced return processing',
      )

      kasirLogger.returnProcess.info(
        'processReturnMutation',
        'Starting unified return processing',
        {
          transactionId: returnRequest.transactionId,
          itemCount: returnRequest.items.length,
        },
      )

      try {
        const result = await kasirApi.processEnhancedReturn(
          returnRequest.transactionId,
          returnRequest,
        )
        timer.end('Enhanced return processing completed')
        return result
      } catch (error) {
        kasirLogger.returnProcess.error(
          'processReturnMutation',
          'Enhanced return processing failed',
          error instanceof Error ? error : { error: String(error) },
        )
        throw error
      }
    },
    onSuccess: (result: {
      success: boolean
      processingMode: 'single-condition' | 'multi-condition' | 'mixed'
      transactionId: string
      itemsProcessed: number
      conditionSplitsProcessed: number
      totalPenalty: number
      message: string
      errors?: string[]
      warnings?: string[]
    }) => {
      kasirLogger.returnProcess.info('onSuccess', 'Return processing completed successfully', {
        transactionId: transaction?.kode,
        itemsProcessed: result.itemsProcessed || 0,
      })

      toast.success('Pengembalian berhasil diproses')

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['transaction-detail', transaction?.id] })
      queryClient.invalidateQueries({ queryKey: ['transaction-detail', transaction?.kode] })

      setError(null)
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error ? error.message : 'Terjadi kesalahan saat memproses pengembalian'

      kasirLogger.returnProcess.error('onError', 'Return processing failed', {
        errorMessage,
        transactionId: transaction?.kode,
      })

      setError(errorMessage)
      toast.error(errorMessage)
    },
  })

  // Validate single item condition
  const validateItemCondition = useCallback(
    (condition: EnhancedItemCondition): ConditionValidationResult => {
      const totalReturned = condition.conditions.reduce((sum, c) => sum + (c.jumlahKembali || 0), 0)
      const remaining = condition.totalQuantity - totalReturned
      const hasValidConditions = condition.conditions.every(
        (c) => c.kondisiAkhir && c.jumlahKembali !== undefined,
      )

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
        warnings.push(
          'Terlalu banyak kondisi berbeda, pertimbangkan untuk menggabungkan yang serupa',
        )
      }

      return {
        isValid: !error,
        remaining,
        totalReturned,
        maxAllowed: condition.totalQuantity,
        error,
        warnings: warnings.length > 0 ? warnings : undefined,
      }
    },
    [],
  )

  // Set item condition with validation (OPTIMIZED: batched state updates)
  const setItemCondition = useCallback(
    (itemId: string, condition: EnhancedItemCondition) => {
      kasirLogger.stateManagement.debug(
        'setItemCondition',
        'Updating item condition state - ENTRY',
        {
          itemId,
          conditionMode: condition?.mode,
          conditionCount: condition?.conditions?.length || 0,
          totalQuantity: condition?.totalQuantity,
          remainingQuantity: condition?.remainingQuantity,
          isValid: condition?.isValid,
          transactionId: transaction?.kode,
          conditionStructure: condition ? Object.keys(condition) : 'null',
          hasConditions: condition && condition.conditions && condition.conditions.length > 0,
        },
      )

      // Validate inputs
      if (!condition) {
        kasirLogger.stateManagement.error(
          'setItemCondition',
          'Null condition passed to setItemCondition',
          { itemId, transactionId: transaction?.kode }
        )
        return
      }

      if (!itemId) {
        kasirLogger.stateManagement.error(
          'setItemCondition',
          'Empty itemId passed to setItemCondition',
          { condition: condition ? Object.keys(condition) : 'null', transactionId: transaction?.kode }
        )
        return
      }

      // Calculate validation once
      const itemValidation = validateItemCondition(condition)

      kasirLogger.validation.debug(
        'setItemCondition',
        'Item condition validation calculated',
        {
          itemId,
          isValid: itemValidation.isValid,
          remaining: itemValidation.remaining,
          totalReturned: itemValidation.totalReturned,
          maxAllowed: itemValidation.maxAllowed,
          hasError: !!itemValidation.error,
          warningCount: itemValidation.warnings?.length || 0,
        },
      )

      // Batch state updates to reduce re-renders
      setItemConditions((prev) => {
        const updated = {
          ...prev,
          [itemId]: condition,
        }
        
        kasirLogger.stateManagement.debug(
          'setItemCondition',
          'ItemConditions state will be updated',
          {
            itemId,
            previousCount: Object.keys(prev).length,
            newCount: Object.keys(updated).length,
            allItemIds: Object.keys(updated),
            transactionId: transaction?.kode,
            conditionValid: condition?.isValid,
          }
        )
        
        return updated
      })

      setValidation((prev) => ({
        ...prev,
        itemValidations: {
          ...prev.itemValidations,
          [itemId]: itemValidation,
        },
      }))

      setError(null)
    },
    [validateItemCondition, transaction?.kode],
  )

  // Removed setItemMode - no longer needed with unified architecture
  // Progressive disclosure handles complexity automatically

  // Validate all items and update form validation (OPTIMIZED: stable dependencies)
  const validateAllItems = useCallback(() => {
    if (!transaction) {
      kasirLogger.validation.warn('validateAllItems', 'No transaction available for validation', {})
      return false
    }

    const itemValidations: Record<string, ConditionValidationResult> = {}
    const errors: string[] = []
    const warnings: string[] = []

    let allValid = true
    const itemConditionCount = Object.keys(itemConditions).length

    kasirLogger.validation.debug(
      'validateAllItems',
      'Starting form validation for all returnable items',
      {
        transactionId: transaction.kode,
        itemConditionCount,
        transactionItemCount: transaction.items?.length || 0,
        returnableItemCount: transaction.items?.filter((item) => item.jumlahDiambil > 0 && item.statusKembali !== 'lengkap')?.length || 0,
      },
    )

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
        warnings.push(...itemValidation.warnings.map((w) => `${condition.itemId}: ${w}`))
      }
    }

    // Check that all RETURNABLE transaction items have conditions (only items shown in UI)
    const returnableItems = transaction.items?.filter((item) => item.jumlahDiambil > 0 && item.statusKembali !== 'lengkap') || []
    const transactionItemIds = returnableItems.map((item) => item.id)
    const conditionItemIds = Object.keys(itemConditions)
    const missingItems = transactionItemIds.filter((id) => !conditionItemIds.includes(id))

    if (missingItems.length > 0) {
      allValid = false
      errors.push(`Kondisi belum ditentukan untuk ${missingItems.length} item`)
      
      kasirLogger.validation.warn(
        'validateAllItems',
        'Missing item conditions detected',
        {
          transactionId: transaction.kode,
          missingItemsCount: missingItems.length,
          missingItemIds: missingItems,
          totalReturnableItems: transactionItemIds.length,
          itemsWithConditions: conditionItemIds.length,
          returnableItems: returnableItems.map(item => ({ id: item.id, name: item.produk?.name })),
        },
      )
    }

    const newValidation: MultiConditionFormValidation = {
      itemValidations,
      isFormValid: allValid && errors.length === 0,
      canProceed: allValid && errors.length === 0,
      errors,
      warnings,
    }

    kasirLogger.validation.info(
      'validateAllItems',
      'Form validation completed',
      {
        transactionId: transaction.kode,
        isFormValid: newValidation.isFormValid,
        canProceed: newValidation.canProceed,
        errorCount: errors.length,
        warningCount: warnings.length,
        allItemsValid: allValid,
        validatedItemCount: Object.keys(itemValidations).length,
      },
    )

    setValidation(newValidation)
    return newValidation.canProceed
  }, [transaction, validateItemCondition, itemConditions]) // FIXED: itemConditions must be included since function uses it

  // Calculate penalties for current conditions - Client-side using PenaltyCalculator utility
  const calculatePenalties = useCallback(async () => {
    if (!transaction) {
      kasirLogger.penaltyCalc.warn('calculatePenalties', 'No transaction available for calculation')
      return
    }

    // ENHANCED VALIDATION: Check for required date fields
    if (!transaction.tglSelesai) {
      kasirLogger.penaltyCalc.error('calculatePenalties', 'Missing expected return date (tglSelesai)', {
        transactionId: transaction.kode,
        tglSelesai: transaction.tglSelesai,
        tglKembali: transaction.tglKembali,
        availableFields: Object.keys(transaction)
      })
      toast.error('Tanggal selesai transaksi tidak ditemukan. Tidak dapat menghitung penalty.')
      setError('Data tanggal transaksi tidak lengkap. Silakan hubungi administrator.')
      return
    }

    // ENHANCED VALIDATION: Validate date format
    const expectedDate = new Date(transaction.tglSelesai)
    if (isNaN(expectedDate.getTime())) {
      kasirLogger.penaltyCalc.error('calculatePenalties', 'Invalid expected return date format', {
        transactionId: transaction.kode,
        tglSelesai: transaction.tglSelesai,
        parsedDate: expectedDate.toString()
      })
      toast.error('Format tanggal selesai transaksi tidak valid.')
      setError('Format tanggal transaksi tidak valid. Silakan hubungi administrator.')
      return
    }

    if (validateAllItems()) {
      const timer = kasirLogger.performance.startTimer('calculatePenalties', 'Client-side penalty calculation')

      kasirLogger.penaltyCalc.info('calculatePenalties', 'Starting client-side penalty calculation', {
        transactionId: transaction.kode,
        itemCount: Object.keys(itemConditions).length,
        processingMode: 'client-side',
      })

      try {
        // Prepare data for PenaltyCalculator utility
        const calculationItems = Object.entries(itemConditions).map(([itemId, condition]) => {
          const transactionItem = transaction.items?.find(item => item.id === itemId)
          
          // CRITICAL FIX: Use tglSelesai (expected return date) instead of tglKembali (actual return date)
          const expectedReturnDate = transaction.tglSelesai ? new Date(transaction.tglSelesai) : new Date()
          
          // Log date usage for debugging
          kasirLogger.penaltyCalc.debug('calculatePenalties', 'Date fields for penalty calculation', {
            transactionId: transaction.kode,
            itemId,
            expectedReturnDate: expectedReturnDate.toISOString(),
            actualReturnDate: new Date().toISOString(),
            tglSelesai: transaction.tglSelesai,
            tglKembali: transaction.tglKembali,
            dateSource: transaction.tglSelesai ? 'tglSelesai' : 'fallback_current_date'
          })
          
          return {
            id: itemId,
            productName: transactionItem?.produk?.name || 'Unknown Product',
            expectedReturnDate,
            actualReturnDate: new Date(), // Current date for penalty calculation
            conditions: condition.conditions.map(cond => ({
              kondisiAkhir: cond.kondisiAkhir,
              jumlahKembali: cond.jumlahKembali,
              modalAwal: cond.modalAwal
            }))
          }
        })

        // Use PenaltyCalculator utility for direct calculation
        const penaltyResult = PenaltyCalculator.calculateMultiConditionPenalties(
          calculationItems,
          5000 // Default daily rate
        )

        // Transform result to match expected interface
        const penaltyData: MultiConditionPenaltyResult = {
          totalPenalty: penaltyResult.totalPenalty,
          lateDays: penaltyResult.totalLateDays,
          breakdown: penaltyResult.itemPenalties.map((item) => ({
            itemId: item.itemId,
            itemName: item.productName,
            splitIndex: 0, // Client-side doesn't need split indexing
            kondisiAkhir: item.conditionBreakdown?.[0]?.kondisiAkhir || 'Normal',
            jumlahKembali: item.summary.totalQuantity,
            isLostItem: item.conditionBreakdown?.some(c => c.reasonCode === 'lost') || false,
            latePenalty: item.conditionBreakdown?.reduce((sum, c) => sum + c.latePenalty, 0) || 0,
            conditionPenalty: item.conditionBreakdown?.reduce((sum, c) => sum + c.conditionPenalty, 0) || 0,
            penaltyAmount: item.conditionBreakdown?.reduce((sum, c) => sum + c.conditionPenalty, 0) || 0,
            modalAwal: item.conditionBreakdown?.find(c => c.reasonCode === 'lost')?.totalConditionPenalty,
            totalItemPenalty: item.totalPenalty,
            calculationMethod: item.conditionBreakdown?.[0]?.reasonCode === 'lost' ? 'modal_awal' : 
                              item.conditionBreakdown?.[0]?.reasonCode === 'damaged' ? 'damage_fee' :
                              item.conditionBreakdown?.[0]?.reasonCode === 'late' ? 'late_fee' : 'none',
            description: PenaltyCalculator.generateMultiConditionDescription(item),
            rateApplied: 5000, // Default daily rate
          })),
          summary: {
            totalItems: penaltyResult.summary.totalItems,
            totalConditions: penaltyResult.summary.totalQuantity,
            onTimeItems: penaltyResult.summary.onTimeQuantity,
            lateItems: penaltyResult.summary.lateQuantity,
            damagedItems: penaltyResult.summary.damagedQuantity,
            lostItems: penaltyResult.summary.lostQuantity,
            totalQuantity: penaltyResult.summary.totalQuantity,
            goodItems: penaltyResult.summary.onTimeQuantity, // Alias for onTimeItems
            averageConditionsPerItem: penaltyResult.summary.totalQuantity / penaltyResult.summary.totalItems,
          },
          conditionBreakdown: [], // Not needed for client-side preview
          calculationMetadata: {
            calculatedAt: new Date().toISOString(),
            processingMode: 'multi-condition' as const,
            itemCount: calculationItems.length,
            totalConditions: calculationItems.reduce((sum, item) => sum + item.conditions.length, 0),
            hasLateItems: penaltyResult.totalLateDays > 0,
            itemsProcessed: calculationItems.length,
            conditionSplits: calculationItems.reduce((sum, item) => sum + item.conditions.length, 0),
          }
        }

        setPenaltyCalculation(penaltyData)

        kasirLogger.penaltyCalc.info('calculatePenalties', 'Client-side penalty calculation completed', {
          totalPenalty: penaltyResult.totalPenalty,
          lateDays: penaltyResult.totalLateDays,
          itemsProcessed: calculationItems.length,
          conditionSplits: calculationItems.reduce((sum, item) => sum + item.conditions.length, 0),
          processingMode: 'client-side'
        })

        timer.end('Client-side penalty calculation completed')
      } catch (error) {
        kasirLogger.penaltyCalc.error(
          'calculatePenalties',
          'Client-side penalty calculation failed',
          error instanceof Error ? error : { error: String(error) },
        )
        toast.error('Gagal menghitung penalty. Silakan coba lagi.')
        setError('Gagal menghitung penalty. Silakan periksa kondisi barang dan coba lagi.')
      }
    } else {
      kasirLogger.validation.warn(
        'calculatePenalties',
        'Cannot calculate penalties - validation failed',
        {
          validationErrors: validation.errors,
          canProceed: validation.canProceed,
        },
      )
    }
  }, [validateAllItems, transaction, itemConditions, validation.errors, validation.canProceed])

  // Convert unified state to API request format (auto-detects single vs multi)
  const convertToApiRequest = useCallback((): EnhancedReturnRequest | null => {
    if (!transaction || Object.keys(itemConditions).length === 0) {
      return null
    }

    const items = Object.entries(itemConditions).map(([itemId, condition]) => {
      // Always check if multiple conditions exist (unified approach)
      if (condition.conditions.length > 1) {
        // Multi-condition format (multiple conditions for one item)
        return {
          itemId,
          conditions: condition.conditions.map((c) => ({
            kondisiAkhir: c.kondisiAkhir,
            jumlahKembali: c.jumlahKembali,
            modalAwal: c.modalAwal,
          })),
        }
      } else {
        // Single-condition format (backward compatible)
        const singleCondition = condition.conditions[0] || { kondisiAkhir: '', jumlahKembali: 0 }
        return {
          itemId,
          kondisiAkhir: singleCondition.kondisiAkhir,
          jumlahKembali: singleCondition.jumlahKembali,
        }
      }
    })

    return {
      items,
      tglKembali: new Date().toISOString(),
    }
  }, [transaction, itemConditions])

  // Enhanced return processing with deduplication
  const processEnhancedReturn = useCallback(
    async (
      notes?: string,
    ): Promise<{
      success: boolean
      processingMode: 'single-condition' | 'multi-condition' | 'mixed'
      transactionId: string
      itemsProcessed: number
      conditionSplitsProcessed: number
      totalPenalty: number
      message: string
      errors?: string[]
      warnings?: string[]
    }> => {
      kasirLogger.returnProcess.info(
        'processEnhancedReturn',
        'Starting enhanced return processing',
        {
          transactionId: transaction?.kode,
          hasNotes: !!notes,
          itemConditionsCount: Object.keys(itemConditions).length,
        },
      )

      if (!transaction) {
        kasirLogger.returnProcess.error(
          'processEnhancedReturn',
          'Cannot process return - no transaction available',
          {}
        )
        throw new Error('Transaksi tidak ditemukan')
      }

      if (!validateAllItems()) {
        kasirLogger.validation.error(
          'processEnhancedReturn',
          'Cannot process return - validation failed',
          {
            transactionId: transaction.kode,
            validationErrors: validation.errors,
            canProceed: validation.canProceed,
          },
        )
        throw new Error('Kondisi barang belum valid')
      }

      const apiRequest = convertToApiRequest()
      if (!apiRequest) {
        kasirLogger.returnProcess.error(
          'processEnhancedReturn',
          'Failed to prepare API request for return processing',
          {
            transactionId: transaction.kode,
            hasItemConditions: Object.keys(itemConditions).length > 0,
          },
        )
        throw new Error('Gagal menyiapkan data pengembalian')
      }

      kasirLogger.apiCalls.debug(
        'processEnhancedReturn',
        'API request prepared successfully',
        {
          transactionId: transaction.kode,
          itemCount: apiRequest.items.length,
          hasNotes: !!notes,
          requestSize: JSON.stringify(apiRequest).length,
        },
      )

      // Add notes if provided
      if (notes) {
        apiRequest.catatan = notes
        kasirLogger.returnProcess.debug(
          'processEnhancedReturn',
          'Notes added to return request',
          {
            transactionId: transaction.kode,
            notesLength: notes.length,
          },
        )
      }

      // Deduplication logic (same as original)
      const requestFingerprint = `${transaction.kode}:${JSON.stringify(apiRequest)}`
      const now = Date.now()
      const timeDiff = now - lastRequestRef.current.timestamp
      const DEDUPLICATION_WINDOW = 30000 // 30 seconds

      kasirLogger.apiCalls.debug(
        'processEnhancedReturn',
        'Deduplication check',
        {
          transactionId: transaction.kode,
          currentFingerprint: requestFingerprint.substring(0, 50) + '...',
          lastFingerprint: lastRequestRef.current.fingerprint.substring(0, 50) + '...',
          timeDiffMs: timeDiff,
          deduplicationWindowMs: DEDUPLICATION_WINDOW,
          isDuplicate: lastRequestRef.current.fingerprint === requestFingerprint && timeDiff < DEDUPLICATION_WINDOW,
        },
      )

      if (
        lastRequestRef.current.fingerprint === requestFingerprint &&
        timeDiff < DEDUPLICATION_WINDOW
      ) {
        const remainingSeconds = Math.ceil((DEDUPLICATION_WINDOW - timeDiff) / 1000)
        
        kasirLogger.apiCalls.warn(
          'processEnhancedReturn',
          'Duplicate request blocked by deduplication',
          {
            transactionId: transaction.kode,
            timeDiffMs: timeDiff,
            remainingSeconds,
            deduplicationWindowMs: DEDUPLICATION_WINDOW,
          },
        )

        toast.warning(`Request sedang diproses. Harap tunggu ${remainingSeconds} detik.`)
        throw new Error('Duplicate request blocked')
      }

      // Process the enhanced return
      const requestWithId = {
        ...apiRequest,
        transactionId: transaction.kode,
      }

      lastRequestRef.current = {
        fingerprint: requestFingerprint,
        timestamp: now,
        promise: null,
      }

      try {
        const result = await processReturnMutation(requestWithId)
        return result
      } finally {
        lastRequestRef.current.promise = null
      }
    },
    [transaction, validateAllItems, convertToApiRequest, processReturnMutation, validation.errors, validation.canProceed, itemConditions],
  )

  // Check if can proceed to next step
  const canProceedToNext = useCallback(
    (step: number) => {
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
    },
    [validation.canProceed, itemConditions, penaltyCalculation, isProcessing],
  )

  // Removed getProcessingModeForTransaction - no longer needed with unified approach

  // Initialize item conditions when transaction is set
  useEffect(() => {
    if (transaction && transaction.items && Object.keys(itemConditions).length === 0) {
      const initialConditions: Record<string, EnhancedItemCondition> = {}

      for (const item of transaction.items) {
        initialConditions[item.id] = {
          itemId: item.id,
          mode: 'single', // Always starts simple, grows as needed
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
  }, [itemConditions, validateAllItems]) // FIXED: validateAllItems is now stable with correct dependencies

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
      warnings: [],
    })
    setPenaltyCalculation(null)
    setError(null)

    // Clear request tracking
    lastRequestRef.current = { fingerprint: '', timestamp: 0, promise: null }
  }, [])

  return {
    // Unified State (simplified)
    currentStep,
    transaction,
    itemConditions,
    validation,
    penaltyCalculation,
    isProcessing,
    isCalculatingPenalty,
    error,

    // Actions
    setCurrentStep,
    setTransaction,
    setItemCondition,
    validateAllItems,
    calculatePenalties,
    processEnhancedReturn,
    resetProcess,

    // Utilities
    canProceedToNext,
    convertToApiRequest,
  }
}
