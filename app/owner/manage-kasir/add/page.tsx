'use client'

import { KasirFormPage } from '@/features/kasir/components/management/KasirFormPage'

const breadcrumbItems = [
  { label: 'Dashboard', href: '/owner' },
  { label: 'Manajemen Kasir', href: '/owner/manage-kasir' },
  { label: 'Tambah Kasir', current: true },
]

export default function AddKasirPage() {
  return (
    <KasirFormPage
      mode="add"
      breadcrumbItems={breadcrumbItems}
      title="Tambah Kasir Baru"
      subtitle="Lengkapi informasi kasir untuk menambah ke sistem"
    />
  )
}