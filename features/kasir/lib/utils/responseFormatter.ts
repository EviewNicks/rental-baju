/**
 * Transaction Response Formatter Utility
 *
 * Centralized response formatting logic to eliminate duplication
 * across GET and PUT API endpoints in transaction management
 *
 * Extracted from: app/api/kasir/transaksi/[kode]/route.ts
 * Lines 125-206 (GET) and 337-418 (PUT)
 */

import { Decimal } from '@prisma/client/runtime/library'

// Internal interfaces for transaction data structure
interface TransactionItem {
  id: string
  produk: {
    id: string
    code: string
    name: string
    modalAwal: Decimal | string | number
    imageUrl?: string | null | undefined
    size?: string | null | undefined
    category?:
      | {
          id: string
          name: string
        }
      | null
      | undefined
  }
  jumlah: number
  jumlahDiambil: number
  hargaSewa: Decimal | string | number
  durasi: number
  subtotal: Decimal | string | number
  kondisiAwal?: string | null
  kondisiAkhir?: string | null
  statusKembali: string
  isMultiCondition?: boolean
  multiConditionSummary?: Record<string, unknown> | null
  totalReturnPenalty?: Decimal | string | number
  returnConditions?: Array<{
    id: string
    kondisiAkhir: string
    jumlahKembali: number
    penaltyAmount: Decimal | string | number
    modalAwalUsed?: Decimal | string | number | null
    resolutionStatus?: string | null
    resolutionDate?: string | Date | null
    createdAt: string | Date
    createdBy: string
  }>
}

interface TransactionPayment {
  id: string
  jumlah: Decimal | string | number
  metode: string
  referensi?: string | null | undefined
  catatan?: string | null | undefined
  createdBy: string
  createdAt: string | Date
}

interface TransactionActivity {
  id: string
  tipe: string
  deskripsi: string
  data?: Record<string, unknown> | null | undefined
  createdBy: string
  createdAt: string | Date
}

interface TransactionCustomer {
  id: string
  nama: string
  telepon: string
  alamat: string
  nik?: string | null
  email?: string | null
}

interface TransactionKasir {
  id: string
  nama: string
  isActive: boolean
  createdAt: string | Date
  updatedAt: string | Date
}

interface TransactionData {
  id: string
  kode: string
  penyewa: TransactionCustomer
  kasir: TransactionKasir | null
  status: string
  totalHarga: Decimal | string | number
  jumlahBayar: Decimal | string | number
  sisaBayar: Decimal | string | number
  tglMulai: string | Date
  tglSelesai: string | Date | null
  tglKembali: string | Date | null
  metodeBayar: string
  catatan: string | null
  // Enhanced: Include discount fields
  discountType: string | null
  discountValue: Decimal | string | number | null
  createdBy: string
  createdAt: string | Date
  updatedAt: string | Date
  items: TransactionItem[]
  pembayaran: TransactionPayment[]
  aktivitas: TransactionActivity[]
}

export interface FormattedTransactionResponse {
  id: string
  kode: string
  penyewa: {
    id: string
    nama: string
    telepon: string
    alamat: string
    nik?: string | null
    email?: string | null
  }
  kasir: {
    id: string
    nama: string
    isActive: boolean
    createdAt: string
    updatedAt: string
  } | null
  status: string
  totalHarga: number
  jumlahBayar: number
  sisaBayar: number
  tglMulai: string
  tglSelesai: string | null
  tglKembali: string | null
  metodeBayar: string
  catatan: string | null
  // Enhanced: Include discount fields
  discountType: string | null
  discountValue: number | null
  createdBy: string
  createdAt: string
  updatedAt: string
  items: Array<{
    id: string
    produk: {
      id: string
      code: string
      name: string
      modalAwal: number
      imageUrl?: string | null
      size?: string | null
      category?: string | null
    }
    jumlah: number
    jumlahDiambil: number
    hargaSewa: number
    durasi: number
    subtotal: number
    kondisiAwal?: string | null
    kondisiAkhir?: string | null
    statusKembali: string
    isMultiCondition?: boolean
    multiConditionSummary?: Record<string, unknown> | null
    totalReturnPenalty?: number
    conditionBreakdown?: Array<{
      id: string
      kondisiAkhir: string
      jumlahKembali: number
      penaltyAmount: number
      modalAwalUsed?: number | null
      resolutionStatus?: string | null
      resolutionDate?: string | null
      createdAt: string
      createdBy: string
    }>
  }>
  pembayaran: Array<{
    id: string
    jumlah: number
    metode: string
    referensi?: string | null
    catatan?: string | null
    createdBy: string
    createdAt: string
  }>
  aktivitas: Array<{
    id: string
    tipe: string
    deskripsi: string
    data?: Record<string, unknown> | null
    createdBy: string
    createdAt: string
  }>
}

/**
 * Format transaction data for API response
 *
 * This function centralizes the duplicate response formatting logic
 * that was previously present in both GET and PUT endpoints
 *
 * @param transaksi - Raw transaction data from database
 * @returns Formatted transaction data ready for API response
 */
export function formatTransactionResponse(
  transaksi: TransactionData,
): FormattedTransactionResponse {
  return {
    id: transaksi.id,
    kode: transaksi.kode,
    penyewa: {
      id: transaksi.penyewa.id,
      nama: transaksi.penyewa.nama,
      telepon: transaksi.penyewa.telepon,
      alamat: transaksi.penyewa.alamat,
      // Add NIK field for customer identity number
      //eslint-disable-next-line @typescript-eslint/no-explicit-any
      nik: (transaksi.penyewa as any).nik || null,
      // Add email field for customer contact
      //eslint-disable-next-line @typescript-eslint/no-explicit-any
      email: (transaksi.penyewa as any).email || null,
    },
    kasir: transaksi.kasir
      ? {
          id: transaksi.kasir.id,
          nama: transaksi.kasir.nama,
          isActive: transaksi.kasir.isActive,
          createdAt:
            typeof transaksi.kasir.createdAt === 'object'
              ? transaksi.kasir.createdAt.toISOString()
              : transaksi.kasir.createdAt,
          updatedAt:
            typeof transaksi.kasir.updatedAt === 'object'
              ? transaksi.kasir.updatedAt.toISOString()
              : transaksi.kasir.updatedAt,
        }
      : null,
    status: transaksi.status,

    // Handle Decimal types with robust type checking
    totalHarga:
      typeof transaksi.totalHarga === 'object'
        ? Number(transaksi.totalHarga)
        : Number(transaksi.totalHarga),
    jumlahBayar:
      typeof transaksi.jumlahBayar === 'object'
        ? Number(transaksi.jumlahBayar)
        : Number(transaksi.jumlahBayar),
    sisaBayar:
      typeof transaksi.sisaBayar === 'object'
        ? Number(transaksi.sisaBayar)
        : Number(transaksi.sisaBayar),

    // Handle Date types with robust type checking
    tglMulai:
      typeof transaksi.tglMulai === 'object'
        ? transaksi.tglMulai.toISOString()
        : transaksi.tglMulai,
    tglSelesai: transaksi.tglSelesai
      ? typeof transaksi.tglSelesai === 'object'
        ? transaksi.tglSelesai.toISOString()
        : transaksi.tglSelesai
      : null,
    tglKembali: transaksi.tglKembali
      ? typeof transaksi.tglKembali === 'object'
        ? transaksi.tglKembali.toISOString()
        : transaksi.tglKembali
      : null,

    metodeBayar: transaksi.metodeBayar,
    catatan: transaksi.catatan,
    // Enhanced: Include discount information
    discountType: transaksi.discountType,
    discountValue: transaksi.discountValue
      ? typeof transaksi.discountValue === 'object'
        ? Number(transaksi.discountValue)
        : Number(transaksi.discountValue)
      : null,
    createdBy: transaksi.createdBy,
    createdAt:
      typeof transaksi.createdAt === 'object'
        ? transaksi.createdAt.toISOString()
        : transaksi.createdAt,
    updatedAt:
      typeof transaksi.updatedAt === 'object'
        ? transaksi.updatedAt.toISOString()
        : transaksi.updatedAt,
    items: transaksi.items.map((item: TransactionItem) => ({
      id: item.id,
      produk: {
        id: item.produk.id,
        code: item.produk.code,
        name: item.produk.name,
        modalAwal:
          typeof item.produk.modalAwal === 'object'
            ? Number(item.produk.modalAwal)
            : Number(item.produk.modalAwal),
        imageUrl: item.produk.imageUrl || null,
        size: item.produk.size || null,
        category: item.produk.category?.name || null,
      },
      jumlah: item.jumlah,
      jumlahDiambil: item.jumlahDiambil,
      hargaSewa:
        typeof item.hargaSewa === 'object' ? Number(item.hargaSewa) : Number(item.hargaSewa),
      durasi: item.durasi,
      subtotal: typeof item.subtotal === 'object' ? Number(item.subtotal) : Number(item.subtotal),
      kondisiAwal: item.kondisiAwal,
      kondisiAkhir: item.kondisiAkhir,
      statusKembali: item.statusKembali,

      // TSK-24: Multi-condition return enhancements
      ...(item.isMultiCondition && {
        isMultiCondition: item.isMultiCondition,
      }),
      ...(item.multiConditionSummary && {
        multiConditionSummary: item.multiConditionSummary,
      }),
      ...(item.totalReturnPenalty && {
        totalReturnPenalty:
          typeof item.totalReturnPenalty === 'object'
            ? Number(item.totalReturnPenalty)
            : Number(item.totalReturnPenalty),
      }),
      ...(item.returnConditions &&
        item.returnConditions.length > 0 && {
          conditionBreakdown: item.returnConditions.map((condition) => ({
            id: condition.id,
            kondisiAkhir: condition.kondisiAkhir,
            jumlahKembali: condition.jumlahKembali,
            penaltyAmount:
              typeof condition.penaltyAmount === 'object'
                ? Number(condition.penaltyAmount)
                : Number(condition.penaltyAmount),
            modalAwalUsed: condition.modalAwalUsed
              ? typeof condition.modalAwalUsed === 'object'
                ? Number(condition.modalAwalUsed)
                : Number(condition.modalAwalUsed)
              : null,
            resolutionStatus: condition.resolutionStatus || null,
            resolutionDate: condition.resolutionDate
              ? typeof condition.resolutionDate === 'object'
                ? condition.resolutionDate.toISOString()
                : condition.resolutionDate
              : null,
            createdAt:
              typeof condition.createdAt === 'object'
                ? condition.createdAt.toISOString()
                : condition.createdAt,
            createdBy: condition.createdBy,
          })),
        }),
    })),
    pembayaran: transaksi.pembayaran.map((payment: TransactionPayment) => ({
      id: payment.id,
      jumlah: typeof payment.jumlah === 'object' ? Number(payment.jumlah) : Number(payment.jumlah),
      metode: payment.metode,
      referensi: payment.referensi,
      catatan: payment.catatan,
      createdBy: payment.createdBy,
      createdAt:
        typeof payment.createdAt === 'object' ? payment.createdAt.toISOString() : payment.createdAt,
    })),
    aktivitas: transaksi.aktivitas.map((activity: TransactionActivity) => ({
      id: activity.id,
      tipe: activity.tipe,
      deskripsi: activity.deskripsi,
      data: activity.data,
      createdBy: activity.createdBy,
      createdAt:
        typeof activity.createdAt === 'object'
          ? activity.createdAt.toISOString()
          : activity.createdAt,
    })),
  }
}
