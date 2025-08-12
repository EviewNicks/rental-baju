'use client'

import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Product } from '@/features/manage-product/types'
import { getStatusBadge, formatCurrency } from '@/features/manage-product/lib/utils/product'
import { lightenColor } from '../../lib/utils/color'
import { getContrastTextColor } from '../../lib/utils/color'
import { getValidImageUrl } from '../../lib/utils/imageValidate'

interface ProductGridProps {
  products: Product[]
  onProductClick: (product: Product) => void
}

export function ProductGrid({ products, onProductClick }: ProductGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <Card
          key={product.id}
          className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer py-0"
          onClick={() => onProductClick(product)}
        >
          <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
            <Image
              src={getValidImageUrl(product.imageUrl)}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            />
          </div>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-xs font-mono text-gray-500">{product.code}</span>
                <Badge variant="outline" className={getStatusBadge(product.status)}>
                  {product.status}
                </Badge>
              </div>
              <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
              <div className="flex flex-wrap gap-1">
                <Badge
                  variant="outline"
                  style={{
                    backgroundColor: lightenColor(product.category.color, 85),
                    color: getContrastTextColor(lightenColor(product.category.color, 85)),
                    borderColor: product.category.color,
                  }}
                  className="font-medium rounded-full"
                >
                  {product.category.name}
                </Badge>
                {product.size && (
                  <Badge variant="outline" className="font-mono text-xs">
                    {product.size}
                  </Badge>
                )}
                {product.color && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: product.color.hexCode || '#gray' }}
                    />
                    <span className="text-xs">{product.color.name}</span>
                  </Badge>
                )}
              </div>
              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Harga Sewa:</span>
                  <span className="font-medium">{formatCurrency(Number(product.currentPrice))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pendapatan:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(Number(product.totalPendapatan))}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
