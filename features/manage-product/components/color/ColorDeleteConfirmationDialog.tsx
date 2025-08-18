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
import type { Color } from '@/features/manage-product/types/color'

interface ColorDeleteConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  color: Color | null
  loading?: boolean
}

export function ColorDeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  color,
  loading = false,
}: ColorDeleteConfirmationDialogProps) {
  if (!color) return null

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Hapus Warna
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="px-6 space-y-3">
          <p className="text-sm text-muted-foreground">
            Apakah Anda yakin ingin menghapus warna <strong>{color.name}</strong>?
          </p>
          <p className="text-sm text-red-600">
            Tindakan ini tidak dapat dibatalkan. Warna yang telah digunakan dalam produk akan tetap tersimpan dalam riwayat produk.
          </p>
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
            <strong>Detail Warna:</strong>
            <br />
            Nama: {color.name}
            <br />
            <div className="flex items-center gap-2 mt-1">
              Kode Warna: 
              <div 
                className="w-4 h-4 rounded border border-gray-300" 
                style={{ backgroundColor: color.hexCode }}
                title={color.hexCode}
              />
              <span className="font-mono text-xs">{color.hexCode}</span>
            </div>
            {color.product_count > 0 && (
              <>
                <br />
                Digunakan pada: {color.product_count} produk
              </>
            )}
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