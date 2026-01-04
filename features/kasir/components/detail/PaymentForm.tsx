'use client'

import { useForm } from 'react-hook-form'
import { useState, useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertTriangle, Banknote, CreditCard, Smartphone } from 'lucide-react'
import { formatCurrency } from '../../lib/utils/client'
import type { PrimaryPaymentMethod, BankPaymentMethod } from '../../types'

// Payment form validation schema
const paymentFormSchema = z.object({
  jumlah: z
    .number()
    .positive('Jumlah pembayaran harus lebih dari 0')
    .min(1000, 'Jumlah pembayaran minimal Rp 1.000'),
  metode: z.enum(['tunai', 'bca', 'bri', 'mandiri', 'qris'], {
    message: 'Pilih metode pembayaran',
  }),
  catatan: z.string().max(500, 'Catatan maksimal 500 karakter').optional(),
})

type PaymentFormData = z.infer<typeof paymentFormSchema>

interface PaymentFormProps {
  remainingAmount: number
  isProcessing: boolean
  error: Error | null
  onSubmit: (data: PaymentFormData) => void
  onCancel: () => void
}

export function PaymentForm({
  remainingAmount,
  isProcessing,
  error,
  onSubmit,
  onCancel,
}: PaymentFormProps) {
  // 2-level selection state
  const [primaryMethod, setPrimaryMethod] = useState<PrimaryPaymentMethod>('tunai')
  const [bankMethod, setBankMethod] = useState<BankPaymentMethod>()

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      jumlah: remainingAmount,
      metode: 'tunai',
      catatan: '',
    },
  })

  // Handle primary method change
  const handlePrimaryMethodChange = (value: PrimaryPaymentMethod) => {
    setPrimaryMethod(value)
    
    if (value === 'tunai') {
      // If tunai selected, set form value directly
      form.setValue('metode', 'tunai')
      setBankMethod(undefined)
    } else {
      // If bank selected, wait for bank method selection
      // Don't set form value yet
    }
  }

  // Handle bank method change
  const handleBankMethodChange = (value: BankPaymentMethod) => {
    setBankMethod(value)
    form.setValue('metode', value)
  }

  // Initialize UI state from form value
  useEffect(() => {
    const currentMethod = form.watch('metode')
    if (currentMethod === 'tunai') {
      setPrimaryMethod('tunai')
      setBankMethod(undefined)
    } else if (['bca', 'bri', 'mandiri', 'qris'].includes(currentMethod)) {
      setPrimaryMethod('bank')
      setBankMethod(currentMethod as BankPaymentMethod)
    }
  }, [form])

  const handleSubmit = (data: PaymentFormData) => {
    // Additional validation for amount
    if (data.jumlah > remainingAmount) {
      form.setError('jumlah', {
        message: `Jumlah pembayaran tidak boleh melebihi sisa tagihan (${formatCurrency(remainingAmount)})`,
      })
      return
    }

    // Validate payment method selection
    if (primaryMethod === 'bank' && !bankMethod) {
      form.setError('metode', {
        message: 'Pilih bank atau QRIS untuk pembayaran non-tunai',
      })
      return
    }

    onSubmit(data)
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      {/* Payment Amount */}
      <div className="space-y-2">
        <Label htmlFor="jumlah">Jumlah Pembayaran</Label>
        <div className="relative">
          <Input
            id="jumlah"
            type="number"
            min="1000"
            max={remainingAmount}
            step="1000"
            placeholder="Masukkan jumlah pembayaran"
            {...form.register('jumlah', { valueAsNumber: true })}
            className="pl-12"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">Rp</span>
        </div>
        {form.formState.errors.jumlah && (
          <p className="text-sm text-red-600">{form.formState.errors.jumlah.message}</p>
        )}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Sisa tagihan: <span className="font-medium">{formatCurrency(remainingAmount)}</span>
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => form.setValue('jumlah', remainingAmount)}
            className="text-xs"
          >
            Bayar Lunas
          </Button>
        </div>
      </div>

      {/* Payment Method - 2-Level Selection */}
      <div className="space-y-4">
        <Label className="text-sm font-medium text-gray-700">Metode Pembayaran</Label>
        
        {/* Primary Level Selection */}
        <div className="space-y-3">
          <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
            Pilih Kategori Pembayaran
          </Label>
          <RadioGroup
            value={primaryMethod}
            onValueChange={handlePrimaryMethodChange}
            className="grid grid-cols-1 md:grid-cols-2 gap-3"
          >
            <div className="flex items-center space-x-3 border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <RadioGroupItem value="tunai" id="primary-tunai" />
              <Label htmlFor="primary-tunai" className="flex items-center gap-2 cursor-pointer flex-1">
                <Banknote className="h-5 w-5 text-green-600" />
                  <div className="font-medium text-gray-900">Tunai</div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-3 border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <RadioGroupItem value="bank" id="primary-bank" />
              <Label htmlFor="primary-bank" className="flex items-center gap-2 cursor-pointer flex-1">
                <CreditCard className="h-5 w-5 text-blue-600" />
                  <div className="font-medium text-gray-900">Bank/Transfer</div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Secondary Level Selection - Bank Options */}
        {primaryMethod === 'bank' && (
          <div className="space-y-3 pl-4 border-l-2 border-blue-200 bg-blue-50/30 rounded-r-lg py-3 pr-4">
            <Label className="text-xs font-medium text-blue-700 uppercase tracking-wide">
              Pilih Bank atau QRIS
            </Label>
            <RadioGroup
              value={bankMethod || ''}
              onValueChange={handleBankMethodChange}
              className="grid grid-cols-1 md:grid-cols-2 gap-3"
            >
              <div className="flex items-center space-x-3 border border-blue-200 rounded-lg p-3 hover:bg-blue-50 transition-colors bg-white">
                <RadioGroupItem value="bca" id="bank-bca" />
                <Label htmlFor="bank-bca" className="flex items-center gap-2 cursor-pointer flex-1">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-gray-900">BCA</span>
                </Label>
              </div>
              
              <div className="flex items-center space-x-3 border border-blue-200 rounded-lg p-3 hover:bg-blue-50 transition-colors bg-white">
                <RadioGroupItem value="bri" id="bank-bri" />
                <Label htmlFor="bank-bri" className="flex items-center gap-2 cursor-pointer flex-1">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-gray-900">BRI</span>
                </Label>
              </div>
              
              <div className="flex items-center space-x-3 border border-blue-200 rounded-lg p-3 hover:bg-blue-50 transition-colors bg-white">
                <RadioGroupItem value="mandiri" id="bank-mandiri" />
                <Label htmlFor="bank-mandiri" className="flex items-center gap-2 cursor-pointer flex-1">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-gray-900">Mandiri</span>
                </Label>
              </div>
              
              <div className="flex items-center space-x-3 border border-blue-200 rounded-lg p-3 hover:bg-blue-50 transition-colors bg-white">
                <RadioGroupItem value="qris" id="bank-qris" />
                <Label htmlFor="bank-qris" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Smartphone className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-gray-900">QRIS</span>
                </Label>
              </div>
            </RadioGroup>
            
            {/* Bank selection validation error */}
            {primaryMethod === 'bank' && !bankMethod && (
              <p className="text-sm text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">
                💡 Pilih salah satu opsi bank atau QRIS untuk melanjutkan
              </p>
            )}
          </div>
        )}
        
        {/* Form validation error */}
        {form.formState.errors.metode && (
          <p className="text-sm text-red-600">{form.formState.errors.metode.message}</p>
        )}
        
        {/* Help text */}
        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
          ℹ️ Semua metode pembayaran tidak memerlukan nomor referensi
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error.message || 'Terjadi kesalahan saat memproses pembayaran'}
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1"
        >
          Batal
        </Button>
        <Button
          type="submit"
          disabled={
            isProcessing || 
            !form.formState.isValid || 
            form.getValues('jumlah') <= 0 ||
            (primaryMethod === 'bank' && !bankMethod)
          }
          className="flex-1 transition-all duration-200"
          title={
            !form.formState.isValid
              ? 'Periksa kembali form pembayaran'
              : form.getValues('jumlah') <= 0
                ? 'Masukkan jumlah pembayaran yang valid'
                : primaryMethod === 'bank' && !bankMethod
                  ? 'Pilih bank atau QRIS untuk pembayaran non-tunai'
                  : undefined
          }
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Memproses...
            </>
          ) : (
            `Bayar ${formatCurrency(form.getValues('jumlah') || 0)}`
          )}
        </Button>
      </div>
    </form>
  )
}
