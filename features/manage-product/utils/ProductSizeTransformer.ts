/**
 * ProductSizeTransformer Utility Class
 * Consolidates all size transformation logic for unified and maintainable code
 */

import type { SimplifiedSizeEntry, AggregatedSizeView, CreateProductSizeRequest } from '../types'

export class ProductSizeTransformer {
  /**
   * Transform simplified sizes to backend format (NEW SYSTEM)
   */
  static transformSimplifiedSizesToBackendFormat(simplifiedSizes: SimplifiedSizeEntry[]): string {
    const sizes = simplifiedSizes.map((sizeEntry) => ({
      ageCategory: sizeEntry.ageCategory, // Already using standardized enum values
      size: sizeEntry.size,
      quantity: sizeEntry.quantity,
      isActive: true,
      // Note: 'id' field is intentionally excluded - only used for frontend state management
    }))

    return JSON.stringify(sizes)
  }

  /**
   * Transform existing product sizes to simplified sizes format (EDIT MODE)
   */
  static transformProductSizesToSimplifiedFormat(
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    productSizes: any[], // ClientProductSize[]
  ): SimplifiedSizeEntry[] {
    return productSizes.map((size) => ({
      id: size.id,
      size: size.size, // as SizeEnum
      ageCategory: size.ageCategory, // as AgeCategory
      quantity: size.quantity,
    }))
  }

  /**
   * Transform aggregated sizes to backend format (LEGACY COMPATIBILITY)
   */
  static transformSizesToBackendFormat(aggregatedSizes: AggregatedSizeView[]): string {
    const sizes = aggregatedSizes.flatMap((aggSize) =>
      Object.entries(aggSize.breakdown).map(([ageCategory, quantity]) => ({
        ageCategory:
          ageCategory === 'dewasa' ? 'ADULT' : ageCategory === 'anak' ? 'CHILD' : 'ADULT', // Updated mapping
        size: aggSize.size,
        quantity: quantity,
        isActive: true,
      })),
    )
    return JSON.stringify(sizes)
  }

  /**
   * Calculate total quantity from different size data types
   */
  static calculateTotalQuantity(
    data: SimplifiedSizeEntry[] | AggregatedSizeView[] | CreateProductSizeRequest[],
    dataType: 'simplified' | 'aggregated' | 'strategy' = 'simplified',
  ): number {
    if (!data || data.length === 0) return 0

    switch (dataType) {
      case 'simplified':
        return (data as SimplifiedSizeEntry[]).reduce((sum, size) => sum + size.quantity, 0)
      case 'aggregated':
        return (data as AggregatedSizeView[]).reduce((sum, size) => sum + size.totalQuantity, 0)
      case 'strategy':
        return (data as CreateProductSizeRequest[]).reduce((sum, size) => sum + size.quantity, 0)
      default:
        return 0
    }
  }

  /**
   * Clear size validation errors from error state
   */
  static clearSizeErrors(
    setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  ): void {
    setErrors((prev) => ({ ...prev, sizes: '' }))
  }

  /**
   * Validate size data and return error message if invalid
   */
  static validateSizeData(
    strategySizes: CreateProductSizeRequest[],
    simplifiedSizes: SimplifiedSizeEntry[],
    aggregatedSizes: AggregatedSizeView[],
  ): string | null {
    // Check strategy sizes (Priority 1)
    if (strategySizes.length > 0) {
      const totalQuantity = strategySizes.reduce((sum, size) => sum + size.quantity, 0)
      if (totalQuantity === 0) {
        return 'Setidaknya satu ukuran harus memiliki jumlah yang valid'
      }
      return null
    }

    // Check simplified sizes (Priority 2)
    if (simplifiedSizes.length > 0) {
      const totalQuantity = simplifiedSizes.reduce((sum, size) => sum + size.quantity, 0)
      if (totalQuantity === 0) {
        return 'Setidaknya satu ukuran harus memiliki jumlah yang valid'
      }
      return null
    }

    // Check aggregated sizes (Priority 3)
    if (aggregatedSizes.length > 0) {
      const hasValidSizes = aggregatedSizes.some((size) => size.totalQuantity > 0)
      if (!hasValidSizes) {
        return 'Setidaknya satu ukuran harus memiliki jumlah yang valid'
      }
      return null
    }

    return 'Produk harus memiliki setidaknya satu ukuran dengan jumlah yang valid'
  }

  /**
   * Transform size data to backend format based on available data priority
   */
  static transformToBackendFormat(
    strategySizes: CreateProductSizeRequest[],
    simplifiedSizes: SimplifiedSizeEntry[],
    aggregatedSizes: AggregatedSizeView[],
  ): { data: string; source: string } {
    if (strategySizes.length > 0) {
      // Priority 1: Strategy data (dynamic form data)
      return {
        data: JSON.stringify(strategySizes),
        source: 'strategy',
      }
    } else if (simplifiedSizes.length > 0) {
      // Priority 2: Simplified sizes (legacy system)
      return {
        data: ProductSizeTransformer.transformSimplifiedSizesToBackendFormat(simplifiedSizes),
        source: 'simplified',
      }
    } else {
      // Priority 3: Aggregated sizes (legacy fallback)
      return {
        data: ProductSizeTransformer.transformSizesToBackendFormat(aggregatedSizes || []),
        source: 'aggregated',
      }
    }
  }
}
