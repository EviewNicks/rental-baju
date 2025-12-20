/**
 * Price Calculator Utilities - RPK-26 + Transaction Enhancements
 * Business logic for calculating rental prices and totals
 * Enhanced with duration packages and discount system
 */

import { Decimal } from '@prisma/client/runtime/library'

export interface TransactionItem {
  produkId: string
  jumlah: number
  durasi: number // Fixed at 4 for all transactions
  hargaSewa: number | Decimal
}

// Enhanced interface for new price calculation with duration and discount
export interface EnhancedTransactionItem {
  produkId: string
  productSizeId?: string // Optional for size-aware items
  jumlah: number
  durasi: 4 | 7 // Duration package: 4 or 7 days
  hargaSewa: number | Decimal
}

export interface PriceCalculationResult {
  subtotal: Decimal
  totalHarga: Decimal
  itemCalculations: Array<{
    produkId: string
    jumlah: number
    durasi: number
    hargaSewa: Decimal
    subtotal: Decimal
  }>
}

// Enhanced result with discount and duration multiplier information
export interface EnhancedPriceCalculationResult {
  subtotal: Decimal
  discountAmount: Decimal
  finalTotal: Decimal
  duration: 4 | 7
  durationMultiplier: number
  itemCalculations: Array<{
    produkId: string
    productSizeId?: string
    jumlah: number
    durasi: 4 | 7
    basePrice: Decimal
    adjustedPrice: Decimal // After duration multiplier
    hargaSewa: Decimal
    subtotal: Decimal
  }>
}

export interface PriceCalculationParams {
  items: Array<{
    produkId: string
    productSizeId?: string
    jumlah: number
    hargaSewa: number | Decimal
  }>
  duration: 4 | 7
  discountType?: 'percent' | 'nominal' | null
  discountValue?: number
}

export class PriceCalculator {
  /**
   * Calculate total price for transaction items (Legacy method)
   * New Formula: subtotal = hargaSewa * jumlah (fixed 4-day package)
   */
  static calculateTransactionTotal(items: TransactionItem[]): PriceCalculationResult {
    const itemCalculations = items.map((item) => {
      const hargaSewa = new Decimal(item.hargaSewa.toString())
      const jumlah = new Decimal(item.jumlah)

      // Fixed 4-day package pricing - no duration multiplication
      const subtotal = hargaSewa.mul(jumlah)

      return {
        produkId: item.produkId,
        jumlah: item.jumlah,
        durasi: 4, // Always 4 for fixed package
        hargaSewa,
        subtotal
      }
    })

    const totalHarga = itemCalculations.reduce(
      (total, item) => total.add(item.subtotal),
      new Decimal(0)
    )

    return {
      subtotal: totalHarga, // For backward compatibility
      totalHarga,
      itemCalculations
    }
  }

  /**
   * Enhanced price calculation with duration multiplier and discount system
   * NEW: Supports 4-day (1x) and 7-day (1.5x) packages with discount application
   * 
   * Price Flow:
   * 1. Base Item Price × Quantity = Item Subtotal
   * 2. Duration Multiplier Application (4-day = 1.0, 7-day = 1.5)
   * 3. Item Total = Item Subtotal × Duration Multiplier
   * 4. Transaction Subtotal = Sum of all Item Totals
   * 5. Discount Calculation (Percent or Nominal)
   * 6. Final Total = Subtotal - Discount Amount
   */
  static calculateTransactionTotalWithEnhancements(params: PriceCalculationParams): EnhancedPriceCalculationResult {
    const { items, duration, discountType, discountValue } = params
    
    // Step 1: Determine duration multiplier
    const durationMultiplier = duration === 7 ? 1.5 : 1.0
    
    // Step 2: Calculate item totals with duration multiplier
    const itemCalculations = items.map(item => {
      const basePrice = new Decimal(item.hargaSewa.toString())
      const quantity = new Decimal(item.jumlah)
      const multiplier = new Decimal(durationMultiplier)
      
      // Base calculation: price × quantity
      const itemSubtotal = basePrice.mul(quantity)
      
      // Apply duration multiplier
      const adjustedPrice = itemSubtotal.mul(multiplier)
      
      return {
        produkId: item.produkId,
        productSizeId: item.productSizeId,
        jumlah: item.jumlah,
        durasi: duration,
        basePrice: itemSubtotal, // Before duration multiplier
        adjustedPrice, // After duration multiplier
        hargaSewa: basePrice,
        subtotal: adjustedPrice
      }
    })
    
    // Step 3: Calculate transaction subtotal
    const subtotal = itemCalculations.reduce(
      (sum, item) => sum.add(item.adjustedPrice),
      new Decimal(0)
    )
    
    // Step 4: Calculate discount amount
    let discountAmount = new Decimal(0)
    if (discountType && discountValue && discountValue > 0) {
      if (discountType === 'percent') {
        // Percent discount: subtotal × (discountValue / 100)
        const percentage = new Decimal(discountValue).div(100)
        discountAmount = subtotal.mul(percentage)
      } else if (discountType === 'nominal') {
        // Nominal discount: direct subtraction, but prevent negative totals
        const nominalDiscount = new Decimal(discountValue)
        discountAmount = nominalDiscount.greaterThan(subtotal) ? subtotal : nominalDiscount
      }
    }
    
    // Step 5: Calculate final total
    const finalTotal = subtotal.sub(discountAmount)
    
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
   * Validate discount values according to business rules
   * Requirements: 7.1, 7.2, 7.3
   */
  static validateDiscount(
    discountType: 'percent' | 'nominal' | null,
    discountValue: number,
    subtotal: number | Decimal
  ): {
    isValid: boolean
    error?: string
  } {
    if (!discountType || discountValue <= 0) {
      return { isValid: true } // No discount is valid
    }

    const subtotalDecimal = new Decimal(subtotal.toString())
    const valueDecimal = new Decimal(discountValue)

    if (discountType === 'percent') {
      // Percent discount must be between 0 and 100
      if (discountValue < 0 || discountValue > 100) {
        return {
          isValid: false,
          error: 'Diskon persentase harus antara 0-100%'
        }
      }
    } else if (discountType === 'nominal') {
      // Nominal discount cannot exceed subtotal
      if (valueDecimal.greaterThan(subtotalDecimal)) {
        return {
          isValid: false,
          error: 'Diskon nominal tidak boleh melebihi subtotal'
        }
      }
    }

    if (discountValue < 0) {
      return {
        isValid: false,
        error: 'Nilai diskon tidak boleh negatif'
      }
    }

    return { isValid: true }
  }

  /**
   * Calculate discount amount for display purposes
   */
  static calculateDiscountAmount(
    discountType: 'percent' | 'nominal' | null,
    discountValue: number,
    subtotal: number | Decimal
  ): Decimal {
    if (!discountType || discountValue <= 0) {
      return new Decimal(0)
    }

    const subtotalDecimal = new Decimal(subtotal.toString())
    const valueDecimal = new Decimal(discountValue)

    if (discountType === 'percent') {
      const percentage = valueDecimal.div(100)
      return subtotalDecimal.mul(percentage)
    } else if (discountType === 'nominal') {
      // Prevent negative totals
      return valueDecimal.greaterThan(subtotalDecimal) ? subtotalDecimal : valueDecimal
    }

    return new Decimal(0)
  }

  /**
   * Validate duration package selection
   * Requirements: 7.4
   */
  static validateDuration(duration: number): {
    isValid: boolean
    error?: string
  } {
    if (![4, 7].includes(duration)) {
      return {
        isValid: false,
        error: 'Durasi harus 4 atau 7 hari'
      }
    }

    return { isValid: true }
  }

  /**
   * Calculate remaining payment amount
   */
  static calculateRemainingPayment(
    totalHarga: number | Decimal,
    jumlahBayar: number | Decimal
  ): Decimal {
    const total = new Decimal(totalHarga.toString())
    const paid = new Decimal(jumlahBayar.toString())
    
    const remaining = total.sub(paid)
    return remaining.greaterThan(0) ? remaining : new Decimal(0)
  }

  /**
   * Calculate payment percentage
   */
  static calculatePaymentPercentage(
    totalHarga: number | Decimal,
    jumlahBayar: number | Decimal
  ): number {
    const total = new Decimal(totalHarga.toString())
    const paid = new Decimal(jumlahBayar.toString())

    if (total.equals(0)) return 0

    const percentage = paid.div(total).mul(100)
    return Math.min(percentage.toNumber(), 100)
  }

  /**
   * Check if transaction is fully paid
   */
  static isFullyPaid(
    totalHarga: number | Decimal,
    jumlahBayar: number | Decimal
  ): boolean {
    const total = new Decimal(totalHarga.toString())
    const paid = new Decimal(jumlahBayar.toString())
    
    return paid.greaterThanOrEqualTo(total)
  }

  /**
   * Validate payment amount
   */
  static validatePaymentAmount(
    paymentAmount: number | Decimal,
    totalHarga: number | Decimal,
    currentJumlahBayar: number | Decimal
  ): {
    isValid: boolean
    error?: string
    maxAmount?: Decimal
  } {
    const payment = new Decimal(paymentAmount.toString())
    const total = new Decimal(totalHarga.toString())
    const currentPaid = new Decimal(currentJumlahBayar.toString())

    if (payment.lessThanOrEqualTo(0)) {
      return {
        isValid: false,
        error: 'Jumlah pembayaran harus lebih dari 0'
      }
    }

    const maxPayment = total.sub(currentPaid)
    if (payment.greaterThan(maxPayment)) {
      return {
        isValid: false,
        error: 'Jumlah pembayaran melebihi sisa tagihan',
        maxAmount: maxPayment
      }
    }

    return { isValid: true }
  }

  /**
   * Calculate late fee for returns after 4 days
   * Fixed rate: Rp 20.000 per item per day after day 4
   */
  static calculateLateFee(
    daysLate: number,
    totalItems: number,
    lateFeePerItem: number = 20000 // Rp 20.000 per item per day
  ): Decimal {
    if (daysLate <= 0) return new Decimal(0)

    const items = new Decimal(totalItems)
    const days = new Decimal(daysLate)
    const feePerItem = new Decimal(lateFeePerItem)

    return items.mul(days).mul(feePerItem)
  }

  /**
   * Calculate total late fee for transaction items
   */
  static calculateTransactionLateFee(
    items: TransactionItem[],
    daysLate: number
  ): Decimal {
    if (daysLate <= 0) return new Decimal(0)

    const totalItems = items.reduce((total, item) => total + item.jumlah, 0)
    return this.calculateLateFee(daysLate, totalItems)
  }

  /**
   * Format price to Indonesian Rupiah display
   */
  static formatToRupiah(amount: number | Decimal): string {
    const value = typeof amount === 'number' ? amount : amount.toNumber()
    
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  /**
   * Convert Decimal to number safely for JSON serialization
   */
  static decimalToNumber(decimal: Decimal): number {
    return decimal.toNumber()
  }

  /**
   * Convert number to Decimal safely for calculations
   */
  static numberToDecimal(num: number): Decimal {
    return new Decimal(num)
  }

  /**
   * Round Decimal to 2 decimal places for currency
   */
  static roundCurrency(decimal: Decimal): Decimal {
    return decimal.toDecimalPlaces(2)
  }
}