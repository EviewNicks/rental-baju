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
import { ShoppingCart, Plus, Edit2, Trash2 } from 'lucide-react'
import { PengeluaranKasir } from '../types'
import { formatRupiah } from '../utils/currency'

interface ExpenseListProps {
  expenses: PengeluaranKasir[]
  isLoading?: boolean
  canWrite?: boolean
  onAdd?: () => void
  onEdit?: (expense: PengeluaranKasir) => void
  onDelete?: (expense: PengeluaranKasir) => void
  onRefresh?: () => void
  selectedKasirName?: string | null
  userRole: 'kasir' | 'owner'
  currentUserId?: string // Add current user ID for permission checks
}

export function ExpenseList({
  expenses,
  isLoading,
  canWrite = false,
  onAdd,
  onEdit,
  onDelete,
  selectedKasirName,
  userRole,
  currentUserId,
}: ExpenseListProps) {
  // Role-based permission logic
  const canEditExpense = (expense: PengeluaranKasir) => {
    if (!canWrite) return false
    
    // Check if user created this expense
    const isOwner = expense.createdBy === currentUserId
    
    if (userRole === 'kasir') {
      // Kasir can only edit their own expenses (and not Owner expenses)
      return isOwner && expense.kasirId !== 'owner-system'
    } else {
      // Owner can only edit Owner expenses they created
      return isOwner && expense.kasirId === 'owner-system'
    }
  }

  const canDeleteExpense = (expense: PengeluaranKasir) => {
    if (!canWrite) return false
    
    // Same logic as edit
    return canEditExpense(expense)
  }
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
            <h2 className="text-lg font-semibold text-gray-900">Pengeluaran</h2>
          </div>
          <div className="flex items-center gap-3">
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
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <ShoppingCart className="w-8 h-8 text-gray-400" />
          </div>
          {selectedKasirName ? (
            <div>
              <p className="text-gray-500 text-sm mb-1">
                Tidak ada data pengeluaran untuk kasir <strong>{selectedKasirName}</strong>
              </p>
              <p className="text-gray-400 text-xs">
                pada tanggal yang dipilih
              </p>
            </div>
          ) : (
            <div>
              <p className="text-gray-500 text-sm mb-1">
                {userRole === 'kasir' 
                  ? 'Belum ada pengeluaran kasir hari ini'
                  : 'Belum ada pengeluaran hari ini'
                }
              </p>
              {userRole === 'kasir' && (
                <p className="text-gray-400 text-xs">
                  Pengeluaran Owner tidak ditampilkan untuk kasir
                </p>
              )}
            </div>
          )}
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
            <h2 className="text-lg font-semibold text-gray-900">Pengeluaran</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600">{expenses.length} item</span>
            
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
            <div key={expense.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
              {/* Category and Amount */}
              <div className="flex items-center justify-between mb-2 gap-2">
                <div className=' flex w-full gap-4'>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${getCategoryColor(expense.kategori)}`}
                  >
                  {expense.kategori}
                </span>
                {/* Kasir Badge with role-based colors */}
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    expense.kasir?.nama === 'Owner' 
                      ? 'bg-yellow-100 text-yellow-800' // Gold for Owner
                      : 'bg-blue-100 text-blue-700'    // Blue for Kasir
                  }`}>
                    {expense.kasir?.nama || 'N/A'}
                  </span>
                  </div>
                <span className="text-lg font-bold text-gray-900">
                  {formatRupiah(expense.harga)}
                </span>
              </div>

  
              {/* Kasir Badge and Actions */}
              <div className="flex items-center justify-between">
            {/* Description */}
              {expense.deskripsi && (
                <p className="text-sm text-gray-700 mb-2">{expense.deskripsi}</p>
              )}


                {/* Action Buttons (Role-based permissions) */}
                {(canEditExpense(expense) || canDeleteExpense(expense)) && (
                  <div className="flex items-center gap-2">
                    {canEditExpense(expense) && (
                      <button
                        onClick={() => {
                          onEdit?.(expense)
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {canDeleteExpense(expense) && (
                      <button
                        onClick={() => {
                          onDelete?.(expense)
                        }}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Total Summary */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">Total Pengeluaran:</span>
            <span className="text-lg font-bold text-orange-600">{formatRupiah(totalExpense)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
