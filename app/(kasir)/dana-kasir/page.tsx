'use client'

/**
 * Dana Kasir Dashboard Page
 * 
 * Main dashboard for Dana Kasir Management feature
 * Displays daily income, expenses, and net balance
 * 
 * Features:
 * - Date navigation for historical data
 * - Summary cards (income, expense, net balance)
 * - Income list from rental transactions
 * - Expense list with CRUD operations (Kasir only)
 * - CSV export (Owner only)
 * - Role-based rendering (Kasir vs Owner)
 * 
 * Requirements: 6.1, 6.3, 7.1, 7.2
 */

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useUserRole } from '@/features/auth'
import ErrorBoundary, { ApiErrorFallback } from '@/features/kasir/components/ui/error-boundary'
import { DanaKasirDashboard } from '@/features/dana-kasir/components/DanaKasirDashboard'
import { DanaKasirSkeleton } from '@/features/dana-kasir/components/DanaKasirSkeleton'
import { getCurrentWITADate, parseWITADate } from '@/features/dana-kasir/utils/timezone'

/**
 * Dashboard content component with search params
 */
function DashboardContent() {
  const searchParams = useSearchParams()
  const { role, isLoading: roleLoading } = useUserRole()
  
  // Get date from URL or default to today in WITA timezone
  const dateParam = searchParams.get('date')
  const selectedDate = dateParam ? parseWITADate(dateParam) : getCurrentWITADate()

  // Show loading state while checking role
  if (roleLoading) {
    return <DanaKasirSkeleton />
  }

  // Check if user has access (Kasir or Owner)
  const hasAccess = role === 'kasir' || role === 'owner' || role === 'producer'
  
  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Akses Ditolak
          </h2>
          <p className="text-gray-600">
            Anda tidak memiliki akses ke halaman ini.
          </p>
        </div>
      </div>
    )
  }

  return (
    <DanaKasirDashboard 
      initialDate={selectedDate}
      userRole={role === 'producer' ? 'owner' : role as 'kasir' | 'owner'}
    />
  )
}

/**
 * Main page component with error boundary
 */
export default function DanaKasirPage() {
  return (
    <div 
      data-testid="dana-kasir-page"
      className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
    >
      <ErrorBoundary fallback={ApiErrorFallback}>
        <Suspense fallback={<DanaKasirSkeleton />}>
          <DashboardContent />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
