/**
 * AutoSelectionManager - Task 5: Return-Pairing Integration
 *
 * Simplified pairing manager that works with linkedSarung metadata.
 * Key features:
 * - Detects jas items with linkedSarung data
 * - Provides pairing information for display formatting
 * - No auto-selection logic needed (sarung is metadata, not separate item)
 */

export interface PairingInfo {
  isPaired: boolean
  isJas: boolean
  linkedSarungData?: {
    productId: string
    productSizeId: string
    quantity: number
    product?: {
      name: string
      code: string
    }
  }
  displayName?: string
}

export class AutoSelectionManager {
  private jasItems: Map<
    string,
    {
      productId: string
      productSizeId: string
      quantity: number
      product?: {
        name: string
        code: string
      }
    }
  > // jasItemId -> linkedSarung data

  constructor(
    transactionItems: Array<{
      id: string
      kondisiAwal: string | null
      linkedSarung?: {
        productId: string
        productSizeId: string
        quantity: number
        product?: {
          id: string
          code: string
          name: string
          category?: string
          imageUrl?: string
        }
        selectedSize?: {
          id: string
          size: string
          ageCategory: string
        }
      } | null
    }>,
  ) {
    this.jasItems = new Map()
    this.buildPairingMap(transactionItems)
  }

  /**
   * Build pairing map from transaction items
   * Uses linkedSarung data from API response for jas-sarung pairing
   */
  private buildPairingMap(
    transactionItems: Array<{
      id: string
      kondisiAwal: string | null
      linkedSarung?: {
        productId: string
        productSizeId: string
        quantity: number
        product?: {
          id: string
          code: string
          name: string
          category?: string
          imageUrl?: string
        }
        selectedSize?: {
          id: string
          size: string
          ageCategory: string
        }
      } | null
    }>,
  ) {
    for (const item of transactionItems) {
      // ✅ TASK 6: Use linkedSarung data from API response instead of parsing kondisiAwal
      if (item.linkedSarung) {
        // This is a jas with linked sarung metadata from API
        this.jasItems.set(item.id, {
          productId: item.linkedSarung.productId,
          productSizeId: item.linkedSarung.productSizeId,
          quantity: item.linkedSarung.quantity,
          product: item.linkedSarung.product
            ? {
                name: item.linkedSarung.product.name,
                code: item.linkedSarung.product.code,
              }
            : undefined,
        })
      }
    }
  }

  /**
   * Get pairing information for an item
   */
  getPairingInfo(itemId: string): PairingInfo {
    const linkedSarungData = this.jasItems.get(itemId)
    const isJas = !!linkedSarungData

    return {
      isPaired: isJas,
      isJas,
      linkedSarungData,
      displayName: isJas ? 'Jas (dengan Sarung)' : undefined,
    }
  }

  /**
   * Check if there are any paired items in the transaction
   */
  hasPairedItems(): boolean {
    return this.jasItems.size > 0
  }

  /**
   * Get all pairing information for display
   */
  getAllPairings(): Array<{
    jasId: string
    linkedSarungData: {
      productId: string
      productSizeId: string
      quantity: number
      product?: {
        name: string
        code: string
      }
    }
  }> {
    return Array.from(this.jasItems.entries()).map(([jasId, linkedSarungData]) => ({
      jasId,
      linkedSarungData,
    }))
  }
}
