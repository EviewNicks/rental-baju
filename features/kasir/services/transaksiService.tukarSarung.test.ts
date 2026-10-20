/**
 * Unit Tests for TransaksiService.tukarSarungPairingTransaksi
 */

import { TransaksiService } from './transaksiService'
import { PrismaClient } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

describe('TransaksiService - tukarSarungPairingTransaksi', () => {
  let transaksiService: TransaksiService
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockPrisma: any

  beforeEach(() => {
    mockPrisma = {
      $transaction: jest.fn().mockImplementation(async (callback) => {
        return callback(mockPrisma)
      }),
      transaksi: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      transaksiItem: {
        update: jest.fn(),
      },
      productSize: {
        findUnique: jest.fn(),
      },
      aktivitasTransaksi: {
        create: jest.fn(),
      },
    }

    transaksiService = new TransaksiService(mockPrisma as unknown as PrismaClient, 'kasir-123')
  })

  const baseMockTransaksi = {
    id: 'txn-uuid-1',
    kode: 'TXN-20261018-001',
    status: 'active',
    totalHarga: new Decimal(180000),
    jumlahBayar: new Decimal(180000),
    sisaBayar: new Decimal(0),
    tglMulai: new Date('2026-11-07'),
    tglSelesai: new Date('2026-11-10'),
    penyewaId: 'cust-1',
    items: [
      {
        id: 'item-jas-1',
        produkId: 'prod-jas-1',
        jumlah: 1,
        durasi: 4,
        hargaSewa: new Decimal(180000),
        subtotal: new Decimal(180000),
        kondisiAwal: JSON.stringify({
          size: 'M',
          ageCategory: 'Dewasa',
          productSizeId: 'size-jas-m',
          linkedSarung: {
            productId: 'prod-sarung-coklat',
            productSizeId: 'size-sarung-1',
            quantity: 1,
            product: {
              id: 'prod-sarung-coklat',
              code: 'SRG-001',
              name: 'Sarung Coklat/Salem',
              category: 'sarung',
            },
            selectedSize: {
              id: 'size-sarung-1',
              size: 'M',
              ageCategory: 'Dewasa',
            },
          },
        }),
        produk: {
          id: 'prod-jas-1',
          name: 'Baju Biru Wardah',
        },
      },
    ],
  }

  it('should successfully swap paired sarung without changing transaction financials', async () => {
    mockPrisma.transaksi.findFirst.mockResolvedValue(baseMockTransaksi)
    mockPrisma.productSize.findUnique.mockResolvedValue({
      id: 'size-sarung-hitam-1',
      productId: 'prod-sarung-hitam',
      size: 'L',
      ageCategory: 'Dewasa',
      originalQuantity: 5,
      lostQuantity: 0,
      isActive: true,
      product: {
        id: 'prod-sarung-hitam',
        name: 'Sarung Hitam Emas',
        kode: 'SRG-002',
        category: { name: 'sarung' },
      },
    })
    mockPrisma.transaksi.findMany.mockResolvedValue([]) // no conflicting active rentals
    mockPrisma.transaksiItem.update.mockResolvedValue({ id: 'item-jas-1' })
    mockPrisma.aktivitasTransaksi.create.mockResolvedValue({ id: 'act-1' })

    const result = await transaksiService.tukarSarungPairingTransaksi({
      transactionCode: 'TXN-20261018-001',
      parentTransaksiItemId: 'item-jas-1',
      newSarung: {
        produkId: 'prod-sarung-hitam',
        productSizeId: 'size-sarung-hitam-1',
        size: 'L',
        ageCategory: 'Dewasa',
      },
      kasirId: 'kasir-123',
      catatan: 'Customer ingin warna lebih gelap',
    })

    expect(result.success).toBe(true)
    expect(mockPrisma.transaksiItem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'item-jas-1' },
        data: expect.objectContaining({
          kondisiAwal: expect.stringContaining('Sarung Hitam Emas'),
        }),
      }),
    )
    expect(mockPrisma.aktivitasTransaksi.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tipe: 'tukar_item',
          transaksiId: 'txn-uuid-1',
        }),
      }),
    )
  })

  it('should throw error if transaction not found', async () => {
    mockPrisma.transaksi.findFirst.mockResolvedValue(null)

    await expect(
      transaksiService.tukarSarungPairingTransaksi({
        transactionCode: 'TXN-NONEXISTENT',
        parentTransaksiItemId: 'item-jas-1',
        newSarung: {
          produkId: 'prod-sarung-hitam',
          productSizeId: 'size-sarung-hitam-1',
          size: 'L',
          ageCategory: 'Dewasa',
        },
        kasirId: 'kasir-123',
      }),
    ).rejects.toThrow('Transaksi dengan kode/ID TXN-NONEXISTENT tidak ditemukan')
  })

  it('should throw error if transaction is not in active status', async () => {
    mockPrisma.transaksi.findFirst.mockResolvedValue({
      ...baseMockTransaksi,
      status: 'selesai',
    })

    await expect(
      transaksiService.tukarSarungPairingTransaksi({
        transactionCode: 'TXN-20261018-001',
        parentTransaksiItemId: 'item-jas-1',
        newSarung: {
          produkId: 'prod-sarung-hitam',
          productSizeId: 'size-sarung-hitam-1',
          size: 'L',
          ageCategory: 'Dewasa',
        },
        kasirId: 'kasir-123',
      }),
    ).rejects.toThrow('Penukaran sarung hanya dapat dilakukan pada transaksi berstatus \'active\'')
  })

  it('should throw error if item does not have paired sarung', async () => {
    mockPrisma.transaksi.findFirst.mockResolvedValue({
      ...baseMockTransaksi,
      items: [
        {
          id: 'item-plain-1',
          produkId: 'prod-1',
          kondisiAwal: JSON.stringify({ size: 'M' }), // No linkedSarung
          produk: { id: 'prod-1', name: 'Baju Biasa' },
        },
      ],
    })

    await expect(
      transaksiService.tukarSarungPairingTransaksi({
        transactionCode: 'TXN-20261018-001',
        parentTransaksiItemId: 'item-plain-1',
        newSarung: {
          produkId: 'prod-sarung-hitam',
          productSizeId: 'size-sarung-hitam-1',
          size: 'L',
          ageCategory: 'Dewasa',
        },
        kasirId: 'kasir-123',
      }),
    ).rejects.toThrow('Item baju ini tidak memiliki sarung pasangan (pairing)')
  })

  it('should throw error if replacement sarung stock is exhausted', async () => {
    mockPrisma.transaksi.findFirst.mockResolvedValue(baseMockTransaksi)
    mockPrisma.productSize.findUnique.mockResolvedValue({
      id: 'size-sarung-hitam-1',
      productId: 'prod-sarung-hitam',
      size: 'L',
      ageCategory: 'Dewasa',
      originalQuantity: 1,
      lostQuantity: 0,
      isActive: true,
      product: {
        id: 'prod-sarung-hitam',
        name: 'Sarung Hitam Emas',
        kode: 'SRG-002',
        category: { name: 'sarung' },
      },
    })
    // 1 overlapping active transaction already renting this size
    mockPrisma.transaksi.findMany.mockResolvedValue([
      {
        id: 'txn-other',
        items: [
          {
            kondisiAwal: JSON.stringify({
              productSizeId: 'size-sarung-hitam-1',
            }),
          },
        ],
      },
    ])

    await expect(
      transaksiService.tukarSarungPairingTransaksi({
        transactionCode: 'TXN-20261018-001',
        parentTransaksiItemId: 'item-jas-1',
        newSarung: {
          produkId: 'prod-sarung-hitam',
          productSizeId: 'size-sarung-hitam-1',
          size: 'L',
          ageCategory: 'Dewasa',
        },
        kasirId: 'kasir-123',
      }),
    ).rejects.toThrow('Stok sarung pengganti tidak mencukupi')
  })
})
