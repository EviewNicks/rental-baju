/**
 * User Layout
 *
 * Layout khusus untuk user role yang menyediakan:
 * - Role-specific navigation
 * - User-focused sidebar
 * - Consistent styling untuk user pages
 */

import { UserRoleProvider } from '@/features/auth'
// import { SidebarKasir } from '@/components/sidebarKasir'
// import { DashboardHeader } from '@/features/rentals-manage/components/DashboardHeader'

interface KasirLayoutProps {
  children: React.ReactNode
}

export default function KasirLayout({ children }: KasirLayoutProps) {
  return (
    <UserRoleProvider>
      <div className="min-h-screen flex bg-neutral-100">
        {/* <DashboardHeader /> */}
        <div className="flex-1 flex flex-col min-h-screen">{children}</div>
      </div>
    </UserRoleProvider>
  )
}
