'use client'

import React from 'react'
import { Package, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Age category configuration (adapted from AdvancedAggregatedSizeDisplay.tsx)
const AGE_CATEGORY_CONFIG = {
  ADULT: {
    label: 'Dewasa',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
    icon: '👥',
  },
  CHILD: {
    label: 'Anak',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200',
    icon: '🧒',
  },
  UNIVERSAL: {
    label: 'Universal',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-200',
    icon: '🌟',
  },
} as const

interface SizeItem {
  size: string
  ageCategory: string // Accept string for flexibility
  quantity: number
}

interface SizeDetailCardProps {
  sizes: SizeItem[]
  title?: string
  showStats?: boolean
  showProgress?: boolean
  context?: 'public' | 'admin' // Context-aware styling
  editable?: boolean // Show edit indicators for admin
}

/**
 * Size Detail Card Component
 *
 * Displays detailed size information with age categories and quantities
 * Format: Age Category + Size + Quantity
 */
export function SizeDetailCard({
  sizes,
  title = "Detail Ketersediaan Ukuran",
  showStats = true,
  showProgress = true,
  context = 'public',
  editable = false
}: SizeDetailCardProps) {
  // Calculate statistics
  const stats = React.useMemo(() => {
    const totalQuantity = sizes.reduce((sum, size) => sum + size.quantity, 0)
    const availableSizes = sizes.filter(size => size.quantity > 0)
    const totalSizes = sizes.length

    // Group by age category
    const byCategory = sizes.reduce((acc, size) => {
      if (!acc[size.ageCategory]) {
        acc[size.ageCategory] = { count: 0, quantity: 0, sizes: [] }
      }
      acc[size.ageCategory].count += 1
      acc[size.ageCategory].quantity += size.quantity
      acc[size.ageCategory].sizes.push(size)
      return acc
    }, {} as Record<string, { count: number; quantity: number; sizes: SizeItem[] }>)

    return {
      totalQuantity,
      availableSizes: availableSizes.length,
      totalSizes,
      byCategory,
      isInStock: totalQuantity > 0,
    }
  }, [sizes])

  if (sizes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
            <Package className="w-5 h-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Tidak ada informasi ukuran tersedia untuk produk ini.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Context-aware styling
  const cardStyling = context === 'admin'
    ? 'bg-white border-gray-200'
    : 'bg-white'
  const titleStyling = context === 'admin'
    ? 'text-lg font-semibold text-gray-900 flex items-center gap-2'
    : 'text-lg font-semibold text-neutral-900 flex items-center gap-2'
  const statsBg = context === 'admin'
    ? 'bg-gray-50 border border-gray-200'
    : 'bg-neutral-50 rounded-lg'

  return (
    <Card className={cardStyling}>
      <CardHeader>
        <CardTitle className={titleStyling}>
          <Package className="w-5 h-5" />
          {title}
          {editable && context === 'admin' && (
            <span className="text-xs text-gray-500 ml-2">(Editable)</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Statistics Summary */}
        {showStats && (
          <div className={`grid grid-cols-3 gap-4 p-4 ${statsBg}`}>
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">{stats.totalSizes}</div>
              <div className="text-xs text-neutral-600">Variasi Ukuran</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">{stats.availableSizes}</div>
              <div className="text-xs text-neutral-600">Tersedia</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-purple-600">{stats.totalQuantity}</div>
              <div className="text-xs text-neutral-600">Total Stok</div>
            </div>
            {context === 'admin' && (
              <div className="col-span-3 mt-2 pt-2 border-t border-gray-200">
                <div className="text-xs text-gray-500 text-center">
                  💡 Admin: Klik edit untuk mengubah ukuran dan stok
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sizes by Age Category */}
        <div className="space-y-4">
          {Object.entries(stats.byCategory).map(([category, data]) => {
            const config = AGE_CATEGORY_CONFIG[category as keyof typeof AGE_CATEGORY_CONFIG]
            const percentage = stats.totalQuantity > 0 ? Math.round((data.quantity / stats.totalQuantity) * 100) : 0

            return (
              <div key={category} className="border rounded-lg p-4">
                {/* Category Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{config.icon}</span>
                    <span className={`font-semibold ${config.color}`}>
                      {config.label}
                    </span>
                    <Badge variant="outline" className={`text-xs ${config.bgColor} ${config.borderColor} ${config.color}`}>
                      {data.count} ukuran
                    </Badge>
                  </div>
                  <div className="text-sm text-neutral-600">
                    {data.quantity} pcs ({percentage}%)
                  </div>
                </div>

                {/* Progress Bar */}
                {showProgress && (
                  <div className="mb-3">
                    <Progress value={percentage} className="h-2" />
                  </div>
                )}

                {/* Sizes List */}
                <div className="space-y-2">
                  {data.sizes.map((size, index) => (
                    <div
                      key={index}
                      className={`flex justify-between items-center p-3 rounded-lg border ${
                        size.quantity > 0
                          ? config.bgColor + ' ' + config.borderColor
                          : 'bg-gray-50 border-gray-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {config.label} - Size {size.size}
                        </span>
                        {size.quantity > 0 ? (
                          <CheckCircle className="w-3 h-3 text-green-600" />
                        ) : (
                          <XCircle className="w-3 h-3 text-red-500" />
                        )}
                      </div>
                      <Badge
                        variant={size.quantity > 0 ? "secondary" : "outline"}
                        className={size.quantity > 0 ? "text-xs" : "text-xs text-gray-500"}
                      >
                        {size.quantity} pcs
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Stock Status Summary */}
        <div className={`text-center p-4 ${statsBg}`}>
          {stats.isInStock ? (
            <div className="flex items-center justify-center gap-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">
                Tersedia {stats.totalQuantity} item dalam stok
              </span>
              {context === 'admin' && (
                <span className="text-xs text-gray-500 ml-2">
                  (Kelola di edit produk)
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-red-600">
              <XCircle className="w-4 h-4" />
              <span className="font-medium">
                Stok habis - semua ukuran tidak tersedia
              </span>
              {context === 'admin' && (
                <span className="text-xs text-gray-500 ml-2">
                  (Perlu restock segera)
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}