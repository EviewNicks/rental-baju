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
import { ArrowLeft, CheckCircle, AlertCircle, Calculator, Package } from 'lucide-react'
import { UnifiedConditionForm } from './UnifiedConditionForm'
import type { EnhancedItemCondition } from '../../types'
import { ConditionCategory } from '../../types'
import { kasirApi } from '../../api'
import { kasirLogger } from '../../lib/logger'

interface SimpleReturnFormProps {
  kode: string
  onClose?: () => void
}

interface PenaltyPreview {
  totalPenalty: number
  isLateReturn: boolean
  lateDays: number
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
  })

  // Load transaction data
  const { data: transaction, isLoading: isLoadingTransaction } = useQuery({
    queryKey: ['transaction-detail', kode],
    queryFn: () => kasirApi.getTransactionByCode(kode),
    enabled: !!kode,
    retry: 1,
  })

  // Initialize item conditions when transaction loads
  useEffect(() => {
    if (transaction && transaction.items && Object.keys(formState.itemConditions).length === 0) {
      const returnableItems = transaction.items.filter(
        (item) => item.jumlahDiambil > 0 && item.statusKembali !== 'lengkap',
      )

      const initialConditions: Record<string, EnhancedItemCondition> = {}

      returnableItems.forEach((item) => {
        initialConditions[item.id] = {
          itemId: item.id,
          mode: 'single',
          conditions: [
            {
              kondisiAkhir: 'Baik',
              jumlahKembali: item.jumlahDiambil,
              conditionCategory: ConditionCategory.BAIK,
              useManualPricing: false,
              manualPrice: 0,
            },
          ],
          isValid: true,
          totalQuantity: item.jumlahDiambil,
          remainingQuantity: 0,
        }
      })

      setFormState((prev) => ({
        ...prev,
        itemConditions: initialConditions,
      }))

      kasirLogger.returnProcess.info(
        'SimpleReturnForm',
        'Transaction loaded and conditions initialized',
        {
          transactionId: transaction.kode,
          returnableItemCount: returnableItems.length,
          totalConditions: Object.keys(initialConditions).length,
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

    // Validate all items have conditions
    const allItemsValid = Object.values(formState.itemConditions).every(
      (condition) => condition.isValid && condition.conditions.length > 0,
    )

    if (!allItemsValid) {
      setFormState((prev) => ({ ...prev, penaltyPreview: null }))
      return
    }

    try {
      // Local penalty calculation using existing condition data
      let totalPenalty = 0
      const itemBreakdown: Array<{ itemId: string; itemName: string; penalty: number }> = []

      Object.entries(formState.itemConditions).forEach(([itemId, condition]) => {
        let itemPenalty = 0

        // Get item name from transaction data
        const item = transaction.items?.find((i) => i.id === itemId)
        const itemName = item?.produk?.name || 'Unknown Product'

        // Calculate penalty for each condition within this item
        condition.conditions.forEach((c) => {
          // Use same logic as ConditionPricingForm (line 227-232)
          const effectivePrice = c.conditionCategory === 'BAIK' ? 0 : c.manualPrice || 0
          itemPenalty += effectivePrice * c.jumlahKembali
        })

        totalPenalty += itemPenalty
        itemBreakdown.push({
          itemId,
          itemName,
          penalty: itemPenalty,
        })
      })

      // Late return calculation
      const now = new Date()
      const dueDate = transaction.tglSelesai ? new Date(transaction.tglSelesai) : null
      const isLateReturn = dueDate ? now > dueDate : false
      const lateDays =
        isLateReturn && dueDate
          ? Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
          : 0

      const preview: PenaltyPreview = {
        totalPenalty,
        isLateReturn,
        lateDays,
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

  // Handle item condition changes
  const handleItemConditionChange = useCallback(
    (itemId: string, condition: EnhancedItemCondition) => {
      setFormState((prev) => ({
        ...prev,
        itemConditions: {
          ...prev.itemConditions,
          [itemId]: condition,
        },
        error: null, // Clear error when user makes changes
      }))

      kasirLogger.returnProcess.debug('SimpleReturnForm', 'Item condition updated', {
        transactionId: kode,
        itemId,
        isValid: condition.isValid,
        conditionCount: condition.conditions.length,
      })
    },
    [kode],
  )

  // Validate form before submission
  const validateForm = useCallback((): boolean => {
    if (!transaction) {
      setFormState((prev) => ({ ...prev, error: 'Transaksi tidak ditemukan' }))
      return false
    }

    const returnableItems =
      transaction.items?.filter(
        (item) => item.jumlahDiambil > 0 && item.statusKembali !== 'lengkap',
      ) || []

    if (returnableItems.length === 0) {
      setFormState((prev) => ({ ...prev, error: 'Tidak ada barang yang perlu dikembalikan' }))
      return false
    }

    // Check all returnable items have conditions
    const missingConditions = returnableItems.filter(
      (item) => !formState.itemConditions[item.id] || !formState.itemConditions[item.id].isValid,
    )

    if (missingConditions.length > 0) {
      setFormState((prev) => ({
        ...prev,
        error: `Kondisi belum lengkap untuk ${missingConditions.length} item`,
      }))
      return false
    }

    return true
  }, [transaction, formState.itemConditions])

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
      const errorMessage =
        error instanceof Error ? error.message : 'Terjadi kesalahan saat memproses pengembalian'

      kasirLogger.returnProcess.error('SimpleReturnForm', 'Return processing failed', {
        transactionId: kode,
        errorMessage,
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
      // Convert to API request format (unified)
      const apiRequest = {
        items: Object.entries(formState.itemConditions).map(([itemId, condition]) => ({
          itemId,
          conditions: condition.conditions.map((c) => ({
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

      kasirLogger.returnProcess.info('SimpleReturnForm', 'Submitting return request', {
        transactionId: kode,
        itemCount: apiRequest.items.length,
        hasNotes: !!formState.catatan,
      })

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
  }, [validateForm, formState, processReturnMutation, kode])

  // Handle close/back navigation
  const handleClose = useCallback(() => {
    if (onClose) {
      onClose()
    } else {
      router.back()
    }
  }, [onClose, router])

  // Get returnable items
  const returnableItems =
    transaction?.items?.filter(
      (item) => item.jumlahDiambil > 0 && item.statusKembali !== 'lengkap',
    ) || []

  // Check if form is valid for submission
  const isFormValid =
    returnableItems.length > 0 &&
    returnableItems.every((item) => formState.itemConditions[item.id]?.isValid)

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
              {returnableItems.length} Item
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

        {/* Item Conditions Form */}
        <div className="space-y-4 mb-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Kondisi Barang
          </h2>

          {returnableItems.map((item) => (
            <UnifiedConditionForm
              key={item.id}
              item={item}
              value={formState.itemConditions[item.id] || null}
              onChange={(condition) => handleItemConditionChange(item.id, condition)}
              disabled={formState.isProcessing}
              isLoading={formState.isProcessing}
            />
          ))}

          {returnableItems.length === 0 && (
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
