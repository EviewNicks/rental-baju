/**
 * Frontend Price Calculator for Transaction Enhancements
 * Handles duration multipliers, discount calculations, and jas-sarung pairing
 */

import type { ProductSelection } from '../../types'
import { isEligibleForFreeSarung } from './jasSarungUtils'

export interface PriceCalculationResult {
  subtotal: number
  discountAmount: number
  finalTotal: number
  duration: 4 | 7
  durationMultiplier: number
  itemCalculations: Array<{
    produkId: string
    productSizeId?: string
    jumlah: number
    durasi: 4 | 7
    basePrice: number
    finalPrice: number // UPDATED: Changed from adjustedPrice to finalPrice
    isEligibleForFreeSarung: boolean
    linkedSarungPrice: number // Always 0 for linked sarung
  }>
  pairingInfo: {
    totalJasItems: number
    totalLinkedSarung: number
    totalSarungSavings: number // Amount saved from free sarung
  }
}

export interface PriceCalculationParams {
  items: ProductSelection[]
  duration: 4 | 7
  discountType?: 'percent' | 'nominal' | null
  discountValue?: number | null
}

// Legacy types for backward compatibility
export interface TransactionItem {
  produkId: string
  productSizeId?: string
  jumlah: number
  hargaSewa: number
}

export interface EnhancedTransactionItem extends TransactionItem {
  durasi: 4 | 7
}

// Legacy alias for PriceCalculationResult
export type EnhancedPriceCalculationResult = PriceCalculationResult

export class PriceCalculator {
  /**
   * Calculate transaction total with duration multipliers, discounts, and jas-sarung pairing
   * Frontend version for real-time calculations
   * ENHANCED: Now supports manual price adjustments with priority logic
   */
  static calculateTransactionTotalWithEnhancements(
    params: PriceCalculationParams,
  ): PriceCalculationResult {
    const { items, duration, discountType, discountValue } = params

    // Duration multiplier logic
    const durationMultiplier = duration === 7 ? 1.5 : 1.0

    // Track pairing information
    let totalJasItems = 0
    let totalLinkedSarung = 0
    let totalSarungSavings = 0

    // Calculate item totals with duration multiplier, pairing logic, and manual adjustments
    const itemCalculations = items.map((item) => {
      const isEligibleForSarung = isEligibleForFreeSarung(item.product)

      // ✅ UPDATED: Manual price adjustment priority logic with adjustment model
      let finalPrice: number
      let basePrice: number

      if (item.manualPriceAdjustment?.isManuallyAdjusted) {
        // Priority 1: Use manual adjustment if exists
        basePrice = item.manualPriceAdjustment.originalPrice
        finalPrice = basePrice + item.manualPriceAdjustment.adjustmentAmount
      } else {
        // Priority 2: Use automatic calculation (existing logic)
        basePrice = item.product.pricePerDay * item.quantity
        finalPrice = basePrice * durationMultiplier
      }

      // Track eligible items
      if (isEligibleForSarung) {
        totalJasItems += item.quantity
      }

      // Calculate linked sarung savings (what would have been charged)
      let linkedSarungPrice = 0
      if (item.linkedSarung) {
        totalLinkedSarung += item.linkedSarung.quantity
        // Linked sarung is always free - this is the core pairing logic
        linkedSarungPrice = 0
        // Note: Sarung savings calculation would need product data lookup
        // This will be calculated properly when we have access to full product data
        totalSarungSavings += 0
      }

      return {
        produkId: item.product.id,
        productSizeId: item.productSizeId,
        jumlah: item.quantity,
        durasi: duration,
        basePrice,
        finalPrice,
        isEligibleForFreeSarung: isEligibleForSarung,
        linkedSarungPrice,
      }
    })

    // Calculate subtotal (excluding linked sarung prices)
    const subtotal = itemCalculations.reduce(
      (sum, item) => sum + item.finalPrice + item.linkedSarungPrice,
      0,
    )

    // Calculate discount amount (based on manually adjusted prices)
    let discountAmount = 0
    if (discountType && discountValue && discountValue > 0) {
      if (discountType === 'percent') {
        discountAmount = (subtotal * discountValue) / 100
      } else if (discountType === 'nominal') {
        // Prevent discount from exceeding subtotal (negative total)
        discountAmount = Math.min(discountValue, subtotal)
      }
    }

    // Calculate final total
    const finalTotal = Math.max(0, subtotal - discountAmount) // Ensure non-negative

    return {
      subtotal,
      discountAmount,
      finalTotal,
      duration,
      durationMultiplier,
      itemCalculations,
      pairingInfo: {
        totalJasItems,
        totalLinkedSarung,
        totalSarungSavings,
      },
    }
  }

  /**
   * Validate manual price adjustment
   * NEW: Validation for manual price adjustments
   * Note: Max multiplier validation removed to allow flexible pricing
   */
  static validateManualPriceAdjustment(
    originalPrice: number,
    adjustedPrice: number,
  ): { isValid: boolean; error?: string } {
    if (adjustedPrice < 0) {
      return { isValid: false, error: 'Harga tidak boleh negatif' }
    }

    // Removed: maxMultiplier validation to allow unlimited adjustment
    // Previously: adjustedPrice could not exceed originalPrice * 10

    return { isValid: true }
  }

  /**
   * Calculate original price for manual adjustment
   * NEW: Helper to get the original automatic price
   */
  static calculateOriginalPrice(item: ProductSelection, duration: 4 | 7): number {
    const durationMultiplier = duration === 7 ? 1.5 : 1.0
    return item.product.pricePerDay * item.quantity * durationMultiplier
  }

  /**
   * Format currency for display
   * Enhanced with manual adjustment indicator
   */
  static formatPriceWithAdjustment(
    currentPrice: number,
    originalPrice?: number,
    isManuallyAdjusted?: boolean,
  ): string {
    const formattedPrice = this.formatToRupiah(currentPrice)

    if (isManuallyAdjusted && originalPrice && originalPrice !== currentPrice) {
      const formattedOriginal = this.formatToRupiah(originalPrice)
      return `${formattedPrice} (Adjusted from: ${formattedOriginal})`
    }

    return formattedPrice
  }
  static validateDiscount(
    discountType: 'percent' | 'nominal' | null,
    discountValue: number | null,
    subtotal: number,
  ): { isValid: boolean; error?: string } {
    if (!discountType || discountValue === null || discountValue === 0) {
      return { isValid: true } // No discount is valid
    }

    if (discountValue < 0) {
      return { isValid: false, error: 'Nilai diskon tidak boleh negatif' }
    }

    if (discountType === 'percent') {
      if (discountValue > 100) {
        return { isValid: false, error: 'Diskon persentase tidak boleh lebih dari 100%' }
      }
    } else if (discountType === 'nominal') {
      if (discountValue > subtotal) {
        return { isValid: false, error: 'Diskon nominal tidak boleh melebihi subtotal' }
      }
    }

    return { isValid: true }
  }

  // Legacy methods for backward compatibility with pembayaranService
  static validatePaymentAmount(
    amount: number,
    totalAmount: number,
  ): { isValid: boolean; error?: string } {
    if (amount < 0) {
      return { isValid: false, error: 'Jumlah pembayaran tidak boleh negatif' }
    }
    if (amount > totalAmount * 2) {
      // Allow overpayment up to 2x for change
      return { isValid: false, error: 'Jumlah pembayaran terlalu besar' }
    }
    return { isValid: true }
  }

  static calculateRemainingPayment(totalAmount: number, paidAmount: number): number {
    return Math.max(0, totalAmount - paidAmount)
  }

  static formatToRupiah(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  static calculatePaymentPercentage(paidAmount: number, totalAmount: number): number {
    if (totalAmount === 0) return 0
    return Math.min(100, (paidAmount / totalAmount) * 100)
  }

  static isFullyPaid(paidAmount: number, totalAmount: number): boolean {
    return paidAmount >= totalAmount
  }

  /**
   * Calculate price for a single jas-sarung pairing
   * Sarung is always free when paired with jas
   */
  static calculatePairingPrice(jasItem: ProductSelection, duration: 4 | 7): number {
    const durationMultiplier = duration === 7 ? 1.5 : 1.0

    // Jas price is charged normally
    const jasPrice = jasItem.product.pricePerDay * jasItem.quantity * durationMultiplier

    // Linked sarung is always free (price = 0)
    const sarungPrice = 0

    return jasPrice + sarungPrice
  }

  /**
   * Calculate total savings from free sarung pairings
   * Enhanced version that can work with product data when available
   */
  static calculateSarungSavings(
    items: ProductSelection[],
    duration: 4 | 7,
    sarungPriceMap?: Map<string, number>,
  ): number {
    const durationMultiplier = duration === 7 ? 1.5 : 1.0

    return items.reduce((totalSavings, item) => {
      if (item.linkedSarung) {
        // Try to get sarung price from provided map or fallback to 0
        const sarungBasePrice = sarungPriceMap?.get(item.linkedSarung.productId) || 0
        const sarungSavings = sarungBasePrice * item.linkedSarung.quantity * durationMultiplier
        return totalSavings + sarungSavings
      }
      return totalSavings
    }, 0)
  }

  /**
   * Validate pairing data for price calculation
   */
  static validatePairingData(item: ProductSelection): { isValid: boolean; error?: string } {
    if (!item.linkedSarung) {
      return { isValid: true } // No pairing is valid
    }

    // Check if product is eligible for free sarung
    if (!isEligibleForFreeSarung(item.product)) {
      return {
        isValid: false,
        error: 'Sarung hanya dapat dipasangkan dengan produk yang eligible',
      }
    }

    // Check sarung quantity
    if (item.linkedSarung.quantity > item.quantity) {
      return {
        isValid: false,
        error: 'Jumlah sarung tidak boleh melebihi jumlah jas',
      }
    }

    if (item.linkedSarung.quantity <= 0) {
      return {
        isValid: false,
        error: 'Jumlah sarung harus lebih dari 0',
      }
    }

    return { isValid: true }
  }

  /**
   * Calculate subtotal excluding linked sarung prices
   * Ensures sarung prices are always excluded from calculations
   */
  static calculateSubtotalExcludingSarung(items: ProductSelection[], duration: 4 | 7): number {
    const durationMultiplier = duration === 7 ? 1.5 : 1.0

    return items.reduce((subtotal, item) => {
      // Only charge for the main product (jas), not linked sarung
      const itemPrice = item.product.pricePerDay * item.quantity * durationMultiplier
      return subtotal + itemPrice
    }, 0)
  }

  /**
   * Get pairing summary for display purposes
   */
  static getPairingSummary(items: ProductSelection[]): {
    totalPairings: number
    jasItems: ProductSelection[]
    nonJasItems: ProductSelection[]
    pairingDetails: Array<{
      jasProduct: string
      sarungProduct: string | null
      jasQuantity: number
      sarungQuantity: number
    }>
  } {
    const jasItems: ProductSelection[] = []
    const nonJasItems: ProductSelection[] = []
    const pairingDetails: Array<{
      jasProduct: string
      sarungProduct: string | null
      jasQuantity: number
      sarungQuantity: number
    }> = []

    let totalPairings = 0

    items.forEach((item) => {
      if (isEligibleForFreeSarung(item.product)) {
        jasItems.push(item)

        if (item.linkedSarung) {
          totalPairings++
          pairingDetails.push({
            jasProduct: item.product.name,
            sarungProduct: item.linkedSarung.selectedSize?.productId || 'Unknown Sarung',
            jasQuantity: item.quantity,
            sarungQuantity: item.linkedSarung.quantity,
          })
        } else {
          pairingDetails.push({
            jasProduct: item.product.name,
            sarungProduct: null,
            jasQuantity: item.quantity,
            sarungQuantity: 0,
          })
        }
      } else {
        nonJasItems.push(item)
      }
    })

    return {
      totalPairings,
      jasItems,
      nonJasItems,
      pairingDetails,
    }
  }

  /**
   * Validate all pairing data in a transaction
   */
  static validateAllPairings(items: ProductSelection[]): {
    isValid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    items.forEach((item, index) => {
      const validation = this.validatePairingData(item)
      if (!validation.isValid && validation.error) {
        errors.push(`Item ${index + 1}: ${validation.error}`)
      }

      // Check for potential issues
      if (isEligibleForFreeSarung(item.product) && !item.linkedSarung) {
        warnings.push(
          `Item ${index + 1}: Produk "${item.product.name}" tidak dipasangkan dengan sarung`,
        )
      }
    })

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Calculate price breakdown for pairing display
   */
  static calculatePairingBreakdown(
    items: ProductSelection[],
    duration: 4 | 7,
  ): {
    jasTotal: number
    sarungTotal: number // Always 0 for linked sarung
    sarungSavings: number
    grandTotal: number
    itemBreakdowns: Array<{
      productName: string
      isJas: boolean
      quantity: number
      unitPrice: number
      totalPrice: number
      linkedSarung?: {
        name: string
        quantity: number
        originalPrice: number
        finalPrice: number // Always 0
      }
    }>
  } {
    const durationMultiplier = duration === 7 ? 1.5 : 1.0
    let jasTotal = 0
    let grandTotal = 0
    let sarungSavings = 0
    const itemBreakdowns: Array<{
      productName: string
      isJas: boolean
      quantity: number
      unitPrice: number
      totalPrice: number
      linkedSarung?: {
        name: string
        quantity: number
        originalPrice: number
        finalPrice: number
      }
    }> = []

    items.forEach((item) => {
      const isEligible = isEligibleForFreeSarung(item.product)
      const unitPrice = item.product.pricePerDay * durationMultiplier
      const totalPrice = unitPrice * item.quantity

      // Add to grand total (all items count)
      grandTotal += totalPrice

      if (isEligible) {
        jasTotal += totalPrice
      }

      const breakdown = {
        productName: item.product.name,
        isJas: isEligible,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
      }

      // Add linked sarung info if exists
      if (item.linkedSarung) {
        // For now, we'll use a placeholder price since we don't have access to sarung product data
        const sarungOriginalPrice = 0 // This would be fetched from product data in real implementation

        const breakdownWithSarung = {
          ...breakdown,
          linkedSarung: {
            name: 'Sarung', // This would be the actual sarung name
            quantity: item.linkedSarung.quantity,
            originalPrice: sarungOriginalPrice,
            finalPrice: 0, // Always free
          },
        }

        sarungSavings += sarungOriginalPrice * item.linkedSarung.quantity
        itemBreakdowns.push(breakdownWithSarung)
      } else {
        itemBreakdowns.push(breakdown)
      }
    })

    return {
      jasTotal,
      sarungTotal: 0, // Always 0 for linked sarung
      sarungSavings,
      grandTotal, // All items except linked sarung
      itemBreakdowns,
    }
  }
}
