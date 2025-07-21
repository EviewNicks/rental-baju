'use client'

import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { ClientCategory } from '@/features/manage-product/types'

interface DeleteConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  category: ClientCategory | null
  loading?: boolean
}

export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  category,
  loading = false,
}: DeleteConfirmationDialogProps) {
  if (!category) return null

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Hapus Kategori
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="px-6 space-y-3">
          <p className="text-sm text-muted-foreground">
            Apakah Anda yakin ingin menghapus kategori <strong>{category.name}</strong>?
          </p>
          <p className="text-sm text-red-600">
            Tindakan ini tidak dapat dibatalkan dan akan mempengaruhi {category.products.length}{' '}
            produk yang menggunakan kategori ini.
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="destructive" onClick={onConfirm} disabled={loading}>
              {loading ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Menghapus...
                </>
              ) : (
                'Hapus'
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
