import { Bell, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DashboardHeaderProps {
  isLoading?: boolean
}

export function DashboardHeader({ isLoading = false }: DashboardHeaderProps) {
  if (isLoading) {
    return (
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Judul Skeleton */}
            <div className="flex-1">
              <div className="w-48 h-8 bg-neutral-100 rounded-lg animate-pulse" />
            </div>
            {/* User Actions Skeleton */}
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-neutral-100 animate-pulse" />
              <div className="w-10 h-10 rounded-full bg-neutral-100 animate-pulse" />
              <div className="w-32 h-10 rounded-lg bg-neutral-100 animate-pulse" />
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-50 shadow-md">
      <div className="w-full flex justify-center">
        <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex justify-between items-center h-20">
          {/* Judul Halaman */}
          <div className="flex-1">
            <span className="text-2xl font-bold text-neutral-900">Manajemen Penyewa</span>
          </div>
          {/* User Actions */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="relative text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-full"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-lime-500 rounded-full"></span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-full"
            >
              <User className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              className="border-neutral-200 hover:border-lime-400 hover:bg-lime-50 text-neutral-900 rounded-lg font-medium"
            >
              Keluar
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
