'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X, Edit, Trash2 } from 'lucide-react'
import { ProductImageSection } from './ProductImageSection'
import { ProductInfoSection } from './ProductInfoSection'
import { useProduct, useDeleteProduct } from '@/features/manage-product/hooks/useProduct'
import { showSuccess, showError } from '@/lib/notifications'
import type { Product } from '@/features/manage-product/types'

interface ProductDetailModalProps {
  productId: string | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (product: Product) => void
  onProductDeleted?: () => void
}

export function ProductDetailModal({
  productId,
  isOpen,
  onClose,
  onEdit,
  onProductDeleted,
}: ProductDetailModalProps) {
  // Fetch product data
  const {
    data: product,
    isLoading,
    error: productError,
    refetch,
  } = useProduct(productId || '', {
    enabled: !!productId && isOpen,
  })

  const deleteProductMutation = useDeleteProduct()

  const handleEdit = () => {
    if (product && onEdit) {
      onEdit(product)
      onClose()
    }
  }

  const handleDelete = async () => {
    if (!product) return

    try {
      // Show confirmation dialog
      const confirmed = window.confirm(
        `Apakah Anda yakin ingin menghapus produk "${product.name}"? Tindakan ini tidak dapat dibatalkan.`,
      )

      if (!confirmed) return

      await deleteProductMutation.mutateAsync(product.id)
      showSuccess('Produk berhasil dihapus', `Produk ${product.name} telah dihapus dari inventaris`)

      onProductDeleted?.()
      onClose()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menghapus produk'
      showError('Gagal menghapus produk', errorMessage)
      console.error('Failed to delete product:', error)
    }
  }

  const handleRetry = () => {
    refetch()
  }

  const renderContent = () => {
    if (isLoading) {
      return <ProductDetailSkeleton />
    }

    if (productError || !product) {
      const errorMessage =
        productError instanceof Error ? productError.message : 'Produk tidak ditemukan'
      return <ProductDetailError error={errorMessage} onRetry={handleRetry} />
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Section */}
          <ProductImageSection imageUrl={product.imageUrl} productName={product.name} />

          {/* Info Section */}
          <ProductInfoSection product={product} />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handleEdit}
            disabled={deleteProductMutation.isPending}
            className="flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteProductMutation.isPending}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {deleteProductMutation.isPending ? 'Menghapus...' : 'Hapus'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              {isLoading ? 'Memuat...' : product ? `Detail ${product.name}` : 'Detail Produk'}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="mt-4">{renderContent()}</div>
      </DialogContent>
    </Dialog>
  )
}

// Loading Skeleton Component
function ProductDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="animate-pulse">
          <div className="aspect-[4/3] bg-gray-200 rounded-lg"></div>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-6 bg-gray-200 rounded w-full"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-6 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <div className="h-9 bg-gray-200 rounded w-20 animate-pulse"></div>
        <div className="h-9 bg-gray-200 rounded w-20 animate-pulse"></div>
      </div>
    </div>
  )
}

// Error Component
function ProductDetailError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="text-center py-8">
      <div className="text-red-600 mb-2">
        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Terjadi Kesalahan</h3>
      <p className="text-gray-600 mb-4">{error}</p>
      <Button onClick={onRetry} variant="outline">
        Coba Lagi
      </Button>
    </div>
  )
}
