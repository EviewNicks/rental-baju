'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ProductSize } from '../../types'

interface SizeSelectorProps {
  sizes: ProductSize[]
  selectedSizeId?: string
  onSizeSelect: (sizeId: string, size: ProductSize) => void
  disabled?: boolean
  className?: string
}

export function SizeSelector({
  sizes,
  selectedSizeId,
  onSizeSelect,
  disabled = false,
  className,
}: SizeSelectorProps) {
  const [hoveredSizeId, setHoveredSizeId] = useState<string | null>(null)

  // Group sizes by age category
  const sizesByCategory = sizes.reduce(
    (acc, size) => {
      if (!acc[size.ageCategory]) {
        acc[size.ageCategory] = []
      }
      acc[size.ageCategory].push(size)
      return acc
    },
    {} as Record<string, ProductSize[]>,
  )

  const ageCategoryLabels: Record<string, string> = {
    ADULT: 'Dewasa',
    TEEN: 'Remaja',
    CHILD: 'Anak',
  }

  return (
    <div className={cn('space-y-3', className)}>
      {Object.entries(sizesByCategory).map(([category, categorySizes]) => (
        <div key={category} className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              {ageCategoryLabels[category] || category}
            </span>
            <Badge variant="outline" className="text-xs">
              {categorySizes.length} ukuran
            </Badge>
          </div>

          <div className="flex flex-wrap gap-2">
            {categorySizes.map((size) => {
              const isSelected = selectedSizeId === size.id
              const isHovered = hoveredSizeId === size.id
              const isAvailable = size.availableQuantity > 0
              const isDisabled = disabled || !isAvailable

              return (
                <Button
                  key={size.id}
                  type="button"
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  disabled={isDisabled}
                  onClick={() => !isDisabled && onSizeSelect(size.id, size)}
                  onMouseEnter={() => setHoveredSizeId(size.id)}
                  onMouseLeave={() => setHoveredSizeId(null)}
                  className={cn(
                    'relative min-w-[60px] transition-all',
                    isSelected && 'ring-2 ring-blue-500 ring-offset-2 py-1',
                    !isAvailable && 'opacity-40 cursor-not-allowed',
                    isHovered && isAvailable && !isSelected && 'border-blue-400',
                  )}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="font-semibold">{size.size}</span>
                    <span className="text-xs text-muted-foreground">
                      {isAvailable ? `${size.availableQuantity} pcs` : 'Habis'}
                    </span>
                  </div>

                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </Button>
              )
            })}
          </div>
        </div>
      ))}

      {sizes.length === 0 && (
        <div className="text-sm text-gray-500 italic">
          Tidak ada ukuran tersedia untuk produk ini
        </div>
      )}
    </div>
  )
}
