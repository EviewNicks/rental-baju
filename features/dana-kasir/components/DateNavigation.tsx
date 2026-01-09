'use client'

/**
 * Date Navigation Component
 *
 * Provides date selection controls:
 * - Date picker for selecting specific date
 * - "Today" quick button
 * - Previous/Next day navigation
 * - Export CSV button (Owner only)
 *
 * Requirements: 5.1, 5.2, 5.4
 */

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar, Download } from 'lucide-react'
import { formatWITADate, getCurrentWITADate } from '../utils/timezone'
import { KasirFilter } from './KasirFilter'
import { IncomeItem, PengeluaranKasir } from '../types'

interface DateNavigationProps {
  selectedDate: Date
  onDateChange: (date: Date) => void
  canExport?: boolean
  onExport?: () => void
  // New props for kasir filter
  income: IncomeItem[]
  expenses: PengeluaranKasir[]
  selectedKasirId: string | null
  onKasirChange: (kasirId: string | null) => void
  isLoading?: boolean
  userRole: 'kasir' | 'owner' // Add user role
}

export function DateNavigation({
  selectedDate,
  onDateChange,
  canExport = false,
  onExport,
  income,
  expenses,
  selectedKasirId,
  onKasirChange,
  isLoading,
  userRole,
}: DateNavigationProps) {
  const [showDatePicker, setShowDatePicker] = useState(false)

  // Handle previous day
  const handlePrevDay = () => {
    const prevDay = new Date(selectedDate)
    prevDay.setDate(prevDay.getDate() - 1)
    onDateChange(prevDay)
  }

  // Handle next day
  const handleNextDay = () => {
    const nextDay = new Date(selectedDate)
    nextDay.setDate(nextDay.getDate() + 1)
    onDateChange(nextDay)
  }

  // Handle today button
  const handleToday = () => {
    onDateChange(getCurrentWITADate())
  }

  // Handle date picker change
  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value)
    onDateChange(newDate)
    setShowDatePicker(false)
  }

  // Format date for display in WITA timezone
  const displayDate = selectedDate.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Makassar', // WITA timezone
  })

  // Check if selected date is today
  const isToday = formatWITADate(selectedDate) === formatWITADate(getCurrentWITADate())

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      {/* Date Navigation Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Date Controls */}
        <div className="flex items-center gap-2">
          {/* Previous Day Button */}
          <button
            onClick={handlePrevDay}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            title="Hari Sebelumnya"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          {/* Date Display / Picker */}
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors min-w-[280px]"
            >
              <Calendar className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">{displayDate}</span>
            </button>

            {/* Date Picker Input */}
            {showDatePicker && (
              <div className="absolute top-full mt-2 left-0 z-10 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
                <input
                  title="input value"
                  type="date"
                  value={formatWITADate(selectedDate)}
                  onChange={handleDatePickerChange}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  max={formatWITADate(getCurrentWITADate())}
                />
              </div>
            )}
          </div>

          {/* Next Day Button */}
          <button
            onClick={handleNextDay}
            disabled={isToday}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Hari Berikutnya"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>

          {/* Today Button */}
          {!isToday && (
            <button
              onClick={handleToday}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Hari Ini
            </button>
          )}
        </div>

        {/* Kasir Filter */}
        <KasirFilter
          income={income}
          expenses={expenses}
          selectedKasirId={selectedKasirId}
          onKasirChange={onKasirChange}
          isLoading={isLoading}
          userRole={userRole}
        />
      </div>

      {/* Export Button (Owner only) */}
      {canExport && onExport && (
        <button
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      )}
    </div>
  )
}
