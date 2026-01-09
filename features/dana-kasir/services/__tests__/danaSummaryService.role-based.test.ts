/**
 * Property-Based Tests for Role-based Summary Calculations
 * Feature: role-based-expense-management, Property 9: Role-based Summary Calculations
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { PrismaClient } from '@prisma/client'
import { DanaSummaryService } from '../danaSummaryService'
import { getCurrentWITADate } from '../../utils/timezone'

// Mock the role detection utility
jest.mock('../../utils/roleDetection', () => ({
  getRoleBasedUserIds: jest.fn()
}))

import { getRoleBasedUserIds } from '../../utils/roleDetection'

const mockGetRoleBasedUserIds = getRoleBasedUserIds as jest.MockedFunction<typeof getRoleBasedUserIds>

describe('DanaSummaryService - Role-based Summary Calculations', () => {
  let prisma: PrismaClient
  let service: DanaSummaryService

  beforeEach(() => {
    prisma = new PrismaClient()
    service = new DanaSummaryService(prisma)
    
    // Mock role-based user IDs
    mockGetRoleBasedUserIds.mockResolvedValue({
      kasirUserIds: ['kasir-user-1', 'kasir-user-2'],
      ownerUserIds: ['owner-user-1', 'owner-user-2']
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  /**
   * Property 9: Role-based Summary Calculations
   * For any kasir user, totalExpense and netBalance should include only kasir expenses,
   * and for any owner user, totalExpense and netBalance should include all expenses
   */
  describe('Property 9: Role-based Summary Calculations', () => {
    it('should calculate summary for kasir users with only kasir expenses', async () => {
      // Mock Prisma aggregation calls
      const mockIncomeAggregate = jest.fn().mockResolvedValue({
        _sum: { jumlahBayar: { toNumber: () => 100000 }, flatLatePenalty: { toNumber: () => 20000 } }
      })
      const mockPenaltyAggregate = jest.fn().mockResolvedValue({
        _sum: { totalReturnPenalty: { toNumber: () => 15000 } }
      })
      const mockExpenseAggregate = jest.fn().mockResolvedValue({
        _sum: { harga: { toNumber: () => 50000 } }
      })

      prisma.transaksi.aggregate = mockIncomeAggregate
      prisma.transaksiItem.aggregate = mockPenaltyAggregate
      prisma.pengeluaranKasir.aggregate = mockExpenseAggregate

      const testDate = getCurrentWITADate()
      const result = await service.getDailySummary(testDate, undefined, 'kasir')

      // Verify that expense query includes role-based filtering for kasir
      expect(mockExpenseAggregate).toHaveBeenCalledWith({
        where: expect.objectContaining({
          createdBy: {
            in: ['kasir-user-1', 'kasir-user-2']
          }
        }),
        _sum: { harga: true }
      })

      // Verify calculations
      expect(result.totalIncome).toBe(135000) // 100000 + 20000 + 15000
      expect(result.totalExpense).toBe(50000) // Only kasir expenses
      expect(result.netBalance).toBe(85000) // 135000 - 50000
    })

    it('should calculate summary for owner users with all expenses when no role filter', async () => {
      // Mock Prisma aggregation calls
      const mockIncomeAggregate = jest.fn().mockResolvedValue({
        _sum: { jumlahBayar: { toNumber: () => 200000 }, flatLatePenalty: { toNumber: () => 40000 } }
      })
      const mockPenaltyAggregate = jest.fn().mockResolvedValue({
        _sum: { totalReturnPenalty: { toNumber: () => 30000 } }
      })
      const mockExpenseAggregate = jest.fn().mockResolvedValue({
        _sum: { harga: { toNumber: () => 100000 } }
      })

      prisma.transaksi.aggregate = mockIncomeAggregate
      prisma.transaksiItem.aggregate = mockPenaltyAggregate
      prisma.pengeluaranKasir.aggregate = mockExpenseAggregate

      const testDate = getCurrentWITADate()
      const result = await service.getDailySummary(testDate, undefined, 'owner')

      // Verify that expense query does NOT include role-based filtering for owner with no role filter
      expect(mockExpenseAggregate).toHaveBeenCalledWith({
        where: expect.not.objectContaining({
          createdBy: expect.anything()
        }),
        _sum: { harga: true }
      })

      // Verify calculations
      expect(result.totalIncome).toBe(270000) // 200000 + 40000 + 30000
      expect(result.totalExpense).toBe(100000) // All expenses
      expect(result.netBalance).toBe(170000) // 270000 - 100000
    })

    it('should calculate summary for owner users with kasir role filter', async () => {
      // Mock Prisma aggregation calls
      const mockIncomeAggregate = jest.fn().mockResolvedValue({
        _sum: { jumlahBayar: { toNumber: () => 150000 }, flatLatePenalty: { toNumber: () => 30000 } }
      })
      const mockPenaltyAggregate = jest.fn().mockResolvedValue({
        _sum: { totalReturnPenalty: { toNumber: () => 25000 } }
      })
      const mockExpenseAggregate = jest.fn().mockResolvedValue({
        _sum: { harga: { toNumber: () => 60000 } }
      })

      prisma.transaksi.aggregate = mockIncomeAggregate
      prisma.transaksiItem.aggregate = mockPenaltyAggregate
      prisma.pengeluaranKasir.aggregate = mockExpenseAggregate

      const testDate = getCurrentWITADate()
      const result = await service.getDailySummary(testDate, undefined, 'owner', 'kasir')

      // Verify that expense query includes kasir role filtering
      expect(mockExpenseAggregate).toHaveBeenCalledWith({
        where: expect.objectContaining({
          createdBy: {
            in: ['kasir-user-1', 'kasir-user-2']
          }
        }),
        _sum: { harga: true }
      })

      // Verify calculations
      expect(result.totalIncome).toBe(205000) // 150000 + 30000 + 25000
      expect(result.totalExpense).toBe(60000) // Only kasir expenses
      expect(result.netBalance).toBe(145000) // 205000 - 60000
    })

    it('should calculate summary for owner users with owner role filter', async () => {
      // Mock Prisma aggregation calls
      const mockIncomeAggregate = jest.fn().mockResolvedValue({
        _sum: { jumlahBayar: { toNumber: () => 180000 }, flatLatePenalty: { toNumber: () => 35000 } }
      })
      const mockPenaltyAggregate = jest.fn().mockResolvedValue({
        _sum: { totalReturnPenalty: { toNumber: () => 20000 } }
      })
      const mockExpenseAggregate = jest.fn().mockResolvedValue({
        _sum: { harga: { toNumber: () => 80000 } }
      })

      prisma.transaksi.aggregate = mockIncomeAggregate
      prisma.transaksiItem.aggregate = mockPenaltyAggregate
      prisma.pengeluaranKasir.aggregate = mockExpenseAggregate

      const testDate = getCurrentWITADate()
      const result = await service.getDailySummary(testDate, undefined, 'owner', 'owner')

      // Verify that expense query includes owner role filtering
      expect(mockExpenseAggregate).toHaveBeenCalledWith({
        where: expect.objectContaining({
          createdBy: {
            in: ['owner-user-1', 'owner-user-2']
          }
        }),
        _sum: { harga: true }
      })

      // Verify calculations
      expect(result.totalIncome).toBe(235000) // 180000 + 35000 + 20000
      expect(result.totalExpense).toBe(80000) // Only owner expenses
      expect(result.netBalance).toBe(155000) // 235000 - 80000
    })

    it('should handle empty role user arrays gracefully', async () => {
      // Mock empty role arrays
      mockGetRoleBasedUserIds.mockResolvedValue({
        kasirUserIds: [],
        ownerUserIds: []
      })

      // Mock Prisma aggregation calls
      const mockIncomeAggregate = jest.fn().mockResolvedValue({
        _sum: { jumlahBayar: { toNumber: () => 100000 }, flatLatePenalty: { toNumber: () => 0 } }
      })
      const mockPenaltyAggregate = jest.fn().mockResolvedValue({
        _sum: { totalReturnPenalty: { toNumber: () => 0 } }
      })
      const mockExpenseAggregate = jest.fn().mockResolvedValue({
        _sum: { harga: { toNumber: () => 0 } }
      })

      prisma.transaksi.aggregate = mockIncomeAggregate
      prisma.transaksiItem.aggregate = mockPenaltyAggregate
      prisma.pengeluaranKasir.aggregate = mockExpenseAggregate

      const testDate = getCurrentWITADate()
      const result = await service.getDailySummary(testDate, undefined, 'kasir')

      // Verify that fallback values are used for empty arrays
      expect(mockExpenseAggregate).toHaveBeenCalledWith({
        where: expect.objectContaining({
          createdBy: {
            in: ['no-kasir-users'] // Fallback value
          }
        }),
        _sum: { harga: true }
      })

      // Verify calculations work with zero expenses
      expect(result.totalIncome).toBe(100000)
      expect(result.totalExpense).toBe(0)
      expect(result.netBalance).toBe(100000)
    })
  })
})