'use client'

import { AlertCircle, X, RotateCcw, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type NotificationType = 'error' | 'warning' | 'info' | 'success'

interface NotificationBannerProps {
  /**
   * Type of notification determines styling and icon
   */
  type: NotificationType
  /**
   * Main title of the notification
   */
  title: string
  /**
   * Detailed message content
   */
  message: string
  /**
   * Optional additional help text
   */
  helpText?: string
  /**
   * Whether the notification can be dismissed
   * @default true
   */
  dismissible?: boolean
  /**
   * Callback when notification is dismissed
   */
  onDismiss?: () => void
  /**
   * Additional CSS classes
   */
  className?: string
  /**
   * Accessibility role
   */
  role?: 'alert' | 'region'
  /**
   * Accessibility live region
   */
  ariaLive?: 'polite' | 'assertive'
}

const notificationStyles: Record<
  NotificationType,
  {
    container: string
    icon: typeof AlertCircle
    iconColor: string
    titleColor: string
    messageColor: string
    helpTextColor: string
    buttonColor: string
  }
> = {
  error: {
    container: 'bg-red-50 border border-red-200',
    icon: AlertCircle,
    iconColor: 'text-red-500',
    titleColor: 'text-red-900',
    messageColor: 'text-red-700',
    helpTextColor: 'text-red-600',
    buttonColor: 'text-red-500 hover:text-red-700',
  },
  warning: {
    container: 'bg-yellow-50 border border-yellow-200',
    icon: AlertCircle,
    iconColor: 'text-yellow-600',
    titleColor: 'text-yellow-900',
    messageColor: 'text-yellow-700',
    helpTextColor: 'text-yellow-600',
    buttonColor: 'text-yellow-500 hover:text-yellow-700',
  },
  info: {
    container: 'bg-blue-50 border border-blue-200',
    icon: RotateCcw,
    iconColor: 'text-blue-500',
    titleColor: 'text-blue-900',
    messageColor: 'text-blue-700',
    helpTextColor: 'text-blue-600',
    buttonColor: 'text-blue-500 hover:text-blue-700',
  },
  success: {
    container: 'bg-green-50 border border-green-200',
    icon: CheckCircle,
    iconColor: 'text-green-500',
    titleColor: 'text-green-900',
    messageColor: 'text-green-700',
    helpTextColor: 'text-green-600',
    buttonColor: 'text-green-500 hover:text-green-700',
  },
}

/**
 * Reusable notification banner component
 * Standardizes notification patterns across the transaction form
 */
export function NotificationBanner({
  type,
  title,
  message,
  helpText,
  dismissible = true,
  onDismiss,
  className = '',
  // role = type === 'error' ? 'alert' : 'region',
  // ariaLive = type === 'error' ? 'assertive' : 'polite',
}: NotificationBannerProps) {
  const styles = notificationStyles[type]
  const Icon = styles.icon

  return (
    <div
      className={`${styles.container} rounded-xl p-4 flex items-start gap-3 mb-6 ${className}`}
      // role={role}
      // aria-live={ariaLive}
    >
      <Icon className={`h-5 w-5 ${styles.iconColor} mt-0.5 flex-shrink-0`} />
      <div className="flex-1">
        <h3 className={`text-sm font-medium ${styles.titleColor}`}>{title}</h3>
        <p className={`text-sm ${styles.messageColor} mt-1`}>{message}</p>
        {helpText && <div className={`mt-2 text-xs ${styles.helpTextColor}`}>{helpText}</div>}
      </div>
      {dismissible && onDismiss && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className={`h-6 w-6 p-0 ${styles.buttonColor}`}
          aria-label="Tutup notifikasi"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
