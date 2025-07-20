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
          <div className="aspect-square bg-gray-100">
            <Image
              src={getValidImageUrl(product.imageUrl)}
              alt={product.name}
              width={200}
              height={200}
              className="w-full h-full object-cover"
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
              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Harga Sewa:</span>
                  <span className="font-medium">{formatCurrency(Number(product.hargaSewa))}</span>
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
