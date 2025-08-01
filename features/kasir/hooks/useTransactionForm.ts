'use client'

import { useState, useCallback, useEffect } from 'react'
import type { TransactionFormData, TransactionStep } from '../types/transaction-form'
import type { Customer } from '../types/customer'
import type { ProductSelection } from '../types/product'
import type { CreateTransaksiRequest, UpdateTransaksiRequest } from '../types/api'
import { useCreateTransaksi } from './useTransaksi'
import { useTransactionFormPersistence } from './useTransactionFormPersistence'
import { useCreatePembayaran } from './usePembayaran'
import { KasirApi } from '../api'
import { useMutation } from '@tanstack/react-query'
import type { CreatePembayaranRequest } from '../types/api'
import { logger } from '@/lib/client-logger'
// import { toast } from '@/hooks/use-toast' // TODO: Add toast implementation

const initialFormData: TransactionFormData = {
  products: [],
  pickupDate: '',
  returnDate: '',
  paymentMethod: 'cash',
  paymentAmount: 0,
  paymentStatus: 'unpaid',
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
  const [globalDuration, setGlobalDuration] = useState(3) // Global duration state
  const [isDataRestored, setIsDataRestored] = useState(false) // Track if data was restored from storage

  // Real API integration
  const createTransaksiMutation = useCreateTransaksi()

  // 🔥 FIX: Use proper payment hook with cache invalidation
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
    setFormData((prev) => ({
      ...prev,
      products: [...prev.products, product],
    }))
  }, [])

  const removeProduct = useCallback((productId: string) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.product.id !== productId),
    }))
  }, [])

  const updateProductQuantity = useCallback((productId: string, quantity: number) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.map((p) => (p.product.id === productId ? { ...p, quantity } : p)),
    }))
  }, [])

  const setCustomer = useCallback((customer: Customer) => {
    setFormData((prev) => ({ ...prev, customer }))
  }, [])

  const updateDuration = useCallback((duration: number) => {
    setGlobalDuration(duration)
  }, [])

  const calculateTotal = useCallback(() => {
    return formData.products.reduce((total, item) => {
      return total + item.product.pricePerDay * item.quantity * globalDuration
    }, 0)
  }, [formData.products, globalDuration])

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
          const hasPickupDate = !!formData.pickupDate
          const hasReturnDate = !!formData.returnDate
          const hasPaymentMethod = !!formData.paymentMethod
          const paymentCondition = formData.paymentStatus === 'unpaid' || formData.paymentAmount > 0
          const step3Valid = hasPickupDate && hasReturnDate && hasPaymentMethod && paymentCondition

          return step3Valid

        default:
          return false
      }
    },
    [formData],
  )

  const nextStep = useCallback(() => {
    if (currentStep < 3 && validateStep(currentStep)) {
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
    // Step 3 validation check
    const step3Valid = validateStep(3)

    if (!step3Valid) {
      return false
    }

    setIsSubmitting(true)
    try {
      // Transform form data to API format
      const createRequest: CreateTransaksiRequest = {
        penyewaId: formData.customer?.id || '',
        items: formData.products.map((product) => ({
          produkId: product.product.id,
          jumlah: product.quantity,
          durasi: globalDuration,
          kondisiAwal: 'baik', // Default condition
        })),
        tglMulai: convertDateToISODateTime(formData.pickupDate),
        tglSelesai: formData.returnDate ? convertDateToISODateTime(formData.returnDate) : undefined,
        metodeBayar:
          formData.paymentMethod === 'cash'
            ? 'tunai'
            : formData.paymentMethod === 'transfer'
              ? 'transfer'
              : 'kartu',
        catatan: formData.notes || undefined,
      }

      // Create transaction via API
      const createdTransaction = await createTransaksiMutation.mutateAsync(createRequest)

      // Create payment record with rollback mechanism
      if (formData.paymentAmount > 0) {
        const paymentRequest: CreatePembayaranRequest = {
          transaksiKode: createdTransaction.kode,
          jumlah: formData.paymentAmount,
          metode:
            formData.paymentMethod === 'cash'
              ? 'tunai'
              : formData.paymentMethod === 'transfer'
                ? 'transfer'
                : 'kartu',
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
      setGlobalDuration(3) // Reset duration to default
      clearFormData()

      return true
    } catch (error) {
      // Enhanced error handling - distinguish between transaction and payment failures
      const errorMessage = error instanceof Error ? error.message : String(error)
      const isPaymentError =
        errorMessage.includes('Pembayaran gagal') || errorMessage.includes('payment')
      const isRollbackError = errorMessage.includes('tidak dapat dibatalkan')

      if (isPaymentError && isRollbackError) {
        logger.error(
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
        logger.error(
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
        logger.error(
          '❌ Transaction creation failed!',
          {
            errorType: 'TRANSACTION_FAILURE',
            errorMessage: errorMessage,
            createTransaksiError: createTransaksiMutation.error?.message,
          },
          'useTransactionForm',
        )
      }

      if (error instanceof Error) {
        logger.error(
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
    globalDuration,
    validateStep,
    createTransaksiMutation,
    createPembayaranMutation,
    updateTransaksiMutation,
    clearFormData,
  ])

  const resetForm = useCallback(() => {
    setFormData(initialFormData)
    setCurrentStep(1)
    setGlobalDuration(3) // Reset duration to default
    clearFormData()
  }, [clearFormData])

  return {
    currentStep,
    formData,
    isSubmitting: isSubmitting || createTransaksiMutation.isPending,
    globalDuration,
    isDataRestored, // New: indicates if data was restored from storage
    updateFormData,
    addProduct,
    removeProduct,
    updateProductQuantity,
    setCustomer,
    updateDuration,
    calculateTotal,
    validateStep,
    nextStep,
    prevStep,
    goToStep,
    submitTransaction,
    resetForm,
    clearFormData, // New: allow manual clearing of stored data
    // Additional state from API integration
    createError: createTransaksiMutation.error,
    isCreating: createTransaksiMutation.isPending,
  }
}
