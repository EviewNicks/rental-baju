/**
 * BreakEvenProgress Component
 * RPK-MODAL: Product Break-Even Status Badge Feature
 * 
 * Displays a progress bar showing how close a product is to recovering its initial
 * capital investment (modalAwal). Only displayed on ProductDetailPage header.
 */

'use client'

import React from 'react'
import { Progress } from '@/components/ui/progress'
import { formatCurrency } from '@/features/manage-product/lib/utils/product'

interface BreakEvenProgressProps {
  modalAwal: number
  totalRevenue: number
  transactionCount: number
  className?: string
  isLoading?: boolean
}

/**
 * BreakEvenProgress - Progress bar component for break-even status
 * 
 * Visual Design:
 * - Progress bar with gradient fill
 * - Percentage display: "Progress Modal: 75%"
 * - Currency breakdown: "Rp 7.5jt / Rp 10jt"
 * - Caps visual progress at 100% but shows actual percentage
 * 
 * Edge Cases:
 * - If modalAwal === 0: Hide component
 * - If modalAwal === null: Show "Modal awal tidak tersedia"
 * - If totalRevenue > modalAwal: Show 100% bar + actual percentage
 * 
 * @param modalAwal - Initial capital investment
 * @param totalRevenue - Total accumulated revenue
 * @param transactionCount - Number of transactions
 * @param className - Additional CSS classes
 */
export function BreakEvenProgress({
  modalAwal,
  totalRevenue,
  transactionCount,
  className = '',
  isLoading = false,
}: BreakEvenProgressProps) {
  // Show skeleton loader when loading
  if (isLoading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
        </div>
        <div className="h-3 bg-gray-200 rounded w-full animate-pulse"></div>
        <div className="flex items-center justify-between">
          <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
        </div>
      </div>
    )
  }

  // Handle edge case: modalAwal is 0 or null
  if (!modalAwal || modalAwal === 0) {
    return null
  }

  // Calculate progress percentage
  const progressPercentage = (totalRevenue / modalAwal) * 100
  
  // Cap visual progress at 100% but show actual percentage in text
  const visualProgress = Math.min(progressPercentage, 100)
  
  // Determine if break-even is achieved
  const isBreakEven = totalRevenue >= modalAwal

  // Format currency for display (shortened format)
  const formatShortCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `Rp ${(amount / 1000000).toFixed(1)}jt`
    } else if (amount >= 1000) {
      return `Rp ${(amount / 1000).toFixed(0)}rb`
    }
    return formatCurrency(amount)
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Progress Label */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">
          Progress Modal: {progressPercentage.toFixed(1)}%
        </span>
        <span className="text-xs text-gray-500">
          {transactionCount} transaksi
        </span>
      </div>

      {/* Progress Bar */}
      <Progress
        value={visualProgress}
        className="h-3"
        aria-label={`Progress modal ${progressPercentage.toFixed(1)}%`}
      />

      {/* Currency Breakdown */}
      <div className="flex items-center justify-between text-xs">
        <span className={isBreakEven ? 'text-green-600 font-medium' : 'text-gray-600'}>
          {formatShortCurrency(totalRevenue)} / {formatShortCurrency(modalAwal)}
        </span>
        
        {isBreakEven && (
          <span className="text-green-600 font-medium flex items-center gap-1">
            <span>✓</span>
            <span>Modal Kembali</span>
          </span>
        )}
      </div>

      {/* Additional Info for Over 100% */}
      {progressPercentage > 100 && (
        <div className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
          Keuntungan: {formatCurrency(totalRevenue - modalAwal)} 
          <span className="ml-1">({(progressPercentage - 100).toFixed(1)}% di atas modal)</span>
        </div>
      )}
    </div>
  )
}
