/**
 * User Layout
 *
 * Layout khusus untuk user role yang menyediakan:
 * - Role-specific navigation
 * - User-focused sidebar
 * - Consistent styling untuk user pages
 */

import { UserRoleProvider } from '@/features/auth'
import { SidebarKasir } from '@/components/sidebarKasir'

interface KasirLayoutProps {
  children: React.ReactNode
}

export default function KasirLayout({ children }: KasirLayoutProps) {
  return (
    <UserRoleProvider>
      <div className="min-h-screen flex bg-neutral-100">
        <SidebarKasir />
        <main className="flex-1 ml-64 transition-all duration-200">{children}</main>
      </div>
    </UserRoleProvider>
  )
}
