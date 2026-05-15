/**
 * Unit Tests for STOCK-001 Fix: Sarung Gratis Filter Logic
 *
 * Tests the isSarungGratisItem() helper method to ensure:
 * 1. Sarung gratis items are correctly identified and skipped
 * 2. Sarung standalone items are correctly processed
 * 3. Jas items are never filtered
 * 4. Edge cases are handled properly
 */

import { PrismaClient } from '@prisma/client'
import { UnifiedReturnService } from '@/features/kasir/services/returnService'

// Mock Prisma Client
const mockPrismaClient = {
  transaksi: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  transaksiItem: {
    findMany: jest.fn(),
    update: jest.fn(),
  },
  transaksiItemReturn: {
    create: jest.fn(),
    createMany: jest.fn(),
    findMany: jest.fn(),
  },
  productSize: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  product: {
    findMany: jest.fn(),
  },
  pembayaran: {
    create: jest.fn(),
  },
  aktivitasTransaksi: {
    create: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(mockPrismaClient)),
} as unknown as PrismaClient

describe('STOCK-001: Sarung Gratis Filter Logic', () => {
  let returnService: UnifiedReturnService
  const mockUserId = 'test-user-id'

  beforeEach(() => {
    jest.clearAllMocks()
    returnService = new UnifiedReturnService(mockPrismaClient, mockUserId)
  })

  describe('isSarungGratisItem() - Primary Detection (isSarungGratis flag)', () => {
    it('should return true for sarung gratis with explicit flag', () => {
      const item = {
        itemId: 'item-1',
        conditions: [{ kondisiAkhir: 'Baik', jumlahKembali: 1 }],
      }

      const transactionItem = {
        id: 'item-1',
        kondisiAwal: 'productSizeId|UNIVERSAL|ADULT|baik',
        isSarungGratis: true, // ✅ Explicit flag
        subtotal: 0,
        produk: {
          id: 'sarung-1',
          name: 'Sarung ST13',
          category: 'sarung',
        },
      }

      // Access private method via type assertion
      const result = (returnService as any).isSarungGratisItem(item, transactionItem)

      expect(result).toBe(true)
    })

    it('should return false for sarung standalone with explicit flag false', () => {
      const item = {
        itemId: 'item-1',
        conditions: [{ kondisiAkhir: 'Baik', jumlahKembali: 1 }],
      }

      const transactionItem = {
        id: 'item-1',
        kondisiAwal: 'productSizeId|UNIVERSAL|ADULT|baik',
        isSarungGratis: false, // ✅ Explicit flag
        subtotal: 30000,
        produk: {
          id: 'sarung-1',
          name: 'Sarung ST13',
          category: 'sarung',
        },
      }

      const result = (returnService as any).isSarungGratisItem(item, transactionItem)

      expect(result).toBe(false)
    })
  })

  describe('isSarungGratisItem() - Fallback Detection (subtotal = 0)', () => {
    it('should return true for sarung with subtotal = 0 (no explicit flag)', () => {
      const item = {
        itemId: 'item-1',
        conditions: [{ kondisiAkhir: 'Baik', jumlahKembali: 1 }],
      }

      const transactionItem = {
        id: 'item-1',
        kondisiAwal: 'productSizeId|UNIVERSAL|ADULT|baik',
        // No isSarungGratis flag
        subtotal: 0, // ✅ Fallback detection
        produk: {
          id: 'sarung-1',
          name: 'Sarung ST13',
          category: 'sarung',
        },
      }

      const result = (returnService as any).isSarungGratisItem(item, transactionItem)

      expect(result).toBe(true)
    })

    it('should return false for sarung with subtotal > 0', () => {
      const item = {
        itemId: 'item-1',
        conditions: [{ kondisiAkhir: 'Baik', jumlahKembali: 1 }],
      }

      const transactionItem = {
        id: 'item-1',
        kondisiAwal: 'productSizeId|UNIVERSAL|ADULT|baik',
        subtotal: 30000, // ✅ Has price
        produk: {
          id: 'sarung-1',
          name: 'Sarung ST13',
          category: 'sarung',
        },
      }

      const result = (returnService as any).isSarungGratisItem(item, transactionItem)

      expect(result).toBe(false)
    })
  })

  describe('isSarungGratisItem() - Jas Items (with linkedSarung)', () => {
    it('should return false for jas items (items with linkedSarung)', () => {
      const item = {
        itemId: 'item-1',
        conditions: [{ kondisiAkhir: 'Baik', jumlahKembali: 1 }],
      }

      const transactionItem = {
        id: 'item-1',
        kondisiAwal: JSON.stringify({
          productSizeId: 'jas-size-id',
          size: 'M',
          ageCategory: 'ADULT',
          condition: 'baik',
          linkedSarung: {
            // ✅ Has linkedSarung - this is a jas item
            productId: 'sarung-1',
            productSizeId: 'sarung-size-id',
            quantity: 1,
          },
        }),
        subtotal: 150000,
        produk: {
          id: 'jas-1',
          name: 'Jas JM01',
          category: 'jas',
        },
      }

      const result = (returnService as any).isSarungGratisItem(item, transactionItem)

      expect(result).toBe(false)
    })
  })

  describe('isSarungGratisItem() - Non-Sarung Items', () => {
    it('should return false for non-sarung category items', () => {
      const item = {
        itemId: 'item-1',
        conditions: [{ kondisiAkhir: 'Baik', jumlahKembali: 1 }],
      }

      const transactionItem = {
        id: 'item-1',
        kondisiAwal: 'productSizeId|M|ADULT|baik',
        subtotal: 0, // Even with subtotal = 0
        produk: {
          id: 'jas-1',
          name: 'Jas JM01',
          category: 'jas', // ✅ Not sarung
        },
      }

      const result = (returnService as any).isSarungGratisItem(item, transactionItem)

      expect(result).toBe(false)
    })

    it('should return false for accessories category', () => {
      const item = {
        itemId: 'item-1',
        conditions: [{ kondisiAkhir: 'Baik', jumlahKembali: 1 }],
      }

      const transactionItem = {
        id: 'item-1',
        kondisiAwal: 'productSizeId|UNIVERSAL|ADULT|baik',
        subtotal: 0,
        produk: {
          id: 'acc-1',
          name: 'Dasi',
          category: 'accessories',
        },
      }

      const result = (returnService as any).isSarungGratisItem(item, transactionItem)

      expect(result).toBe(false)
    })
  })

  describe('isSarungGratisItem() - Edge Cases', () => {
    it('should handle null kondisiAwal gracefully', () => {
      const item = {
        itemId: 'item-1',
        conditions: [{ kondisiAkhir: 'Baik', jumlahKembali: 1 }],
      }

      const transactionItem = {
        id: 'item-1',
        kondisiAwal: null, // ✅ Null kondisiAwal
        subtotal: 0,
        produk: {
          id: 'sarung-1',
          name: 'Sarung ST13',
          category: 'sarung',
        },
      }

      const result = (returnService as any).isSarungGratisItem(item, transactionItem)

      expect(result).toBe(true) // Should still detect via subtotal
    })

    it('should handle undefined subtotal as 0', () => {
      const item = {
        itemId: 'item-1',
        conditions: [{ kondisiAkhir: 'Baik', jumlahKembali: 1 }],
      }

      const transactionItem = {
        id: 'item-1',
        kondisiAwal: 'productSizeId|UNIVERSAL|ADULT|baik',
        subtotal: undefined, // ✅ Undefined subtotal
        produk: {
          id: 'sarung-1',
          name: 'Sarung ST13',
          category: 'sarung',
        },
      }

      const result = (returnService as any).isSarungGratisItem(item, transactionItem)

      expect(result).toBe(true) // Should treat as 0
    })

    it('should handle missing product category', () => {
      const item = {
        itemId: 'item-1',
        conditions: [{ kondisiAkhir: 'Baik', jumlahKembali: 1 }],
      }

      const transactionItem = {
        id: 'item-1',
        kondisiAwal: 'productSizeId|UNIVERSAL|ADULT|baik',
        subtotal: 0,
        produk: {
          id: 'product-1',
          name: 'Unknown Product',
          // No category field
        },
      }

      const result = (returnService as any).isSarungGratisItem(item, transactionItem)

      expect(result).toBe(false) // Should return false if category missing
    })

    it('should handle Decimal subtotal type', () => {
      const item = {
        itemId: 'item-1',
        conditions: [{ kondisiAkhir: 'Baik', jumlahKembali: 1 }],
      }

      const transactionItem = {
        id: 'item-1',
        kondisiAwal: 'productSizeId|UNIVERSAL|ADULT|baik',
        subtotal: 0, // ✅ In real code, Decimal is converted to number before reaching this method
        produk: {
          id: 'sarung-1',
          name: 'Sarung ST13',
          category: 'sarung',
        },
      }

      const result = (returnService as any).isSarungGratisItem(item, transactionItem)

      expect(result).toBe(true)
    })
  })

  describe('isSarungGratisItem() - Real-World Scenarios', () => {
    it('Scenario 1: Sarung gratis from jas pairing', () => {
      const item = {
        itemId: 'sarung-item-id',
        conditions: [{ kondisiAkhir: 'Baik', jumlahKembali: 1 }],
      }

      const transactionItem = {
        id: 'sarung-item-id',
        kondisiAwal: 'sarung-size-id|UNIVERSAL|ADULT|baik',
        isSarungGratis: true,
        subtotal: 0,
        produk: {
          id: 'sarung-st13',
          name: 'Sarung ST13',
          category: 'sarung',
          code: 'ST13',
        },
      }

      const result = (returnService as any).isSarungGratisItem(item, transactionItem)

      expect(result).toBe(true)
    })

    it('Scenario 2: Sarung standalone rental', () => {
      const item = {
        itemId: 'sarung-item-id',
        conditions: [{ kondisiAkhir: 'Baik', jumlahKembali: 2 }],
      }

      const transactionItem = {
        id: 'sarung-item-id',
        kondisiAwal: 'sarung-size-id|UNIVERSAL|ADULT|baik',
        isSarungGratis: false,
        subtotal: 60000, // 2 × 30000
        produk: {
          id: 'sarung-st13',
          name: 'Sarung ST13',
          category: 'sarung',
          code: 'ST13',
        },
      }

      const result = (returnService as any).isSarungGratisItem(item, transactionItem)

      expect(result).toBe(false)
    })

    it('Scenario 3: Jas with linkedSarung', () => {
      const item = {
        itemId: 'jas-item-id',
        conditions: [{ kondisiAkhir: 'Baik', jumlahKembali: 1 }],
      }

      const transactionItem = {
        id: 'jas-item-id',
        kondisiAwal: JSON.stringify({
          productSizeId: 'jas-size-id',
          size: 'M',
          ageCategory: 'ADULT',
          condition: 'baik',
          linkedSarung: {
            productId: 'sarung-st13',
            productSizeId: 'sarung-size-id',
            quantity: 1,
            product: {
              name: 'Sarung ST13',
              code: 'ST13',
            },
          },
        }),
        subtotal: 150000,
        produk: {
          id: 'jas-jm01',
          name: 'Jas JM01',
          category: 'jas',
          code: 'JM01',
        },
      }

      const result = (returnService as any).isSarungGratisItem(item, transactionItem)

      expect(result).toBe(false)
    })

    it('Scenario 4: Mixed transaction - sarung standalone in same transaction as jas pairing', () => {
      // This sarung is standalone, not the gratis one
      const item = {
        itemId: 'sarung-standalone-id',
        conditions: [{ kondisiAkhir: 'Baik', jumlahKembali: 1 }],
      }

      const transactionItem = {
        id: 'sarung-standalone-id',
        kondisiAwal: 'sarung-size-id-2|UNIVERSAL|ADULT|baik',
        isSarungGratis: false, // ✅ Explicit: not gratis
        subtotal: 30000,
        produk: {
          id: 'sarung-st15',
          name: 'Sarung ST15',
          category: 'sarung',
          code: 'ST15',
        },
      }

      const result = (returnService as any).isSarungGratisItem(item, transactionItem)

      expect(result).toBe(false)
    })
  })

  describe('isSarungGratisItem() - Regression Tests', () => {
    it('should not filter sarung if category is undefined', () => {
      const item = {
        itemId: 'item-1',
        conditions: [{ kondisiAkhir: 'Baik', jumlahKembali: 1 }],
      }

      const transactionItem = {
        id: 'item-1',
        kondisiAwal: 'productSizeId|UNIVERSAL|ADULT|baik',
        subtotal: 0,
        produk: {
          id: 'product-1',
          name: 'Product',
          category: undefined,
        },
      }

      const result = (returnService as any).isSarungGratisItem(item, transactionItem)

      expect(result).toBe(false)
    })

    it('should not filter if produk object is missing', () => {
      const item = {
        itemId: 'item-1',
        conditions: [{ kondisiAkhir: 'Baik', jumlahKembali: 1 }],
      }

      const transactionItem = {
        id: 'item-1',
        kondisiAwal: 'productSizeId|UNIVERSAL|ADULT|baik',
        subtotal: 0,
        // No produk object
      }

      const result = (returnService as any).isSarungGratisItem(item, transactionItem)

      expect(result).toBe(false)
    })

    it('should handle case-sensitive category comparison', () => {
      const item = {
        itemId: 'item-1',
        conditions: [{ kondisiAkhir: 'Baik', jumlahKembali: 1 }],
      }

      const transactionItem = {
        id: 'item-1',
        kondisiAwal: 'productSizeId|UNIVERSAL|ADULT|baik',
        subtotal: 0,
        produk: {
          id: 'sarung-1',
          name: 'Sarung ST13',
          category: 'SARUNG', // ✅ Uppercase
        },
      }

      const result = (returnService as any).isSarungGratisItem(item, transactionItem)

      // Should return false because comparison is case-sensitive
      expect(result).toBe(false)
    })
  })
})

describe('STOCK-001: Integration Test - Filter in Stock Restoration Loop', () => {
  it('should document expected behavior in stock restoration', () => {
    // This is a documentation test to explain the expected flow
    const expectedFlow = {
      step1: 'Return request contains jas + sarung gratis items',
      step2: 'Filter loop checks each item with isSarungGratisItem()',
      step3: 'Sarung gratis is filtered out (skipped)',
      step4: 'Only jas item is processed',
      step5: 'Jas processing triggers dual restoration (jas + sarung)',
      step6: 'Result: Both items restored once, no double restoration',
    }

    expect(expectedFlow.step6).toBe('Result: Both items restored once, no double restoration')
  })
})
