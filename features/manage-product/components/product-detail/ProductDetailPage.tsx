'use client'

import React, { useState, useEffect } from 'react'
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
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        setError(null)

        // Simulate API call - replace with actual API call
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Mock data - replace with actual API call
        const mockProducts = (await import('@/features/manage-product/data/mock-products'))
          .mockProducts
        const foundProduct = mockProducts.find((p) => p.id === productId)

        if (!foundProduct) {
          setError('Produk tidak ditemukan')
          return
        }

        setProduct(foundProduct)
        onProductLoad?.(foundProduct)
      } catch (err) {
        setError('Gagal memuat detail produk')
        console.error('Error fetching product:', err)
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      fetchProduct()
    }
  }, [productId, onProductLoad])

  const handleEdit = (product: Product) => {
    router.push(`/producer/manage-product/edit/${product.id}`)
  }

  const handleDelete = (product: Product) => {
    // Implement delete confirmation dialog
    console.log('Delete product:', product.id)
  }

  const handleBack = () => {
    router.back()
  }

  if (loading) {
    return <ProductDetailSkeleton />
  }

  if (error || !product) {
    return <ProductDetailError error={error} onRetry={() => window.location.reload()} />
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
              <ProductImageSection imageUrl={product.image_url} productName={product.name} />

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
