'use client'

import { useParams } from 'next/navigation'
import { ProductEditPageWrapper } from '@/features/manage-product/components/form-product/ProductEditPageWrapper'

export default function EditProductPage() {
  const params = useParams()
  const productId = String(params.id)

  return <ProductEditPageWrapper productId={productId} />
}
