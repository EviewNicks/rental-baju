'use client'

/**
 * Summary Cards Component
 * 
 * Displays three summary cards:
 * - Total Income (green)
 * - Total Expense (orange)
 * - Net Balance (green if positive, red if negative)
 * 
 * Requirements: 4.1, 4.5
 */

import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { DailySummary } from '../types'
import { formatRupiah } from '../utils/currency'

interface SummaryCardsProps {
  summary?: DailySummary
  isLoading?: boolean
  selectedKasirName?: string | null
}

export function SummaryCards({ summary, isLoading, selectedKasirName }: SummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 w-24 bg-gray-200 rounded mb-4" />
            <div className="h-8 w-32 bg-gray-200 rounded mb-2" />
            <div className="h-3 w-20 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    )
  }

  const totalIncome = summary?.totalIncome || 0
  const totalExpense = summary?.totalExpense || 0
  const netBalance = summary?.netBalance || 0
  const isNegative = netBalance < 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Kasir Filter Info */}
      {selectedKasirName && (
        <div className="col-span-full mb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              Menampilkan data untuk: <strong>{selectedKasirName}</strong>
            </p>
          </div>
        </div>
      )}

      {/* Total Income Card */}
      <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 border-l-4 border-green-500">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600">
            Total Pendapatan
          </h3>
          <div className="p-2 bg-green-100 rounded-lg">
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
        </div>
        <p className="text-2xl font-bold text-gray-900 mb-1">
          {formatRupiah(totalIncome)}
        </p>
        <p className="text-xs text-gray-500">
          Dari transaksi rental
        </p>
      </div>

      {/* Total Expense Card */}
      <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 border-l-4 border-orange-500">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600">
            Total Pengeluaran
          </h3>
          <div className="p-2 bg-orange-100 rounded-lg">
            <TrendingDown className="w-5 h-5 text-orange-600" />
          </div>
        </div>
        <p className="text-2xl font-bold text-gray-900 mb-1">
          {formatRupiah(totalExpense)}
        </p>
        <p className="text-xs text-gray-500">
          Pengeluaran operasional
        </p>
      </div>

      {/* Net Balance Card */}
      <div className={`bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 border-l-4 ${
        isNegative ? 'border-red-500' : 'border-blue-500'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600">
            Saldo Bersih
          </h3>
          <div className={`p-2 rounded-lg ${
            isNegative ? 'bg-red-100' : 'bg-blue-100'
          }`}>
            <DollarSign className={`w-5 h-5 ${
              isNegative ? 'text-red-600' : 'text-blue-600'
            }`} />
          </div>
        </div>
        <p className={`text-2xl font-bold mb-1 ${
          isNegative ? 'text-red-600' : 'text-gray-900'
        }`}>
          {formatRupiah(netBalance)}
        </p>
        <p className="text-xs text-gray-500">
          {isNegative ? 'Defisit' : 'Surplus'}
        </p>
      </div>
    </div>
  )
}
