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
}

export function KasirFilter({ 
  income, 
  expenses, 
  selectedKasirId, 
  onKasirChange,
  isLoading 
}: KasirFilterProps) {
  // Extract unique kasir from income and expenses
  const kasirOptions = useMemo(() => {
    const kasirMap = new Map<string, KasirOption>()
    
    // From income
    income.forEach(item => {
      if (item.kasirId && item.kasirName) {
        kasirMap.set(item.kasirId, {
          id: item.kasirId,
          nama: item.kasirName
        })
      }
    })
    
    // From expenses
    expenses.forEach(expense => {
      if (expense.kasir) {
        kasirMap.set(expense.kasir.id, {
          id: expense.kasir.id,
          nama: expense.kasir.nama
        })
      }
    })
    
    return Array.from(kasirMap.values()).sort((a, b) => a.nama.localeCompare(b.nama))
  }, [income, expenses])

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700">
        Kasir:
      </label>
      <select
        value={selectedKasirId || ''}
        onChange={(e) => onKasirChange(e.target.value || null)}
        disabled={isLoading}
        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
      >
        <option value="">Semua Kasir</option>
        {kasirOptions.map(kasir => (
          <option key={kasir.id} value={kasir.id}>
            {kasir.nama}
          </option>
        ))}
      </select>
    </div>
  )
}