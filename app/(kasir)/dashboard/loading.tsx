import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <Skeleton className="w-32 h-8" />
              </div>
              <div className="hidden sm:block">
                <Skeleton className="w-48 h-6" />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Skeleton className="w-10 h-10 rounded-full" />
              <Skeleton className="w-10 h-10 rounded-full" />
              <Skeleton className="w-32 h-10 rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs Skeleton */}
        <div className="bg-white rounded-xl shadow-md border border-neutral-200 p-2">
          <div className="flex space-x-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-32 rounded-xl" />
            ))}
          </div>
        </div>

        <div className="mt-8 space-y-6">
          {/* Search Actions Bar Skeleton */}
          <div className="bg-white rounded-xl shadow-md border border-neutral-200 p-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <Skeleton className="h-12 w-full max-w-md" />
              <div className="flex items-center space-x-3">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-40" />
              </div>
            </div>
          </div>

          {/* Table Skeleton */}
          <div className="bg-white rounded-xl shadow-md border border-neutral-200 overflow-hidden">
            <div className="p-6 space-y-4">
              {/* Header skeleton */}
              <div className="flex items-center space-x-4 pb-4 border-b border-neutral-200">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-4 w-20" />
                ))}
              </div>
              {/* Row skeletons */}
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-4 py-4">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-28" />
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          </div>

          {/* Pagination Skeleton */}
          <div className="bg-white rounded-xl shadow-md border border-neutral-200 px-6 py-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <Skeleton className="h-6 w-64" />
              <div className="flex items-center space-x-2">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-10" />
                <Skeleton className="h-10 w-10" />
                <Skeleton className="h-10 w-10" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
