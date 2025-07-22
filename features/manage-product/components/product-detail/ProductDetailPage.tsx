'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { ProductImageSection } from './ProductImageSection'
import { ProductInfoSection } from './ProductInfoSection'
import { ProductActionButtons } from './ProductActionButton'
import { useProduct, useDeleteProduct } from '@/features/manage-product/hooks/useProduct'
import { showSuccess, showError } from '@/lib/notifications'
import type { Product } from '@/features/manage-product/types'

interface ProductDetailPageProps {
  productId: string
  onProductLoad?: (product: Product) => void
  breadcrumbItems?: Array<{ label: string; href?: string; current?: boolean }>
}

export function ProductDetailPage({
  productId,
  onProductLoad,
  breadcrumbItems,
}: ProductDetailPageProps) {
  const router = useRouter()

  // Use real API data through hooks
  const { data: product, isLoading, error: productError, refetch } = useProduct(productId)

  const deleteProductMutation = useDeleteProduct()

  // Call onProductLoad when product is loaded
  React.useEffect(() => {
    if (product && onProductLoad) {
      onProductLoad(product)
    }
  }, [product, onProductLoad])

  const handleEdit = (product: Product) => {
    router.push(`/producer/manage-product/edit/${product.id}`)
  }

  const handleDelete = async (product: Product) => {
    try {
      // Show confirmation dialog
      const confirmed = window.confirm(
        `Apakah Anda yakin ingin menghapus produk "${product.name}"? Tindakan ini tidak dapat dibatalkan.`,
      )

      if (!confirmed) return

      await deleteProductMutation.mutateAsync(product.id)
      showSuccess('Produk berhasil dihapus', `Produk ${product.name} telah dihapus dari inventaris`)

      // Navigate back to product list
      router.push('/producer/manage-product')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menghapus produk'
      showError('Gagal menghapus produk', errorMessage)
      console.error('Failed to delete product:', error)
    }
  }

  const handleBack = () => {
    router.back()
  }

  const handleRetry = () => {
    refetch()
  }

  if (isLoading) {
    return <ProductDetailSkeleton />
  }

  if (productError || !product) {
    const errorMessage =
      productError instanceof Error ? productError.message : 'Produk tidak ditemukan'
    return <ProductDetailError error={errorMessage} onRetry={handleRetry} />
  }

  const defaultBreadcrumbItems = [
    { label: 'Dashboard', href: '/producer' },
    { label: 'Manajemen Produk', href: '/producer/manage-product' },
    { label: product.name, current: true },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={handleBack} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </Button>
          </div>

          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              {(breadcrumbItems || defaultBreadcrumbItems).map((item, index) => (
                <React.Fragment key={index}>
                  <BreadcrumbItem>
                    {item.current ? (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={item.href || '#'}>{item.label}</BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {index < (breadcrumbItems || defaultBreadcrumbItems).length - 1 && (
                    <BreadcrumbSeparator />
                  )}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>

          <div>
            <h1 className="text-3xl font-bold text-gray-900">Detail Produk</h1>
            <p className="text-gray-600 mt-1">Informasi lengkap tentang produk {product.name}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="shadow-md">
          <CardContent className="p-6 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Image Section */}
              <ProductImageSection imageUrl={product.imageUrl} productName={product.name} />

              {/* Info Section */}
              <ProductInfoSection product={product} />
            </div>

            {/* Action Buttons */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <ProductActionButtons
                product={product}
                onEdit={handleEdit}
                onDelete={handleDelete}
                layout="horizontal"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Loading Skeleton Component
function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-64 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-48"></div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="shadow-md">
          <CardContent className="p-6 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="animate-pulse">
                <div className="aspect-[4/3] bg-gray-200 rounded-lg"></div>
              </div>
              <div className="animate-pulse space-y-6">
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
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Error Component
function ProductDetailError({ error, onRetry }: { error: string | null; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{error || 'Terjadi kesalahan'}</h2>
        <p className="text-gray-600 mb-4">Gagal memuat detail produk</p>
        <Button onClick={onRetry}>Coba Lagi</Button>
      </div>
    </div>
  )
}
