'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, Package, RefreshCw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { TransactionDetail } from '../../types'

interface LostItem {
  returnRecordId: string
  itemId: string
  productName: string
  sizeInfo: string
  depositAmount: number
}

interface LostItemResolutionModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: TransactionDetail
  lostItems: LostItem[]
}

type ResolutionType = 'customer_replaced' | 'deposit_kept'

interface Kasir {
  id: string
  nama: string  // ✅ Match dengan API response
  isActive: boolean
}

export function LostItemResolutionModal({
  isOpen,
  onClose,
  transaction,
  lostItems,
}: LostItemResolutionModalProps) {
  const [resolutionType, setResolutionType] = useState<ResolutionType>('customer_replaced')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [kasirId, setKasirId] = useState<string>('')
  const [kasirList, setKasirList] = useState<Kasir[]>([])
  const [isLoadingKasir, setIsLoadingKasir] = useState(false)

  // Fetch kasir list when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchKasirList()
    }
  }, [isOpen])

  const fetchKasirList = async () => {
    setIsLoadingKasir(true)
    try {
      const response = await fetch('/api/kasir/kasir?limit=100&isActive=true')
      if (!response.ok) {
        throw new Error('Gagal mengambil daftar kasir')
      }
      const result = await response.json()
      
      // ✅ Fix: Access nested data structure correctly
      // API returns: { success: true, data: { data: [...], pagination: {...}, summary: {...} } }
      const kasirData = result.data?.data || []
      
      // Filter only active kasirs
      const activeKasirs = kasirData.filter((kasir: Kasir) => kasir.isActive)
      
      setKasirList(activeKasirs)
    } catch (error) {
      console.error('Error fetching kasir list:', error)
      toast.error('Gagal mengambil daftar kasir')
    } finally {
      setIsLoadingKasir(false)
    }
  }

  const handleSubmit = async () => {
    if (lostItems.length === 0) {
      toast.error('Tidak ada barang hilang untuk diselesaikan')
      return
    }

    // Validate kasir selection
    if (!kasirId) {
      toast.error('Pilih kasir terlebih dahulu')
      return
    }

    setIsSubmitting(true)

    try {
      // ✅ FIX: Use transactionCode instead of kode (Transaction interface uses transactionCode)
      const transactionCode = transaction.transactionCode || transaction.id
      
      // Debug logging removed for production
      
      // Process each lost item
      for (const item of lostItems) {
        // Processing item for resolution

        const response = await fetch(
          `/api/kasir/transaksi/${transactionCode}/resolve-lost-item`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              returnRecordId: item.returnRecordId,
              resolutionType,
              kasirId,
              notes: notes.trim() || undefined,
            }),
          },
        )

        if (!response.ok) {
          const error = await response.json()
          console.error('[LostItemResolutionModal] API error:', {
            status: response.status,
            statusText: response.statusText,
            error,
            item: item.returnRecordId,
          })
          throw new Error(error.error?.message || error.message || 'Gagal menyelesaikan barang hilang')
        }

        await response.json()
        // Item resolved successfully
      }

      // All items resolved successfully

      // Success
      toast.success(
        resolutionType === 'customer_replaced'
          ? 'Barang hilang berhasil diselesaikan. Dana jaminan dikembalikan.'
          : 'Barang hilang berhasil diselesaikan. Dana jaminan ditahan.',
      )

      // Reset form
      setResolutionType('customer_replaced')
      setNotes('')
      setKasirId('')

      // Close modal and refresh
      onClose()
    } catch (error) {
      console.error('Resolution error:', error)
      toast.error(error instanceof Error ? error.message : 'Terjadi kesalahan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    // Confirm if form is dirty
    if (notes.trim() || kasirId) {
      if (!confirm('Batalkan perubahan?')) {
        return
      }
    }

    // Reset and close
    setResolutionType('customer_replaced')
    setNotes('')
    setKasirId('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-orange-600" />
            Resolve Barang Hilang
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Lost Items List */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Barang Hilang</h3>
            <div className="space-y-2">
              {lostItems.map((item) => (
                <div
                  key={item.returnRecordId}
                  className="p-4 bg-orange-50 border border-orange-200 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-medium text-gray-900">{item.productName}</p>
                      <p className="text-sm text-gray-600">{item.sizeInfo}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Dana Jaminan</p>
                      <p className="font-semibold text-orange-600">
                        Rp {item.depositAmount.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Kasir Selection */}
          <div className="space-y-2">
            <Label htmlFor="kasir" className="text-sm font-semibold text-gray-900">
              Pilih Kasir <span className="text-red-500">*</span>
            </Label>
            {isLoadingKasir ? (
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                <span className="text-sm text-gray-600">Memuat daftar kasir...</span>
              </div>
            ) : (
              <Select value={kasirId} onValueChange={setKasirId}>
                <SelectTrigger id="kasir" className="w-full">
                  <SelectValue placeholder="Pilih kasir untuk expense tracking" />
                </SelectTrigger>
                <SelectContent>
                  {kasirList.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">Tidak ada kasir aktif</div>
                  ) : (
                    kasirList.map((kasir) => (
                      <SelectItem key={kasir.id} value={kasir.id}>
                        {kasir.nama}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
            <p className="text-xs text-gray-500">
              Kasir yang dipilih akan digunakan untuk mencatat pengeluaran refund dana jaminan
            </p>
          </div>

          {/* Resolution Options */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Pilih Penyelesaian</h3>
            <RadioGroup value={resolutionType} onValueChange={(v) => setResolutionType(v as ResolutionType)}>
              <div className="space-y-3">
                {/* Option 1: Customer Replaced */}
                <div className="flex items-start space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                  <RadioGroupItem value="customer_replaced" id="customer_replaced" className="mt-1" />
                  <Label htmlFor="customer_replaced" className="flex-1 cursor-pointer">
                    <div className="space-y-1">
                      <p className="font-medium text-gray-900">Customer Beli Sendiri</p>
                      <p className="text-sm text-gray-600">
                        Customer membeli barang pengganti. Dana jaminan akan dikembalikan dan stok
                        dipulihkan.
                      </p>
                    </div>
                  </Label>
                </div>

                {/* Option 2: Deposit Kept */}
                <div className="flex items-start space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-orange-300 transition-colors">
                  <RadioGroupItem value="deposit_kept" id="deposit_kept" className="mt-1" />
                  <Label htmlFor="deposit_kept" className="flex-1 cursor-pointer">
                    <div className="space-y-1">
                      <p className="font-medium text-gray-900">Ganti dengan Dana Jaminan</p>
                      <p className="text-sm text-gray-600">
                        Dana jaminan digunakan untuk membeli pengganti. Barang ditandai sebagai
                        hilang permanen.
                      </p>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium text-gray-900">
              Catatan (Opsional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tambahkan catatan jika diperlukan..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800">
              Tindakan ini tidak dapat dibatalkan. Pastikan pilihan Anda sudah benar sebelum
              melanjutkan.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleCancel}
              variant="outline"
              className="flex-1"
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Konfirmasi'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
