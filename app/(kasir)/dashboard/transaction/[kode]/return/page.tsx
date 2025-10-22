import { SimpleReturnForm } from '@/features/kasir/components/return/SimpleReturnForm'

interface TransactionReturnSimplePageProps {
  params: Promise<{
    kode: string
  }>
}

export default async function TransactionReturnSimplePage({
  params,
}: TransactionReturnSimplePageProps) {
  const { kode } = await params

  return <SimpleReturnForm kode={kode} />
}
