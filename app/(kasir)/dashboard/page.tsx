import { TransactionsDashboard } from '@/features/kasir/components/dashboard/TransactionsDashoard'
import ErrorBoundary, { ApiErrorFallback } from '@/features/kasir/components/ui/error-boundary'

export default function HomePage() {
  return (
    <ErrorBoundary fallback={ApiErrorFallback}>
      <TransactionsDashboard />
    </ErrorBoundary>
  )
}
