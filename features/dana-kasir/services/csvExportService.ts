// Dana Kasir Management - CSV Export Service
// Service layer for exporting income and expense data to CSV format

import { PrismaClient } from '@prisma/client'
import { getWITADayRange, formatWITADate } from '../utils/timezone'

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
   * - Tipe (Type: Pendapatan / Pengeluaran / Penalty Kondisi)
   * - Kode Transaksi (Transaction Code - for income/penalty only)
   * - Nama Customer (Customer Name - for income/penalty only)
   * - Kategori (Category - for expenses only)
   * - Deskripsi (Description)
   * - Jumlah Rental (rental amount - income only)
   * - Jumlah Penalty (flat late penalty - income only; condition penalty - penalty kondisi)
   * - Total Jumlah (total per row)
   * - Kasir ID
   * - Nama Kasir (Kasir Name)
   *
   * Fix: Tambahkan query condition penalty (TransaksiItem.totalReturnPenalty)
   * agar angka CSV konsisten dengan dashboard Summary Cards.
   * Mirror logic dari danaSummaryService.getIncomeList() (filter by tglKembali).
   *
   * @param startDate - Start date of range
   * @param endDate - End date of range
   * @returns CSV string
   */
  async generateCSV(startDate: Date, endDate: Date): Promise<string> {
    // Get date ranges for start and end dates
    const startRange = getWITADayRange(startDate)
    const endRange = getWITADayRange(endDate)

    // Query income data (transactions) — filter by createdAt
    const transactions = await this.prisma.transaksi.findMany({
      where: {
        createdAt: {
          gte: startRange.start,
          lte: endRange.end,
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
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    // Fix: Query condition penalty (TransaksiItem.totalReturnPenalty)
    // Mirror dari danaSummaryService.getIncomeList() — filter by tglKembali
    // Penalty kondisi dihitung di tanggal barang dikembalikan, bukan tanggal transaksi
    const penaltyTransactions = await this.prisma.transaksi.findMany({
      where: {
        tglKembali: {
          gte: startRange.start,
          lte: endRange.end,
        },
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
          },
        },
      },
      orderBy: {
        tglKembali: 'asc',
      },
    })

    // Query expense data
    const expenses = await this.prisma.pengeluaranKasir.findMany({
      where: {
        isActive: true,
        createdAt: {
          gte: startRange.start,
          lte: endRange.end,
        },
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
        createdAt: 'asc',
      },
    })

    // Build CSV content
    const csvRows: string[] = []

    // CSV Header
    csvRows.push(
      [
        'Tanggal',
        'Tipe',
        'Kode Transaksi',
        'Status',
        'Nama Customer',
        'Jumlah Rental',
        'Jumlah Penalty',
        'Total Jumlah',
        'Kasir ID',
        'Nama Kasir',
        'Deskripsi',
      ].join(','),
    )

    // Add income rows (transactions) — Pendapatan Rental
    for (const transaction of transactions) {
      const rentalAmount = transaction.jumlahBayar.toNumber()
      const penaltyAmount = transaction.flatLatePenalty.toNumber()
      const totalAmount = rentalAmount + penaltyAmount

      csvRows.push(
        [
          formatWITADate(transaction.createdAt),
          'Pendapatan',
          this.escapeCsvValue(transaction.kode),
          this.escapeCsvValue(transaction.status),
          this.escapeCsvValue(transaction.penyewa.nama),
          rentalAmount.toString(),
          penaltyAmount.toString(),
          totalAmount.toString(),
          transaction.kasirId || '',
          this.escapeCsvValue(transaction.kasir?.nama || 'N/A'),
          '', // No description for rental income
        ].join(','),
      )
    }

    // Fix: Add condition penalty rows — Penalty Kondisi Barang
    // Ini sebelumnya tidak ada, menyebabkan gap data dengan dashboard Summary Cards
    for (const transaction of penaltyTransactions) {
      const conditionPenalty = transaction.items.reduce(
        (sum, item) => sum + (item.totalReturnPenalty?.toNumber() || 0),
        0,
      )

      csvRows.push(
        [
          formatWITADate(transaction.tglKembali || new Date()),
          'Penalty Kondisi',
          this.escapeCsvValue(transaction.kode),
          this.escapeCsvValue(transaction.status),
          this.escapeCsvValue(transaction.penyewa.nama),
          '', // No rental amount
          conditionPenalty.toString(),
          conditionPenalty.toString(),
          transaction.kasirId || '',
          this.escapeCsvValue(transaction.kasir?.nama || 'N/A'),
          'Penalty kondisi barang saat pengembalian',
        ].join(','),
      )
    }

    // Add expense rows
    for (const expense of expenses) {
      const amount = expense.harga.toNumber()
      const combinedDescription = `[${expense.kategori}] ${expense.deskripsi || ''}`.trim()

      csvRows.push(
        [
          formatWITADate(expense.createdAt),
          'Pengeluaran',
          '', // No transaction code for expenses
          '', // No status for expenses
          '', // No customer name for expenses
          '', // No rental amount for expenses
          '', // No penalty amount for expenses
          amount.toString(),
          expense.kasirId,
          this.escapeCsvValue(expense.kasir.nama),
          this.escapeCsvValue(combinedDescription),
        ].join(','),
      )
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

    // Bersihkan karakter newline/enter menjadi separator spasi ' | '
    // agar data tidak terpecah baris baru di Excel/spreadsheet viewer
    const cleanedValue = value.replace(/[\r\n]+/g, ' | ')

    // Check if value needs escaping (contains comma or double quote)
    const needsEscaping = /[",]/.test(cleanedValue)

    if (needsEscaping) {
      // Escape quotes by doubling them
      const escaped = cleanedValue.replace(/"/g, '""')
      // Wrap in quotes
      return `"${escaped}"`
    }

    return cleanedValue
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
