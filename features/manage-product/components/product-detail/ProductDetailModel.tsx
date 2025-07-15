'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ProductImageSection } from './ProductImageSection'
import { ProductInfoSection } from './ProductInfoSection'
import { ProductActionButtons } from './ProductActionButton'
import type { Product } from '@/features/manage-product/types'

interface ProductDetailModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
}

export function ProductDetailModal({
  isOpen,
  onClose,
  product,
  onEdit,
  onDelete,
}: ProductDetailModalProps) {
  if (!product) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detail Produk</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Image Section */}
          <ProductImageSection imageUrl={product.image_url} productName={product.name} />

          {/* Info Section */}
          <ProductInfoSection product={product} />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <ProductActionButtons
            product={product}
            onEdit={onEdit}
            onDelete={onDelete}
            layout="horizontal"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
