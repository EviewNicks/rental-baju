import { ReturnProcessPage } from '@/features/kasir/components/return/ReturnProcessPage'

interface TransactionReturnPageProps {
  params: Promise<{
    kode: string
  }>
}

export default async function TransactionReturnPage({ params }: TransactionReturnPageProps) {
  const { kode } = await params

  return <ReturnProcessPage kode={kode} />
}
