// Dana Kasir Management - DanaSummaryService
// Service layer for daily summary calculations and income/expense aggregation

import { PrismaClient } from '@prisma/client'
import { DailySummary, IncomeItem, PengeluaranKasir } from '../types'
import { getWITADayRange, formatWITADate } from '../utils/timezone'

/**
 * DanaSummaryService - Handles daily summary calculations
 *
 * Responsibilities:
 * - Calculate daily income from rental transactions
 * - Calculate daily expenses from PengeluaranKasir
 * - Compute net balance (income - expenses)
 * - Provide detailed income and expense lists
 * - Handle WITA timezone for date filtering
 */
export class DanaSummaryService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get daily summary with income, expenses, and net balance
   *
   * Calculates:
   * - Total income (rental + penalty amounts from transactions + penalty payments)
   * - Total expenses (sum of active expenses)
   * - Net balance (income - expenses)
   *
   * Task 5.1: Added penalty payment aggregation from TransaksiItem.totalReturnPenalty
   * Requirements: 3.1, 3.2, 3.7
   *
   * @param date - Date to calculate summary for
   * @param kasirId - Optional kasir filter
   * @returns Daily summary object
   */
  async getDailySummary(date: Date, kasirId?: string): Promise<DailySummary> {
    const { start, end } = getWITADayRange(date)

    // Calculate total income from transactions (rental + flat late penalty)
    const incomeResult = await this.prisma.transaksi.aggregate({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
        ...(kasirId && { kasirId }),
      },
      _sum: {
        jumlahBayar: true,
        flatLatePenalty: true,
      },
    })

    // Task 5.1: Calculate penalty income from TransaksiItem.totalReturnPenalty
    // Use tglKembali for date filtering (Requirements: 3.2, 3.5)
    const penaltyResult = await this.prisma.transaksiItem.aggregate({
      where: {
        transaksi: {
          tglKembali: {
            gte: start,
            lte: end,
          },
          ...(kasirId && { kasirId }),
        },
        totalReturnPenalty: {
          gt: 0,
        },
      },
      _sum: {
        totalReturnPenalty: true,
      },
    })

    // Calculate total expenses from PengeluaranKasir
    const expenseResult = await this.prisma.pengeluaranKasir.aggregate({
      where: {
        isActive: true,
        createdAt: {
          gte: start,
          lte: end,
        },
        ...(kasirId && { kasirId }),
      },
      _sum: {
        harga: true,
      },
    })

    // Convert Decimal to number and handle null values
    // Requirements 3.2: totalIncome = sum(jumlahBayar) + sum(flatLatePenalty) + sum(totalReturnPenalty)
    const totalIncome =
      (incomeResult._sum.jumlahBayar?.toNumber() || 0) +
      (incomeResult._sum.flatLatePenalty?.toNumber() || 0) +
      (penaltyResult._sum.totalReturnPenalty?.toNumber() || 0)

    const totalExpense = expenseResult._sum.harga?.toNumber() || 0

    // Requirements 3.7: netBalance = (rental + penalty) - expenses
    const netBalance = totalIncome - totalExpense

    return {
      totalIncome,
      totalExpense,
      netBalance,
      date: formatWITADate(date),
    }
  }

  /**
   * Get list of income items (rental transactions + penalty payments) for a specific date
   *
   * Task 6: Enhanced to include penalty payment entries
   * Requirements: 3.3, 3.4, 3.5, 3.6
   *
   * Returns:
   * - Rental transactions (type='rental')
   * - Penalty payments (type='penalty') with breakdown
   *
   * @param date - Date to query income for
   * @param kasirId - Optional kasir filter
   * @returns Array of income items sorted by date
   */
  async getIncomeList(date: Date, kasirId?: string): Promise<IncomeItem[]> {
    const { start, end } = getWITADayRange(date)

    // Get rental transactions
    const transactions = await this.prisma.transaksi.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
        ...(kasirId && { kasirId }),
      },
      include: {
        penyewa: {
          select: {
            nama: true,
          },
        },
        kasir: {
          select: {
            id: true,
            nama: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Task 6.1: Query penalty payments (Requirements: 3.3, 3.5)
    // Use tglKembali for date filtering instead of createdAt
    const penaltyPayments = await this.prisma.transaksi.findMany({
      where: {
        tglKembali: {
          gte: start,
          lte: end,
        },
        ...(kasirId && { kasirId }),
        items: {
          some: {
            totalReturnPenalty: {
              gt: 0,
            },
          },
        },
      },
      include: {
        penyewa: {
          select: {
            nama: true,
          },
        },
        kasir: {
          select: {
            id: true,
            nama: true,
          },
        },
        items: {
          where: {
            totalReturnPenalty: {
              gt: 0,
            },
          },
          select: {
            totalReturnPenalty: true,
            returnConditions: {
              select: {
                kondisiAkhir: true,
                jumlahKembali: true,
                penaltyAmount: true,
              },
            },
          },
        },
      },
      orderBy: {
        tglKembali: 'desc',
      },
    })

    // Map rental transactions to income items
    const rentalIncome: IncomeItem[] = transactions.map((transaction) => ({
      type: 'rental' as const,
      transaksiKode: transaction.kode,
      customerName: transaction.penyewa.nama,
      rentalAmount: transaction.jumlahBayar.toNumber(),
      penaltyAmount: transaction.flatLatePenalty.toNumber(),
      status: transaction.status,
      kasirId: transaction.kasirId || '',
      kasirName: transaction.kasir?.nama || 'N/A',
      createdAt: transaction.createdAt,
    }))

    // Task 6.2: Build penalty income entries (Requirements: 3.4, 3.6)
    const penaltyIncome: IncomeItem[] = penaltyPayments.map((transaction) => {
      // Calculate penalty breakdown
      const totalPenalty = transaction.items.reduce(
        (sum, item) => sum + (item.totalReturnPenalty?.toNumber() || 0),
        0,
      )

      // Calculate late penalty (flat 20,000 per item if late)
      const itemCount = transaction.items.length
      const latePenalty = transaction.flatLatePenalty.toNumber()
      const conditionPenalty = totalPenalty - latePenalty

      return {
        type: 'penalty' as const,
        transaksiKode: transaction.kode,
        customerName: transaction.penyewa.nama,
        rentalAmount: 0, // No rental amount for penalty entries
        penaltyAmount: totalPenalty,
        status: transaction.status,
        kasirId: transaction.kasirId || '',
        kasirName: transaction.kasir?.nama || 'N/A',
        createdAt: transaction.tglKembali || transaction.createdAt,
        // Requirements 3.4, 3.6: Include penalty breakdown
        penaltyBreakdown: {
          latePenalty,
          conditionPenalty,
          itemCount,
        },
      }
    })

    // Combine and sort by date (Requirements: 3.3)
    const allIncome = [...rentalIncome, ...penaltyIncome]
    return allIncome.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  /**
   * Get list of expenses for a specific date
   *
   * Returns all active expenses with:
   * - Amount, category, description
   * - Kasir information
   * - Creation timestamp
   *
   * Filters:
   * - Only active expenses (isActive = true)
   * - Date range in WITA timezone
   * - Optional kasir filter
   *
   * @param date - Date to query expenses for
   * @param kasirId - Optional kasir filter
   * @returns Array of expense records
   */
  async getExpenseList(date: Date, kasirId?: string): Promise<PengeluaranKasir[]> {
    const { start, end } = getWITADayRange(date)

    const expenses = await this.prisma.pengeluaranKasir.findMany({
      where: {
        isActive: true,
        createdAt: {
          gte: start,
          lte: end,
        },
        ...(kasirId && { kasirId }),
      },
      include: {
        kasir: {
          select: {
            id: true,
            nama: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return expenses.map((expense) => ({
      id: expense.id,
      kasirId: expense.kasirId,
      harga: expense.harga.toNumber(),
      //eslint-disable-next-line @typescript-eslint/no-explicit-any
      kategori: expense.kategori as any, // Type assertion for kategori
      deskripsi: expense.deskripsi || undefined,
      isActive: expense.isActive,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
      createdBy: expense.createdBy,
      kasir: expense.kasir,
    }))
  }

  /**
   * Get complete daily data with role-based filtering
   *
   * Role-based visibility:
   * - Kasir: Only see expenses from other kasir (kasirId != "owner-system")
   * - Owner: See all expenses with optional kasir filter
   *
   * @param date - Date to query data for
   * @param userRole - User's role (kasir or owner)
   * @param userKasirId - User's kasirId
   * @param filterKasirId - Optional kasir filter from query params
   * @returns Object with summary, income, and expenses
   */
  async getDailyDataWithRoleFilter(
    date: Date,
    userRole: 'kasir' | 'owner',
    userKasirId: string,
    filterKasirId?: string,
  ) {
    // Determine visibility filter based on role
    let visibilityKasirId: string | undefined

    if (userRole === 'kasir') {
      // Kasir users: Only see expenses from other kasir (not Owner)
      // If filterKasirId is provided and it's not "owner-system", use it
      // Otherwise, show all kasir expenses (exclude owner-system)
      if (filterKasirId && filterKasirId !== 'owner-system') {
        visibilityKasirId = filterKasirId
      } else {
        // We'll handle this in the service methods with special logic
        visibilityKasirId = 'exclude-owner'
      }
    } else {
      // Owner users: See all expenses, optionally filtered by kasirId
      visibilityKasirId = filterKasirId
    }

    const [summary, income, expenses] = await Promise.all([
      this.getDailySummaryWithRoleFilter(date, userRole, visibilityKasirId),
      this.getIncomeListWithRoleFilter(date, userRole, visibilityKasirId),
      this.getExpenseListWithRoleFilter(date, userRole, visibilityKasirId),
    ])

    return {
      summary,
      income,
      expenses,
    }
  }

  /**
   * Get daily summary with role-based filtering
   */
  async getDailySummaryWithRoleFilter(
    date: Date,
    userRole: 'kasir' | 'owner',
    visibilityKasirId?: string,
  ): Promise<DailySummary> {
    const { start, end } = getWITADayRange(date)

    // Build expense filter based on role
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    const expenseWhereClause: any = {
      isActive: true,
      createdAt: { gte: start, lte: end },
    }

    if (userRole === 'kasir') {
      if (visibilityKasirId === 'exclude-owner') {
        // Kasir: exclude Owner expenses
        expenseWhereClause.kasirId = { not: 'owner-system' }
      } else if (visibilityKasirId) {
        // Kasir: specific kasir filter (already validated to not be owner-system)
        expenseWhereClause.kasirId = visibilityKasirId
      } else {
        expenseWhereClause.kasirId = { not: 'owner-system' }
      }
    } else {
      // Owner: optional kasir filter
      if (visibilityKasirId) {
        expenseWhereClause.kasirId = visibilityKasirId
      }
    }

    // Income calculations (same for both roles - no role-based filtering needed)
    const incomeResult = await this.prisma.transaksi.aggregate({
      where: {
        createdAt: { gte: start, lte: end },
      },
      _sum: {
        jumlahBayar: true,
        flatLatePenalty: true,
      },
    })

    const penaltyResult = await this.prisma.transaksiItem.aggregate({
      where: {
        transaksi: {
          tglKembali: { gte: start, lte: end },
        },
        totalReturnPenalty: { gt: 0 },
      },
      _sum: {
        totalReturnPenalty: true,
      },
    })

    // Expense calculation with role-based filtering
    const expenseResult = await this.prisma.pengeluaranKasir.aggregate({
      where: expenseWhereClause,
      _sum: {
        harga: true,
      },
    })

    const totalIncome =
      (incomeResult._sum.jumlahBayar?.toNumber() || 0) +
      (incomeResult._sum.flatLatePenalty?.toNumber() || 0) +
      (penaltyResult._sum.totalReturnPenalty?.toNumber() || 0)

    const totalExpense = expenseResult._sum.harga?.toNumber() || 0
    const netBalance = totalIncome - totalExpense

    return {
      totalIncome,
      totalExpense,
      netBalance,
      date: formatWITADate(date),
    }
  }

  /**
   * Get income list with role-based filtering (same for both roles)
   */
  async getIncomeListWithRoleFilter(
    date: Date,
    userRole: 'kasir' | 'owner',
    visibilityKasirId?: string,
  ): Promise<IncomeItem[]> {
    // Income is not role-filtered, same logic as original
    return this.getIncomeList(
      date,
      visibilityKasirId === 'exclude-owner' ? undefined : visibilityKasirId,
    )
  }

  /**
   * Get expense list with role-based filtering
   */
  async getExpenseListWithRoleFilter(
    date: Date,
    userRole: 'kasir' | 'owner',
    visibilityKasirId?: string,
  ): Promise<PengeluaranKasir[]> {
    const { start, end } = getWITADayRange(date)

    // Build where clause based on role
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {
      isActive: true,
      createdAt: { gte: start, lte: end },
    }

    if (userRole === 'kasir') {
      if (visibilityKasirId === 'exclude-owner') {
        // Kasir: exclude Owner expenses
        whereClause.kasirId = { not: 'owner-system' }
      } else if (visibilityKasirId) {
        // Kasir: specific kasir filter
        whereClause.kasirId = visibilityKasirId
      } else {
        whereClause.kasirId = { not: 'owner-system' }
      }
    } else {
      // Owner: optional kasir filter
      if (visibilityKasirId) {
        whereClause.kasirId = visibilityKasirId
      }
    }

    const expenses = await this.prisma.pengeluaranKasir.findMany({
      where: whereClause,
      include: {
        kasir: {
          select: {
            id: true,
            nama: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return expenses.map((expense) => ({
      id: expense.id,
      kasirId: expense.kasirId,
      harga: expense.harga.toNumber(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      kategori: expense.kategori as any,
      deskripsi: expense.deskripsi || undefined,
      isActive: expense.isActive,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
      createdBy: expense.createdBy,
      kasir: expense.kasir,
    }))
  }

  /**
   * Get complete daily data (original method - kept for backward compatibility)
   *
   * @param date - Date to query data for
   * @param kasirId - Optional kasir filter
   * @returns Object with summary, income, and expenses
   */
  async getDailyData(date: Date, kasirId?: string) {
    const [summary, income, expenses] = await Promise.all([
      this.getDailySummary(date, kasirId),
      this.getIncomeList(date, kasirId),
      this.getExpenseList(date, kasirId),
    ])

    return {
      summary,
      income,
      expenses,
    }
  }
}
