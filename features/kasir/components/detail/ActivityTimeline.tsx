import { Clock, Loader2, Package, AlertTriangle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/react-query'
import type { ActivityLog } from '../../types'
import { formatDate, formatCurrency } from '../../lib/utils/client'
import { actionIcons, actionColors } from '../../lib/constants/uiConfig'

interface ActivityTimelineProps {
  timeline: ActivityLog[]
  transactionCode?: string
  'data-testid'?: string
}

// Return Activity Display Component
interface ReturnActivityProps {
  activity: ActivityLog
}

const ReturnActivityDisplay: React.FC<ReturnActivityProps> = ({ activity }) => {
  const Icon = actionIcons[activity.action] || Package
  const colorClass = actionColors[activity.action] || 'text-blue-600 bg-blue-100'

  return (
    <div className="flex items-start gap-4">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
        <Icon className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-900">Item Dikembalikan</h4>
          <time className="text-xs text-gray-500">{formatDate(activity.timestamp)}</time>
        </div>

        <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
        <div className="text-xs text-gray-600 mt-1">Oleh: {activity.performedBy}</div>

        {/* Return Details Expansion */}
        {activity.details && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm font-medium text-blue-900 mb-2">Detail Pengembalian</div>

            {activity.details.conditions?.map(
              (
                condition: { kondisiAkhir: string; jumlahKembali: number; penaltyAmount: number },
                idx: number,
              ) => (
                <div
                  key={idx}
                  className="flex justify-between items-center text-sm text-blue-800 mb-1"
                >
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                    {condition.kondisiAkhir}: {condition.jumlahKembali} item
                    {condition.jumlahKembali > 1 ? 's' : ''}
                  </span>
                  {condition.penaltyAmount > 0 && (
                    <span className="font-medium text-red-600">
                      Denda: {formatCurrency(condition.penaltyAmount)}
                    </span>
                  )}
                </div>
              ),
            )}

            {activity.details.totalPenalty > 0 && (
              <div className="mt-2 pt-2 border-t border-blue-300">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-blue-900">Total Denda:</span>
                  <span className="text-red-600">
                    {formatCurrency(activity.details.totalPenalty)}
                  </span>
                </div>
              </div>
            )}

            {activity.details.itemsAffected && (
              <div className="mt-2 text-xs text-blue-700">
                Item: {activity.details.itemsAffected.join(', ')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Penalty Activity Display Component
interface PenaltyActivityProps {
  activity: ActivityLog
}

const PenaltyActivityDisplay: React.FC<PenaltyActivityProps> = ({ activity }) => {
  const Icon = actionIcons[activity.action] || AlertTriangle
  const colorClass = actionColors[activity.action] || 'text-red-600 bg-red-100'

  return (
    <div className="flex items-start gap-4">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
        <Icon className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-900">Denda Diterapkan</h4>
          <time className="text-xs text-gray-500">{formatDate(activity.timestamp)}</time>
        </div>

        <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
        <div className="text-xs text-gray-600 mt-1">Oleh: {activity.performedBy}</div>

        {/* Penalty Details */}
        {activity.details && (
          <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="text-sm font-medium text-red-900 mb-2">Rincian Denda</div>

            {activity.details.penaltyBreakdown?.map(
              (
                penalty: {
                  produkName: string
                  penaltyAmount: number
                  conditions?: { kondisiAkhir: string; penaltyAmount: number }[]
                },
                idx: number,
              ) => (
                <div key={idx} className="mb-3 last:mb-0">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-red-800">{penalty.produkName}</span>
                    <span className="font-bold text-red-800">
                      {formatCurrency(penalty.penaltyAmount)}
                    </span>
                  </div>

                  {penalty.conditions?.map(
                    (
                      condition: { kondisiAkhir: string; penaltyAmount: number },
                      condIdx: number,
                    ) => (
                      <div
                        key={condIdx}
                        className="ml-4 mt-1 text-xs text-red-700 flex justify-between"
                      >
                        <span>{condition.kondisiAkhir}</span>
                        <span>{formatCurrency(condition.penaltyAmount)}</span>
                      </div>
                    ),
                  )}
                </div>
              ),
            )}

            <div className="mt-3 pt-3 border-t border-red-300">
              <div className="flex justify-between text-sm font-bold text-red-900">
                <span>Total Denda:</span>
                <span>
                  {formatCurrency(activity.details.totalPenalty || activity.details.amount)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
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
          // Special handling for return activities
          if (activity.action === 'returned') {
            return (
              <div key={activity.id} className="relative pb-6">
                <ReturnActivityDisplay activity={activity} />
                {index < deduplicatedTimeline.length - 1 && (
                  <div className="absolute left-5 mt-4 w-0.5 h-6 bg-gray-200"></div>
                )}
              </div>
            )
          }

          // Special handling for penalty activities
          if (activity.action === 'penalty_added') {
            return (
              <div key={activity.id} className="relative pb-6">
                <PenaltyActivityDisplay activity={activity} />
                {index < deduplicatedTimeline.length - 1 && (
                  <div className="absolute left-5 mt-4 w-0.5 h-6 bg-gray-200"></div>
                )}
              </div>
            )
          }

          // Default activity display
          const Icon = actionIcons[activity.action] || Clock
          const colorClass = actionColors[activity.action] || 'text-gray-600 bg-gray-100'

          return (
            <div key={activity.id} className="relative pb-6">
              <div className="flex items-start gap-4">
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
                    </div>
                  )}
                </div>
              </div>

              {index < deduplicatedTimeline.length - 1 && (
                <div className="absolute left-5 mt-4 w-0.5 h-6 bg-gray-200"></div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
