/**
 * TransactionHistoryService - Availability Product View
 * Service layer for transaction history retrieval
 * NO CACHING: Direct database queries for accurate real-time data
 * PHASE 2: Aggregate all items by transaction code (ignore linkedSarung pairing)
 */

import { PrismaClient } from '@prisma/client'
import type { TransactionHistoryItem, TransactionHistoryOptions } from '../types/availability'

export class TransactionHistoryService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get transaction history for a specific product size
   * REVISED: Only returns 'active' and 'diambil' status transactions
   * NO CACHING: Always fetch fresh data from database
   * PHASE 2: Aggregate by transaction code only (no pairing separation)
   */
  async getProductSizeHistory(
    productSizeId: string,
    options: TransactionHistoryOptions = {},
  ): Promise<TransactionHistoryItem[]> {
    // Always fetch from database (no caching)
    const data = await this.fetchTransactionHistory(productSizeId, options)

    return data
  }

  /**
   * Fetch transaction history from database
   * PHASE 2: Group by transaction code ONLY (aggregate all items regardless of linkedSarung)
   */
  private async fetchTransactionHistory(
    productSizeId: string,
    options: TransactionHistoryOptions,
  ): Promise<TransactionHistoryItem[]> {
    const { statuses = ['active', 'diambil'], limit = 50, sortBy = 'date_proximity' } = options

    try {
      // CRITICAL FIX: Only match productSizeId at ROOT level, not in linkedSarung
      // Pattern: Match productSizeId at start of JSON or after comma
      // This excludes matches inside linkedSarung object
      const jsonSearchPattern = `"productSizeId":"${productSizeId}"`

      const orderBy =
        sortBy === 'date_proximity' || sortBy === 'date_desc'
          ? { transaksi: { tglMulai: 'desc' as const } }
          : { transaksi: { tglMulai: 'asc' as const } }

      const transaksiItems = await this.prisma.transaksiItem.findMany({
        where: {
          kondisiAwal: {
            contains: jsonSearchPattern,
          },
          transaksi: {
            status: {
              in: statuses,
            },
          },
        },
        select: {
          id: true,
          jumlah: true,
          kondisiAwal: true,
          transaksi: {
            select: {
              kode: true,
              status: true,
              tglMulai: true,
              tglSelesai: true,
            },
          },
          produk: {
            select: {
              name: true,
            },
          },
        },
        orderBy,
        take: limit,
      })

      // FILTER: Only keep items where productSizeId is at ROOT level (not in linkedSarung)
      // This ensures we only show history for the product itself, not where it appears as linkedSarung
      const rootLevelItems = transaksiItems.filter((item) => {
        try {
          // Handle null kondisiAwal
          if (!item.kondisiAwal) {
            console.warn('[ItemHistoryService] Item has null kondisiAwal:', {
              itemId: item.id,
              transactionCode: item.transaksi.kode,
            })
            return false
          }

          const kondisi = JSON.parse(item.kondisiAwal)

          // Check if productSizeId at root level matches
          const isRootMatch = kondisi.productSizeId === productSizeId

          return isRootMatch
        } catch (error) {
          console.error('[ItemHistoryService] Failed to parse kondisiAwal:', {
            itemId: item.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
          return false
        }
      })

      // DEDUPLICATION BEFORE GROUPING: Remove paired items to avoid double counting
      // Problem: Query returns BOTH Jas (with linkedSarung) AND Sarung (isPairedSarung) from same transaction
      // Solution: Keep only ONE item per (transactionCode + quantity) combination
      const seenPairs = new Set<string>()
      const deduplicatedItems = rootLevelItems.filter((item) => {
        const txnCode = item.transaksi.kode
        const quantity = item.jumlah

        // Create unique key: transactionCode + quantity
        // This identifies paired items (Jas + Sarung with same quantity in same transaction)
        const pairKey = `${txnCode}::${quantity}`

        if (seenPairs.has(pairKey)) {
          return false // Skip this duplicate
        }

        seenPairs.add(pairKey)
        return true // Keep first occurrence
      })

      // PHASE 2: Group by transaction code ONLY (after deduplication)
      // Now we aggregate items from same transaction without double counting
      const groupedByTransaction = deduplicatedItems.reduce(
        (acc, item) => {
          const txnCode = item.transaksi.kode
          const groupKey = txnCode

          if (!acc[groupKey]) {
            // First item for this transaction
            acc[groupKey] = {
              transactionCode: txnCode,
              quantity: item.jumlah,
              startDate: item.transaksi.tglMulai,
              endDate: item.transaksi.tglSelesai || new Date(),
              status: item.transaksi.status as 'active' | 'diambil',
              displayText: '',
            }
          } else {
            // Additional item for same transaction - aggregate quantity
            acc[groupKey].quantity += item.jumlah
          }

          return acc
        },
        {} as Record<string, TransactionHistoryItem>,
      )

      // Convert grouped object to array and set display text
      const historyItems: TransactionHistoryItem[] = Object.values(groupedByTransaction).map(
        (item) => ({
          ...item,
          displayText: this.formatTransactionDisplay(
            item.transactionCode,
            item.quantity,
            item.startDate,
            item.endDate,
          ),
        }),
      )

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
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
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
    endDate: Date | null,
  ): string {
    const formatDate = (date: Date) => {
      const day = date.getDate()
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'Mei',
        'Jun',
        'Jul',
        'Agu',
        'Sep',
        'Okt',
        'Nov',
        'Des',
      ]
      const month = monthNames[date.getMonth()]
      return `${day} ${month}`
    }

    const startFormatted = formatDate(startDate)
    const endFormatted = endDate ? formatDate(endDate) : formatDate(new Date())

    return `${transactionCode} (${quantity} item) untuk ${startFormatted}-${endFormatted}`
  }
}

/**
 * Factory function to create TransactionHistoryService instance
 */
export const createTransactionHistoryService = (
  prisma: PrismaClient,
): TransactionHistoryService => {
  return new TransactionHistoryService(prisma)
}
