'use client'

import { Edit, Trash2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Product } from '@/features/manage-product/types'

interface ProductActionButtonsProps {
  product: Product
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
  onBack?: () => void
  layout?: 'horizontal' | 'vertical'
  className?: string
}

export function ProductActionButtons({
  product,
  onEdit,
  onDelete,
  onBack,
  layout = 'horizontal',
  className,
}: ProductActionButtonsProps) {
  const containerClass =
    layout === 'horizontal' ? 'flex justify-end space-x-3' : 'flex flex-col space-y-3'

  return (
    <div className={`${containerClass} ${className}`}>
      {onBack && (
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-2 bg-transparent"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </Button>
      )}

      <Button
        variant="default"
        onClick={() => onEdit(product)}
        className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black"
      >
        <Edit className="w-4 h-4" />
        Edit Produk
      </Button>

      <Button
        variant="destructive"
        onClick={() => onDelete(product)}
        className="flex items-center gap-2"
      >
        <Trash2 className="w-4 h-4" />
        Hapus Produk
      </Button>
    </div>
  )
}
