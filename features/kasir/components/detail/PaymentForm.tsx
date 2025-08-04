'use client'

import { useForm } from 'react-hook-form'
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
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertTriangle } from 'lucide-react'
import { usePaymentMethods } from '../../hooks/usePaymentProcessing'
import { formatCurrency } from '../../lib/utils/client'

// Payment form validation schema
const paymentFormSchema = z
  .object({
    jumlah: z
      .number()
      .positive('Jumlah pembayaran harus lebih dari 0')
      .min(1000, 'Jumlah pembayaran minimal Rp 1.000'),
    metode: z.enum(['tunai', 'transfer', 'kartu'], {
      message: 'Pilih metode pembayaran',
    }),
    referensi: z.string().optional(),
    catatan: z.string().max(500, 'Catatan maksimal 500 karakter').optional(),
  })
  .refine(
    (data) => {
      // Reference is required for transfer and kartu methods
      if ((data.metode === 'transfer' || data.metode === 'kartu') && !data.referensi?.trim()) {
        return false
      }
      return true
    },
    {
      message: 'Nomor referensi wajib diisi untuk metode transfer dan QRIS/Kartu',
      path: ['referensi'],
    },
  )

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
      referensi: '',
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
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
          onValueChange={(value) =>
            form.setValue('metode', value as 'tunai' | 'transfer' | 'kartu')
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih metode pembayaran" />
          </SelectTrigger>
          <SelectContent>
            {paymentMethods.map((method) => (
              <SelectItem key={method.value} value={method.value}>
                <div className="flex items-center justify-between w-full">
                  <span>{method.label}</span>
                  {method.requiresReference && (
                    <span className="text-xs text-gray-500 ml-2">*Referensi</span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.metode && (
          <p className="text-sm text-red-600">{form.formState.errors.metode.message}</p>
        )}
        <p className="text-sm text-gray-600">
          {selectedMethodInfo?.requiresReference
            ? 'Metode ini memerlukan nomor referensi'
            : 'Pembayaran langsung tanpa referensi'}
        </p>
      </div>

      {/* Reference Number (conditional) */}
      {selectedMethodInfo?.requiresReference && (
        <div className="space-y-2">
          <Label htmlFor="referensi">
            Nomor Referensi
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            id="referensi"
            placeholder={
              selectedMethod === 'transfer'
                ? 'Nomor referensi transfer bank'
                : 'Nomor referensi QRIS/Kartu'
            }
            {...form.register('referensi')}
          />
          {form.formState.errors.referensi && (
            <p className="text-sm text-red-600">{form.formState.errors.referensi.message}</p>
          )}
          <p className="text-sm text-gray-600">
            {selectedMethod === 'transfer'
              ? 'Masukkan nomor referensi dari slip transfer bank'
              : 'Masukkan nomor referensi dari QRIS atau struk kartu'}
          </p>
        </div>
      )}

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="catatan">Catatan (Opsional)</Label>
        <Textarea
          id="catatan"
          placeholder="Catatan tambahan untuk pembayaran ini..."
          rows={3}
          {...form.register('catatan')}
        />
        {form.formState.errors.catatan && (
          <p className="text-sm text-red-600">{form.formState.errors.catatan.message}</p>
        )}
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
      <div className="flex gap-3 pt-4">
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
          className="flex-1"
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
