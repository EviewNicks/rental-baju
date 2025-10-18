'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Heart, ShoppingBag, Clock, Loader2, AlertCircle, Home } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { useTransformedProductDetail } from '../hooks/usePublicProducts'
import { formatCurrency, getStatusBadge } from '@/features/manage-product/lib/utils/product'
import { lightenColor, getContrastTextColor } from '@/features/manage-product/lib/utils/color'
import { getValidImageUrl } from '@/features/manage-product/lib/utils/imageValidate'
import { SizeDetailCard } from './SizeDetailCard'

interface PublicProductDetailPageProps {
  productId: string
}

export function PublicProductDetailPage({ productId }: PublicProductDetailPageProps) {
  const router = useRouter()
  const { product, isLoading, isError, error, isNotFound } = useTransformedProductDetail(productId)

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-gold-500 mx-auto mb-4" />
              <p className="text-lg text-neutral-600">Memuat detail produk...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (isError || isNotFound) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center min-h-[400px] flex items-center justify-center">
            <div>
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-neutral-900 mb-2">
                {isNotFound ? 'Produk Tidak Ditemukan' : 'Terjadi Kesalahan'}
              </h1>
              <p className="text-neutral-600 mb-6">
                {error?.message || 'Produk yang Anda cari tidak tersedia atau sudah tidak aktif.'}
              </p>
              <Button
                onClick={() => router.push('/')}
                className="bg-gold-500 hover:bg-gold-600 text-neutral-900"
              >
                <Home className="w-4 h-4 mr-2" />
                Kembali ke Beranda
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="/"
                  className="text-neutral-600 hover:text-gold-600 transition-colors"
                >
                  Beranda
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-neutral-900 font-medium">
                  {product.name}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6 text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="aspect-square rounded-xl overflow-hidden bg-neutral-100 relative">
              <Image
                src={getValidImageUrl(product.imageUrl)}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>
          </div>

          {/* Product Information */}
          <div className="space-y-6">
            {/* Product Header */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-neutral-500 font-mono">{product.code}</span>
                <Badge variant="outline" className={getStatusBadge(product.status)}>
                  {product.status}
                </Badge>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-4">
                {product.name}
              </h1>
              {product.hasDescription && (
                <p className="text-lg text-neutral-600 leading-relaxed">
                  {product.description}
                </p>
              )}
            </div>

            {/* Category and Color */}
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                style={{
                  backgroundColor: lightenColor(product.category.color, 85),
                  color: getContrastTextColor(lightenColor(product.category.color, 85)),
                  borderColor: product.category.color,
                }}
                className="font-medium"
              >
                {product.category.name}
              </Badge>

              {product.hasColor && (
                <Badge variant="outline" className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: product.color?.hexCode || '#gray' }}
                  />
                  <span>{product.color?.name}</span>
                </Badge>
              )}
            </div>

            {/* Rental Pricing */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">Informasi Sewa</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Harga Sewa per Hari:</span>
                    <span className="text-2xl font-bold text-gold-600">
                      {formatCurrency(product.rentalInfo.dailyPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Nilai Barang:</span>
                    <span className="text-lg font-medium text-neutral-900">
                      {formatCurrency(product.rentalInfo.itemValue)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Size Availability - Enhanced */}
            <SizeDetailCard
              sizes={product.sizes}
              title="Detail Ketersediaan Ukuran"
              showStats={true}
              showProgress={true}
            />

            {/* Call to Action */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  <ShoppingBag className="w-5 h-5 inline mr-2" />
                  Tertarik untuk Menyewa?
                </h3>
                <p className="text-neutral-600 mb-4">
                  Hubungi kami untuk melakukan pemesanan atau mendapatkan informasi lebih lanjut
                  tentang ketersediaan dan proses penyewaan.
                </p>
                <div className="space-y-2">
                  <Button
                    className="w-full bg-gold-500 hover:bg-gold-600 text-neutral-900 font-semibold"
                    size="lg"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Hubungi untuk Menyewa
                  </Button>
                  <p className="text-sm text-neutral-500 text-center">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Respon cepat dalam 1-2 jam
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Information */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Informasi Tambahan</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-1">
                <p className="font-medium text-neutral-700">Kondisi:</p>
                <p className="text-neutral-600">Terawat dan bersih</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-neutral-700">Pengambilan:</p>
                <p className="text-neutral-600">Di lokasi atau delivery</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-neutral-700">Durasi Minimum:</p>
                <p className="text-neutral-600">1 hari</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}