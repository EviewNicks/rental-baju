'use client'

/**
 * Expense List Component
 * 
 * Displays list of expenses with CRUD actions
 * Shows:
 * - Amount
 * - Category
 * - Description
 * - Kasir name
 * - Timestamp
 * - Edit/Delete buttons (Kasir only)
 * 
 * Requirements: 2.4, 3.1
 */

import { useState } from 'react'
import { ShoppingCart, Plus, Edit2, Trash2, Clock } from 'lucide-react'
import { PengeluaranKasir } from '../types'
import { formatRupiah } from '../utils/currency'

interface ExpenseListProps {
  expenses: PengeluaranKasir[]
  isLoading?: boolean
  canWrite?: boolean
  onAdd?: () => void  // NEW: Handler for add button
  onEdit?: (expense: PengeluaranKasir) => void
  onDelete?: (expense: PengeluaranKasir) => void
  onRefresh?: () => void
}

export function ExpenseList({ 
  expenses, 
  isLoading, 
  canWrite = false,
  onAdd,  // NEW
  onEdit,
  onDelete,
  onRefresh 
}: ExpenseListProps) {
  const [selectedExpense, setSelectedExpense] = useState<PengeluaranKasir | null>(null)

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
  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Pengeluaran
            </h2>
          </div>
          {canWrite && (
            <button
              onClick={onAdd}
              className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Tambah
            </button>
          )}
        </div>
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <ShoppingCart className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm">
            Belum ada pengeluaran hari ini
          </p>
        </div>
      </div>
    )
  }

  // Calculate total
  const totalExpense = expenses.reduce((sum, item) => sum + item.harga, 0)

  // Get category badge color
  const getCategoryColor = (kategori: string) => {
    switch (kategori) {
      case 'Operasional':
        return 'bg-blue-100 text-blue-700'
      case 'Maintenance':
        return 'bg-purple-100 text-purple-700'
      case 'Transport':
        return 'bg-green-100 text-green-700'
      case 'Lainnya':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Pengeluaran
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600">
              {expenses.length} item
            </span>
            {canWrite && (
              <button
                onClick={onAdd}
                className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Tambah
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expense List */}
      <div className="p-6">
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
          {expenses.map((expense) => (
            <div
              key={expense.id}
              className="border-b border-gray-100 pb-4 last:border-0 last:pb-0"
            >
              {/* Category and Amount */}
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getCategoryColor(expense.kategori)}`}>
                  {expense.kategori}
                </span>
                <span className="text-lg font-bold text-gray-900">
                  {formatRupiah(expense.harga)}
                </span>
              </div>

              {/* Description */}
              {expense.deskripsi && (
                <p className="text-sm text-gray-700 mb-2">
                  {expense.deskripsi}
                </p>
              )}

              {/* Kasir Info and Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>Kasir: {expense.kasir?.nama || 'N/A'}</span>
                </div>

                {/* Action Buttons (Kasir only) */}
                {canWrite && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onEdit?.(expense)
                      }}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        onDelete?.(expense)
                      }}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Total Summary */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">
              Total Pengeluaran:
            </span>
            <span className="text-lg font-bold text-orange-600">
              {formatRupiah(totalExpense)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
