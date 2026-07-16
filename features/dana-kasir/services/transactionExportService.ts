// Dana Kasir Management - Transaction Export Service
// Export data transaksi + customer info ke CSV
//
// BERBEDA dari csvExportService.ts:
// - csvExportService  → laporan keuangan (Pendapatan / Pengeluaran / Penalty Kondisi per event)
// - transactionExportService → 1 baris per transaksi, fokus data customer + jumlah item
//
// CSV Columns (11 kolom):
//   Tanggal | Kode Transaksi | Nama Customer | No. HP | Alamat |
//   Jumlah Item | Status | Metode Bayar | Total Bayar | Catatan | Kasir

import { PrismaClient } from '@prisma/client'
import { getWITADayRange, formatWITADate } from '../utils/timezone'

/**
 * TransactionExportService
 *
 * Service untuk generate CSV berisi data transaksi lengkap dengan info customer.
 * Digunakan oleh Owner untuk analitik customer dan follow-up.
 *
 * @example
 * const service = new TransactionExportService(prisma)
 * const csv = await service.generateCSV(startDate, endDate)
 * const filename = service.generateFilename(startDate, endDate)
 */
export class TransactionExportService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Generate CSV string berisi data transaksi + info customer
   *
   * Filter: Semua transaksi dalam date range (by createdAt, WITA timezone)
   * Sort: createdAt ASC
   *
   * @param startDate - Tanggal mulai (awal hari WITA)
   * @param endDate - Tanggal akhir (akhir hari WITA)
   * @returns CSV string, satu baris per transaksi
   */
  async generateCSV(startDate: Date, endDate: Date): Promise<string> {
    const startRange = getWITADayRange(startDate)
    const endRange = getWITADayRange(endDate)

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
            telepon: true,
            alamat: true,
          },
        },
        kasir: {
          select: {
            id: true,
            nama: true,
          },
        },
        items: {
          select: {
            jumlah: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    const csvRows: string[] = []

    // Header row
    csvRows.push(
      [
        'Tanggal',
        'Kode Transaksi',
        'Nama Customer',
        'No. HP',
        'Alamat',
        'Jumlah Item',
        'Status',
        'Metode Bayar',
        'Total Bayar',
        'Catatan',
        'Kasir',
      ].join(','),
    )

    // Data rows
    for (const trx of transactions) {
      // SUM semua item yang disewa dalam transaksi ini
      const totalItems = trx.items.reduce((sum, item) => sum + item.jumlah, 0)

      // Total bayar = jumlah bayar + flat late penalty (denda keterlambatan)
      const totalBayar = trx.jumlahBayar.toNumber() + trx.flatLatePenalty.toNumber()

      csvRows.push(
        [
          formatWITADate(trx.createdAt),
          this.escapeCsvValue(trx.kode),
          this.escapeCsvValue(trx.penyewa.nama),
          this.escapeCsvValue(trx.penyewa.telepon),
          this.escapeCsvValue(trx.penyewa.alamat),
          totalItems.toString(),
          this.escapeCsvValue(trx.status),
          this.escapeCsvValue(trx.metodeBayar),
          totalBayar.toString(),
          this.escapeCsvValue(trx.catatan || ''),
          this.escapeCsvValue(trx.kasir?.nama || 'N/A'),
        ].join(','),
      )
    }

    return csvRows.join('\n')
  }

  /**
   * Generate nama file untuk download CSV
   *
   * Format: transaksi-YYYY-MM-DD.csv (single date)
   *         transaksi-YYYY-MM-DD-to-YYYY-MM-DD.csv (range)
   */
  generateFilename(startDate: Date, endDate: Date): string {
    const start = formatWITADate(startDate)
    const end = formatWITADate(endDate)
    return start === end ? `transaksi-${start}.csv` : `transaksi-${start}-to-${end}.csv`
  }

  /**
   * Escape nilai CSV — handle koma, kutip, dan newline
   * Sesuai RFC 4180 CSV standard
   */
  private escapeCsvValue(value: string): string {
    if (!value) return ''
    
    // Bersihkan karakter newline/enter menjadi separator spasi ' | '
    // agar data tidak terpecah baris baru di Excel/spreadsheet viewer
    const cleanedValue = value.replace(/[\r\n]+/g, ' | ')

    if (/[",]/.test(cleanedValue)) {
      return `"${cleanedValue.replace(/"/g, '""')}"`
    }
    return cleanedValue
  }
}
