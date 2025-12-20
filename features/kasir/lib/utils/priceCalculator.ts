/**
 * Frontend Price Calculator for Transaction Enhancements
 * Handles duration multipliers and discount calculations
 */

import type { ProductSelection } from '../../types'

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
    adjustedPrice: number
  }>
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
   * Calculate transaction total with duration multipliers and discounts
   * Frontend version for real-time calculations
   */
  static calculateTransactionTotalWithEnhancements(params: PriceCalculationParams): PriceCalculationResult {
    const { items, duration, discountType, discountValue } = params
    
    // Duration multiplier logic
    const durationMultiplier = duration === 7 ? 1.5 : 1.0
    
    // Calculate item totals with duration multiplier
    const itemCalculations = items.map(item => {
      const basePrice = item.product.pricePerDay * item.quantity
      const adjustedPrice = basePrice * durationMultiplier
      
      return {
        produkId: item.product.id,
        productSizeId: item.productSizeId,
        jumlah: item.quantity,
        durasi: duration,
        basePrice,
        adjustedPrice
      }
    })
    
    // Calculate subtotal
    const subtotal = itemCalculations.reduce((sum, item) => sum + item.adjustedPrice, 0)
    
    // Calculate discount amount
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
      itemCalculations
    }
  }
  
  /**
   * Validate discount input
   */
  static validateDiscount(
    discountType: 'percent' | 'nominal' | null,
    discountValue: number | null,
    subtotal: number
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
  static validatePaymentAmount(amount: number, totalAmount: number): { isValid: boolean; error?: string } {
    if (amount < 0) {
      return { isValid: false, error: 'Jumlah pembayaran tidak boleh negatif' }
    }
    if (amount > totalAmount * 2) { // Allow overpayment up to 2x for change
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
}