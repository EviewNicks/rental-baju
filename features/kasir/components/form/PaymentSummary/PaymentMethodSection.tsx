'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { CreditCard, Banknote, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import type { TransactionFormData } from '../../../types'
import { formatCurrency } from '../../../lib/utils/client'
import { PriceCalculator } from '../../../lib/utils/priceCalculator'

interface PaymentMethodSectionProps {
  formData: TransactionFormData
  onUpdateFormData: (updates: Partial<TransactionFormData>) => void
}

export function PaymentMethodSection({
  formData,
  onUpdateFormData,
}: PaymentMethodSectionProps) {
  const [paymentDisplayValue, setPaymentDisplayValue] = useState('')
  // Local state for primary payment method selection
  const [primaryPaymentMethod, setPrimaryPaymentMethod] = useState<'tunai' | 'bank'>(() => {
    if (formData.paymentMethod === 'tunai') return 'tunai'
    if (['bca', 'bri', 'mandiri', 'qris'].includes(formData.paymentMethod)) return 'bank'
    return 'tunai' // default
  })

  const priceCalculation = useMemo(() => {
    return PriceCalculator.calculateTransactionTotalWithEnhancements({
      items: formData.products,
      duration: formData.duration || 4,
      discountType: formData.discountType,
      discountValue: formData.discountValue,
    })
  }, [formData.products, formData.duration, formData.discountType, formData.discountValue])

  const subtotal = priceCalculation.subtotal
  const finalTotal = priceCalculation.finalTotal

  // Format number to Indonesian currency display (Rp 200.000)
  const formatToDisplay = useCallback((value: number): string => {
    if (value === 0) return ''
    return new Intl.NumberFormat('id-ID').format(value)
  }, [])

  // Parse display string back to number
  const parseFromDisplay = useCallback((displayValue: string): number => {
    if (!displayValue) return 0
    const cleanValue = displayValue.replace(/[^\d]/g, '')
    return parseInt(cleanValue) || 0
  }, [])

  // Sync display value with form data
  useEffect(() => {
    setPaymentDisplayValue(formatToDisplay(formData.paymentAmount))
  }, [formData.paymentAmount, formatToDisplay])

  // Handler for primary payment method change
  const handlePrimaryPaymentMethodChange = useCallback(
    (value: 'tunai' | 'bank') => {
      setPrimaryPaymentMethod(value)
      
      if (value === 'tunai') {
        // Direct selection for cash
        onUpdateFormData({ paymentMethod: 'tunai' })
      } else if (value === 'bank') {
        // For bank, set a default bank method to show options, or keep current if already bank
        const currentMethod = formData.paymentMethod
        if (!['bca', 'bri', 'mandiri', 'qris'].includes(currentMethod)) {
          // Set default bank method to show the options
          onUpdateFormData({ paymentMethod: 'bca' })
        }
        // If already a bank method, keep it as is
      }
    },
    [formData.paymentMethod, onUpdateFormData],
  )

  // Sync local state with form data changes
  useEffect(() => {
    if (formData.paymentMethod === 'tunai') {
      setPrimaryPaymentMethod('tunai')
    } else if (['bca', 'bri', 'mandiri', 'qris'].includes(formData.paymentMethod)) {
      setPrimaryPaymentMethod('bank')
    }
  }, [formData.paymentMethod])

  // Handle currency input change with automatic status calculation
  const handlePaymentChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      const numericValue = parseFromDisplay(inputValue)

      // Update display value with formatting
      const formattedValue = formatToDisplay(numericValue)
      setPaymentDisplayValue(formattedValue)

      // Automatically determine payment status based on amount
      const paymentStatus = numericValue >= finalTotal ? 'paid' : 'unpaid'

      // Update form data with numeric value and automatic status
      onUpdateFormData({
        paymentAmount: numericValue,
        paymentStatus: paymentStatus,
      })
    },
    [parseFromDisplay, formatToDisplay, onUpdateFormData, finalTotal],
  )

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6 space-y-6">
      <div className="flex items-center gap-2 text-xl font-bold text-gray-900">
        <CreditCard className="h-6 w-6" />
        Metode Pembayaran
      </div>

      {/* Primary Level Selection */}
      <div className="space-y-4">
        <Label className="text-sm font-medium text-gray-700">
          Pilih Kategori Pembayaran
        </Label>
        <RadioGroup
          value={primaryPaymentMethod}
          onValueChange={handlePrimaryPaymentMethodChange}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          data-testid="primary-payment-method-selection"
        >
          <div className="flex items-center space-x-3 border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <RadioGroupItem value="tunai" id="primary-tunai-summary" />
            <Label htmlFor="primary-tunai-summary" className="flex items-center gap-2 cursor-pointer flex-1">
              <Banknote className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium text-gray-900"> Tunai</div>
                <div className="text-xs text-gray-500">Pembayaran cash langsung</div>
              </div>
            </Label>
          </div>
          
          <div className="flex items-center space-x-3 border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <RadioGroupItem value="bank" id="primary-bank-summary" />
            <Label htmlFor="primary-bank-summary" className="flex items-center gap-2 cursor-pointer flex-1">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-medium text-gray-900"> Bank/Transfer</div>
                <div className="text-xs text-gray-500">Transfer bank atau QRIS</div>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Secondary Level Selection - Bank Options */}
      {primaryPaymentMethod === 'bank' && (
        <div className="space-y-4 pl-4 border-l-2 border-blue-200 bg-blue-50/30 rounded-r-lg py-4 pr-4">
          <Label className="text-sm font-medium text-blue-700">
            Pilih Bank atau QRIS
          </Label>
          <RadioGroup
            value={formData.paymentMethod}
            onValueChange={(value: 'bca' | 'bri' | 'mandiri' | 'qris') =>
              onUpdateFormData({ paymentMethod: value })
            }
            className="grid grid-cols-1 md:grid-cols-2 gap-3"
            data-testid="bank-payment-method-selection"
          >
            <div className="flex items-center space-x-3 border border-blue-200 rounded-lg p-3 hover:bg-blue-50 transition-colors bg-white">
              <RadioGroupItem value="bca" id="bank-bca-summary" />
              <Label htmlFor="bank-bca-summary" className="flex items-center gap-2 cursor-pointer flex-1">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-gray-900">BCA</span>
              </Label>
            </div>
            
            <div className="flex items-center space-x-3 border border-blue-200 rounded-lg p-3 hover:bg-blue-50 transition-colors bg-white">
              <RadioGroupItem value="bri" id="bank-bri-summary" />
              <Label htmlFor="bank-bri-summary" className="flex items-center gap-2 cursor-pointer flex-1">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-gray-900">BRI</span>
              </Label>
            </div>
            
            <div className="flex items-center space-x-3 border border-blue-200 rounded-lg p-3 hover:bg-blue-50 transition-colors bg-white">
              <RadioGroupItem value="mandiri" id="bank-mandiri-summary" />
              <Label htmlFor="bank-mandiri-summary" className="flex items-center gap-2 cursor-pointer flex-1">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-gray-900">Mandiri</span>
              </Label>
            </div>
            
            <div className="flex items-center space-x-3 border border-blue-200 rounded-lg p-3 hover:bg-blue-50 transition-colors bg-white">
              <RadioGroupItem value="qris" id="bank-qris-summary" />
              <Label htmlFor="bank-qris-summary" className="flex items-center gap-2 cursor-pointer flex-1">
                <Smartphone className="h-4 w-4 text-purple-600" />
                <span className="font-medium text-gray-900">QRIS</span>
              </Label>
            </div>
          </RadioGroup>
        </div>
      )}

      {/* Payment Amount */}
      <div className="space-y-6">
        <div>
          <Label htmlFor="paymentAmount" className="text-sm font-medium text-gray-700">
            Jumlah Bayar
          </Label>
          <div className="mt-2 space-y-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm font-medium">Rp</span>
              </div>
              <Input
                id="paymentAmount"
                type="text"
                value={paymentDisplayValue}
                onChange={handlePaymentChange}
                placeholder="0"
                className={`w-full pl-10 pr-24 text-right font-mono text-lg transition-colors ${
                  formData.paymentAmount > subtotal
                    ? 'border-yellow-300 bg-yellow-50'
                    : formData.paymentAmount === subtotal
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-300'
                }`}
                style={{ textAlign: 'right' }}
                data-testid="payment-amount-input"
              />
            </div>
            {/* Quick Payment Options */}
            <div className="flex gap-2 flex-wrap" data-testid="quick-payment-buttons">
              {/* Common payment amounts */}
              {[50000, 100000, 200000, 500000]
                .filter((amount) => amount < finalTotal)
                .map((amount) => (
                  <Button
                    key={amount}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const paymentStatus = amount >= finalTotal ? 'paid' : 'unpaid'
                      onUpdateFormData({
                        paymentAmount: amount,
                        paymentStatus: paymentStatus,
                      })
                    }}
                    className="text-xs flex-1 min-w-[80px]"
                    data-testid={`quick-payment-${amount}`}
                  >
                    {formatCurrency(amount)}
                  </Button>
                ))}

              {/* Pay full amount button with automatic status */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  onUpdateFormData({
                    paymentAmount: finalTotal,
                    paymentStatus: 'paid',
                  })
                }
                className="text-xs flex-1 min-w-[100px] bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                data-testid="pay-full-amount-button"
              >
                Bayar Lunas
              </Button>
            </div>

            {/* Payment help text */}
            {formData.paymentAmount > finalTotal && (
              <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded border border-yellow-200">
                💡 Jumlah pembayaran melebihi total. Kembalian:{' '}
                {formatCurrency(formData.paymentAmount - finalTotal)}
              </div>
            )}

            {formData.paymentAmount > 0 && formData.paymentAmount < finalTotal && (
              <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">
                ⚠️ Pembayaran belum lunas. Sisa:{' '}
                {formatCurrency(finalTotal - formData.paymentAmount)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}