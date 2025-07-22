'use client'

import { useState, useEffect } from 'react'
import {
  Calendar,
  CreditCard,
  Banknote,
  Smartphone,
  FileText,
  ShoppingBag,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import type { TransactionFormData } from '../../types/transaction-form'
import { formatCurrency } from '../../lib/utils'
import Image from 'next/image'

interface PaymentSummaryStepProps {
  formData: TransactionFormData
  totalAmount: number
  onUpdateFormData: (updates: Partial<TransactionFormData>) => void
  onSubmit: () => Promise<boolean>
  onPrev: () => void
  isSubmitting: boolean
}

export function PaymentSummaryStep({
  formData,
  totalAmount,
  onUpdateFormData,
  onSubmit,
  onPrev,
  isSubmitting,
}: PaymentSummaryStepProps) {
  const [duration, setDuration] = useState(3) // Default 3 days

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

  const handleSubmit = async () => {
    const success = await onSubmit()
    if (success) {
      // Handle success (e.g., show success message, redirect)
      console.log('Transaction submitted successfully!')
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
                  src={item.product.image || '/placeholder.svg'}
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
            <Input
              id="duration"
              type="number"
              min="1"
              max="30"
              value={duration}
              onChange={(e) => setDuration(Number.parseInt(e.target.value) || 1)}
              className="mt-2"
            />
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="paymentAmount" className="text-sm font-medium text-gray-700">
              Jumlah Bayar
            </Label>
            <Input
              id="paymentAmount"
              type="number"
              value={formData.paymentAmount}
              onChange={(e) =>
                onUpdateFormData({ paymentAmount: Number.parseInt(e.target.value) || 0 })
              }
              placeholder="0"
              className="mt-2"
            />
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Status Pembayaran</Label>
            <RadioGroup
              value={formData.paymentStatus}
              onValueChange={(value: 'paid' | 'unpaid') =>
                onUpdateFormData({ paymentStatus: value })
              }
              className="mt-2 flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="paid" id="paid" />
                <Label htmlFor="paid" className="cursor-pointer">
                  Lunas
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="unpaid" id="unpaid" />
                <Label htmlFor="unpaid" className="cursor-pointer">
                  Belum Lunas
                </Label>
              </div>
            </RadioGroup>
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

      {/* Total & Submit */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between text-2xl font-bold text-gray-900">
          <span>Total Pembayaran</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>

        {formData.paymentStatus === 'unpaid' && formData.paymentAmount > 0 && (
          <div className="text-sm text-gray-600">
            Sisa pembayaran: {formatCurrency(subtotal - formData.paymentAmount)}
          </div>
        )}

        <div className="flex items-center justify-between pt-4">
          <Button variant="outline" onClick={onPrev}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Data Penyewa
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.pickupDate || !formData.paymentMethod}
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-8 py-3"
            size="lg"
          >
            {isSubmitting ? 'Memproses...' : 'Buat Transaksi'}
          </Button>
        </div>
      </div>
    </div>
  )
}
