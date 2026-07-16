/**
 * Regression Test: CSV Export includes Condition Penalty (totalReturnPenalty)
 *
 * Bug: csvExportService.generateCSV() tidak meng-query TransaksiItem.totalReturnPenalty
 * sehingga angka pendapatan di CSV berbeda dengan angka di dashboard Summary Cards.
 *
 * Fix: Tambahkan query penaltyTransactions dengan filter tglKembali dan
 * tambahkan baris "Penalty Kondisi" di CSV output.
 *
 * Requirements: 8.1, 8.2, 8.3
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { PrismaClient } from '@prisma/client'
import { CSVExportService } from '../csvExportService'

describe('CSVExportService - Condition Penalty (Gap Data Regression)', () => {
  let prisma: PrismaClient
  let service: CSVExportService

  const mockStartDate = new Date('2026-01-15')
  const mockEndDate = new Date('2026-01-15')

  beforeEach(() => {
    prisma = new PrismaClient()
    service = new CSVExportService(prisma)
  })

  /**
   * REGRESSION TEST: Condition penalty harus muncul di CSV
   *
   * Scenario: Seorang customer mengembalikan baju dengan kondisi rusak.
   * Ada penalty kondisi (totalReturnPenalty = 80000) yang dicatat di TransaksiItem.
   * Penalty ini HARUS muncul di CSV sebagai baris terpisah "Penalty Kondisi".
   */
  it('should include condition penalty (totalReturnPenalty) rows in CSV output', async () => {
    // Mock transaksi biasa (tanpa penalty kondisi)
    const mockFindManyTransaksi = jest.fn().mockResolvedValueOnce([
      {
        kode: 'TRX-001',
        createdAt: new Date('2026-01-15T08:00:00+08:00'),
        jumlahBayar: { toNumber: () => 150000 },
        flatLatePenalty: { toNumber: () => 0 },
        kasirId: 'kasir-abc',
        penyewa: { nama: 'Budi Santoso' },
        kasir: { id: 'kasir-abc', nama: 'Andi' },
      },
    ])

    // Mock transaksi dengan condition penalty (filter by tglKembali)
    const mockFindManyPenalty = jest.fn().mockResolvedValueOnce([
      {
        kode: 'TRX-001',
        tglKembali: new Date('2026-01-15T10:00:00+08:00'),
        flatLatePenalty: { toNumber: () => 0 },
        kasirId: 'kasir-abc',
        penyewa: { nama: 'Budi Santoso' },
        kasir: { id: 'kasir-abc', nama: 'Andi' },
        items: [
          {
            totalReturnPenalty: { toNumber: () => 80000 },
          },
        ],
      },
    ])

    // Mock pengeluaran
    const mockFindManyExpense = jest.fn().mockResolvedValueOnce([])

    // Setup mock: first call = transaksi, second call = penalty, third call = expense
    prisma.transaksi.findMany = jest
      .fn()
      .mockImplementationOnce(mockFindManyTransaksi)
      .mockImplementationOnce(mockFindManyPenalty)
    prisma.pengeluaranKasir.findMany = mockFindManyExpense

    const csvContent = await service.generateCSV(mockStartDate, mockEndDate)
    const rows = csvContent.split('\n')

    // Header row
    expect(rows[0]).toContain('Tanggal')
    expect(rows[0]).toContain('Tipe')

    // Row 1: Transaksi Pendapatan biasa
    expect(rows[1]).toContain('Pendapatan')
    expect(rows[1]).toContain('TRX-001')
    expect(rows[1]).toContain('150000')

    // Row 2: Penalty Kondisi HARUS ADA
    // Sebelum fix: rows.length === 2 (hanya header + 1 income row, tidak ada penalty)
    // Setelah fix: rows.length >= 3 (header + income + penalty kondisi)
    expect(rows.length).toBeGreaterThanOrEqual(3)

    const penaltyRow = rows.find((r) => r.includes('Penalty Kondisi'))
    expect(penaltyRow).toBeDefined()
    expect(penaltyRow).toContain('80000')
    expect(penaltyRow).toContain('TRX-001')
    expect(penaltyRow).toContain('Budi Santoso')
  })

  /**
   * Test: Total angka pendapatan di CSV harus sama dengan yang dihitung dashboard
   *
   * Dashboard totalIncome = jumlahBayar + flatLatePenalty + totalReturnPenalty
   * CSV total seharusnya = sama
   */
  it('should produce CSV totals that match dashboard summary calculation', async () => {
    const jumlahBayar = 200000
    const flatLatePenalty = 20000
    const conditionPenalty = 80000

    prisma.transaksi.findMany = jest
      .fn()
      .mockResolvedValueOnce([
        {
          kode: 'TRX-002',
          createdAt: new Date('2026-01-15T09:00:00+08:00'),
          jumlahBayar: { toNumber: () => jumlahBayar },
          flatLatePenalty: { toNumber: () => flatLatePenalty },
          kasirId: 'kasir-abc',
          penyewa: { nama: 'Siti Rahayu' },
          kasir: { id: 'kasir-abc', nama: 'Andi' },
        },
      ])
      .mockResolvedValueOnce([
        {
          kode: 'TRX-002',
          tglKembali: new Date('2026-01-15T11:00:00+08:00'),
          flatLatePenalty: { toNumber: () => flatLatePenalty },
          kasirId: 'kasir-abc',
          penyewa: { nama: 'Siti Rahayu' },
          kasir: { id: 'kasir-abc', nama: 'Andi' },
          items: [{ totalReturnPenalty: { toNumber: () => conditionPenalty } }],
        },
      ])
    prisma.pengeluaranKasir.findMany = jest.fn().mockResolvedValueOnce([])

    const csvContent = await service.generateCSV(mockStartDate, mockEndDate)
    const rows = csvContent.split('\n').filter((r) => r.trim() && !r.startsWith('Tanggal'))

    // Hitung total dari semua kolom "Total Jumlah" di CSV
    let csvTotal = 0
    for (const row of rows) {
      const cols = row.split(',')
      const totalJumlahCol = cols[8] // Index 8 = "Total Jumlah"
      if (totalJumlahCol && !isNaN(Number(totalJumlahCol))) {
        csvTotal += Number(totalJumlahCol)
      }
    }

    // Dashboard total = jumlahBayar + flatLatePenalty + totalReturnPenalty
    const dashboardTotal = jumlahBayar + flatLatePenalty + conditionPenalty
    expect(csvTotal).toBe(dashboardTotal) // 300000
  })

  /**
   * Test: Jika tidak ada condition penalty, CSV tidak berubah (backward compatibility)
   */
  it('should not add penalty rows when there are no condition penalties', async () => {
    prisma.transaksi.findMany = jest
      .fn()
      .mockResolvedValueOnce([
        {
          kode: 'TRX-003',
          createdAt: new Date('2026-01-15T07:00:00+08:00'),
          jumlahBayar: { toNumber: () => 100000 },
          flatLatePenalty: { toNumber: () => 0 },
          kasirId: 'kasir-abc',
          penyewa: { nama: 'Ahmad' },
          kasir: { id: 'kasir-abc', nama: 'Andi' },
        },
      ])
      .mockResolvedValueOnce([]) // Tidak ada condition penalty
    prisma.pengeluaranKasir.findMany = jest.fn().mockResolvedValueOnce([])

    const csvContent = await service.generateCSV(mockStartDate, mockEndDate)
    const rows = csvContent.split('\n').filter((r) => r.trim())

    // Hanya header + 1 income row
    expect(rows).toHaveLength(2)
    expect(rows.find((r) => r.includes('Penalty Kondisi'))).toBeUndefined()
  })
})
