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

  // New flat penalty system
  private static readonly FLAT_LATE_PENALTY = 20000 // IDR 20,000 flat penalty for late returns
  private static readonly ENABLE_MANUAL_PRICING = true // Enable manual pricing system

  /**
   * Calculate penalty for late return based on dates
   * ✅ FIX: Normalize dates to compare only date (not time) to prevent same-day returns from being charged
   */
  static calculateLatePenalty(
    expectedDate: Date, 
    actualDate: Date, 
    dailyRate: number = this.DEFAULT_DAILY_RATE
  ): number {
    // ✅ FIX: Normalize to date only (remove hours/minutes/seconds)
    // This ensures returns on the same day are not considered late
    const expectedDay = new Date(
      expectedDate.getFullYear(), 
      expectedDate.getMonth(), 
      expectedDate.getDate()
    )
    const actualDay = new Date(
      actualDate.getFullYear(), 
      actualDate.getMonth(), 
      actualDate.getDate()
    )
    
    // Calculate difference in days
    const timeDiff = actualDay.getTime() - expectedDay.getTime()
    const lateDays = Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60 * 24)))  // ✅ Changed Math.ceil to Math.floor
    
    // Apply maximum penalty limit
    const cappedLateDays = Math.min(lateDays, this.MAX_PENALTY_DAYS)
    
    return cappedLateDays * dailyRate
  }

  /**
   * Calculate penalty based on item condition
   * Fixed TSK-24: Now recognizes frontend condition values from ConditionRow.tsx
   */
  static calculateConditionPenalty(
    condition: string,
    dailyRate: number = this.DEFAULT_DAILY_RATE,
    modalAwal?: number
  ): { penalty: number; reasonCode: PenaltyDetails['reasonCode']; description: string } {
    const normalizedCondition = condition.toLowerCase()

    // FIXED: Match current frontend condition values
    // No penalty for good conditions
    if (normalizedCondition.includes('baik')) {
      return {
        penalty: 0,
        reasonCode: 'on_time',
        description: 'Barang dikembalikan dalam kondisi baik'
      }
    }

    // Minor penalty for dirty items (matches ConditionRow penalty: 5000)
    if (normalizedCondition.includes('kotor')) {
      return {
        penalty: 5000, // Fixed: use exact penalty from frontend
        reasonCode: 'damaged',
        description: 'Penalty untuk barang kotor'
      }
    }

    // Moderate penalty for light damage (matches ConditionRow penalty: 15000)
    if (normalizedCondition.includes('rusak ringan')) {
      return {
        penalty: 15000, // Fixed: use exact penalty from frontend
        reasonCode: 'damaged',
        description: 'Penalty untuk kerusakan ringan'
      }
    }

    // High penalty for severe damage (matches ConditionRow penalty: 50000)
    if (normalizedCondition.includes('rusak berat')) {
      return {
        penalty: 50000, // Fixed: use exact penalty from frontend
        reasonCode: 'damaged',
        description: 'Penalty untuk kerusakan berat'
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
   * ✅ TASK 5: Calculate session-based late penalty for partial returns
   * Requirements: 7.2, 7.3, 7.4
   * 
   * For partial returns, late penalty is calculated based on current return date
   * regardless of previous return sessions. Each session is evaluated independently.
   */
  static calculateSessionBasedLatePenalty(
    expectedDate: Date,
    currentReturnDate: Date,
    itemsBeingReturnedCount: number,
    customAmount?: number
  ): {
    isLate: boolean
    penalty: number
    lateDays: number
    penaltyPerItem: number
    sessionDescription: string
  } {
    // ✅ FIX: Normalize to date only (remove hours/minutes/seconds)
    const expectedDay = new Date(
      expectedDate.getFullYear(), 
      expectedDate.getMonth(), 
      expectedDate.getDate()
    )
    const currentDay = new Date(
      currentReturnDate.getFullYear(), 
      currentReturnDate.getMonth(), 
      currentReturnDate.getDate()
    )
    
    const timeDiff = currentDay.getTime() - expectedDay.getTime()
    const lateDays = Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60 * 24)))
    const isLate = lateDays > 0

    const penaltyPerItem = isLate ? (customAmount || this.FLAT_LATE_PENALTY) : 0
    const totalPenalty = penaltyPerItem * itemsBeingReturnedCount

    const sessionDescription = isLate 
      ? `Session penalty: ${lateDays} hari terlambat, ${itemsBeingReturnedCount} item @ ${this.formatPenaltyAmount(penaltyPerItem)}`
      : `Session penalty: Tepat waktu, tidak ada penalty`

    return {
      isLate,
      penalty: totalPenalty,
      lateDays,
      penaltyPerItem,
      sessionDescription
    }
  }

  /**
   * ✅ TASK 5: Calculate enhanced penalty for partial return session
   * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
   * 
   * This method calculates penalties only for items being returned in the current session,
   * ignoring previous return sessions. Late penalty is based on current return date.
   */
  static calculatePartialReturnSessionPenalty(
    sessionItems: Array<{
      id: string
      productName: string
      expectedReturnDate: Date
      currentReturnDate: Date
      conditionCategory?: string
      manualPrice?: number
      quantity: number
      useManualPricing?: boolean
      modalAwal?: number
    }>,
    settings?: {
      applyFlatLatePenalty?: boolean
      customLatePenalty?: number
      sessionNumber?: number
    }
  ): {
    sessionNumber: number
    totalPenalty: number
    sessionLatePenalty: number
    sessionConditionPenalty: number
    isLateSession: boolean
    lateDays: number
    itemPenalties: Array<{
      itemId: string
      productName: string
      quantity: number
      latePenalty: number
      conditionPenalty: number
      totalItemPenalty: number
      isLate: boolean
      description: string
    }>
    sessionSummary: {
      totalItems: number
      totalQuantity: number
      lateItems: number
      onTimeItems: number
      manuallyPricedItems: number
      avgPenaltyPerItem: number
      avgPenaltyPerUnit: number
    }
    sessionDescription: string
  } {
    const { 
      applyFlatLatePenalty = true, 
      customLatePenalty,
      sessionNumber = 1
    } = settings || {}

    if (sessionItems.length === 0) {
      return {
        sessionNumber,
        totalPenalty: 0,
        sessionLatePenalty: 0,
        sessionConditionPenalty: 0,
        isLateSession: false,
        lateDays: 0,
        itemPenalties: [],
        sessionSummary: {
          totalItems: 0,
          totalQuantity: 0,
          lateItems: 0,
          onTimeItems: 0,
          manuallyPricedItems: 0,
          avgPenaltyPerItem: 0,
          avgPenaltyPerUnit: 0
        },
        sessionDescription: `Session ${sessionNumber}: Tidak ada item`
      }
    }

    // Use the first item's dates for session-level late penalty calculation
    // All items in a session have the same expected and actual return dates
    const firstItem = sessionItems[0]
    const totalQuantity = sessionItems.reduce((sum, item) => sum + item.quantity, 0)

    // Calculate session-based late penalty
    const sessionLatePenaltyResult = this.calculateSessionBasedLatePenalty(
      firstItem.expectedReturnDate,
      firstItem.currentReturnDate,
      totalQuantity, // Apply to all items being returned in this session
      customLatePenalty
    )

    const sessionLatePenalty = applyFlatLatePenalty ? sessionLatePenaltyResult.penalty : 0

    // Calculate condition penalties for each item
    const itemPenalties = sessionItems.map(item => {
      // Calculate manual pricing penalty for this item
      const manualPricingResult = this.calculateManualPricingPenalty(
        item.conditionCategory || 'BAIK',
        item.manualPrice || 0,
        item.quantity,
        item.useManualPricing
      )

      // Late penalty is distributed across all items in the session
      const itemLatePenalty = sessionLatePenalty > 0 
        ? (sessionLatePenaltyResult.penaltyPerItem * item.quantity)
        : 0

      const totalItemPenalty = itemLatePenalty + manualPricingResult.penalty

      // Generate item description
      let description = ''
      if (itemLatePenalty > 0 && manualPricingResult.penalty > 0) {
        description = `Kombinasi penalty keterlambatan (${this.formatPenaltyAmount(itemLatePenalty)}) dan ${manualPricingResult.description.toLowerCase()}`
      } else if (itemLatePenalty > 0) {
        description = `Penalty keterlambatan session: ${sessionLatePenaltyResult.lateDays} hari`
      } else if (manualPricingResult.penalty > 0) {
        description = manualPricingResult.description
      } else {
        description = 'Tidak ada penalty - dikembalikan tepat waktu dalam kondisi baik'
      }

      return {
        itemId: item.id,
        productName: item.productName,
        quantity: item.quantity,
        latePenalty: itemLatePenalty,
        conditionPenalty: manualPricingResult.penalty,
        totalItemPenalty,
        isLate: sessionLatePenaltyResult.isLate,
        description
      }
    })

    const sessionConditionPenalty = itemPenalties.reduce((sum, item) => sum + item.conditionPenalty, 0)
    const totalPenalty = sessionLatePenalty + sessionConditionPenalty

    // Calculate session summary
    const lateItems = sessionLatePenaltyResult.isLate ? sessionItems.length : 0
    const manuallyPricedItems = itemPenalties.filter(item => item.conditionPenalty > 0).length
    const avgPenaltyPerItem = sessionItems.length > 0 ? totalPenalty / sessionItems.length : 0
    const avgPenaltyPerUnit = totalQuantity > 0 ? totalPenalty / totalQuantity : 0

    // Generate session description
    const itemDescriptions = itemPenalties.map(item => 
      `${item.productName} (${item.quantity})`
    ).join(', ')

    const penaltyDesc = totalPenalty > 0 
      ? `, Penalty: ${this.formatPenaltyAmount(totalPenalty)}${sessionLatePenaltyResult.isLate ? ` (Terlambat ${sessionLatePenaltyResult.lateDays} hari)` : ''}`
      : ''

    const sessionDescription = `Session ${sessionNumber}: ${itemDescriptions}${penaltyDesc}`

    return {
      sessionNumber,
      totalPenalty,
      sessionLatePenalty,
      sessionConditionPenalty,
      isLateSession: sessionLatePenaltyResult.isLate,
      lateDays: sessionLatePenaltyResult.lateDays,
      itemPenalties,
      sessionSummary: {
        totalItems: sessionItems.length,
        totalQuantity,
        lateItems,
        onTimeItems: sessionItems.length - lateItems,
        manuallyPricedItems,
        avgPenaltyPerItem,
        avgPenaltyPerUnit
      },
      sessionDescription
    }
  }

  /**
   * ✅ TASK 5: Generate penalty preview for partial return session
   * Requirements: 7.5
   * 
   * This method provides real-time penalty calculation for the current session
   * without considering previous sessions. Used for penalty preview in forms.
   */
  static generatePartialReturnPenaltyPreview(
    sessionItems: Array<{
      id: string
      productName: string
      expectedReturnDate: Date
      currentReturnDate: Date
      conditionCategory?: string
      manualPrice?: number
      quantity: number
      useManualPricing?: boolean
    }>,
    sessionNumber: number = 1
  ): {
    totalPenalty: number
    isLateReturn: boolean
    lateDays: number
    flatLatePenalty: number
    conditionPenalty: number
    itemBreakdown: Array<{
      itemId: string
      itemName: string
      quantity: number
      penalty: number
      isLate: boolean
      description: string
    }>
    previewDescription: string
  } {
    if (sessionItems.length === 0) {
      return {
        totalPenalty: 0,
        isLateReturn: false,
        lateDays: 0,
        flatLatePenalty: 0,
        conditionPenalty: 0,
        itemBreakdown: [],
        previewDescription: 'Tidak ada item untuk dihitung penalty'
      }
    }

    const sessionResult = this.calculatePartialReturnSessionPenalty(sessionItems, {
      applyFlatLatePenalty: true,
      sessionNumber
    })

    const itemBreakdown = sessionResult.itemPenalties.map(item => ({
      itemId: item.itemId,
      itemName: item.productName,
      quantity: item.quantity,
      penalty: item.totalItemPenalty,
      isLate: item.isLate,
      description: item.description
    }))

    const previewDescription = sessionResult.totalPenalty > 0
      ? `Preview penalty session ${sessionNumber}: ${this.formatPenaltyAmount(sessionResult.totalPenalty)}${sessionResult.isLateSession ? ` (Terlambat ${sessionResult.lateDays} hari)` : ''}`
      : `Preview session ${sessionNumber}: Tidak ada penalty`

    return {
      totalPenalty: sessionResult.totalPenalty,
      isLateReturn: sessionResult.isLateSession,
      lateDays: sessionResult.lateDays,
      flatLatePenalty: sessionResult.sessionLatePenalty,
      conditionPenalty: sessionResult.sessionConditionPenalty,
      itemBreakdown,
      previewDescription
    }
  }

  /**
   * Calculate flat penalty for late return transactions
   * NEW: Flat 20k penalty system instead of per-day calculation
   * ✅ FIX: Normalize dates to compare only date (not time) to prevent same-day returns from being charged
   */
  static calculateFlatLatePenalty(
    expectedDate: Date,
    actualDate: Date,
    customAmount?: number
  ): { isLate: boolean; penalty: number; lateDays: number } {
    // ✅ FIX: Normalize to date only (remove hours/minutes/seconds)
    // This ensures returns on the same day are not considered late
    const expectedDay = new Date(
      expectedDate.getFullYear(), 
      expectedDate.getMonth(), 
      expectedDate.getDate()
    )
    const actualDay = new Date(
      actualDate.getFullYear(), 
      actualDate.getMonth(), 
      actualDate.getDate()
    )
    
    const timeDiff = actualDay.getTime() - expectedDay.getTime()
    const lateDays = Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60 * 24)))  // ✅ Changed Math.ceil to Math.floor
    const isLate = lateDays > 0

    return {
      isLate,
      penalty: isLate ? (customAmount || this.FLAT_LATE_PENALTY) : 0,
      lateDays
    }
  }

  /**
   * Calculate manual pricing penalty for condition categories
   * NEW: Manual pricing system for condition-based penalties
   */
  static calculateManualPricingPenalty(
    conditionCategory: string,
    manualPrice: number,
    quantity: number,
    useManualPricing: boolean = true
  ): {
    penalty: number
    description: string
    reasonCode: 'manual_pricing' | 'on_time'
  } {
    if (!useManualPricing || manualPrice <= 0) {
      return {
        penalty: 0,
        description: 'Tidak ada penalty kondisi',
        reasonCode: 'on_time'
      }
    }

    const totalPenalty = manualPrice * quantity
    return {
      penalty: totalPenalty,
      description: `Manual pricing untuk kondisi ${conditionCategory}: ${manualPrice.toLocaleString('id-ID')} x ${quantity} unit`,
      reasonCode: 'manual_pricing'
    }
  }

  /**
   * Calculate enhanced penalty with flat system and manual pricing
   * NEW: Main method for new penalty calculation system
   */
  static calculateEnhancedPenalty(
    item: {
      id: string
      productName: string
      expectedReturnDate: Date
      actualReturnDate: Date
      conditionCategory?: string
      manualPrice?: number
      quantity: number
      useManualPricing?: boolean
      modalAwal?: number
    },
    applyFlatLatePenalty: boolean = true,
    customLatePenalty?: number
  ): {
    itemId: string
    productName: string
    flatLatePenalty: number
    conditionPenalty: number
    totalPenalty: number
    isLate: boolean
    lateDays: number
    description: string
    breakdown: {
      flatPenalty: number
      manualPricing: number
    }
  } {
    // Calculate flat late penalty
    const latePenaltyResult = this.calculateFlatLatePenalty(
      item.expectedReturnDate,
      item.actualReturnDate,
      customLatePenalty
    )

    const flatLatePenalty = applyFlatLatePenalty ? latePenaltyResult.penalty : 0

    // Calculate manual pricing penalty
    const manualPricingResult = this.calculateManualPricingPenalty(
      item.conditionCategory || 'BAIK',
      item.manualPrice || 0,
      item.quantity,
      item.useManualPricing
    )

    const totalPenalty = flatLatePenalty + manualPricingResult.penalty

    // Generate description
    let description = ''
    if (flatLatePenalty > 0 && manualPricingResult.penalty > 0) {
      description = `Kombinasi penalty keterlambatan (${this.formatPenaltyAmount(flatLatePenalty)}) dan ${manualPricingResult.description.toLowerCase()}`
    } else if (flatLatePenalty > 0) {
      description = `Penalty keterlambatan flat rate (${latePenaltyResult.lateDays} hari)`
    } else if (manualPricingResult.penalty > 0) {
      description = manualPricingResult.description
    } else {
      description = 'Tidak ada penalty - dikembalikan tepat waktu dalam kondisi baik'
    }

    return {
      itemId: item.id,
      productName: item.productName,
      flatLatePenalty,
      conditionPenalty: manualPricingResult.penalty,
      totalPenalty,
      isLate: latePenaltyResult.isLate,
      lateDays: latePenaltyResult.lateDays,
      description,
      breakdown: {
        flatPenalty: flatLatePenalty,
        manualPricing: manualPricingResult.penalty
      }
    }
  }

  /**
   * Calculate transaction penalties with new flat + manual pricing system
   * NEW: Enhanced version for the new penalty system
   */
  static calculateEnhancedTransactionPenalties(
    items: Array<{
      id: string
      productName: string
      expectedReturnDate: Date
      actualReturnDate: Date
      conditionCategory?: string
      manualPrice?: number
      quantity: number
      useManualPricing?: boolean
      modalAwal?: number
    }>,
    settings?: {
      applyFlatLatePenalty?: boolean
      customLatePenalty?: number
    }
  ): {
    totalPenalty: number
    flatLatePenalty: number
    conditionPenalties: number
    isLateReturn: boolean
    itemPenalties: Array<ReturnType<typeof PenaltyCalculator.calculateEnhancedPenalty>>
    summary: {
      totalItems: number
      lateItems: number
      onTimeItems: number
      manuallyPricedItems: number
      totalFlatPenalties: number
      totalManualPricing: number
    }
  } {
    const { applyFlatLatePenalty = true, customLatePenalty } = settings || {}

    const itemPenalties = items.map(item =>
      this.calculateEnhancedPenalty(item, applyFlatLatePenalty, customLatePenalty)
    )

    const flatLatePenalty = itemPenalties.reduce((sum, penalty) => sum + penalty.flatLatePenalty, 0)
    const conditionPenalties = itemPenalties.reduce((sum, penalty) => sum + penalty.conditionPenalty, 0)
    const totalPenalty = flatLatePenalty + conditionPenalties

    const isLateReturn = itemPenalties.some(penalty => penalty.isLate)
    const lateItems = itemPenalties.filter(penalty => penalty.isLate).length
    const manuallyPricedItems = itemPenalties.filter(penalty => penalty.conditionPenalty > 0).length

    return {
      totalPenalty,
      flatLatePenalty,
      conditionPenalties,
      isLateReturn,
      itemPenalties,
      summary: {
        totalItems: itemPenalties.length,
        lateItems,
        onTimeItems: itemPenalties.length - lateItems,
        manuallyPricedItems,
        totalFlatPenalties: flatLatePenalty,
        totalManualPricing: conditionPenalties
      }
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
      // New flat penalty system rules
      flatLatePenalty: this.FLAT_LATE_PENALTY,
      enableManualPricing: this.ENABLE_MANUAL_PRICING,
      supportedConditions: [
        // Current frontend conditions (from ConditionRow.tsx)
        'baik',           // Rp 0
        'kotor',          // Rp 5,000
        'rusak ringan',   // Rp 15,000
        'rusak berat',    // Rp 50,000
        'hilang',         // modal_awal
        // Legacy conditions (backward compatibility)
        'Baik - tidak ada kerusakan',
        'Baik - sedikit kotor/kusut',
        'Cukup - ada noda ringan',
        'Cukup - ada kerusakan kecil',
        'Buruk - ada noda berat',
        'Buruk - ada kerusakan besar',
        'Hilang/tidak dikembalikan'
      ],
      // New condition categories for manual pricing
      conditionCategories: [
        'BAIK',
        'KOTOR',
        'RUSAK_RINGAN',
        'RUSAK_BERAT',
        'HILANG'
      ]
    }
  }
}