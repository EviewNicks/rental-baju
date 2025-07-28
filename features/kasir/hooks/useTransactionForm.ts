'use client'

import { useState, useCallback, useEffect } from 'react'
import type { TransactionFormData, TransactionStep } from '../types/transaction-form'
import type { Customer } from '../types/customer'
import type { ProductSelection } from '../types/product'
import type { CreateTransaksiRequest } from '../types/api'
import { useCreateTransaksi } from './useTransaksi'
import { useTransactionFormPersistence } from './useTransactionFormPersistence'
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
  
  // Persistence integration
  const { loadFormData, saveFormData, clearFormData } = useTransactionFormPersistence()

  // Load persisted data on component mount
  useEffect(() => {
    logger.info('🚀 Initializing transaction form...', {}, 'useTransactionForm')
    
    const persistedData = loadFormData()
    if (persistedData) {
      logger.info('📥 Restoring form data from storage', {
        productsCount: persistedData.products.length,
        hasCustomer: !!persistedData.customer,
        currentStep: persistedData.currentStep || 1
      }, 'useTransactionForm')
      
      setFormData(persistedData)
      if (persistedData.currentStep) {
        setCurrentStep(persistedData.currentStep)
      }
      setIsDataRestored(true)
      
      // Clear the restoration flag after a short delay for accessibility announcements
      setTimeout(() => setIsDataRestored(false), 3000)
    } else {
      logger.info('🆕 Starting with fresh form', {}, 'useTransactionForm')
    }
  }, [loadFormData])

  // Auto-save form data whenever it changes
  useEffect(() => {
    // Don't save initial empty data or during restoration
    if (formData.products.length > 0 || formData.customer || formData.pickupDate || formData.returnDate) {
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
      logger.debug(`🔍 Validating step ${step}...`, {}, 'useTransactionForm')
      
      switch (step) {
        case 1:
          const step1Valid = formData.products.length > 0
          logger.debug(`📦 Step 1 - Products count: ${formData.products.length}, Valid: ${step1Valid}`, { 
            productsCount: formData.products.length, 
            valid: step1Valid 
          }, 'useTransactionForm')
          if (!step1Valid) {
            logger.warn('❌ Step 1 failed: No products selected', {}, 'useTransactionForm')
          }
          return step1Valid
          
        case 2:
          const hasCustomer = !!formData.customer
          const hasCustomerId = !!formData.customer?.id
          const step2Valid = hasCustomer && hasCustomerId
          logger.debug(`👤 Step 2 - Customer exists: ${hasCustomer}, Has ID: ${hasCustomerId}, Valid: ${step2Valid}`, {
            hasCustomer,
            hasCustomerId,
            valid: step2Valid,
            customerData: formData.customer
          }, 'useTransactionForm')
          if (!step2Valid) {
            logger.warn('❌ Step 2 failed: Customer not selected or missing ID', { 
              customerData: formData.customer 
            }, 'useTransactionForm')
          }
          return step2Valid
          
        case 3:
          const hasPickupDate = !!formData.pickupDate
          const hasReturnDate = !!formData.returnDate
          const hasPaymentMethod = !!formData.paymentMethod
          const paymentCondition = formData.paymentStatus === 'unpaid' || formData.paymentAmount > 0
          const step3Valid = hasPickupDate && hasReturnDate && hasPaymentMethod && paymentCondition
          
          logger.debug(`💰 Step 3 validation details`, {
            pickupDate: { has: hasPickupDate, value: formData.pickupDate },
            returnDate: { has: hasReturnDate, value: formData.returnDate },
            paymentMethod: { has: hasPaymentMethod, value: formData.paymentMethod },
            paymentStatus: formData.paymentStatus,
            paymentAmount: formData.paymentAmount,
            paymentCondition,
            overallValid: step3Valid
          }, 'useTransactionForm')
          
          if (!step3Valid) {
            logger.warn('❌ Step 3 failed: Missing required payment/date information', {}, 'useTransactionForm')
          }
          return step3Valid
          
        default:
          logger.error(`❌ Unknown step: ${step}`, { step }, 'useTransactionForm')
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
    logger.info('🚀 Starting transaction submission...', { formDataSummary: { 
      productsCount: formData.products.length,
      customerId: formData.customer?.id,
      pickupDate: formData.pickupDate,
      paymentMethod: formData.paymentMethod
    }}, 'useTransactionForm')
    
    // Step 3 validation check
    const step3Valid = validateStep(3)
    logger.info('✅ Step 3 validation result', { valid: step3Valid }, 'useTransactionForm')
    
    if (!step3Valid) {
      logger.error('❌ Step 3 validation failed', {
        validationDetails: {
          pickupDate: { has: !!formData.pickupDate, value: formData.pickupDate },
          returnDate: { has: !!formData.returnDate, value: formData.returnDate },
          paymentMethod: { has: !!formData.paymentMethod, value: formData.paymentMethod },
          paymentStatusCondition: formData.paymentStatus === 'unpaid' || formData.paymentAmount > 0
        }
      }, 'useTransactionForm')
      return false
    }

    setIsSubmitting(true)
    try {
      logger.debug('🔄 Transforming form data to API format...', {}, 'useTransactionForm')
      
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
        metodeBayar: formData.paymentMethod === 'cash' ? 'tunai' : formData.paymentMethod === 'transfer' ? 'transfer' : 'kartu',
        catatan: formData.notes || undefined,
      }

      logger.debug('📤 API Request payload', { createRequest }, 'useTransactionForm')
      logger.info('🌐 Calling API...', {}, 'useTransactionForm')

      // Create transaction via API
      const createdTransaction = await createTransaksiMutation.mutateAsync(createRequest)

      logger.info('✅ Transaction created successfully!', { 
        transactionId: createdTransaction.id,
        transactionCode: createdTransaction.kode 
      }, 'useTransactionForm')

      // Reset form after successful submission
      setFormData(initialFormData)
      setCurrentStep(1)
      setGlobalDuration(3) // Reset duration to default
      clearFormData('successful-submission')
      logger.debug('🔄 Form reset to initial state', {}, 'useTransactionForm')
      
      return true
    } catch (error) {
      logger.error('❌ Transaction submission failed!', {
        errorType: typeof error,
        errorProperties: Object.keys(error || {}),
        mutationError: createTransaksiMutation.error?.message
      }, 'useTransactionForm')
      
      if (error instanceof Error) {
        logger.error('💬 Error details', { 
          message: error.message,
          stack: error.stack 
        }, 'useTransactionForm')
      }
      
      // Additional mutation error details
      if (createTransaksiMutation.error) {
        logger.error('🔧 Mutation error details', { 
          mutationError: createTransaksiMutation.error,
          mutationErrorMessage: createTransaksiMutation.error.message 
        }, 'useTransactionForm')
      }
      
      return false
    } finally {
      setIsSubmitting(false)
      logger.debug('🏁 Transaction submission completed (cleanup)', {}, 'useTransactionForm')
    }
  }, [formData, globalDuration, validateStep, createTransaksiMutation, clearFormData])

  const resetForm = useCallback(() => {
    logger.info('🔄 Resetting form to initial state', {}, 'useTransactionForm')
    setFormData(initialFormData)
    setCurrentStep(1)
    setGlobalDuration(3) // Reset duration to default
    clearFormData('form-reset')
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
