'use client'

import { useState, useCallback } from 'react'
import type { TransactionFormData, TransactionStep } from '../types/transaction-form'
import type { Customer } from '../types/customer'
import type { ProductSelection } from '../types/product'
import type { CreateTransaksiRequest } from '../types/api'
import { useCreateTransaksi } from './useTransaksi'
// import { toast } from '@/hooks/use-toast' // TODO: Add toast implementation

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
  
  // Real API integration
  const createTransaksiMutation = useCreateTransaksi()

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
      // Transform form data to API format
      const createRequest: CreateTransaksiRequest = {
        penyewaId: formData.customer?.id || '',
        items: formData.products.map((product) => ({
          produkId: product.product.id,
          jumlah: product.quantity,
          durasi: product.duration,
          kondisiAwal: 'baik', // Default condition
        })),
        tglMulai: formData.pickupDate,
        tglSelesai: formData.returnDate || undefined,
        metodeBayar: formData.paymentMethod === 'cash' ? 'tunai' : formData.paymentMethod === 'transfer' ? 'transfer' : 'kartu',
        catatan: formData.notes || undefined,
      }

      // Create transaction via API
      const createdTransaction = await createTransaksiMutation.mutateAsync(createRequest)

      // Show success message
      console.log('Transaksi berhasil dibuat:', createdTransaction.kode)

      // Reset form after successful submission
      setFormData(initialFormData)
      setCurrentStep(1)
      return true
    } catch (error) {
      console.error('Failed to submit transaction:', error)
      
      // Show error message
      console.error('Gagal membuat transaksi:', createTransaksiMutation.error?.message || 'Terjadi kesalahan saat membuat transaksi')
      
      return false
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, validateStep, createTransaksiMutation])

  const resetForm = useCallback(() => {
    setFormData(initialFormData)
    setCurrentStep(1)
  }, [])

  return {
    currentStep,
    formData,
    isSubmitting: isSubmitting || createTransaksiMutation.isPending,
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
    // Additional state from API integration
    createError: createTransaksiMutation.error,
    isCreating: createTransaksiMutation.isPending,
  }
}
