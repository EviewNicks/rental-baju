import { Suspense } from 'react'
import { ProductHistoryPageWrapper } from './ProductHistoryPageWrapper'

export const metadata = {
  title: 'Riwayat Transaksi Produk',
  description: 'Lihat riwayat transaksi produk rental',
}

export default function ProductHistoryRoute() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat riwayat transaksi...</p>
          </div>
        </div>
      }
    >
      <ProductHistoryPageWrapper />
    </Suspense>
  )
}
