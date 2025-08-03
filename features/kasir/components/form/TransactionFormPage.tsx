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

const steps = [
  { id: 1, title: 'Pilih Produk', description: 'Pilih baju yang akan disewa' },
  { id: 2, title: 'Data Penyewa', description: 'Isi biodata penyewa' },
  { id: 3, title: 'Pembayaran', description: 'Ringkasan & pembayaran' },
]

export function TransactionFormPage() {
  const router = useRouter()
  const [showSuccess, setShowSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

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

  const handleAddProduct = (product: ProductSelection['product'], quantity: number) => {
    const productSelection = {
      product,
      quantity,
      duration: globalDuration, // Use global duration
    }
    addProduct(productSelection)
  }

  const handleSubmitTransaction = async () => {
    setErrorMessage(null) // Clear previous errors

    const success = await submitTransaction()

    if (success) {
      setShowSuccess(true)
      // Redirect after showing success message
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } else {
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
            steps={steps}
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
