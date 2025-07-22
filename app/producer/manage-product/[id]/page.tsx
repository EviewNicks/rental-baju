'use client'

import { useParams } from 'next/navigation'
import { ProductDetailPage } from '@/features/manage-product/components/product-detail/ProductDetailPage'

export default function ProductDetailPageRoute() {
  const params = useParams()
  const productId = params.id as string

  return <ProductDetailPage productId={productId} />
}
