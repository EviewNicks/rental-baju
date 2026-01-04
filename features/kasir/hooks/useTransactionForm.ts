'use client'

import { useState, useCallback, useEffect } from 'react'
import type {
  TransactionFormData,
  TransactionStep,
  Customer,
  ProductSelection,
  KasirSelectionData,
} from '../types'
import type { CreateTransaksiRequest, UpdateTransaksiRequest } from '../types'
import { useCreateTransaksi } from './useTransaksi'
import { useTransactionFormPersistence } from './useTransactionFormPersistence'
import { useCreatePembayaran } from './usePembayaran'
import { KasirApi } from '../api'
import { useMutation } from '@tanstack/react-query'
import type { CreatePembayaranRequest } from '../types'
import { TransactionLogger } from '../lib/logger/transactionLogger'
import { PriceCalculator } from '../lib/utils/priceCalculator'
// import { toast } from '@/hooks/use-toast' // TODO: Add toast implementation when available

const initialFormData: TransactionFormData = {
  products: [],
  pickupDate: '',
  returnDate: '',
  paymentMethod: 'tunai',
  paymentAmount: 0,
  paymentStatus: 'unpaid',
  kasirSelection: {
    kasirId: null,
    kasirInfo: null,
    isAutoAssigned: false,
  },
  // Task 4: Default values for transaction enhancements
  duration: 4, // Default to 4-day package
  discountType: null, // No discount by default
  discountValue: null, // No discount value by default
}

// Helper function to convert date-only string to ISO datetime format
const convertDateToISODateTime = (dateString: string): string => {
  // Convert "YYYY-MM-DD" to "YYYY-MM-DDTHH:mm:ss.sssZ" format
  // Using midnight (00:00:00.000Z) for rental dates
  const date = new Date(dateString + 'T00:00:00.000Z')
  return date.toISOString()
}

export function useTransactionForm() {
  const [currentStep, setCurrentStep] = useState<TransactionStep>(1)
  const [formData, setFormData] = useState<TransactionFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const FIXED_DURATION = 4 // Fixed 4-day package - no user selection
  const [isDataRestored, setIsDataRestored] = useState(false) // Track if data was restored from storage

  // Real API integration
  const createTransaksiMutation = useCreateTransaksi()

  // Use proper payment hook with cache invalidation
  const createPembayaranMutation = useCreatePembayaran()

  // Transaction rollback mutation
  const updateTransaksiMutation = useMutation({
    mutationFn: ({ kode, data }: { kode: string; data: UpdateTransaksiRequest }) =>
      KasirApi.updateTransaksi(kode, data),
  })

  // Persistence integration
  const { loadFormData, saveFormData, clearFormData } = useTransactionFormPersistence()

  // Load persisted data on component mount
  useEffect(() => {
    const persistedData = loadFormData()
    if (persistedData) {
      setFormData(persistedData)
      if (persistedData.currentStep) {
        setCurrentStep(persistedData.currentStep)
      }
      setIsDataRestored(true)

      // Clear the restoration flag after a short delay for accessibility announcements
      setTimeout(() => setIsDataRestored(false), 3000)
    } else {
    }
  }, [loadFormData])

  // Auto-save form data whenever it changes
  useEffect(() => {
    // Don't save initial empty data or during restoration
    if (
      formData.products.length > 0 ||
      formData.customer ||
      formData.pickupDate ||
      formData.returnDate
    ) {
      saveFormData(formData, currentStep)
    }
  }, [formData, currentStep, saveFormData])

  const updateFormData = useCallback((updates: Partial<TransactionFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }, [])

  const addProduct = useCallback((product: ProductSelection) => {
    setFormData((prev) => {
      // Enhanced duplicate detection: Check product ID, size, AND linkedSarung
      const existingIndex = prev.products.findIndex(
        (p) =>
          p.product.id === product.product.id &&
          (product.productSizeId ? p.productSizeId === product.productSizeId : !p.productSizeId) &&
          // ✅ FIX: Include linkedSarung in duplicate detection to allow separate cart items
          (product.linkedSarung?.productId === p.linkedSarung?.productId)
      )

      if (existingIndex >= 0) {
        // Update quantity of existing item (same jas, same size, same sarung)
        const updated = [...prev.products]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + product.quantity,
        }
        return { ...prev, products: updated }
      }

      // Add new item (different jas, different size, OR different sarung)
      return { ...prev, products: [...prev.products, product] }
    })
  }, [])

  const removeProduct = useCallback((productId: string, productSizeId?: string, linkedSarungProductId?: string) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.filter(
        (p) =>
          !(
            p.product.id === productId &&
            (productSizeId ? p.productSizeId === productSizeId : !p.productSizeId) &&
            // ✅ FIX: Include linkedSarung in removal logic for precise targeting
            (linkedSarungProductId ? p.linkedSarung?.productId === linkedSarungProductId : !p.linkedSarung)
          ),
      ),
    }))
  }, [])

  const updateProductQuantity = useCallback(
    (productId: string, quantity: number, productSizeId?: string, linkedSarungProductId?: string) => {
      setFormData((prev) => ({
        ...prev,
        products: prev.products.map((p) =>
          p.product.id === productId &&
          (productSizeId ? p.productSizeId === productSizeId : !p.productSizeId) &&
          // ✅ FIX: Include linkedSarung in quantity update logic for precise targeting
          (linkedSarungProductId ? p.linkedSarung?.productId === linkedSarungProductId : !p.linkedSarung)
            ? { ...p, quantity }
            : p,
        ),
      }))
    },
    [],
  )

  const setCustomer = useCallback((customer: Customer) => {
    setFormData((prev) => ({ ...prev, customer }))
  }, [])

  const setKasirSelection = useCallback((kasirSelection: KasirSelectionData) => {
    setFormData((prev) => ({ ...prev, kasirSelection }))
  }, [])

  // updateDuration function removed - duration is now fixed at 4 days

  const calculateTotal = useCallback(() => {
    // Use enhanced price calculator for accurate totals
    const calculation = PriceCalculator.calculateTransactionTotalWithEnhancements({
      items: formData.products,
      duration: formData.duration || 4,
      discountType: formData.discountType,
      discountValue: formData.discountValue,
    })
    
    return calculation.finalTotal
  }, [formData.products, formData.duration, formData.discountType, formData.discountValue])

  const validateStep = useCallback(
    (step: TransactionStep): boolean => {
      switch (step) {
        case 1:
          const step1Valid = formData.products.length > 0
          if (!step1Valid) {
          }
          return step1Valid

        case 2:
          const hasCustomer = !!formData.customer
          const hasCustomerId = !!formData.customer?.id
          const step2Valid = hasCustomer && hasCustomerId

          if (!step2Valid) {
          }
          return step2Valid

        case 3:
          // Kasir Selection step
          const hasKasirId = !!formData.kasirSelection?.kasirId
          const step3Valid = hasKasirId

          if (!step3Valid) {
          }
          return step3Valid

        case 4:
          const hasPickupDate = !!formData.pickupDate
          const hasReturnDate = !!formData.returnDate
          const hasPaymentMethod = !!formData.paymentMethod
          const paymentCondition = formData.paymentStatus === 'unpaid' || formData.paymentAmount > 0
          const step4Valid = hasPickupDate && hasReturnDate && hasPaymentMethod && paymentCondition

          return step4Valid

        default:
          return false
      }
    },
    [formData],
  )

  const nextStep = useCallback(() => {
    if (currentStep < 4 && validateStep(currentStep)) {
      setCurrentStep((prev) => (prev + 1) as TransactionStep)
    }
  }, [currentStep, validateStep])

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as TransactionStep)
    }
  }, [currentStep])

  const goToStep = useCallback(
    (step: number) => {
      // Only allow going to completed steps or next step
      if (step <= currentStep || (step === currentStep + 1 && validateStep(currentStep))) {
        setCurrentStep(step as TransactionStep)
      }
    },
    [currentStep, validateStep],
  )

  const submitTransaction = useCallback(async () => {
    // ✅ FIX: Enhanced submission guard with early return
    if (isSubmitting) {
      console.warn('[useTransactionForm] Submission blocked - already in progress', {
        isSubmitting,
        timestamp: new Date().toISOString(),
      })
      return false
    }

    // Step 4 validation check (Payment step)
    const step4Valid = validateStep(4)

    if (!step4Valid) {
      return false
    }

    setIsSubmitting(true)
    try {
      // Transform form data to API format
      const createRequest: CreateTransaksiRequest = {
        penyewaId: formData.customer?.id || '',
        kasirId: formData.kasirSelection?.kasirId || '', // Include kasirId if selected
        items: formData.products.map((product) => {
          // 🔍 DEBUG POINT 2: Log each product before serialization
          console.log('🔍 DEBUG POINT 2 - Product Serialization:', {
            productId: product.product.id,
            productName: product.product.name,
            hasLinkedSarung: !!product.linkedSarung,
            linkedSarungData: product.linkedSarung ? {
              productId: product.linkedSarung.productId,
              productSizeId: product.linkedSarung.productSizeId,
              quantity: product.linkedSarung.quantity
            } : null,
            timestamp: new Date().toISOString(),
            debugPoint: 'API_PAYLOAD_SERIALIZATION'
          })

          // Base item data with dynamic duration
          const baseItem = {
            produkId: product.product.id,
            jumlah: product.quantity,
            durasi: formData.duration || 4, // Use selected duration instead of fixed
            kondisiAwal: 'baik',
            // ✅ TASK 20 CRITICAL FIX: Include linkedSarung in API payload
            ...(product.linkedSarung && {
              linkedSarung: {
                productId: product.linkedSarung.productId,
                productSizeId: product.linkedSarung.productSizeId,
                quantity: product.linkedSarung.quantity,
                selectedSize: product.linkedSarung.selectedSize
              }
            })
          }

          // Add productSizeId if available (size-aware format)
          if (product.productSizeId) {
            const finalItem = {
              ...baseItem,
              productSizeId: product.productSizeId,
            }
            
            // 🔍 DEBUG POINT 2: Log final serialized item
            console.log('🔍 DEBUG POINT 2 - Serialized Item (Size-Aware):', {
              finalItem,
              hasLinkedSarungInPayload: 'linkedSarung' in finalItem,
              linkedSarungInPayload: finalItem.linkedSarung || null,
              timestamp: new Date().toISOString(),
              debugPoint: 'API_PAYLOAD_SERIALIZATION'
            })
            
            return finalItem
          }

          // 🔍 DEBUG POINT 2: Log final serialized item (legacy)
          console.log('🔍 DEBUG POINT 2 - Serialized Item (Legacy):', {
            baseItem,
            hasLinkedSarungInPayload: 'linkedSarung' in baseItem,
            linkedSarungInPayload: baseItem.linkedSarung || null,
            timestamp: new Date().toISOString(),
            debugPoint: 'API_PAYLOAD_SERIALIZATION'
          })

          // Return legacy format if no size selected
          return baseItem
        }),
        tglMulai: convertDateToISODateTime(formData.pickupDate),
        tglSelesai: formData.returnDate ? convertDateToISODateTime(formData.returnDate) : undefined,
        metodeBayar: formData.paymentMethod,
        catatan: formData.notes || undefined,
        // Task 4: Add discount fields to API request - only send if both type and value exist
        discountType: formData.discountType && formData.discountValue && formData.discountValue > 0 
          ? formData.discountType 
          : undefined,
        discountValue: formData.discountType && formData.discountValue && formData.discountValue > 0 
          ? formData.discountValue 
          : undefined,
      }

      // 🔍 DEBUG POINT 2: Log complete API payload
      console.log('🔍 DEBUG POINT 2 - Complete API Payload:', {
        totalItems: createRequest.items.length,
        itemsWithLinkedSarung: createRequest.items.filter(item => 'linkedSarung' in item).length,
        payload: createRequest,
        timestamp: new Date().toISOString(),
        debugPoint: 'API_PAYLOAD_SERIALIZATION'
      })

      for (const product of formData.products) {
        // Note: This is a simple warning system - full validation happens server-side
        const currentAvailability = product.product.availableQuantity || 0
        if (currentAvailability < product.quantity) {
          console.warn('[useTransactionForm] ⚠️ Potential availability conflict detected', {
            productId: product.product.id,
            productName: product.product.name,
            requestedQuantity: product.quantity,
            lastKnownAvailability: currentAvailability,
            timestamp: new Date().toISOString(),
          })
        }
      }

      // 🔍 LOG: Log final API payload before submission
      TransactionLogger.logApiPayload(createRequest)

      // Create transaction via API
      const createdTransaction = await createTransaksiMutation.mutateAsync(createRequest)

      // Create payment record with rollback mechanism
      if (formData.paymentAmount > 0) {
        const paymentRequest: CreatePembayaranRequest = {
          transaksiKode: createdTransaction.kode,
          jumlah: formData.paymentAmount,
          metode: formData.paymentMethod,
          catatan: 'Pembayaran awal transaksi',
        }

        // Attempt payment creation with retry and rollback
        let paymentCreated = false
        let attempts = 0
        const maxAttempts = 3

        while (!paymentCreated && attempts < maxAttempts) {
          attempts++
          try {
            await createPembayaranMutation.mutateAsync(paymentRequest)
            paymentCreated = true
          } catch (paymentError) {
            // If all attempts failed, rollback the transaction
            if (attempts >= maxAttempts) {
              try {
                // Mark transaction as cancelled for rollback
                await updateTransaksiMutation.mutateAsync({
                  kode: createdTransaction.kode,
                  data: {
                    status: 'cancelled',
                    catatan: `Transaction cancelled due to payment failure. Original error: ${paymentError instanceof Error ? paymentError.message : String(paymentError)}`,
                  },
                })

                // Throw specific error for payment failure
                throw new Error(
                  'Pembayaran gagal dibuat setelah beberapa kali percobaan. Transaksi telah dibatalkan.',
                )
              } catch {
                // Throw combined error
                throw new Error(
                  `Pembayaran gagal dan transaksi tidak dapat dibatalkan. Hubungi admin. Transaction ID: ${createdTransaction.kode}`,
                )
              }
            } else {
              // Wait before retry (exponential backoff)
              const delay = Math.pow(2, attempts - 1) * 1000 // 1s, 2s, 4s

              await new Promise((resolve) => setTimeout(resolve, delay))
            }
          }
        }
      }

      // Reset form after successful submission
      setFormData(initialFormData)
      setCurrentStep(1)
      // Duration reset removed - now fixed at 4 days
      clearFormData()

      return true
    } catch (error) {
      // Enhanced error handling - distinguish between transaction and payment failures
      const errorMessage = error instanceof Error ? error.message : String(error)
      const isPaymentError =
        errorMessage.includes('Pembayaran gagal') || errorMessage.includes('payment')
      const isRollbackError = errorMessage.includes('tidak dapat dibatalkan')

      if (isPaymentError && isRollbackError) {
        console.error(
          '🚨 CRITICAL: Payment failed AND rollback failed!',
          {
            errorType: 'PAYMENT_ROLLBACK_FAILURE',
            errorMessage: errorMessage,
            createTransaksiError: createTransaksiMutation.error?.message,
            createPembayaranError: createPembayaranMutation.error?.message,
            updateTransaksiError: updateTransaksiMutation.error?.message,
          },
          'useTransactionForm',
        )
      } else if (isPaymentError) {
        console.error(
          '💳 Payment creation failed - transaction rolled back',
          {
            errorType: 'PAYMENT_FAILURE',
            errorMessage: errorMessage,
            createPembayaranError: createPembayaranMutation.error?.message,
            rollbackSuccess: true,
          },
          'useTransactionForm',
        )
      } else {
        console.error(
          '❌ Transaction creation failed!',
          {
            errorType: 'TRANSACTION_FAILURE',
            errorMessage: errorMessage,
            createTransaksiError: createTransaksiMutation.error?.message,
            createTransaksiErrorCode: createTransaksiMutation.error?.code,
            createTransaksiErrorDetails: createTransaksiMutation.error?.details,
          },
          'useTransactionForm',
        )
      }

      if (error instanceof Error) {
        console.error(
          '💬 Detailed error information',
          {
            message: error.message,
            stack: error.stack,
            name: error.name,
          },
          'useTransactionForm',
        )
      }

      return false
    } finally {
      setIsSubmitting(false)
    }
  }, [
    formData,
    validateStep,
    createTransaksiMutation,
    createPembayaranMutation,
    updateTransaksiMutation,
    clearFormData,
    isSubmitting,
  ])

  const resetForm = useCallback(() => {
    setFormData(initialFormData)
    setCurrentStep(1)
    // Duration reset removed - now fixed at 4 days
    clearFormData()
  }, [clearFormData])

  return {
    currentStep,
    formData,
    isSubmitting: isSubmitting || createTransaksiMutation.isPending,
    FIXED_DURATION, // Constant: 4 days for all transactions
    isDataRestored, // indicates if data was restored from storage
    updateFormData,
    addProduct,
    removeProduct,
    updateProductQuantity,
    setCustomer,
    setKasirSelection,
    // updateDuration removed - duration is now fixed
    calculateTotal,
    validateStep,
    nextStep,
    prevStep,
    goToStep,
    submitTransaction,
    resetForm,
    clearFormData, // allow manual clearing of stored data
    // Additional state from API integration
    createError: createTransaksiMutation.error,
    isCreating: createTransaksiMutation.isPending,
  }
}
