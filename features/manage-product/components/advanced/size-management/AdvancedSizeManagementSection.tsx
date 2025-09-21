'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  Plus,
  Trash2,
  AlertTriangle,
  Package,
  Users,
  BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AdvancedAggregatedSizeDisplay } from './AdvancedAggregatedSizeDisplay'
import type {
  CreateAdvancedProductSizeRequest,
  AdvancedAggregatedSizeView,
  AgeCategory,
  SizeEnum,
} from '@/features/manage-product/types/advanced'
import { logger } from '@/services/logger'

// Component logger
const sizeLogger = logger.child('AdvancedSizeManagementSection')

// Age category options with labels
const AGE_CATEGORY_OPTIONS: Array<{ value: AgeCategory; label: string; description: string }> = [
  { value: 'UNIVERSAL', label: 'Universal', description: 'Cocok untuk semua umur' },
  { value: 'ADULT', label: 'Dewasa', description: 'Khusus untuk orang dewasa' },
  { value: 'CHILD', label: 'Anak', description: 'Khusus untuk anak-anak' },
]

// Size options
const SIZE_OPTIONS: Array<{ value: SizeEnum; label: string }> = [
  { value: 'XS', label: 'Extra Small (XS)' },
  { value: 'S', label: 'Small (S)' },
  { value: 'M', label: 'Medium (M)' },
  { value: 'L', label: 'Large (L)' },
  { value: 'XL', label: 'Extra Large (XL)' },
  { value: 'XXL', label: 'Double Extra Large (XXL)' },
]

interface AdvancedSizeManagementSectionProps {
  // Product ID for aggregation data (edit mode)
  productId?: string

  // Size data
  sizes: CreateAdvancedProductSizeRequest[]
  onSizesChange: (sizes: CreateAdvancedProductSizeRequest[]) => void

  // Aggregation data (optional)
  onAggregatedSizesChange?: (sizes: AdvancedAggregatedSizeView[]) => void

  // Validation
  errors?: { [key: string]: string | null }
  touched?: { [key: string]: boolean }

  // Required flag
  required?: boolean

  // Display options
  showAggregation?: boolean
  showBusinessInsights?: boolean
}

/**
 * Advanced Size Management Section
 *
 * Clean, advanced-only size management component that:
 * - Enforces REQUIRED sizes (minimum 1)
 * - Prevents duplicate size+ageCategory combinations
 * - Provides real-time aggregation display
 * - Integrates with advanced validation schemas
 */
export function AdvancedSizeManagementSection({
  productId,
  sizes,
  onSizesChange,
  onAggregatedSizesChange,
  errors,
  touched,
  required = true,
  showAggregation = true,
  showBusinessInsights = true,
}: AdvancedSizeManagementSectionProps) {
  // Form state for adding new sizes
  const [selectedSize, setSelectedSize] = useState<SizeEnum>('M')
  const [selectedAgeCategory, setSelectedAgeCategory] = useState<AgeCategory>('UNIVERSAL')
  const [quantity, setQuantity] = useState<number>(1)

  // Calculate aggregated sizes for display
  const aggregatedSizes = useMemo(() => {
    if (!showAggregation || sizes.length === 0) return []

    const sizeGroups = new Map<SizeEnum, {
      totalQuantity: number
      breakdown: Record<AgeCategory, number>
      hasMultipleCategories: boolean
    }>()

    // Group sizes by size enum
    sizes.forEach(size => {
      if (!sizeGroups.has(size.size)) {
        sizeGroups.set(size.size, {
          totalQuantity: 0,
          breakdown: { ADULT: 0, CHILD: 0, UNIVERSAL: 0 },
          hasMultipleCategories: false,
        })
      }

      const group = sizeGroups.get(size.size)!
      group.totalQuantity += size.quantity
      group.breakdown[size.ageCategory] += size.quantity
    })

    // Calculate if each size has multiple categories
    sizeGroups.forEach((group) => {
      const nonZeroCategories = Object.values(group.breakdown).filter(count => count > 0).length
      group.hasMultipleCategories = nonZeroCategories > 1
    })

    // Convert to aggregated view format
    const aggregated: AdvancedAggregatedSizeView[] = Array.from(sizeGroups.entries()).map(([size, data]) => ({
      size,
      totalQuantity: data.totalQuantity,
      breakdown: data.breakdown,
      hasMultipleCategories: data.hasMultipleCategories,
      availableForRental: data.totalQuantity, // TODO: subtract rented quantities
    }))

    // Notify parent of aggregation changes
    if (onAggregatedSizesChange) {
      onAggregatedSizesChange(aggregated)
    }

    return aggregated
  }, [sizes, showAggregation, onAggregatedSizesChange])

  // Business insights calculation
  const businessInsights = useMemo(() => {
    if (!showBusinessInsights) return null

    const uniqueAgeCategories = new Set(sizes.map(s => s.ageCategory)).size
    const uniqueSizes = new Set(sizes.map(s => s.size)).size
    const totalQuantity = sizes.reduce((sum, s) => sum + s.quantity, 0)

    const complexityScore = Math.min(10, (uniqueAgeCategories * 2) + (uniqueSizes * 1.5) + (sizes.length * 0.5))

    let businessValue: 'basic' | 'intermediate' | 'advanced' | 'enterprise' = 'basic'
    if (complexityScore >= 8) businessValue = 'enterprise'
    else if (complexityScore >= 6) businessValue = 'advanced'
    else if (complexityScore >= 4) businessValue = 'intermediate'

    return {
      uniqueAgeCategories,
      uniqueSizes,
      totalQuantity,
      complexityScore: Math.round(complexityScore * 10) / 10,
      businessValue,
      canTrackByAgeCategory: uniqueAgeCategories > 1,
      canTrackBySpecificSize: uniqueSizes > 1,
    }
  }, [sizes, showBusinessInsights])

  // Validation for new size entry
  const canAddSize = useCallback(() => {
    // Check for duplicate combination
    const isDuplicate = sizes.some(s =>
      s.size === selectedSize && s.ageCategory === selectedAgeCategory
    )

    return !isDuplicate && quantity > 0
  }, [sizes, selectedSize, selectedAgeCategory, quantity])

  // Add new size
  const handleAddSize = useCallback(() => {
    if (!canAddSize()) {
      sizeLogger.warn('Cannot add size - validation failed', {
        selectedSize,
        selectedAgeCategory,
        quantity,
        isDuplicate: sizes.some(s => s.size === selectedSize && s.ageCategory === selectedAgeCategory),
      })
      return
    }

    const newSize: CreateAdvancedProductSizeRequest = {
      size: selectedSize,
      ageCategory: selectedAgeCategory,
      quantity,
      isActive: true,
    }

    const updatedSizes = [...sizes, newSize]
    onSizesChange(updatedSizes)

    // Reset form for next entry
    setQuantity(1)

    sizeLogger.info('Size added successfully', { newSize, totalSizes: updatedSizes.length })
  }, [sizes, selectedSize, selectedAgeCategory, quantity, onSizesChange, canAddSize])

  // Remove size by index
  const handleRemoveSize = useCallback((index: number) => {
    const removedSize = sizes[index]
    const updatedSizes = sizes.filter((_, i) => i !== index)
    onSizesChange(updatedSizes)

    sizeLogger.info('Size removed successfully', { removedSize, remainingSizes: updatedSizes.length })
  }, [sizes, onSizesChange])

  // Update quantity for existing size
  const handleUpdateQuantity = useCallback((index: number, newQuantity: number) => {
    if (newQuantity < 1) return

    const updatedSizes = [...sizes]
    updatedSizes[index] = { ...updatedSizes[index], quantity: newQuantity }
    onSizesChange(updatedSizes)

    sizeLogger.info('Size quantity updated', { index, newQuantity })
  }, [sizes, onSizesChange])

  // Get error message for current state
  const getCurrentError = () => {
    if (errors?.sizes) return errors.sizes
    if (required && touched?.sizes && sizes.length === 0) {
      return 'Minimal 1 ukuran harus ditambahkan'
    }
    return null
  }

  const currentError = getCurrentError()

  return (
    <div className="space-y-6">
      {/* Header with size count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Package className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">
            Manajemen Ukuran
            {required && <span className="text-red-500 ml-1">*</span>}
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <span>{sizes.length}</span>
            <span>ukuran</span>
          </Badge>
          {businessInsights && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <BarChart3 className="w-3 h-3" />
              <span>{businessInsights.businessValue}</span>
            </Badge>
          )}
        </div>
      </div>

      {/* Validation Error Alert */}
      {currentError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{currentError}</AlertDescription>
        </Alert>
      )}

      {/* Size Entry Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Tambah Ukuran</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Size Selection */}
            <div>
              <Label htmlFor="size">Ukuran</Label>
              <Select value={selectedSize} onValueChange={(value) => setSelectedSize(value as SizeEnum)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SIZE_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Age Category Selection */}
            <div>
              <Label htmlFor="ageCategory">Kategori Umur</Label>
              <Select value={selectedAgeCategory} onValueChange={(value) => setSelectedAgeCategory(value as AgeCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AGE_CATEGORY_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <div>{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quantity Input */}
            <div>
              <Label htmlFor="quantity">Jumlah</Label>
              <Input
                type="number"
                min="1"
                max="999"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                placeholder="Jumlah"
              />
            </div>

            {/* Add Button */}
            <div className="flex items-end">
              <Button
                onClick={handleAddSize}
                disabled={!canAddSize()}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah
              </Button>
            </div>
          </div>

          {/* Duplicate Warning */}
          {!canAddSize() && quantity > 0 && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Kombinasi {selectedSize} - {selectedAgeCategory} sudah ada. Pilih kombinasi yang berbeda.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Aggregated Size Display */}
      {showAggregation && aggregatedSizes.length > 0 && (
        <AdvancedAggregatedSizeDisplay
          aggregatedSizes={aggregatedSizes}
          businessInsights={businessInsights}
        />
      )}

      {/* Size List */}
      {sizes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Daftar Ukuran ({sizes.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sizes.map((size, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                  <div className="flex items-center space-x-4">
                    <Badge variant="outline" className="font-mono">
                      {size.size}
                    </Badge>
                    <Badge variant="secondary">
                      {AGE_CATEGORY_OPTIONS.find(opt => opt.value === size.ageCategory)?.label}
                    </Badge>
                    <span className="font-medium">{size.quantity} pcs</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      min="1"
                      max="999"
                      value={size.quantity}
                      onChange={(e) => handleUpdateQuantity(index, parseInt(e.target.value) || 1)}
                      className="w-20"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveSize(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {required && sizes.length === 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Produk advanced memerlukan minimal 1 ukuran. Gunakan form di atas untuk menambahkan ukuran pertama.
          </AlertDescription>
        </Alert>
      )}

      {/* Business Insights (Development) */}
      {process.env.NODE_ENV === 'development' && businessInsights && sizes.length > 0 && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Business Insights (Dev)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Age Categories: {businessInsights.uniqueAgeCategories}</div>
              <div>Size Variations: {businessInsights.uniqueSizes}</div>
              <div>Total Quantity: {businessInsights.totalQuantity}</div>
              <div>Complexity Score: {businessInsights.complexityScore}/10</div>
              <div>Business Value: {businessInsights.businessValue}</div>
              <div>Age Tracking: {businessInsights.canTrackByAgeCategory ? '✅' : '❌'}</div>
              <div>Size Tracking: {businessInsights.canTrackBySpecificSize ? '✅' : '❌'}</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export type { AdvancedSizeManagementSectionProps }