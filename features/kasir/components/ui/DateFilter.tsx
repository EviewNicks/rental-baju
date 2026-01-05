'use client'

import React, { useState, useCallback } from 'react'
import { Calendar, X, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface DateFilterProps {
  value: string | null
  onChange: (date: string | null) => void
  placeholder?: string
  className?: string
  isLoading?: boolean
}

/**
 * DateFilter Component
 * 
 * A simple date picker component for filtering transactions by rental start date (tglMulai).
 * Uses HTML5 date input with basic validation and accessibility.
 * 
 * Features:
 * - YYYY-MM-DD format validation
 * - Clear button when date is selected
 * - Keyboard accessible
 * - ARIA labels for screen readers
 * - Simple error handling for invalid dates
 * - Allows any valid date (past, present, or future)
 */
export function DateFilter({ 
  value, 
  onChange, 
  placeholder = 'Pilih tanggal...', 
  className,
  isLoading = false
}: DateFilterProps) {
  const [error, setError] = useState<string | null>(null)

  // Handle date input change with validation
  const handleDateChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value
    setError(null)

    if (!newValue) {
      onChange(null)
      return
    }

    // Simple validation - just check if it's a valid date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(newValue)) {
      setError('Format tanggal tidak valid')
      return
    }

    // Validate if it's a valid date
    const date = new Date(newValue)
    if (isNaN(date.getTime())) {
      setError('Tanggal tidak valid')
      return
    }

    // Remove future date restriction - allow any valid date
    onChange(newValue)
  }, [onChange])

  // Handle clear button click
  const handleClear = useCallback(() => {
    onChange(null)
    setError(null)
  }, [onChange])

  // Handle keyboard events for accessibility
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape' && value) {
      handleClear()
      event.preventDefault()
    }
  }, [value, handleClear])

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        {isLoading ? (
          <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-500 h-4 w-4 animate-spin" />
        ) : (
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
        )}
        <Input
          type="date"
          value={value || ''}
          onChange={handleDateChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "pl-10 bg-white/80 backdrop-blur-sm border-gray-200 focus:border-yellow-400 focus:ring-yellow-400/20",
            value && "pr-10", // Add padding for clear button when date is selected
            error && "border-red-300 focus:border-red-400 focus:ring-red-400/20",
            isLoading && "opacity-75", // Visual feedback when loading
            value && "bg-yellow-50/50 border-yellow-300" // Visual feedback for selected date
          )}
          aria-label="Filter transaksi berdasarkan tanggal mulai sewa"
          aria-describedby={error ? "date-filter-error" : undefined}
          data-testid="date-filter-input"
          disabled={isLoading}
        />
      </div>
      {error && (
        <p 
          id="date-filter-error" 
          className="mt-1 text-xs text-red-600" 
          role="alert"
          data-testid="date-filter-error"
        >
          {error}
        </p>
      )}
    </div>
  )
}