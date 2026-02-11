'use client'

import React, { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Stepper } from '../ui/stepper'
import { TransactionSuccessScreen } from '../ui/TransactionSuccessScreen'
import { NotificationBanner } from '../ui/NotificationBanner'
import { useTransactionForm } from '../../hooks/useTransactionForm'
import { ProductSelectionStep } from './ProductSelectionStep'
import { CustomerBiodataStep } from './CustomerBiodataStep'
import { CashierSelectionStep } from './CashierSelectionStep'
import { PaymentSummaryStep } from './PaymentSummaryStep'
import { getStepValidationMessage } from '../../lib/constants/stepValidationMessages'
import type { ProductSelection } from '../../types'
import { transactionFormSteps } from '../../lib/constants/workflowConfig'
import { TransactionLogger } from '../../lib/logger/transactionLogger'
import { queryKeys } from '@/lib/react-query'
import { showApiError, showSuccess as showSuccessToast } from '../../lib/toastHelper'

export function TransactionFormPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [showSuccess, setShowSuccess] = useState(false)

  // 🔍 Initialize logger for this component
  // const logger = useLogger('TransactionFormPage')

  const {
    currentStep,
    formData,
    isSubmitting,
    FIXED_DURATION,
    isDataRestored,
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
    updateFormData,
    createError,
    clearFormData,
    // Manual Price Adjustment Functions - available but not used in this component
    // updateItemManualPrice,
    // resetItemManualPrice,
    // handleQuantityChangeWithManualPrice,
  } = useTransactionForm()

  // Add local state for restoration notification control
  const [showDataRestored, setShowDataRestored] = useState(isDataRestored)

  // Sync local state with hook state
  React.useEffect(() => {
    setShowDataRestored(isDataRestored)
  }, [isDataRestored])

  // Helper function to check if current step can proceed
  const canProceed = validateStep(currentStep)

  // Handle back button click - clear storage when navigating away intentionally
  const handleBackButtonClick = () => {
    clearFormData()
    router.push('/dashboard')
  }

  const handleAddProduct = (
    product: ProductSelection['product'],
    quantity: number,
    productSizeId?: string,
    linkedSarung?: ProductSelection['linkedSarung']
  ) => {
    // 🔧 FIX: Resolve selectedSize from product.sizes array using productSizeId
    let selectedSize: ProductSelection['selectedSize'] | undefined
    if (productSizeId && product.sizes && product.sizes.length > 0) {
      selectedSize = product.sizes.find(size => size.id === productSizeId)
    }

    const productSelection: ProductSelection = {
      product,
      quantity,
      duration: FIXED_DURATION, // Always 4 days for fixed package
      ...(productSizeId && { productSizeId }),
      ...(selectedSize && { selectedSize }), // Add selectedSize field
      ...(linkedSarung && { linkedSarung }), // Add linkedSarung field for jas-sarung pairing
    }

    try {
      addProduct(productSelection)

      // 🔧 CACHE FIX: Optimistic update - reduce perceived availability locally
      // This provides immediate feedback to users while data syncs in background
      // Note: This is client-side only, real inventory is managed server-side
      if (product.availableQuantity) {
      }
    } catch (error) {
      // 🔍 LOG: Product addition failure
      console.error('Failed to add product', {
        productId: product.id,
        productSizeId,
        linkedSarung: linkedSarung ? { productId: linkedSarung.productId, quantity: linkedSarung.quantity } : null,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      })
    }
  }

  const handleSubmitTransaction = async () => {
    // 🔍 LOG: Transaction submission start
    const transactionData = {
      productCount: formData.products.length,
      products: formData.products.map((p) => ({
        id: p.product.id,
        name: p.product.name,
        quantity: p.quantity,
        availableQuantity: p.product.availableQuantity,
      })),
      customer: formData.customer
        ? {
            id: formData.customer.id,
            name: formData.customer.name,
          }
        : null,
      totalAmount: calculateTotal(),
      step: currentStep,
    }

    // 🔍 LOG: Log form data before API submission
    TransactionLogger.logFormData(transactionData)

    // Use toast.promise for progressive loading feedback
    try {
      // First submit the transaction
      const success = await submitTransaction()

      // Then show appropriate toast based on result
      if (success) {
        setShowSuccess(true)

        // Invalidate transaction list cache to ensure fresh data on dashboard
        queryClient.invalidateQueries({
          queryKey: queryKeys.kasir.transaksi.lists(),
        })

        // Show success toast
        showSuccessToast('Transaksi berhasil dibuat!')

        // Redirect after showing success message with refresh parameter
        setTimeout(() => {
          router.push('/dashboard?refresh=true')
        }, 2000)

        return true
      } else {
        // 🔍 LOG: Transaction failure
        const errorDetails = {
          ...transactionData,
          result: 'FAILURE',
          error: createError?.message || 'Unknown error',
          errorCode: createError?.code || 'UNKNOWN_ERROR',
          timestamp: new Date().toISOString(),
        }

        console.error('❌ Transaction submission failed', errorDetails)

        // Show error toast using backend error response
        showApiError(createError)

        return false
      }
    } catch (error) {
      // 🔍 LOG: Unexpected error
      const errorDetails = {
        ...transactionData,
        result: 'FAILURE',
        error: error instanceof Error ? error.message : 'Unknown error',
        errorCode: 'UNEXPECTED_ERROR',
        timestamp: new Date().toISOString(),
      }

      console.error('❌ Unexpected error during transaction submission', errorDetails)

      // Show fallback error toast
      showApiError({
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: 'Terjadi kesalahan tidak terduga. Silakan coba lagi.',
          category: 'CRITICAL',
          timestamp: new Date().toISOString(),
        },
      })

      return false
    }
  }

  if (showSuccess) {
    return (
      <div data-testid="transaction-success-screen">
        <TransactionSuccessScreen redirectDelay={2000} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div
        className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10"
        data-testid="transaction-form-header"
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackButtonClick}
                aria-label="Kembali ke dashboard dan hapus data form"
                data-testid="transaction-form-back-button"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
              <div>
                <h1
                  className="text-xl font-bold text-gray-900"
                  data-testid="transaction-form-title"
                >
                  Transaksi Penyewaan Baru
                </h1>
                <p className="text-sm text-gray-600" data-testid="transaction-form-subtitle">
                  Ikuti langkah-langkah untuk membuat transaksi rental
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div
          className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6 mb-6"
          data-testid="transaction-form-stepper-container"
        >
          <Stepper
            steps={transactionFormSteps}
            currentStep={currentStep}
            onStepClick={goToStep}
            data-testid="transaction-form-stepper"
          />
        </div>

        {/* Content */}
        <div className="space-y-6" data-testid="transaction-form-content">
          {currentStep === 1 && (
            <div data-testid="product-selection-step">
              <ProductSelectionStep
                selectedProducts={formData.products}
                onAddProduct={handleAddProduct}
                onRemoveProduct={removeProduct}
                onUpdateQuantity={updateProductQuantity}
                onNext={nextStep}
                canProceed={validateStep(currentStep)}
              />
            </div>
          )}

          {currentStep === 2 && (
            <div data-testid="customer-biodata-step">
              <CustomerBiodataStep
                selectedCustomer={formData.customer}
                onSelectCustomer={setCustomer}
                onNext={nextStep}
                onPrev={prevStep}
                canProceed={validateStep(currentStep)}
              />
            </div>
          )}

          {currentStep === 3 && (
            <div data-testid="cashier-selection-step">
              <CashierSelectionStep
                selectedKasir={formData.kasirSelection || {
                  kasirId: null,
                  kasirInfo: null,
                  isAutoAssigned: false,
                }}
                onSelectKasir={setKasirSelection}
                onNext={nextStep}
                onPrev={prevStep}
                canProceed={validateStep(currentStep)}
              />
            </div>
          )}

          {currentStep === 4 && (
            <div data-testid="payment-summary-step">
              <PaymentSummaryStep
                formData={formData}
                onUpdateFormData={updateFormData}
                onSubmit={handleSubmitTransaction}
                onPrev={prevStep}
                isSubmitting={isSubmitting}
                canProceed={validateStep(currentStep)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
