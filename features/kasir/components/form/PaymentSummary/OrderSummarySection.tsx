'use client'

import { useMemo } from 'react'
import { ShoppingBag } from 'lucide-react'
import type { ProductSelection, Customer } from '../../../types'
import { formatCurrency } from '../../../lib/utils/client'
import { PriceCalculator } from '../../../lib/utils/priceCalculator'
import { SarungPairingIndicator } from '../../ui/SarungPairingIndicator'
import { isLinkedSarung } from '../../../lib/utils/jasSarungUtils'
import Image from 'next/image'

// Helper function to generate unique keys for ProductSelection items
const generateProductKey = (item: ProductSelection, index: number): string => {
  const baseKey = `${item.product.id}-${item.productSizeId || 'default'}`
  
  if (item.linkedSarung) {
    const sarungId = item.linkedSarung.productId
    const sarungSizeId = item.linkedSarung.productSizeId || 'default'
    return `${baseKey}-linked-${sarungId}-${sarungSizeId}`
  }
  
  return `${baseKey}-${index}`
}

interface OrderSummarySectionProps {
  customer: Customer | null
  products: ProductSelection[]
  duration: number
  discountType: 'percent' | 'nominal' | null
  discountValue: number | null
}

export function OrderSummarySection({
  customer,
  products,
  duration,
  discountType,
  discountValue,
}: OrderSummarySectionProps) {
  const priceCalculation = useMemo(() => {
    return PriceCalculator.calculateTransactionTotalWithEnhancements({
      items: products,
      duration: (duration || 4) as 4 | 7,
      discountType: discountType,
      discountValue: discountValue,
    })
  }, [products, duration, discountType, discountValue])

  return (
    <div
      className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6 space-y-6"
      data-testid="order-summary-section"
    >
      <div className="flex items-center gap-2 text-xl font-bold text-gray-900">
        <ShoppingBag className="h-6 w-6" />
        Ringkasan Pesanan
      </div>

      {/* Customer Info */}
      {customer && (
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="text-sm font-medium text-gray-700 mb-3">Penyewa</div>
          <div className="text-lg font-semibold text-gray-900">{customer.name}</div>
          <div className="text-sm text-gray-600">{customer.phone}</div>
          <div className="text-sm text-gray-600">{customer.address}</div>
        </div>
      )}

      {/* Products List */}
      <div className="space-y-4">
        <div className="text-sm font-medium text-gray-700">Produk yang Disewa</div>
        {products.map((item, index) => {
          const selectedSize = item.productSizeId
            ? item.product.sizes?.find((s) => s.id === item.productSizeId)
            : null

          const itemCalculation = priceCalculation.itemCalculations[index]
          const basePrice = item.product.pricePerDay * item.quantity
          const adjustedPrice = itemCalculation?.adjustedPrice || basePrice

          // Check if this is a linked sarung (should be free)
          const isItemLinkedSarung = isLinkedSarung(
            item.product.id,
            item.productSizeId,
            products
          )

          return (
            <div
              key={generateProductKey(item, index)}
              className="flex items-center justify-between py-4 border-b border-gray-200 last:border-b-0"
            >
              <div className="flex items-center gap-4">
                <Image
                  src={
                    item.product.image?.startsWith('/') || item.product.image?.startsWith('http')
                      ? item.product.image || '/placeholder.svg'
                      : `/${item.product.image || 'placeholder.svg'}`
                  }
                  alt={item.product.name}
                  width={200}
                  height={200}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  {/* Show pairing indicator for jas products with linked sarung */}
                  {item.linkedSarung ? (
                    <div className="space-y-2">
                      <SarungPairingIndicator
                        jasName={item.product.name}
                        sarungName={item.linkedSarung.product?.code || item.linkedSarung.product?.name || `Sarung ${item.linkedSarung.selectedSize?.size || 'Universal'}`}
                        sarungOriginalPrice={0} // Will be calculated from product data
                        variant="payment"
                        showPricing={false} // Don't show pricing here, will show in breakdown
                      />
                    </div>
                  ) : isItemLinkedSarung ? (
                    <div className="space-y-1">
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        {item.product.name}
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                          GRATIS
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="font-semibold text-gray-900">{item.product.name}</div>
                  )}
                  <div className="text-sm text-gray-600">
                    {selectedSize ? (
                      <>
                        {selectedSize.ageCategory} • {selectedSize.size} •{' '}
                      </>
                    ) : (
                      <>
                        {item.product.size} • {item.product.color} •{' '}
                      </>
                    )}
                    {!isItemLinkedSarung && (
                      <>
                        {formatCurrency(item.product.pricePerDay)}/{duration} hari
                        {duration === 7 && (
                          <span className="text-orange-600 font-medium"> (+50%)</span>
                        )}
                      </>
                    )}
                    {isItemLinkedSarung && (
                      <span className="text-green-600 font-medium">Gratis dengan jas</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                {isItemLinkedSarung ? (
                  <div className="space-y-1">
                    <div className="font-semibold text-green-600">
                      GRATIS
                    </div>
                    <div className="text-sm text-gray-600">
                      {item.quantity}x × {duration} hari
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="font-semibold text-gray-900">
                      {formatCurrency(adjustedPrice)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {item.quantity}x × {duration} hari
                    </div>
                    {duration === 7 && basePrice !== adjustedPrice && (
                      <div className="text-xs text-orange-600">
                        Base: {formatCurrency(basePrice)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}