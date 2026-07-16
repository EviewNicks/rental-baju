'use client'

/**
 * ExportDialog Component
 * 
 * Dialog for exporting dana kasir data to CSV
 * 
 * Features:
 * - Date range picker
 * - Preset options (today, this week, this month)
 * - Export button
 * - Loading state during export
 * - Error handling
 * - File download trigger
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.5
 */

import { useState } from 'react'
import { Download, Loader2, Calendar } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { formatWITADate, getCurrentWITADate } from '../utils/timezone'

interface ExportDialogProps {
  isOpen: boolean
  onClose: () => void
  /**
   * Tipe export:
   * - 'dana-kasir' (default): Export laporan keuangan (Pendapatan/Pengeluaran/Penalty)
   * - 'transaksi': Export data transaksi + customer (No. HP, Alamat, Jumlah Item)
   */
  exportType?: 'dana-kasir' | 'transaksi'
}

export function ExportDialog({ isOpen, onClose, exportType = 'dana-kasir' }: ExportDialogProps) {
  const isTransaksiExport = exportType === 'transaksi'

  // Dynamic values berdasarkan tipe export
  const dialogTitle = isTransaksiExport ? 'Export Data Transaksi' : 'Export Data CSV'
  const dialogDescription = isTransaksiExport
    ? 'Pilih rentang tanggal untuk mengekspor data transaksi dan informasi customer (No. HP, Alamat, Jumlah Item)'
    : 'Pilih rentang tanggal untuk mengekspor data pendapatan dan pengeluaran'
  const infoText = isTransaksiExport
    ? 'File CSV akan berisi data transaksi lengkap dengan No. HP, alamat, dan jumlah item untuk periode yang dipilih'
    : 'File CSV akan berisi data pendapatan dan pengeluaran untuk periode yang dipilih'

  const today = getCurrentWITADate()
  const [startDate, setStartDate] = useState(formatWITADate(today))
  const [endDate, setEndDate] = useState(formatWITADate(today))
  const [isExporting, setIsExporting] = useState(false)

  // Handle preset selection
  const handlePreset = (preset: 'today' | 'week' | 'month') => {
    const now = getCurrentWITADate()
    const todayStr = formatWITADate(now)

    switch (preset) {
      case 'today':
        setStartDate(todayStr)
        setEndDate(todayStr)
        break
      case 'week':
        // Last 7 days
        const weekAgo = new Date(now)
        weekAgo.setDate(weekAgo.getDate() - 6)
        setStartDate(formatWITADate(weekAgo))
        setEndDate(todayStr)
        break
      case 'month':
        // Current month
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        setStartDate(formatWITADate(monthStart))
        setEndDate(todayStr)
        break
    }
  }

  // Validate date range
  const validateDates = (): boolean => {
    if (!startDate || !endDate) {
      toast.error('Mohon pilih tanggal mulai dan tanggal akhir')
      return false
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start > end) {
      toast.error('Tanggal mulai harus lebih kecil atau sama dengan tanggal akhir')
      return false
    }

    return true
  }

  // Handle export
  const handleExport = async () => {
    if (!validateDates()) return

    setIsExporting(true)

    try {
      // Pilih endpoint berdasarkan exportType
      const apiEndpoint = isTransaksiExport
        ? `/api/kasir/transaksi-export?startDate=${startDate}&endDate=${endDate}`
        : `/api/kasir/dana-export?startDate=${startDate}&endDate=${endDate}`

      const response = await fetch(apiEndpoint)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Gagal mengekspor data')
      }

      // Get filename from response headers or generate default
      const contentDisposition = response.headers.get('Content-Disposition')
      const defaultFilename = isTransaksiExport
        ? `transaksi-${startDate}.csv`
        : `dana-kasir-${startDate}.csv`
      let filename = defaultFilename
      
      if (contentDisposition) {
        // Match filename with or without quotes, properly handling both cases
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"|filename=([^;]+)/)
        if (filenameMatch) {
          // Use the first capturing group (quoted) or second (unquoted)
          filename = (filenameMatch[1] || filenameMatch[2]).trim()
        }
      }

      // Create blob and trigger download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Data berhasil diekspor')
      onClose()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan'
      toast.error(errorMessage)
    } finally {
      setIsExporting(false)
    }
  }

  // Handle close
  const handleClose = () => {
    if (isExporting) return // Prevent closing while exporting
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-green-600" />
            {dialogTitle}
          </DialogTitle>
          <DialogDescription>
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preset Buttons */}
          <div className="space-y-2">
            <Label>Pilih Cepat</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePreset('today')}
                disabled={isExporting}
              >
                Hari Ini
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePreset('week')}
                disabled={isExporting}
              >
                7 Hari
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePreset('month')}
                disabled={isExporting}
              >
                Bulan Ini
              </Button>
            </div>
          </div>

          {/* Date Range Inputs */}
          <div className="space-y-2">
            <Label htmlFor="startDate">
              <Calendar className="inline h-4 w-4 mr-1" />
              Tanggal Mulai
            </Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={isExporting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">
              <Calendar className="inline h-4 w-4 mr-1" />
              Tanggal Akhir
            </Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={isExporting}
            />
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              {infoText}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isExporting}
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mengekspor...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
