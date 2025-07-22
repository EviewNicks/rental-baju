'use client'

import { useState, useCallback } from 'react'
import type { TransactionFormData, TransactionStep } from '../types/transaction-form'
import type { Customer } from '../types/customer'
import type { ProductSelection } from '../types/product'

const initialFormData: TransactionFormData = {
  products: [],
  pickupDate: '',
  returnDate: '',
  paymentMethod: 'cash',
  paymentAmount: 0,
  paymentStatus: 'unpaid',
}

export function useTransactionForm() {
  const [currentStep, setCurrentStep] = useState<TransactionStep>(1)
  const [formData, setFormData] = useState<TransactionFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const calculateTotal = useCallback(() => {
    return formData.products.reduce((total, item) => {
      return total + item.product.pricePerDay * item.quantity * item.duration
    }, 0)
  }, [formData.products])

  const validateStep = useCallback(
    (step: TransactionStep): boolean => {
      switch (step) {
        case 1:
          return formData.products.length > 0
        case 2:
          return !!formData.customer && !!formData.customer.id
        case 3:
          return (
            !!formData.pickupDate &&
            !!formData.returnDate &&
            !!formData.paymentMethod &&
            (formData.paymentStatus === 'unpaid' || formData.paymentAmount > 0)
          )
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
    if (!validateStep(3)) return false

    setIsSubmitting(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Generate transaction code
      const transactionCode = `TXN-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`

      console.log('Transaction created:', {
        code: transactionCode,
        customer: formData.customer,
        products: formData.products,
        total: formData.products.reduce((total, item) => {
          return total + item.product.pricePerDay * item.quantity * item.duration
        }, 0),
        pickupDate: formData.pickupDate,
        returnDate: formData.returnDate,
        paymentMethod: formData.paymentMethod,
        paymentAmount: formData.paymentAmount,
        paymentStatus: formData.paymentStatus,
        notes: formData.notes,
      })

      // Reset form after successful submission
      setFormData(initialFormData)
      setCurrentStep(1)
      return true
    } catch (error) {
      console.error('Failed to submit transaction:', error)
      return false
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, validateStep])

  const resetForm = useCallback(() => {
    setFormData(initialFormData)
    setCurrentStep(1)
  }, [])

  return {
    currentStep,
    formData,
    isSubmitting,
    updateFormData,
    addProduct,
    removeProduct,
    updateProductQuantity,
    setCustomer,
    calculateTotal,
    validateStep,
    nextStep,
    prevStep,
    goToStep,
    submitTransaction,
    resetForm,
  }
}
