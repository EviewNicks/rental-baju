/**
 * Product Availability Service - RPK-26
 * Calculate real-time product availability considering active rentals
 * Following business logic requirements for rental inventory management
 */

import { PrismaClient } from '@prisma/client'
import { inventoryService } from './inventoryService'

export interface ProductAvailability {
  productId: string
  totalStock: number
  rentedQuantity: number
  availableQuantity: number
  activeRentals: Array<{
    transaksiId: string
    transaksiKode: string
    quantity: number
    startDate: Date
    endDate?: Date
    status: string
  }>
}

export interface AvailabilityQueryOptions {
  productIds?: string[]
  categoryId?: string
  checkDate?: Date
  includeFutureReservations?: boolean
}

export class AvailabilityService {
  constructor(protected prisma: PrismaClient) {}

  /**
   * Get real-time availability for a single product
   * SIMPLIFIED: Uses new inventory tracking fields from database
   */
  async getProductAvailability(
    productId: string,
    checkDate: Date = new Date()
  ): Promise<ProductAvailability> {
    // Get product using Enhanced ProductSize schema
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        status: true
      }
    })

    if (!product) {
      throw new Error('Produk tidak ditemukan')
    }

    // Get active rentals for detailed information (optional for debugging)
    const activeRentals = await this.prisma.transaksiItem.findMany({
      where: {
        produkId: productId,
        transaksi: {
          status: {
            in: ['active', 'terlambat'] // Only count active and overdue rentals
          },
          // Only count rentals that are currently ongoing
          OR: [
            {
              // Rental with no end date (ongoing)
              tglSelesai: null,
              tglMulai: { lte: checkDate }
            },
            {
              // Rental with end date that hasn't passed
              tglSelesai: { gte: checkDate },
              tglMulai: { lte: checkDate }
            }
          ]
        }
      },
      include: {
        transaksi: {
          select: {
            id: true,
            kode: true,
            status: true,
            tglMulai: true,
            tglSelesai: true
          }
        }
      }
    })

    // ENHANCED: Use InventoryService for Enhanced ProductSize fields
    const stockStatus = await inventoryService.getProductStockStatus(productId)

    return {
      productId,
      totalStock: stockStatus.totalQuantity,           // Total inventory from Enhanced ProductSize
      rentedQuantity: stockStatus.rentedQuantity,     // Currently rented out
      availableQuantity: stockStatus.availableQuantity, // Available from Enhanced ProductSize
      activeRentals: activeRentals.map(rental => ({
        transaksiId: rental.transaksi.id,
        transaksiKode: rental.transaksi.kode,
        quantity: rental.jumlah,
        startDate: rental.transaksi.tglMulai,
        endDate: rental.transaksi.tglSelesai || undefined,
        status: rental.transaksi.status
      }))
    }
  }

  /**
   * Calculate availability for multiple products
   */
  async getMultipleProductAvailability(
    productIds: string[],
    checkDate: Date = new Date()
  ): Promise<ProductAvailability[]> {
    const availabilities = await Promise.all(
      productIds.map(id => this.getProductAvailability(id, checkDate))
    )
    return availabilities
  }

  /**
   * Check if requested quantities are available for rental
   * ENHANCED: Now supports date range validation for date-aware availability
   */
  async checkRentalAvailability(
    items: Array<{ productId: string; quantity: number }>,
    startDate: Date = new Date(),
    endDate?: Date // TASK 4.1: Added optional endDate for date-aware checking
  ): Promise<{
    available: boolean
    conflicts: Array<{
      productId?: string
      productSizeId?: string
      requested: number
      available: number
      shortage: number
      overlappingTransactions?: Array<{
        transactionCode: string
        quantity: number
        startDate: Date
        endDate: Date
        status: string
      }>
    }>
  }> {
    // If endDate is provided, use date-aware availability checking
    if (endDate) {
      // Convert items to support both productId and productSizeId
      const convertedItems = items.map(item => ({ productId: item.productId, quantity: item.quantity }))
      return this.checkDateRangeAvailability(convertedItems, startDate, endDate)
    }

    // Legacy behavior: check current availability without date range
    const conflicts: Array<{
      productId?: string
      productSizeId?: string
      requested: number
      available: number
      shortage: number
      overlappingTransactions?: Array<{
        transactionCode: string
        quantity: number
        startDate: Date
        endDate: Date
        status: string
      }>
    }> = []

    for (const item of items) {
      const availability = await this.getProductAvailability(item.productId, startDate)
      
      if (availability.availableQuantity < item.quantity) {
        conflicts.push({
          productId: item.productId,
          requested: item.quantity,
          available: availability.availableQuantity,
          shortage: item.quantity - availability.availableQuantity
        })
      }
    }

    return {
      available: conflicts.length === 0,
      conflicts
    }
  }

  /**
   * TASK 4.1: Check if requested quantities are available for specific date range
   * Date-aware availability validation using tglMulai and tglSelesai fields
   * FIXED: Now supports both productId and productSizeId for proper size-aware validation
   */
  async checkDateRangeAvailability(
    items: Array<{ productId?: string; productSizeId?: string; quantity: number }>,
    startDate: Date,
    endDate: Date
  ): Promise<{
    available: boolean
    conflicts: Array<{
      productId?: string
      productSizeId?: string
      requested: number
      available: number
      shortage: number
      overlappingTransactions: Array<{
        transactionCode: string
        quantity: number
        startDate: Date
        endDate: Date
        status: string
      }>
    }>
  }> {
    const conflicts: Array<{
      productId?: string
      productSizeId?: string
      requested: number
      available: number
      shortage: number
      overlappingTransactions: Array<{
        transactionCode: string
        quantity: number
        startDate: Date
        endDate: Date
        status: string
      }>
    }> = []

    for (const item of items) {
      // TASK 4.1 FIX: Support both productId and productSizeId
      if (item.productSizeId) {
        // NEW: ProductSize-aware validation for size-specific availability
        const overlappingTransactions = await this.getOverlappingTransactionsByProductSize(
          item.productSizeId,
          startDate,
          endDate
        )

        // Calculate total quantity reserved during this period for this specific size
        const reservedQuantity = overlappingTransactions.reduce(
          (sum, transaction) => sum + transaction.quantity,
          0
        )

        // Get total stock for this specific product size
        const stockStatus = await inventoryService.getStockStatus(item.productSizeId)
        const availableForPeriod = stockStatus.availableQuantity - reservedQuantity

        if (availableForPeriod < item.quantity) {
          conflicts.push({
            productSizeId: item.productSizeId,
            requested: item.quantity,
            available: Math.max(0, availableForPeriod),
            shortage: item.quantity - Math.max(0, availableForPeriod),
            overlappingTransactions: overlappingTransactions.map(t => ({
              transactionCode: t.transactionCode,
              quantity: t.quantity,
              startDate: t.startDate,
              endDate: t.endDate,
              status: t.status
            }))
          })
        }
      } else if (item.productId) {
        // LEGACY: Product-level validation (existing behavior)
        const overlappingTransactions = await this.getOverlappingTransactions(
          item.productId,
          startDate,
          endDate
        )

        // Calculate total quantity reserved during this period
        const reservedQuantity = overlappingTransactions.reduce(
          (sum, transaction) => sum + transaction.quantity,
          0
        )

        // Get total stock for this product
        const stockStatus = await inventoryService.getProductStockStatus(item.productId)
        const availableForPeriod = stockStatus.totalQuantity - reservedQuantity

        if (availableForPeriod < item.quantity) {
          conflicts.push({
            productId: item.productId,
            requested: item.quantity,
            available: availableForPeriod,
            shortage: item.quantity - availableForPeriod,
            overlappingTransactions: overlappingTransactions.map(t => ({
              transactionCode: t.transactionCode,
              quantity: t.quantity,
              startDate: t.startDate,
              endDate: t.endDate,
              status: t.status
            }))
          })
        }
      } else {
        throw new Error('Either productId or productSizeId must be provided')
      }
    }

    return {
      available: conflicts.length === 0,
      conflicts
    }
  }

  /**
   * TASK 4.1: Get transactions that overlap with the specified date range
   * Uses tglMulai and tglSelesai fields for date range calculations
   */
  async getOverlappingTransactions(
    productId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{
    transactionId: string
    transactionCode: string
    quantity: number
    startDate: Date
    endDate: Date
    status: string
  }>> {
    // Find transactions that overlap with the requested date range
    // Overlap occurs when: (start1 <= end2) AND (start2 <= end1)
    const overlappingTransactions = await this.prisma.transaksiItem.findMany({
      where: {
        produkId: productId,
        transaksi: {
          status: {
            in: ['active', 'diambil'] // Only count active and picked-up rentals
          },
          // Date overlap condition: (tglMulai <= endDate) AND (tglSelesai >= startDate)
          AND: [
            {
              tglMulai: { lte: endDate }
            },
            {
              OR: [
                { tglSelesai: { gte: startDate } }, // Has end date and overlaps
                { tglSelesai: null } // No end date (ongoing rental)
              ]
            }
          ]
        }
      },
      include: {
        transaksi: {
          select: {
            id: true,
            kode: true,
            status: true,
            tglMulai: true,
            tglSelesai: true
          }
        }
      }
    })

    return overlappingTransactions
      .filter(item => item.transaksi) // Filter out items with null transaksi relation
      .map(item => ({
        transactionId: item.transaksi.id,
        transactionCode: item.transaksi.kode,
        quantity: item.jumlah,
        startDate: item.transaksi.tglMulai,
        endDate: item.transaksi.tglSelesai || new Date('2099-12-31'), // Use far future date for ongoing rentals
        status: item.transaksi.status
      }))
  }

  /**
   * TASK 4.1 FIX: Get transactions that overlap with the specified date range for a specific ProductSize
   * Uses kondisiAwal field to match productSizeId and date range calculations
   */
  async getOverlappingTransactionsByProductSize(
    productSizeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{
    transactionId: string
    transactionCode: string
    quantity: number
    startDate: Date
    endDate: Date
    status: string
  }>> {
    // Find transactions that overlap with the requested date range for specific product size
    // kondisiAwal format: "productSizeId|size|ageCategory|condition"
    const overlappingTransactions = await this.prisma.transaksiItem.findMany({
      where: {
        kondisiAwal: {
          startsWith: productSizeId // Match productSizeId at the beginning of kondisiAwal
        },
        transaksi: {
          status: {
            in: ['active', 'diambil'] // Only count active and picked-up rentals
          },
          // Date overlap condition: (tglMulai <= endDate) AND (tglSelesai >= startDate)
          AND: [
            {
              tglMulai: { lte: endDate }
            },
            {
              OR: [
                { tglSelesai: { gte: startDate } }, // Has end date and overlaps
                { tglSelesai: null } // No end date (ongoing rental)
              ]
            }
          ]
        }
      },
      include: {
        transaksi: {
          select: {
            id: true,
            kode: true,
            status: true,
            tglMulai: true,
            tglSelesai: true
          }
        }
      }
    })

    return overlappingTransactions
      .filter(item => item.transaksi) // Filter out items with null transaksi relation
      .map(item => ({
        transactionId: item.transaksi.id,
        transactionCode: item.transaksi.kode,
        quantity: item.jumlah,
        startDate: item.transaksi.tglMulai,
        endDate: item.transaksi.tglSelesai || new Date('2099-12-31'), // Use far future date for ongoing rentals
        status: item.transaksi.status
      }))
  }



  /**
   * Get availability for products by category
   */
  async getCategoryAvailability(
    categoryId: string,
    checkDate: Date = new Date()
  ): Promise<ProductAvailability[]> {
    const products = await this.prisma.product.findMany({
      where: {
        categoryId,
        isActive: true,
        status: 'AVAILABLE'
      },
      select: { id: true }
    })

    const productIds = products.map(p => p.id)
    return this.getMultipleProductAvailability(productIds, checkDate)
  }

  /**
   * Reserve products for a specific time period (future feature)
   * This would be used for advance bookings
   */
  async reserveProducts(
    items: Array<{ productId: string; quantity: number }>,
    startDate: Date
    // Future: endDate and reservedBy parameters will be used for reservation tracking
  ): Promise<boolean> {
    // Check availability first
    const availabilityCheck = await this.checkRentalAvailability(items, startDate)
    
    if (!availabilityCheck.available) {
      throw new Error(
        `Produk tidak tersedia: ${availabilityCheck.conflicts.map(c => 
          `ID ${c.productId} (kurang ${c.shortage})`
        ).join(', ')}`
      )
    }

    // In a full implementation, we would create reservation records
    // For now, we'll return true as confirmation
    return true
  }

  /**
   * Get product availability summary for dashboard
   */
  async getAvailabilitySummary(): Promise<{
    totalProducts: number
    fullyAvailable: number
    partiallyAvailable: number
    outOfStock: number
    totalRented: number
  }> {
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        status: 'AVAILABLE'
      },
      select: {
        id: true
      }
    })

    let fullyAvailable = 0
    let partiallyAvailable = 0
    let outOfStock = 0
    let totalRented = 0

    // ENHANCED: Use InventoryService for each product
    for (const product of products) {
      const stockStatus = await inventoryService.getProductStockStatus(product.id)
      totalRented += stockStatus.rentedQuantity

      if (stockStatus.availableQuantity === 0) {
        outOfStock++
      } else if (stockStatus.availableQuantity === stockStatus.totalQuantity) {
        fullyAvailable++
      } else {
        partiallyAvailable++
      }
    }

    return {
      totalProducts: products.length,
      fullyAvailable,
      partiallyAvailable,
      outOfStock,
      totalRented
    }
  }

  /**
   * Get products with low availability (below threshold)
   */
  async getLowStockProducts(threshold: number = 2): Promise<Array<{
    productId: string
    productName: string
    productCode: string
    totalStock: number
    availableQuantity: number
    categoryName: string
  }>> {
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        status: 'AVAILABLE'
      },
      select: {
        id: true,
        name: true,
        code: true,
        category: {
          select: { name: true }
        }
      }
    })

    const lowStockProducts = []

    // ENHANCED: Use InventoryService for each product
    for (const product of products) {
      const stockStatus = await inventoryService.getProductStockStatus(product.id)

      if (stockStatus.availableQuantity <= threshold && stockStatus.availableQuantity > 0) {
        lowStockProducts.push({
          productId: product.id,
          productName: product.name,
          productCode: product.code,
          totalStock: stockStatus.totalQuantity,
          availableQuantity: stockStatus.availableQuantity,
          categoryName: product.category.name
        })
      }
    }

    return lowStockProducts.sort((a, b) => a.availableQuantity - b.availableQuantity)
  }

  /**
   * Validate product availability for transaction creation
   */
  async validateTransactionItems(
    items: Array<{ productId: string; quantity: number }>,
    startDate: Date
  ): Promise<{
    valid: boolean
    errors: string[]
    warnings: string[]
  }> {
    const errors: string[] = []
    const warnings: string[] = []

    for (const item of items) {
      try {
        const availability = await this.getProductAvailability(item.productId, startDate)
        
        // Check if product exists and is active
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true, status: true, isActive: true }
        })

        if (!product) {
          errors.push(`Produk dengan ID ${item.productId} tidak ditemukan`)
          continue
        }

        if (!product.isActive) {
          errors.push(`Produk ${product.name} tidak aktif`)
          continue
        }

        if (product.status !== 'AVAILABLE') {
          errors.push(`Produk ${product.name} sedang tidak tersedia (status: ${product.status})`)
          continue
        }

        // Check quantity availability
        if (availability.availableQuantity < item.quantity) {
          errors.push(
            `Produk ${product.name} tidak mencukupi. ` +
            `Tersedia: ${availability.availableQuantity}, Diminta: ${item.quantity}`
          )
          continue
        }

        // Warning for low stock after rental
        const remainingAfterRental = availability.availableQuantity - item.quantity
        if (remainingAfterRental <= 1) {
          warnings.push(
            `Stok produk ${product.name} akan hampir habis setelah transaksi ini ` +
            `(sisa: ${remainingAfterRental})`
          )
        }
      } catch (error) {
        errors.push(`Error validating ${item.productId}: ${error}`)
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }
}

/**
 * Create availability service instance
 */
export function createAvailabilityService(prisma: PrismaClient): AvailabilityService {
  return new AvailabilityService(prisma)
}