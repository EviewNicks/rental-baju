'use client'

import type React from 'react'
import type { Product } from '@/features/manage-product/types'
import { EnhancedBasicInfoCard } from './ProductInfoCards'

interface ProductInfoSectionProps {
  product: Product
  className?: string
}

export function ProductInfoSection({ product, className }: ProductInfoSectionProps) {
  return (
    <div className={className}>
      {/* Enhanced Basic Info Only - Supporting cards moved to ProductDetailPage */}
      <EnhancedBasicInfoCard product={product} />
    </div>
  )
}
