'use client'

/**
 * Income List Component
 *
 * Displays list of income from rental transactions
 * Shows:
 * - Transaction code
 * - Customer name
 * - Rental amount
 * - Penalty amount (if applicable)
 * - Transaction status
 * - Kasir name
 *
 * Requirements: 1.1, 1.2, 1.3, 1.5
 */

import { Receipt, User, AlertCircle, TrendingDown, CreditCard } from 'lucide-react'
import { IncomeItem } from '../types'
import { formatRupiah } from '../utils/currency'
import { Badge } from '@/components/ui/badge'

interface IncomeListProps {
  income: IncomeItem[]
  isLoading?: boolean
  selectedKasirName?: string | null
}

export function IncomeList({ income, isLoading, selectedKasirName }: IncomeListProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border-b pb-4 last:border-0">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Empty state
  if (income.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-6">
          <Receipt className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-900">Pendapatan</h2>
        </div>
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <Receipt className="w-8 h-8 text-gray-400" />
          </div>
          {selectedKasirName ? (
            <div>
              <p className="text-gray-500 text-sm mb-1">
                Tidak ada data pendapatan untuk kasir <strong>{selectedKasirName}</strong>
              </p>
              <p className="text-gray-400 text-xs">pada tanggal yang dipilih</p>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Belum ada pendapatan hari ini</p>
          )}
        </div>
      </div>
    )
  }

  // Calculate total
  const totalIncome = income.reduce((sum, item) => sum + item.rentalAmount + item.penaltyAmount, 0)

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Pendapatan</h2>
          </div>
          <span className="text-sm font-medium text-gray-600">{income.length} transaksi</span>
        </div>
      </div>

      {/* Income List */}
      <div className="p-6">
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
          {income.map((item) => {
            // Task 7: Visual distinction for penalty entries (Requirements: 3.6)
            const isPenaltyEntry = item.type === 'penalty'
            const borderColor = isPenaltyEntry ? 'border-orange-100' : 'border-gray-100'
            const bgColor = isPenaltyEntry ? 'bg-orange-50/30' : ''

            return (
              <div
                key={`${item.type}-${item.transaksiKode}`}
                className={`border-b ${borderColor} pb-4 last:border-0 last:pb-0 ${bgColor} ${isPenaltyEntry ? 'p-3 rounded-lg' : ''}`}
              >
                {/* Transaction Code with Type Badge */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {isPenaltyEntry && <AlertCircle className="w-4 h-4 text-orange-500" />}
                    <span className="text-sm font-medium text-blue-600">{item.transaksiKode}</span>
                    {isPenaltyEntry && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">
                        Penalty
                      </span>
                    )}
                    {/* Kasir Badge with role-based colors */}
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        item.kasirName === 'Owner'
                          ? 'bg-yellow-100 text-yellow-800' // Gold for Owner
                          : 'bg-blue-100 text-blue-700' // Blue for Kasir
                      }`}
                    >
                      {item.kasirName}
                    </span>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      item.status === 'completed' || item.status === 'selesai'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                {/* Customer Name */}
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-900">{item.customerName}</span>
                </div>

                {/* Task 7: Payment Method Display */}
                {item.paymentMethod && item.paymentMethod !== 'N/A' && (
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    <Badge variant="outline" className="text-xs font-medium capitalize">
                      {item.paymentMethod.toUpperCase()}
                    </Badge>
                    {item.paymentCount && item.paymentCount > 1 && (
                      <span className="text-xs text-gray-500">
                        (+{item.paymentCount - 1} lainnya)
                      </span>
                    )}
                  </div>
                )}

                {/* Amounts */}
                <div className="space-y-1 mb-2">
                  {!isPenaltyEntry && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Sewa:</span>
                      <span className="font-medium text-gray-900">
                        {formatRupiah(item.rentalAmount)}
                      </span>
                    </div>
                  )}

                  {/* Task 7: Display penalty breakdown (Requirements: 3.4, 3.6) */}
                  {isPenaltyEntry && item.penaltyBreakdown && (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Denda Terlambat:</span>
                        <span className="font-medium text-orange-600">
                          {formatRupiah(item.penaltyBreakdown.latePenalty)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Denda Kondisi:</span>
                        <span className="font-medium text-orange-600">
                          {formatRupiah(item.penaltyBreakdown.conditionPenalty)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <TrendingDown className="w-3 h-3" />
                        <span>{item.penaltyBreakdown.itemCount} item(s)</span>
                      </div>
                    </>
                  )}

                  {!isPenaltyEntry && item.penaltyAmount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Denda:</span>
                      <span className="font-medium text-red-600">
                        {formatRupiah(item.penaltyAmount)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm pt-1 border-t border-gray-100">
                    <span className="text-gray-900 font-medium">Total:</span>
                    <span
                      className={`font-bold ${isPenaltyEntry ? 'text-orange-600' : 'text-green-600'}`}
                    >
                      {formatRupiah(item.rentalAmount + item.penaltyAmount)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Total Summary */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">Total Pendapatan:</span>
            <span className="text-lg font-bold text-green-600">{formatRupiah(totalIncome)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
