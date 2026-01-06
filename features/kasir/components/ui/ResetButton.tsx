'use client'

import React from 'react'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface ResetButtonProps {
  onReset: () => void
  hasActiveFilters: boolean
  className?: string
}

/**
 * ResetButton Component
 * 
 * A button component for clearing all active filters in the transaction list.
 * Only visible when there are active filters to provide clear visual feedback.
 * 
 * Features:
 * - Conditional visibility based on active filters
 * - Accessible button with proper ARIA labels
 * - Visual feedback with icon and text
 * - Hover and focus states
 */
export function ResetButton({ 
  onReset, 
  hasActiveFilters, 
  className 
}: ResetButtonProps) {
  // Don't render if no active filters
  if (!hasActiveFilters) {
    return null
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onReset}
      className={cn(
        "flex items-center gap-2 text-gray-600 hover:text-gray-800 border-gray-300 hover:border-gray-400",
        "bg-white/80 backdrop-blur-sm hover:bg-white/90",
        "transition-all duration-200",
        className
      )}
      aria-label="Reset semua filter transaksi"
      data-testid="reset-filters-button"
    >
      <RotateCcw className="h-4 w-4" />
      <span className="text-sm font-medium">Reset Filter</span>
    </Button>
  )
}