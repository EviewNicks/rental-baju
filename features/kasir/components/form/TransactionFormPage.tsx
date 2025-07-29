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
import { useLogger } from '@/lib/client-logger'
import { getStepValidationMessage } from '../../lib/constants/stepValidationMessages'
import type { ProductSelection } from '../../types/product'

const steps = [
  { id: 1, title: 'Pilih Produk', description: 'Pilih baju yang akan disewa' },
  { id: 2, title: 'Data Penyewa', description: 'Isi biodata penyewa' },
  { id: 3, title: 'Pembayaran', description: 'Ringkasan & pembayaran' },
]


export function TransactionFormPage() {
  const router = useRouter()
  const [showSuccess, setShowSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const log = useLogger('TransactionFormPage')

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
    log.info('🔙 Back button clicked, clearing form storage')
    clearFormData('back-button')
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
    log.info('🎯 Starting transaction submission')
    
    const success = await submitTransaction()
    
    if (success) {
      log.info('✅ Transaction successful, showing success message')
      setShowSuccess(true)
      // Redirect after showing success message
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } else {
      log.error('❌ Transaction failed, showing error message', { createError: createError?.message })
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
      <TransactionSuccessScreen 
        redirectDelay={2000}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBackButtonClick}
                aria-label="Kembali ke dashboard dan hapus data form"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Transaksi Penyewaan Baru</h1>
                <p className="text-sm text-gray-600">
                  Ikuti langkah-langkah untuk membuat transaksi rental
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6 mb-6">
          <Stepper steps={steps} currentStep={currentStep} onStepClick={goToStep} />
        </div>

        {/* Data Restoration Notification */}
        {showDataRestored && (
          <NotificationBanner
            type="info"
            title="Data Form Dipulihkan"
            message="Data transaksi sebelumnya telah dipulihkan. Anda dapat melanjutkan dari langkah terakhir."
            helpText="Data akan tersimpan otomatis saat Anda mengisi form."
            onDismiss={() => setShowDataRestored(false)}
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
          />
        )}

        {/* Progress Indicators */}
        {!canProceed && (() => {
          const validationMessage = getStepValidationMessage(currentStep)
          if (!validationMessage) return null
          
          return (
            <NotificationBanner
              type="warning"
              title={validationMessage.title}
              message={validationMessage.message}
              helpText={validationMessage.helpText}
              dismissible={false}
            />
          )
        })()}

        {/* Content */}
        <div className="space-y-6">
          {currentStep === 1 && (
            <ProductSelectionStep
              selectedProducts={formData.products}
              onAddProduct={handleAddProduct}
              onRemoveProduct={removeProduct}
              onUpdateQuantity={updateProductQuantity}
              onNext={nextStep}
              canProceed={validateStep(currentStep)}
            />
          )}

          {currentStep === 2 && (
            <CustomerBiodataStep
              selectedCustomer={formData.customer}
              onSelectCustomer={setCustomer}
              onNext={nextStep}
              onPrev={prevStep}
              canProceed={validateStep(currentStep)}
            />
          )}

          {currentStep === 3 && (
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
          )}
        </div>
      </div>
    </div>
  )
}
