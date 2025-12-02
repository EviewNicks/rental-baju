// Dana Kasir Management - DanaSummaryService
// Service layer for daily summary calculations and income/expense aggregation

import { PrismaClient, Prisma } from '@prisma/client'
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
   * - Total income (rental + penalty amounts)
   * - Total expenses (sum of active expenses)
   * - Net balance (income - expenses)
   * 
   * @param date - Date to calculate summary for
   * @returns Daily summary object
   */
  async getDailySummary(date: Date): Promise<DailySummary> {
    const { start, end } = getWITADayRange(date)

    // Calculate total income from transactions
    const incomeResult = await this.prisma.transaksi.aggregate({
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      },
      _sum: {
        jumlahBayar: true,
        flatLatePenalty: true
      }
    })

    // Calculate total expenses from PengeluaranKasir
    const expenseResult = await this.prisma.pengeluaranKasir.aggregate({
      where: {
        isActive: true,
        createdAt: {
          gte: start,
          lte: end
        }
      },
      _sum: {
        harga: true
      }
    })

    // Convert Decimal to number and handle null values
    const totalIncome = 
      (incomeResult._sum.jumlahBayar?.toNumber() || 0) +
      (incomeResult._sum.flatLatePenalty?.toNumber() || 0)
    
    const totalExpense = expenseResult._sum.harga?.toNumber() || 0
    const netBalance = totalIncome - totalExpense

    return {
      totalIncome,
      totalExpense,
      netBalance,
      date: formatWITADate(date)
    }
  }

  /**
   * Get list of income items (rental transactions) for a specific date
   * 
   * Returns all transactions with:
   * - Transaction code
   * - Customer name
   * - Rental amount (jumlahBayar)
   * - Penalty amount (flatLatePenalty)
   * - Transaction status
   * - Kasir information
   * 
   * @param date - Date to query income for
   * @returns Array of income items
   */
  async getIncomeList(date: Date): Promise<IncomeItem[]> {
    const { start, end } = getWITADayRange(date)

    const transactions = await this.prisma.transaksi.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      },
      include: {
        penyewa: {
          select: {
            nama: true
          }
        },
        kasir: {
          select: {
            id: true,
            nama: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return transactions.map(transaction => ({
      transaksiKode: transaction.kode,
      customerName: transaction.penyewa.nama,
      rentalAmount: transaction.jumlahBayar.toNumber(),
      penaltyAmount: transaction.flatLatePenalty.toNumber(),
      status: transaction.status,
      kasirId: transaction.kasirId || '',
      kasirName: transaction.kasir?.nama || 'N/A',
      createdAt: transaction.createdAt
    }))
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
   * 
   * @param date - Date to query expenses for
   * @returns Array of expense records
   */
  async getExpenseList(date: Date): Promise<PengeluaranKasir[]> {
    const { start, end } = getWITADayRange(date)

    const expenses = await this.prisma.pengeluaranKasir.findMany({
      where: {
        isActive: true,
        createdAt: {
          gte: start,
          lte: end
        }
      },
      include: {
        kasir: {
          select: {
            id: true,
            nama: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return expenses.map(expense => ({
      id: expense.id,
      kasirId: expense.kasirId,
      harga: expense.harga.toNumber(),
      kategori: expense.kategori as any, // Type assertion for kategori
      deskripsi: expense.deskripsi || undefined,
      isActive: expense.isActive,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
      createdBy: expense.createdBy,
      kasir: expense.kasir
    }))
  }

  /**
   * Get complete daily data (summary + income list + expense list)
   * 
   * Convenience method that combines all three queries
   * 
   * @param date - Date to query data for
   * @returns Object with summary, income, and expenses
   */
  async getDailyData(date: Date) {
    const [summary, income, expenses] = await Promise.all([
      this.getDailySummary(date),
      this.getIncomeList(date),
      this.getExpenseList(date)
    ])

    return {
      summary,
      income,
      expenses
    }
  }
}
