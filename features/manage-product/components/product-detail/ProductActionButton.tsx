'use client'

import { Edit, Trash2, ArrowLeft, Sparkles } from 'lucide-react'
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
    layout === 'horizontal' ? 'flex justify-end space-x-3' : 'flex flex-col space-y-3 '

  return (
    <div className={`${containerClass} ${className}`}>
      {onBack && (
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-2 bg-white hover:bg-gray-50 border-gray-300 hover:border-gray-400 transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </Button>
      )}

      <Button
        variant="default"
        onClick={() => onEdit(product)}
        className={`
          flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 
          hover:from-yellow-500 hover:to-yellow-600 text-black font-semibold 
          shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105
          ${layout === 'vertical' ? 'w-full justify-center' : ''}
        `}
      >
        <Edit className="w-4 h-4" />
        <span>Edit Produk</span>
        <Sparkles className="w-4 h-4 ml-1 opacity-70" />
      </Button>

      <Button
        variant="destructive"
        onClick={() => onDelete(product)}
        className={`
          flex items-center gap-2  bg-red-500 hover:bg-red-600 
          shadow-md hover:shadow-lg transition-all duration-200
          ${layout === 'vertical' ? 'w-full justify-center' : ''}
        `}
      >
        <Trash2 className="w-4 h-4" />
        <span>Hapus Produk</span>
      </Button>
    </div>
  )
}
