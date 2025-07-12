/**
 * User Layout
 *
 * Layout khusus untuk user role yang menyediakan:
 * - Role-specific navigation
 * - User-focused sidebar
 * - Consistent styling untuk user pages
 */

import React from 'react'
import { UserRoleProvider } from '@/features/auth'
import { BookOpen, User, Award, Settings, Home } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface UserLayoutProps {
  children: React.ReactNode
}

export default function UserLayout({ children }: UserLayoutProps) {
  return (
    <UserRoleProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Sidebar Navigation */}
        <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 shadow-sm z-40">
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center space-x-3 p-6 border-b border-gray-200">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Maguru
              </span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                Learner
              </span>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 p-6">
              <div className="space-y-2">
                <Link href="/user/dashboard">
                  <Button
                    variant="ghost"
                    className="w-full justify-start hover:bg-blue-50 hover:text-blue-700"
                  >
                    <Home className="mr-3 h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>

                <Link href="/user/courses">
                  <Button
                    variant="ghost"
                    className="w-full justify-start hover:bg-blue-50 hover:text-blue-700"
                  >
                    <BookOpen className="mr-3 h-4 w-4" />
                    Kursus Saya
                  </Button>
                </Link>

                <Link href="/user/certificates">
                  <Button
                    variant="ghost"
                    className="w-full justify-start hover:bg-blue-50 hover:text-blue-700"
                  >
                    <Award className="mr-3 h-4 w-4" />
                    Sertifikat
                  </Button>
                </Link>

                <Link href="/user/profile">
                  <Button
                    variant="ghost"
                    className="w-full justify-start hover:bg-blue-50 hover:text-blue-700"
                  >
                    <User className="mr-3 h-4 w-4" />
                    Profil
                  </Button>
                </Link>

                <Link href="/user/settings">
                  <Button
                    variant="ghost"
                    className="w-full justify-start hover:bg-blue-50 hover:text-blue-700"
                  >
                    <Settings className="mr-3 h-4 w-4" />
                    Pengaturan
                  </Button>
                </Link>
              </div>

              {/* Quick Stats */}
              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-900 mb-3">Progress Anda</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Kursus Aktif</span>
                    <span className="font-semibold text-blue-900">3</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Selesai</span>
                    <span className="font-semibold text-blue-900">2</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                  <p className="text-xs text-blue-600 text-center mt-1">60% Progress</p>
                </div>
              </div>
            </nav>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">© 2024 Maguru Learning Platform</p>
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
