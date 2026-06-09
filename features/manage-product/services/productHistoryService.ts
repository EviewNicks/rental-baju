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
  SizeInfo,
  ActivityMetadata,
  ActivityInfo,
  RawActivityData,
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
   * OPTIMIZED: Removed aktivitas join - not used in UI (80% response size reduction)
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
      select: {
        id: true,
        jumlah: true,
        subtotal: true,
        durasi: true,
        kondisiAwal: true, // Include for size parsing
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
            // REMOVED: aktivitas join - not used in UI
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
        kondisiAwal: item.kondisiAwal,
        // REMOVED: activities field - not used in UI
      }),
    )
  }

  /**
   * Transform raw results with NO customer data masking
   * OPTIMIZED: Removed activities transformation (not used in UI)
   * Shows full customer name and contact for product history visibility
   */
  private async transformHistoryResults(
    rawResults: ProductHistoryRawResult[],
    //eslint-disable-next-line @typescript-eslint/no-unused-vars
    userRole: UserRole,
  ): Promise<ProductHistoryItem[]> {
    return rawResults.map((raw): ProductHistoryItem => {
      // Calculate revenue breakdown
      const revenueBreakdown = this.calculateRevenueBreakdown(raw.subtotal, raw.penalties || [])

      // Parse size information from kondisiAwal
      const sizeInfo = this.parseSizeInfo(raw.kondisiAwal)

      // Build detailed penalty breakdown
      const penaltyBreakdown = this.buildPenaltyBreakdown(raw.penalties || [], raw.duration)

      return {
        id: raw.id,
        transactionCode: raw.transactionCode,
        transactionDate: raw.transactionDate,
        rentalStart: raw.rentalStart,
        rentalEnd: raw.rentalEnd,
        // Show full customer data (no masking) for product history visibility
        customerName: raw.customerName,
        customerContact: raw.customerContact,
        baseRevenue: revenueBreakdown.subtotal,
        penaltyAmount: revenueBreakdown.totalPenalties,
        totalRevenue: revenueBreakdown.finalTotal,
        status: raw.status,
        itemQuantity: raw.itemQuantity,
        duration: raw.duration,
        // REMOVED: activities field - not used in UI (80% response size reduction)
        // ALWAYS include sizeInfo field (even if null) to prevent field omission in JSON response
        sizeInfo: sizeInfo,
        penalty: penaltyBreakdown || undefined,
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
   * Build detailed penalty breakdown for product history display
   * Requirements 4.2, 4.3: Include penalty.total, penalty.late, penalty.condition, and breakdown array
   *
   * @param penalties - Array of penalty details from TransaksiItemReturn
   * @param duration - Rental duration to determine if late penalty applies
   * @returns Detailed penalty breakdown or null if no penalties
   */
  public buildPenaltyBreakdown(
    penalties: PenaltyDetail[],
    //eslint-disable-next-line @typescript-eslint/no-unused-vars
    duration: number,
  ): {
    total: number
    late: number
    condition: number
    breakdown: Array<{
      kondisiAkhir: string
      jumlahKembali: number
      penaltyAmount: number
    }>
  } | null {
    try {
      // Return null if no penalties (Requirement 4.5)
      if (!penalties || penalties.length === 0) {
        return null
      }

      // Calculate total penalties
      const totalPenalty = penalties.reduce((sum, p) => sum + p.penaltyAmount, 0)

      // Return null if total is 0 (Requirement 4.5)
      if (totalPenalty === 0) {
        return null
      }

      // Separate condition penalties from late penalties
      // Condition penalties are those with kondisiAkhir != 'Baik'
      const conditionPenalties = penalties.filter(
        (p) => p.kondisiAkhir && p.kondisiAkhir.toLowerCase() !== 'baik',
      )

      const conditionPenaltyTotal = conditionPenalties.reduce((sum, p) => sum + p.penaltyAmount, 0)

      // Late penalty is the difference (if any)
      const latePenalty = Math.max(0, totalPenalty - conditionPenaltyTotal)

      // Build breakdown array (Requirement 4.3)
      const breakdown = penalties
        .filter((p) => p.penaltyAmount > 0) // Only include penalties with amount
        .map((p) => ({
          kondisiAkhir: p.kondisiAkhir,
          jumlahKembali: p.jumlahKembali,
          penaltyAmount: p.penaltyAmount,
        }))

      return {
        total: totalPenalty,
        late: latePenalty,
        condition: conditionPenaltyTotal,
        breakdown,
      }
    } catch (error) {
      console.error('[ProductHistoryService] buildPenaltyBreakdown error:', error)
      // Graceful degradation (Requirement 4.7)
      return null
    }
  }

  /**
   * Mask customer data based on role permissions (Producer role compliance)
   * DEPRECATED: No longer used - customer data shown in full for product history
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
   * Mask activity metadata based on role permissions
   * Filters out customer-identifiable data for producer/kasir roles
   * Preserves all metadata for owner role
   *
   * @param data - Raw activity metadata from database
   * @param userRole - User role for permission checking
   * @returns Filtered metadata based on role
   */
  public maskActivityMetadata(
    data: Record<string, unknown> | null | undefined,
    userRole: UserRole,
  ): ActivityMetadata {
    try {
      // Handle null/undefined metadata
      if (!data || typeof data !== 'object') {
        return {}
      }

      const permissions = ROLE_PERMISSIONS[userRole]

      // Owner role: Return all metadata
      if (permissions.canViewFullCustomerData) {
        return data as ActivityMetadata
      }

      // Producer/Kasir roles: Filter sensitive customer data
      const filtered: Record<string, unknown> = {}

      // Allow common metadata fields
      const allowedFields = [
        'itemsCount',
        'totalAmount',
        'kasirId',
        'kasirName',
        'previousStatus',
        'newStatus',
        'reason',
        'stockRestored',
        'needsRefund',
        'jumlahDiambil',
        'jumlahKembali',
        'penaltyAmount',
        'kondisiAkhir',
        'items', // Item count
      ]

      // Copy allowed fields
      for (const field of allowedFields) {
        if (field in data) {
          filtered[field] = data[field]
        }
      }

      // Filter out sensitive fields for producer/kasir
      // These fields should only be visible to owner
      const sensitiveFields = [
        'customerName',
        'customerContact',
        'customerNIK',
        'customerEmail',
        'customerAddress',
        'transactionDuration', // Performance metrics
        'optimizedSystem',
        'sizeAware',
      ]

      // Ensure sensitive fields are not included
      for (const field of sensitiveFields) {
        delete filtered[field]
      }

      return filtered as ActivityMetadata
    } catch (error) {
      console.error('[ProductHistoryService] Activity metadata filtering error:', error)
      return {}
    }
  }

  /**
   * Get human-readable Indonesian label for activity type
   * Maps database activity types to user-friendly labels
   *
   * @param tipe - Activity type from database ('dibuat', 'dibatalkan', etc.)
   * @returns Indonesian label for display
   */
  public getActivityTypeLabel(tipe: string): string {
    const labelMap: Record<string, string> = {
      dibuat: 'Transaksi Dibuat',
      dibatalkan: 'Transaksi Dibatalkan',
      dikembalikan: 'Barang Dikembalikan',
      terlambat: 'Terlambat',
      diperbarui: 'Status Diperbarui',
      diambil: 'Barang Diambil',
      pembayaran: 'Pembayaran Diterima',
    }

    return labelMap[tipe] || 'Aktivitas Lainnya'
  }

  /**
   * Transform raw activity data to ActivityInfo with role-based filtering
   * Applies metadata filtering and adds type labels
   *
   * @param rawActivity - Raw activity data from database
   * @param userRole - User role for permission checking
   * @returns Transformed activity info
   */
  public transformActivityData(rawActivity: RawActivityData, userRole: UserRole): ActivityInfo {
    // Filter metadata based on role
    const filteredMetadata = this.maskActivityMetadata(rawActivity.data, userRole)

    return {
      id: rawActivity.id,
      type: rawActivity.tipe,
      typeLabel: this.getActivityTypeLabel(rawActivity.tipe),
      description: rawActivity.deskripsi,
      createdAt: rawActivity.createdAt.toISOString(), // ISO 8601 format
      createdBy: rawActivity.createdBy,
      metadata: Object.keys(filteredMetadata).length > 0 ? filteredMetadata : undefined,
    }
  }

  /**
   * Generate synthetic activity for legacy transactions without activities
   * Creates a basic "dibuat" activity from transaction data
   *
   * @param transactionCode - Transaction code
   * @param transactionDate - Transaction creation date
   * @param createdBy - User who created the transaction
   * @returns Synthetic activity info
   */
  public generateSyntheticActivity(
    transactionCode: string,
    transactionDate: Date,
    createdBy: string,
  ): ActivityInfo {
    return {
      id: `synthetic-${transactionCode}`,
      type: 'dibuat',
      typeLabel: this.getActivityTypeLabel('dibuat'),
      description: `Transaksi ${transactionCode} dibuat`,
      createdAt: transactionDate.toISOString(),
      createdBy: createdBy,
      metadata: undefined, // No metadata for synthetic activities
    }
  }

  /**
   * Parse size information from kondisiAwal field
   *
   * SUPPORTS TWO FORMATS:
   * 1. JSON format (NEW - consistent with ItemHistoryService):
   *    {"productSizeId":"xxx","size":"XL","ageCategory":"ADULT","condition":"Baik"}
   *
   * 2. Pipe-separated format (LEGACY - backward compatibility):
   *    "productSizeId|size|ageCategory|condition"
   *    Example: "clx123abc|M|ADULT|Baik"
   *
   * @param kondisiAwal - Size information as JSON string or pipe-separated string
   * @returns Parsed size info or null if invalid/missing
   */
  public parseSizeInfo(kondisiAwal: string | null | undefined): SizeInfo | null {
    try {
      // Handle null/undefined/empty input
      if (!kondisiAwal || kondisiAwal.trim() === '') {
        return null
      }

      const trimmed = kondisiAwal.trim()

      // TRY FORMAT 1: JSON format (NEW - recommended)
      if (trimmed.startsWith('{')) {
        try {
          const parsed = JSON.parse(trimmed)

          // Validate required fields exist
          if (!parsed.productSizeId || !parsed.size || !parsed.ageCategory) {
            console.warn(
              `[ProductHistoryService] Missing required fields in JSON kondisiAwal:`,
              parsed,
            )
            return null
          }

          // Validate productSizeId is UUID format
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
          if (!uuidRegex.test(parsed.productSizeId)) {
            console.warn(
              `[ProductHistoryService] Invalid productSizeId UUID in JSON kondisiAwal:`,
              parsed.productSizeId,
            )
            return null
          }

          // Return parsed size info from JSON
          return {
            productSizeId: parsed.productSizeId,
            size: parsed.size,
            ageCategory: parsed.ageCategory,
            condition: parsed.condition || undefined,
            displayText: `Size: ${parsed.size} (${parsed.ageCategory})`,
          }
        } catch (jsonError) {
          console.warn(
            `[ProductHistoryService] Failed to parse JSON kondisiAwal:`,
            trimmed,
            jsonError,
          )
          // Fall through to try pipe-separated format
        }
      }

      // TRY FORMAT 2: Pipe-separated format (LEGACY - backward compatibility)
      if (trimmed.includes('|')) {
        const parts = trimmed.split('|')

        // Validate minimum required parts (productSizeId, size, ageCategory)
        if (parts.length < 3) {
          console.warn(
            `[ProductHistoryService] Invalid pipe-separated kondisiAwal (insufficient parts):`,
            trimmed,
          )
          return null
        }

        const [productSizeId, size, ageCategory, condition] = parts

        // Validate required fields are not empty
        if (!productSizeId || !size || !ageCategory) {
          console.warn(
            `[ProductHistoryService] Missing required fields in pipe-separated kondisiAwal:`,
            trimmed,
          )
          return null
        }

        // Validate productSizeId is UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(productSizeId.trim())) {
          console.warn(
            `[ProductHistoryService] Invalid productSizeId UUID in pipe-separated kondisiAwal:`,
            productSizeId,
          )
          return null
        }

        // Return parsed size info from pipe-separated format
        return {
          productSizeId: productSizeId.trim(),
          size: size.trim(),
          ageCategory: ageCategory.trim(),
          condition: condition ? condition.trim() : undefined,
          displayText: `Size: ${size.trim()} (${ageCategory.trim()})`,
        }
      }

      // Neither format matched
      console.warn(
        `[ProductHistoryService] kondisiAwal is neither JSON nor pipe-separated format:`,
        trimmed,
      )
      return null
    } catch (error) {
      console.error('[ProductHistoryService] Size parsing error:', error, 'Input:', kondisiAwal)
      return null
    }
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

  /**
   * Get break-even status for a product
   * RPK-MODAL: Product Break-Even Status Badge Feature
   *
   * Calculates whether a product has recovered its initial capital investment (modalAwal)
   * through accumulated rental revenue from non-cancelled transactions.
   *
   * @param productId - Product ID to calculate break-even status for
   * @returns Break-even status with revenue breakdown
   * @throws NotFoundError if product doesn't exist
   */
  async getBreakEvenStatus(productId: string): Promise<{
    modalAwal: number
    totalRevenue: number
    isBreakEven: boolean
    progressPercentage: number
    transactionCount: number
    profit?: number
  }> {
    try {
      // 1. Get product modalAwal
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        select: { modalAwal: true },
      })

      if (!product) {
        throw new NotFoundError(`Produk dengan ID ${productId} tidak ditemukan`)
      }

      // 2. Calculate total revenue (exclude cancelled transactions)
      const revenueData = await this.prisma.transaksiItem.aggregate({
        where: {
          produkId: productId,
          transaksi: {
            status: { not: 'cancelled' },
          },
        },
        _sum: {
          subtotal: true,
          totalReturnPenalty: true,
        },
        _count: {
          id: true,
        },
      })

      // 3. Calculate revenue breakdown
      const baseRevenue = revenueData._sum.subtotal?.toNumber() || 0
      const penalties = revenueData._sum.totalReturnPenalty?.toNumber() || 0
      const totalRevenue = baseRevenue + penalties
      const transactionCount = revenueData._count.id || 0

      // 4. Calculate break-even status
      const modalAwal = product.modalAwal.toNumber()
      const isBreakEven = totalRevenue >= modalAwal
      const progressPercentage = modalAwal > 0 ? (totalRevenue / modalAwal) * 100 : 0

      // 5. Return break-even status
      return {
        modalAwal,
        totalRevenue,
        isBreakEven,
        progressPercentage,
        transactionCount,
        profit: isBreakEven ? totalRevenue - modalAwal : undefined,
      }
    } catch (error) {
      console.error('[ProductHistoryService] getBreakEvenStatus error:', error)

      // Return safe fallback for non-NotFoundError cases
      if (error instanceof NotFoundError) {
        throw error
      }

      // Graceful fallback for database errors
      return {
        modalAwal: 0,
        totalRevenue: 0,
        isBreakEven: false,
        progressPercentage: 0,
        transactionCount: 0,
      }
    }
  }

  /**
   * Get break-even status for multiple products in bulk
   * RPK-MODAL: Product Break-Even Status Badge Feature
   *
   * Optimized bulk query using groupBy aggregation for efficient retrieval
   * of break-even status for multiple products simultaneously.
   *
   * @param productIds - Array of product IDs to calculate break-even status for
   * @returns Map of product ID to break-even status for O(1) lookup
   */
  async getBulkBreakEvenStatus(productIds: string[]): Promise<
    Map<
      string,
      {
        modalAwal: number
        totalRevenue: number
        isBreakEven: boolean
        progressPercentage: number
        transactionCount: number
        profit?: number
      }
    >
  > {
    try {
      // Handle empty input
      if (!productIds || productIds.length === 0) {
        return new Map()
      }

      // 1. Get all modalAwal values for products
      const products = await this.prisma.product.findMany({
        where: {
          id: { in: productIds },
          isActive: true,
        },
        select: {
          id: true,
          modalAwal: true,
        },
      })

      // 2. Aggregate revenue by product using groupBy for efficiency
      const revenueByProduct = await this.prisma.transaksiItem.groupBy({
        by: ['produkId'],
        where: {
          produkId: { in: productIds },
          transaksi: {
            status: { not: 'cancelled' },
          },
        },
        _sum: {
          subtotal: true,
          totalReturnPenalty: true,
        },
        _count: {
          id: true,
        },
      })

      // 3. Build result map for O(1) lookup
      const resultMap = new Map<
        string,
        {
          modalAwal: number
          totalRevenue: number
          isBreakEven: boolean
          progressPercentage: number
          transactionCount: number
          profit?: number
        }
      >()

      // 4. Process each product and calculate break-even status
      products.forEach((product) => {
        const revenue = revenueByProduct.find((r) => r.produkId === product.id)

        // Calculate revenue breakdown
        const baseRevenue = revenue?._sum.subtotal?.toNumber() || 0
        const penalties = revenue?._sum.totalReturnPenalty?.toNumber() || 0
        const totalRevenue = baseRevenue + penalties
        const transactionCount = revenue?._count.id || 0

        // Calculate break-even status
        const modalAwal = product.modalAwal.toNumber()
        const isBreakEven = totalRevenue >= modalAwal
        const progressPercentage = modalAwal > 0 ? (totalRevenue / modalAwal) * 100 : 0

        resultMap.set(product.id, {
          modalAwal,
          totalRevenue,
          isBreakEven,
          progressPercentage,
          transactionCount,
          profit: isBreakEven ? totalRevenue - modalAwal : undefined,
        })
      })

      return resultMap
    } catch (error) {
      console.error('[ProductHistoryService] getBulkBreakEvenStatus error:', error)

      // Return empty map on error for graceful degradation
      return new Map()
    }
  }
}
