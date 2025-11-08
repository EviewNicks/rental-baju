/**
 * Transaction Response Formatter Utility
 *
 * Centralized response formatting logic to eliminate duplication
 * across GET and PUT API endpoints in transaction management
 *
 * Extracted from: app/api/kasir/transaksi/[kode]/route.ts
 * Lines 125-206 (GET) and 337-418 (PUT)
 */

// Internal interfaces for transaction data structure
interface TransactionItem {
  id: string
  produk: {
    id: string
    code: string
    name: string
    modalAwal: string | number
    imageUrl: string | null
    size: string | null
    category: {
      id: string
      name: string
    } | null
  }
  jumlah: number
  jumlahDiambil: number
  hargaSewa: string | number
  durasi: number
  subtotal: string | number
  kondisiAwal: string | null
  kondisiAkhir: string | null
  statusKembali: string
  isMultiCondition?: boolean
  multiConditionSummary?: Record<string, unknown> | null
  totalReturnPenalty?: string | number
  returnConditions?: Array<{
    id: string
    kondisiAkhir: string
    jumlahKembali: number
    penaltyAmount: string | number
    modalAwalUsed: string | number | null
    createdAt: string
    createdBy: string
  }>
}

interface TransactionPayment {
  id: string
  jumlah: string | number
  metode: string
  referensi: string | null
  catatan: string | null
  createdBy: string
  createdAt: string
}

interface TransactionActivity {
  id: string
  tipe: string
  deskripsi: string
  data: Record<string, unknown> | null
  createdBy: string
  createdAt: string
}

interface TransactionCustomer {
  id: string
  nama: string
  telepon: string
  alamat: string
}

interface TransactionData {
  id: string
  kode: string
  penyewa: TransactionCustomer
  status: string
  totalHarga: string | number
  jumlahBayar: string | number
  sisaBayar: string | number
  tglMulai: string
  tglSelesai: string | null
  tglKembali: string | null
  metodeBayar: string
  catatan: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
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
  }
  status: string
  totalHarga: number
  jumlahBayar: number
  sisaBayar: number
  tglMulai: string
  tglSelesai: string | null
  tglKembali: string | null
  metodeBayar: string
  catatan: string | null
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
      imageUrl: string | null
      size: string | null
      category: string | null
    }
    jumlah: number
    jumlahDiambil: number
    hargaSewa: number
    durasi: number
    subtotal: number
    kondisiAwal: string | null
    kondisiAkhir: string | null
    statusKembali: string
    isMultiCondition?: boolean
    multiConditionSummary?: Record<string, unknown> | null
    totalReturnPenalty?: number
    conditionBreakdown?: Array<{
      id: string
      kondisiAkhir: string
      jumlahKembali: number
      penaltyAmount: number
      modalAwalUsed: number | null
      createdAt: string
      createdBy: string
    }>
  }>
  pembayaran: Array<{
    id: string
    jumlah: number
    metode: string
    referensi: string | null
    catatan: string | null
    createdBy: string
    createdAt: string
  }>
  aktivitas: Array<{
    id: string
    tipe: string
    deskripsi: string
    data: Record<string, unknown> | null
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
  transaksi: TransactionData
): FormattedTransactionResponse {
  return {
    id: transaksi.id,
    kode: transaksi.kode,
    penyewa: {
      id: transaksi.penyewa.id,
      nama: transaksi.penyewa.nama,
      telepon: transaksi.penyewa.telepon,
      alamat: transaksi.penyewa.alamat
    },
    status: transaksi.status,
    totalHarga: Number(transaksi.totalHarga),
    jumlahBayar: Number(transaksi.jumlahBayar),
    sisaBayar: Number(transaksi.sisaBayar),
    tglMulai: transaksi.tglMulai.toISOString(),
    tglSelesai: transaksi.tglSelesai?.toISOString() || null,
    tglKembali: transaksi.tglKembali?.toISOString() || null,
    metodeBayar: transaksi.metodeBayar,
    catatan: transaksi.catatan,
    createdBy: transaksi.createdBy,
    createdAt: transaksi.createdAt.toISOString(),
    updatedAt: transaksi.updatedAt.toISOString(),
    items: transaksi.items.map((item: TransactionItem) => ({
      id: item.id,
      produk: {
        id: item.produk.id,
        code: item.produk.code,
        name: item.produk.name,
        modalAwal: Number(item.produk.modalAwal),
        imageUrl: item.produk.imageUrl,
        size: item.produk.size || null,
        category: item.produk.category?.name || null
      },
      jumlah: item.jumlah,
      jumlahDiambil: item.jumlahDiambil,
      hargaSewa: Number(item.hargaSewa),
      durasi: item.durasi,
      subtotal: Number(item.subtotal),
      kondisiAwal: item.kondisiAwal,
      kondisiAkhir: item.kondisiAkhir,
      statusKembali: item.statusKembali,
      // TSK-24: Multi-condition return enhancements
      ...(item.isMultiCondition && {
        isMultiCondition: item.isMultiCondition
      }),
      ...(item.multiConditionSummary && {
        multiConditionSummary: item.multiConditionSummary
      }),
      ...(item.totalReturnPenalty && {
        totalReturnPenalty: Number(item.totalReturnPenalty)
      }),
      ...(item.returnConditions && item.returnConditions.length > 0 && {
        conditionBreakdown: item.returnConditions.map((condition) => ({
          id: condition.id,
          kondisiAkhir: condition.kondisiAkhir,
          jumlahKembali: condition.jumlahKembali,
          penaltyAmount: Number(condition.penaltyAmount),
          modalAwalUsed: condition.modalAwalUsed ? Number(condition.modalAwalUsed) : null,
          createdAt: condition.createdAt,
          createdBy: condition.createdBy
        }))
      })
    })),
    pembayaran: transaksi.pembayaran.map((payment: TransactionPayment) => ({
      id: payment.id,
      jumlah: Number(payment.jumlah),
      metode: payment.metode,
      referensi: payment.referensi,
      catatan: payment.catatan,
      createdBy: payment.createdBy,
      createdAt: payment.createdAt
    })),
    aktivitas: transaksi.aktivitas.map((activity: TransactionActivity) => ({
      id: activity.id,
      tipe: activity.tipe,
      deskripsi: activity.deskripsi,
      data: activity.data,
      createdBy: activity.createdBy,
      createdAt: activity.createdAt
    }))
  }
}