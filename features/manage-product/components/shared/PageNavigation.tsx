'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'

interface PageNavigationProps {
  currentPage: string
  parentPath?: string
  parentLabel?: string
  showBackButton?: boolean
  className?: string
}

export function PageNavigation({ 
  currentPage, 
  parentPath = '/producer/manage-product',
  parentLabel = 'Kelola Produk',
  showBackButton = true,
  className = '' 
}: PageNavigationProps) {
  const router = useRouter()

  const handleBackClick = () => {
    if (parentPath) {
      router.push(parentPath)
    } else {
      router.back()
    }
  }

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${className}`}>
      {/* Breadcrumb Navigation */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link 
                href={parentPath}
                className="text-sm hover:text-primary transition-colors"
                aria-label={`Kembali ke ${parentLabel}`}
              >
                {parentLabel}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-sm font-medium">
              {currentPage}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Back Button - Visible on mobile/as alternative */}
      {showBackButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleBackClick}
          className="flex items-center gap-2 text-sm sm:ml-auto w-fit"
          aria-label={`Kembali ke ${parentLabel}`}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Kembali</span>
        </Button>
      )}
    </div>
  )
}