import { Clock, Loader2, Package, AlertTriangle, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/react-query'
import type { ActivityLog } from '../../types'
import { formatDate, formatCurrency } from '../../lib/utils/client'
import { actionIcons, actionColors } from '../../lib/constants/uiConfig'
import { ReturnSessionHistory } from '../ui/return-progress-indicator'

interface ActivityTimelineProps {
  timeline: ActivityLog[]
  transactionCode?: string
  'data-testid'?: string
}

// Return Activity Display Component - ENHANCED (Unified Activity Logging)
interface ReturnActivityProps {
  activity: ActivityLog
}

const ReturnActivityDisplay: React.FC<ReturnActivityProps> = ({ activity }) => {
  const Icon = actionIcons[activity.action] || Package
  const colorClass = actionColors[activity.action] || 'text-blue-600 bg-blue-100'

  // ✅ Extract unified activity data structure
  const summary = activity.details?.summary
  const items = activity.details?.items
  const metadata = activity.details?.metadata

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

        {/* ✅ ENHANCED: Unified Activity Details */}
        {activity.details && (
          <div className="mt-3 space-y-3">
            {/* Summary Section */}
            {summary && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm font-medium text-blue-900 mb-2">Ringkasan Pengembalian</div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Total Item:</span>
                    <span className="font-medium text-blue-900">{summary.totalItems}</span>
                  </div>
                  
                  {summary.isLateReturn && (
                    <div className="flex justify-between">
                      <span className="text-orange-700">Terlambat:</span>
                      <span className="font-medium text-orange-900">{summary.lateDays} hari</span>
                    </div>
                  )}
                  
                  {summary.totalLatePenalty > 0 && (
                    <div className="flex justify-between col-span-2">
                      <span className="text-orange-700">Denda Keterlambatan:</span>
                      <span className="font-medium text-orange-900">
                        {formatCurrency(summary.totalLatePenalty)}
                      </span>
                    </div>
                  )}
                  
                  {summary.totalConditionPenalty > 0 && (
                    <div className="flex justify-between col-span-2">
                      <span className="text-red-700">Denda Kondisi:</span>
                      <span className="font-medium text-red-900">
                        {formatCurrency(summary.totalConditionPenalty)}
                      </span>
                    </div>
                  )}
                  
                  {summary.totalPenalty > 0 && (
                    <div className="flex justify-between col-span-2 pt-2 border-t border-blue-300">
                      <span className="text-blue-900 font-semibold">Total Denda:</span>
                      <span className="font-bold text-red-600">
                        {formatCurrency(summary.totalPenalty)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Items Breakdown Section */}
            {items && items.length > 0 && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-sm font-medium text-green-900 mb-2">
                  Detail Per Item ({items.length} produk)
                </div>
                
                <div className="space-y-3">
                  {items.map((item: {
                    itemId: string
                    productCode: string
                    productName: string
                    sizeInfo: string
                    totalItemPenalty: number
                    conditions: Array<{
                      kondisiAkhir: string
                      jumlahKembali: number
                      penaltyAmount: number
                      conditionCategory: string
                      useManualPricing?: boolean
                      manualPrice?: number
                    }>
                  }, idx: number) => (
                    <div key={item.itemId || idx} className="bg-white p-2 rounded border border-green-300">
                      {/* Product Info */}
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {item.productName}
                          </div>
                          <div className="text-xs text-gray-600">
                            {item.productCode} • {item.sizeInfo}
                          </div>
                        </div>
                        {item.totalItemPenalty > 0 && (
                          <div className="text-xs font-semibold text-red-600">
                            {formatCurrency(item.totalItemPenalty)}
                          </div>
                        )}
                      </div>

                      {/* Conditions Breakdown - FIXED: Show manualPrice as the penalty */}
                      {item.conditions && item.conditions.length > 0 && (
                        <div className="space-y-1 pl-2 border-l-2 border-green-400">
                          {item.conditions.map((condition, condIdx) => {
                            // Color coding by condition
                            const conditionColor = 
                              condition.conditionCategory === 'HILANG' ? 'text-red-700' :
                              condition.conditionCategory === 'RUSAK_BERAT' ? 'text-orange-700' :
                              condition.conditionCategory === 'RUSAK_RINGAN' ? 'text-orange-600' :
                              condition.conditionCategory === 'KOTOR' ? 'text-yellow-700' :
                              'text-green-700'

                            // FIXED: manualPrice is the actual penalty amount
                            const actualPenalty = condition.useManualPricing && condition.manualPrice 
                              ? condition.manualPrice 
                              : condition.penaltyAmount

                            return (
                              <div key={condIdx} className="flex justify-between items-center text-xs">
                                <span className={`flex items-center gap-1 ${conditionColor}`}>
                                  <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                                  {condition.kondisiAkhir}: {condition.jumlahKembali} unit
                                </span>
                                {actualPenalty > 0 && (
                                  <span className="font-medium text-red-600">
                                    {formatCurrency(actualPenalty)}
                                  </span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata Section (Optional - for debugging/admin) */}
            {metadata && metadata.processingMode === 'unified' && (
              <div className="p-2 bg-gray-50 rounded border border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>
                    Status: {metadata.statusChange?.from} → {metadata.statusChange?.to}
                  </span>
                  <span className="text-gray-500">
                    Proses: {metadata.processingTime}ms
                  </span>
                </div>
              </div>
            )}

            {/* ⚠️ FALLBACK: Legacy format support (backward compatibility) */}
            {!summary && !items && activity.details.conditions && (
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-sm font-medium text-yellow-900 mb-2">
                  Detail Pengembalian (Format Lama)
                </div>
                
                {activity.details.conditions.map((condition: { kondisiAkhir: string; jumlahKembali: number; penaltyAmount: number }, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-sm text-yellow-800 mb-1">
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-600"></div>
                      {condition.kondisiAkhir}: {condition.jumlahKembali} item{condition.jumlahKembali > 1 ? 's' : ''}
                    </span>
                    {condition.penaltyAmount > 0 && (
                      <span className="font-medium text-red-600">
                        Denda: {formatCurrency(condition.penaltyAmount)}
                      </span>
                    )}
                  </div>
                ))}
                
                {activity.details.totalPenalty > 0 && (
                  <div className="mt-2 pt-2 border-t border-yellow-300">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-yellow-900">Total Denda:</span>
                      <span className="text-red-600">
                        {formatCurrency(activity.details.totalPenalty)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Pickup Activity Display Component - ENHANCED (Task 4)
interface PickupActivityProps {
  activity: ActivityLog
}

// ✅ Helper function to parse kondisiAwal
interface ParsedKondisiAwal {
  sizeId: string
  size: string
  ageCategory: string
  condition: string
}

function parseKondisiAwal(kondisiAwal: string): ParsedKondisiAwal {
  const parts = kondisiAwal.split('|')
  return {
    sizeId: parts[0] || '',
    size: parts[1] || 'Unknown',
    ageCategory: parts[2] || 'Unknown',
    condition: parts[3] || 'Unknown',
  }
}

const PickupActivityDisplay: React.FC<PickupActivityProps> = ({ activity }) => {
  const Icon = actionIcons[activity.action] || Package
  const colorClass = actionColors[activity.action] || 'text-blue-600 bg-blue-100'

  return (
    <div className="flex items-start gap-4">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
        <Icon className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-900">Item Diambil</h4>
          <time className="text-xs text-gray-500">{formatDate(activity.timestamp)}</time>
        </div>

        <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
        
        {/* ✅ ENHANCED: Show kasir name instead of user ID */}
        <div className="text-xs text-gray-600 mt-1">
          Oleh: {activity.details?.processedByName || activity.performedBy}
        </div>

        {/* Pickup Details Expansion - ENHANCED */}
        {activity.details && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm font-medium text-blue-900 mb-2">Detail Pengambilan</div>

            {/* ✅ ENHANCED: Show product details with size and age category */}
            {activity.details.items && Array.isArray(activity.details.items) && (
              <div className="space-y-1 mb-2">
                {activity.details.items.map(
                  (
                    item: {
                      itemId: string
                      jumlahDiambil: number
                      productName?: string
                      kondisiAwal?: string
                    },
                    idx: number,
                  ) => {
                    // Parse kondisiAwal for size info
                    const sizeInfo = item.kondisiAwal ? parseKondisiAwal(item.kondisiAwal) : null

                    return (
                      <div key={idx} className="flex items-center text-sm text-blue-800">
                        <div className="w-2 h-2 rounded-full bg-blue-600 mr-2"></div>
                        <span>
                          {/* ✅ Format: [Product Name] ([Size] - [Age Category]) - [Quantity] unit diambil */}
                          {item.productName || 'Unknown Product'}
                          {sizeInfo && ` (${sizeInfo.size} - ${sizeInfo.ageCategory})`} -{' '}
                          {item.jumlahDiambil} unit diambil
                        </span>
                      </div>
                    )
                  },
                )}
              </div>
            )}

            {activity.details.catatan && (
              <div className="mt-2 pt-2 border-t border-blue-300">
                <div className="text-sm font-medium text-blue-900 mb-1">Catatan:</div>
                <div className="text-sm text-blue-800 bg-blue-25 p-2 rounded italic">
                  &ldquo;{activity.details.catatan}&rdquo;
                </div>
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
            <div className="text-sm font-medium text-red-900 mb-2">
              Rincian Denda
            </div>
            
            {activity.details.penaltyBreakdown?.map((penalty: { produkName: string; penaltyAmount: number; conditions?: { kondisiAkhir: string; penaltyAmount: number }[] }, idx: number) => (
              <div key={idx} className="mb-3 last:mb-0">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-red-800">
                    {penalty.produkName}
                  </span>
                  <span className="font-bold text-red-800">
                    {formatCurrency(penalty.penaltyAmount)}
                  </span>
                </div>
                
                {penalty.conditions?.map((condition: { kondisiAkhir: string; penaltyAmount: number }, condIdx: number) => (
                  <div key={condIdx} className="ml-4 mt-1 text-xs text-red-700 flex justify-between">
                    <span>{condition.kondisiAkhir}</span>
                    <span>{formatCurrency(condition.penaltyAmount)}</span>
                  </div>
                ))}
              </div>
            ))}
            
            <div className="mt-3 pt-3 border-t border-red-300">
              <div className="flex justify-between text-sm font-bold text-red-900">
                <span>Total Denda:</span>
                <span>{formatCurrency(activity.details.totalPenalty || activity.details.amount)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ✅ NEW: Cancelled Activity Display Component
interface CancelledActivityProps {
  activity: ActivityLog
}

const CancelledActivityDisplay: React.FC<CancelledActivityProps> = ({ activity }) => {
  const Icon = actionIcons[activity.action] || XCircle
  const colorClass = actionColors[activity.action] || 'text-gray-600 bg-gray-100'

  return (
    <div className="flex items-start gap-4">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
        <Icon className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-900">Transaksi Dibatalkan</h4>
          <time className="text-xs text-gray-500">{formatDate(activity.timestamp)}</time>
        </div>

        <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
        <div className="text-xs text-gray-600 mt-1">Oleh: {activity.performedBy}</div>

        {/* Cancellation Details */}
        {activity.details && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-gray-900 mb-2">
              Informasi Pembatalan
            </div>
            
            <div className="space-y-2 text-sm">
              {activity.details.reason && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Alasan:</span>
                  <span className="font-medium text-gray-900">{activity.details.reason}</span>
                </div>
              )}
              
              {activity.details.totalAmount && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Transaksi:</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(Number(activity.details.totalAmount))}
                  </span>
                </div>
              )}
              
              {activity.details.amountPaid && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Sudah Dibayar:</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(Number(activity.details.amountPaid))}
                  </span>
                </div>
              )}
              
              {activity.details.needsRefund && (
                <div className="mt-3 pt-3 border-t border-gray-300">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-orange-700">Status Refund:</span>
                    <span className="text-sm font-bold text-orange-700">Perlu Diproses</span>
                  </div>
                  <div className="text-xs text-orange-600 mt-1">
                    Customer telah membayar {formatCurrency(Number(activity.details.amountPaid))} dan perlu refund
                  </div>
                </div>
              )}
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

  // ✅ TASK 7: Extract return sessions for session history display (Requirements: 4.3, 4.4, 5.2)
  const returnSessions = deduplicatedTimeline
    .filter(activity => activity.action === 'returned')
    .map((activity, index) => ({
      sessionNumber: index + 1,
      date: formatDate(activity.timestamp),
      itemsReturned: activity.details?.items?.length || 0,
      totalPenalty: activity.details?.summary?.totalPenalty || 0,
      performedBy: activity.details?.metadata?.processedByName || activity.performedBy,
    }))

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

      {/* ✅ TASK 7: Return Session History Summary (Requirements: 4.3, 4.4, 5.2) */}
      {returnSessions.length > 0 && (
        <div className="mb-6">
          <ReturnSessionHistory
            sessions={returnSessions}
            data-testid="return-session-history"
          />
        </div>
      )}

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

          // Special handling for pickup activities - ENHANCED (Task 4)
          if (
            activity.action === 'picked_up' ||
            (activity.description &&
              (activity.description.includes('Pickup dilakukan') ||
                activity.description.includes('Pickup:')))
          ) {
            return (
              <div key={activity.id} className="relative pb-6">
                <PickupActivityDisplay activity={activity} />
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

          // ✅ NEW: Special handling for cancelled activities
          if (activity.action === 'cancelled') {
            return (
              <div key={activity.id} className="relative pb-6">
                <CancelledActivityDisplay activity={activity} />
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
