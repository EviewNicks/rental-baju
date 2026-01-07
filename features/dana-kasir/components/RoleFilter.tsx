'use client'

/**
 * Role Filter Component
 * 
 * Dropdown filter for selecting role-based expense filtering
 * Only visible to owner users for filtering expenses by role
 * 
 * Requirements: 4.3, 4.4, 4.5
 */

import { ChevronDown } from 'lucide-react'

interface RoleFilterProps {
  value: 'all' | 'kasir' | 'owner'
  onChange: (role: 'all' | 'kasir' | 'owner') => void
  disabled?: boolean
}

export function RoleFilter({ value, onChange, disabled = false }: RoleFilterProps) {
  const options = [
    { value: 'all' as const, label: 'Semua' },
    { value: 'kasir' as const, label: 'Kasir' },
    { value: 'owner' as const, label: 'Owner' }
  ]


  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as 'all' | 'kasir' | 'owner')}
        disabled={disabled}
        className={`
          appearance-none text-sm border border-gray-300 rounded-lg px-3 py-2 pr-8 bg-white
          focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500
          transition-colors duration-200
          ${disabled 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'hover:border-gray-400 cursor-pointer'
          }
        `}
        aria-label="Filter pengeluaran berdasarkan role"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {/* Custom dropdown arrow */}
      <div className={`
        absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none
        ${disabled ? 'text-gray-400' : 'text-gray-500'}
      `}>
        <ChevronDown className="w-4 h-4" />
      </div>
      
      {/* Visual indicator for active filter */}
      {value !== 'all' && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full" />
      )}
    </div>
  )
}