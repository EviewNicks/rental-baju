'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ProductFormPage } from '@/features/manage-product/components/form-product/ProductFormPage'
import { mockProducts } from '@/features/manage-product/data/mock-products'
import type { Product } from '@/features/manage-product/types'

export default function EditProductPage() {
  const params = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API call to fetch product
    const fetchProduct = async () => {
      try {
        // In real app, this would be an API call
        const foundProduct = mockProducts.find((p) => p.id === params.id)
        setProduct(foundProduct || null)
      } catch (error) {
        console.error('Error fetching product:', error)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchProduct()
    }
  }, [params.id])

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/producer' },
    { label: 'Manajemen Produk', href: '/producer/manage-product' },
    { label: 'Edit Produk', current: true },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-4 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent" />
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    )
  }

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
