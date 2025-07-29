'use client'

import { CheckCircle } from 'lucide-react'

interface TransactionSuccessScreenProps {
  /**
   * Transaction code for user reference
   */
  transactionCode?: string
  /**
   * Custom success message
   */
  message?: string
  /**
   * Auto redirect delay in milliseconds
   * @default 2000
   */
  redirectDelay?: number
}

/**
 * Success screen component for completed transactions
 * Extracted from TransactionFormPage for better separation of concerns
 */
export function TransactionSuccessScreen({
  transactionCode,
  message = "Transaksi penyewaan telah berhasil disimpan dan siap diproses.",
  redirectDelay = 2000
}: TransactionSuccessScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-8 text-center max-w-md mx-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Transaksi Berhasil Dibuat!
        </h2>
        {transactionCode && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <div className="text-sm font-medium text-green-900">Kode Transaksi</div>
            <div className="text-lg font-bold text-green-700">{transactionCode}</div>
          </div>
        )}
        <p className="text-gray-600 mb-6">
          {message}
        </p>
        <div className="text-sm text-gray-500">
          Mengalihkan ke dashboard dalam {redirectDelay / 1000} detik...
        </div>
      </div>
    </div>
  )
}