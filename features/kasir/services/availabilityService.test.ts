/**
 * Unit Tests for AvailabilityService - RPK-26
 * Testing real-time product availability calculations with TDD approach
 * 
 * Coverage:
 * - Real-time availability calculation considering active rentals
 * - Multiple product availability checking
 * - Rental availability validation for transactions
 * - Category-based availability queries
 * - Availability summary and dashboard statistics
 * - Low stock product identification
 * - Transaction item validation
 * - Error handling scenarios
 */

import { AvailabilityService, createAvailabilityService } from './availabilityService'
import { PrismaClient } from '@prisma/client'

// Mock Decimal to avoid circular dependency issues
// Commented out as it's not currently used but may be needed for future tests
// const createMockDecimal = (value: number) => ({
//   toNumber: () => value,
//   toString: () => value.toString(),
//   valueOf: () => value
// })

// Mock Prisma Client
const mockPrisma = {
  product: {
    findUnique: jest.fn(),
    findMany: jest.fn()
  },
  transaksiItem: {
    findMany: jest.fn()
  }
} as unknown as jest.Mocked<PrismaClient>

describe('AvailabilityService', () => {
  let availabilityService: AvailabilityService
  const checkDate = new Date('2025-07-25T10:00:00.000Z')

  beforeEach(() => {
    jest.clearAllMocks()
    availabilityService = new AvailabilityService(mockPrisma)
  })

  describe('getProductAvailability', () => {
    const productId = 'product-1'
    const mockProduct = {
      id: productId,
      quantity: 10,
      status: 'AVAILABLE'
    }

    it('should calculate availability for product with no active rentals', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct)
      mockPrisma.transaksiItem.findMany.mockResolvedValue([])

      const result = await availabilityService.getProductAvailability(productId, checkDate)

      expect(result.productId).toBe(productId)
      expect(result.totalStock).toBe(10)
      expect(result.rentedQuantity).toBe(0)
      expect(result.availableQuantity).toBe(10)
      expect(result.activeRentals).toEqual([])

      expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: productId },
        select: {
          id: true,
          quantity: true,
          status: true
        }
      })
    })

    it('should calculate availability considering active rentals', async () => {
      const mockActiveRentals = [
        {
          jumlah: 3,
          statusKembali: 'belum_kembali',
          transaksi: {
            id: 'transaksi-1',
            kode: 'TXN-001',
            status: 'active',
            tglMulai: new Date('2025-07-20T00:00:00.000Z'),
            tglSelesai: new Date('2025-07-30T00:00:00.000Z')
          }
        },
        {
          jumlah: 2,
          statusKembali: 'belum_kembali',
          transaksi: {
            id: 'transaksi-2',
            kode: 'TXN-002',
            status: 'terlambat',
            tglMulai: new Date('2025-07-15T00:00:00.000Z'),
            tglSelesai: new Date('2025-07-22T00:00:00.000Z')
          }
        }
      ]

      mockPrisma.product.findUnique.mockResolvedValue(mockProduct)
      mockPrisma.transaksiItem.findMany.mockResolvedValue(mockActiveRentals as never)

      const result = await availabilityService.getProductAvailability(productId, checkDate)

      expect(result.totalStock).toBe(10)
      expect(result.rentedQuantity).toBe(5) // 3 + 2
      expect(result.availableQuantity).toBe(5) // 10 - 5
      expect(result.activeRentals).toHaveLength(2)
      expect(result.activeRentals[0]).toEqual({
        transaksiId: 'transaksi-1',
        transaksiKode: 'TXN-001',
        quantity: 3,
        startDate: mockActiveRentals[0].transaksi.tglMulai,
        endDate: mockActiveRentals[0].transaksi.tglSelesai,
        status: 'active'
      })
    })

    it('should exclude fully returned items from rental calculation', async () => {
      const mockActiveRentals = [
        {
          jumlah: 3,
          statusKembali: 'lengkap', // Fully returned
          transaksi: {
            id: 'transaksi-1',
            kode: 'TXN-001',
            status: 'active',
            tglMulai: new Date('2025-07-20T00:00:00.000Z'),
            tglSelesai: new Date('2025-07-30T00:00:00.000Z')
          }
        },
        {
          jumlah: 2,
          statusKembali: 'belum_kembali',
          transaksi: {
            id: 'transaksi-2',
            kode: 'TXN-002',
            status: 'active',
            tglMulai: new Date('2025-07-20T00:00:00.000Z'),
            tglSelesai: new Date('2025-07-30T00:00:00.000Z')
          }
        }
      ]

      mockPrisma.product.findUnique.mockResolvedValue(mockProduct)
      mockPrisma.transaksiItem.findMany.mockResolvedValue(mockActiveRentals as never)

      const result = await availabilityService.getProductAvailability(productId, checkDate)

      expect(result.rentedQuantity).toBe(2) // Only count the unreturned item
      expect(result.availableQuantity).toBe(8) // 10 - 2
    })

    it('should handle ongoing rentals with no end date', async () => {
      const mockActiveRentals = [
        {
          jumlah: 4,
          statusKembali: 'belum_kembali',
          transaksi: {
            id: 'transaksi-1',
            kode: 'TXN-001',
            status: 'active',
            tglMulai: new Date('2025-07-20T00:00:00.000Z'),
            tglSelesai: null // No end date
          }
        }
      ]

      mockPrisma.product.findUnique.mockResolvedValue(mockProduct)
      mockPrisma.transaksiItem.findMany.mockResolvedValue(mockActiveRentals as never)

      const result = await availabilityService.getProductAvailability(productId, checkDate)

      expect(result.rentedQuantity).toBe(4)
      expect(result.availableQuantity).toBe(6)
      expect(result.activeRentals[0].endDate).toBeUndefined()
    })

    it('should throw error if product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null)

      await expect(availabilityService.getProductAvailability(productId))
        .rejects.toThrow('Produk tidak ditemukan')
    })

    it('should ensure available quantity never goes below zero', async () => {
      const mockActiveRentals = [
        {
          jumlah: 15, // More than total stock
          statusKembali: 'belum_kembali',
          transaksi: {
            id: 'transaksi-1',
            kode: 'TXN-001',
            status: 'active',
            tglMulai: new Date('2025-07-20T00:00:00.000Z'),
            tglSelesai: new Date('2025-07-30T00:00:00.000Z')
          }
        }
      ]

      mockPrisma.product.findUnique.mockResolvedValue(mockProduct)
      mockPrisma.transaksiItem.findMany.mockResolvedValue(mockActiveRentals as never)

      const result = await availabilityService.getProductAvailability(productId, checkDate)

      expect(result.availableQuantity).toBe(0) // Should not be negative
      expect(result.rentedQuantity).toBe(15)
    })
  })

  describe('getMultipleProductAvailability', () => {
    it('should get availability for multiple products', async () => {
      const productIds = ['product-1', 'product-2']
      
      // Mock individual calls
      jest.spyOn(availabilityService, 'getProductAvailability')
        .mockResolvedValueOnce({
          productId: 'product-1',
          totalStock: 10,
          rentedQuantity: 3,
          availableQuantity: 7,
          activeRentals: []
        })
        .mockResolvedValueOnce({
          productId: 'product-2',
          totalStock: 5,
          rentedQuantity: 1,
          availableQuantity: 4,
          activeRentals: []
        })

      const result = await availabilityService.getMultipleProductAvailability(productIds, checkDate)

      expect(result).toHaveLength(2)
      expect(result[0].productId).toBe('product-1')
      expect(result[1].productId).toBe('product-2')
      expect(availabilityService.getProductAvailability).toHaveBeenCalledTimes(2)
    })
  })

  describe('checkRentalAvailability', () => {
    it('should return available=true when all items are available', async () => {
      const items = [
        { productId: 'product-1', quantity: 3 },
        { productId: 'product-2', quantity: 2 }
      ]

      // Mock availability responses
      jest.spyOn(availabilityService, 'getProductAvailability')
        .mockResolvedValueOnce({
          productId: 'product-1',
          totalStock: 10,
          rentedQuantity: 2,
          availableQuantity: 8,
          activeRentals: []
        })
        .mockResolvedValueOnce({
          productId: 'product-2',
          totalStock: 5,
          rentedQuantity: 1,
          availableQuantity: 4,
          activeRentals: []
        })

      const result = await availabilityService.checkRentalAvailability(items, checkDate)

      expect(result.available).toBe(true)
      expect(result.conflicts).toEqual([])
    })

    it('should return conflicts when items are not available', async () => {
      const items = [
        { productId: 'product-1', quantity: 10 }, // Too many
        { productId: 'product-2', quantity: 2 }   // Available
      ]

      // Mock availability responses
      jest.spyOn(availabilityService, 'getProductAvailability')
        .mockResolvedValueOnce({
          productId: 'product-1',
          totalStock: 10,
          rentedQuantity: 5,
          availableQuantity: 5, // Only 5 available, but 10 requested
          activeRentals: []
        })
        .mockResolvedValueOnce({
          productId: 'product-2',
          totalStock: 5,
          rentedQuantity: 1,
          availableQuantity: 4,
          activeRentals: []
        })

      const result = await availabilityService.checkRentalAvailability(items, checkDate)

      expect(result.available).toBe(false)
      expect(result.conflicts).toHaveLength(1)
      expect(result.conflicts[0]).toEqual({
        productId: 'product-1',
        requested: 10,
        available: 5,
        shortage: 5
      })
    })
  })

  describe('getCategoryAvailability', () => {
    it('should get availability for all products in a category', async () => {
      const categoryId = 'category-1'
      const mockProducts = [
        { id: 'product-1' },
        { id: 'product-2' }
      ]

      mockPrisma.product.findMany.mockResolvedValue(mockProducts)
      jest.spyOn(availabilityService, 'getMultipleProductAvailability')
        .mockResolvedValue([
          {
            productId: 'product-1',
            totalStock: 10,
            rentedQuantity: 3,
            availableQuantity: 7,
            activeRentals: []
          },
          {
            productId: 'product-2',
            totalStock: 5,
            rentedQuantity: 1,
            availableQuantity: 4,
            activeRentals: []
          }
        ])

      const result = await availabilityService.getCategoryAvailability(categoryId, checkDate)

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: {
          categoryId,
          isActive: true,
          status: 'AVAILABLE'
        },
        select: { id: true }
      })
      expect(result).toHaveLength(2)
    })
  })

  describe('reserveProducts', () => {
    it('should reserve products when available', async () => {
      const items = [{ productId: 'product-1', quantity: 2 }]

      jest.spyOn(availabilityService, 'checkRentalAvailability')
        .mockResolvedValue({ available: true, conflicts: [] })

      const result = await availabilityService.reserveProducts(items, checkDate)

      expect(result).toBe(true)
    })

    it('should throw error when products not available for reservation', async () => {
      const items = [{ productId: 'product-1', quantity: 10 }]

      jest.spyOn(availabilityService, 'checkRentalAvailability')
        .mockResolvedValue({
          available: false,
          conflicts: [{
            productId: 'product-1',
            requested: 10,
            available: 5,
            shortage: 5
          }]
        })

      await expect(availabilityService.reserveProducts(items, checkDate))
        .rejects.toThrow('Produk tidak tersedia: ID product-1 (kurang 5)')
    })
  })

  describe('getAvailabilitySummary', () => {
    it('should return availability summary for dashboard', async () => {
      const mockProducts = [
        { id: 'product-1', quantity: 10 },
        { id: 'product-2', quantity: 5 },
        { id: 'product-3', quantity: 8 }
      ]

      mockPrisma.product.findMany.mockResolvedValue(mockProducts)

      // Mock individual availability calls
      jest.spyOn(availabilityService, 'getProductAvailability')
        .mockResolvedValueOnce({ // Fully available
          productId: 'product-1',
          totalStock: 10,
          rentedQuantity: 0,
          availableQuantity: 10,
          activeRentals: []
        })
        .mockResolvedValueOnce({ // Partially available
          productId: 'product-2',
          totalStock: 5,
          rentedQuantity: 2,
          availableQuantity: 3,
          activeRentals: []
        })
        .mockResolvedValueOnce({ // Out of stock
          productId: 'product-3',
          totalStock: 8,
          rentedQuantity: 8,
          availableQuantity: 0,
          activeRentals: []
        })

      const result = await availabilityService.getAvailabilitySummary()

      expect(result.totalProducts).toBe(3)
      expect(result.fullyAvailable).toBe(1)
      expect(result.partiallyAvailable).toBe(1)
      expect(result.outOfStock).toBe(1)
      expect(result.totalRented).toBe(10) // 0 + 2 + 8
    })
  })

  describe('getLowStockProducts', () => {
    it('should return products with low availability', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          name: 'Product 1',
          code: 'PRD001',
          quantity: 10,
          category: { name: 'Category A' }
        },
        {
          id: 'product-2',
          name: 'Product 2',
          code: 'PRD002',
          quantity: 5,
          category: { name: 'Category B' }
        }
      ]

      mockPrisma.product.findMany.mockResolvedValue(mockProducts)

      // Mock availability - product-2 has low stock
      jest.spyOn(availabilityService, 'getProductAvailability')
        .mockResolvedValueOnce({
          productId: 'product-1',
          totalStock: 10,
          rentedQuantity: 5,
          availableQuantity: 5, // Above threshold
          activeRentals: []
        })
        .mockResolvedValueOnce({
          productId: 'product-2',
          totalStock: 5,
          rentedQuantity: 3,
          availableQuantity: 2, // At threshold
          activeRentals: []
        })

      const result = await availabilityService.getLowStockProducts(2)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        productId: 'product-2',
        productName: 'Product 2',
        productCode: 'PRD002',
        totalStock: 5,
        availableQuantity: 2,
        categoryName: 'Category B'
      })
    })

    it('should sort low stock products by availability ascending', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          name: 'Product 1',
          code: 'PRD001',
          quantity: 10,
          category: { name: 'Category A' }
        },
        {
          id: 'product-2',
          name: 'Product 2',
          code: 'PRD002',
          quantity: 5,
          category: { name: 'Category B' }
        }
      ]

      mockPrisma.product.findMany.mockResolvedValue(mockProducts)

      jest.spyOn(availabilityService, 'getProductAvailability')
        .mockResolvedValueOnce({
          productId: 'product-1',
          totalStock: 10,
          rentedQuantity: 8,
          availableQuantity: 2,
          activeRentals: []
        })
        .mockResolvedValueOnce({
          productId: 'product-2',
          totalStock: 5,
          rentedQuantity: 4,
          availableQuantity: 1,
          activeRentals: []
        })

      const result = await availabilityService.getLowStockProducts(2)

      expect(result).toHaveLength(2)
      expect(result[0].availableQuantity).toBe(1) // Most critical first
      expect(result[1].availableQuantity).toBe(2)
    })
  })

  describe('validateTransactionItems', () => {
    it('should validate all items successfully', async () => {
      const items = [
        { productId: 'product-1', quantity: 3 },
        { productId: 'product-2', quantity: 2 }
      ]

      // Mock product lookups
      mockPrisma.product.findUnique
        .mockResolvedValueOnce({
          name: 'Product 1',
          status: 'AVAILABLE',
          isActive: true
        })
        .mockResolvedValueOnce({
          name: 'Product 2',
          status: 'AVAILABLE',
          isActive: true
        })

      // Mock availability checks
      jest.spyOn(availabilityService, 'getProductAvailability')
        .mockResolvedValueOnce({
          productId: 'product-1',
          totalStock: 10,
          rentedQuantity: 2,
          availableQuantity: 8,
          activeRentals: []
        })
        .mockResolvedValueOnce({
          productId: 'product-2',
          totalStock: 5,
          rentedQuantity: 1,
          availableQuantity: 4,
          activeRentals: []
        })

      const result = await availabilityService.validateTransactionItems(items, checkDate)

      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
      expect(result.warnings).toEqual([])
    })

    it('should return error for nonexistent product', async () => {
      const items = [{ productId: 'nonexistent', quantity: 1 }]

      // Mock availability call to throw error for nonexistent product
      jest.spyOn(availabilityService, 'getProductAvailability')
        .mockRejectedValueOnce(new Error('Produk tidak ditemukan'))

      const result = await availabilityService.validateTransactionItems(items, checkDate)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Error validating nonexistent: Error: Produk tidak ditemukan')
    })

    it('should return error for inactive product', async () => {
      const items = [{ productId: 'inactive-product', quantity: 1 }]

      // Mock availability call succeeds
      jest.spyOn(availabilityService, 'getProductAvailability')
        .mockResolvedValueOnce({
          productId: 'inactive-product',
          totalStock: 5,
          rentedQuantity: 0,
          availableQuantity: 5,
          activeRentals: []
        })

      // Mock product lookup returns inactive product
      mockPrisma.product.findUnique.mockResolvedValueOnce({
        name: 'Inactive Product',
        status: 'AVAILABLE',
        isActive: false // Inactive product
      })

      const result = await availabilityService.validateTransactionItems(items, checkDate)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Produk Inactive Product tidak aktif')
    })

    it('should return errors for insufficient quantity', async () => {
      const items = [{ productId: 'product-1', quantity: 10 }]

      jest.spyOn(availabilityService, 'getProductAvailability')
        .mockResolvedValueOnce({
          productId: 'product-1',
          totalStock: 10,
          rentedQuantity: 5,
          availableQuantity: 5, // Not enough
          activeRentals: []
        })

      mockPrisma.product.findUnique.mockResolvedValueOnce({
        name: 'Product 1',
        status: 'AVAILABLE',
        isActive: true
      })

      const result = await availabilityService.validateTransactionItems(items, checkDate)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain(
        'Produk Product 1 tidak mencukupi. Tersedia: 5, Diminta: 10'
      )
    })

    it('should return warnings for low stock after rental', async () => {
      const items = [{ productId: 'product-1', quantity: 4 }]

      mockPrisma.product.findUnique.mockResolvedValue({
        name: 'Product 1',
        status: 'AVAILABLE',
        isActive: true
      })

      jest.spyOn(availabilityService, 'getProductAvailability')
        .mockResolvedValue({
          productId: 'product-1',
          totalStock: 10,
          rentedQuantity: 5,
          availableQuantity: 5, // Will leave only 1 after rental
          activeRentals: []
        })

      const result = await availabilityService.validateTransactionItems(items, checkDate)

      expect(result.valid).toBe(true)
      expect(result.warnings).toContain(
        'Stok produk Product 1 akan hampir habis setelah transaksi ini (sisa: 1)'
      )
    })

    it('should handle errors gracefully during validation', async () => {
      const items = [{ productId: 'product-1', quantity: 1 }]

      jest.spyOn(availabilityService, 'getProductAvailability')
        .mockRejectedValue(new Error('Database connection failed'))

      const result = await availabilityService.validateTransactionItems(items, checkDate)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Error validating product-1: Error: Database connection failed')
    })
  })
})

describe('createAvailabilityService factory', () => {
  it('should create availability service instance', () => {
    const service = createAvailabilityService(mockPrisma)
    
    expect(service).toBeInstanceOf(AvailabilityService)
  })
})