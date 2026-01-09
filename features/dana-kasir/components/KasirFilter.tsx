'use client'

/**
 * Kasir Filter Component
 *
 * Dropdown filter for selecting specific kasir or "Semua Kasir"
 * Extracts unique kasir options from income and expense data
 *
 * Requirements: Filter by kasir functionality
 */

import { useMemo } from 'react'
import { KasirOption, IncomeItem, PengeluaranKasir } from '../types'

interface KasirFilterProps {
  income: IncomeItem[]
  expenses: PengeluaranKasir[]
  selectedKasirId: string | null
  onKasirChange: (kasirId: string | null) => void
  isLoading?: boolean
  userRole: 'kasir' | 'owner' // Add user role for filtering
}

export function KasirFilter({
  income,
  expenses,
  selectedKasirId,
  onKasirChange,
  isLoading,
  userRole,
}: KasirFilterProps) {
  // Extract unique kasir from income and expenses with role-based filtering
  const kasirOptions = useMemo(() => {
    const kasirMap = new Map<string, KasirOption>()

    // From income
    income.forEach((item) => {
      if (item.kasirId && item.kasirName) {
        // Role-based filtering: Kasir users don't see Owner option
        if (userRole === 'kasir' && item.kasirId === 'owner-system') {
          return // Skip Owner for Kasir users
        }

        kasirMap.set(item.kasirId, {
          id: item.kasirId,
          nama: item.kasirName,
        })
      }
    })

    // From expenses
    expenses.forEach((expense) => {
      if (expense.kasir) {
        // Role-based filtering: Kasir users don't see Owner option
        if (userRole === 'kasir' && expense.kasir.id === 'owner-system') {
          return // Skip Owner for Kasir users
        }

        kasirMap.set(expense.kasir.id, {
          id: expense.kasir.id,
          nama: expense.kasir.nama,
        })
      }
    })

    // Sort options: Owner first (if visible), then alphabetically
    return Array.from(kasirMap.values()).sort((a, b) => {
      // Owner always comes first for Owner users
      if (a.id === 'owner-system') return -1
      if (b.id === 'owner-system') return 1
      return a.nama.localeCompare(b.nama)
    })
  }, [income, expenses, userRole])

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700">Kasir:</label>
      <select
        aria-label="selecek-cost"
        value={selectedKasirId || ''}
        onChange={(e) => onKasirChange(e.target.value || null)}
        disabled={isLoading}
        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
      >
        <option value="">{userRole === 'owner' ? 'Semua' : 'Semua Kasir'}</option>
        {kasirOptions.map((kasir) => (
          <option key={kasir.id} value={kasir.id}>
            {kasir.nama}
          </option>
        ))}
      </select>
    </div>
  )
}
