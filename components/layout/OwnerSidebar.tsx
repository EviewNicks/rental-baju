/**
 * Owner Sidebar Component
 * 
 * Reusable sidebar untuk owner role yang dapat diinjeksi
 * ke dalam berbagai layouts berdasarkan kondisi role
 */

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Users, BookOpen, UserCog, Wallet } from 'lucide-react'

export function OwnerSidebar() {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 shadow-sm z-40">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center space-x-3 p-6 border-b border-gray-200">
          <img 
            src="/logo.jpg" 
            alt="Erlima Mode Logo" 
            className="w-8 h-8 rounded-lg object-cover"
          />
          <span className="text-xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
            Erlima Mode
          </span>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-6">
          <div className="space-y-2">
            <Link href="/dashboard">
              <Button
                variant="ghost"
                className="w-full justify-start hover:bg-red-50 hover:text-red-700"
              >
                <Users className="mr-3 h-4 w-4" />
                Kasir
              </Button>
            </Link>

            <Link href="/dana-kasir">
              <Button
                variant="ghost"
                className="w-full justify-start hover:bg-green-50 hover:text-green-700"
              >
                <Wallet className="mr-3 h-4 w-4" />
                Dana Kasir
              </Button>
            </Link>

            <Link href="/owner/manage-kasir">
              <Button
                variant="ghost"
                className="w-full justify-start hover:bg-red-50 hover:text-red-700"
              >
                <UserCog className="mr-3 h-4 w-4" />
                Manage Kasir
              </Button>
            </Link>

            <Link href="/producer/manage-product">
              <Button
                variant="ghost"
                className="w-full justify-start hover:bg-red-50 hover:text-red-700"
              >
                <BookOpen className="mr-3 h-4 w-4" />
                Manage Product
              </Button>
            </Link>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">Erlima Mode v2.0</p>
          <p className="text-xs text-gray-400 text-center mt-1">© 2024 Erlima Mode</p>
        </div>
      </div>
    </aside>
  )
}