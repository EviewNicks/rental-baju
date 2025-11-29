/**
 * BreakEvenBadge Component
 * RPK-MODAL: Product Break-Even Status Badge Feature
 * 
 * Displays a visual badge when a product has recovered its initial capital investment (modalAwal)
 * through accumulated rental revenue. Includes tooltip with detailed financial breakdown.
 */

'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { formatCurrency } from '@/features/manage-product/lib/utils/product'

interface BreakEvenBadgeProps {
  modalAwal: number
  totalRevenue: number
  transactionCount: number
  size?: 'sm' | 'md' | 'lg'
  showTooltip?: boolean
  className?: string
  isLoading?: boolean
}

/**
 * BreakEvenBadge - Reusable badge component for break-even status
 * 
 * Visual Design:
 * - Soft yellow styling (bg-yellow-100 text-yellow-800 border-yellow-300)
 * - Trophy emoji 🏆
 * - Text: "Modal Kembali"
 * - Only displays when totalRevenue >= modalAwal
 * 
 * @param modalAwal - Initial capital investment
 * @param totalRevenue - Total accumulated revenue
 * @param transactionCount - Number of transactions
 * @param size - Badge size variant (sm, md, lg)
 * @param showTooltip - Whether to show tooltip on hover
 * @param className - Additional CSS classes
 */
export function BreakEvenBadge({
  modalAwal,
  totalRevenue,
  transactionCount,
  size = 'md',
  showTooltip = true,
  className = '',
  isLoading = false,
}: BreakEvenBadgeProps) {
  // Show skeleton loader when loading
  if (isLoading) {
    const sizeClasses = {
      sm: 'h-5 w-20',
      md: 'h-6 w-24', 
      lg: 'h-8 w-28',
    }
    
    return (
      <div
        className={`animate-pulse bg-gray-200 rounded-md ${sizeClasses[size]} ${className}`}
        aria-label="Loading break-even status..."
      />
    )
  }

  // Only display badge when break-even is achieved
  const isBreakEven = totalRevenue >= modalAwal
  
  if (!isBreakEven) {
    return null
  }

  // Calculate profit and percentage
  const profit = totalRevenue - modalAwal
  const profitPercentage = modalAwal > 0 ? (totalRevenue / modalAwal) * 100 : 0

  // Size variants
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  const badgeContent = (
    <Badge
      variant="outline"
      className={`
        bg-yellow-100 text-yellow-800 border-yellow-300
        hover:bg-yellow-200 transition-colors
        ${sizeClasses[size]}
        ${className}
      `}
      aria-label="Modal kembali - Produk telah mencapai break-even"
    >
      <span className="mr-1">🏆</span>
      Modal Kembali
    </Badge>
  )

  // If tooltip is disabled, return badge only
  if (!showTooltip) {
    return badgeContent
  }

  // Tooltip content with financial breakdown
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badgeContent}
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="max-w-xs p-3"
          aria-label="Detail break-even status"
        >
          <div className="space-y-2 text-sm">
            <div className="font-semibold text-yellow-800 border-b border-yellow-200 pb-1">
              📊 Detail Modal Kembali
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Modal Awal:</span>
                <span className="font-medium">{formatCurrency(modalAwal)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Total Pendapatan:</span>
                <span className="font-medium text-green-600">{formatCurrency(totalRevenue)}</span>
              </div>
              
              <div className="flex justify-between border-t border-gray-200 pt-1">
                <span className="text-gray-600">Keuntungan:</span>
                <span className="font-semibold text-green-700">
                  {formatCurrency(profit)} ({profitPercentage.toFixed(1)}%)
                </span>
              </div>
            </div>
            
            <div className="text-xs text-gray-500 pt-1 border-t border-gray-200">
              Dari {transactionCount} transaksi
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
