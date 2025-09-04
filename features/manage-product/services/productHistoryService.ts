/**
 * ProductHistoryService - Business Logic Layer
 * RPK-46 Product History Activity Timeline Component
 *
 * Handles data aggregation, revenue calculation, and customer data masking
 * Follows existing architecture patterns from ProductService
 */

import { PrismaClient } from '@prisma/client'
import { NotFoundError } from '../lib/errors/AppError'
import type {
  ProductHistoryItem,
  HistoryQueryParams,
  ProductHistoryServiceResult,
  ProductHistoryQuery,
  ProductHistoryRawResult,
  RevenueBreakdown,
  PenaltyDetail,
  UserRole,
  RolePermissions,
} from '../types/productHistory'

import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, ROLE_PERMISSIONS } from '../types/productHistory'

export class ProductHistoryService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly userId: string,
  ) {}

  /**
   * Get product history with pagination and role-based data masking
   */
  async getProductHistory(
    productId: string,
    params: HistoryQueryParams,
    userRole: UserRole = 'producer',
  ): Promise<ProductHistoryServiceResult> {
    try {
      // Validate product exists first
      await this.validateProductExists(productId)

      // Build query parameters with defaults
      const query = this.buildHistoryQuery(productId, params)

      // Get total count for pagination
      const totalCount = await this.getHistoryCount(productId)

      // Execute optimized query
      const rawResults = await this.executeHistoryQuery(query)

      // Transform and mask data based on role
      const transformedResults = await this.transformHistoryResults(rawResults, userRole)

      return {
        success: true,
        data: transformedResults,
        pagination: {
          page: query.pagination.page,
          limit: query.pagination.limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / query.pagination.limit),
        },
      }
    } catch (error) {
      console.error('ProductHistoryService.getProductHistory error:', error)

      if (error instanceof NotFoundError) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: error.message,
          },
        }
      }

      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch product history',
        },
      }
    }
  }

  /**
   * Validate that product exists and is active
   */
  private async validateProductExists(productId: string): Promise<void> {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        isActive: true,
      },
      select: { id: true, name: true },
    })

    if (!product) {
      throw new NotFoundError(`Produk dengan ID ${productId} tidak ditemukan`)
    }
  }

  /**
   * Build optimized query parameters
   */
  private buildHistoryQuery(productId: string, params: HistoryQueryParams): ProductHistoryQuery {
    const page = Math.max(1, params.page || 1)
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, params.limit || DEFAULT_PAGE_SIZE))
    const sortBy = params.sortBy === 'revenue' ? 'revenue' : 'date'
    const sortOrder = params.sortOrder === 'asc' ? 'asc' : 'desc'

    return {
      productId,
      pagination: {
        page,
        limit,
        offset: (page - 1) * limit,
      },
      sorting: {
        field: sortBy,
        direction: sortOrder,
      },
    }
  }

  /**
   * Get total count of history entries for pagination
   */
  private async getHistoryCount(productId: string): Promise<number> {
    return await this.prisma.transaksiItem.count({
      where: {
        produkId: productId,
        transaksi: {
          status: {
            not: 'cancelled', // Exclude cancelled transactions
          },
        },
      },
    })
  }

  /**
   * Execute optimized database query using existing indexes
   * Leverages idx_transaksi_item_product_join and idx_product_penalty_calc
   */
  private async executeHistoryQuery(
    query: ProductHistoryQuery,
  ): Promise<ProductHistoryRawResult[]> {
    // Build ORDER BY clause based on sorting preference
    const orderBy =
      query.sorting.field === 'revenue'
        ? [{ subtotal: query.sorting.direction as 'asc' | 'desc' }]
        : [{ transaksi: { createdAt: query.sorting.direction as 'asc' | 'desc' } }]

    const transaksiItems = await this.prisma.transaksiItem.findMany({
      where: {
        produkId: query.productId,
        transaksi: {
          status: {
            not: 'cancelled',
          },
        },
      },
      include: {
        transaksi: {
          select: {
            id: true,
            kode: true,
            status: true,
            tglMulai: true,
            tglSelesai: true,
            createdAt: true,
            penyewa: {
              select: {
                nama: true,
                telepon: true,
              },
            },
          },
        },
        returnConditions: {
          select: {
            kondisiAkhir: true,
            jumlahKembali: true,
            penaltyAmount: true,
            modalAwalUsed: true,
          },
        },
      },
      orderBy,
      skip: query.pagination.offset,
      take: query.pagination.limit,
    })

    // Transform Prisma results to raw result format
    return transaksiItems.map(
      (item): ProductHistoryRawResult => ({
        id: item.id,
        transactionCode: item.transaksi.kode,
        transactionDate: item.transaksi.createdAt,
        rentalStart: item.transaksi.tglMulai,
        rentalEnd: item.transaksi.tglSelesai,
        customerName: item.transaksi.penyewa.nama,
        customerContact: item.transaksi.penyewa.telepon,
        subtotal: item.subtotal.toNumber(), // Convert Decimal to number
        duration: item.durasi,
        status: item.transaksi.status,
        itemQuantity: item.jumlah,
        penalties: item.returnConditions.map((condition) => ({
          kondisiAkhir: condition.kondisiAkhir,
          jumlahKembali: condition.jumlahKembali,
          penaltyAmount: condition.penaltyAmount.toNumber(), // Convert Decimal to number
          modalAwalUsed: condition.modalAwalUsed?.toNumber(),
        })),
      }),
    )
  }

  /**
   * Transform raw results with role-based data masking
   */
  private async transformHistoryResults(
    rawResults: ProductHistoryRawResult[],
    userRole: UserRole,
  ): Promise<ProductHistoryItem[]> {
    const permissions = ROLE_PERMISSIONS[userRole]

    return rawResults.map((raw): ProductHistoryItem => {
      // Calculate revenue breakdown
      const revenueBreakdown = this.calculateRevenueBreakdown(raw.subtotal, raw.penalties || [])

      // Apply customer data masking based on role
      const customerData = this.maskCustomerData(
        { name: raw.customerName, contact: raw.customerContact },
        permissions,
      )

      return {
        id: raw.id,
        transactionCode: raw.transactionCode,
        transactionDate: raw.transactionDate,
        rentalStart: raw.rentalStart,
        rentalEnd: raw.rentalEnd,
        customerName: customerData.name,
        customerContact: customerData.contact,
        baseRevenue: revenueBreakdown.subtotal,
        penaltyAmount: revenueBreakdown.totalPenalties,
        totalRevenue: revenueBreakdown.finalTotal,
        status: raw.status,
        itemQuantity: raw.itemQuantity,
        duration: raw.duration,
      }
    })
  }

  /**
   * Calculate revenue breakdown including penalties
   */
  public calculateRevenueBreakdown(subtotal: number, penalties: PenaltyDetail[]): RevenueBreakdown {
    const totalPenalties = penalties.reduce((total, penalty) => total + penalty.penaltyAmount, 0)

    return {
      subtotal,
      penalties,
      totalPenalties,
      finalTotal: subtotal + totalPenalties,
    }
  }

  /**
   * Mask customer data based on role permissions (Producer role compliance)
   */
  public maskCustomerData(
    customerInfo: { name: string; contact: string },
    permissions: RolePermissions,
  ): { name: string; contact: string } {
    if (permissions.canViewFullCustomerData) {
      return customerInfo
    }

    // Apply masking for Producer and Kasir roles
    return {
      name: this.maskName(customerInfo.name),
      contact: this.maskContact(customerInfo.contact),
    }
  }

  /**
   * Mask customer name: "John Doe" -> "John D."
   */
  private maskName(name: string): string {
    if (!name || name.length < 2) return name

    const nameParts = name.trim().split(' ')
    if (nameParts.length === 1) {
      return nameParts[0]
    }

    const firstName = nameParts[0]
    const lastInitial = nameParts[nameParts.length - 1][0]
    return `${firstName} ${lastInitial}.`
  }

  /**
   * Mask contact: "081234567890" -> "081****567"
   */
  private maskContact(contact: string): string {
    if (!contact || contact.length < 6) return contact

    const start = contact.substring(0, 3)
    const end = contact.substring(contact.length - 3)
    return `${start}****${end}`
  }

  /**
   * Get product history summary statistics
   */
  async getHistorySummary(productId: string): Promise<{
    totalRevenue: number
    totalTransactions: number
    averageRentalDuration: number
  }> {
    // Validate product exists
    await this.validateProductExists(productId)

    // Get aggregated statistics
    const stats = await this.prisma.transaksiItem.aggregate({
      where: {
        produkId: productId,
        transaksi: {
          status: {
            not: 'cancelled',
          },
        },
      },
      _sum: {
        subtotal: true,
        totalReturnPenalty: true,
      },
      _avg: {
        durasi: true,
      },
      _count: {
        id: true,
      },
    })

    const baseRevenue = stats._sum.subtotal?.toNumber() || 0
    const penalties = stats._sum.totalReturnPenalty?.toNumber() || 0
    const totalRevenue = baseRevenue + penalties
    const totalTransactions = stats._count.id || 0
    const averageRentalDuration = Math.round(stats._avg.durasi || 0)

    return {
      totalRevenue,
      totalTransactions,
      averageRentalDuration,
    }
  }
}
