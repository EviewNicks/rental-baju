/**
 * TransactionHistoryService - Availability Product View
 * Service layer for transaction history retrieval and caching
 * Supports 5-minute caching per product size for optimal performance
 */

import { PrismaClient } from '@prisma/client'
import type { 
  TransactionHistoryItem, 
  TransactionHistoryOptions,
  CachedTransactionHistory 
} from '../types/availability'

export class TransactionHistoryService {
  private cache = new Map<string, CachedTransactionHistory>()
  private readonly CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

  constructor(private prisma: PrismaClient) {}

  /**
   * Get transaction history for a specific product size with caching
   * REVISED: Only returns 'active' and 'diambil' status transactions
   */
  async getProductSizeHistory(
    productSizeId: string,
    options: TransactionHistoryOptions = {}
  ): Promise<TransactionHistoryItem[]> {
    const cacheKey = this.generateCacheKey(productSizeId, options)
    
    // Check cache first
    const cached = this.getCachedData(cacheKey)
    if (cached) {
      return cached.data
    }

    // Fetch from database
    const data = await this.fetchTransactionHistory(productSizeId, options)
    
    // Store in cache
    this.setCachedData(cacheKey, data)
    
    return data
  }

  /**
   * Fetch transaction history from database
   * REVISED: Filter only 'active' and 'diambil' status
   */
  private async fetchTransactionHistory(
    productSizeId: string,
    options: TransactionHistoryOptions
  ): Promise<TransactionHistoryItem[]> {
    const {
      statuses = ['active', 'diambil'], // REVISED: Default to active and diambil only
      limit = 50,
      sortBy = 'date_proximity'
    } = options

    // Debug logging for troubleshooting
    console.log('[ItemHistoryService] Fetching transaction history:', {
      productSizeId,
      statuses,
      limit,
      sortBy,
      timestamp: new Date().toISOString()
    })

    try {
      // Query transactions that use this product size
      // Format kondisiAwal: JSON string with productSizeId field
      // Example: {"productSizeId":"81335d70-ba9d-4c40-8a30-8efed664beaf","size":"M","ageCategory":"ADULT","condition":"Baik","linkedSarung":null}
      const jsonSearchPattern = `"productSizeId":"${productSizeId}"`

      console.log('[ItemHistoryService] Query pattern:', {
        productSizeId,
        jsonSearchPattern,
        expectedFormat: '{"productSizeId":"uuid","size":"M","ageCategory":"ADULT","condition":"Baik","linkedSarung":null}'
      })

      const transactions = await this.prisma.transaksi.findMany({
        where: {
          status: {
            in: statuses
          },
          items: {
            some: {
              // Find transactions that have items with this productSizeId
              // Using string_contains to match JSON field in kondisiAwal
              kondisiAwal: {
                contains: jsonSearchPattern
              }
            }
          }
        },
        include: {
          items: {
            where: {
              kondisiAwal: {
                contains: jsonSearchPattern
              }
            },
            include: {
              produk: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        take: limit,
        orderBy: sortBy === 'date_proximity'
          ? { tglMulai: 'desc' } // Closest to current date first
          : sortBy === 'date_asc'
          ? { tglMulai: 'asc' }
          : { tglMulai: 'desc' }
      })

      // Debug: Log query results
      console.log('[ItemHistoryService] Query results:', {
        productSizeId,
        transactionsFound: transactions.length,
        transactionCodes: transactions.map(t => t.kode),
        timestamp: new Date().toISOString()
      })

      // Debug: Log sample kondisiAwal values for verification
      if (transactions.length > 0) {
        const sampleItems = transactions.flatMap(t => t.items)
        console.log('[ItemHistoryService] Sample kondisiAwal values:', {
          productSizeId,
          sampleCount: Math.min(3, sampleItems.length),
          samples: sampleItems.slice(0, 3).map(item => ({
            itemId: item.id,
            kondisiAwal: item.kondisiAwal,
            parsedKondisiAwal: item.kondisiAwal ? (() => {
              try {
                return JSON.parse(item.kondisiAwal)
              } catch {
                return 'PARSE_FAILED'
              }
            })() : null
          })),
          timestamp: new Date().toISOString()
        })
      }

      // Transform to TransactionHistoryItem format
      const historyItems: TransactionHistoryItem[] = []

      for (const transaction of transactions) {
        for (const item of transaction.items) {
          const historyItem: TransactionHistoryItem = {
            transactionCode: transaction.kode,
            quantity: item.jumlah,
            startDate: transaction.tglMulai,
            endDate: transaction.tglSelesai || new Date(),
            status: transaction.status as 'active' | 'diambil',
            displayText: this.formatTransactionDisplay(
              transaction.kode,
              item.jumlah,
              transaction.tglMulai,
              transaction.tglSelesai
            )
          }
          historyItems.push(historyItem)
        }
      }

      // Sort by date proximity if requested
      if (sortBy === 'date_proximity') {
        historyItems.sort((a, b) => {
          const now = new Date()
          const aProximity = Math.abs(a.startDate.getTime() - now.getTime())
          const bProximity = Math.abs(b.startDate.getTime() - now.getTime())
          return aProximity - bProximity
        })
      }

      return historyItems

    } catch (error) {
      console.error('[ItemHistoryService] Failed to fetch transaction history:', {
        productSizeId,
        options,
        jsonSearchPattern: `"productSizeId":"${productSizeId}"`,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      })
      return []
    }
  }

  /**
   * Format transaction display text as "TXN-001 (2 item) untuk 4-7 Feb"
   */
  private formatTransactionDisplay(
    transactionCode: string,
    quantity: number,
    startDate: Date,
    endDate: Date | null
  ): string {
    const formatDate = (date: Date) => {
      const day = date.getDate()
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
        'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
      ]
      const month = monthNames[date.getMonth()]
      return `${day} ${month}`
    }

    const startFormatted = formatDate(startDate)
    const endFormatted = endDate ? formatDate(endDate) : formatDate(new Date())
    
    return `${transactionCode} (${quantity} item) untuk ${startFormatted}-${endFormatted}`
  }

  /**
   * Calculate date proximity to current date (for sorting)
   */
  private calculateDateProximity(date: Date): number {
    const now = new Date()
    return Math.abs(date.getTime() - now.getTime())
  }

  /**
   * Generate cache key for product size and options
   */
  private generateCacheKey(productSizeId: string, options: TransactionHistoryOptions): string {
    const optionsStr = JSON.stringify(options)
    return `${productSizeId}:${optionsStr}`
  }

  /**
   * Get cached data if valid and not expired
   */
  private getCachedData(cacheKey: string): CachedTransactionHistory | null {
    const cached = this.cache.get(cacheKey)
    
    if (!cached) {
      return null
    }

    // Check if cache is expired
    if (new Date() > cached.expiresAt) {
      this.cache.delete(cacheKey)
      return null
    }

    return cached
  }

  /**
   * Store data in cache with TTL
   */
  private setCachedData(cacheKey: string, data: TransactionHistoryItem[]): void {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + this.CACHE_TTL_MS)

    const cached: CachedTransactionHistory = {
      productSizeId: cacheKey.split(':')[0],
      data,
      cachedAt: now,
      expiresAt,
      version: 1
    }

    this.cache.set(cacheKey, cached)
  }

  /**
   * Clear cache for specific product size or all cache
   */
  async clearCache(productSizeId?: string): Promise<void> {
    if (productSizeId) {
      // Clear cache for specific product size
      const keysToDelete = Array.from(this.cache.keys()).filter(key => 
        key.startsWith(productSizeId)
      )
      keysToDelete.forEach(key => this.cache.delete(key))
    } else {
      // Clear all cache
      this.cache.clear()
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats(): {
    totalEntries: number
    expiredEntries: number
    validEntries: number
  } {
    const now = new Date()
    let expiredEntries = 0
    let validEntries = 0

    for (const cached of this.cache.values()) {
      if (now > cached.expiresAt) {
        expiredEntries++
      } else {
        validEntries++
      }
    }

    return {
      totalEntries: this.cache.size,
      expiredEntries,
      validEntries
    }
  }
}

/**
 * Factory function to create TransactionHistoryService instance
 */
export const createTransactionHistoryService = (prisma: PrismaClient): TransactionHistoryService => {
  return new TransactionHistoryService(prisma)
}