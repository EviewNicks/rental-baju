/**
 * Product Availability Service - RPK-26
 * Calculate real-time product availability considering active rentals
 * Following business logic requirements for rental inventory management
 */

import { PrismaClient } from '@prisma/client'
import { calculateAvailableStock } from '../lib/typeUtils'

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
  constructor(private prisma: PrismaClient) {}

  /**
   * Get real-time availability for a single product
   * SIMPLIFIED: Uses new inventory tracking fields from database
   */
  async getProductAvailability(
    productId: string,
    checkDate: Date = new Date()
  ): Promise<ProductAvailability> {
    // Get product with inventory tracking fields
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        quantity: true,        // Total inventory (immutable)
        rentedStock: true,     // Currently rented out
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

    // SIMPLIFIED: Use database fields directly instead of calculations
    // Calculate available stock using utility function
    const availableQuantity = calculateAvailableStock(product.quantity, product.rentedStock)
    
    return {
      productId,
      totalStock: product.quantity,           // Total inventory (unchanged during rentals)
      rentedQuantity: product.rentedStock,    // Currently rented out
      availableQuantity,                      // Calculated: quantity - rentedStock
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
   */
  async checkRentalAvailability(
    items: Array<{ productId: string; quantity: number }>,
    startDate: Date = new Date()
    // Future: endDate parameter will be used for rental period checking
  ): Promise<{
    available: boolean
    conflicts: Array<{
      productId: string
      requested: number
      available: number
      shortage: number
    }>
  }> {
    const conflicts: Array<{
      productId: string
      requested: number
      available: number
      shortage: number
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
        id: true,
        quantity: true,
        rentedStock: true
      }
    })

    let fullyAvailable = 0
    let partiallyAvailable = 0
    let outOfStock = 0
    let totalRented = 0

    for (const product of products) {
      // Calculate available stock using utility function
      const availableStock = calculateAvailableStock(product.quantity, product.rentedStock)
      totalRented += product.rentedStock

      if (availableStock === 0) {
        outOfStock++
      } else if (availableStock === product.quantity) {
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
        quantity: true,
        rentedStock: true,
        category: {
          select: { name: true }
        }
      }
    })

    const lowStockProducts = []

    for (const product of products) {
      // Calculate available stock using utility function
      const availableStock = calculateAvailableStock(product.quantity, product.rentedStock)
      
      if (availableStock <= threshold && availableStock > 0) {
        lowStockProducts.push({
          productId: product.id,
          productName: product.name,
          productCode: product.code,
          totalStock: product.quantity,
          availableQuantity: availableStock,
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