import { TransactionDetailPage } from '@/features/kasir/components/detail/TransactionDetailPage'

interface TransactionDetailPageProps {
  params: Promise<{
    kode: string
  }>
}

export default async function TransactionDetail({ params }: TransactionDetailPageProps) {
  const { kode } = await params
  return <TransactionDetailPage transactionId={kode} />
}