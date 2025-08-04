import { cn } from '@/lib/utils'
import type { TransactionStatus } from '../../types'
import { statusConfig } from '../../lib/constants/uiConfig'

interface StatusBadgeProps {
  status: TransactionStatus
  className?: string
  'data-testid'?: string
  'aria-label'?: string
}

export function StatusBadge({
  status,
  className,
  'data-testid': dataTestId,
  'aria-label': ariaLabel,
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
