'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Heart, Star, Eye, Loader2, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTransformedFeaturedProducts } from '../hooks/usePublicProducts'
import { formatCurrency, getStatusBadge } from '@/features/manage-product/lib/utils/product'
import { lightenColor, getContrastTextColor } from '@/features/manage-product/lib/utils/color'
import { getValidImageUrl } from '@/features/manage-product/lib/utils/imageValidate'

export default function FeaturedItemsSection() {
  const [hoveredItem, setHoveredItem] = useState<number | null>(null)
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set())
  const router = useRouter()

  // Fetch featured products using custom hook
  const { data, products, isLoading, isError, error, isEmpty } = useTransformedFeaturedProducts(10)

  const toggleLike = (productId: string) => {
    const newLikedItems = new Set(likedItems)
    if (newLikedItems.has(productId)) {
      newLikedItems.delete(productId)
    } else {
      newLikedItems.add(productId)
    }
    setLikedItems(newLikedItems)
  }

  const handleProductClick = (productId: string) => {
    router.push(`/product/${productId}`)
  }

  // Loading state
  if (isLoading) {
    return (
      <section id="featured" className="py-16 md:py-24 bg-gradient-to-b from-neutral-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-gold-100 text-gold-700 rounded-full text-sm font-medium mb-4">
              <Star className="w-4 h-4 mr-2" />
              Koleksi Terpopuler
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              Pakaian Paling Diminati
            </h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
              Memuat koleksi pakaian pilihan terbaik...
            </p>
          </div>

          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
            <span className="ml-2 text-neutral-600">Memuat produk...</span>
          </div>
        </div>
      </section>
    )
  }

  // Error state
  if (isError) {
    return (
      <section id="featured" className="py-16 md:py-24 bg-gradient-to-b from-neutral-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-medium mb-4">
              <AlertCircle className="w-4 h-4 mr-2" />
              Gagal Memuat
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              Koleksi Tidak Tersedia
            </h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
              {error?.message || 'Terjadi kesalahan saat memuat koleksi pakaian. Silakan coba lagi nanti.'}
            </p>
          </div>
        </div>
      </section>
    )
  }

  // Empty state
  if (isEmpty) {
    return (
      <section id="featured" className="py-16 md:py-24 bg-gradient-to-b from-neutral-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-neutral-100 text-neutral-700 rounded-full text-sm font-medium mb-4">
              <Star className="w-4 h-4 mr-2" />
              Koleksi Kosong
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              Belum Ada Pakaian Tersedia
            </h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
              Koleksi pakaian sedang dalam proses update. Kembali lagi nanti untuk melihat pakaian terbaru.
            </p>
          </div>
        </div>
      </section>
    )
  }

  // Main render with real API data
  return (
    <section id="featured" className="py-16 md:py-24 bg-gradient-to-b from-neutral-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-gold-100 text-gold-700 rounded-full text-sm font-medium mb-4">
            <Star className="w-4 h-4 mr-2" />
            Koleksi Terpopuler
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
            {products.length} Pakaian Paling Diminati
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
            Koleksi pakaian tersedia untuk disewa dengan kualitas terbaik dan harga terjangkau
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {products.map((product, index) => {
            const isHovered = hoveredItem === index
            const isLiked = likedItems.has(product.id)

            return (
              <Card
                key={product.id}
                className="group border border-neutral-200 rounded-xl hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer bg-white overflow-hidden"
                onMouseEnter={() => setHoveredItem(index)}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleProductClick(product.id)}
              >
                <CardContent className="p-0">
                  <div className="relative">
                    <div className="aspect-square rounded-t-xl overflow-hidden bg-neutral-100 relative">
                      <Image
                        src={getValidImageUrl(product.imageUrl)}
                        alt={product.name}
                        width={300}
                        height={300}
                        className={`w-full h-full object-cover transition-all duration-500 ${
                          isHovered ? 'scale-110' : 'scale-100'
                        }`}
                      />

                      {/* Overlay on hover */}
                      <div
                        className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${
                          isHovered ? 'opacity-100' : 'opacity-0'
                        }`}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div
                            className={`bg-white rounded-full p-2 transition-all duration-300 ${
                              isHovered ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
                            }`}
                          >
                            <Eye className="w-5 h-5 text-neutral-700" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Badges - Rental Business Context */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {/* Category Badge with ProductGrid pattern */}
                      <Badge
                        variant="outline"
                        style={{
                          backgroundColor: lightenColor(product.category.color, 85),
                          color: getContrastTextColor(lightenColor(product.category.color, 85)),
                          borderColor: product.category.color,
                        }}
                        className="text-xs font-medium rounded-full"
                      >
                        {product.category.name}
                      </Badge>

                      {/* Status Badge */}
                      <Badge variant="outline" className={`text-xs ${getStatusBadge(product.status)}`}>
                        {product.status}
                      </Badge>
                    </div>

                    {/* Like Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleLike(product.id)
                      }}
                      className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                        isLiked
                          ? 'bg-gold-500 text-white'
                          : 'bg-white/80 text-neutral-600 hover:bg-white'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold text-neutral-900 text-sm leading-tight line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-xs text-gray-500 font-mono mt-1">{product.code}</p>
                    </div>

                    {/* Rental Business Info - Replace Rating */}
                    <div className="flex flex-wrap gap-1">
                      {/* Size Information */}
                      {product.sizes.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {product.displaySize}
                        </Badge>
                      )}

                      {/* Color Information */}
                      {product.hasColor && (
                        <Badge variant="outline" className="flex items-center gap-1 text-xs">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: product.color?.hexCode || '#gray' }}
                          />
                          <span>{product.color?.name}</span>
                        </Badge>
                      )}
                    </div>

                    {/* Rental Pricing - Replace E-commerce Price */}
                    <div className="space-y-1">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-neutral-600">Sewa/hari:</span>
                          <span className="text-gold-500 font-bold text-sm">
                            {formatCurrency(product.rentalInfo.dailyPrice)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-neutral-600">Nilai:</span>
                          <span className="text-xs font-medium text-neutral-700">
                            {formatCurrency(product.rentalInfo.itemValue)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="text-center mt-12">
          <button className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-neutral-900 px-8 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105 hover:shadow-lg">
            Lihat Semua Koleksi ({data?.pagination?.total || 0}+ Items)
          </button>
        </div>
      </div>
    </section>
  )
}
