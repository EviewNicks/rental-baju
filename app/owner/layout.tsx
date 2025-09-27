/**
 * Admin Layout
 *
 * Layout khusus untuk admin role yang menyediakan:
 * - Admin-specific navigation
 * - System monitoring tools
 * - Administrative sidebar
 */

import React from 'react'
import { UserRoleProvider } from '@/features/auth'
import { OwnerSidebar } from '@/components/layout/OwnerSidebar'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <UserRoleProvider>
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50">
        <OwnerSidebar />
        <main className="ml-64">{children}</main>
        
        {/* Mobile overlay (hidden on desktop) */}
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30 hidden"
          id="sidebar-overlay"
        ></div>
      </div>
    </UserRoleProvider>
  )
}
