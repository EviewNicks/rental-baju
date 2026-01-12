'use client'

import { useCallback, useMemo } from 'react'
import { Percent, DollarSign } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import type { TransactionFormData } from '../../../types'
import { formatCurrency } from '../../../lib/utils/client'
import { PriceCalculator } from '../../../lib/utils/priceCalculator'

interface DiscountSectionProps {
  formData: TransactionFormData
  onUpdateFormData: (updates: Partial<TransactionFormData>) => void
}

export function DiscountSection({
  formData,
  onUpdateFormData,
}: DiscountSectionProps) {
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

  // Separate discount type selection from value input
  const handleDiscountTypeChange = useCallback(
    (type: 'percent' | 'nominal' | null) => {
      if (type === null) {
        // Explicit reset when "none" selected
        onUpdateFormData({
          discountType: null,
          discountValue: null,
        })
      } else {
        // Just set type, keep existing value if valid, otherwise null
        onUpdateFormData({
          discountType: type,
          discountValue: formData.discountValue || null,
        })
      }
    },
    [onUpdateFormData, formData.discountValue],
  )

  // Separate function for discount value changes
  const handleDiscountValueChange = useCallback(
    (value: number) => {
      // Only update value, keep existing type
      onUpdateFormData({
        discountValue: value || null,
      })
    },
    [onUpdateFormData],
  )

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6 space-y-6">
      <div className="flex items-center gap-2 text-xl font-bold text-gray-900">
        <Percent className="h-6 w-6" />
        Diskon (Opsional)
      </div>

      <div className="space-y-4">
        <Label className="text-sm font-medium text-gray-700">
          Pilih Jenis Diskon
        </Label>
        <RadioGroup
          value={formData.discountType || 'none'}
          onValueChange={(value) => {
            if (value === 'none') {
              handleDiscountTypeChange(null)
            } else {
              handleDiscountTypeChange(value as 'percent' | 'nominal')
            }
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
          data-testid="discount-type-selector"
        >
          <div className="flex items-center space-x-3 border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <RadioGroupItem value="none" id="no-discount" data-testid="discount-none-radio" />
            <Label htmlFor="no-discount" className="flex items-center gap-2 cursor-pointer">
              <span className="text-gray-600">Tanpa Diskon</span>
            </Label>
          </div>
          
          <div className="flex items-center space-x-3 border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <RadioGroupItem value="percent" id="percent-discount" data-testid="discount-percent-radio" />
            <Label htmlFor="percent-discount" className="flex items-center gap-2 cursor-pointer">
              <Percent className="h-4 w-4 text-blue-600" />
              <span>Diskon Persentase (%)</span>
            </Label>
          </div>
          
          <div className="flex items-center space-x-3 border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <RadioGroupItem value="nominal" id="nominal-discount" data-testid="discount-nominal-radio" />
            <Label htmlFor="nominal-discount" className="flex items-center gap-2 cursor-pointer">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span>Diskon Nominal (Rp)</span>
            </Label>
          </div>
        </RadioGroup>

        {/* Discount Input Field */}
        {formData.discountType && (
          <div className="space-y-2">
            <Label htmlFor="discountValue" className="text-sm font-medium text-gray-700">
              {formData.discountType === 'percent' ? 'Persentase Diskon (0-100%)' : 'Nominal Diskon (Rp)'}
            </Label>
            <div className="relative">
              {formData.discountType === 'nominal' && (
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm font-medium">Rp</span>
                </div>
              )}
              <Input
                id="discountValue"
                type="number"
                placeholder={
                  formData.discountType === 'percent' 
                    ? 'Masukkan persentase (0-100)' 
                    : 'Masukkan nominal'
                }
                value={formData.discountValue || ''}
                onChange={(e) => {
                  const inputValue = Number(e.target.value) || 0
                  handleDiscountValueChange(inputValue)
                }}
                max={formData.discountType === 'percent' ? 100 : subtotal}
                min={0}
                className={formData.discountType === 'nominal' ? 'pl-10' : ''}
                data-testid="discount-value-input"
              />
              {formData.discountType === 'percent' && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm font-medium">%</span>
                </div>
              )}
            </div>
            
            {/* Discount Preview */}
            {formData.discountType && formData.discountValue && formData.discountValue > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-800">
                    💰 Hemat: {formatCurrency(discountAmount)}
                  </span>
                  <span className="text-xs text-green-600">
                    {formData.discountType === 'percent' 
                      ? `${formData.discountValue}% dari ${formatCurrency(subtotal)}`
                      : `Potongan ${formatCurrency(formData.discountValue)}`
                    }
                  </span>
                </div>
              </div>
            )}

            {/* Validation Error */}
            {(() => {
              const validation = PriceCalculator.validateDiscount(
                formData.discountType,
                formData.discountValue,
                subtotal
              )
              return !validation.isValid && validation.error ? (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                  ⚠️ {validation.error}
                </div>
              ) : null
            })()}

            {/* Warning for empty discount value */}
            {formData.discountType && (!formData.discountValue || formData.discountValue === 0) && (
              <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                💡 Masukkan nilai diskon atau pilih &quot;Tanpa Diskon&quot; untuk melanjutkan
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}