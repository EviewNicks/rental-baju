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
  
  // Fallback for unmapped status values (defensive programming)
  const fallbackConfig = {
    label: status.charAt(0).toUpperCase() + status.slice(1), // Capitalize first letter
    className: 'bg-gray-100 text-gray-800 border-gray-200', // Default gray styling
    description: `Status: ${status}`,
  }
  
  const displayConfig = config || fallbackConfig

  return (
    <span
      data-testid={dataTestId}
      className={cn(
        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border',
        displayConfig.className,
        className,
      )}
      role="status"
      aria-label={ariaLabel || `Status transaksi: ${displayConfig.description}`}
      title={displayConfig.description}
    >
      {displayConfig.label}
    </span>
  )
}
