'use client'

/**
 * Dana Kasir Dashboard Component
 * 
 * Main dashboard component that orchestrates all sub-components
 * Manages state and data fetching for the entire dashboard
 * 
 * Requirements: 6.1, 6.3, 7.1, 7.2
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Download } from 'lucide-react'
import { DateNavigation } from './DateNavigation'
import { SummaryCards } from './SummaryCards'
import { IncomeList } from './IncomeList'
import { ExpenseList } from './ExpenseList'
import { useDanaSummary } from '../hooks/useDanaSummary'
import { formatWITADate } from '../utils/timezone'

interface DanaKasirDashboardProps {
  initialDate: Date
  userRole: string
}

export function DanaKasirDashboard({ initialDate, userRole }: DanaKasirDashboardProps) {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)

  // Fetch dashboard data
  const { data, isLoading, error, refetch } = useDanaSummary(selectedDate)

  // Handle date change
  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate)
    // Update URL with new date
    const dateStr = formatWITADate(newDate)
    router.push(`/dana-kasir?date=${dateStr}`)
  }

  // Determine if user can write (create/edit/delete expenses)
  const canWrite = userRole === 'kasir'
  const canExport = userRole === 'owner'

  // Handle add expense
  const handleAddExpense = () => {
    setShowExpenseForm(true)
    // TODO: Implement in Task 10 - Open PengeluaranForm modal
    console.log('Add expense clicked')
  }

  // Handle export
  const handleExport = () => {
    setShowExportDialog(true)
    // TODO: Implement in Task 12 - Open ExportDialog
    console.log('Export clicked')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dana Kasir
        </h1>
        <p className="text-gray-600">
          Kelola pendapatan dan pengeluaran harian
        </p>
      </div>

      {/* Date Navigation */}
      <div className="mb-6">
        <DateNavigation
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          canExport={canExport}
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            Gagal memuat data. Silakan coba lagi.
          </p>
          <button
            onClick={() => refetch()}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Muat Ulang
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="mb-8">
        <SummaryCards
          summary={data?.summary}
          isLoading={isLoading}
        />
      </div>

      {/* Income and Expense Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Income List */}
        <IncomeList
          income={data?.income || []}
          isLoading={isLoading}
        />

        {/* Expense List */}
        <ExpenseList
          expenses={data?.expenses || []}
          isLoading={isLoading}
          canWrite={canWrite}
          onRefresh={refetch}
        />
      </div>

      {/* Action Buttons - Prominent */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        {canWrite && (
          <button
            onClick={handleAddExpense}
            className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium shadow-md hover:shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Tambah Pengeluaran
          </button>
        )}
        
        {canExport && (
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shadow-md hover:shadow-lg"
          >
            <Download className="w-5 h-5" />
            Export CSV
          </button>
        )}
      </div>

      {/* Role Info Badge */}
      {canExport && (
        <div className="mt-6 flex justify-center">
          <div className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-sm text-blue-800">
              <strong>Mode Owner:</strong> Anda dapat melihat semua data dalam mode read-only
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
