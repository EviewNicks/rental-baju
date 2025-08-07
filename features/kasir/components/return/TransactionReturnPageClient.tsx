'use client'

import { useRouter } from 'next/navigation'
import { ReturnProcessPage } from '@/features/kasir/components/return'

interface TransactionReturnPageClientProps {
  kode: string
}

export function TransactionReturnPageClient({ kode }: TransactionReturnPageClientProps) {
  const router = useRouter()

  const handleClose = () => {
    // Navigate back to specific transaction detail
    router.push(`/dashboard/transaction/${kode}`)
  }

  return (
    <ReturnProcessPage
      onClose={handleClose}
      initialTransactionId={kode}
    />
  )
}