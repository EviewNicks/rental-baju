import { TransactionFormPage } from '@/features/kasir/components/form/TransactionFormPage'
import { logger } from '@/lib/client-logger'

export default function NewTransactionPage() {
  // 🔍 LOG: Transaction page initialization
  logger.info('New transaction page loaded', {
    timestamp: new Date().toISOString(),
    page: '/dashboard/new',
    action: 'PAGE_LOAD'
  }, 'NewTransactionPage')

  return <TransactionFormPage />
}
