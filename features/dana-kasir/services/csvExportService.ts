// Dana Kasir Management - CSV Export Service
// Service layer for exporting income and expense data to CSV format

import { PrismaClient } from '@prisma/client'
import { getWITADayRange, formatWITADate } from '../utils/timezone'
import { formatCurrencyForCSV } from '../utils/currency'

/**
 * CSVExportService - Handles CSV export functionality
 * 
 * Responsibilities:
 * - Query income and expense data for date range
 * - Format data as CSV with proper columns
 * - Handle WITA timezone for date filtering
 * - Generate downloadable CSV string
 */
export class CSVExportService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Generate CSV file for income and expense data
   * 
   * CSV Columns:
   * - Tanggal (Date)
   * - Tipe (Type: Pendapatan/Pengeluaran)
   * - Kode Transaksi (Transaction Code - for income only)
   * - Nama Customer (Customer Name - for income only)
   * - Kategori (Category - for expenses only)
   * - Deskripsi (Description)
   * - Jumlah (Amount)
   * - Kasir ID
   * - Nama Kasir (Kasir Name)
   * 
   * @param startDate - Start date of range
   * @param endDate - End date of range
   * @returns CSV string
   */
  async generateCSV(startDate: Date, endDate: Date): Promise<string> {
    // Get date ranges for start and end dates
    const startRange = getWITADayRange(startDate)
    const endRange = getWITADayRange(endDate)

    // Query income data (transactions)
    const transactions = await this.prisma.transaksi.findMany({
      where: {
        createdAt: {
          gte: startRange.start,
          lte: endRange.end
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
        createdAt: 'asc'
      }
    })

    // Query expense data
    const expenses = await this.prisma.pengeluaranKasir.findMany({
      where: {
        isActive: true,
        createdAt: {
          gte: startRange.start,
          lte: endRange.end
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
        createdAt: 'asc'
      }
    })

    // Build CSV content
    const csvRows: string[] = []

    // CSV Header
    csvRows.push([
      'Tanggal',
      'Tipe',
      'Kode Transaksi',
      'Nama Customer',
      'Kategori',
      'Deskripsi',
      'Jumlah Rental',
      'Jumlah Penalty',
      'Total Jumlah',
      'Kasir ID',
      'Nama Kasir'
    ].join(','))

    // Add income rows (transactions)
    for (const transaction of transactions) {
      const rentalAmount = transaction.jumlahBayar.toNumber()
      const penaltyAmount = transaction.flatLatePenalty.toNumber()
      const totalAmount = rentalAmount + penaltyAmount

      csvRows.push([
        formatWITADate(transaction.createdAt),
        'Pendapatan',
        this.escapeCsvValue(transaction.kode),
        this.escapeCsvValue(transaction.penyewa.nama),
        '', // No category for income
        '', // No description for income
        rentalAmount.toString(),
        penaltyAmount.toString(),
        totalAmount.toString(),
        transaction.kasirId || '',
        this.escapeCsvValue(transaction.kasir?.nama || 'N/A')
      ].join(','))
    }

    // Add expense rows
    for (const expense of expenses) {
      const amount = expense.harga.toNumber()

      csvRows.push([
        formatWITADate(expense.createdAt),
        'Pengeluaran',
        '', // No transaction code for expenses
        '', // No customer name for expenses
        this.escapeCsvValue(expense.kategori),
        this.escapeCsvValue(expense.deskripsi || ''),
        '', // No rental amount for expenses
        '', // No penalty amount for expenses
        amount.toString(),
        expense.kasirId,
        this.escapeCsvValue(expense.kasir.nama)
      ].join(','))
    }

    // Join all rows with newline
    return csvRows.join('\n')
  }

  /**
   * Escape CSV values to handle commas, quotes, and newlines
   * 
   * Rules:
   * - Wrap in quotes if contains comma, quote, or newline
   * - Escape quotes by doubling them
   * 
   * @param value - Value to escape
   * @returns Escaped CSV value
   */
  private escapeCsvValue(value: string): string {
    if (!value) return ''

    // Check if value needs escaping
    const needsEscaping = /[",\n\r]/.test(value)

    if (needsEscaping) {
      // Escape quotes by doubling them
      const escaped = value.replace(/"/g, '""')
      // Wrap in quotes
      return `"${escaped}"`
    }

    return value
  }

  /**
   * Generate filename for CSV export
   * 
   * Format: dana-kasir-YYYY-MM-DD-to-YYYY-MM-DD.csv
   * 
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Filename string
   */
  generateFilename(startDate: Date, endDate: Date): string {
    const start = formatWITADate(startDate)
    const end = formatWITADate(endDate)

    if (start === end) {
      return `dana-kasir-${start}.csv`
    }

    return `dana-kasir-${start}-to-${end}.csv`
  }
}
