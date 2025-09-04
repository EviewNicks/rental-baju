'use client'

/**
 * Creator Layout
 *
 * Layout khusus untuk creator role yang menyediakan:
 * - Creator-specific navigation
 * - Content creation tools
 * - Creator-focused sidebar
 * - Conditional owner sidebar untuk owner role
 */

import React from 'react'
import { UserRoleProvider } from '@/features/auth'
import { useUserRole } from '@/features/auth'
import { OwnerSidebar } from '@/components/layout/OwnerSidebar'
// import { ProducerSidebar } from '@/features/manage-product/components/layout/ProducerSidebar'

function ProducerLayoutContent({ children }: { children: React.ReactNode }) {
  const { role } = useUserRole()

  // Jika user adalah owner, tampilkan dengan owner sidebar
  if (role === 'owner') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50">
        <OwnerSidebar />
        <main className="ml-64 overflow-auto">{children}</main>
      </div>
    )
  }

  // Layout normal untuk producer/roles lain
  return (
    <div className="flex h-screen bg-gray-50">
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}

export default function ProducerLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserRoleProvider>
      <ProducerLayoutContent>{children}</ProducerLayoutContent>
    </UserRoleProvider>
  )
}
