import { cn } from '@/lib/utils'
import type { TransactionStatus } from '../../types/transaction'

interface StatusBadgeProps {
  status: TransactionStatus
  className?: string
}

const statusConfig: Record<TransactionStatus, { label: string; className: string }> = {
  active: {
    label: 'Aktif',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  selesai: {
    label: 'Selesai',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  terlambat: {
    label: 'Terlambat',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
  cancelled: {
    label: 'Dibatalkan',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border',
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  )
}
