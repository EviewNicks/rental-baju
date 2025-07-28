'use client'

import { useState } from 'react'
import { ArrowLeft, CheckCircle, AlertCircle, X, RotateCcw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Stepper } from '../ui/stepper'
import { useTransactionForm } from '../../hooks/useTransactionForm'
import { ProductSelectionStep } from './ProductSelectionStep'
import { CustomerBiodataStep } from './CustomerBiodataStep'
import { PaymentSummaryStep } from './PaymentSummaryStep'
import { useLogger } from '@/lib/client-logger'

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

  // Helper function to check if current step can proceed
  const canProceed = validateStep(currentStep)

  // Handle back button click - clear storage when navigating away intentionally
  const handleBackButtonClick = () => {
    log.info('🔙 Back button clicked, clearing form storage')
    clearFormData('back-button')
    router.push('/dashboard')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAddProduct = (product: any, quantity: number) => {
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
      
      // Auto-hide error message after 5 seconds
      setTimeout(() => {
        setErrorMessage(null)
      }, 5000)
    }
    return success
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-8 text-center max-w-md mx-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Transaksi Berhasil Dibuat!</h2>
          <p className="text-gray-600 mb-6">
            Transaksi penyewaan telah berhasil disimpan dan siap diproses.
          </p>
          <div className="text-sm text-gray-500">Mengalihkan ke dashboard...</div>
        </div>
      </div>
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
        {isDataRestored && (
          <div 
            className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 mb-6"
            role="alert"
            aria-live="polite"
          >
            <RotateCcw className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-900">Data Form Dipulihkan</h3>
              <p className="text-sm text-blue-700 mt-1">
                Data transaksi sebelumnya telah dipulihkan. Anda dapat melanjutkan dari langkah terakhir.
              </p>
              <div className="mt-2 text-xs text-blue-600">
                Data akan tersimpan otomatis saat Anda mengisi form.
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDataRestored(false)}
              className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700"
              aria-label="Tutup notifikasi"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 mb-6">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-900">Gagal Membuat Transaksi</h3>
              <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
              <div className="mt-2 text-xs text-red-600">
                Periksa kembali data yang telah diisi dan coba lagi.
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setErrorMessage(null)}
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Progress Indicators */}
        {!canProceed && currentStep === 1 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3 mb-6">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-900">Pilih Produk</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Silakan pilih minimal satu produk untuk melanjutkan ke tahap berikutnya.
              </p>
            </div>
          </div>
        )}

        {!canProceed && currentStep === 2 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3 mb-6">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-900">Data Penyewa Diperlukan</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Pilih atau daftarkan data penyewa untuk melanjutkan.
              </p>
            </div>
          </div>
        )}

        {!canProceed && currentStep === 3 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3 mb-6">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-900">Lengkapi Informasi Pembayaran</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Pastikan tanggal penyewaan dan metode pembayaran sudah dipilih.
              </p>
            </div>
          </div>
        )}

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
