'use client'

/**
 * User Layout
 *
 * Layout khusus untuk user role yang menyediakan:
 * - Role-specific navigation
 * - User-focused sidebar
 * - Consistent styling untuk user pages
 * - Conditional owner sidebar untuk owner role
 */

import { UserRoleProvider } from '@/features/auth'
import { useUserRole } from '@/features/auth'
import { OwnerSidebar } from '@/components/layout/OwnerSidebar'
// import { SidebarKasir } from '@/components/sidebarKasir'
// import { DashboardHeader } from '@/features/rentals-manage/components/DashboardHeader'

interface KasirLayoutProps {
  children: React.ReactNode
}

function KasirLayoutContent({ children }: { children: React.ReactNode }) {
  const { role } = useUserRole()

  // Jika user adalah owner, tampilkan dengan owner sidebar
  if (role === 'owner') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50">
        <OwnerSidebar />
        <main className="ml-64 min-h-screen bg-neutral-100">
          <div className="flex-1 flex flex-col min-h-screen">{children}</div>
        </main>
      </div>
    )
  }

  // Layout normal untuk kasir/roles lain
  return (
    <main className="min-h-screen flex bg-neutral-100">
      {/* <DashboardHeader /> */}
      <div className="flex-1 flex flex-col min-h-screen">{children}</div>
    </main>
  )
}

export default function KasirLayout({ children }: KasirLayoutProps) {
  return (
    <UserRoleProvider>
      <KasirLayoutContent>{children}</KasirLayoutContent>
    </UserRoleProvider>
  )
}
