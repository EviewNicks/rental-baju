import { cn } from '@/lib/utils'
import type { TransactionStatus } from '../../types/transaction'

interface StatusBadgeProps {
  status: TransactionStatus
  className?: string
  'data-testid'?: string
  'aria-label'?: string
}

const statusConfig: Record<TransactionStatus, { label: string; className: string; description: string }> = {
  active: {
    label: 'Aktif',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Transaksi sedang berjalan',
  },
  selesai: {
    label: 'Selesai',
    className: 'bg-green-100 text-green-800 border-green-200',
    description: 'Transaksi telah selesai',
  },
  terlambat: {
    label: 'Terlambat',
    className: 'bg-red-100 text-red-800 border-red-200',
    description: 'Transaksi terlambat dikembalikan',
  },
  cancelled: {
    label: 'Dibatalkan',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
    description: 'Transaksi dibatalkan',
  },
}

export function StatusBadge({ 
  status, 
  className, 
  'data-testid': dataTestId, 
  'aria-label': ariaLabel 
}: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      data-testid={dataTestId}
      className={cn(
        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border',
        config.className,
        className,
      )}
      role="status"
      aria-label={ariaLabel || `Status transaksi: ${config.description}`}
      title={config.description}
    >
      {config.label}
    </span>
  )
}
