'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Calendar,
  CreditCard,
  Banknote,
  Smartphone,
  FileText,
  ShoppingBag,
  ArrowLeft,
  CheckCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLogger } from '@/lib/client-logger'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import type { TransactionFormData } from '../../types/transaction-form'
import { formatCurrency } from '../../lib/utils'
import Image from 'next/image'

interface PaymentSummaryStepProps {
  formData: TransactionFormData
  totalAmount: number
  duration: number
  onUpdateFormData: (updates: Partial<TransactionFormData>) => void
  onUpdateDuration: (duration: number) => void
  onSubmit: () => Promise<boolean>
  onPrev: () => void
  isSubmitting: boolean
}

export function PaymentSummaryStep({
  formData,
  totalAmount,
  duration,
  onUpdateFormData,
  onUpdateDuration,
  onSubmit,
  onPrev,
  isSubmitting,
}: PaymentSummaryStepProps) {
  const log = useLogger('PaymentSummaryStep')
  const [paymentDisplayValue, setPaymentDisplayValue] = useState('')

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
      const paymentStatus = numericValue >= totalAmount ? 'paid' : 'unpaid'

      // Update form data with numeric value and automatic status
      onUpdateFormData({
        paymentAmount: numericValue,
        paymentStatus: paymentStatus,
      })
    },
    [parseFromDisplay, formatToDisplay, onUpdateFormData, totalAmount],
  )

  useEffect(() => {
    // Auto-calculate return date based on pickup date and duration
    if (formData.pickupDate) {
      const pickupDate = new Date(formData.pickupDate)
      const returnDate = new Date(pickupDate)
      returnDate.setDate(returnDate.getDate() + duration)

      onUpdateFormData({
        returnDate: returnDate.toISOString().split('T')[0],
      })
    }
  }, [formData.pickupDate, duration, onUpdateFormData])

  // Auto-calculate payment status when payment amount or total changes
  useEffect(() => {
    if (formData.paymentAmount > 0) {
      const paymentStatus = formData.paymentAmount >= totalAmount ? 'paid' : 'unpaid'
      if (formData.paymentStatus !== paymentStatus) {
        onUpdateFormData({ paymentStatus })
      }
    }
  }, [formData.paymentAmount, totalAmount, formData.paymentStatus, onUpdateFormData])

  const handleSubmit = async () => {
    const success = await onSubmit()
    if (success) {
      // Handle success (e.g., show success message, redirect)
      log.info('Transaction submitted successfully!', { totalAmount })
    }
  }

  // Use totalAmount from parent instead of recalculating
  const subtotal = totalAmount

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Order Summary */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6 space-y-6">
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
          {formData.products.map((item) => (
            <div
              key={item.product.id}
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
                    {item.product.size} • {item.product.color} •{' '}
                    {formatCurrency(item.product.pricePerDay)}/hari
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">
                  {formatCurrency(item.product.pricePerDay * item.quantity * duration)}
                </div>
                <div className="text-sm text-gray-600">
                  {item.quantity}x × {duration} hari
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rental Duration & Dates */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6 space-y-6">
        <div className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <Calendar className="h-6 w-6" />
          Tanggal & Durasi Sewa
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Duration */}
          <div>
            <Label htmlFor="duration" className="text-sm font-medium text-gray-700">
              Durasi Sewa (Hari)
            </Label>
            <div className="mt-2 space-y-3">
              {/* Duration Presets */}
              <div className="flex flex-wrap gap-2">
                {[1, 3, 7, 14].map((preset) => (
                  <Button
                    key={preset}
                    type="button"
                    variant={duration === preset ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onUpdateDuration(preset)}
                    className="text-xs"
                  >
                    {preset} hari
                  </Button>
                ))}
              </div>
              {/* Custom Duration Input */}
              <Input
                id="duration"
                type="number"
                min="1"
                max="30"
                value={duration}
                onChange={(e) => onUpdateDuration(Number.parseInt(e.target.value) || 1)}
                className="w-full"
                placeholder="Atau masukkan durasi kustom"
              />
            </div>
          </div>

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
            />
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6 space-y-6">
        <div className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <CreditCard className="h-6 w-6" />
          Metode Pembayaran
        </div>

        <RadioGroup
          value={formData.paymentMethod}
          onValueChange={(value: 'cash' | 'qris' | 'transfer') =>
            onUpdateFormData({ paymentMethod: value })
          }
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="flex items-center space-x-3 border border-gray-200 rounded-lg p-4">
            <RadioGroupItem value="cash" id="cash" />
            <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer">
              <Banknote className="h-5 w-5" />
              Tunai
            </Label>
          </div>
          <div className="flex items-center space-x-3 border border-gray-200 rounded-lg p-4">
            <RadioGroupItem value="qris" id="qris" />
            <Label htmlFor="qris" className="flex items-center gap-2 cursor-pointer">
              <Smartphone className="h-5 w-5" />
              QRIS
            </Label>
          </div>
          <div className="flex items-center space-x-3 border border-gray-200 rounded-lg p-4">
            <RadioGroupItem value="transfer" id="transfer" />
            <Label htmlFor="transfer" className="flex items-center gap-2 cursor-pointer">
              <CreditCard className="h-5 w-5" />
              Transfer Bank
            </Label>
          </div>
        </RadioGroup>

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
                />
              </div>
              {/* Quick Payment Options */}
              <div className="flex gap-2 flex-wrap">
                {/* Common payment amounts */}
                {[50000, 100000, 200000, 500000]
                  .filter((amount) => amount < subtotal)
                  .map((amount) => (
                    <Button
                      key={amount}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const paymentStatus = amount >= subtotal ? 'paid' : 'unpaid'
                        onUpdateFormData({
                          paymentAmount: amount,
                          paymentStatus: paymentStatus,
                        })
                      }}
                      className="text-xs flex-1 min-w-[80px]"
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
                      paymentAmount: subtotal,
                      paymentStatus: 'paid',
                    })
                  }
                  className="text-xs flex-1 min-w-[100px] bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                >
                  Bayar Lunas
                </Button>
              </div>

              {/* Payment help text */}
              {formData.paymentAmount > subtotal && (
                <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded border border-yellow-200">
                  💡 Jumlah pembayaran melebihi total. Kembalian:{' '}
                  {formatCurrency(formData.paymentAmount - subtotal)}
                </div>
              )}

              {formData.paymentAmount > 0 && formData.paymentAmount < subtotal && (
                <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">
                  ⚠️ Pembayaran belum lunas. Sisa:{' '}
                  {formatCurrency(subtotal - formData.paymentAmount)}
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
        />
      </div>

      {/* Total Breakdown & Submit */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6 space-y-6">
        {/* Total Breakdown */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Ringkasan Pembayaran</h3>

          {/* Item Details */}
          <div className="space-y-2">
            {formData.products.map((item) => (
              <div key={item.product.id} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {item.product.name} × {item.quantity} × {duration} hari
                </span>
                <span className="font-medium">
                  {formatCurrency(item.product.pricePerDay * item.quantity * duration)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-yellow-300 pt-3">
            <div className="flex items-center justify-between text-xl font-bold text-gray-900">
              <span>Total Pembayaran</span>
              <span className="text-yellow-700">{formatCurrency(subtotal)}</span>
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
                  {formatCurrency(subtotal - formData.paymentAmount)}
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
          <Button variant="outline" onClick={onPrev}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Data Penyewa
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.pickupDate || !formData.paymentMethod}
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-8 py-3 shadow-lg transition-all duration-200"
            size="lg"
          >
            {isSubmitting ? 'Memproses...' : 'Buat Transaksi'}
          </Button>
        </div>
      </div>
    </div>
  )
}
