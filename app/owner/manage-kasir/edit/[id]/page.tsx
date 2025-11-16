'use client'

import { KasirFormPage } from '@/features/kasir/components/management/KasirFormPage'

const breadcrumbItems = [
  { label: 'Dashboard', href: '/owner' },
  { label: 'Manajemen Kasir', href: '/owner/manage-kasir' },
  { label: 'Edit Kasir', current: true },
]

export default function EditKasirPage({ params }: { params: { id: string } }) {
  return (
    <KasirFormPage
      mode="edit"
      breadcrumbItems={breadcrumbItems}
      title="Edit Kasir"
      subtitle="Perbarui informasi kasir"
      kasirId={params.id}
    />
  )
}