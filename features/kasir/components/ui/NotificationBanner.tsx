'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NotificationType, notificationStyles } from '../../lib/constants/uiConfig'

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
