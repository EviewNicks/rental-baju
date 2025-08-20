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
import type { Material } from '@/features/manage-product/types/material'

interface MaterialDeleteConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  material: Material | null
  loading?: boolean
}

export function MaterialDeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  material,
  loading = false,
}: MaterialDeleteConfirmationDialogProps) {
  if (!material) return null

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Hapus Material
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="px-6 space-y-3">
          <p className="text-sm text-muted-foreground">
            Apakah Anda yakin ingin menghapus material <strong>{material.name}</strong>?
          </p>
          <p className="text-sm text-red-600">
            Tindakan ini tidak dapat dibatalkan. Material yang telah digunakan dalam produk akan tetap tersimpan dalam riwayat produk.
          </p>
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
            <strong>Detail Material:</strong>
            <br />
            Nama: {material.name}
            <br />
            Harga: Rp {material.pricePerUnit.toLocaleString('id-ID')} per {material.unit}
          </div>
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