import { Clock, CheckCircle, AlertTriangle, DollarSign, Package, MessageCircle } from 'lucide-react'
import type { ActivityLog } from '../../types/transaction-detail'
import { formatDate } from '../../lib/utils'
import { useLogger } from '@/lib/client-logger'

interface ActivityTimelineProps {
  timeline: ActivityLog[]
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

export function ActivityTimeline({ timeline, 'data-testid': dataTestId }: ActivityTimelineProps) {
  const logger = useLogger('ActivityTimeline')
  
  // Log activity timeline data for debugging
  logger.debug('ActivityTimeline rendered', {
    timelineLength: timeline.length,
    activities: timeline.map(activity => ({
      id: activity.id,
      action: activity.action,
      description: activity.description,
      timestamp: activity.timestamp,
      performedBy: activity.performedBy,
      hasDetails: !!activity.details,
    })),
  })
  
  if (!timeline || timeline.length === 0) {
    logger.warn('ActivityTimeline: No activities to display')
    return (
      <div data-testid={dataTestId} className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Riwayat Aktivitas</h2>
        <div className="text-center py-8 text-gray-500">
          <Clock className="h-8 w-8 mx-auto mb-3 text-gray-400" />
          <p>Belum ada aktivitas tercatat</p>
        </div>
      </div>
    )
  }

  return (
    <div data-testid={dataTestId} className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Riwayat Aktivitas</h2>

      <div className="space-y-6">
        {timeline.map((activity, index) => {
          const Icon = actionIcons[activity.action] || Clock
          const colorClass = actionColors[activity.action] || 'text-gray-600 bg-gray-100'

          // Log each activity item rendering
          logger.debug(`Rendering activity item ${index + 1}`, {
            id: activity.id,
            action: activity.action,
            iconFound: !!actionIcons[activity.action],
            colorClass,
            description: activity.description,
          })

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

              {index < timeline.length - 1 && (
                <div className="absolute left-9 mt-10 w-0.5 h-6 bg-gray-200"></div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
