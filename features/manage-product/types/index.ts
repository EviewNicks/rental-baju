/**
 * Product Management Types
 *
 */

// Note: Decimal type is only used on server-side
// Frontend uses regular numbers for all monetary values

// Base types that match Prisma output (server-side)
export interface BaseProduct {
  id: string
  code: string
  name: string
  description?: string
  categoryId: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  modalAwal: any // Prisma Decimal (server-side only)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentPrice: any // Prisma Decimal (server-side only)
  quantity: number
  rentedStock: number
  // Material Management fields - RPK-45 (NULLABLE untuk backward compatibility)
  materialId?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  materialCost?: any // Prisma Decimal (server-side only)
  materialQuantity?: number
  status: ProductStatus
  imageUrl?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  totalPendapatan: any // Calculated field from transaction history (not stored in DB)
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface BaseCategory {
  id: string
  name: string
  color: string
  type: CategoryType
  createdAt: Date
  updatedAt: Date
  createdBy: string
}


// Client-side types (frontend-safe with regular numbers)
export interface ClientProduct {
  id: string
  code: string
  name: string
  description?: string
  categoryId: string
  modalAwal: number
  currentPrice: number
  quantity: number
  rentedStock: number
  // Material Management fields - RPK-45 (client-safe numbers)
  materialId?: string
  materialCost?: number
  materialQuantity?: number
  status: ProductStatus
  imageUrl?: string
  totalPendapatan: number // Calculated field from transaction history
  isActive: boolean
  createdAt: Date | string
  updatedAt: Date | string
  createdBy: string
  category: ClientCategory
  material?: ClientMaterial
  sizes: ClientProductSize[]
}

export interface ClientCategory {
  id: string
  name: string
  color: string
  type: CategoryType
  createdAt: Date | string
  updatedAt: Date | string
  createdBy: string
  products: ClientProduct[]
}


// Material Management - RPK-45
export interface BaseMaterial {
  id: string
  name: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pricePerUnit: any // Prisma Decimal (server-side only)
  unit: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface ClientMaterial {
  id: string
  name: string
  pricePerUnit: number
  unit: string
  isActive: boolean
  createdAt: Date | string
  updatedAt: Date | string
  createdBy: string
  products: ClientProduct[]
}

export interface Material extends BaseMaterial {
  products: Product[]
}

// ProductSize Types
export interface BaseProductSize {
  id: string
  productId: string
  ageCategory: AgeCategory
  size: SizeEnum
  quantity: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface ClientProductSize {
  id: string
  productId: string
  ageCategory: AgeCategory
  size: SizeEnum
  quantity: number
  isActive: boolean
  createdAt: Date | string
  updatedAt: Date | string
  createdBy: string
  product?: ClientProduct
}

export interface ProductSize extends BaseProductSize {
  product: Product
}

// Full types with relationships
export interface Product extends BaseProduct {
  category: Category
  material?: Material
  sizes: ProductSize[]
}

export interface Category extends BaseCategory {
  products: Product[]
}


// Client-side category type for frontend usage
export interface CategoryWithClientProducts extends BaseCategory {
  products: Product[]
}

// Prisma-compatible types (without circular dependencies)
export interface PrismaProduct extends BaseProduct {
  category?: BaseCategory
}

export interface PrismaCategory extends BaseCategory {
  products?: BaseProduct[]
}

export type ViewMode = 'table' | 'card' | 'grid'
export type ProductStatus = 'AVAILABLE' | 'RENTED' | 'MAINTENANCE'
export type AgeCategory = 'ADULT' | 'CHILD' | 'UNIVERSAL'
export type SizeEnum = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'UNIVERSAL'

// Category Types for Dynamic Form System
export type CategoryType = 'clothing' | 'accessories_age_based' | 'accessories_universal'

// Filter types untuk UI components
export type CategoryFilterValue = string | undefined
export type StatusFilterValue = ProductStatus | undefined | 'Semua' | ''

// Type guards
export function isValidProductStatus(status: string): status is ProductStatus {
  return ['AVAILABLE', 'RENTED', 'MAINTENANCE'].includes(status)
}

export function normalizeStatusFilter(status: string | undefined): ProductStatus | undefined {
  if (!status || status === 'Semua' || status === '') {
    return undefined
  }
  return isValidProductStatus(status) ? status : undefined
}

export function normalizeCategoryFilter(categoryId: string | undefined): string | undefined {
  if (!categoryId || categoryId === '' || categoryId === 'all') {
    return undefined
  }
  return categoryId
}

/**
 * API Request/Response Types
 * Menggunakan number untuk API layer, Decimal untuk database layer
 */

export interface CreateProductRequest {
  code: string
  name: string
  description?: string
  modalAwal: number // ✅ Ubah dari Decimal ke number
  currentPrice: number // ✅ Renamed from hargaSewa to match database schema
  quantity: number
  categoryId: string
  sizes: string // JSON string format required by backend - Advanced-only architecture
  // Material Management fields - RPK-45
  materialId?: string
  materialQuantity?: number
  image?: File
  imageUrl?: string
}

export interface UpdateProductRequest {
  name?: string
  description?: string
  modalAwal?: number // ✅ Ubah dari Decimal ke number
  currentPrice?: number // ✅ Renamed from hargaSewa to match database schema
  quantity?: number
  categoryId?: string
  sizes: string // JSON string format required by backend - Advanced-only architecture
  // Material Management fields - RPK-45
  materialId?: string
  materialQuantity?: number
  image?: File
  imageUrl?: string
}

export interface ProductListResponse {
  products: Product[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/**
 * Category Management Types
 */

export interface CreateCategoryRequest {
  name: string
  color: string
  type?: CategoryType
}

export interface UpdateCategoryRequest {
  name?: string
  color?: string
  type?: CategoryType
}


/**
 * Category Management Types
 */

export interface CategoryFormData {
  name: string
  color: string
  type?: CategoryType
}

export type CategoryModalMode = 'add' | 'edit' | 'view'

// =============

export interface ProductFormData {
  code: string
  name: string
  categoryId: string
  quantity: number
  modalAwal: number // ✅ Ubah dari Decimal ke number
  currentPrice: number // ✅ Renamed from hargaSewa to match database schema
  description: string
  imageUrl: string | null
  // Advanced-only Size Management (required for all products)
  hasSizes: boolean
  aggregatedSizes?: AggregatedSizeView[]
}

/**
 * Size Management Request/Response Types
 */

export interface CreateProductSizeRequest {
  ageCategory: AgeCategory
  size: SizeEnum
  quantity: number
  isActive?: boolean
}

export interface UpdateProductSizeRequest {
  id?: string
  ageCategory: AgeCategory
  size: SizeEnum
  quantity: number
  isActive?: boolean
}

export interface CreateProductWithSizesRequest extends Omit<CreateProductRequest, 'sizes'> {
  // Advanced-only architecture: all products require sizes
  sizes: CreateProductSizeRequest[]
}

export interface UpdateProductWithSizesRequest extends Omit<UpdateProductRequest, 'sizes'> {
  // Advanced-only architecture: all products require sizes
  sizes: UpdateProductSizeRequest[]
}

// Enhanced Product types with size helpers (Advanced-only)
export interface EnhancedClientProduct extends ClientProduct {
  hasAdvancedSizing: boolean // Always true in advanced-only architecture
  sizeMode: 'advanced' // Only advanced mode supported
  displaySizes: string[]
}

// Size management validation types
export interface SizeValidationError {
  field: string
  message: string
  ageCategory?: AgeCategory
  size?: SizeEnum
}

export interface SizeValidationResult {
  isValid: boolean
  errors: SizeValidationError[]
}

// ============== SIZE AGGREGATION INTERFACES ==============
// Phase 1: Hybrid Size Management - Aggregation Layer Types

/**
 * Aggregated view of a single size across all age categories
 * Example: M: 5 total (Dewasa: 2, Anak: 3)
 */
export interface AggregatedSizeView {
  size: SizeEnum
  totalQuantity: number
  breakdown: {
    adult?: number
    child?: number
    universal?: number
  }
  hasMultipleCategories: boolean
}

/**
 * Simplified size entry for inline table management
 */
export interface SimplifiedSizeEntry {
  id: string
  size: SizeEnum
  ageCategory: AgeCategory
  quantity: number
}

/**
 * Category breakdown for aggregation analysis
 */
export interface CategoryBreakdown {
  adult: number
  child: number
  universal: number
  total: number
}

/**
 * Complete aggregation data for a product
 */
export interface ProductSizeAggregation {
  productId: string
  totalQuantity: number
  aggregatedSizes: AggregatedSizeView[]
  hasAdvancedSizing: boolean
  categoryBreakdown: CategoryBreakdown
  lastCalculated: Date
}

/**
 * Product response with optional aggregation data
 */
export interface ProductResponseWithAggregation extends Product {
  aggregation?: ProductSizeAggregation
}

/**
 * Client-safe product with aggregation data
 */
export interface ClientProductWithAggregation extends ClientProduct {
  aggregation?: ProductSizeAggregation
}

/**
 * Aggregation service configuration
 */
export interface AggregationConfig {
  enableCaching: boolean
  cacheExpiryMinutes: number
  includeBreakdown: boolean
}

/**
 * Aggregation query parameters for API endpoints
 */
export interface AggregationQueryParams {
  includeBreakdown?: boolean
  includeMetadata?: boolean
  cacheBypass?: boolean
}

/**
 * Aggregation service response wrapper
 */
export interface AggregationServiceResponse<T> {
  data: T
  metadata: {
    calculatedAt: Date
    fromCache: boolean
    calculationTimeMs: number
  }
}

/**
 * Business logic validation interfaces
 */
export interface AggregationConsistencyResult {
  isConsistent: boolean
  errors: string[]
  detailedTotal: number
  aggregatedTotal: number
}

export interface RentalTrackingCapabilities {
  canTrackByAgeCategory: boolean
  canTrackBySpecificSize: boolean
  availableForRental: {
    adult: { [size: string]: number }
    child: { [size: string]: number }
    universal: { [size: string]: number }
  }
  businessCapabilities: string[]
}

export interface AnalyticsCapabilities {
  canGenerateReports: boolean
  availableMetrics: string[]
  analyticsBreakdown: {
    totalItems: number
    uniqueSizes: number
    ageCategories: number
    complexityScore: number
  }
  businessInsights: string[]
}

export interface InventoryManagementCapabilities {
  canRestockByCategory: boolean
  canTrackUtilization: boolean
  restockingRecommendations: Array<{
    ageCategory: AgeCategory
    size: SizeEnum
    currentStock: number
    recommendedAction: 'increase' | 'decrease' | 'maintain'
    reason: string
  }>
  inventoryHealth: 'good' | 'needs_attention' | 'critical'
}

export interface BusinessLogicValidationResult {
  aggregationConsistency: AggregationConsistencyResult
  rentalTracking: RentalTrackingCapabilities
  analyticsCapabilities: AnalyticsCapabilities
  inventoryManagement: InventoryManagementCapabilities
  overallHealth: 'excellent' | 'good' | 'needs_attention' | 'critical'
  recommendations: string[]
}

export interface BusinessCapabilitiesReport {
  productId: string
  productName: string
  capabilityMatrix: {
    rental: {
      ageCategoryTracking: boolean
      sizeSpecificTracking: boolean
      multiGenerationalSupport: boolean
    }
    analytics: {
      reportGeneration: boolean
      trendAnalysis: boolean
      performanceMetrics: boolean
    }
    inventory: {
      categoryRestocking: boolean
      utilizationTracking: boolean
      healthMonitoring: boolean
    }
  }
  businessValue: {
    score: number
    level: 'basic' | 'intermediate' | 'advanced' | 'enterprise'
    strengths: string[]
    improvementAreas: string[]
  }
}
