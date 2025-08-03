import {
  Clock,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Package,
  MessageCircle,
  Loader2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/react-query'
import type { ActivityLog } from '../../types'
import { formatDate } from '../../lib/utils/client'

interface ActivityTimelineProps {
  timeline: ActivityLog[]
  transactionCode?: string
  'data-testid'?: string
}

const actionIcons = {
  created: Package,
  paid: DollarSign,
  picked_up: CheckCircle,
  returned: CheckCircle,
  overdue: AlertTriangle,
  reminder_sent: MessageCircle,
  penalty_added: AlertTriangle,
}

const actionColors = {
  created: 'text-blue-600 bg-blue-100',
  paid: 'text-green-600 bg-green-100',
  picked_up: 'text-green-600 bg-green-100',
  returned: 'text-green-600 bg-green-100',
  overdue: 'text-red-600 bg-red-100',
  reminder_sent: 'text-yellow-600 bg-yellow-100',
  penalty_added: 'text-red-600 bg-red-100',
}

export function ActivityTimeline({
  timeline,
  transactionCode,
  'data-testid': dataTestId,
}: ActivityTimelineProps) {
  const queryClient = useQueryClient()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastActivityCount, setLastActivityCount] = useState(timeline?.length || 0)

  // 🔥 FIX: Enhanced real-time activity monitoring
  useEffect(() => {
    if (!transactionCode) return

    const queryKey = [...queryKeys.kasir.transaksi.detail(transactionCode), 'transformed']

    // Check if query is currently fetching
    const queryState = queryClient.getQueryState(queryKey)
    const isFetching = queryState?.fetchStatus === 'fetching'

    if (isFetching !== isRefreshing) {
      setIsRefreshing(isFetching)
    }
  }, [transactionCode, queryClient, isRefreshing])

  // 🔥 FIX: Real-time activity count monitoring and auto-refresh
  useEffect(() => {
    const currentActivityCount = timeline?.length || 0

    if (currentActivityCount !== lastActivityCount) {
      setLastActivityCount(currentActivityCount)

      // If activity count decreased unexpectedly, force a refresh
      if (currentActivityCount < lastActivityCount && lastActivityCount > 0) {
        setTimeout(() => {
          queryClient.refetchQueries({
            queryKey: [...queryKeys.kasir.transaksi.detail(transactionCode || ''), 'transformed'],
            type: 'active',
          })
        }, 500)
      }
    }
  }, [timeline?.length, lastActivityCount, transactionCode, queryClient])

  // 🔥 FIX: Periodic sync check for activities (every 10 seconds when component is active)
  useEffect(() => {
    if (!transactionCode) return

    const syncInterval = setInterval(() => {
      const queryKey = [...queryKeys.kasir.transaksi.detail(transactionCode), 'transformed']
      const queryState = queryClient.getQueryState(queryKey)

      // Only sync if not currently fetching and has data
      if (queryState?.fetchStatus !== 'fetching' && queryState?.data) {
        queryClient
          .refetchQueries({
            queryKey,
            type: 'active',
          })
          .catch((error) => {
            console.error('❌ Periodic sync failed', {
              transactionCode,
              error: error instanceof Error ? error.message : 'Unknown error',
            })
          })
      }
    }, 10000) // Sync every 10 seconds

    return () => {
      clearInterval(syncInterval)
    }
  }, [transactionCode, queryClient, timeline?.length])

  // 🛡️ Activity deduplication - remove duplicate entries
  const deduplicatedTimeline = timeline.filter((activity, index, arr) => {
    const duplicateIndex = arr.findIndex(
      (a) =>
        a.action === activity.action &&
        a.description === activity.description &&
        Math.abs(new Date(a.timestamp).getTime() - new Date(activity.timestamp).getTime()) < 5000, // 5s tolerance
    )
    return duplicateIndex === index
  })

  // Log deduplication results
  if (deduplicatedTimeline.length !== timeline.length) {
    console.warn('🔄 Duplicate activities filtered out', {
      originalCount: timeline.length,
      filteredCount: deduplicatedTimeline.length,
      duplicatesRemoved: timeline.length - deduplicatedTimeline.length,
      duplicates: timeline
        .filter((activity, index, arr) => {
          const duplicateIndex = arr.findIndex(
            (a) =>
              a.action === activity.action &&
              a.description === activity.description &&
              Math.abs(new Date(a.timestamp).getTime() - new Date(activity.timestamp).getTime()) <
                5000,
          )
          return duplicateIndex !== index
        })
        .map((a) => ({ action: a.action, description: a.description, timestamp: a.timestamp })),
    })
  }

  if (!deduplicatedTimeline || deduplicatedTimeline.length === 0) {
    console.warn('ActivityTimeline: No activities to display')
    return (
      <div
        data-testid={dataTestId}
        className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Riwayat Aktivitas</h2>
        <div className="text-center py-8 text-gray-500">
          <Clock className="h-8 w-8 mx-auto mb-3 text-gray-400" />
          <p>Belum ada aktivitas tercatat</p>
        </div>
      </div>
    )
  }

  return (
    <div
      data-testid={dataTestId}
      className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6"
    >
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Riwayat Aktivitas</h2>
        {isRefreshing && (
          <div title="Memperbarui riwayat aktivitas...">
            <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
          </div>
        )}
      </div>

      <div className="space-y-6">
        {deduplicatedTimeline.map((activity, index) => {
          const Icon = actionIcons[activity.action] || Clock
          const colorClass = actionColors[activity.action] || 'text-gray-600 bg-gray-100'

          return (
            <div key={activity.id} className="flex items-start gap-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}
              >
                <Icon className="h-5 w-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">{activity.description}</h4>
                  <time className="text-xs text-gray-500">{formatDate(activity.timestamp)}</time>
                </div>

                <div className="text-xs text-gray-600 mt-1">Oleh: {activity.performedBy}</div>

                {activity.details && (
                  <div className="mt-2 p-2 bg-gray-50 rounded-lg text-xs text-gray-600">
                    {activity.action === 'paid' && (
                      <div>
                        Jumlah:{' '}
                        {activity.details.amount?.toLocaleString('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                        })}
                        • Metode: {activity.details.method?.toUpperCase()}
                      </div>
                    )}
                    {activity.action === 'penalty_added' && (
                      <div>
                        Denda:{' '}
                        {activity.details.amount?.toLocaleString('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                        })}
                        • Alasan: {activity.details.reason}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {index < deduplicatedTimeline.length - 1 && (
                <div className="absolute left-9 mt-10 w-0.5 h-6 bg-gray-200"></div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
