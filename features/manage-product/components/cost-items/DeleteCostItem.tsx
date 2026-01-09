"use client"

import { useState } from 'react'
import { Trash2, AlertTriangle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import type { CostItem } from '../../types/costItem'

interface DeleteCostItemDialogProps {
  costItem: CostItem
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function DeleteCostItemDialog({
  costItem,
  open,
  onClose,
  onSuccess,
}: DeleteCostItemDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    try {
      setIsDeleting(true)

      const response = await fetch(`/api/cost-items/${costItem.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Gagal menghapus cost item')
      }

      onSuccess()
    } catch (error) {
      console.error('Error deleting cost item:', error)
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus cost item')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Hapus Cost Item
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Apakah Anda yakin ingin menghapus cost item{' '}
              <span className="font-semibold">&ldquo;{costItem.name}&rdquo;</span>?
            </p>
            <p className="text-sm text-gray-600">
              Tindakan ini tidak dapat dibatalkan. Cost item yang sedang digunakan dalam produk
              tidak dapat dihapus.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Menghapus...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Hapus
              </div>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}