import { ProductHistoryService } from '@/features/manage-product/services/productHistoryService'
import { PrismaClient } from '@prisma/client'

describe('ProductHistoryService - Product Size Filter', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockPrisma: any
  let service: ProductHistoryService

  beforeEach(() => {
    mockPrisma = {
      product: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'prod-123',
          name: 'Baju Adat Jawa',
          isActive: true,
        }),
      },
      transaksiItem: {
        count: jest.fn().mockResolvedValue(2),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'item-1',
            jumlah: 1,
            subtotal: { toNumber: () => 150000 },
            durasi: 3,
            kondisiAwal: JSON.stringify({
              productSizeId: '01e6677c-f78f-48a3-b19f-061531e84f02',
              size: 'L',
              ageCategory: 'ADULT',
            }),
            transaksi: {
              id: 'trx-1',
              kode: 'TRX-001',
              status: 'selesai',
              tglMulai: new Date('2026-09-01'),
              tglSelesai: new Date('2026-09-04'),
              createdAt: new Date('2026-09-01'),
              penyewa: {
                nama: 'Budi Santoso',
                telepon: '081234567890',
              },
            },
            returnConditions: [],
          },
        ]),
      },
    }

    service = new ProductHistoryService(mockPrisma as unknown as PrismaClient, 'user-1')
  })

  it('should query without productSizeId filter when not specified', async () => {
    const result = await service.getProductHistory('prod-123', {
      page: 1,
      limit: 10,
    })

    expect(result.success).toBe(true)
    expect(mockPrisma.transaksiItem.count).toHaveBeenCalledWith({
      where: {
        produkId: 'prod-123',
        transaksi: { status: { not: 'cancelled' } },
      },
    })
    expect(mockPrisma.transaksiItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          produkId: 'prod-123',
          transaksi: { status: { not: 'cancelled' } },
        },
      }),
    )
  })

  it('should apply productSizeId filter to both count and findMany queries', async () => {
    const sizeId = '01e6677c-f78f-48a3-b19f-061531e84f02'
    const result = await service.getProductHistory('prod-123', {
      page: 1,
      limit: 10,
      productSizeId: sizeId,
    })

    expect(result.success).toBe(true)
    expect(mockPrisma.transaksiItem.count).toHaveBeenCalledWith({
      where: {
        produkId: 'prod-123',
        transaksi: { status: { not: 'cancelled' } },
        kondisiAwal: { contains: sizeId },
      },
    })
    expect(mockPrisma.transaksiItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          produkId: 'prod-123',
          transaksi: { status: { not: 'cancelled' } },
          kondisiAwal: { contains: sizeId },
        },
      }),
    )
    expect(result.data?.[0].sizeInfo?.productSizeId).toBe(sizeId)
    expect(result.data?.[0].sizeInfo?.size).toBe('L')
  })
})
