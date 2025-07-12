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
import { Shield, Users, Settings, BarChart3, Database, AlertTriangle, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <UserRoleProvider>
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50">
        {/* Sidebar Navigation */}
        <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 shadow-sm z-40">
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center space-x-3 p-6 border-b border-gray-200">
              <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-pink-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                Maguru
              </span>
              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
                Admin
              </span>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 p-6">
              <div className="space-y-2">
                <Link href="/admin/dashboard">
                  <Button
                    variant="ghost"
                    className="w-full justify-start hover:bg-red-50 hover:text-red-700"
                  >
                    <Shield className="mr-3 h-4 w-4" />
                    Control Panel
                  </Button>
                </Link>

                <Link href="/admin/users">
                  <Button
                    variant="ghost"
                    className="w-full justify-start hover:bg-red-50 hover:text-red-700"
                  >
                    <Users className="mr-3 h-4 w-4" />
                    User Management
                  </Button>
                </Link>

                <Link href="/admin/content">
                  <Button
                    variant="ghost"
                    className="w-full justify-start hover:bg-red-50 hover:text-red-700"
                  >
                    <Database className="mr-3 h-4 w-4" />
                    Content Review
                  </Button>
                </Link>

                <Link href="/admin/analytics">
                  <Button
                    variant="ghost"
                    className="w-full justify-start hover:bg-red-50 hover:text-red-700"
                  >
                    <BarChart3 className="mr-3 h-4 w-4" />
                    Analytics
                  </Button>
                </Link>

                <Link href="/admin/settings">
                  <Button
                    variant="ghost"
                    className="w-full justify-start hover:bg-red-50 hover:text-red-700"
                  >
                    <Settings className="mr-3 h-4 w-4" />
                    System Settings
                  </Button>
                </Link>
              </div>

              {/* System Status */}
              <div className="mt-8 p-4 bg-red-50 rounded-lg">
                <h3 className="text-sm font-semibold text-red-900 mb-3">System Status</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-red-700">Server Health</span>
                    <span className="font-semibold text-green-600">98%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-red-700">Active Users</span>
                    <span className="font-semibold text-red-900">2,486</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-red-700">Alerts</span>
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      <span className="font-semibold text-amber-600">2</span>
                    </div>
                  </div>
                  <div className="w-full bg-red-200 rounded-full h-2 mt-2">
                    <div className="bg-red-600 h-2 rounded-full" style={{ width: '98%' }}></div>
                  </div>
                  <p className="text-xs text-red-600 text-center mt-1">System Operational</p>
                </div>
              </div>
            </nav>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">Admin Panel v2.0</p>
              <p className="text-xs text-gray-400 text-center mt-1">© 2024 Maguru</p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
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
