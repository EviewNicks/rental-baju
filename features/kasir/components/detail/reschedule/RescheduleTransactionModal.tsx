'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Calendar,
  Clock,
  Shirt,
  Loader2,
  CheckCircle,
  Lock,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { formatDate } from '../../../lib/utils/client'
import { useSwapItem } from '../../../hooks/useSwapItem'
import type { TransactionDetail } from '../../../types'

interface RescheduleTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: TransactionDetail
}

export function RescheduleTransactionModal({
  isOpen,
  onClose,
  transaction,
}: RescheduleTransactionModalProps) {
  // Hitung durasi sewa yang terkunci dari data transaksi saat ini (misal 3 hari atau 7 hari)
  const durationDays = useMemo(() => {
    if (transaction.startDate && transaction.endDate) {
      const diff = Math.round(
        (new Date(transaction.endDate).getTime() - new Date(transaction.startDate).getTime()) /
          (1000 * 60 * 60 * 24),
      )
      if (diff > 0) return diff
    }
    return transaction.products?.[0]?.duration || 3
  }, [transaction.startDate, transaction.endDate, transaction.products])

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')

  // Helper untuk menghitung tanggal selesai secara konsisten sesuai durasi terkunci
  const computeEndDate = (startStr: string, days: number): string => {
    if (!startStr) return ''
    const [y, m, d] = startStr.split('-').map(Number)
    const targetDate = new Date(y, m - 1, d + days)
    const endY = targetDate.getFullYear()
    const endM = String(targetDate.getMonth() + 1).padStart(2, '0')
    const endD = String(targetDate.getDate()).padStart(2, '0')
    return `${endY}-${endM}-${endD}`
  }

  // Sinkronisasi state saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      const start = transaction.startDate ? transaction.startDate.split('T')[0] : ''
      const end = transaction.endDate
        ? transaction.endDate.split('T')[0]
        : computeEndDate(start, durationDays)
      setStartDate(start)
      setEndDate(end)
      setNotes('')
    }
  }, [isOpen, transaction, durationDays])

  // Kasir HANYA perlu memilih tanggal mulai baru, tanggal selesai otomatis terhitung
  const handleStartDateChange = (newStartStr: string) => {
    setStartDate(newStartStr)
    if (newStartStr) {
      setEndDate(computeEndDate(newStartStr, durationDays))
    } else {
      setEndDate('')
    }
  }

  const { ubahTanggalSewa, isRescheduling } = useSwapItem(transaction.transactionCode)

  const isBusy = isRescheduling

  const handleClose = () => {
    onClose()
  }

  const handleSubmit = useCallback(async () => {
    if (!startDate || !endDate) {
      toast.error('Tanggal mulai sewa baru wajib dipilih')
      return
    }

    const payload = {
      tglMulai: new Date(startDate).toISOString(),
      tglSelesai: new Date(endDate).toISOString(),
      durasi: durationDays,
      catatan: notes.trim() || undefined,
    }

    // 1. ⚡ Instant 0ms modal close (Dialog langsung hilang seketika)
    onClose()

    // 2. 🔔 Tampilkan notifikasi Sonner progress
    const toastId = toast.loading('Menyimpan perubahan jadwal sewa transaksi...')

    // 3. 🚀 Eksekusi mutation async di background (Optimistic UI mengupdate tampilan seketika)
    try {
      await ubahTanggalSewa(payload)
      toast.success('Jadwal sewa transaksi berhasil diperbarui!', { id: toastId })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengubah jadwal sewa transaksi'
      toast.error(msg, { id: toastId })
    }
  }, [startDate, endDate, durationDays, notes, onClose, ubahTanggalSewa])

  const initialStartDate = transaction.startDate ? transaction.startDate.split('T')[0] : ''
  const isChanged = Boolean(startDate && startDate !== initialStartDate)

  // Keyboard shortcut Ctrl+Enter to submit
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (startDate && isChanged) {
          e.preventDefault()
          handleSubmit()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, startDate, isChanged, handleSubmit])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        showCloseButton={true}
        onPointerDownOutside={(e) => {
          if (isBusy) e.preventDefault()
        }}
        onEscapeKeyDown={(e) => {
          if (isBusy) e.preventDefault()
        }}
        className="w-[96vw] sm:max-w-xl md:max-w-2xl max-h-[92vh] flex flex-col p-0 gap-0 border-blue-200/70 shadow-2xl rounded-2xl bg-white overflow-hidden"
      >
        {/* Header */}
        <DialogHeader className="flex-shrink-0 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-500/10 via-blue-400/5 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-blue-600 text-white shadow-xs flex items-center justify-center">
                <Calendar className="h-5 w-5" />
              </span>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                  Ubah Jadwal Sewa Transaksi
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  Geser tanggal sewa transaksi ini tanpa membatalkan nota.
                </DialogDescription>
              </div>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-blue-100 text-blue-800 rounded-full border border-blue-200">
              {transaction.transactionCode}
            </span>
          </div>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-5">
          {/* Notice box */}
          <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
            <Clock className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Informasi Jadwal Transaksi:</strong> Perubahan tanggal sewa berlaku untuk{' '}
              <strong>seluruh pakaian</strong> dalam nota transaksi ini dengan durasi tetap{' '}
              <strong>{durationDays} Hari</strong>.
            </div>
          </div>

          {/* Current vs New Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Current Schedule */}
            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
                Jadwal Saat Ini
              </span>
              <div className="text-sm font-bold text-gray-800">
                {formatDate(transaction.startDate)}
              </div>
              <div className="text-xs text-gray-500">
                s/d {transaction.endDate ? formatDate(transaction.endDate) : 'Belum ditentukan'}
              </div>
              <div className="text-[11px] font-semibold text-gray-600 pt-1 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-gray-400" />
                Durasi: {durationDays} Hari
              </div>
            </div>

            {/* Target New Dates Highlight */}
            <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block">
                Jadwal Baru yang Dipilih
              </span>
              <div className="text-sm font-bold text-blue-900">
                {startDate ? formatDate(startDate) : '-'}
              </div>
              <div className="text-xs text-blue-700">
                s/d {endDate ? formatDate(endDate) : '-'}
              </div>
              <div className="text-[11px] font-semibold text-blue-800 pt-1 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-blue-500" />
                Durasi Tetap: {durationDays} Hari
              </div>
            </div>
          </div>

          {/* Form Pickers */}
          <div className="space-y-4 pt-1">
            {/* Date Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Tanggal Mulai Sewa Baru <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="h-10 text-xs rounded-xl focus:ring-2 focus:ring-blue-500/20"
                />
                <span className="text-[11px] text-gray-500 mt-1 block">
                  Pilih tanggal mulai sewa yang baru
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center justify-between">
                  <span>Tanggal Kembali / Selesai</span>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">
                    Otomatis
                  </span>
                </label>
                <Input
                  type="date"
                  value={endDate}
                  readOnly
                  disabled
                  className="h-10 text-xs rounded-xl bg-gray-100/80 cursor-not-allowed text-gray-600 border-gray-200"
                />
                <span className="text-[11px] text-gray-500 mt-1 block">
                  Otomatis terhitung ({durationDays} hari dari tanggal mulai)
                </span>
              </div>
            </div>

            {/* List of Affected Items */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Item dalam Transaksi yang Dijadwalkan Ulang ({transaction.products?.length || 0}):
              </label>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {transaction.products?.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-2.5 bg-gray-50 rounded-xl border border-gray-200/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Shirt className="h-3.5 w-3.5 text-gray-500" />
                      <span className="font-semibold text-gray-900">{item.product.name}</span>
                      <span className="text-gray-500">({item.product.size || 'Standard'})</span>
                    </div>
                    <span className="text-[11px] font-semibold text-gray-600">
                      {item.quantity} pcs
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes textarea */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700">
                Alasan Perubahan Jadwal (Opsional):
              </label>
              <Textarea
                placeholder="Contoh: Tanggal acara resepsi dimajukan oleh pihak keluarga penyewa..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="text-xs rounded-xl resize-none"
              />
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="sticky -bottom-5 bg-white/95 backdrop-blur-md pt-4 pb-3 px-6 border-t border-gray-200 flex items-center justify-between z-10 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isBusy}
            className="rounded-xl px-5 text-xs"
          >
            Batal
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={isBusy || !isChanged}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md px-6 h-10 text-xs"
          >
            {isBusy ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Menyimpan Jadwal...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Simpan Jadwal Baru
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
