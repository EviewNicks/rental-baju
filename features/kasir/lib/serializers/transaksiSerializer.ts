/**
 * Transaction Serializer
 * Centralized serialization logic for transaction responses
 * Ensures consistent data formatting across all API endpoints
 */

import { TransaksiWithDetails } from '../../services/transaksiService'

export function serializeTransaksi(transaksi: TransaksiWithDetails) {
  return {
    id: transaksi.id,
    kode: transaksi.kode,
    penyewa: {
      id: transaksi.penyewa.id,
      nama: transaksi.penyewa.nama,
      telepon: transaksi.penyewa.telepon,
      alamat: transaksi.penyewa.alamat,
    },
    kasir: transaksi.kasir
      ? {
          id: transaksi.kasir.id,
          nama: transaksi.kasir.nama,
          isActive: transaksi.kasir.isActive,
        }
      : null,
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
    items: transaksi.items.map(serializeTransaksiItem),
    pembayaran: transaksi.pembayaran.map(serializePembayaran),
    aktivitas: transaksi.aktivitas.map(serializeAktivitas),
  }
}

export function serializeTransaksiItem(item: TransaksiWithDetails['items'][0]) {
  return {
    id: item.id,
    produk: {
      id: item.produk.id,
      code: item.produk.code,
      name: item.produk.name,
      imageUrl: item.produk.imageUrl,
    },
    jumlah: item.jumlah,
    hargaSewa: Number(item.hargaSewa),
    durasi: item.durasi,
    subtotal: Number(item.subtotal),
    kondisiAwal: item.kondisiAwal,
    kondisiAkhir: item.kondisiAkhir,
    statusKembali: item.statusKembali,
  }
}

export function serializePembayaran(payment: TransaksiWithDetails['pembayaran'][0]) {
  return {
    id: payment.id,
    jumlah: Number(payment.jumlah),
    metode: payment.metode,
    referensi: payment.referensi,
    catatan: payment.catatan,
    createdBy: payment.createdBy,
    createdAt: payment.createdAt.toISOString(),
  }
}

export function serializeAktivitas(activity: TransaksiWithDetails['aktivitas'][0]) {
  return {
    id: activity.id,
    tipe: activity.tipe,
    deskripsi: activity.deskripsi,
    data: activity.data,
    createdBy: activity.createdBy,
    createdAt: activity.createdAt.toISOString(),
  }
}

/**
 * Serialize transaction list item (lighter version for list views)
 */
export function serializeTransaksiListItem(transaksi: TransaksiWithDetails) {
  const hasPickup = transaksi.items.some((item) => (item.jumlahDiambil || 0) > 0)

  return {
    id: transaksi.id,
    kode: transaksi.kode,
    penyewa: {
      id: transaksi.penyewa.id,
      nama: transaksi.penyewa.nama,
      telepon: transaksi.penyewa.telepon,
      alamat: transaksi.penyewa.alamat,
    },
    kasir: transaksi.kasir
      ? {
          id: transaksi.kasir.id,
          nama: transaksi.kasir.nama,
          isActive: transaksi.kasir.isActive,
        }
      : null,
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
    itemCount: transaksi.items.length,
    hasPickup,
    items: transaksi.items.map((item) => ({
      id: item.id,
      produk: {
        id: item.produk.id,
        name: item.produk.name,
      },
      jumlah: item.jumlah,
      jumlahDiambil: item.jumlahDiambil || 0,
    })),
    recentPayment: transaksi.pembayaran[0]
      ? {
          jumlah: Number(transaksi.pembayaran[0].jumlah),
          metode: transaksi.pembayaran[0].metode,
          createdAt: transaksi.pembayaran[0].createdAt.toISOString(),
        }
      : null,
  }
}
