'use client'

import { useState } from 'react'
import { Plus, Minus, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Product } from '../../types/product'
import { formatCurrency } from '../../lib/utils'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface ProductCardProps {
  product: Product
  onAddToCart: (product: Product, quantity: number) => void
  selectedQuantity?: number
  className?: string
}

export function ProductCard({
  product,
  onAddToCart,
  selectedQuantity = 0,
  className,
}: ProductCardProps) {
  const [quantity, setQuantity] = useState(selectedQuantity)

  const handleAddToCart = () => {
    if (quantity > 0) {
      onAddToCart(product, quantity)
    }
  }

  const incrementQuantity = () => {
    setQuantity((prev) => prev + 1)
  }

  const decrementQuantity = () => {
    setQuantity((prev) => Math.max(0, prev - 1))
  }

  return (
    <div
      className={cn(
        'bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 overflow-hidden',
        'shadow-lg shadow-gray-900/5 transition-all duration-200',
        'hover:shadow-xl hover:shadow-gray-900/10 hover:-translate-y-1',
        !product.available && 'opacity-60',
        className,
      )}
    >
      {/* Product Image */}
      <div className="relative aspect-square">
        <Image
          src={product.image || '/placeholder.svg'}
          alt={product.name}
          width={200}
          height={200}
          className="w-full h-full object-cover"
        />
        {!product.available && (
          <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
            <Badge variant="secondary" className="bg-red-500 text-white">
              Tidak Tersedia
            </Badge>
          </div>
        )}
        {selectedQuantity > 0 && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-yellow-400 text-gray-900">{selectedQuantity}x</Badge>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">{product.name}</h3>
          <p className="text-xs text-gray-600 mt-1">{product.description}</p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {product.size}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {product.color}
          </Badge>
          <Badge variant="outline" className="text-xs capitalize">
            {product.category}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-900">
            {formatCurrency(product.pricePerDay)}/hari
          </div>
        </div>

        {/* Quantity Controls */}
        {product.available && (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={decrementQuantity}
                disabled={quantity === 0}
                className="h-8 w-8 p-0 bg-transparent"
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="text-sm font-medium w-8 text-center">{quantity}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={incrementQuantity}
                className="h-8 w-8 p-0 bg-transparent"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            <Button
              onClick={handleAddToCart}
              disabled={quantity === 0}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm"
              size="sm"
            >
              <ShoppingCart className="h-3 w-3 mr-2" />
              Tambah ke Keranjang
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
