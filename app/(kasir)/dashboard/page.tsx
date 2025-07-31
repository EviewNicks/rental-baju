import { TransactionsDashboard } from '@/features/kasir/components/dashboard/TransactionsDashoard'
import ErrorBoundary, { ApiErrorFallback } from '@/features/kasir/components/ui/error-boundary'

export default function HomePage() {
  return (
    <div data-testid="kasir-dashboard-page">
      <ErrorBoundary fallback={ApiErrorFallback}>
        <TransactionsDashboard />
      </ErrorBoundary>
    </div>
  )
}
