/**
 * Pickup Validation Unit Tests - TSK-22
 * Test coverage for business rules and validation logic
 */

import { describe, it, expect } from '@jest/globals'
import { PickupBusinessRules, PickupValidator, ValidationContext } from './pickupValidation'
import { PickupItemRequest } from './kasirSchema'
import { Decimal } from '@prisma/client/runtime/library'

// Mock data
const mockValidationContext: ValidationContext = {
  transactionStatus: 'active',
  transactionCode: 'TXN-20250131-001',
  items: [
    {
      id: 'item-1',
      transaksiId: 'txn-123',
      produkId: 'prod-1',
      jumlah: 5,
      jumlahDiambil: 0,
      hargaSewa: new Decimal('50000'),
      durasi: 7,
      subtotal: new Decimal('350000'),
      kondisiAwal: 'Baik',
      kondisiAkhir: null,
      statusKembali: 'belum',
      produk: {
        id: 'prod-1',
        name: 'Dress Elegant',
        code: 'DRES1',
      },
    },
    {
      id: 'item-2',
      transaksiId: 'txn-123',
      produkId: 'prod-2',
      jumlah: 3,
      jumlahDiambil: 1,
      hargaSewa: new Decimal('75000'),
      durasi: 7,
      subtotal: new Decimal('525000'),
      kondisiAwal: 'Baik',
      kondisiAkhir: null,
      statusKembali: 'belum',
      produk: {
        id: 'prod-2',
        name: 'Suit Formal',
        code: 'SUIT1',
      },
    },
  ],
}

describe('PickupBusinessRules', () => {
  describe('validateTransactionStatus', () => {
    it('should validate active transaction status', () => {
      // Act
      const result = PickupBusinessRules.validateTransactionStatus(mockValidationContext)

      // Assert
      expect(result.valid).toBe(true)
      expect(result.ruleCode).toBe('TRANSACTION_STATUS_VALID')
      expect(result.severity).toBe('info')
    })

    it('should reject non-active transaction status', () => {
      // Arrange
      const inactiveContext = {
        ...mockValidationContext,
        transactionStatus: 'selesai',
      }

      // Act
      const result = PickupBusinessRules.validateTransactionStatus(inactiveContext)

      // Assert
      expect(result.valid).toBe(false)
      expect(result.ruleCode).toBe('INVALID_TRANSACTION_STATUS')
      expect(result.severity).toBe('error')
      expect(result.message).toContain('selesai')
    })
  })

  describe('validatePickupQuantity', () => {
    const mockItem = mockValidationContext.items[0]

    it('should reject zero or negative quantity', () => {
      // Act
      const result = PickupBusinessRules.validatePickupQuantity(mockItem, 0, mockItem.produk.name)

      // Assert
      expect(result.valid).toBe(false)
      expect(result.ruleCode).toBe('INVALID_PICKUP_QUANTITY')
      expect(result.severity).toBe('error')
    })

    it('should reject quantity exceeding available', () => {
      // Act
      const result = PickupBusinessRules.validatePickupQuantity(
        mockItem,
        10, // Available: 5, requested: 10
        mockItem.produk.name,
      )

      // Assert
      expect(result.valid).toBe(false)
      expect(result.ruleCode).toBe('PICKUP_QUANTITY_EXCEEDED')
      expect(result.severity).toBe('error')
      expect(result.message).toContain('melebihi sisa yang tersedia')
    })

    it('should warn for partial pickup', () => {
      // Act
      const result = PickupBusinessRules.validatePickupQuantity(
        mockItem,
        2, // Available: 5, pickup: 2 (partial)
        mockItem.produk.name,
      )

      // Assert
      expect(result.valid).toBe(true)
      expect(result.ruleCode).toBe('PARTIAL_PICKUP_WARNING')
      expect(result.severity).toBe('warning')
      expect(result.message).toContain('sebagian')
    })
  })

  describe('validateItemNotFullyPickedUp', () => {
    it('should allow pickup for available items', () => {
      // Arrange
      const availableItem = mockValidationContext.items[0] // jumlahDiambil: 0

      // Act
      const result = PickupBusinessRules.validateItemNotFullyPickedUp(
        availableItem,
        availableItem.produk.name,
      )

      // Assert
      expect(result.valid).toBe(true)
      expect(result.ruleCode).toBe('ITEM_AVAILABLE_FOR_PICKUP')
    })

    it('should reject pickup for fully picked up items', () => {
      // Arrange
      const fullyPickedUpItem = {
        ...mockValidationContext.items[0],
        jumlah: 3,
        jumlahDiambil: 3, // Fully picked up
      }

      // Act
      const result = PickupBusinessRules.validateItemNotFullyPickedUp(
        fullyPickedUpItem,
        fullyPickedUpItem.produk.name,
      )

      // Assert
      expect(result.valid).toBe(false)
      expect(result.ruleCode).toBe('ITEM_ALREADY_FULLY_PICKED_UP')
      expect(result.severity).toBe('error')
    })
  })

  describe('validatePickupBatchLimits', () => {
    it('should validate normal batch size', () => {
      // Arrange
      const normalBatch: PickupItemRequest[] = [
        { id: 'item-1', jumlahDiambil: 2 },
        { id: 'item-2', jumlahDiambil: 1 },
      ]

      // Act
      const result = PickupBusinessRules.validatePickupBatchLimits(normalBatch)

      // Assert
      expect(result.valid).toBe(true)
      expect(result.ruleCode).toBe('BATCH_SIZE_VALID')
    })

    it('should warn for large batches', () => {
      // Arrange
      const largeBatch: PickupItemRequest[] = [{ id: 'item-1', jumlahDiambil: 150 }]

      // Act
      const result = PickupBusinessRules.validatePickupBatchLimits(largeBatch)

      // Assert
      expect(result.valid).toBe(true)
      expect(result.ruleCode).toBe('LARGE_BATCH_WARNING')
      expect(result.severity).toBe('warning')
    })

    it('should reject batches exceeding item limit', () => {
      // Arrange
      const oversizedBatch: PickupItemRequest[] = Array.from({ length: 51 }, (_, i) => ({
        id: `item-${i}`,
        jumlahDiambil: 1,
      }))

      // Act
      const result = PickupBusinessRules.validatePickupBatchLimits(oversizedBatch)

      // Assert
      expect(result.valid).toBe(false)
      expect(result.ruleCode).toBe('BATCH_ITEM_LIMIT_EXCEEDED')
      expect(result.severity).toBe('error')
    })

    it('should reject batches exceeding quantity limit', () => {
      // Arrange
      const highQuantityBatch: PickupItemRequest[] = [{ id: 'item-1', jumlahDiambil: 1001 }]

      // Act
      const result = PickupBusinessRules.validatePickupBatchLimits(highQuantityBatch)

      // Assert
      expect(result.valid).toBe(false)
      expect(result.ruleCode).toBe('BATCH_QUANTITY_LIMIT_EXCEEDED')
      expect(result.severity).toBe('error')
    })
  })

  describe('validateNoDuplicateItems', () => {
    it('should validate unique items', () => {
      // Arrange
      const uniqueItems: PickupItemRequest[] = [
        { id: 'item-1', jumlahDiambil: 2 },
        { id: 'item-2', jumlahDiambil: 1 },
      ]

      // Act
      const result = PickupBusinessRules.validateNoDuplicateItems(uniqueItems)

      // Assert
      expect(result.valid).toBe(true)
      expect(result.ruleCode).toBe('NO_DUPLICATE_ITEMS')
    })

    it('should reject duplicate items', () => {
      // Arrange
      const duplicateItems: PickupItemRequest[] = [
        { id: 'item-1', jumlahDiambil: 2 },
        { id: 'item-1', jumlahDiambil: 1 }, // Duplicate
      ]

      // Act
      const result = PickupBusinessRules.validateNoDuplicateItems(duplicateItems)

      // Assert
      expect(result.valid).toBe(false)
      expect(result.ruleCode).toBe('DUPLICATE_ITEMS_IN_BATCH')
      expect(result.severity).toBe('error')
    })
  })

  describe('validateBusinessHours', () => {
    it('should validate normal business hours', () => {
      // Arrange - Tuesday 10 AM
      const businessHoursTime = new Date('2025-01-28T10:00:00')

      // Act
      const result = PickupBusinessRules.validateBusinessHours(businessHoursTime)

      // Assert
      expect(result.valid).toBe(true)
      expect(result.ruleCode).toBe('BUSINESS_HOURS_VALID')
    })

    it('should warn for weekend pickup', () => {
      // Arrange - Sunday 10 AM
      const weekendTime = new Date('2025-02-02T10:00:00')

      // Act
      const result = PickupBusinessRules.validateBusinessHours(weekendTime)

      // Assert
      expect(result.valid).toBe(true)
      expect(result.ruleCode).toBe('WEEKEND_PICKUP_WARNING')
      expect(result.severity).toBe('warning')
    })

    it('should warn for outside business hours', () => {
      // Arrange - Tuesday 6 AM (outside hours)
      const earlyTime = new Date('2025-01-28T06:00:00')

      // Act
      const result = PickupBusinessRules.validateBusinessHours(earlyTime)

      // Assert
      expect(result.valid).toBe(true)
      expect(result.ruleCode).toBe('OUTSIDE_BUSINESS_HOURS_WARNING')
      expect(result.severity).toBe('warning')
    })
  })

  describe('validateConcurrentPickup', () => {
    it('should validate when no concurrent pickup detected', () => {
      // Arrange
      const items = mockValidationContext.items
      const pickupItems: PickupItemRequest[] = [{ id: 'item-1', jumlahDiambil: 2 }]
      const oldTime = new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago

      // Act
      const result = PickupBusinessRules.validateConcurrentPickup(items, pickupItems, oldTime)

      // Assert
      expect(result.valid).toBe(true)
      expect(result.ruleCode).toBe('NO_CONCURRENT_PICKUP')
    })

    it('should detect potential concurrent pickup', () => {
      // Arrange
      const items = mockValidationContext.items
      const pickupItems: PickupItemRequest[] = [
        { id: 'item-1', jumlahDiambil: 10 }, // Exceeds available (5)
      ]
      const recentTime = new Date(Date.now() - 2 * 60 * 1000) // 2 minutes ago

      // Act
      const result = PickupBusinessRules.validateConcurrentPickup(items, pickupItems, recentTime)

      // Assert
      expect(result.valid).toBe(false)
      expect(result.ruleCode).toBe('CONCURRENT_PICKUP_DETECTED')
      expect(result.severity).toBe('error')
    })
  })
})

describe('PickupValidator', () => {
  describe('validatePickupRequest', () => {
    it('should perform comprehensive validation and return valid result', () => {
      // Arrange
      const pickupItems: PickupItemRequest[] = [
        { id: 'item-1', jumlahDiambil: 3 },
        { id: 'item-2', jumlahDiambil: 1 },
      ]

      // Act
      const result = PickupValidator.validatePickupRequest(mockValidationContext, pickupItems)

      // Assert
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings.length).toBeGreaterThanOrEqual(0)
      expect(result.info.length).toBeGreaterThan(0)
    })

    it('should detect multiple validation errors', () => {
      // Arrange
      const invalidContext = {
        ...mockValidationContext,
        transactionStatus: 'cancelled', // Invalid status
      }
      const invalidPickupItems: PickupItemRequest[] = [
        { id: 'item-1', jumlahDiambil: 10 }, // Exceeds available
        { id: 'item-1', jumlahDiambil: 5 }, // Duplicate
        { id: 'non-existent', jumlahDiambil: 1 }, // Non-existent item
      ]

      // Act
      const result = PickupValidator.validatePickupRequest(invalidContext, invalidPickupItems)

      // Assert
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)

      // Check for specific error types
      const errorCodes = result.errors.map((e) => e.ruleCode)
      expect(errorCodes).toContain('INVALID_TRANSACTION_STATUS')
      expect(errorCodes).toContain('DUPLICATE_ITEMS_IN_BATCH')
    })

    it('should categorize validation results correctly', () => {
      // Arrange
      const pickupItems: PickupItemRequest[] = [
        { id: 'item-1', jumlahDiambil: 2 }, // Partial pickup (warning expected)
      ]

      // Act
      const result = PickupValidator.validatePickupRequest(mockValidationContext, pickupItems)

      // Assert
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.info.length).toBeGreaterThan(0)

      // Check specific warning
      const warningCodes = result.warnings.map((w) => w.ruleCode)
      expect(warningCodes).toContain('PARTIAL_PICKUP_WARNING')
    })
  })

  describe('generateValidationReport', () => {
    it('should generate comprehensive validation report', () => {
      // Arrange
      const validationResult = {
        valid: false,
        errors: [
          {
            valid: false,
            ruleCode: 'INVALID_TRANSACTION_STATUS',
            message: 'Transaction status invalid',
            severity: 'error' as const,
          },
        ],
        warnings: [
          {
            valid: true,
            ruleCode: 'PARTIAL_PICKUP_WARNING',
            message: 'Partial pickup detected',
            severity: 'warning' as const,
          },
        ],
        info: [
          {
            valid: true,
            ruleCode: 'BATCH_SIZE_VALID',
            message: 'Batch size is valid',
            severity: 'info' as const,
          },
        ],
      }

      // Act
      const report = PickupValidator.generateValidationReport(validationResult)

      // Assert
      expect(report).toContain('=== PICKUP VALIDATION REPORT ===')
      expect(report).toContain('Status: INVALID')
      expect(report).toContain('ERRORS:')
      expect(report).toContain('INVALID_TRANSACTION_STATUS')
      expect(report).toContain('WARNINGS:')
      expect(report).toContain('PARTIAL_PICKUP_WARNING')
      expect(report).toContain('INFO:')
      expect(report).toContain('BATCH_SIZE_VALID')
    })

    it('should generate valid status report', () => {
      // Arrange
      const validResult = {
        valid: true,
        errors: [],
        warnings: [],
        info: [
          {
            valid: true,
            ruleCode: 'ALL_CHECKS_PASSED',
            message: 'All validation checks passed',
            severity: 'info' as const,
          },
        ],
      }

      // Act
      const report = PickupValidator.generateValidationReport(validResult)

      // Assert
      expect(report).toContain('Status: VALID')
      expect(report).not.toContain('ERRORS:')
      expect(report).not.toContain('WARNINGS:')
    })
  })
})
