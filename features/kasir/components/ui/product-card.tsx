'use client'

import { useState } from 'react'
import { Plus, Minus, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Product, ProductSize } from '../../types'
import { formatCurrency } from '../../lib/utils/client'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { SizeSelector } from './size-selector'
import { sarungPairingService } from '../../services/pairingService'

interface ProductCardProps {
  product: Product
  onAddToCart: (product: Product, quantity: number, productSizeId?: string) => void
  selectedQuantity?: number
  className?: string
  onOpenHistory?: (
    productSizeId: string,
    productName: string,
    size: string,
    ageCategory: string,
  ) => void
  // NEW: Context awareness for different behaviors
  context?: 'main-grid' | 'sarung-modal'
  // NEW: Override button text for specific contexts
  buttonTextOverride?: string
  // NEW: Override badge display for specific contexts
  showCustomBadge?: { text: string; className?: string }
}

export function ProductCard({
  product,
  onAddToCart,
  selectedQuantity = 0,
  className,
  onOpenHistory,
  context = 'main-grid',
  buttonTextOverride,
  showCustomBadge,
}: ProductCardProps) {
  const [quantity, setQuantity] = useState(selectedQuantity)
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null)

  // Check if product has size-aware inventory
  const hasSizes = (product.sizes?.length ?? 0) > 0

  // Quantity validation - check against original quantity (total physical stock)
  const isQuantityAvailable = (requestedQuantity: number) => {
    if (hasSizes && selectedSize) {
      return (selectedSize.originalQuantity ?? 0) >= requestedQuantity
    }
    // For products without sizes, use first size's originalQuantity or fallback to availableQuantity
    const totalStock = product.sizes?.[0]?.originalQuantity ?? product.availableQuantity ?? 0
    return totalStock >= requestedQuantity
  }

  const handleSizeSelect = (sizeId: string, size: ProductSize) => {
    setSelectedSize(size)
    setQuantity(0)
  }

  const handleAddToCart = () => {
    if (quantity > 0 && isQuantityAvailable(quantity)) {
      if (hasSizes && selectedSize) {
        onAddToCart(product, quantity, selectedSize.id)
      } else {
        onAddToCart(product, quantity)
      }
    }
  }

  // Check if this is a product eligible for free sarung for special handling
  const isEligible = sarungPairingService.isEligibleForPairing(product)

  // Get appropriate button text based on product type and context
  const getButtonText = () => {
    // Use override if provided (for specific contexts like sarung modal)
    if (buttonTextOverride) {
      return quantity === 0 ? buttonTextOverride : `${buttonTextOverride} ${quantity}`
    }

    // Context-specific behavior
    if (context === 'sarung-modal') {
      // In sarung modal, all products should show selection text
      return quantity === 0 ? 'Pilih Sarung' : `Pilih ${quantity} Sarung`
    }

    // Default main-grid behavior
    return sarungPairingService.getButtonText(product, quantity)
  }

  const incrementQuantity = () => {
    const newQuantity = quantity + 1
    if (isQuantityAvailable(newQuantity)) {
      setQuantity(newQuantity)
    }
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
        className,
      )}
    >
      {/* Product Image */}
      <div className="relative aspect-square">
        <Image
          src={
            product.image?.startsWith('/') || product.image?.startsWith('http')
              ? product.image || '/products/image.png'
              : `/${product.image || 'products/image.png'}`
          }
          alt={product.name}
          width={200}
          height={200}
          className="w-full h-full object-cover"
        />
        {selectedQuantity > 0 && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-yellow-400 text-gray-900">{selectedQuantity}x</Badge>
          </div>
        )}
        {/* Context-aware badge display */}
        {showCustomBadge ? (
          <div className="absolute bottom-2 left-2">
            <Badge className={showCustomBadge.className || 'bg-green-500 text-white text-xs'}>
              {showCustomBadge.text}
            </Badge>
          </div>
        ) : (
          isEligible &&
          context === 'main-grid' && (
            <div className="absolute bottom-2 left-2">
              <Badge className="bg-blue-500 text-white text-xs">
                {sarungPairingService.getBadgeText()}
              </Badge>
            </div>
          )
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 space-y-2">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 text-sm flex-1">{product.name}</h3>
            {/* Product Code Display */}
            {product.code && (
              <Badge
                variant="outline"
                className="text-xs font-mono bg-gray-50 text-gray-700 border-gray-300 shrink-0"
                title={`Kode Produk: ${product.code}`}
              >
                {product.code}
              </Badge>
            )}
          </div>
          <div className="text-sm font-semibold text-gray-900">
            {formatCurrency(product.pricePerDay)}/4 hari
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
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

        {/* Size Selection - RPK-51 & RPK-52 (Category Type Aware) */}
        {hasSizes && product.sizes && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">
              {product.categoryType === 'accessories_age_based'
                ? 'Pilih Kategori Umur:'
                : product.categoryType === 'accessories_universal'
                  ? 'Jumlah:'
                  : 'Pilih Ukuran:'}
            </h4>
            <SizeSelector
              sizes={product.sizes}
              selectedSizeId={selectedSize?.id}
              onSizeSelect={handleSizeSelect}
              disabled={false}
              productName={product.name}
              onOpenHistory={onOpenHistory}
            />
          </div>
        )}

        {/* Quantity Controls */}
        <div className="space-y-2">

          {/* Show quantity controls only if no sizes OR size is selected */}
          {(!hasSizes || selectedSize) && (
            <>
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
                  disabled={!isQuantityAvailable(quantity + 1)}
                  className="h-8 w-8 p-0 bg-transparent"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              <Button
                onClick={handleAddToCart}
                disabled={
                  quantity === 0 || !isQuantityAvailable(quantity) || (hasSizes && !selectedSize)
                }
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm"
                size="sm"
              >
                <ShoppingCart className="h-3 w-3 mr-2" />
                {getButtonText()}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
