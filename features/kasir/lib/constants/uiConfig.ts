/**
 * UI Configuration Constants for Kasir Feature
 * Centralized configuration for UI styling, icons, and visual elements
 */

import {
  Package,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  MessageCircle,
  AlertCircle,
  CheckCircle as CheckIcon,
  Info,
} from 'lucide-react'
import type { TransactionStatus } from '../../types'

// Transaction Status Configuration
export const statusConfig: Record<
  TransactionStatus,
  { label: string; className: string; description: string }
> = {
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

// Activity Timeline Configuration
export const actionIcons = {
  created: Package,
  paid: DollarSign,
  picked_up: CheckCircle,
  returned: CheckCircle,
  overdue: AlertTriangle,
  reminder_sent: MessageCircle,
  penalty_added: AlertTriangle,
}

export const actionColors = {
  created: 'text-blue-600 bg-blue-100',
  paid: 'text-green-600 bg-green-100',
  picked_up: 'text-green-600 bg-green-100',
  returned: 'text-green-600 bg-green-100',
  overdue: 'text-red-600 bg-red-100',
  reminder_sent: 'text-yellow-600 bg-yellow-100',
  penalty_added: 'text-red-600 bg-red-100',
}

// Notification Styles Configuration
export type NotificationType = 'error' | 'warning' | 'info' | 'success'

export const notificationStyles: Record<
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
    icon: Info,
    iconColor: 'text-blue-500',
    titleColor: 'text-blue-900',
    messageColor: 'text-blue-700',
    helpTextColor: 'text-blue-600',
    buttonColor: 'text-blue-500 hover:text-blue-700',
  },
  success: {
    container: 'bg-green-50 border border-green-200',
    icon: CheckIcon,
    iconColor: 'text-green-500',
    titleColor: 'text-green-900',
    messageColor: 'text-green-700',
    helpTextColor: 'text-green-600',
    buttonColor: 'text-green-500 hover:text-green-700',
  },
}