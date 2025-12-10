'use client'

import React from 'react'
import { Package, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'

// ===== INTERFACES =====

/**
 * Enhanced Size Detail from API sizeDetails array
 * Represents individual size with complete inventory information
 * 
 * Lost Item Management (Task 1): Added lostQuantity field
 * Inventory Invariant: originalQuantity = rentedQuantity + lostQuantity + availableQuantity
 */
interface EnhancedSizeDetail {
  id: string
  ageCategory: 'ADULT' | 'CHILD' | 'UNIVERSAL'
  size: string
  originalQuantity: number      // Total stock owned
  availableQuantity: number     // Available for rent
  rentedQuantity: number        // Currently rented
  lostQuantity: number          // Permanently lost items (Lost Item Management)
  utilizationRate: number       // Percentage: (rented / original) * 100
  isAvailable: boolean          // Boolean: availableQuantity > 0
}

/**
 * Inventory Status from API inventoryStatus object
 * Represents aggregate inventory statistics
 * 
 * Lost Item Management (Task 1): Added totalLost field
 */
interface InventoryStatus {
  totalOriginal: number         // Sum of all originalQuantity
  totalAvailable: number        // Sum of all availableQuantity
  totalRented: number           // Sum of all rentedQuantity
  totalLost: number             // Sum of all lostQuantity (Lost Item Management)
  utilizationRate: number       // Percentage: (totalRented / totalOriginal) * 100
  isHealthy: boolean            // Boolean: utilizationRate < 80%
}

/**
 * Props for AdminSizeInventoryCard component
 */
interface AdminSizeInventoryCardProps {
  /** Array of size details with enhanced inventory information */
  sizeDetails: EnhancedSizeDetail[]
  /** Overall inventory status with aggregate statistics */
  inventoryStatus: InventoryStatus
  /** Card title */
  title?: string
  /** Whether to show statistics summary section */
  showStats?: boolean
  /** Whether to show utilization progress bars */
  showProgress?: boolean
}

/**
 * Internal statistics calculated from sizeDetails
 * 
 * Lost Item Management (Task 1): Added totalLost and lost per category
 */
interface SizeStatistics {
  totalSizes: number            // Total number of size variations
  availableSizes: number        // Number of sizes with availableQuantity > 0
  totalOriginal: number         // Sum of originalQuantity
  totalAvailable: number        // Sum of availableQuantity
  totalRented: number           // Sum of rentedQuantity
  totalLost: number             // Sum of lostQuantity (Lost Item Management)
  isInStock: boolean            // totalAvailable > 0
  // Breakdown by age category
  byCategory: Record<string, {
    count: number               // Number of sizes in this category
    original: number            // Total originalQuantity in this category
    available: number           // Total availableQuantity in this category
    rented: number              // Total rentedQuantity in this category
    lost: number                // Total lostQuantity in this category (Lost Item Management)
    sizes: EnhancedSizeDetail[] // Array of sizes in this category
  }>
}

// ===== CONFIGURATION =====

/**
 * Age category configuration for styling and display
 */
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

/**
 * Utilization level thresholds for color coding
 */
const UTILIZATION_THRESHOLDS = {
  LOW: 30,      // 0-30%: Green (healthy)
  MEDIUM: 60,   // 31-60%: Yellow (moderate)
  HIGH: 80,     // 61-80%: Orange (high demand)
  CRITICAL: 100 // 81-100%: Red (almost full/full)
} as const

// ===== UTILITY FUNCTIONS =====

/**
 * Get utilization level based on percentage
 */
function getUtilizationLevel(rate: number): 'low' | 'medium' | 'high' | 'critical' {
  if (rate <= UTILIZATION_THRESHOLDS.LOW) return 'low'
  if (rate <= UTILIZATION_THRESHOLDS.MEDIUM) return 'medium'
  if (rate <= UTILIZATION_THRESHOLDS.HIGH) return 'high'
  return 'critical'
}

/**
 * Get status badge configuration based on availability
 */
function getStatusBadge(availableQuantity: number, originalQuantity: number) {
  if (availableQuantity === 0) {
    return { 
      variant: 'destructive' as const, 
      label: 'Habis', 
      icon: XCircle,
      className: 'bg-red-100 text-red-600 border-red-200'
    }
  }
  if (availableQuantity < originalQuantity) {
    return { 
      variant: 'secondary' as const, 
      label: 'Sebagian', 
      icon: AlertCircle,
      className: 'bg-yellow-100 text-yellow-600 border-yellow-200'
    }
  }
  return { 
    variant: 'default' as const, 
    label: 'Tersedia', 
    icon: CheckCircle,
    className: 'bg-green-100 text-green-600 border-green-200'
  }
}

/**
 * Get progress bar color based on utilization rate
 */
function getProgressBarColor(utilizationRate: number): string {
  const level = getUtilizationLevel(utilizationRate)
  switch (level) {
    case 'low': return 'bg-green-500'
    case 'medium': return 'bg-yellow-500'
    case 'high': return 'bg-orange-500'
    case 'critical': return 'bg-red-500'
    default: return 'bg-gray-500'
  }
}

// ===== MAIN COMPONENT =====

/**
 * AdminSizeInventoryCard Component
 * 
 * Displays enhanced inventory information for admin product detail page.
 * Shows detailed breakdown of original, rented, available, and lost quantities
 * with utilization rates and visual indicators.
 * 
 * Lost Item Management Integration (Task 1):
 * - Displays lostQuantity for each size
 * - Shows total lost items in summary statistics
 * - Maintains inventory invariant: original = rented + lost + available
 * - Visual indicators for lost items (red color coding)
 * 
 * @example
 * ```tsx
 * <AdminSizeInventoryCard
 *   sizeDetails={[
 *     {
 *       id: '1',
 *       size: 'M',
 *       ageCategory: 'ADULT',
 *       originalQuantity: 10,
 *       availableQuantity: 5,
 *       rentedQuantity: 3,
 *       lostQuantity: 2,  // Lost Item Management
 *       utilizationRate: 30,
 *       isAvailable: true
 *     }
 *   ]}
 *   inventoryStatus={{
 *     totalOriginal: 10,
 *     totalAvailable: 5,
 *     totalRented: 3,
 *     totalLost: 2,  // Lost Item Management
 *     utilizationRate: 30,
 *     isHealthy: true
 *   }}
 * />
 * ```
 */
export function AdminSizeInventoryCard({
  sizeDetails,
  inventoryStatus,
  title = "Detail Ukuran & Stok",
  showStats = true,
  showProgress = true
}: AdminSizeInventoryCardProps) {
  // ===== STATISTICS CALCULATION =====
  const stats = React.useMemo((): SizeStatistics => {
    // Calculate totals from sizeDetails
    const totalOriginal = sizeDetails.reduce((sum, size) => sum + size.originalQuantity, 0)
    const totalAvailable = sizeDetails.reduce((sum, size) => sum + size.availableQuantity, 0)
    const totalRented = sizeDetails.reduce((sum, size) => sum + size.rentedQuantity, 0)
    const totalLost = sizeDetails.reduce((sum, size) => sum + (size.lostQuantity || 0), 0)
    
    // Count available sizes
    const availableSizes = sizeDetails.filter(size => size.availableQuantity > 0).length
    const totalSizes = sizeDetails.length
    
    // Group by age category
    const byCategory = sizeDetails.reduce((acc, size) => {
      const category = size.ageCategory
      if (!acc[category]) {
        acc[category] = { 
          count: 0, 
          original: 0, 
          available: 0,
          rented: 0,
          lost: 0,
          sizes: [] 
        }
      }
      acc[category].count += 1
      acc[category].original += size.originalQuantity
      acc[category].available += size.availableQuantity
      acc[category].rented += size.rentedQuantity
      acc[category].lost += size.lostQuantity || 0
      acc[category].sizes.push(size)
      return acc
    }, {} as SizeStatistics['byCategory'])
    
    return {
      totalSizes,
      availableSizes,
      totalOriginal,
      totalAvailable,
      totalRented,
      totalLost,
      byCategory,
      isInStock: totalAvailable > 0,
    }
  }, [sizeDetails])

  // ===== EMPTY STATE =====
  if (sizeDetails.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
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

  // ===== RENDER =====
  return (
    <Card className="bg-white border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Package className="w-5 h-5" />
          {title}
          <span className="text-xs text-gray-500 ml-2">(Admin View)</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Statistics Summary - 5 Columns (Lost Item Management) */}
        {showStats && (
          <div className="grid grid-cols-5 gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">{stats.totalSizes}</div>
              <div className="text-xs text-gray-600">Variasi</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">{stats.totalAvailable}</div>
              <div className="text-xs text-gray-600">Tersedia</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-orange-600">{stats.totalRented}</div>
              <div className="text-xs text-gray-600">Disewa</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-red-600">{stats.totalLost}</div>
              <div className="text-xs text-gray-600">Hilang</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-purple-600">{stats.totalOriginal}</div>
              <div className="text-xs text-gray-600">Total</div>
            </div>
            
            {/* Overall Status Message */}
            <div className="col-span-5 mt-2 pt-2 border-t border-gray-200">
              <div className="text-sm text-gray-600 text-center">
                💡 Overall: {inventoryStatus.totalAvailable} dari {inventoryStatus.totalOriginal} pcs tersedia 
                ({inventoryStatus.totalRented} sedang disewa
                {stats.totalLost > 0 && <span className="text-red-600">, {stats.totalLost} hilang</span>})
              </div>
            </div>
          </div>
        )}

        {/* Sizes by Age Category */}
        <div className="space-y-4">
          {Object.entries(stats.byCategory).map(([category, data]) => {
            const config = AGE_CATEGORY_CONFIG[category as keyof typeof AGE_CATEGORY_CONFIG]
            const categoryUtilization = data.original > 0 ? (data.rented / data.original) * 100 : 0
            
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
                  <div className="text-sm text-gray-600">
                    {data.available} dari {data.original} pcs tersedia
                    {data.rented > 0 && (
                      <span className="text-orange-600 ml-1">({data.rented} disewa)</span>
                    )}
                    {data.lost > 0 && (
                      <span className="text-red-600 ml-1">({data.lost} hilang)</span>
                    )}
                  </div>
                </div>
                
                {/* Category Progress Bar */}
                {showProgress && categoryUtilization > 0 && (
                  <div className="mb-3">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getProgressBarColor(categoryUtilization)}`}
                        style={{ width: `${categoryUtilization}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Utilization</span>
                      <span>{categoryUtilization.toFixed(0)}%</span>
                    </div>
                  </div>
                )}
                
                {/* Individual Size Items */}
                <div className="space-y-2">
                  {data.sizes.map((size) => {
                    const statusBadge = getStatusBadge(size.availableQuantity, size.originalQuantity)
                    
                    return (
                      <div
                        key={size.id}
                        className={`p-3 rounded-lg border ${
                          size.availableQuantity > 0
                            ? config.bgColor + ' ' + config.borderColor
                            : 'bg-gray-50 border-gray-200 opacity-60'
                        }`}
                        role="article"
                        aria-label={`Size ${size.size} for ${config.label}: ${size.availableQuantity} available out of ${size.originalQuantity}`}
                      >
                        {/* Size Header with Status Badge */}
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-sm">
                            {config.label} - Size {size.size}
                          </span>
                          <Badge 
                            variant={statusBadge.variant}
                            className={`text-xs ${statusBadge.className}`}
                            role="status"
                            aria-label={`Availability status: ${statusBadge.label}`}
                          >
                            <statusBadge.icon className="w-3 h-3 mr-1" />
                            {statusBadge.label}
                          </Badge>
                        </div>
                        
                        {/* Availability Breakdown (Lost Item Management) */}
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tersedia:</span>
                            <span className="font-semibold text-green-600">
                              {size.availableQuantity} dari {size.originalQuantity} pcs
                            </span>
                          </div>
                          
                          {size.rentedQuantity > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Sedang disewa:</span>
                              <span className="font-semibold text-orange-600">
                                {size.rentedQuantity} pcs
                              </span>
                            </div>
                          )}
                          
                          {size.lostQuantity > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Hilang:</span>
                              <span className="font-semibold text-red-600">
                                {size.lostQuantity} pcs
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Individual Size Utilization Progress Bar */}
                        {showProgress && size.utilizationRate > 0 && (
                          <div className="mt-3 space-y-1">
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${getProgressBarColor(size.utilizationRate)}`}
                                style={{ width: `${size.utilizationRate}%` }}
                                aria-label={`Utilization rate: ${size.utilizationRate}%`}
                                aria-valuenow={size.utilizationRate}
                                aria-valuemin={0}
                                aria-valuemax={100}
                              />
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>Utilization</span>
                              <span>{size.utilizationRate.toFixed(0)}%</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Overall Stock Status Summary */}
        <div className="text-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
          {stats.isInStock ? (
            <div className="flex items-center justify-center gap-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">
                Tersedia {inventoryStatus.totalAvailable} dari {inventoryStatus.totalOriginal} item dalam stok
              </span>
              <span className="text-xs text-gray-500 ml-2">
                (Utilization: {inventoryStatus.utilizationRate.toFixed(0)}% - {inventoryStatus.isHealthy ? 'Healthy' : 'High'})
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-red-600">
              <XCircle className="w-4 h-4" />
              <span className="font-medium">
                Stok habis - semua ukuran sedang disewa
              </span>
              <span className="text-xs text-gray-500 ml-2">
                (Perlu restock segera)
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
