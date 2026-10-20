/**
 * Integration Tests: Tukar Baju / Ukuran & Ubah Tanggal Sewa (Must-Have & Should-Have)
 *
 * Tests the complete integration between API routes, Zod validation,
 * TransaksiService business logic, and database operations.
 */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/kasir/transaksi/[kode]/tukar-item/route'
import { PATCH } from '@/app/api/kasir/transaksi/[kode]/ubah-tanggal/route'
import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

// Mock Auth & Rate Limit
jest.mock('@/lib/auth-middleware', () => ({
  requirePermission: jest.fn().mockResolvedValue({
    user: { id: 'kasir-test-1', name: 'Kasir Test' },
  }),
  withRateLimit: jest.fn().mockResolvedValue({ error: null }),
}))

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
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
  },
}))

// Helper to create mock NextRequest
function createMockRequest(body: Record<string, unknown>, headers: Record<string, string> = {}): NextRequest {
  const headerMap = new Map(
    Object.entries({ 'x-forwarded-for': '127.0.0.1', ...headers }).map(([k, v]) => [k.toLowerCase(), v]),
  )
  return {
    headers: {
      get: (name: string) => headerMap.get(name.toLowerCase()) || null,
    },
    json: async () => body,
  } as unknown as NextRequest
}

describe('Integration Tests: API Tukar Baju & Ubah Tanggal', () => {
  const mockTxId = 'txn-uuid-123'
  const mockTxKode = 'TXN-20261018-001'
  const mockItemId = 'c1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'
  const mockOldProdId = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'
  const mockNewProdId = 'b1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'
  const mockOldSizeId = 'd1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'
  const mockNewSizeId = 'e1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'

  const baseTransaction = {
    id: mockTxId,
    kode: mockTxKode,
    status: 'active',
    totalHarga: new Decimal(150000),
    jumlahBayar: new Decimal(150000),
    sisaBayar: new Decimal(0),
    tglMulai: new Date('2026-10-20T00:00:00.000Z'),
    tglSelesai: new Date('2026-10-23T00:00:00.000Z'),
    penyewaId: 'cust-1',
    items: [
      {
        id: mockItemId,
        produkId: mockOldProdId,
        jumlah: 1,
        durasi: 3,
        hargaSewa: new Decimal(150000),
        subtotal: new Decimal(150000),
        kondisiAwal: JSON.stringify({
          productSizeId: mockOldSizeId,
          size: 'S',
          ageCategory: 'ADULT',
          condition: 'baik',
        }),
        jumlahDiambil: 0,
        produk: {
          id: mockOldProdId,
          name: 'Jas Hitam Slimfit',
          size: 'S',
        },
      },
    ],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (cb: (tx: typeof prisma) => Promise<unknown>) => {
      return cb(prisma)
    })
  })

  // ==========================================================================
  // MUST-HAVE TEST CASES
  // ==========================================================================
  describe('MUST-HAVE: Penukaran Ukuran Baju (Same Model)', () => {
    it('1.1 Harus berhasil menukar ukuran dengan harga sewa sama (Rp 0)', async () => {
      ;(prisma.transaksi.findFirst as jest.Mock).mockResolvedValue(baseTransaction)
      ;(prisma.productSize.findUnique as jest.Mock).mockResolvedValue({
        id: mockNewSizeId,
        productId: mockOldProdId,
        size: 'L',
        ageCategory: 'ADULT',
        originalQuantity: 5,
        lostQuantity: 0,
        isActive: true,
        product: { id: mockOldProdId, name: 'Jas Hitam Slimfit' },
      })
      ;(prisma.transaksi.findMany as jest.Mock).mockResolvedValue([])

      const req = createMockRequest({
        transaksiItemId: mockItemId,
        newItem: {
          produkId: mockOldProdId,
          productSizeId: mockNewSizeId,
          size: 'L',
          ageCategory: 'ADULT',
          hargaSewa: 150000,
        },
        financialAdjustment: {
          priceDelta: 0,
          action: 'none',
        },
        catatan: 'Tukar dari S ke L',
      })

      const res = await POST(req, { params: Promise.resolve({ kode: mockTxKode }) })
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.success).toBe(true)
      expect(body.message).toContain('berhasil ditukar')
      expect(prisma.transaksiItem.update).toHaveBeenCalled()
      expect(prisma.pembayaran.create).not.toHaveBeenCalled()
    })

    it('1.2 Harus berhasil menukar baju lebih mahal (+Delta) dan mencatat pembayaran jika pay_now', async () => {
      ;(prisma.transaksi.findFirst as jest.Mock).mockResolvedValue(baseTransaction)
      ;(prisma.productSize.findUnique as jest.Mock).mockResolvedValue({
        id: mockNewSizeId,
        productId: mockOldProdId,
        size: 'XL',
        ageCategory: 'ADULT',
        originalQuantity: 4,
        lostQuantity: 0,
        isActive: true,
        product: { id: mockOldProdId, name: 'Jas Hitam Slimfit' },
      })
      ;(prisma.transaksi.findMany as jest.Mock).mockResolvedValue([])

      const req = createMockRequest({
        transaksiItemId: mockItemId,
        newItem: {
          produkId: mockOldProdId,
          productSizeId: mockNewSizeId,
          size: 'XL',
          ageCategory: 'ADULT',
          hargaSewa: 175000,
        },
        financialAdjustment: {
          priceDelta: 25000,
          action: 'pay_now',
          paymentMethod: 'tunai',
        },
      })

      const res = await POST(req, { params: Promise.resolve({ kode: mockTxKode }) })
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.success).toBe(true)
      expect(prisma.pembayaran.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            transaksiId: mockTxId,
            jumlah: new Decimal(25000),
            metode: 'tunai',
          }),
        }),
      )
      expect(prisma.transaksi.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalHarga: new Decimal(175000),
            jumlahBayar: new Decimal(175000),
            sisaBayar: new Decimal(0),
          }),
        }),
      )
    })

    it('1.3 Harus berhasil menukar baju lebih mahal (+Delta) dan menambahkan ke sisa bayar jika add_to_remaining', async () => {
      ;(prisma.transaksi.findFirst as jest.Mock).mockResolvedValue(baseTransaction)
      ;(prisma.productSize.findUnique as jest.Mock).mockResolvedValue({
        id: mockNewSizeId,
        productId: mockOldProdId,
        size: 'XL',
        ageCategory: 'ADULT',
        originalQuantity: 4,
        lostQuantity: 0,
        isActive: true,
        product: { id: mockOldProdId, name: 'Jas Hitam Slimfit' },
      })
      ;(prisma.transaksi.findMany as jest.Mock).mockResolvedValue([])

      const req = createMockRequest({
        transaksiItemId: mockItemId,
        newItem: {
          produkId: mockOldProdId,
          productSizeId: mockNewSizeId,
          size: 'XL',
          ageCategory: 'ADULT',
          hargaSewa: 175000,
        },
        financialAdjustment: {
          priceDelta: 25000,
          action: 'add_to_remaining',
        },
      })

      const res = await POST(req, { params: Promise.resolve({ kode: mockTxKode }) })
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.success).toBe(true)
      expect(prisma.pembayaran.create).not.toHaveBeenCalled()
      expect(prisma.transaksi.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalHarga: new Decimal(175000),
            jumlahBayar: new Decimal(150000),
            sisaBayar: new Decimal(25000),
          }),
        }),
      )
    })

    it('1.4 Guard: Harus menolak jika status transaksi bukan active', async () => {
      ;(prisma.transaksi.findFirst as jest.Mock).mockResolvedValue({
        ...baseTransaction,
        status: 'selesai',
      })

      const req = createMockRequest({
        transaksiItemId: mockItemId,
        newItem: {
          produkId: mockOldProdId,
          productSizeId: mockNewSizeId,
          size: 'M',
          ageCategory: 'ADULT',
          hargaSewa: 150000,
        },
        financialAdjustment: { priceDelta: 0, action: 'none' },
      })

      const res = await POST(req, { params: Promise.resolve({ kode: mockTxKode }) })
      const body = await res.json()

      expect(res.status).toBe(400)
      expect(body.success).toBe(false)
      expect(body.message).toContain('berstatus \'active\'')
    })

    it('1.5 Guard: Harus menolak jika barang sudah diambil fisik (jumlahDiambil > 0)', async () => {
      ;(prisma.transaksi.findFirst as jest.Mock).mockResolvedValue({
        ...baseTransaction,
        items: [{ ...baseTransaction.items[0], jumlahDiambil: 1 }],
      })

      const req = createMockRequest({
        transaksiItemId: mockItemId,
        newItem: {
          produkId: mockOldProdId,
          productSizeId: mockNewSizeId,
          size: 'M',
          ageCategory: 'ADULT',
          hargaSewa: 150000,
        },
        financialAdjustment: { priceDelta: 0, action: 'none' },
      })

      const res = await POST(req, { params: Promise.resolve({ kode: mockTxKode }) })
      const body = await res.json()

      expect(res.status).toBe(400)
      expect(body.success).toBe(false)
      expect(body.message).toContain('sudah diambil secara fisik')
    })

    it('1.6 Guard: Harus menolak jika stok ukuran pengganti habis (availableQuantity = 0)', async () => {
      ;(prisma.transaksi.findFirst as jest.Mock).mockResolvedValue(baseTransaction)
      ;(prisma.productSize.findUnique as jest.Mock).mockResolvedValue({
        id: mockNewSizeId,
        productId: mockOldProdId,
        size: 'XXL',
        ageCategory: 'ADULT',
        originalQuantity: 2,
        lostQuantity: 0,
        isActive: true,
        product: { id: mockOldProdId, name: 'Jas Hitam Slimfit' },
      })
      ;(prisma.transaksi.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'other-txn-1',
          items: [{ jumlah: 2, kondisiAwal: JSON.stringify({ productSizeId: mockNewSizeId }) }],
        },
      ])

      const req = createMockRequest({
        transaksiItemId: mockItemId,
        newItem: {
          produkId: mockOldProdId,
          productSizeId: mockNewSizeId,
          size: 'XXL',
          ageCategory: 'ADULT',
          hargaSewa: 150000,
        },
        financialAdjustment: { priceDelta: 0, action: 'none' },
      })

      const res = await POST(req, { params: Promise.resolve({ kode: mockTxKode }) })
      const body = await res.json()

      expect(res.status).toBe(400)
      expect(body.success).toBe(false)
      expect(body.message).toContain('tidak mencukupi')
    })
  })

  // ==========================================================================
  // SHOULD-HAVE TEST CASES
  // ==========================================================================
  describe('SHOULD-HAVE: Ganti Model Lain & Audit Log', () => {
    it('2.1 Harus berhasil menukar ke model jas yang berbeda (Different Product)', async () => {
      ;(prisma.transaksi.findFirst as jest.Mock).mockResolvedValue(baseTransaction)
      ;(prisma.productSize.findUnique as jest.Mock).mockResolvedValue({
        id: mockNewSizeId,
        productId: mockNewProdId,
        size: 'L',
        ageCategory: 'ADULT',
        originalQuantity: 5,
        lostQuantity: 0,
        isActive: true,
        product: { id: mockNewProdId, name: 'Jas Tuxedo Midnight Blue' },
      })
      ;(prisma.transaksi.findMany as jest.Mock).mockResolvedValue([])

      const req = createMockRequest({
        transaksiItemId: mockItemId,
        newItem: {
          produkId: mockNewProdId,
          productSizeId: mockNewSizeId,
          size: 'L',
          ageCategory: 'ADULT',
          hargaSewa: 200000,
        },
        financialAdjustment: {
          priceDelta: 50000,
          action: 'pay_now',
          paymentMethod: 'qris',
        },
      })

      const res = await POST(req, { params: Promise.resolve({ kode: mockTxKode }) })
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.success).toBe(true)

      expect(prisma.transaksiItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockItemId },
          data: expect.objectContaining({
            produkId: mockNewProdId,
          }),
        }),
      )

      expect(prisma.aktivitasTransaksi.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            transaksiId: mockTxId,
            tipe: 'tukar_item',
            deskripsi: expect.stringContaining('Jas Tuxedo Midnight Blue'),
          }),
        }),
      )
    })

    it('2.2 Harus mempertahankan relasi linkedSarung pada penukaran Jas', async () => {
      const jasWithSarung = {
        ...baseTransaction,
        items: [
          {
            ...baseTransaction.items[0],
            kondisiAwal: JSON.stringify({
              productSizeId: mockOldSizeId,
              size: 'S',
              ageCategory: 'ADULT',
              condition: 'baik',
              linkedSarung: {
                productId: 'sarung-prod-1',
                productSizeId: 'sarung-size-1',
                quantity: 1,
              },
            }),
          },
        ],
      }
      ;(prisma.transaksi.findFirst as jest.Mock).mockResolvedValue(jasWithSarung)
      ;(prisma.productSize.findUnique as jest.Mock).mockResolvedValue({
        id: mockNewSizeId,
        productId: mockOldProdId,
        size: 'XL',
        ageCategory: 'ADULT',
        originalQuantity: 5,
        lostQuantity: 0,
        isActive: true,
        product: { id: mockOldProdId, name: 'Jas Hitam Slimfit' },
      })
      ;(prisma.transaksi.findMany as jest.Mock).mockResolvedValue([])

      const req = createMockRequest({
        transaksiItemId: mockItemId,
        newItem: {
          produkId: mockOldProdId,
          productSizeId: mockNewSizeId,
          size: 'XL',
          ageCategory: 'ADULT',
          hargaSewa: 150000,
        },
        financialAdjustment: { priceDelta: 0, action: 'none' },
      })

      const res = await POST(req, { params: Promise.resolve({ kode: mockTxKode }) })
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.success).toBe(true)

      expect(prisma.transaksiItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            kondisiAwal: expect.stringContaining('sarung-prod-1'),
          }),
        }),
      )
    })
  })

  // ==========================================================================
  // COULD-HAVE TEST CASES (Ubah Tanggal Sewa / Reschedule)
  // ==========================================================================
  describe('COULD-HAVE: Ubah Tanggal Sewa (Reschedule)', () => {
    it('3.1 Harus berhasil menggeser jadwal sewa via PATCH endpoint', async () => {
      ;(prisma.transaksi.findFirst as jest.Mock).mockResolvedValue(baseTransaction)
      ;(prisma.transaksi.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.productSize.findUnique as jest.Mock).mockResolvedValue({
        id: mockOldSizeId,
        originalQuantity: 5,
        lostQuantity: 0,
        size: 'S',
      })

      const req = createMockRequest({
        tglMulai: '2026-10-25T00:00:00.000Z',
        tglSelesai: '2026-10-28T00:00:00.000Z',
        durasi: 3,
        catatan: 'Acara diundur panitia',
      })

      const res = await PATCH(req, { params: Promise.resolve({ kode: mockTxKode }) })
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.success).toBe(true)
      expect(body.message).toContain('berhasil diperbarui')
      expect(prisma.transaksi.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tglMulai: expect.any(Date),
            tglSelesai: expect.any(Date),
          }),
        }),
      )
      expect(prisma.aktivitasTransaksi.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tipe: 'ubah_tanggal',
          }),
        }),
      )
    })
  })
})
