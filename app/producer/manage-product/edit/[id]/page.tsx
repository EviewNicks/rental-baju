'use client'

import { useParams } from 'next/navigation'
import { ProductFormPage } from '@/features/manage-product/components/form-product/ProductFormPage'
import { useProduct } from '@/features/manage-product/hooks/useProduct'

export default function EditProductPage() {
  const params = useParams()
  const productId = String(params.id)

  // Use the proper hooks layer instead of mock data
  const { 
    data: product, 
    isLoading: loading, 
    error 
  } = useProduct(productId)

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/producer' },
    { label: 'Manajemen Produk', href: '/producer/manage-product' },
    { label: 'Edit Produk', current: true },
  ]

  // Handle loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-4 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent" />
          <p className="text-gray-600">Memuat data produk...</p>
        </div>
      </div>
    )
  }

  // Handle error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600">
            {error instanceof Error ? error.message : 'Gagal memuat data produk'}
          </p>
        </div>
      </div>
    )
  }

  // Handle not found state
  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Produk tidak ditemukan</h2>
          <p className="text-gray-600">Produk yang Anda cari tidak ada atau telah dihapus.</p>
        </div>
      </div>
    )
  }

  return (
    <ProductFormPage
      mode="edit"
      product={product}
      breadcrumbItems={breadcrumbItems}
      title={`Edit Produk: ${product.name}`}
      subtitle="Ubah informasi produk sesuai kebutuhan"
    />
  )
}
