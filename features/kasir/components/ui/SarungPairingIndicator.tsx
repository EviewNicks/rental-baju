'use client'

import { ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '../../lib/utils/client'
import { cn } from '@/lib/utils'

interface SarungPairingIndicatorProps {
  jasName: string
  sarungName: string
  sarungOriginalPrice?: number
  className?: string
  variant?: 'cart' | 'payment' | 'compact'
  showPricing?: boolean
}

export function SarungPairingIndicator({
  jasName,
  sarungName,
  sarungOriginalPrice = 0,
  className,
  variant = 'cart',
  showPricing = true,
}: SarungPairingIndicatorProps) {
  const renderContent = () => {
    switch (variant) {
      case 'compact':
        return (
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-gray-900">{jasName}</span>
            <ArrowRight className="h-3 w-3 text-gray-400" />
            <span className="text-gray-600">dengan {sarungName}</span>
            {showPricing && (
              <Badge className="bg-green-100 text-green-800 text-xs">GRATIS</Badge>
            )}
          </div>
        )

      case 'payment':
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{jasName}</span>
                <ArrowRight className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">dengan {sarungName}</span>
              </div>
              {showPricing && sarungOriginalPrice > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 line-through">
                    {formatCurrency(sarungOriginalPrice)}
                  </span>
                  <Badge className="bg-green-100 text-green-800">GRATIS</Badge>
                </div>
              )}
            </div>
          </div>
        )

      default: // cart
        return (
          <div className="space-y-1">
            {/* Clean, minimal display - just show the product name */}
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{jasName}</span>
            </div>
            {/* No redundant badge - the green text below will indicate pairing */}
          </div>
        )
    }
  }

  return (
    <div
      className={cn(
        // Default styling for payment and compact variants
        variant !== 'cart' && 'rounded-lg border border-gray-200 bg-gradient-to-r from-blue-50 to-green-50 p-3',
        // Minimal styling for cart variant - no background, no border, no padding
        variant === 'cart' && '',
        variant === 'compact' && 'p-2 bg-gray-50 border-gray-100',
        variant === 'payment' && 'bg-gradient-to-r from-green-50 to-yellow-50 border-green-200',
        className,
      )}
      role="region"
      aria-label={`Pairing jas ${jasName} dengan sarung ${sarungName}`}
    >
      {renderContent()}
    </div>
  )
}

// Utility component for displaying pairing in different contexts
export function PairingBadge({
  sarungName,
  className,
}: {
  sarungName: string
  className?: string
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'bg-blue-50 text-blue-700 border-blue-200',
        'flex items-center gap-1',
        className,
      )}
    >
      <ArrowRight className="h-3 w-3" />
      dengan {sarungName}
    </Badge>
  )
}

// Utility component for showing free sarung pricing
export function FreeSarungBadge({
  originalPrice,
  className,
}: {
  originalPrice?: number
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {originalPrice && originalPrice > 0 && (
        <span className="text-sm text-gray-500 line-through">
          {formatCurrency(originalPrice)}
        </span>
      )}
      <Badge className="bg-green-100 text-green-800">GRATIS</Badge>
    </div>
  )
}