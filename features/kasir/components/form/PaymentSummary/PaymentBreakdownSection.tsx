'use client'

import { useMemo } from 'react'
import { CheckCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TransactionFormData, ProductSelection } from '../../../types'
import { formatCurrency } from '../../../lib/utils/client'
import { PriceCalculator } from '../../../lib/utils/priceCalculator'
import { isLinkedSarung } from '../../../lib/utils/jasSarungUtils'

// Helper function to generate unique keys for ProductSelection items
const generateProductKey = (item: ProductSelection, index: number): string => {
  const baseKey = `${item.product.id}-${item.productSizeId || 'default'}`
  
  if (item.linkedSarung) {
    const sarungId = item.linkedSarung.productId
    const sarungSizeId = item.linkedSarung.productSizeId || 'default'
    return `${baseKey}-linked-${sarungId}-${sarungSizeId}`
  }
  
  return `${baseKey}-${index}`
}

interface PaymentBreakdownSectionProps {
  formData: TransactionFormData
  onPrev: () => void
  onSubmit: () => Promise<boolean>
  isSubmitting: boolean
  canProceed?: boolean  // Validation flag to enable/disable submit button
}

export function PaymentBreakdownSection({
  formData,
  onPrev,
  onSubmit,
  isSubmitting,
  canProceed = false,  // Default false - button disabled until validation passes
}: PaymentBreakdownSectionProps) {
  const priceCalculation = useMemo(() => {
    return PriceCalculator.calculateTransactionTotalWithEnhancements({
      items: formData.products,
      duration: formData.duration || 4,
      discountType: formData.discountType,
      discountValue: formData.discountValue,
    })
  }, [formData.products, formData.duration, formData.discountType, formData.discountValue])

  const subtotal = priceCalculation.subtotal
  const discountAmount = priceCalculation.discountAmount
  const finalTotal = priceCalculation.finalTotal

  return (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6 space-y-6">
      {/* Total Breakdown */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Ringkasan Pembayaran</h3>

        {/* Item Details with Duration Multiplier */}
        <div className="space-y-2">
          {formData.products.map((item, index) => {
            const selectedSize = item.productSizeId
              ? item.product.sizes?.find((s) => s.id === item.productSizeId)
              : null
            
            const itemCalculation = priceCalculation.itemCalculations[index]
            const basePrice = item.product.pricePerDay * item.quantity
            const finalPrice = itemCalculation?.finalPrice || basePrice

            // Check if this is a linked sarung (should be free)
            const isItemLinkedSarung = isLinkedSarung(
              item.product.id,
              item.productSizeId,
              formData.products
            )

            return (
              <div key={generateProductKey(item, index)} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {item.product.name}
                    {selectedSize && ` (${selectedSize.ageCategory} - ${selectedSize.size})`} × {item.quantity}
                    {isItemLinkedSarung && (
                      <span className="ml-2 text-green-600 font-medium text-xs">• GRATIS dengan jas</span>
                    )}
                  </span>
                  <span className={`font-medium ${isItemLinkedSarung ? 'text-green-600' : ''}`}>
                    {isItemLinkedSarung ? 'GRATIS' : formatCurrency(basePrice)}
                  </span>
                </div>
                {formData.duration === 7 && !isItemLinkedSarung && (
                  <div className="flex justify-between text-xs text-orange-600 ml-4">
                    <span>↳ Paket 7 hari (+50%)</span>
                    <span>+ {formatCurrency(finalPrice - basePrice)}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Subtotal */}
        <div className="border-t border-yellow-300 pt-3 space-y-2">
          <div className="flex items-center justify-between text-lg font-semibold text-gray-900">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          
          {/* Duration Package Info */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Paket {formData.duration || 4} hari 
              {formData.duration === 7 && ' (Multiplier 1.5x)'}
              {formData.duration === 4 && ' (Multiplier 1.0x)'}
            </span>
            <span>
              {priceCalculation.itemCalculations.length} item(s)
            </span>
          </div>

          {/* Discount Display */}
          {formData.discountType && formData.discountValue && discountAmount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-700 font-medium">
                Diskon ({formData.discountType === 'percent' ? `${formData.discountValue}%` : 'Nominal'})
              </span>
              <span className="text-green-700 font-medium">
                - {formatCurrency(discountAmount)}
              </span>
            </div>
          )}

          {/* Final Total */}
          <div className="border-t border-yellow-400 pt-2">
            <div className="flex items-center justify-between text-xl font-bold text-gray-900">
              <span>Total Pembayaran</span>
              <span className="text-yellow-700">{formatCurrency(finalTotal)}</span>
            </div>
          </div>
        </div>

        {/* Payment Status Info */}
        {formData.paymentStatus === 'unpaid' && formData.paymentAmount > 0 && (
          <div className="bg-white/50 rounded-lg p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Jumlah dibayar:</span>
              <span className="font-medium text-green-600">
                {formatCurrency(formData.paymentAmount)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span className="text-gray-900">Sisa pembayaran:</span>
              <span className="text-red-600">
                {formatCurrency(finalTotal - formData.paymentAmount)}
              </span>
            </div>
          </div>
        )}

        {formData.paymentStatus === 'paid' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Pembayaran Lunas</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-yellow-300">
        <Button variant="outline" onClick={onPrev} data-testid="step-3-prev-button">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Data Penyewa
        </Button>

        <Button
          onClick={onSubmit}
          disabled={isSubmitting || !canProceed}
          className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-8 py-3 shadow-lg transition-all duration-200"
          size="lg"
          data-testid="submit-transaction-button"
        >
          {isSubmitting ? 'Memproses...' : 'Buat Transaksi'}
        </Button>
      </div>
    </div>
  )
}