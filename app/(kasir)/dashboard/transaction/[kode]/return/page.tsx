import { TransactionReturnPageClient } from '@/features/kasir/components/return/TransactionReturnPageClient'

interface TransactionReturnPageProps {
  params: Promise<{
    kode: string
  }>
}

export default async function TransactionReturnPage({ params }: TransactionReturnPageProps) {
  const { kode } = await params

  return <TransactionReturnPageClient kode={kode} />
}
