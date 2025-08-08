/**
 * Penalty Calculator Utility - TSK-23/TSK-24
 * Business logic for calculating return penalties and late fees
 * Enhanced with multi-condition return support
 * Following existing pattern from PriceCalculator in lib/utils/server.ts
 */

// Note: TransaksiItem type is available through Prisma client
// import type { TransaksiItem } from '@/features/kasir/types'

import { ConditionSplit } from '../../types'

export interface PenaltyDetails {
  itemId: string
  productName: string
  expectedReturnDate: Date
  actualReturnDate: Date
  lateDays: number
  dailyPenaltyRate: number
  modalAwal?: number // Added for lost item penalty calculation
  totalPenalty: number
  reasonCode: 'on_time' | 'late' | 'damaged' | 'lost'
  description: string
}

export interface PenaltyCalculationResult {
  totalPenalty: number
  totalLateDays: number
  itemPenalties: PenaltyDetails[]
  summary: {
    onTimeItems: number
    lateItems: number
    damagedItems: number
    lostItems: number
  }
}

// TSK-24: Multi-condition penalty calculation interfaces
export interface MultiConditionPenaltyDetails {
  itemId: string
  productName: string
  expectedReturnDate: Date
  actualReturnDate: Date
  totalPenalty: number
  conditionBreakdown: Array<{
    kondisiAkhir: string
    quantity: number
    lateDays: number
    conditionPenalty: number
    latePenalty: number
    totalConditionPenalty: number
    reasonCode: 'on_time' | 'late' | 'damaged' | 'lost'
    description: string
  }>
  summary: {
    totalQuantity: number
    totalLateDays: number
    avgPenaltyPerUnit: number
  }
}

export interface MultiConditionCalculationResult {
  totalPenalty: number
  totalLateDays: number
  itemPenalties: MultiConditionPenaltyDetails[]
  summary: {
    totalItems: number
    totalQuantity: number
    onTimeQuantity: number
    lateQuantity: number
    damagedQuantity: number
    lostQuantity: number
    avgPenaltyPerItem: number
    avgPenaltyPerUnit: number
  }
}

export class PenaltyCalculator {
  // Default business rules
  private static readonly DEFAULT_DAILY_RATE = 5000 // IDR 5,000 per day
  private static readonly DAMAGE_PENALTY_MULTIPLIER = 2 // 2x daily rate
  private static readonly LOST_ITEM_PENALTY_DAYS = 30 // Equivalent to 30 days penalty
  private static readonly MAX_PENALTY_DAYS = 365 // Maximum penalty days per item

  /**
   * Calculate penalty for late return based on dates
   */
  static calculateLatePenalty(
    expectedDate: Date, 
    actualDate: Date, 
    dailyRate: number = this.DEFAULT_DAILY_RATE
  ): number {
    // Calculate difference in days
    const timeDiff = actualDate.getTime() - expectedDate.getTime()
    const lateDays = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)))
    
    // Apply maximum penalty limit
    const cappedLateDays = Math.min(lateDays, this.MAX_PENALTY_DAYS)
    
    return cappedLateDays * dailyRate
  }

  /**
   * Calculate penalty based on item condition
   */
  static calculateConditionPenalty(
    condition: string,
    dailyRate: number = this.DEFAULT_DAILY_RATE,
    modalAwal?: number
  ): { penalty: number; reasonCode: PenaltyDetails['reasonCode']; description: string } {
    const normalizedCondition = condition.toLowerCase()

    // No penalty for good conditions
    if (normalizedCondition.includes('baik - tidak ada kerusakan')) {
      return {
        penalty: 0,
        reasonCode: 'on_time',
        description: 'Barang dikembalikan dalam kondisi baik'
      }
    }

    // Minor penalty for light damage/dirt
    if (normalizedCondition.includes('baik - sedikit') || normalizedCondition.includes('cukup - ada noda ringan')) {
      return {
        penalty: dailyRate * 1,
        reasonCode: 'damaged',
        description: 'Penalty untuk kondisi barang dengan kerusakan ringan'
      }
    }

    // Moderate penalty for moderate damage
    if (normalizedCondition.includes('cukup - ada kerusakan') || normalizedCondition.includes('buruk - ada noda')) {
      return {
        penalty: dailyRate * this.DAMAGE_PENALTY_MULTIPLIER,
        reasonCode: 'damaged',
        description: 'Penalty untuk kondisi barang dengan kerusakan sedang'
      }
    }

    // High penalty for severe damage
    if (normalizedCondition.includes('buruk - ada kerusakan besar')) {
      return {
        penalty: dailyRate * (this.DAMAGE_PENALTY_MULTIPLIER * 2),
        reasonCode: 'damaged',
        description: 'Penalty untuk kondisi barang dengan kerusakan berat'
      }
    }

    // Maximum penalty for lost items - use modalAwal if available, fallback to old calculation
    if (normalizedCondition.includes('hilang') || normalizedCondition.includes('tidak dikembalikan')) {
      const lostItemPenalty = modalAwal || (dailyRate * this.LOST_ITEM_PENALTY_DAYS)
      return {
        penalty: lostItemPenalty,
        reasonCode: 'lost',
        description: modalAwal 
          ? `Penalty untuk barang hilang sebesar modal awal produk (Rp ${modalAwal.toLocaleString('id-ID')})`
          : 'Penalty untuk barang yang hilang atau tidak dikembalikan'
      }
    }

    // Default moderate penalty for unrecognized conditions
    return {
      penalty: dailyRate * this.DAMAGE_PENALTY_MULTIPLIER,
      reasonCode: 'damaged',
      description: 'Penalty untuk kondisi barang yang tidak standar'
    }
  }

  /**
   * Calculate comprehensive penalty for a single transaction item
   */
  static calculateItemPenalty(
    item: {
      id: string
      productName: string
      expectedReturnDate: Date
      actualReturnDate: Date
      condition: string
      quantity: number
      modalAwal?: number // Added modalAwal for lost item penalty
    },
    dailyRate: number = this.DEFAULT_DAILY_RATE
  ): PenaltyDetails {
    // Calculate late penalty
    const latePenalty = this.calculateLatePenalty(
      item.expectedReturnDate,
      item.actualReturnDate,
      dailyRate
    )

    // Calculate condition penalty
    const conditionPenalty = this.calculateConditionPenalty(item.condition, dailyRate, item.modalAwal)

    // Calculate late days
    const timeDiff = item.actualReturnDate.getTime() - item.expectedReturnDate.getTime()
    const lateDays = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)))

    // Total penalty is late penalty + condition penalty, multiplied by quantity
    const totalItemPenalty = (latePenalty + conditionPenalty.penalty) * item.quantity

    // Determine primary reason code (prioritize lost > damaged > late > on_time)
    let reasonCode = conditionPenalty.reasonCode
    if (reasonCode === 'on_time' && lateDays > 0) {
      reasonCode = 'late'
    }

    return {
      itemId: item.id,
      productName: item.productName,
      expectedReturnDate: item.expectedReturnDate,
      actualReturnDate: item.actualReturnDate,
      lateDays: Math.min(lateDays, this.MAX_PENALTY_DAYS),
      dailyPenaltyRate: dailyRate,
      modalAwal: item.modalAwal,
      totalPenalty: totalItemPenalty,
      reasonCode,
      description: lateDays > 0 && conditionPenalty.penalty > 0 
        ? `Kombinasi keterlambatan ${lateDays} hari dan ${conditionPenalty.description.toLowerCase()}`
        : lateDays > 0 
          ? `Keterlambatan pengembalian ${lateDays} hari`
          : conditionPenalty.description
    }
  }

  /**
   * Calculate penalties for multiple transaction items
   */
  static calculateTransactionPenalties(
    items: Array<{
      id: string
      productName: string
      expectedReturnDate: Date
      actualReturnDate: Date
      condition: string
      quantity: number
      modalAwal?: number // Added modalAwal for lost item penalty
    }>,
    dailyRate: number = this.DEFAULT_DAILY_RATE
  ): PenaltyCalculationResult {
    const itemPenalties = items.map(item => 
      this.calculateItemPenalty(item, dailyRate)
    )

    const totalPenalty = itemPenalties.reduce((sum, penalty) => sum + penalty.totalPenalty, 0)
    const totalLateDays = itemPenalties.reduce((sum, penalty) => sum + penalty.lateDays, 0)

    // Calculate summary statistics
    const summary = {
      onTimeItems: itemPenalties.filter(p => p.reasonCode === 'on_time').length,
      lateItems: itemPenalties.filter(p => p.reasonCode === 'late').length,
      damagedItems: itemPenalties.filter(p => p.reasonCode === 'damaged').length,
      lostItems: itemPenalties.filter(p => p.reasonCode === 'lost').length
    }

    return {
      totalPenalty,
      totalLateDays,
      itemPenalties,
      summary
    }
  }

  /**
   * Format penalty amount to Indonesian Rupiah
   */
  static formatPenaltyAmount(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  /**
   * Generate penalty description for display
   */
  static generatePenaltyDescription(penalty: PenaltyDetails): string {
    const formattedAmount = this.formatPenaltyAmount(penalty.totalPenalty)
    
    if (penalty.totalPenalty === 0) {
      return 'Tidak ada penalty - barang dikembalikan tepat waktu dalam kondisi baik'
    }

    return `${formattedAmount} - ${penalty.description}`
  }

  /**
   * Validate penalty calculation inputs
   */
  static validatePenaltyInputs(
    expectedDate: Date,
    actualDate: Date,
    condition: string,
    quantity: number = 1
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validate dates
    if (isNaN(expectedDate.getTime())) {
      errors.push('Tanggal yang diharapkan tidak valid')
    }

    if (isNaN(actualDate.getTime())) {
      errors.push('Tanggal pengembalian tidak valid')
    }

    // Validate condition
    if (!condition || condition.trim().length === 0) {
      errors.push('Kondisi barang harus diisi')
    }

    // Validate quantity
    if (quantity < 1 || !Number.isInteger(quantity)) {
      errors.push('Jumlah barang harus berupa bilangan bulat positif')
    }

    // Validate date relationship (allow same day or future returns)
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    
    if (actualDate < oneYearAgo) {
      errors.push('Tanggal pengembalian tidak boleh lebih dari 1 tahun yang lalu')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // TSK-24: Multi-condition penalty calculation methods

  /**
   * Calculate penalty for a single condition split
   */
  static calculateConditionSplitPenalty(
    conditionSplit: ConditionSplit,
    expectedReturnDate: Date,
    actualReturnDate: Date,
    dailyRate: number = this.DEFAULT_DAILY_RATE
  ): {
    lateDays: number
    conditionPenalty: number
    latePenalty: number
    totalConditionPenalty: number
    reasonCode: 'on_time' | 'late' | 'damaged' | 'lost'
    description: string
  } {
    // Calculate late penalty per unit
    const latePenalty = this.calculateLatePenalty(
      expectedReturnDate,
      actualReturnDate,
      dailyRate
    )

    // Calculate condition penalty
    const conditionResult = this.calculateConditionPenalty(
      conditionSplit.kondisiAkhir,
      dailyRate,
      conditionSplit.modalAwal
    )

    // Calculate late days
    const timeDiff = actualReturnDate.getTime() - expectedReturnDate.getTime()
    const lateDays = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)))

    // Total penalty for this condition split (penalty per unit * quantity)
    const totalConditionPenalty = (latePenalty + conditionResult.penalty) * conditionSplit.jumlahKembali

    // Determine primary reason code (prioritize lost > damaged > late > on_time)
    let reasonCode = conditionResult.reasonCode
    if (reasonCode === 'on_time' && lateDays > 0) {
      reasonCode = 'late'
    }

    // Generate description
    const description = lateDays > 0 && conditionResult.penalty > 0 
      ? `Kombinasi keterlambatan ${lateDays} hari dan ${conditionResult.description.toLowerCase()}`
      : lateDays > 0 
        ? `Keterlambatan pengembalian ${lateDays} hari`
        : conditionResult.description

    return {
      lateDays: Math.min(lateDays, this.MAX_PENALTY_DAYS),
      conditionPenalty: conditionResult.penalty,
      latePenalty,
      totalConditionPenalty,
      reasonCode,
      description
    }
  }

  /**
   * Calculate multi-condition penalty for a single item
   */
  static calculateMultiConditionItemPenalty(
    item: {
      id: string
      productName: string
      expectedReturnDate: Date
      actualReturnDate: Date
      conditions: ConditionSplit[]
    },
    dailyRate: number = this.DEFAULT_DAILY_RATE
  ): MultiConditionPenaltyDetails {
    const conditionBreakdown = item.conditions.map(condition => {
      const splitResult = this.calculateConditionSplitPenalty(
        condition,
        item.expectedReturnDate,
        item.actualReturnDate,
        dailyRate
      )

      return {
        kondisiAkhir: condition.kondisiAkhir,
        quantity: condition.jumlahKembali,
        lateDays: splitResult.lateDays,
        conditionPenalty: splitResult.conditionPenalty,
        latePenalty: splitResult.latePenalty,
        totalConditionPenalty: splitResult.totalConditionPenalty,
        reasonCode: splitResult.reasonCode,
        description: splitResult.description
      }
    })

    const totalPenalty = conditionBreakdown.reduce((sum, breakdown) => sum + breakdown.totalConditionPenalty, 0)
    const totalQuantity = conditionBreakdown.reduce((sum, breakdown) => sum + breakdown.quantity, 0)
    const totalLateDays = conditionBreakdown.reduce((sum, breakdown) => sum + (breakdown.lateDays * breakdown.quantity), 0)
    const avgPenaltyPerUnit = totalQuantity > 0 ? totalPenalty / totalQuantity : 0

    return {
      itemId: item.id,
      productName: item.productName,
      expectedReturnDate: item.expectedReturnDate,
      actualReturnDate: item.actualReturnDate,
      totalPenalty,
      conditionBreakdown,
      summary: {
        totalQuantity,
        totalLateDays,
        avgPenaltyPerUnit
      }
    }
  }

  /**
   * Calculate penalties for multiple items with multi-condition support
   */
  static calculateMultiConditionPenalties(
    items: Array<{
      id: string
      productName: string
      expectedReturnDate: Date
      actualReturnDate: Date
      conditions: ConditionSplit[]
    }>,
    dailyRate: number = this.DEFAULT_DAILY_RATE
  ): MultiConditionCalculationResult {
    const itemPenalties = items.map(item => 
      this.calculateMultiConditionItemPenalty(item, dailyRate)
    )

    const totalPenalty = itemPenalties.reduce((sum, penalty) => sum + penalty.totalPenalty, 0)
    const totalLateDays = itemPenalties.reduce((sum, penalty) => sum + penalty.summary.totalLateDays, 0)

    // Calculate summary statistics
    let totalQuantity = 0
    let onTimeQuantity = 0
    let lateQuantity = 0
    let damagedQuantity = 0
    let lostQuantity = 0

    itemPenalties.forEach(item => {
      item.conditionBreakdown.forEach(condition => {
        totalQuantity += condition.quantity
        
        switch (condition.reasonCode) {
          case 'on_time':
            onTimeQuantity += condition.quantity
            break
          case 'late':
            lateQuantity += condition.quantity
            break
          case 'damaged':
            damagedQuantity += condition.quantity
            break
          case 'lost':
            lostQuantity += condition.quantity
            break
        }
      })
    })

    const avgPenaltyPerItem = itemPenalties.length > 0 ? totalPenalty / itemPenalties.length : 0
    const avgPenaltyPerUnit = totalQuantity > 0 ? totalPenalty / totalQuantity : 0

    return {
      totalPenalty,
      totalLateDays,
      itemPenalties,
      summary: {
        totalItems: itemPenalties.length,
        totalQuantity,
        onTimeQuantity,
        lateQuantity,
        damagedQuantity,
        lostQuantity,
        avgPenaltyPerItem,
        avgPenaltyPerUnit
      }
    }
  }

  /**
   * Convert multi-condition penalty result to standard format for backward compatibility
   */
  static convertMultiConditionToStandardResult(
    multiResult: MultiConditionCalculationResult
  ): PenaltyCalculationResult {
    // Create legacy-format item penalties by aggregating condition breakdowns
    const itemPenalties: PenaltyDetails[] = multiResult.itemPenalties.map(item => {
      // Find the primary condition (highest penalty or most severe)
      const primaryCondition = item.conditionBreakdown.reduce((prev, current) => 
        current.totalConditionPenalty > prev.totalConditionPenalty ? current : prev
      )

      return {
        itemId: item.itemId,
        productName: item.productName,
        expectedReturnDate: item.expectedReturnDate,
        actualReturnDate: item.actualReturnDate,
        lateDays: primaryCondition.lateDays,
        dailyPenaltyRate: this.DEFAULT_DAILY_RATE,
        modalAwal: undefined, // Not directly available in multi-condition format
        totalPenalty: item.totalPenalty,
        reasonCode: primaryCondition.reasonCode,
        description: `Multi-condition: ${item.conditionBreakdown.length} conditions, total penalty ${this.formatPenaltyAmount(item.totalPenalty)}`
      }
    })

    const summary = {
      onTimeItems: itemPenalties.filter(p => p.reasonCode === 'on_time').length,
      lateItems: itemPenalties.filter(p => p.reasonCode === 'late').length,
      damagedItems: itemPenalties.filter(p => p.reasonCode === 'damaged').length,
      lostItems: itemPenalties.filter(p => p.reasonCode === 'lost').length
    }

    return {
      totalPenalty: multiResult.totalPenalty,
      totalLateDays: multiResult.totalLateDays,
      itemPenalties,
      summary
    }
  }

  /**
   * Generate detailed multi-condition penalty description
   */
  static generateMultiConditionDescription(penalty: MultiConditionPenaltyDetails): string {
    if (penalty.totalPenalty === 0) {
      return 'Tidak ada penalty - semua barang dikembalikan tepat waktu dalam kondisi baik'
    }

    const formattedAmount = this.formatPenaltyAmount(penalty.totalPenalty)
    const conditionSummary = penalty.conditionBreakdown
      .map(c => `${c.quantity}x ${c.kondisiAkhir} (${this.formatPenaltyAmount(c.totalConditionPenalty)})`)
      .join(', ')

    return `${formattedAmount} - Multi-condition: ${conditionSummary}`
  }

  /**
   * Validate multi-condition penalty inputs
   */
  static validateMultiConditionInputs(
    expectedDate: Date,
    actualDate: Date,
    conditions: ConditionSplit[]
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validate basic dates
    const dateValidation = this.validatePenaltyInputs(expectedDate, actualDate, '', 1)
    if (!dateValidation.isValid) {
      errors.push(...dateValidation.errors)
    }

    // Validate conditions array
    if (!conditions || conditions.length === 0) {
      errors.push('Minimal satu kondisi harus diisi')
      return { isValid: false, errors }
    }

    // Validate each condition
    conditions.forEach((condition, index) => {
      if (!condition.kondisiAkhir || condition.kondisiAkhir.trim().length === 0) {
        errors.push(`Kondisi akhir harus diisi untuk kondisi ke-${index + 1}`)
      }

      if (condition.jumlahKembali < 0 || !Number.isInteger(condition.jumlahKembali)) {
        errors.push(`Jumlah kembali untuk kondisi ke-${index + 1} harus berupa bilangan bulat non-negatif`)
      }

      if (condition.modalAwal !== undefined && (condition.modalAwal < 0 || !Number.isFinite(condition.modalAwal))) {
        errors.push(`Modal awal untuk kondisi ke-${index + 1} tidak valid`)
      }
    })

    // Validate total quantities
    const totalQuantity = conditions.reduce((sum, c) => sum + c.jumlahKembali, 0)
    if (totalQuantity === 0) {
      errors.push('Total jumlah kembali tidak boleh nol')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Get penalty business rules configuration
   */
  static getBusinessRules() {
    return {
      defaultDailyRate: this.DEFAULT_DAILY_RATE,
      damagePenaltyMultiplier: this.DAMAGE_PENALTY_MULTIPLIER,
      lostItemPenaltyDays: this.LOST_ITEM_PENALTY_DAYS,
      maxPenaltyDays: this.MAX_PENALTY_DAYS,
      supportedConditions: [
        'Baik - tidak ada kerusakan',
        'Baik - sedikit kotor/kusut',
        'Cukup - ada noda ringan',
        'Cukup - ada kerusakan kecil',
        'Buruk - ada noda berat',
        'Buruk - ada kerusakan besar',
        'Hilang/tidak dikembalikan'
      ]
    }
  }
}