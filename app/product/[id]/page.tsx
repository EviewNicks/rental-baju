'use client'

import { useParams } from 'next/navigation'
import { PublicProductDetailPage } from '@/features/homepage/components/ProductDetailPage'

export default function ProductDetailPageRoute() {
  const params = useParams()
  const productId = params.id as string

  return <PublicProductDetailPage productId={productId} />
}