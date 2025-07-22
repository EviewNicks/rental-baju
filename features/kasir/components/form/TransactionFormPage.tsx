'use client'

import { useState } from 'react'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Stepper } from '../ui/stepper'
import { useTransactionForm } from '../../hooks/useTransactionForm'
import { ProductSelectionStep } from './ProductSelectionStep'
import { CustomerBiodataStep } from './CustomerBiodataStep'
import { PaymentSummaryStep } from './PaymentSummaryStep'

const steps = [
  { id: 1, title: 'Pilih Produk', description: 'Pilih baju yang akan disewa' },
  { id: 2, title: 'Data Penyewa', description: 'Isi biodata penyewa' },
  { id: 3, title: 'Pembayaran', description: 'Ringkasan & pembayaran' },
]

export function TransactionFormPage() {
  const router = useRouter()
  const [showSuccess, setShowSuccess] = useState(false)

  const {
    currentStep,
    formData,
    isSubmitting,
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
    updateFormData,
  } = useTransactionForm()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAddProduct = (product: any, quantity: number) => {
    const productSelection = {
      product,
      quantity,
      duration: 3, // Default duration
    }
    addProduct(productSelection)
  }

  const handleSubmitTransaction = async () => {
    const success = await submitTransaction()
    if (success) {
      setShowSuccess(true)
      // Redirect after showing success message
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
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
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Kembali
                </Button>
              </Link>
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
              onUpdateFormData={updateFormData}
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
