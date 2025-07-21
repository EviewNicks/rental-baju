'use client'

import { ProductFormPage } from '@/features/manage-product/components/form-product/ProductFormPage'

const breadcrumbItems = [
  { label: 'Dashboard', href: '/producer' },
  { label: 'Manajemen Produk', href: '/producer/manage-product' },
  { label: 'Tambah Produk', current: true },
]

export default function AddProductPage() {
  return (
    <ProductFormPage
      mode="add"
      breadcrumbItems={breadcrumbItems}
      title="Tambah Produk Baru"
      subtitle="Lengkapi informasi produk untuk menambah ke inventaris"
    />
  )
}
