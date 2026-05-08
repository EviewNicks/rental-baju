'use client'

import { useSearchParams, redirect } from 'next/navigation'
import { ProductHistoryPage } from '@/features/kasir/components/ui/ProductHistoryPage'

export function ProductHistoryPageWrapper() {
  const searchParams = useSearchParams()
  const productSizeId = searchParams.get('productSizeId')
  const productName = searchParams.get('productName')
  const size = searchParams.get('size')
  const ageCategory = searchParams.get('ageCategory')

  // Validation - redirect to dashboard if required params are missing
  if (!productSizeId || !productName || !size || !ageCategory) {
    console.warn('[ProductHistoryPageWrapper] Missing required params, redirecting to dashboard')
    redirect('/dashboard')
  }

  return (
    <ProductHistoryPage
      productSizeId={productSizeId}
      productName={productName}
      size={size}
      ageCategory={ageCategory}
    />
  )
}
