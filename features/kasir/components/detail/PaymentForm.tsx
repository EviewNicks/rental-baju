'use client'

import { useForm } from 'react-hook-form'
import { useEffect, useRef } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertTriangle, Info } from 'lucide-react'
import { usePaymentMethods } from '../../hooks/usePaymentProcessing'
import { formatCurrency } from '../../lib/utils/client'

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
  const { paymentMethods } = usePaymentMethods()

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      jumlah: remainingAmount,
      metode: 'tunai',
      catatan: '',
    },
  })

  const selectedMethod = form.watch('metode')
  const selectedMethodInfo = paymentMethods.find((m) => m.value === selectedMethod)

  const handleSubmit = (data: PaymentFormData) => {
    // Additional validation for amount
    if (data.jumlah > remainingAmount) {
      form.setError('jumlah', {
        message: `Jumlah pembayaran tidak boleh melebihi sisa tagihan (${formatCurrency(remainingAmount)})`,
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

      {/* Payment Method */}
      <div className="space-y-2">
        <Label htmlFor="metode">Metode Pembayaran</Label>
        <Select
          value={selectedMethod}
          onValueChange={(value) => {
            form.setValue('metode', value as 'tunai' | 'bca' | 'bri' | 'mandiri' | 'qris')
          }}
        >
          <SelectTrigger aria-label="Pilih metode pembayaran">
            <SelectValue placeholder="Pilih metode pembayaran" />
          </SelectTrigger>
          <SelectContent>
            {paymentMethods.map((method) => (
              <SelectItem
                key={method.value}
                value={method.value}
                aria-label={method.label}
              >
                <span>{method.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.metode && (
          <p className="text-sm text-red-600">{form.formState.errors.metode.message}</p>
        )}
        <p className="text-sm text-gray-600">
          Semua metode pembayaran tidak memerlukan nomor referensi
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
          disabled={isProcessing || !form.formState.isValid || form.getValues('jumlah') <= 0}
          className="flex-1 transition-all duration-200"
          title={
            !form.formState.isValid
              ? 'Periksa kembali form pembayaran'
              : form.getValues('jumlah') <= 0
                ? 'Masukkan jumlah pembayaran yang valid'
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
