'use client'

/**
 * SimpleReturnForm Component
 *
 * Simplified single-page form for processing rental returns with real-time penalty calculation.
 * Replaces the complex 3-step ReturnProcessPage with a streamlined user experience.
 *
 * Key Features:
 * - Single-page form with all return conditions
 * - Frontend-only penalty calculation (no API calls for preview)
 * - Immediate user feedback on condition changes (0ms latency)
 * - Simplified state management using useState
 * - Support for RPK-51 size-aware transactions
 *
 * Penalty Calculation Architecture:
 * - Frontend-only calculation using existing condition data
 * - Leverages same logic as ConditionPricingForm (effectivePrice pattern)
 * - Real-time updates without network dependencies
 * - Server validation still applies for final return processing
 *
 * Calculation Logic:
 * - BAIK category: 0 penalty (fixed)
 * - Other categories: manualPrice * quantity
 * - Late return: calculated from transaction.tglJatuhTempo
 * - Total penalty: sum of all item penalties
 */

import React, { useState, useCallback, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, CheckCircle, AlertCircle, Calculator, Package, Info } from 'lucide-react'
import { UnifiedConditionForm } from './UnifiedConditionForm'
import type { EnhancedItemCondition } from '../../types'
import { ConditionCategory } from '../../types'
import { kasirApi } from '../../api'
import { kasirLogger } from '../../lib/logger'
import { PenaltyCalculator } from '../../lib/utils/penaltyCalculator'
import { AutoSelectionManager } from '../../lib/utils/autoSelectionManager'
import { parseKondisiAwalEnhanced } from '../../lib/utils/kondisiAwalParser'
import {
  getItemsWithRemainingQuantity,
  calculateRemainingQuantity,
  buildPartialReturnState,
  validatePartialReturnQuantities,
  type TransaksiItemWithReturns, // ✅ Updated with linkedSarung property via inheritance
} from '../../lib/utils/partialReturnHelpers'

interface SimpleReturnFormProps {
  kode: string
  onClose?: () => void
}

interface PenaltyPreview {
  totalPenalty: number
  isLateReturn: boolean
  lateDays: number
  flatLatePenalty: number // Add this for display purposes
  itemBreakdown: Array<{
    itemId: string
    itemName: string
    penalty: number
  }>
}

interface SimpleFormState {
  itemConditions: Record<string, EnhancedItemCondition>
  catatan: string
  isProcessing: boolean
  error: string | null
  penaltyPreview: PenaltyPreview | null
  autoSelectionManager: AutoSelectionManager | null
}

export function SimpleReturnForm({ kode, onClose }: SimpleReturnFormProps) {
  const router = useRouter()

  // Simple form state - replacing complex useMultiConditionReturn hook
  const [formState, setFormState] = useState<SimpleFormState>({
    itemConditions: {},
    catatan: '',
    isProcessing: false,
    error: null,
    penaltyPreview: null,
    autoSelectionManager: null,
  })

  // Load transaction data
  const { data: transaction, isLoading: isLoadingTransaction } = useQuery({
    queryKey: ['transaction-detail', kode],
    queryFn: () => kasirApi.getTransactionByCode(kode),
    enabled: !!kode,
    retry: 1,
  })

  // ✅ TASK 6: Enhanced initialization with AutoSelectionManager and pairing support
  useEffect(() => {
    if (transaction && transaction.items && Object.keys(formState.itemConditions).length === 0) {
      // Safe wrapper to handle optional items
      const safeTransaction = {
        ...transaction,
        items: transaction.items || [],
      }

      // Use partial return utilities to get items with remaining quantities
      const returnableItems = getItemsWithRemainingQuantity(safeTransaction)

      // ✅ TASK 6.1: Initialize AutoSelectionManager for pairing behavior with linkedSarung data
      const autoSelectionManager = new AutoSelectionManager(
        returnableItems.map((item) => ({
          id: item.id,
          kondisiAwal: item.kondisiAwal || null, // Convert undefined to null
          linkedSarung: item.linkedSarung || null, // ✅ Pass linkedSarung data from API response
        })),
      )

      // ✅ TASK 6.2: All items are selectable since sarung is metadata, not separate items
      const selectableItems = returnableItems

      const initialConditions: Record<string, EnhancedItemCondition> = {}

      selectableItems.forEach((item) => {
        // Calculate remaining quantity for this item
        const remainingQuantityResult = calculateRemainingQuantity(item)

        initialConditions[item.id] = {
          itemId: item.id,
          mode: 'single',
          conditions: [
            {
              kondisiAkhir: 'Baik',
              // ✅ TASK 3.2: Use remaining quantity instead of total picked up
              jumlahKembali: remainingQuantityResult.remainingToReturn,
              conditionCategory: ConditionCategory.BAIK,
              useManualPricing: false,
              manualPrice: 0,
            },
          ],
          isValid: true,
          // ✅ TASK 3.2: Set totalQuantity to remaining returnable quantity
          totalQuantity: remainingQuantityResult.remainingToReturn,
          remainingQuantity: 0,
        }
      })

      // ✅ TASK 6.3: No auto-selection needed since sarung is metadata
      // AutoSelectionManager now works with linkedSarung data instead of separate items

      setFormState((prev) => ({
        ...prev,
        itemConditions: initialConditions,
        autoSelectionManager,
      }))

      kasirLogger.returnProcess.info(
        'SimpleReturnForm',
        '🔍 AUDIT: Transaction loaded with detailed pairing integration analysis',
        {
          transactionId: transaction.kode,
          transactionSummary: {
            returnableItemCount: returnableItems.length,
            selectableItemCount: selectableItems.length,
            totalConditions: Object.keys(initialConditions).length,
            hasPairedItems: autoSelectionManager.hasPairedItems(),
            pairingCount: autoSelectionManager.getAllPairings().length,
          },
          detailedItemAnalysis: returnableItems.map((item) => {
            const kondisiData = parseKondisiAwalEnhanced(item.kondisiAwal)
            const remainingResult = calculateRemainingQuantity(item)

            return {
              itemId: item.id,
              productInfo: {
                name: item.produk?.name,
                code: item.produk?.code,
                category: item.produk?.category,
              },
              quantityInfo: {
                jumlahDiambil: remainingResult.jumlahDiambil,
                totalReturned: remainingResult.totalReturned,
                remainingToReturn: remainingResult.remainingToReturn,
              },
              kondisiAwalAnalysis: {
                format: item.kondisiAwal
                  ? item.kondisiAwal.startsWith('{')
                    ? 'JSON'
                    : 'PIPE'
                  : 'NULL',
                rawData: item.kondisiAwal,
                parsedData: {
                  productSizeId: kondisiData?.productSizeId,
                  size: kondisiData?.size,
                  ageCategory: kondisiData?.ageCategory,
                  hasLinkedSarung: !!kondisiData?.linkedSarung?.productSizeId,
                  linkedSarungProductSizeId: kondisiData?.linkedSarung?.productSizeId,
                },
              },
              apiLinkedSarungData: item.linkedSarung
                ? {
                    productId: item.linkedSarung.productId,
                    productSizeId: item.linkedSarung.productSizeId,
                    quantity: item.linkedSarung.quantity,
                    productInfo: item.linkedSarung.product
                      ? {
                          code: item.linkedSarung.product.code,
                          name: item.linkedSarung.product.name,
                          category: item.linkedSarung.product.category,
                        }
                      : null,
                    selectedSizeInfo: item.linkedSarung.selectedSize
                      ? {
                          size: item.linkedSarung.selectedSize.size,
                          ageCategory: item.linkedSarung.selectedSize.ageCategory,
                        }
                      : null,
                  }
                : null,
              initialCondition: initialConditions[item.id]
                ? {
                    mode: initialConditions[item.id].mode,
                    totalQuantity: initialConditions[item.id].totalQuantity,
                    remainingQuantity: initialConditions[item.id].remainingQuantity,
                    isValid: initialConditions[item.id].isValid,
                    conditionsCount: initialConditions[item.id].conditions.length,
                  }
                : null,
            }
          }),
          autoSelectionManagerAnalysis: {
            hasPairedItems: autoSelectionManager.hasPairedItems(),
            allPairings: autoSelectionManager.getAllPairings().map((pairing) => ({
              jasId: pairing.jasId,
              linkedSarungData: {
                productId: pairing.linkedSarungData.productId,
                productSizeId: pairing.linkedSarungData.productSizeId,
                quantity: pairing.linkedSarungData.quantity,
                productCode: pairing.linkedSarungData.product?.code,
                productName: pairing.linkedSarungData.product?.name,
              },
            })),
          },
          partialReturnState: buildPartialReturnState(safeTransaction),
          auditStep: 'transaction_initialization_complete',
          timestamp: new Date().toISOString(),
        },
      )
    }
  }, [transaction, formState.itemConditions])

  // Calculate penalty preview in real-time (frontend-only calculation)
  //
  // This function replaces the previous API call to calculateEnhancedPenalties
  // with local calculation using existing formState.itemConditions data.
  // Benefits: immediate feedback (0ms latency), no network dependency,
  // leverages same logic as ConditionPricingForm component.
  const calculatePenaltyPreview = useCallback(() => {
    if (!transaction || Object.keys(formState.itemConditions).length === 0) {
      return
    }

    // ✅ PARTIAL RETURN FIX: Validate all items have conditions and at least one item is being returned
    const itemsBeingReturned = Object.values(formState.itemConditions).filter((condition) => {
      const totalQuantity = condition.conditions.reduce((sum, c) => sum + (c.jumlahKembali || 0), 0)
      return condition.isValid && condition.conditions.length > 0 && totalQuantity > 0
    })

    if (itemsBeingReturned.length === 0) {
      setFormState((prev) => ({ ...prev, penaltyPreview: null }))
      return
    }

    try {
      // ✅ PARTIAL RETURN FIX: Local penalty calculation using only items being returned
      let totalPenalty = 0
      const itemBreakdown: Array<{ itemId: string; itemName: string; penalty: number }> = []

      // Only calculate penalty for items being returned (quantity > 0)
      Object.entries(formState.itemConditions).forEach(([itemId, condition]) => {
        const totalItemQuantity = condition.conditions.reduce(
          (sum, c) => sum + (c.jumlahKembali || 0),
          0,
        )

        // Skip items with 0 quantity (not being returned in this session)
        if (totalItemQuantity === 0) {
          return
        }

        let itemPenalty = 0

        // Get item name and size info from transaction data
        const item = transaction.items?.find((i) => i.id === itemId)
        const itemName = item?.produk?.name || 'Unknown Product'

        // Extract size information from kondisiAwal
        const sizeInfo = item?.kondisiAwal
          ? (() => {
              const parts = item.kondisiAwal.split('|')
              if (parts.length >= 4) {
                return ` (${parts[1]} | ${parts[2]})`
              }
              return ''
            })()
          : ''

        // Calculate penalty for each condition within this item
        condition.conditions.forEach((c) => {
          // Only calculate penalty for conditions with quantity > 0
          if ((c.jumlahKembali || 0) > 0) {
            // ✅ SIMPLE: All categories use jumlahKembali (quantity user input)
            const effectivePrice = c.conditionCategory === 'BAIK' ? 0 : c.manualPrice || 0
            const quantity = c.jumlahKembali || 0

            itemPenalty += effectivePrice * quantity
          }
        })

        totalPenalty += itemPenalty
        itemBreakdown.push({
          itemId,
          itemName: itemName + sizeInfo,
          penalty: itemPenalty,
        })
      })

      // Late return calculation - Updated to flat 20k penalty per item
      const now = new Date()
      const dueDate = transaction.tglSelesai ? new Date(transaction.tglSelesai) : null

      // Use PenaltyCalculator for flat 20k per item penalty
      const latePenaltyResult = PenaltyCalculator.calculateFlatLatePenalty(
        dueDate || new Date(),
        now,
      )
      const isLateReturn = latePenaltyResult.isLate
      const flatLatePenalty = latePenaltyResult.penalty // 20,000 per item
      const lateDays = latePenaltyResult.lateDays

      // ✅ PARTIAL RETURN FIX: Add flat late penalty to total (20k per item being returned)
      if (isLateReturn) {
        const returnableItemsCount = itemBreakdown.length // Only count items being returned
        totalPenalty += flatLatePenalty * returnableItemsCount
      }

      const preview: PenaltyPreview = {
        totalPenalty,
        isLateReturn,
        lateDays,
        flatLatePenalty, // Add this for display
        itemBreakdown,
      }

      setFormState((prev) => ({ ...prev, penaltyPreview: preview }))

      kasirLogger.penaltyCalc.info('SimpleReturnForm', 'Frontend penalty preview calculated', {
        transactionId: kode,
        totalPenalty: preview.totalPenalty,
        itemCount: preview.itemBreakdown.length,
        isLateReturn: preview.isLateReturn,
        lateDays: preview.lateDays,
      })
    } catch (error) {
      kasirLogger.penaltyCalc.error(
        'SimpleReturnForm',
        'Failed to calculate frontend penalty preview',
        {
          transactionId: kode,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      )
      setFormState((prev) => ({ ...prev, penaltyPreview: null }))
    }
  }, [transaction, formState.itemConditions, kode])

  // Auto-calculate penalty when conditions change (immediate updates)
  useEffect(() => {
    calculatePenaltyPreview()
  }, [calculatePenaltyPreview])

  // ✅ TASK 6: Handle item condition changes (no auto-selection needed since sarung is metadata)
  const handleItemConditionChange = useCallback(
    (itemId: string, condition: EnhancedItemCondition) => {
      setFormState((prev) => {
        const newConditions = {
          ...prev.itemConditions,
          [itemId]: condition,
        }

        // ✅ TASK 6.4: No auto-selection logic needed since sarung is metadata in jas item
        // The linkedSarung data is already included in the jas item's kondisiAwal

        return {
          ...prev,
          itemConditions: newConditions,
          error: null, // Clear error when user makes changes
        }
      })

      kasirLogger.returnProcess.debug('SimpleReturnForm', 'Item condition updated', {
        transactionId: kode,
        itemId,
        isValid: condition.isValid,
        conditionCount: condition.conditions.length,
      })
    },
    [kode],
  )

  // ✅ TASK 3: Enhanced validation using partial return utilities
  const validateForm = useCallback((): boolean => {
    if (!transaction) {
      setFormState((prev) => ({ ...prev, error: 'Transaksi tidak ditemukan' }))
      return false
    }

    // Safe wrapper to handle optional items
    const safeTransaction = {
      ...transaction,
      items: transaction.items || [],
    }

    // ✅ TASK 3.1: Use partial return utilities to get returnable items
    const returnableItems = getItemsWithRemainingQuantity(safeTransaction)
    const selectableItems = returnableItems // All items are selectable since sarung is metadata

    if (selectableItems.length === 0) {
      setFormState((prev) => ({ ...prev, error: 'Tidak ada barang yang perlu dikembalikan' }))
      return false
    }

    // ✅ PARTIAL RETURN FIX: Check if at least one item is being returned (quantity > 0)
    const itemsBeingReturned = Object.values(formState.itemConditions).filter((condition) => {
      const totalQuantity = condition.conditions.reduce((sum, c) => sum + (c.jumlahKembali || 0), 0)
      return condition.isValid && totalQuantity > 0
    })

    if (itemsBeingReturned.length === 0) {
      setFormState((prev) => ({
        ...prev,
        error:
          'Minimal harus mengembalikan 1 item. Pilih item yang ingin dikembalikan di sesi ini.',
      }))
      return false
    }

    // Check all items being returned have valid conditions
    const invalidItems = itemsBeingReturned.filter((condition) => !condition.isValid)

    if (invalidItems.length > 0) {
      setFormState((prev) => ({
        ...prev,
        error: `Kondisi belum lengkap untuk ${invalidItems.length} item yang akan dikembalikan`,
      }))
      return false
    }

    // ✅ TASK 3.3: Validate partial return quantities using utility function
    // Only validate items that are actually being returned (quantity > 0)
    const requestedQuantities: Record<string, number> = {}
    const remainingQuantities: Record<string, number> = {}

    itemsBeingReturned.forEach((condition) => {
      const totalRequested = condition.conditions.reduce(
        (sum: number, c) => sum + (c.jumlahKembali || 0),
        0,
      )
      requestedQuantities[condition.itemId] = totalRequested

      // Get remaining quantity for this item
      const item = selectableItems.find((i) => i.id === condition.itemId)
      if (item) {
        const remainingResult = calculateRemainingQuantity(item)
        remainingQuantities[condition.itemId] = remainingResult.remainingToReturn
      }
    })

    const quantityValidation = validatePartialReturnQuantities(
      requestedQuantities,
      remainingQuantities,
    )

    if (!quantityValidation.isValid) {
      setFormState((prev) => ({
        ...prev,
        error: `Validasi kuantitas gagal: ${quantityValidation.errors.join(', ')}`,
      }))
      return false
    }

    return true
  }, [transaction, formState.itemConditions])

  // ✅ TASK 6: Get selectable items (all items since sarung is metadata)
  const returnableItems =
    transaction && transaction.items
      ? getItemsWithRemainingQuantity({ ...transaction, items: transaction.items })
      : []

  const selectableItems = returnableItems // All items are selectable since sarung is metadata

  // Process return mutation
  const processReturnMutation = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async (returnData: any) => {
      const timer = kasirLogger.performance.startTimer('processReturn', 'Simple return processing')

      try {
        const result = await kasirApi.processEnhancedReturn(kode, returnData)
        timer.end('Simple return processing completed')
        return result
      } catch (error) {
        timer.end('Simple return processing failed')
        throw error
      }
    },
    onSuccess: (result) => {
      kasirLogger.returnProcess.info('SimpleReturnForm', 'Return processed successfully', {
        transactionId: kode,
        totalPenalty: result.totalPenalty,
        itemsProcessed: result.itemsProcessed,
      })

      toast.success('Pengembalian berhasil diproses!')

      // Close form or navigate back
      if (onClose) {
        onClose()
      } else {
        router.push(`/dashboard/transaction/${kode}`)
      }
    },
    onError: (error) => {
      let errorMessage =
        error instanceof Error ? error.message : 'Terjadi kesalahan saat memproses pengembalian'

      // Enhanced error handling for validation issues
      if (errorMessage.includes('Validasi kondisi pengembalian gagal')) {
        errorMessage =
          'Format data kondisi tidak valid. Mohon periksa kembali kondisi barang yang dikembalikan.'

        // Debug logging for troubleshooting
        kasirLogger.returnProcess.warn('SimpleReturnForm', 'Validation error detected', {
          transactionId: kode,
          originalError: error.message,
          formState: JSON.stringify(formState, null, 2),
        })
      }

      kasirLogger.returnProcess.error('SimpleReturnForm', 'Return processing failed', {
        transactionId: kode,
        errorMessage,
        errorDetails: error instanceof Error ? error.stack : 'Unknown error',
      })

      setFormState((prev) => ({ ...prev, error: errorMessage }))
      toast.error(errorMessage)
    },
  })

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return
    }

    if (formState.isProcessing) {
      return // Prevent double submission
    }

    setFormState((prev) => ({ ...prev, isProcessing: true, error: null }))

    try {
      // ✅ ENHANCED AUDIT TRAIL: Pre-submission analysis
      kasirLogger.returnProcess.info(
        'SimpleReturnForm',
        '🔄 AUDIT: Pre-submission form state analysis',
        {
          transactionId: kode,
          formStateAnalysis: {
            totalItemsInForm: Object.keys(formState.itemConditions).length,
            itemConditionsDetails: Object.entries(formState.itemConditions).map(
              ([itemId, condition]) => {
                const totalQuantity = condition.conditions.reduce(
                  (sum, c) => sum + (c.jumlahKembali || 0),
                  0,
                )
                const item = selectableItems.find((i) => i.id === itemId)
                const kondisiData = parseKondisiAwalEnhanced(item?.kondisiAwal)

                return {
                  itemId,
                  productName: item?.produk?.name,
                  isValid: condition.isValid,
                  mode: condition.mode,
                  totalQuantity: condition.totalQuantity,
                  remainingQuantity: condition.remainingQuantity,
                  conditionsCount: condition.conditions.length,
                  conditionsDetails: condition.conditions.map((c) => ({
                    kondisiAkhir: c.kondisiAkhir,
                    jumlahKembali: c.jumlahKembali,
                    conditionCategory: c.conditionCategory,
                    useManualPricing: c.useManualPricing,
                    manualPrice: c.manualPrice,
                  })),
                  calculatedTotalQuantity: totalQuantity,
                  willBeIncluded: totalQuantity > 0,
                  pairingInfo: {
                    hasLinkedSarung: !!kondisiData?.linkedSarung?.productSizeId,
                    linkedSarungProductSizeId: kondisiData?.linkedSarung?.productSizeId,
                    apiLinkedSarungProductSizeId: item?.linkedSarung?.productSizeId,
                  },
                }
              },
            ),
            catatan: formState.catatan,
            hasError: !!formState.error,
            error: formState.error,
          },
          auditStep: 'pre_submission_analysis',
          timestamp: new Date().toISOString(),
        },
      )

      // ✅ PARTIAL RETURN FIX: Convert to API request format (unified)
      // Only include items that are actually being returned (quantity > 0)
      const itemsBeingReturned = Object.entries(formState.itemConditions).filter(
        ([, condition]) => {
          const totalQuantity = condition.conditions.reduce(
            (sum, c) => sum + (c.jumlahKembali || 0),
            0,
          )
          return totalQuantity > 0
        },
      )

      // ✅ ENHANCED AUDIT TRAIL: Items filtering analysis
      kasirLogger.returnProcess.info(
        'SimpleReturnForm',
        '🔍 AUDIT: Items filtering for return processing',
        {
          transactionId: kode,
          filteringAnalysis: {
            totalItemsInForm: Object.keys(formState.itemConditions).length,
            itemsBeingReturnedCount: itemsBeingReturned.length,
            itemsSkippedCount:
              Object.keys(formState.itemConditions).length - itemsBeingReturned.length,
            itemsBeingReturnedDetails: itemsBeingReturned.map(([itemId, condition]) => {
              const totalQuantity = condition.conditions.reduce(
                (sum, c) => sum + (c.jumlahKembali || 0),
                0,
              )
              const item = selectableItems.find((i) => i.id === itemId)
              const kondisiData = parseKondisiAwalEnhanced(item?.kondisiAwal)

              return {
                itemId,
                productName: item?.produk?.name,
                productCode: item?.produk?.code,
                totalQuantity,
                conditionsCount: condition.conditions.length,
                pairingInfo: {
                  hasLinkedSarung: !!kondisiData?.linkedSarung?.productSizeId,
                  jasProductSizeId: kondisiData?.productSizeId,
                  linkedSarungProductSizeId: kondisiData?.linkedSarung?.productSizeId,
                  apiLinkedSarungProductSizeId: item?.linkedSarung?.productSizeId,
                  expectedDualRestoration: !!kondisiData?.linkedSarung?.productSizeId,
                },
              }
            }),
            itemsSkippedDetails: Object.entries(formState.itemConditions)
              .filter(([, condition]) => {
                const totalQuantity = condition.conditions.reduce(
                  (sum, c) => sum + (c.jumlahKembali || 0),
                  0,
                )
                return totalQuantity === 0
              })
              .map(([itemId, condition]) => {
                const item = selectableItems.find((i) => i.id === itemId)
                return {
                  itemId,
                  productName: item?.produk?.name,
                  reason: 'zero_quantity',
                  totalQuantity: condition.conditions.reduce(
                    (sum, c) => sum + (c.jumlahKembali || 0),
                    0,
                  ),
                }
              }),
          },
          auditStep: 'items_filtering_complete',
          timestamp: new Date().toISOString(),
        },
      )

      const apiRequest = {
        items: itemsBeingReturned.map(([itemId, condition]) => ({
          itemId,
          conditions: condition.conditions
            .filter((c) => (c.jumlahKembali || 0) > 0) // ✅ Only include conditions with quantity > 0
            .map((c) => ({
              kondisiAkhir: c.kondisiAkhir,
              jumlahKembali: c.jumlahKembali,
              conditionCategory: c.conditionCategory,
              useManualPricing: c.useManualPricing,
              manualPrice: c.manualPrice,
            })),
        })),
        catatan: formState.catatan || undefined,
        tglKembali: new Date().toISOString(),
      }

      await processReturnMutation.mutateAsync({
        ...apiRequest,
        transactionId: kode,
      })
    } catch (error) {
      console.error(error)
      // Error handling in mutation callback
    } finally {
      setFormState((prev) => ({ ...prev, isProcessing: false }))
    }
  }, [validateForm, formState, processReturnMutation, kode, selectableItems])

  // Handle close/back navigation
  const handleClose = useCallback(() => {
    if (onClose) {
      onClose()
    } else {
      router.back()
    }
  }, [onClose, router])

  // ✅ PARTIAL RETURN FIX: Check if form is valid for submission
  // At least one item must be being returned (quantity > 0) and all returned items must be valid
  const isFormValid =
    selectableItems.length > 0 &&
    Object.values(formState.itemConditions).some((condition) => {
      const totalQuantity = condition.conditions.reduce((sum, c) => sum + (c.jumlahKembali || 0), 0)
      return condition.isValid && totalQuantity > 0
    })

  if (isLoadingTransaction) {
    return (
      <div className="min-h-screen bg-neutral-100 p-4 md:p-6 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span>Memuat data transaksi...</span>
        </div>
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-neutral-100 p-4 md:p-6 flex items-center justify-center">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Transaksi tidak ditemukan. Silakan periksa kode transaksi dan coba lagi.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-100 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="flex items-center gap-2 hover:bg-neutral-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>

            <div className="flex-1">
              <h1 className="text-2xl font-bold text-neutral-900">Form Pengembalian Barang</h1>
              <p className="text-sm text-neutral-600">Transaksi: {transaction.kode}</p>
            </div>

            <Badge variant="outline" className="border-blue-200 text-blue-800 bg-blue-50">
              {selectableItems.length} Item
              {formState.autoSelectionManager?.hasPairedItems() && (
                <span className="ml-1 text-xs">
                  (+{formState.autoSelectionManager.getAllPairings().length} pairing)
                </span>
              )}
            </Badge>
          </div>
        </div>

        {/* Error Display */}
        {formState.error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{formState.error}</AlertDescription>
          </Alert>
        )}

        {/* Transaction Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5" />
              Informasi Transaksi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Kode:</span>
                <p className="text-gray-600">{transaction.kode}</p>
              </div>
              <div>
                <span className="font-medium">Customer:</span>
                <p className="text-gray-600">{transaction.penyewa?.nama}</p>
              </div>
              <div>
                <span className="font-medium">Status:</span>
                <Badge variant="outline" className="ml-2">
                  {transaction.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ✅ TASK 3: Partial Return Information */}
        {transaction && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-blue-800">
                <Info className="h-5 w-5" />
                Informasi Pengembalian Parsial
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-blue-700">Item yang dapat dikembalikan:</span>
                  <p className="text-blue-600">
                    {selectableItems.length} item total
                    {formState.autoSelectionManager?.hasPairedItems() && (
                      <span className="text-xs ml-1">
                        (termasuk {formState.autoSelectionManager.getAllPairings().length} jas
                        dengan sarung)
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Session pengembalian:</span>
                  <p className="text-blue-600">
                    {transaction.items?.some(
                      (item) =>
                        (item as TransaksiItemWithReturns).conditionBreakdown &&
                        (item as TransaksiItemWithReturns).conditionBreakdown!.length > 0,
                    )
                      ? 'Lanjutan'
                      : 'Pertama'}
                  </p>
                </div>
              </div>
              {selectableItems.length > 0 && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <div className="text-xs text-blue-600 space-y-1">
                    {selectableItems.map((item) => {
                      const remainingResult = calculateRemainingQuantity(item)

                      // ✅ TASK 6.5: Implement pairing display format using linkedSarung from API response
                      let displayName = item.produk?.name || 'Unknown Product'

                      if (item.linkedSarung) {
                        // Extract size info for jas
                        const jasKondisi = parseKondisiAwalEnhanced(item.kondisiAwal)
                        const jasSize = jasKondisi?.size || 'Unknown'
                        const jasAge = jasKondisi?.ageCategory || 'Unknown'

                        // ✅ Use linkedSarung from API response for sarung code
                        const sarungCode = item.linkedSarung.product?.code || 'Sarung'

                        displayName = `${item.produk?.name || 'Jas'} (${jasAge} ${jasSize}) + ${sarungCode}`
                      }

                      return (
                        <div key={item.id} className="flex justify-between">
                          <span className={item.linkedSarung ? 'font-medium text-purple-700' : ''}>
                            {displayName}
                            {item.linkedSarung && (
                              <span className="ml-1 text-xs bg-purple-100 text-purple-600 px-1 rounded">
                                PAIRING
                              </span>
                            )}
                          </span>
                          <span className="font-medium">
                            Sisa: {remainingResult.remainingToReturn}/
                            {remainingResult.jumlahDiambil}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Item Conditions Form */}
        <div className="space-y-4 mb-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Kondisi Barang
          </h2>

          {selectableItems.map((item) => {
            // ✅ Calculate remaining quantity for this specific item
            const remainingResult = calculateRemainingQuantity(item)
            const pairingInfo = formState.autoSelectionManager?.getPairingInfo(item.id)

            return (
              <UnifiedConditionForm
                key={item.id}
                item={item}
                value={formState.itemConditions[item.id] || null}
                onChange={(condition) => handleItemConditionChange(item.id, condition)}
                disabled={formState.isProcessing}
                isLoading={formState.isProcessing}
                remainingQuantity={remainingResult.remainingToReturn} // ✅ Pass calculated remaining quantity
                pairingInfo={pairingInfo} // ✅ TASK 6: Pass pairing information to form
              />
            )
          })}

          {selectableItems.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Tidak ada barang yang perlu dikembalikan untuk transaksi ini.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Penalty Preview */}
        {formState.penaltyPreview && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calculator className="h-5 w-5" />
                Perkiraan Penalty
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Penalty:</span>
                  <span className="text-lg font-bold text-red-600">
                    Rp {formState.penaltyPreview.totalPenalty.toLocaleString('id-ID')}
                  </span>
                </div>

                {formState.penaltyPreview.isLateReturn && (
                  <div className="text-sm text-orange-600">
                    ⚠️ Terlambat {formState.penaltyPreview.lateDays} hari
                  </div>
                )}

                {formState.penaltyPreview.itemBreakdown.length > 0 && (
                  <div className="border-t pt-3">
                    <div className="text-sm font-medium mb-2">Rincian per Item:</div>
                    {formState.penaltyPreview.itemBreakdown.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">{item.itemName}</span>
                        <span>Rp {item.penalty.toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Catatan (Opsional)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Tambahkan catatan pengembalian..."
              value={formState.catatan}
              onChange={(e) => setFormState((prev) => ({ ...prev, catatan: e.target.value }))}
              disabled={formState.isProcessing}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={formState.isProcessing}
            className="flex-1"
          >
            Batal
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || formState.isProcessing}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {formState.isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Memproses...
              </>
            ) : (
              'Proses Pengembalian'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
