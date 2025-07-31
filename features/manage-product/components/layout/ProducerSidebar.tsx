'use client'

import type React from 'react'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Package,
  BarChart3,
  Settings,
  Users,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Home,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SidebarItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  badge?: string
  children?: SidebarItem[]
}

const sidebarItems: SidebarItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    href: '/producer',
  },
  {
    id: 'products',
    label: 'Manajemen Produk',
    icon: Package,
    href: '/producer/manage-product',
    // children: [
    //   {
    //     id: 'product-list',
    //     label: 'Daftar Produk',
    //     icon: Package,
    //     href: '/producer/manage-product',
    //   },
    //   {
    //     id: 'add-product',
    //     label: 'Tambah Produk',
    //     icon: Plus,
    //     href: '/producer/manage-product/add',
    //   },
    // ],
  },
  {
    id: 'orders',
    label: 'Pesanan',
    icon: Calendar,
    href: '/producer/orders',
    badge: '3',
  },
  {
    id: 'analytics',
    label: 'Analitik',
    icon: BarChart3,
    href: '/producer/analytics',
  },
  {
    id: 'customers',
    label: 'Pelanggan',
    icon: Users,
    href: '/producer/customers',
  },
  {
    id: 'settings',
    label: 'Pengaturan',
    icon: Settings,
    href: '/producer/settings',
  },
]

export function ProducerSidebar() {
  const pathname = usePathname()
  const [isExpanded, setIsExpanded] = useState(true)
  const [expandedItems, setExpandedItems] = useState<string[]>(['products'])

  const toggleSidebar = () => setIsExpanded(!isExpanded)

  const toggleItem = (itemId: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId],
    )
  }

  const isActive = (href: string) => {
    if (href === '/producer') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <div
      className={cn(
        'bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col',
        isExpanded ? 'w-64' : 'w-16',
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {isExpanded && (
            <div>
              <h2 className="text-lg font-bold text-gray-900">RentalBaju</h2>
              <p className="text-sm text-gray-500">Producer Panel</p>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={toggleSidebar} className="p-2">
            {isExpanded ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {sidebarItems.map((item) => (
          <div key={item.id}>
            <Link href={item.href}>
              <Button
                variant={isActive(item.href) ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start',
                  !isExpanded && 'justify-center px-2',
                  isActive(item.href) && 'bg-yellow-50 text-yellow-700 border-yellow-200',
                )}
                onClick={() => {
                  if (item.children) {
                    toggleItem(item.id)
                  }
                }}
              >
                <item.icon className={cn('w-4 h-4', isExpanded && 'mr-3')} />
                {isExpanded && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span className="bg-yellow-400 text-black text-xs px-2 py-1 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Button>
            </Link>

            {/* Submenu */}
            {item.children && isExpanded && expandedItems.includes(item.id) && (
              <div className="ml-4 mt-2 space-y-1">
                {item.children.map((child) => (
                  <Link key={child.id} href={child.href}>
                    <Button
                      variant={isActive(child.href) ? 'secondary' : 'ghost'}
                      size="sm"
                      className={cn(
                        'w-full justify-start',
                        isActive(child.href) && 'bg-yellow-50 text-yellow-700',
                      )}
                    >
                      <child.icon className="w-3 h-3 mr-2" />
                      {child.label}
                    </Button>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-black">A</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Admin User</p>
              <p className="text-xs text-gray-500">admin@rentalbaju.com</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
