'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Calendar,
  CreditCard,
  Banknote,
  Smartphone,
  FileText,
  ShoppingBag,
  ArrowLeft,
  CheckCircle,
  Percent,
  DollarSign,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import type { TransactionFormData } from '../../types'
import { formatCurrency } from '../../lib/utils/client'
import { PriceCalculator } from '../../lib/utils/priceCalculator'
import { DateCalculator } from '../../lib/utils/dateCalculator'
import Image from 'next/image'

interface PaymentSummaryStepProps {
  formData: TransactionFormData
  onUpdateFormData: (updates: Partial<TransactionFormData>) => void
  onSubmit: () => Promise<boolean>
  onPrev: () => void
  isSubmitting: boolean
}

export function PaymentSummaryStep({
  formData,
  onUpdateFormData,
  onSubmit,
  onPrev,
  isSubmitting,
}: PaymentSummaryStepProps) {
  const [paymentDisplayValue, setPaymentDisplayValue] = useState('')
  // ✅ FIX: Add local submission state to prevent multiple API calls
  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false)
  // ✅ FIX: Add local state for primary payment method selection
  const [primaryPaymentMethod, setPrimaryPaymentMethod] = useState<'tunai' | 'bank'>(() => {
    if (formData.paymentMethod === 'tunai') return 'tunai'
    if (['bca', 'bri', 'mandiri', 'qris'].includes(formData.paymentMethod)) return 'bank'
    return 'tunai' // default
  })

  // ✅ FIX: Add handler for primary payment method change
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

  // ✅ FIX: Sync local state with form data changes
  useEffect(() => {
    if (formData.paymentMethod === 'tunai') {
      setPrimaryPaymentMethod('tunai')
    } else if (['bca', 'bri', 'mandiri', 'qris'].includes(formData.paymentMethod)) {
      setPrimaryPaymentMethod('bank')
    }
  }, [formData.paymentMethod])
  const priceCalculation = useMemo(() => {
    return PriceCalculator.calculateTransactionTotalWithEnhancements({
      items: formData.products,
      duration: formData.duration || 4,
      discountType: formData.discountType,
      discountValue: formData.discountValue,
    })
  }, [formData.products, formData.duration, formData.discountType, formData.discountValue])

  // Use calculated total instead of passed totalAmount
  const subtotal = priceCalculation.subtotal
  const discountAmount = priceCalculation.discountAmount
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

  // Handle duration change with automatic return date calculation
  const handleDurationChange = useCallback(
    (newDuration: 4 | 7) => {
      const returnDate = DateCalculator.calculateReturnDate(formData.pickupDate, newDuration)
      
      onUpdateFormData({
        duration: newDuration,
        returnDate: returnDate,
      })
    },
    [formData.pickupDate, onUpdateFormData],
  )

  // ✅ FIX: Separate discount type selection from value input
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

  // ✅ FIX: Separate function for discount value changes
  const handleDiscountValueChange = useCallback(
    (value: number) => {
      // Only update value, keep existing type
      onUpdateFormData({
        discountValue: value || null,
      })
    },
    [onUpdateFormData],
  )

  useEffect(() => {
    // Auto-calculate return date based on pickup date and selected duration
    if (formData.pickupDate && formData.duration) {
      const returnDate = DateCalculator.calculateReturnDate(formData.pickupDate, formData.duration)
      
      if (returnDate !== formData.returnDate) {
        onUpdateFormData({
          returnDate: returnDate,
        })
      }
    }
  }, [formData.pickupDate, formData.duration, formData.returnDate, onUpdateFormData])

  // Auto-calculate payment status when payment amount or total changes
  useEffect(() => {
    if (formData.paymentAmount > 0) {
      const paymentStatus = formData.paymentAmount >= finalTotal ? 'paid' : 'unpaid'
      if (formData.paymentStatus !== paymentStatus) {
        onUpdateFormData({ paymentStatus })
      }
    }
  }, [formData.paymentAmount, finalTotal, formData.paymentStatus, onUpdateFormData])

  const handleSubmit = useCallback(async () => {
    // ✅ FIX: Enhanced multiple submission prevention with double guard
    if (isSubmitting || isSubmittingLocal) {
      console.warn('[PaymentSummaryStep] Submission blocked - already in progress', {
        isSubmitting,
        isSubmittingLocal,
        timestamp: new Date().toISOString(),
      })
      return
    }

    // ✅ FIX: Set local submission lock immediately
    setIsSubmittingLocal(true)

    try {
      // Client-side validation before submit
      if (formData.discountType && (!formData.discountValue || formData.discountValue === 0)) {
        // Auto-reset discount if type is selected but value is empty/zero
        onUpdateFormData({
          discountType: null,
          discountValue: null,
        })
        // Wait for next render cycle, then submit
        await new Promise(resolve => setTimeout(resolve, 0))
        const success = await onSubmit()
        if (success) {
          // Transaction completed successfully
        }
        return
      }

      const success = await onSubmit()
      if (success) {
        // Transaction completed successfully
      }
    } catch (error) {
      console.error('[PaymentSummaryStep] Submission error:', error)
    } finally {
      // ✅ FIX: Always release local submission lock
      setIsSubmittingLocal(false)
    }
  }, [isSubmitting, isSubmittingLocal, formData.discountType, formData.discountValue, onUpdateFormData, onSubmit])

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="payment-summary-layout">
      {/* Order Summary */}
      <div
        className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6 space-y-6"
        data-testid="order-summary-section"
      >
        <div className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <ShoppingBag className="h-6 w-6" />
          Ringkasan Pesanan
        </div>

        {/* Customer Info */}
        {formData.customer && (
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="text-sm font-medium text-gray-700 mb-3">Penyewa</div>
            <div className="text-lg font-semibold text-gray-900">{formData.customer.name}</div>
            <div className="text-sm text-gray-600">{formData.customer.phone}</div>
            <div className="text-sm text-gray-600">{formData.customer.address}</div>
          </div>
        )}

        {/* Products List */}
        <div className="space-y-4">
          <div className="text-sm font-medium text-gray-700">Produk yang Disewa</div>
          {formData.products.map((item, index) => {
            const selectedSize = item.productSizeId
              ? item.product.sizes?.find((s) => s.id === item.productSizeId)
              : null

            const itemCalculation = priceCalculation.itemCalculations[index]
            const basePrice = item.product.pricePerDay * item.quantity
            const adjustedPrice = itemCalculation?.adjustedPrice || basePrice
            const duration = formData.duration || 4

            return (
              <div
                key={`${item.product.id}-${item.productSizeId || 'default'}`}
                className="flex items-center justify-between py-4 border-b border-gray-200 last:border-b-0"
              >
                <div className="flex items-center gap-4">
                  <Image
                    src={
                      item.product.image?.startsWith('/') || item.product.image?.startsWith('http')
                        ? item.product.image || '/placeholder.svg'
                        : `/${item.product.image || 'placeholder.svg'}`
                    }
                    alt={item.product.name}
                    width={200}
                    height={200}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{item.product.name}</div>
                    <div className="text-sm text-gray-600">
                      {selectedSize ? (
                        <>
                          {selectedSize.ageCategory} • {selectedSize.size} •{' '}
                        </>
                      ) : (
                        <>
                          {item.product.size} • {item.product.color} •{' '}
                        </>
                      )}
                      {formatCurrency(item.product.pricePerDay)}/{duration} hari
                      {duration === 7 && (
                        <span className="text-orange-600 font-medium"> (+50%)</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    {formatCurrency(adjustedPrice)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {item.quantity}x × {duration} hari
                  </div>
                  {duration === 7 && basePrice !== adjustedPrice && (
                    <div className="text-xs text-orange-600">
                      Base: {formatCurrency(basePrice)}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Rental Duration & Dates */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6 space-y-6">
        <div className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <Calendar className="h-6 w-6" />
          Tanggal & Durasi Sewa
        </div>

        {/* Duration Selector */}
        <div className="space-y-4">
          <Label className="text-sm font-medium text-gray-700">
            Pilih Paket Durasi Sewa
          </Label>
          <RadioGroup
            value={formData.duration?.toString() || '4'}
            onValueChange={(value) => handleDurationChange(Number(value) as 4 | 7)}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            data-testid="duration-selector"
          >
            <div className="flex items-center space-x-3 border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <RadioGroupItem value="4" id="duration-4" data-testid="duration-4-radio" />
              <Label htmlFor="duration-4" className="flex-1 cursor-pointer">
                <div className="flex items-center justify-between">
                    <div className="font-medium text-gray-900">Paket 4 Hari</div>
                    <div className="text-sm text-gray-600">Harga normal untuk area lokal</div>
                  
                </div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-3 border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <RadioGroupItem value="7" id="duration-7" data-testid="duration-7-radio" />
              <Label htmlFor="duration-7" className="flex-1 cursor-pointer justify-between">
                <div className="flex items-center justify-between"> 
                    <div className="font-medium text-gray-900">Paket 7 Hari</div>
                    <div className="text-sm text-gray-600">+50% untuk luar kota</div>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pickup Date */}
          <div>
            <Label htmlFor="pickupDate" className="text-sm font-medium text-gray-700">
              Tanggal Ambil
            </Label>
            <Input
              id="pickupDate"
              type="date"
              value={formData.pickupDate}
              onChange={(e) => onUpdateFormData({ pickupDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="mt-2"
              required
              data-testid="pickup-date-input"
            />
          </div>

          {/* Return Date */}
          <div>
            <Label htmlFor="returnDate" className="text-sm font-medium text-gray-700">
              Tanggal Kembali
            </Label>
            <Input
              id="returnDate"
              type="date"
              value={formData.returnDate}
              readOnly
              className="mt-2 bg-gray-50"
              data-testid="return-date-input"
            />
            {formData.returnDate && (
              <div className="text-xs text-gray-600 mt-1">
                {DateCalculator.formatDateForDisplay(formData.returnDate)}
              </div>
            )}
          </div>
        </div>
      </div>

       {/* Discount Section */}
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

      {/* Payment Method - 2-Level Selection */}
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

      {/* Notes */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6 space-y-4">
        <div className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <FileText className="h-6 w-6" />
          Catatan (Opsional)
        </div>
        <Textarea
          value={formData.notes || ''}
          onChange={(e) => onUpdateFormData({ notes: e.target.value })}
          placeholder="Tambahkan catatan untuk transaksi ini..."
          className="min-h-[100px]"
          data-testid="transaction-notes-textarea"
        />
      </div>

      {/* Total Breakdown & Submit */}
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
              const adjustedPrice = itemCalculation?.adjustedPrice || basePrice

              return (
                <div key={`${item.product.id}-${item.productSizeId || 'default'}`} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.product.name}
                      {selectedSize && ` (${selectedSize.ageCategory} - ${selectedSize.size})`} × {item.quantity}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(basePrice)}
                    </span>
                  </div>
                  {formData.duration === 7 && (
                    <div className="flex justify-between text-xs text-orange-600 ml-4">
                      <span>↳ Paket 7 hari (+50%)</span>
                      <span>+ {formatCurrency(adjustedPrice - basePrice)}</span>
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
            onClick={handleSubmit}
            disabled={isSubmitting || isSubmittingLocal || !formData.pickupDate || !formData.paymentMethod}
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-8 py-3 shadow-lg transition-all duration-200"
            size="lg"
            data-testid="submit-transaction-button"
          >
            {(isSubmitting || isSubmittingLocal) ? 'Memproses...' : 'Buat Transaksi'}
          </Button>
        </div>
      </div>
    </div>
  )
}
