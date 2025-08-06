'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
} from '@/components/ui/sidebar'
import {
  Home,
  Users,
  ShoppingCart,
  CornerDownLeft,
  CornerUpLeft,
  Boxes,
  BarChart3,
  Settings,
  LogOut,
  Menu,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const menuItems = [
  { label: 'Dashboard', href: '/kasir/dashboard', icon: Home },
  { label: 'Penyewa', href: '/kasir/renters', icon: Users },
  { label: 'Penyewaan', href: '/kasir/rentals', icon: ShoppingCart },
  { label: 'Pengambilan', href: '/kasir/pickup', icon: CornerDownLeft },
  { label: 'Pengembalian', href: '/dashboard/return', icon: CornerUpLeft },
  { label: 'Inventaris', href: '/kasir/inventory', icon: Boxes },
  { label: 'Laporan', href: '/kasir/reports', icon: BarChart3 },
  { label: 'Pengaturan', href: '/kasir/settings', icon: Settings },
]

export function SidebarKasir({ className = '' }: { className?: string }) {
  const [collapsed, setCollapsed] = useState(false)

  const handleToggle = () => setCollapsed((prev) => !prev)

  return (
    <SidebarProvider className="w-min">
      <Sidebar
        className={`bg-white border-r border-neutral-200 shadow-md transition-all duration-200 ${collapsed ? 'w-20' : 'w-64'} ${className}`}
      >
        <SidebarHeader className="flex items-center justify-between px-4 py-5 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-lime-500 to-lime-400 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-black font-bold text-lg">RB</span>
            </div>
            {!collapsed && <span className="text-xl font-bold text-neutral-900">RentalBaju</span>}
          </div>
          <button
            className="ml-2 p-2 rounded-lg hover:bg-lime-50 text-neutral-500"
            onClick={handleToggle}
            aria-label="Toggle sidebar"
            type="button"
          >
            <Menu className="h-5 w-5" />
          </button>
        </SidebarHeader>
        <SidebarContent className="py-4 px-2">
          <SidebarGroup>
            <SidebarGroupLabel
              className={`text-xs text-neutral-400 px-4 mb-2 ${collapsed ? 'hidden' : ''}`}
            >
              Menu Kasir
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-neutral-700 transition-all duration-150 hover:bg-lime-50 hover:text-black focus:outline-none focus:ring-2 focus:ring-lime-400/50 active:bg-lime-100 ${collapsed ? 'justify-center px-2' : ''}`}
                      >
                        <item.icon className="h-5 w-5 text-lime-500 group-hover:text-lime-600 transition-colors" />
                        {!collapsed && <span>{item.label}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-6 border-t border-neutral-200 flex flex-col items-center">
          <Button
            variant="outline"
            className={`w-full flex items-center justify-center gap-2 border-neutral-200 hover:border-lime-400 hover:bg-lime-50 text-neutral-900 rounded-lg font-medium ${collapsed ? 'px-0 justify-center' : ''}`}
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span>Keluar</span>}
          </Button>
          {!collapsed && (
            <p className="text-xs text-neutral-400 text-center mt-4">© 2024 RentalBaju</p>
          )}
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  )
}

export default SidebarKasir
