/**
 * Unit Tests for TransaksiService.tukarItemTransaksi & ubahTanggalSewaTransaksi
 */

import { TransaksiService } from './transaksiService'
import { PrismaClient } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

describe('TransaksiService - tukarItemTransaksi & ubahTanggalSewaTransaksi', () => {
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
      pembayaran: {
        create: jest.fn(),
      },
      aktivitasTransaksi: {
        create: jest.fn(),
      },
    }

    transaksiService = new TransaksiService(mockPrisma as unknown as PrismaClient, 'kasir-123')
  })

  describe('tukarItemTransaksi', () => {
    const baseMockTransaksi = {
      id: 'txn-uuid-1',
      kode: 'TXN-20261018-001',
      status: 'active',
      totalHarga: new Decimal(150000),
      jumlahBayar: new Decimal(150000),
      sisaBayar: new Decimal(0),
      tglMulai: new Date('2026-10-20'),
      tglSelesai: new Date('2026-10-23'),
      penyewaId: 'cust-1',
      items: [
        {
          id: 'item-uuid-1',
          produkId: 'prod-jas-1',
          jumlah: 1,
          durasi: 3,
          hargaSewa: new Decimal(150000),
          subtotal: new Decimal(150000),
          kondisiAwal: JSON.stringify({
            productSizeId: 'size-s-1',
            size: 'S',
            ageCategory: 'ADULT',
            condition: 'baik',
          }),
          jumlahDiambil: 0,
          produk: {
            id: 'prod-jas-1',
            name: 'Jas Hitam Slimfit',
            size: 'S',
          },
        },
      ],
    }

    it('harus menolak penukaran jika status transaksi bukan active', async () => {
      mockPrisma.transaksi.findFirst.mockResolvedValue({
        ...baseMockTransaksi,
        status: 'selesai',
      })

      await expect(
        transaksiService.tukarItemTransaksi({
          transactionCode: 'TXN-20261018-001',
          transaksiItemId: 'item-uuid-1',
          newItem: {
            produkId: 'prod-jas-1',
            productSizeId: 'size-m-1',
            size: 'M',
            ageCategory: 'ADULT',
            hargaSewa: 150000,
          },
          financialAdjustment: {
            priceDelta: 0,
            action: 'none',
          },
          kasirId: 'kasir-123',
        }),
      ).rejects.toThrow(/hanya dapat dilakukan pada transaksi berstatus 'active'/i)
    })

    it('harus menolak penukaran jika barang sudah diambil fisik (jumlahDiambil > 0)', async () => {
      mockPrisma.transaksi.findFirst.mockResolvedValue({
        ...baseMockTransaksi,
        items: [
          {
            ...baseMockTransaksi.items[0],
            jumlahDiambil: 1,
          },
        ],
      })

      await expect(
        transaksiService.tukarItemTransaksi({
          transactionCode: 'TXN-20261018-001',
          transaksiItemId: 'item-uuid-1',
          newItem: {
            produkId: 'prod-jas-1',
            productSizeId: 'size-m-1',
            size: 'M',
            ageCategory: 'ADULT',
            hargaSewa: 150000,
          },
          financialAdjustment: {
            priceDelta: 0,
            action: 'none',
          },
          kasirId: 'kasir-123',
        }),
      ).rejects.toThrow(/tidak dapat ditukar karena sudah diambil secara fisik/i)
    })

    it('harus berhasil menukar ukuran baju dengan harga sama (Rp 0)', async () => {
      mockPrisma.transaksi.findFirst.mockResolvedValue(baseMockTransaksi)
      mockPrisma.productSize.findUnique.mockResolvedValue({
        id: 'size-m-1',
        productId: 'prod-jas-1',
        size: 'M',
        ageCategory: 'ADULT',
        originalQuantity: 5,
        lostQuantity: 0,
        isActive: true,
        product: {
          id: 'prod-jas-1',
          name: 'Jas Hitam Slimfit',
        },
      })
      mockPrisma.transaksi.findMany.mockResolvedValue([]) // no overlapping reservations

      const result = await transaksiService.tukarItemTransaksi({
        transactionCode: 'TXN-20261018-001',
        transaksiItemId: 'item-uuid-1',
        newItem: {
          produkId: 'prod-jas-1',
          productSizeId: 'size-m-1',
          size: 'M',
          ageCategory: 'ADULT',
          hargaSewa: 150000,
        },
        financialAdjustment: {
          priceDelta: 0,
          action: 'none',
        },
        kasirId: 'kasir-123',
      })

      expect(result.success).toBe(true)
      expect(result.kode).toBe('TXN-20261018-001')
      expect(mockPrisma.transaksiItem.update).toHaveBeenCalled()
      expect(mockPrisma.aktivitasTransaksi.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tipe: 'tukar_item',
          }),
        }),
      )
    })

    it('harus berhasil menukar baju lebih mahal (+Delta) dan mencatat pembayaran jika pay_now', async () => {
      mockPrisma.transaksi.findFirst.mockResolvedValue(baseMockTransaksi)
      mockPrisma.productSize.findUnique.mockResolvedValue({
        id: 'size-xl-premium',
        productId: 'prod-jas-premium',
        size: 'XL',
        ageCategory: 'ADULT',
        originalQuantity: 3,
        lostQuantity: 0,
        isActive: true,
        product: {
          id: 'prod-jas-premium',
          name: 'Jas Charcoal Premium',
        },
      })
      mockPrisma.transaksi.findMany.mockResolvedValue([])

      const result = await transaksiService.tukarItemTransaksi({
        transactionCode: 'TXN-20261018-001',
        transaksiItemId: 'item-uuid-1',
        newItem: {
          produkId: 'prod-jas-premium',
          productSizeId: 'size-xl-premium',
          size: 'XL',
          ageCategory: 'ADULT',
          hargaSewa: 175000, // +Rp 25.000
        },
        financialAdjustment: {
          priceDelta: 25000,
          action: 'pay_now',
          paymentMethod: 'tunai',
        },
        kasirId: 'kasir-123',
      })

      expect(result.success).toBe(true)
      // Harus membuat record pembayaran selisih
      expect(mockPrisma.pembayaran.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            jumlah: new Decimal(25000),
            metode: 'tunai',
          }),
        }),
      )
      // Total transaksi harus diupdate ke 175.000
      expect(mockPrisma.transaksi.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalHarga: new Decimal(175000),
            jumlahBayar: new Decimal(175000),
            sisaBayar: new Decimal(0),
          }),
        }),
      )
    })
  })

  describe('ubahTanggalSewaTransaksi', () => {
    const baseMockTransaksi = {
      id: 'txn-uuid-1',
      kode: 'TXN-20261018-001',
      status: 'active',
      tglMulai: new Date('2026-10-20'),
      tglSelesai: new Date('2026-10-23'),
      items: [
        {
          id: 'item-uuid-1',
          produkId: 'prod-jas-1',
          jumlah: 1,
          durasi: 3,
          jumlahDiambil: 0,
          kondisiAwal: JSON.stringify({ productSizeId: 'size-s-1' }),
          produk: { name: 'Jas Hitam' },
        },
      ],
    }

    it('harus berhasil menggeser jadwal sewa jika barang belum diambil fisik', async () => {
      mockPrisma.transaksi.findFirst.mockResolvedValue(baseMockTransaksi)
      mockPrisma.transaksi.findMany.mockResolvedValue([])
      mockPrisma.productSize.findUnique.mockResolvedValue({
        id: 'size-s-1',
        originalQuantity: 5,
        lostQuantity: 0,
        size: 'S',
      })

      const result = await transaksiService.ubahTanggalSewaTransaksi({
        transactionCode: 'TXN-20261018-001',
        tglMulai: '2026-10-25T00:00:00.000Z',
        tglSelesai: '2026-10-28T00:00:00.000Z',
        kasirId: 'kasir-123',
      })

      expect(result.success).toBe(true)
      expect(mockPrisma.transaksi.update).toHaveBeenCalled()
      expect(mockPrisma.aktivitasTransaksi.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tipe: 'ubah_tanggal',
          }),
        }),
      )
    })

    it('harus menolak ubah tanggal jika ada barang yang sudah diambil fisik', async () => {
      mockPrisma.transaksi.findFirst.mockResolvedValue({
        ...baseMockTransaksi,
        items: [{ ...baseMockTransaksi.items[0], jumlahDiambil: 1 }],
      })

      await expect(
        transaksiService.ubahTanggalSewaTransaksi({
          transactionCode: 'TXN-20261018-001',
          tglMulai: '2026-10-25T00:00:00.000Z',
          kasirId: 'kasir-123',
        }),
      ).rejects.toThrow(/sebagian\/seluruh barang sudah diambil fisik/i)
    })
  })
})
