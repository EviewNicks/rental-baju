import { TransactionDetailPage } from '@/features/kasir/components/detail/TransactionDetailPage'

interface TransactionDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function TransactionDetail({ params }: TransactionDetailPageProps) {
  const { id } = await params
  return <TransactionDetailPage transactionId={id} />
}
