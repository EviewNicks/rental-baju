'use client'

import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/react-query'
import { kasirApi } from '../api'

interface UseDashboardOptions {
  enabled?: boolean
  refetchInterval?: number
}

// Hook for fetching dashboard statistics
export function useDashboardStats(options: UseDashboardOptions = {}) {
  const { enabled = true, refetchInterval = 60000 } = options // Auto-refresh every minute

  return useQuery({
    queryKey: queryKeys.kasir.dashboard.stats(),
    queryFn: () => kasirApi.dashboard.getStats(),
    enabled,
    refetchInterval, // Regular updates for real-time dashboard
    staleTime: 30000, // Consider stale after 30 seconds
    gcTime: 2 * 60 * 1000, // Keep in cache for 2 minutes
  })
}

// Hook with computed dashboard metrics
export function useDashboard(options: UseDashboardOptions = {}) {
  const {
    data: stats,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useDashboardStats(options)

  // Computed metrics for dashboard cards
  const metrics = {
    // Transaction metrics
    totalTransactions: stats?.transactions.total || 0,
    activeTransactions: stats?.transactions.active || 0,
    completedTransactions: stats?.transactions.completed || 0,
    completionRate: stats?.transactions.completionRate || 0,

    // Customer metrics
    totalCustomers: stats?.customers.total || 0,
    newCustomersThisMonth: stats?.customers.thisMonth || 0,
    customerGrowth: stats?.customers.growth || 0,

    // Payment metrics
    totalRevenue: stats?.payments.totalRevenue || 0,
    monthlyRevenue: stats?.payments.thisMonth || 0,
    pendingPayments: stats?.payments.pendingAmount || 0,

    // Inventory metrics
    totalProducts: stats?.inventory.totalProducts || 0,
    availableProducts: stats?.inventory.availableProducts || 0,
    rentedProducts: stats?.inventory.rentedProducts || 0,
    inventoryUtilization: (stats?.inventory.totalProducts && stats.inventory.totalProducts > 0)
      ? ((stats.inventory.rentedProducts / stats.inventory.totalProducts) * 100).toFixed(1)
      : '0',

    // Alert metrics
    overdueTransactions: stats?.alerts.overdueTransactions || 0,
    lowStockItems: stats?.alerts.lowStock || 0,
    paymentReminders: stats?.alerts.paymentReminders || 0,
    totalAlerts: (stats?.alerts.overdueTransactions || 0) + 
                 (stats?.alerts.lowStock || 0) + 
                 (stats?.alerts.paymentReminders || 0),
  }

  // Dashboard status indicators
  const status = {
    isHealthy: metrics.totalAlerts === 0,
    hasOverdueTransactions: metrics.overdueTransactions > 0,
    hasLowStock: metrics.lowStockItems > 0,
    hasPendingPayments: metrics.paymentReminders > 0,
    inventoryStatus: metrics.inventoryUtilization === '0' ? 'idle' :
                    parseFloat(metrics.inventoryUtilization) < 50 ? 'low' :
                    parseFloat(metrics.inventoryUtilization) < 80 ? 'medium' : 'high',
  }

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Format percentage for display
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  // Refresh dashboard data manually
  const refreshDashboard = () => {
    refetch()
  }

  return {
    // Raw data
    stats,
    
    // Computed metrics
    metrics,
    status,
    
    // Loading states
    isLoading: isLoading || isRefetching,
    error,
    
    // Helper functions
    formatCurrency,
    formatPercentage,
    refreshDashboard,
    
    // Additional metadata
    lastUpdated: stats ? new Date().toISOString() : null,
  }
}

// Hook for dashboard alerts with priority
export function useDashboardAlerts() {
  const { data: stats, isLoading, error } = useDashboardStats()

  const alerts = []

  if (stats?.alerts) {
    if (stats.alerts.overdueTransactions > 0) {
      alerts.push({
        id: 'overdue-transactions',
        type: 'error' as const,
        priority: 'high' as const,
        title: 'Transaksi Terlambat',
        message: `${stats.alerts.overdueTransactions} transaksi sudah melewati batas waktu`,
        count: stats.alerts.overdueTransactions,
        action: 'Lihat Transaksi',
        actionUrl: '/dashboard?status=terlambat',
      })
    }

    if (stats.alerts.lowStock > 0) {
      alerts.push({
        id: 'low-stock',
        type: 'warning' as const,
        priority: 'medium' as const,
        title: 'Stok Menipis',
        message: `${stats.alerts.lowStock} produk memiliki stok rendah`,
        count: stats.alerts.lowStock,
        action: 'Lihat Produk',
        actionUrl: '/owner/products',
      })
    }

    if (stats.alerts.paymentReminders > 0) {
      alerts.push({
        id: 'payment-reminders',
        type: 'info' as const,
        priority: 'low' as const,
        title: 'Pengingat Pembayaran',
        message: `${stats.alerts.paymentReminders} pembayaran perlu ditagih`,
        count: stats.alerts.paymentReminders,
        action: 'Lihat Pembayaran',
        actionUrl: '/dashboard?filter=pending-payment',
      })
    }
  }

  // Sort alerts by priority
  const sortedAlerts = alerts.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    return priorityOrder[b.priority] - priorityOrder[a.priority]
  })

  return {
    alerts: sortedAlerts,
    alertCount: alerts.length,
    hasHighPriorityAlerts: alerts.some(alert => alert.priority === 'high'),
    isLoading,
    error,
  }
}