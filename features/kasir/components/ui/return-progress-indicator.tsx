/**
 * ✅ TASK 7: Return Progress Indicator Component
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 * 
 * Displays return progress for individual items and overall transaction progress.
 * Shows progress in format "returned/total" with visual indicators.
 */

import { CheckCircle, Clock, AlertCircle, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ReturnProgress } from '../../lib/utils/partialReturnHelpers'

interface ReturnProgressIndicatorProps {
  progress: ReturnProgress
  size?: 'sm' | 'md' | 'lg'
  showPercentage?: boolean
  showIcon?: boolean
  className?: string
  'data-testid'?: string
}

/**
 * ✅ TASK 7: Individual return progress indicator
 * Requirements: 4.1, 4.2, 4.5
 */
export function ReturnProgressIndicator({
  progress,
  size = 'md',
  showPercentage = true,
  showIcon = true,
  className,
  'data-testid': dataTestId,
}: ReturnProgressIndicatorProps) {
  // Size configurations
  const sizeConfig = {
    sm: {
      container: 'text-xs',
      icon: 'h-3 w-3',
      progress: 'h-1',
    },
    md: {
      container: 'text-sm',
      icon: 'h-4 w-4',
      progress: 'h-2',
    },
    lg: {
      container: 'text-base',
      icon: 'h-5 w-5',
      progress: 'h-3',
    },
  }

  // Status-based styling
  const getStatusConfig = (status: ReturnProgress['status']) => {
    switch (status) {
      case 'complete':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          progressColor: 'bg-green-500',
          label: 'Lengkap',
        }
      case 'partial':
        return {
          icon: AlertCircle,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          progressColor: 'bg-yellow-500',
          label: 'Sebagian',
        }
      case 'pending':
        return {
          icon: Clock,
          color: 'text-gray-500',
          bgColor: 'bg-gray-100',
          progressColor: 'bg-gray-300',
          label: 'Belum',
        }
      default:
        return {
          icon: Package,
          color: 'text-gray-500',
          bgColor: 'bg-gray-100',
          progressColor: 'bg-gray-300',
          label: 'Unknown',
        }
    }
  }

  const config = sizeConfig[size]
  const statusConfig = getStatusConfig(progress.status)
  const Icon = statusConfig.icon

  return (
    <div
      data-testid={dataTestId}
      className={cn(
        'flex items-center gap-2',
        config.container,
        className
      )}
    >
      {/* Status Icon */}
      {showIcon && (
        <div className={cn(
          'flex items-center justify-center rounded-full p-1',
          statusConfig.bgColor
        )}>
          <Icon className={cn(config.icon, statusConfig.color)} />
        </div>
      )}

      {/* Progress Text */}
      <div className="flex items-center gap-2 flex-1">
        <span className={cn('font-medium', statusConfig.color)}>
          {progress.returned}/{progress.total}
        </span>
        
        {showPercentage && (
          <span className="text-gray-500">
            ({progress.percentage}%)
          </span>
        )}
        
        <span className={cn('text-xs', statusConfig.color)}>
          {statusConfig.label}
        </span>
      </div>

      {/* Progress Bar */}
      <div className={cn(
        'flex-1 bg-gray-200 rounded-full overflow-hidden',
        config.progress
      )}>
        <div
          className={cn(
            'h-full transition-all duration-300 ease-out',
            statusConfig.progressColor
          )}
          style={{ width: `${Math.min(100, progress.percentage)}%` }}
        />
      </div>
    </div>
  )
}

interface TransactionProgressSummaryProps {
  progress: ReturnProgress
  totalItems: number
  className?: string
  'data-testid'?: string
}

/**
 * ✅ TASK 7: Transaction-level progress summary
 * Requirements: 4.1, 4.4, 4.5
 */
export function TransactionProgressSummary({
  progress,
  totalItems,
  className,
  'data-testid': dataTestId,
}: TransactionProgressSummaryProps) {
  const statusConfig = {
    complete: {
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-900',
      accentColor: 'text-green-600',
    },
    partial: {
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-900',
      accentColor: 'text-yellow-600',
    },
    pending: {
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      textColor: 'text-gray-900',
      accentColor: 'text-gray-600',
    },
  }

  const config = statusConfig[progress.status] || statusConfig.pending

  return (
    <div
      data-testid={dataTestId}
      className={cn(
        'p-4 rounded-lg border',
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className={cn('text-sm font-medium', config.textColor)}>
          Progress Pengembalian
        </h3>
        <span className={cn('text-xs font-semibold', config.accentColor)}>
          {progress.percentage}% Selesai
        </span>
      </div>

      {/* Progress Indicator */}
      <ReturnProgressIndicator
        progress={progress}
        size="md"
        showPercentage={false}
        className="mb-3"
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 text-xs">
        <div className="text-center">
          <div className={cn('font-semibold', config.textColor)}>
            {progress.returned}
          </div>
          <div className="text-gray-600">Dikembalikan</div>
        </div>
        <div className="text-center">
          <div className={cn('font-semibold', config.textColor)}>
            {progress.total - progress.returned}
          </div>
          <div className="text-gray-600">Tersisa</div>
        </div>
        <div className="text-center">
          <div className={cn('font-semibold', config.textColor)}>
            {totalItems}
          </div>
          <div className="text-gray-600">Total Produk</div>
        </div>
      </div>
    </div>
  )
}

interface ReturnSessionHistoryProps {
  sessions: Array<{
    sessionNumber: number
    date: string
    itemsReturned: number
    totalPenalty?: number
    performedBy?: string
  }>
  className?: string
  'data-testid'?: string
}

/**
 * ✅ TASK 7: Return session history display
 * Requirements: 4.3, 4.4, 5.2
 */
export function ReturnSessionHistory({
  sessions,
  className,
  'data-testid': dataTestId,
}: ReturnSessionHistoryProps) {
  if (!sessions || sessions.length === 0) {
    return (
      <div
        data-testid={dataTestId}
        className={cn(
          'p-4 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200',
          className
        )}
      >
        <Clock className="h-6 w-6 mx-auto mb-2 text-gray-400" />
        <p className="text-sm">Belum ada sesi pengembalian</p>
      </div>
    )
  }

  return (
    <div
      data-testid={dataTestId}
      className={cn(
        'space-y-3',
        className
      )}
    >
      <h4 className="text-sm font-medium text-gray-900 mb-3">
        Riwayat Sesi Pengembalian ({sessions.length} sesi)
      </h4>

      {sessions.map((session) => (
        <div
          key={session.sessionNumber}
          className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">
              {session.sessionNumber}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">
                Sesi {session.sessionNumber}
              </div>
              <div className="text-xs text-gray-600">
                {session.date} • {session.itemsReturned} item
                {session.performedBy && ` • oleh ${session.performedBy}`}
              </div>
            </div>
          </div>

          {session.totalPenalty && session.totalPenalty > 0 && (
            <div className="text-xs font-medium text-red-600">
              Denda: {session.totalPenalty.toLocaleString('id-ID', {
                style: 'currency',
                currency: 'IDR',
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}