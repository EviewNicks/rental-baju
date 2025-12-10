'use client'

/**
 * DeleteConfirmation Component
 * 
 * Confirmation dialog for deleting expenses
 * 
 * Features:
 * - Modal dialog with expense details
 * - Confirm and cancel buttons
 * - Loading state during deletion
 * - Error handling
 * - Soft delete (isActive = false)
 * 
 * Requirements: 3.4, 3.5
 */

import { AlertTriangle, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useDeletePengeluaran } from '../hooks/useDeletePengeluaran'
import { PengeluaranKasir } from '../types'
import { formatRupiah } from '../utils/currency'

interface DeleteConfirmationProps {
  isOpen: boolean
  onClose: () => void
  expense: PengeluaranKasir | null
  onSuccess?: () => void
}

export function DeleteConfirmation({
  isOpen,
  onClose,
  expense,
  onSuccess,
}: DeleteConfirmationProps) {
  const deleteMutation = useDeletePengeluaran()
  const isLoading = deleteMutation.isPending

  // Handle delete confirmation
  const handleConfirm = async () => {
    if (!expense) return

    try {
      await deleteMutation.mutateAsync(expense.id)
      toast.success('Pengeluaran berhasil dihapus')
      onSuccess?.()
      onClose()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan'
      toast.error(errorMessage)
    }
  }

  // Handle close
  const handleClose = () => {
    if (isLoading) return // Prevent closing while loading
    onClose()
  }

  if (!expense) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Hapus Pengeluaran
          </DialogTitle>
          <DialogDescription>
            Apakah Anda yakin ingin menghapus pengeluaran ini? Tindakan ini tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>

        {/* Expense Details */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Jumlah:</span>
            <span className="text-lg font-bold text-gray-900">
              {formatRupiah(expense.harga)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Kategori:</span>
            <span className="text-sm font-medium text-gray-900">
              {expense.kategori}
            </span>
          </div>
          {expense.deskripsi && (
            <div className="pt-2 border-t border-gray-200">
              <span className="text-sm text-gray-600">Deskripsi:</span>
              <p className="text-sm text-gray-900 mt-1">{expense.deskripsi}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menghapus...
              </>
            ) : (
              'Hapus'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
