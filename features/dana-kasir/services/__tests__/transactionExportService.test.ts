/**
 * Test: TransactionExportService
 * Memastikan CSV Data Transaksi berisi kolom customer (No. HP, Alamat) dan Jumlah Item
 *
 * Berbeda dari csvExportService.test — ini fokus pada data customer/transaksi,
 * bukan laporan keuangan debit/kredit.
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { PrismaClient } from '@prisma/client'
import { TransactionExportService } from '../transactionExportService'

describe('TransactionExportService', () => {
  let prisma: PrismaClient
  let service: TransactionExportService
  const mockStartDate = new Date('2026-01-15')
  const mockEndDate = new Date('2026-01-15')

  beforeEach(() => {
    prisma = new PrismaClient()
    service = new TransactionExportService(prisma)
  })

  it('should include No. HP, Alamat, and Jumlah Item in CSV', async () => {
    prisma.transaksi.findMany = jest.fn().mockResolvedValueOnce([
      {
        kode: 'TRX-001',
        createdAt: new Date('2026-01-15T08:00:00+08:00'),
        status: 'completed',
        jumlahBayar: { toNumber: () => 150000 },
        flatLatePenalty: { toNumber: () => 0 },
        metodeBayar: 'tunai',
        catatan: null,
        kasirId: 'kasir-abc',
        penyewa: { nama: 'Budi Santoso', telepon: '081234567890', alamat: 'Jl. Merdeka No.5' },
        kasir: { id: 'kasir-abc', nama: 'Andi' },
        items: [{ jumlah: 2 }, { jumlah: 1 }],
      },
    ])

    const csvContent = await service.generateCSV(mockStartDate, mockEndDate)
    const rows = csvContent.split('\n')

    expect(rows[0]).toContain('No. HP')
    expect(rows[0]).toContain('Alamat')
    expect(rows[0]).toContain('Jumlah Item')
    expect(rows[1]).toContain('081234567890')
    expect(rows[1]).toContain('Jl. Merdeka No.5')
    expect(rows[1]).toContain('3') // 2+1
    expect(rows[1]).toContain('TRX-001')
    expect(rows[1]).toContain('150000')
  })

  it('should generate filename with date range', () => {
    const filename = service.generateFilename(new Date('2026-01-01'), new Date('2026-01-31'))
    expect(filename).toBe('transaksi-2026-01-01-to-2026-01-31.csv')
  })

  it('should generate filename for single date', () => {
    const filename = service.generateFilename(new Date('2026-01-15'), new Date('2026-01-15'))
    expect(filename).toBe('transaksi-2026-01-15.csv')
  })

  it('should handle null catatan gracefully', async () => {
    prisma.transaksi.findMany = jest.fn().mockResolvedValueOnce([
      {
        kode: 'TRX-002',
        createdAt: new Date(),
        status: 'active',
        jumlahBayar: { toNumber: () => 100000 },
        flatLatePenalty: { toNumber: () => 0 },
        metodeBayar: 'qris',
        catatan: null,
        kasirId: 'kasir-abc',
        penyewa: { nama: 'Siti', telepon: '089999', alamat: 'Gg. Mawar' },
        kasir: { id: 'kasir-abc', nama: 'Budi' },
        items: [{ jumlah: 1 }],
      },
    ])
    const csvContent = await service.generateCSV(mockStartDate, mockEndDate)
    expect(csvContent).toBeDefined()
    expect(csvContent).not.toContain('null')
  })
})
