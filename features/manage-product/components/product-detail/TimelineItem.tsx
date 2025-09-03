/**
 * TimelineItem Component - RPK-46 Product History
 * Individual timeline entry for product rental history
 * Follows ActivityTimeline.tsx visual patterns and structure
 */

'use client'

import React from 'react'
import { Calendar, User, TrendingUp, AlertCircle } from 'lucide-react'
import { formatDate, formatCurrency } from '@/features/kasir/lib/utils/client'
import type { ProductHistoryItem } from '../../types/productHistory'

interface TimelineItemProps {
  item: ProductHistoryItem
  isLast?: boolean
  'data-testid'?: string
}

export function TimelineItem({ item, isLast = false, 'data-testid': dataTestId }: TimelineItemProps) {
  // Determine icon and color based on transaction status
  const getStatusDisplay = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return {
          icon: TrendingUp,
          colorClass: 'text-blue-600 bg-blue-100',
          label: 'Aktif',
        }
      case 'selesai':
      case 'completed':
        return {
          icon: Calendar,
          colorClass: 'text-green-600 bg-green-100',
          label: 'Selesai',
        }
      case 'terlambat':
      case 'overdue':
        return {
          icon: AlertCircle,
          colorClass: 'text-red-600 bg-red-100',
          label: 'Terlambat',
        }
      default:
        return {
          icon: Calendar,
          colorClass: 'text-gray-600 bg-gray-100',
          label: status,
        }
    }
  }

  const statusDisplay = getStatusDisplay(item.status)
  const Icon = statusDisplay.icon

  // Format revenue display with penalty breakdown
  const formatRevenue = () => {
    if (item.penaltyAmount > 0) {
      return (
        <span className="font-medium">
          {formatCurrency(item.totalRevenue)}
          <span className="text-red-600 text-xs ml-1">
            (+{formatCurrency(item.penaltyAmount)} denda)
          </span>
        </span>
      )
    }
    return <span className="font-medium">{formatCurrency(item.totalRevenue)}</span>
  }

  return (
    <div 
      data-testid={dataTestId}
      className="relative pb-6"
    >
      <div className="flex items-start gap-4">
        {/* Status Icon */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${statusDisplay.colorClass}`}>
          <Icon className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header: Transaction Code and Date */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="text-sm font-medium text-gray-900">
              {item.transactionCode}
            </h4>
            <time className="text-xs text-gray-500 flex-shrink-0">
              {formatDate(item.transactionDate.toString())}
            </time>
          </div>

          {/* Customer Information */}
          <div className="flex items-center gap-1 mt-1">
            <User className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-600">
              {item.customerName} ({item.customerContact})
            </span>
          </div>

          {/* Transaction Details */}
          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Duration */}
              <div>
                <span className="text-gray-500">Durasi:</span>
                <div className="font-medium text-gray-900">
                  {item.duration} hari
                </div>
              </div>

              {/* Quantity */}
              <div>
                <span className="text-gray-500">Jumlah:</span>
                <div className="font-medium text-gray-900">
                  {item.itemQuantity} item{item.itemQuantity > 1 ? 's' : ''}
                </div>
              </div>

              {/* Status */}
              <div>
                <span className="text-gray-500">Status:</span>
                <div className={`font-medium ${statusDisplay.colorClass.includes('green') ? 'text-green-700' : 
                  statusDisplay.colorClass.includes('red') ? 'text-red-700' : 
                  statusDisplay.colorClass.includes('blue') ? 'text-blue-700' : 'text-gray-700'}`}>
                  {statusDisplay.label}
                </div>
              </div>
            </div>

            {/* Revenue Display */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Pendapatan:</span>
                <div className="text-sm">
                  {formatRevenue()}
                </div>
              </div>
              
              {/* Revenue Breakdown if penalties exist */}
              {item.penaltyAmount > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Sewa dasar:</span>
                    <span>{formatCurrency(item.baseRevenue)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-red-600">
                    <span>Denda:</span>
                    <span>{formatCurrency(item.penaltyAmount)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Rental Period */}
            <div className="mt-2 text-xs text-gray-500">
              Periode: {formatDate(item.rentalStart.toString())} - {item.rentalEnd ? formatDate(item.rentalEnd.toString()) : 'Belum selesai'}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Connector Line */}
      {!isLast && (
        <div className="absolute left-5 mt-4 w-0.5 h-6 bg-gray-200"></div>
      )}
    </div>
  )
}

/**
 * Skeleton loading state for TimelineItem
 */
export function TimelineItemSkeleton() {
  return (
    <div className="relative pb-6">
      <div className="flex items-start gap-4">
        {/* Icon skeleton */}
        <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
        
        {/* Content skeleton */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Header skeleton */}
          <div className="flex items-center justify-between">
            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
          </div>
          
          {/* Customer info skeleton */}
          <div className="h-3 bg-gray-200 rounded w-40 animate-pulse"></div>
          
          {/* Details skeleton */}
          <div className="p-3 bg-gray-50 rounded-lg space-y-2">
            <div className="grid grid-cols-3 gap-3">
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
      
      {/* Connector line */}
      <div className="absolute left-5 mt-4 w-0.5 h-6 bg-gray-200"></div>
    </div>
  )
}