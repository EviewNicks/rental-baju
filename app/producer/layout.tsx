/**
 * Creator Layout
 *
 * Layout khusus untuk creator role yang menyediakan:
 * - Creator-specific navigation
 * - Content creation tools
 * - Creator-focused sidebar
 */

import React from 'react'
import { UserRoleProvider } from '@/features/auth'
import { ProducerSidebar } from '@/features/manage-product/components/layout/ProducerSidebar'

export default function ProducerLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserRoleProvider>
      <div className="flex h-screen bg-gray-50">
        <ProducerSidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </UserRoleProvider>
  )
}
