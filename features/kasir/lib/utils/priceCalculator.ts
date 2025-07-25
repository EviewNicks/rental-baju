/**
 * Price Calculator Utilities - RPK-26
 * Business logic for calculating rental prices and totals
 */

import { Decimal } from '@prisma/client/runtime/library'

export interface TransactionItem {
  produkId: string
  jumlah: number
  durasi: number
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

export class PriceCalculator {
  /**
   * Calculate total price for transaction items
   * Formula: subtotal = hargaSewa * jumlah * durasi
   */
  static calculateTransactionTotal(items: TransactionItem[]): PriceCalculationResult {
    const itemCalculations = items.map((item) => {
      const hargaSewa = new Decimal(item.hargaSewa.toString())
      const jumlah = new Decimal(item.jumlah)
      const durasi = new Decimal(item.durasi)
      
      const subtotal = hargaSewa.mul(jumlah).mul(durasi)

      return {
        produkId: item.produkId,
        jumlah: item.jumlah,
        durasi: item.durasi,
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
   * Calculate late fee (if needed in the future)
   * Currently not implemented as per task requirements
   */
  static calculateLateFee(
    daysLate: number,
    totalHarga: number | Decimal,
    lateFeePercentage: number = 0.1 // 10% per day
  ): Decimal {
    if (daysLate <= 0) return new Decimal(0)

    const total = new Decimal(totalHarga.toString())
    const feePercentage = new Decimal(lateFeePercentage)
    const days = new Decimal(daysLate)

    return total.mul(feePercentage).mul(days)
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