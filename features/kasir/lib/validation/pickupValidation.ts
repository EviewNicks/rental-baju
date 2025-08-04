/**
 * Pickup Validation Utilities - TSK-22
 * Advanced business rules and validation logic for pickup operations
 * Comprehensive edge case handling and business rule enforcement
 */

import { TransaksiItem } from '@prisma/client'
import { PickupItemRequest } from './kasirSchema'

export interface ValidationContext {
  transactionStatus: string
  transactionCode: string
  items: Array<TransaksiItem & {
    produk: {
      id: string
      name: string
      code: string
    }
  }>
}

export interface BusinessRuleResult {
  valid: boolean
  ruleCode: string
  message: string
  severity: 'error' | 'warning' | 'info'
  itemId?: string
}

export class PickupBusinessRules {
  /**
   * Rule 1: Transaction must be in active status
   */
  static validateTransactionStatus(context: ValidationContext): BusinessRuleResult {
    if (context.transactionStatus !== 'active') {
      return {
        valid: false,
        ruleCode: 'INVALID_TRANSACTION_STATUS',
        message: `Transaksi ${context.transactionCode} dengan status '${context.transactionStatus}' tidak dapat diproses pickup`,
        severity: 'error'
      }
    }

    return {
      valid: true,
      ruleCode: 'TRANSACTION_STATUS_VALID',
      message: 'Status transaksi valid untuk pickup',
      severity: 'info'
    }
  }

  /**
   * Rule 2: Pickup quantity must be within valid range
   */
  static validatePickupQuantity(
    item: TransaksiItem,
    requestedQuantity: number,
    productName: string
  ): BusinessRuleResult {
    const remainingQuantity = item.jumlah - item.jumlahDiambil

    // Must be positive
    if (requestedQuantity <= 0) {
      return {
        valid: false,
        ruleCode: 'INVALID_PICKUP_QUANTITY',
        message: `Jumlah pickup untuk ${productName} harus lebih dari 0`,
        severity: 'error',
        itemId: item.id
      }
    }

    // Cannot exceed remaining quantity
    if (requestedQuantity > remainingQuantity) {
      return {
        valid: false,
        ruleCode: 'PICKUP_QUANTITY_EXCEEDED',
        message: `Jumlah pickup untuk ${productName} (${requestedQuantity}) melebihi sisa yang tersedia (${remainingQuantity})`,
        severity: 'error',
        itemId: item.id
      }
    }

    // Warning for partial pickup
    if (requestedQuantity < remainingQuantity) {
      return {
        valid: true,
        ruleCode: 'PARTIAL_PICKUP_WARNING',
        message: `Pickup sebagian untuk ${productName}: ${requestedQuantity}/${remainingQuantity} item`,
        severity: 'warning',
        itemId: item.id
      }
    }

    return {
      valid: true,
      ruleCode: 'PICKUP_QUANTITY_VALID',
      message: `Jumlah pickup untuk ${productName} valid`,
      severity: 'info',
      itemId: item.id
    }
  }

  /**
   * Rule 3: Prevent double pickup (item already fully picked up)
   */
  static validateItemNotFullyPickedUp(
    item: TransaksiItem,
    productName: string
  ): BusinessRuleResult {
    if (item.jumlahDiambil >= item.jumlah) {
      return {
        valid: false,
        ruleCode: 'ITEM_ALREADY_FULLY_PICKED_UP',
        message: `Item ${productName} sudah diambil sepenuhnya (${item.jumlahDiambil}/${item.jumlah})`,
        severity: 'error',
        itemId: item.id
      }
    }

    return {
      valid: true,
      ruleCode: 'ITEM_AVAILABLE_FOR_PICKUP',
      message: `Item ${productName} tersedia untuk pickup`,
      severity: 'info',
      itemId: item.id
    }
  }

  /**
   * Rule 4: Validate pickup batch limits
   */
  static validatePickupBatchLimits(pickupItems: PickupItemRequest[]): BusinessRuleResult {
    const totalItemsInBatch = pickupItems.length
    const totalQuantityInBatch = pickupItems.reduce((sum, item) => sum + item.jumlahDiambil, 0)

    // Maximum items per batch
    if (totalItemsInBatch > 50) {
      return {
        valid: false,
        ruleCode: 'BATCH_ITEM_LIMIT_EXCEEDED',
        message: `Maksimal 50 jenis item dapat diproses per batch (saat ini: ${totalItemsInBatch})`,
        severity: 'error'
      }
    }

    // Maximum total quantity per batch
    if (totalQuantityInBatch > 1000) {
      return {
        valid: false,
        ruleCode: 'BATCH_QUANTITY_LIMIT_EXCEEDED',
        message: `Maksimal 1000 total quantity dapat diproses per batch (saat ini: ${totalQuantityInBatch})`,
        severity: 'error'
      }
    }

    // Warning for large batches
    if (totalQuantityInBatch > 100) {
      return {
        valid: true,
        ruleCode: 'LARGE_BATCH_WARNING',
        message: `Batch besar terdeteksi: ${totalQuantityInBatch} total quantity. Pastikan kapasitas handling mencukupi`,
        severity: 'warning'
      }
    }

    return {
      valid: true,
      ruleCode: 'BATCH_SIZE_VALID',
      message: `Ukuran batch valid: ${totalItemsInBatch} items, ${totalQuantityInBatch} total quantity`,
      severity: 'info'
    }
  }

  /**
   * Rule 5: Check for duplicate items in pickup request
   */
  static validateNoDuplicateItems(pickupItems: PickupItemRequest[]): BusinessRuleResult {
    const itemIds = pickupItems.map(item => item.id)
    const uniqueIds = new Set(itemIds)
    
    if (uniqueIds.size !== itemIds.length) {
      const duplicates = itemIds.filter((id, index) => itemIds.indexOf(id) !== index)
      return {
        valid: false,
        ruleCode: 'DUPLICATE_ITEMS_IN_BATCH',
        message: `Item duplikat ditemukan dalam batch pickup: ${duplicates.join(', ')}`,
        severity: 'error'
      }
    }

    return {
      valid: true,
      ruleCode: 'NO_DUPLICATE_ITEMS',
      message: 'Tidak ada item duplikat dalam batch',
      severity: 'info'
    }
  }

  /**
   * Rule 6: Business hours validation (optional enhancement)
   */
  static validateBusinessHours(currentTime: Date = new Date()): BusinessRuleResult {
    const hour = currentTime.getHours()
    const day = currentTime.getDay() // 0 = Sunday, 6 = Saturday

    // Business hours: Monday-Saturday 8AM-8PM
    const isWeekend = day === 0 // Sunday
    const isOutsideHours = hour < 8 || hour >= 20

    if (isWeekend) {
      return {
        valid: true,
        ruleCode: 'WEEKEND_PICKUP_WARNING',
        message: 'Pickup pada hari libur. Pastikan koordinasi dengan tim operasional',
        severity: 'warning'
      }
    }

    if (isOutsideHours) {
      return {
        valid: true,
        ruleCode: 'OUTSIDE_BUSINESS_HOURS_WARNING',
        message: `Pickup di luar jam operasional (${hour}:00). Pastikan otorisasi supervisor`,
        severity: 'warning'
      }
    }

    return {
      valid: true,
      ruleCode: 'BUSINESS_HOURS_VALID',
      message: 'Pickup dalam jam operasional normal',
      severity: 'info'
    }
  }

  /**
   * Rule 7: Concurrent pickup detection (advanced)
   */
  static validateConcurrentPickup(
    items: Array<TransaksiItem>,
    pickupItems: PickupItemRequest[],
    lastUpdateTime: Date
  ): BusinessRuleResult {
    const timeDiff = Date.now() - lastUpdateTime.getTime()
    const CONCURRENT_THRESHOLD = 5 * 60 * 1000 // 5 minutes

    // Check if transaction was recently modified
    if (timeDiff < CONCURRENT_THRESHOLD) {
      // Check if any item quantities have changed unexpectedly
      for (const pickupItem of pickupItems) {
        const currentItem = items.find(item => item.id === pickupItem.id)
        if (currentItem) {
          const expectedAvailable = currentItem.jumlah - currentItem.jumlahDiambil
          if (pickupItem.jumlahDiambil > expectedAvailable) {
            return {
              valid: false,
              ruleCode: 'CONCURRENT_PICKUP_DETECTED',
              message: `Kemungkinan pickup bersamaan terdeteksi. Data item telah berubah sejak ${timeDiff / 1000}s yang lalu`,
              severity: 'error',
              itemId: pickupItem.id
            }
          }
        }
      }
    }

    return {
      valid: true,
      ruleCode: 'NO_CONCURRENT_PICKUP',
      message: 'Tidak ada pickup bersamaan terdeteksi',
      severity: 'info'
    }
  }
}

/**
 * Comprehensive validation orchestrator
 */
export class PickupValidator {
  static validatePickupRequest(
    context: ValidationContext,
    pickupItems: PickupItemRequest[]
  ): {
    valid: boolean
    errors: BusinessRuleResult[]
    warnings: BusinessRuleResult[]
    info: BusinessRuleResult[]
  } {
    const results: BusinessRuleResult[] = []

    // 1. Transaction status validation
    results.push(PickupBusinessRules.validateTransactionStatus(context))

    // 2. Batch limits validation
    results.push(PickupBusinessRules.validatePickupBatchLimits(pickupItems))

    // 3. Duplicate items validation
    results.push(PickupBusinessRules.validateNoDuplicateItems(pickupItems))

    // 4. Business hours validation
    results.push(PickupBusinessRules.validateBusinessHours())

    // 5. Individual item validations
    for (const pickupItem of pickupItems) {
      const transactionItem = context.items.find(item => item.id === pickupItem.id)
      
      if (!transactionItem) {
        results.push({
          valid: false,
          ruleCode: 'ITEM_NOT_FOUND',
          message: `Item dengan ID ${pickupItem.id} tidak ditemukan dalam transaksi`,
          severity: 'error',
          itemId: pickupItem.id
        })
        continue
      }

      // Item availability check
      results.push(PickupBusinessRules.validateItemNotFullyPickedUp(
        transactionItem,
        transactionItem.produk.name
      ))

      // Quantity validation
      results.push(PickupBusinessRules.validatePickupQuantity(
        transactionItem,
        pickupItem.jumlahDiambil,
        transactionItem.produk.name
      ))
    }

    // 6. Concurrent pickup validation
    const lastUpdate = new Date() // Use current time for concurrent pickup check
    
    results.push(PickupBusinessRules.validateConcurrentPickup(
      context.items,
      pickupItems,
      lastUpdate
    ))

    // Categorize results
    const errors = results.filter(r => r.severity === 'error' && !r.valid)
    const warnings = results.filter(r => r.severity === 'warning')
    const info = results.filter(r => r.severity === 'info' && r.valid)

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      info
    }
  }

  /**
   * Generate detailed validation report
   */
  static generateValidationReport(validationResult: {
    valid: boolean
    errors: BusinessRuleResult[]
    warnings: BusinessRuleResult[]
    info: BusinessRuleResult[]
  }): string {
    const lines: string[] = []
    
    lines.push('=== PICKUP VALIDATION REPORT ===')
    lines.push(`Status: ${validationResult.valid ? 'VALID' : 'INVALID'}`)
    lines.push('')

    if (validationResult.errors.length > 0) {
      lines.push('ERRORS:')
      validationResult.errors.forEach((error, index) => {
        lines.push(`${index + 1}. [${error.ruleCode}] ${error.message}`)
      })
      lines.push('')
    }

    if (validationResult.warnings.length > 0) {
      lines.push('WARNINGS:')
      validationResult.warnings.forEach((warning, index) => {
        lines.push(`${index + 1}. [${warning.ruleCode}] ${warning.message}`)
      })
      lines.push('')
    }

    if (validationResult.info.length > 0) {
      lines.push('INFO:')
      validationResult.info.forEach((info, index) => {
        lines.push(`${index + 1}. [${info.ruleCode}] ${info.message}`)
      })
    }

    return lines.join('\n')
  }
}