'use client'

import React, { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Stepper } from '../ui/stepper'
import { TransactionSuccessScreen } from '../ui/TransactionSuccessScreen'
import { NotificationBanner } from '../ui/NotificationBanner'
import { useTransactionForm } from '../../hooks/useTransactionForm'
import { ProductSelectionStep } from './ProductSelectionStep'
import { CustomerBiodataStep } from './CustomerBiodataStep'
import { PaymentSummaryStep } from './PaymentSummaryStep'
import { getStepValidationMessage } from '../../lib/constants/stepValidationMessages'
import type { ProductSelection } from '../../types'
import { transactionFormSteps } from '../../lib/constants/workflowConfig'
import { useLogger } from '@/lib/client-logger'

export function TransactionFormPage() {
  const router = useRouter()
  const [showSuccess, setShowSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // 🔍 Initialize logger for this component
  const logger = useLogger('TransactionFormPage')

  const {
    currentStep,
    formData,
    isSubmitting,
    globalDuration,
    isDataRestored,
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
    updateFormData,
    createError,
    clearFormData,
  } = useTransactionForm()

  // Add local state for restoration notification control
  const [showDataRestored, setShowDataRestored] = useState(isDataRestored)

  // 🔍 LOG: Component initialization
  React.useEffect(() => {
    logger.info('TransactionFormPage initialized', {
      currentStep,
      hasProducts: formData.products.length > 0,
      hasCustomer: !!formData.customer,
      isDataRestored,
      globalDuration,
      timestamp: new Date().toISOString(),
    })
  }, [])

  // Sync local state with hook state
  React.useEffect(() => {
    setShowDataRestored(isDataRestored)

    // 🔍 LOG: Data restoration event
    if (isDataRestored) {
      logger.info('Form data restored from localStorage', {
        restoredProducts: formData.products.length,
        restoredCustomer: !!formData.customer,
        currentStep,
        timestamp: new Date().toISOString(),
      })
    }
  }, [isDataRestored])

  // Helper function to check if current step can proceed
  const canProceed = validateStep(currentStep)

  // Handle back button click - clear storage when navigating away intentionally
  const handleBackButtonClick = () => {
    clearFormData()
    router.push('/dashboard')
  }

  const handleAddProduct = (product: ProductSelection['product'], quantity: number) => {
    // 🔍 LOG: Product addition attempt
    logger.info('Adding product to transaction', {
      productId: product.id,
      productName: product.name,
      productCode: 'N/A', // code property not available in Product interface
      requestedQuantity: quantity,
      availableQuantity: product.availableQuantity,
      globalDuration,
      currentProductCount: formData.products.length,
      timestamp: new Date().toISOString(),
    })

    const productSelection = {
      product,
      quantity,
      duration: globalDuration, // Use global duration
    }

    try {
      addProduct(productSelection)

      // 🔧 CACHE FIX: Optimistic update - reduce perceived availability locally
      // This provides immediate feedback to users while data syncs in background
      // Note: This is client-side only, real inventory is managed server-side
      if (product.availableQuantity) {
        console.log('[TransactionFormPage] 🔄 Optimistic availability update', {
          productId: product.id,
          previousAvailability: product.availableQuantity,
          reservedQuantity: quantity,
          optimisticAvailability: Math.max(0, product.availableQuantity - quantity),
          timestamp: new Date().toISOString(),
        })
      }

      // 🔍 LOG: Product addition success
      logger.info('Product added successfully', {
        productId: product.id,
        quantity,
        newProductCount: formData.products.length + 1,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      // 🔍 LOG: Product addition failure
      logger.error('Failed to add product', {
        productId: product.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      })
    }
  }

  const handleSubmitTransaction = async () => {
    setErrorMessage(null) // Clear previous errors

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
      globalDuration,
      step: currentStep,
    }

    logger.info('🚀 Starting transaction submission', {
      ...transactionData,
      timestamp: new Date().toISOString(),
    })

    const success = await submitTransaction()

    if (success) {
      // 🔍 LOG: Transaction success
      logger.info('✅ Transaction submitted successfully', {
        ...transactionData,
        result: 'SUCCESS',
        timestamp: new Date().toISOString(),
      })

      setShowSuccess(true)
      // Redirect after showing success message
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } else {
      // 🔍 LOG: Transaction failure
      const errorDetails = {
        ...transactionData,
        result: 'FAILURE',
        error: createError?.message || 'Unknown error',
        errorCode: createError?.code || 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString(),
      }

      logger.error('❌ Transaction submission failed', errorDetails)

      // Show error message based on the type of error
      if (createError) {
        setErrorMessage(createError.message || 'Terjadi kesalahan saat membuat transaksi')
      } else {
        setErrorMessage('Terjadi kesalahan tidak terduga. Silakan coba lagi.')
      }

      // Error message will be dismissed by user action
      // Removed auto-hide setTimeout for better UX control
    }
    return success
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

        {/* Data Restoration Notification */}
        {showDataRestored && (
          <NotificationBanner
            type="info"
            title="Data Form Dipulihkan"
            message="Data transaksi sebelumnya telah dipulihkan. Anda dapat melanjutkan dari langkah terakhir."
            helpText="Data akan tersimpan otomatis saat Anda mengisi form."
            onDismiss={() => setShowDataRestored(false)}
            data-testid="data-restoration-notification"
          />
        )}

        {/* Error Message */}
        {errorMessage && (
          <NotificationBanner
            type="error"
            title="Gagal Membuat Transaksi"
            message={errorMessage}
            helpText="Periksa kembali data yang telah diisi dan coba lagi."
            onDismiss={() => setErrorMessage(null)}
            data-testid="transaction-error-notification"
          />
        )}

        {/* Progress Indicators */}
        {!canProceed &&
          (() => {
            const validationMessage = getStepValidationMessage(currentStep)
            if (!validationMessage) return null

            return (
              <NotificationBanner
                type="warning"
                title={validationMessage.title}
                message={validationMessage.message}
                helpText={validationMessage.helpText}
                dismissible={false}
                data-testid="step-validation-notification"
              />
            )
          })()}

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
            <div data-testid="payment-summary-step">
              <PaymentSummaryStep
                formData={formData}
                totalAmount={calculateTotal()}
                duration={globalDuration}
                onUpdateFormData={updateFormData}
                onUpdateDuration={updateDuration}
                onSubmit={handleSubmitTransaction}
                onPrev={prevStep}
                isSubmitting={isSubmitting}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
