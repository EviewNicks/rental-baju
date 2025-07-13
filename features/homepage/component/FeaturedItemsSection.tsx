'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Heart, Star, Eye } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

const featuredItems = [
  {
    name: 'Dress Pesta Elegant',
    category: 'Pesta',
    price: 'Rp 150.000',
    originalPrice: 'Rp 200.000',
    image: '/placeholder.svg?height=300&width=300',
    rating: 4.9,
    reviews: 45,
    isPopular: true,
  },
  {
    name: 'Kemeja Casual Premium',
    category: 'Casual',
    price: 'Rp 75.000',
    originalPrice: 'Rp 100.000',
    image: '/placeholder.svg?height=300&width=300',
    rating: 4.8,
    reviews: 32,
    isPopular: false,
  },
  {
    name: 'Kebaya Tradisional',
    category: 'Tradisional',
    price: 'Rp 200.000',
    originalPrice: 'Rp 250.000',
    image: '/placeholder.svg?height=300&width=300',
    rating: 5.0,
    reviews: 28,
    isPopular: true,
  },
  {
    name: 'Suit Formal Pria',
    category: 'Pesta',
    price: 'Rp 180.000',
    originalPrice: 'Rp 230.000',
    image: '/placeholder.svg?height=300&width=300',
    rating: 4.7,
    reviews: 38,
    isPopular: false,
  },
  {
    name: 'Blouse Casual Wanita',
    category: 'Casual',
    price: 'Rp 60.000',
    originalPrice: 'Rp 80.000',
    image: '/placeholder.svg?height=300&width=300',
    rating: 4.6,
    reviews: 25,
    isPopular: false,
  },
  {
    name: 'Batik Premium',
    category: 'Tradisional',
    price: 'Rp 120.000',
    originalPrice: 'Rp 150.000',
    image: '/placeholder.svg?height=300&width=300',
    rating: 4.9,
    reviews: 42,
    isPopular: true,
  },
  {
    name: 'Gaun Malam',
    category: 'Pesta',
    price: 'Rp 250.000',
    originalPrice: 'Rp 300.000',
    image: '/placeholder.svg?height=300&width=300',
    rating: 5.0,
    reviews: 35,
    isPopular: true,
  },
  {
    name: 'Kaos Polo Premium',
    category: 'Casual',
    price: 'Rp 45.000',
    originalPrice: 'Rp 60.000',
    image: '/placeholder.svg?height=300&width=300',
    rating: 4.5,
    reviews: 20,
    isPopular: false,
  },
  {
    name: 'Sarong Tradisional',
    category: 'Tradisional',
    price: 'Rp 80.000',
    originalPrice: 'Rp 100.000',
    image: '/placeholder.svg?height=300&width=300',
    rating: 4.8,
    reviews: 30,
    isPopular: false,
  },
  {
    name: 'Blazer Formal',
    category: 'Pesta',
    price: 'Rp 160.000',
    originalPrice: 'Rp 200.000',
    image: '/placeholder.svg?height=300&width=300',
    rating: 4.7,
    reviews: 33,
    isPopular: true,
  },
]

export default function FeaturedItemsSection() {
  const [hoveredItem, setHoveredItem] = useState<number | null>(null)
  const [likedItems, setLikedItems] = useState<Set<number>>(new Set())

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Pesta':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'Casual':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'Tradisional':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-200'
    }
  }

  const toggleLike = (index: number) => {
    const newLikedItems = new Set(likedItems)
    if (newLikedItems.has(index)) {
      newLikedItems.delete(index)
    } else {
      newLikedItems.add(index)
    }
    setLikedItems(newLikedItems)
  }

  return (
    <section id="featured" className="py-16 md:py-24 bg-gradient-to-b from-neutral-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-4">
            <Star className="w-4 h-4 mr-2" />
            Koleksi Terpopuler
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
            10 Pakaian Paling Diminati
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
            Koleksi pakaian pilihan yang paling diminati pelanggan kami dengan rating tertinggi
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {featuredItems.map((item, index) => {
            const isHovered = hoveredItem === index
            const isLiked = likedItems.has(index)

            return (
              <Card
                key={index}
                className="group border border-neutral-200 rounded-xl hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer bg-white overflow-hidden"
                onMouseEnter={() => setHoveredItem(index)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <CardContent className="p-0">
                  <div className="relative">
                    <div className="aspect-square rounded-t-xl overflow-hidden bg-neutral-100 relative">
                      <Image
                        src={item.image || '/placeholder.svg'}
                        alt={item.name}
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

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      <Badge className={`text-xs border ${getCategoryColor(item.category)}`}>
                        {item.category}
                      </Badge>
                      {item.isPopular && (
                        <Badge className="text-xs bg-red-100 text-red-700 border-red-200">
                          Popular
                        </Badge>
                      )}
                    </div>

                    {/* Like Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleLike(index)
                      }}
                      className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                        isLiked
                          ? 'bg-red-500 text-white'
                          : 'bg-white/80 text-neutral-600 hover:bg-white'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold text-neutral-900 text-sm leading-tight line-clamp-2">
                        {item.name}
                      </h3>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                      <span className="text-xs font-medium text-neutral-700">{item.rating}</span>
                      <span className="text-xs text-neutral-500">({item.reviews})</span>
                    </div>

                    {/* Price */}
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-blue-500 font-bold text-sm">{item.price}</span>
                        <span className="text-neutral-400 text-xs line-through">
                          {item.originalPrice}
                        </span>
                      </div>
                      <div className="text-xs text-green-600 font-medium">
                        Hemat{' '}
                        {Math.round(
                          (1 -
                            Number.parseInt(item.price.replace(/\D/g, '')) /
                              Number.parseInt(item.originalPrice.replace(/\D/g, ''))) *
                            100,
                        )}
                        %
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="text-center mt-12">
          <button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105 hover:shadow-lg">
            Lihat Semua Koleksi (500+ Items)
          </button>
        </div>
      </div>
    </section>
  )
}
