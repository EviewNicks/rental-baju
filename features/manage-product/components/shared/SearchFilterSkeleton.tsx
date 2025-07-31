'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function SearchFilterSkeleton() {
  return (
    <Card className="mb-6 shadow-md border-0 bg-card">
      <CardContent className="px-6 py-2">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Search Input Skeleton */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          </div>

          {/* Filter Controls Skeleton */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Filter Icon + Category Select */}
            <div className="flex items-center gap-2">
              <Skeleton className="w-4 h-4 rounded" />
              <Skeleton className="h-9 w-32 rounded-md" />
            </div>

            {/* Status Select */}
            <Skeleton className="h-9 w-32 rounded-md" />

            {/* View Toggle */}
            <div className="flex border rounded-md">
              <Skeleton className="h-9 w-9 rounded-l-md border-r" />
              <Skeleton className="h-9 w-9 rounded-r-md" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Alternative compact version
export function SearchFilterSkeletonCompact() {
  return (
    <Card className="mb-6 shadow-md border-0 bg-card">
      <CardContent className="px-6 py-2">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 flex-1 max-w-md rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-16 rounded-md" />
        </div>
      </CardContent>
    </Card>
  )
}

// Pulse animation variant
export function SearchFilterSkeletonPulse() {
  return (
    <Card className="mb-6 shadow-md border-0 bg-card animate-pulse">
      <CardContent className="px-6 py-2">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="h-9 bg-gray-200 rounded-md"></div>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <div className="h-9 w-32 bg-gray-200 rounded-md"></div>
            </div>
            <div className="h-9 w-32 bg-gray-200 rounded-md"></div>
            <div className="flex border rounded-md">
              <div className="h-9 w-9 bg-gray-200 rounded-l-md border-r"></div>
              <div className="h-9 w-9 bg-gray-200 rounded-r-md"></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}