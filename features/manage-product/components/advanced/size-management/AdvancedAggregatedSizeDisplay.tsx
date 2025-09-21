'use client'

import { useMemo } from 'react'
import {
  BarChart3,
  TrendingUp,
  Users,
  Package,
  Target,
  AlertCircle,
  CheckCircle,
  Info,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type {
  AdvancedAggregatedSizeView,
  AgeCategory,
  SizeEnum,
} from '@/features/manage-product/types/advanced'

// Age category display configuration
const AGE_CATEGORY_CONFIG: Record<AgeCategory, {
  label: string
  color: string
  bgColor: string
  icon: string
}> = {
  ADULT: {
    label: 'Dewasa',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: '👥',
  },
  CHILD: {
    label: 'Anak',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: '🧒',
  },
  UNIVERSAL: {
    label: 'Universal',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    icon: '🌟',
  },
}

// Business insights interface
interface BusinessInsights {
  uniqueAgeCategories: number
  uniqueSizes: number
  totalQuantity: number
  complexityScore: number
  businessValue: 'basic' | 'intermediate' | 'advanced' | 'enterprise'
  canTrackByAgeCategory: boolean
  canTrackBySpecificSize: boolean
}

interface AdvancedAggregatedSizeDisplayProps {
  aggregatedSizes: AdvancedAggregatedSizeView[]
  businessInsights?: BusinessInsights | null
  showBreakdown?: boolean
  showBusinessValue?: boolean
  showRecommendations?: boolean
}

/**
 * Advanced Aggregated Size Display Component
 *
 * Provides visual representation of aggregated size data with:
 * - Size-wise totals and breakdowns
 * - Age category distribution
 * - Business insights and capabilities
 * - Performance recommendations
 */
export function AdvancedAggregatedSizeDisplay({
  aggregatedSizes,
  businessInsights,
  showBreakdown = true,
  showBusinessValue = true,
  showRecommendations = true,
}: AdvancedAggregatedSizeDisplayProps) {
  // Calculate overall statistics
  const overallStats = useMemo(() => {
    const totalQuantity = aggregatedSizes.reduce((sum, size) => sum + size.totalQuantity, 0)
    const totalSizes = aggregatedSizes.length
    const averageQuantityPerSize = totalSizes > 0 ? Math.round(totalQuantity / totalSizes) : 0

    // Calculate age category distribution
    const categoryTotals: Record<AgeCategory, number> = { ADULT: 0, CHILD: 0, UNIVERSAL: 0 }
    aggregatedSizes.forEach(size => {
      Object.entries(size.breakdown).forEach(([category, quantity]) => {
        if (quantity > 0) {
          categoryTotals[category as AgeCategory] += quantity
        }
      })
    })

    const categoryPercentages: Record<AgeCategory, number> = {
      ADULT: totalQuantity > 0 ? Math.round((categoryTotals.ADULT / totalQuantity) * 100) : 0,
      CHILD: totalQuantity > 0 ? Math.round((categoryTotals.CHILD / totalQuantity) * 100) : 0,
      UNIVERSAL: totalQuantity > 0 ? Math.round((categoryTotals.UNIVERSAL / totalQuantity) * 100) : 0,
    }

    return {
      totalQuantity,
      totalSizes,
      averageQuantityPerSize,
      categoryTotals,
      categoryPercentages,
    }
  }, [aggregatedSizes])

  // Generate recommendations based on current state
  const recommendations = useMemo(() => {
    if (!showRecommendations || !businessInsights) return []

    const recommendations: Array<{ type: 'info' | 'warning' | 'success'; message: string }> = []

    // Size variety recommendations
    if (businessInsights.uniqueSizes < 3) {
      recommendations.push({
        type: 'info',
        message: 'Pertimbangkan menambah variasi ukuran untuk melayani kebutuhan pelanggan yang lebih beragam.',
      })
    }

    // Age category recommendations
    if (businessInsights.uniqueAgeCategories === 1) {
      recommendations.push({
        type: 'warning',
        message: 'Menambahkan kategori umur lain dapat meningkatkan segmentasi dan analisis bisnis.',
      })
    }

    // Business value recommendations
    if (businessInsights.businessValue === 'basic') {
      recommendations.push({
        type: 'info',
        message: 'Tingkatkan kompleksitas ukuran untuk kemampuan analisis bisnis yang lebih mendalam.',
      })
    } else if (businessInsights.businessValue === 'enterprise') {
      recommendations.push({
        type: 'success',
        message: 'Excellent! Produk memiliki kemampuan analisis bisnis tingkat enterprise.',
      })
    }

    // Stock distribution recommendations
    if (overallStats.averageQuantityPerSize < 2) {
      recommendations.push({
        type: 'warning',
        message: 'Rata-rata stok per ukuran rendah. Pertimbangkan meningkatkan kuantitas untuk availability yang lebih baik.',
      })
    }

    return recommendations
  }, [businessInsights, overallStats, showRecommendations])

  if (aggregatedSizes.length === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Tidak ada data agregasi ukuran untuk ditampilkan.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overall Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Ringkasan Agregasi</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{overallStats.totalSizes}</div>
              <div className="text-sm text-muted-foreground">Variasi Ukuran</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{overallStats.totalQuantity}</div>
              <div className="text-sm text-muted-foreground">Total Kuantitas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{overallStats.averageQuantityPerSize}</div>
              <div className="text-sm text-muted-foreground">Rata-rata/Ukuran</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Object.values(overallStats.categoryTotals).filter(count => count > 0).length}
              </div>
              <div className="text-sm text-muted-foreground">Kategori Aktif</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Size Breakdown */}
      {showBreakdown && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center space-x-2">
              <Package className="w-4 h-4" />
              <span>Breakdown per Ukuran</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {aggregatedSizes.map((sizeData, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="text-lg font-mono px-3 py-1">
                        {sizeData.size}
                      </Badge>
                      <span className="font-semibold">{sizeData.totalQuantity} pcs total</span>
                      {sizeData.hasMultipleCategories && (
                        <Badge variant="secondary" className="text-xs">
                          Multi-kategori
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Tersedia: {sizeData.availableForRental} pcs
                    </div>
                  </div>

                  {/* Age Category Breakdown */}
                  <div className="space-y-2">
                    {Object.entries(sizeData.breakdown).map(([category, quantity]) => {
                      if (quantity === 0) return null

                      const categoryConfig = AGE_CATEGORY_CONFIG[category as AgeCategory]
                      const percentage = Math.round((quantity / sizeData.totalQuantity) * 100)

                      return (
                        <div key={category} className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2 min-w-[100px]">
                            <span className="text-lg">{categoryConfig.icon}</span>
                            <span className={`text-sm font-medium ${categoryConfig.color}`}>
                              {categoryConfig.label}
                            </span>
                          </div>
                          <div className="flex-1">
                            <Progress
                              value={percentage}
                              className="h-2"
                            />
                          </div>
                          <div className="text-sm font-medium min-w-[60px] text-right">
                            {quantity} pcs ({percentage}%)
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Age Category Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Distribusi Kategori Umur</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(overallStats.categoryTotals).map(([category, total]) => {
              if (total === 0) return null

              const categoryConfig = AGE_CATEGORY_CONFIG[category as AgeCategory]
              const percentage = overallStats.categoryPercentages[category as AgeCategory]

              return (
                <div key={category} className="flex items-center space-x-4">
                  <div className={`flex items-center space-x-2 min-w-[120px] p-2 rounded-lg ${categoryConfig.bgColor}`}>
                    <span className="text-lg">{categoryConfig.icon}</span>
                    <span className={`font-medium ${categoryConfig.color}`}>
                      {categoryConfig.label}
                    </span>
                  </div>
                  <div className="flex-1">
                    <Progress value={percentage} className="h-3" />
                  </div>
                  <div className="text-sm font-medium min-w-[80px] text-right">
                    {total} pcs ({percentage}%)
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Business Value Assessment */}
      {showBusinessValue && businessInsights && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center space-x-2">
              <Target className="w-4 h-4" />
              <span>Penilaian Nilai Bisnis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Business Value Level */}
              <div className="space-y-3">
                <h4 className="font-medium">Level Bisnis</h4>
                <div className="flex items-center space-x-3">
                  <Badge
                    variant={businessInsights.businessValue === 'enterprise' ? 'default' :
                            businessInsights.businessValue === 'advanced' ? 'secondary' : 'outline'}
                    className="capitalize"
                  >
                    {businessInsights.businessValue}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Skor Kompleksitas: {businessInsights.complexityScore}/10
                  </span>
                </div>
              </div>

              {/* Capabilities */}
              <div className="space-y-3">
                <h4 className="font-medium">Kemampuan Tracking</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    {businessInsights.canTrackByAgeCategory ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                    )}
                    <span className="text-sm">Tracking berdasarkan kategori umur</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {businessInsights.canTrackBySpecificSize ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                    )}
                    <span className="text-sm">Tracking berdasarkan ukuran spesifik</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Rekomendasi Peningkatan</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <Alert key={index} variant={rec.type === 'warning' ? 'destructive' : 'default'}>
                  {rec.type === 'success' && <CheckCircle className="h-4 w-4" />}
                  {rec.type === 'warning' && <AlertCircle className="h-4 w-4" />}
                  {rec.type === 'info' && <Info className="h-4 w-4" />}
                  <AlertDescription>{rec.message}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export type { AdvancedAggregatedSizeDisplayProps, BusinessInsights }