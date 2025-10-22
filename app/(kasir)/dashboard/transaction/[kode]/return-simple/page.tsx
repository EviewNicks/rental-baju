import { SimpleReturnForm } from '@/features/kasir/components/return/SimpleReturnForm'
// import { ReturnProcessPage } from '@/features/kasir/components/return/ReturnProcessPage' // Legacy 3-step component

interface TransactionReturnPageProps {
  params: Promise<{
    kode: string
  }>
}

export default async function TransactionReturnPage({ params }: TransactionReturnPageProps) {
  const { kode } = await params

  // Using simplified One-Page Form (NEW)
  return <SimpleReturnForm kode={kode} />

  // Using legacy 3-step workflow (OLD - comment out if using new)
  // return <ReturnProcessPage kode={kode} />
}
