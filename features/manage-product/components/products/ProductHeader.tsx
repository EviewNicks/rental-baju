'use client'

import { Plus, Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AuthenticationControls } from '@/features/auth/components/AuthenticationControls'
import Image from 'next/image'

interface ProductHeaderProps {
  onAddProduct: () => void
}

export function ProductHeader({ onAddProduct }: ProductHeaderProps) {
  const router = useRouter()

  return (
    <>
      {/* Top Tier: Authentication Navigation */}
      <div
        className="bg-white/95 backdrop-blur-sm border-b border-neutral-100"
        data-testid="product-auth-nav"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12">
            {/* Brand/Logo */}
            <Link href="/" className="flex items-center space-x-2 group" data-testid="brand-link">
              <Image
                src="/logo.jpg"
                alt="Erlima Mode Logo"
                width={32}
                height={32}
                className="rounded-lg object-cover transition-transform duration-200 group-hover:scale-105"
              />
              <span className="text-xl font-bold text-neutral-900 transition-colors duration-200 group-hover:text-gold-500">
                Erlima Mode
              </span>
            </Link>

            {/* Authentication Controls */}
            <div className="hidden md:flex">
              <AuthenticationControls showDashboardLink={true} showLogo={false} />
            </div>

            {/* Mobile Authentication Menu */}
            <div className="md:hidden">
              <AuthenticationControls
                showDashboardLink={true}
                showLogo={false}
                className="space-x-2"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Tier: Page Content Header */}
      <div className="bg-white border-b border-gray-200" data-testid="product-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div data-testid="product-header-title-section">
              <h1 className="text-3xl font-bold text-gray-900" data-testid="product-header-title">
                Manajemen Produk
              </h1>
              <p className="text-gray-600 mt-1" data-testid="product-header-subtitle">
                Kelola inventaris produk rental pakaian Anda
              </p>
            </div>
            <div className="flex gap-3" data-testid="product-header-actions">
              <Button
                variant="outline"
                className="flex items-center gap-2 bg-transparent"
                onClick={() => router.push('/producer/manage-product/materials')}
                data-testid="manage-data-master-button"
              >
                <Settings className="w-4 h-4" />
                Kelola Data Master
              </Button>
              <Button
                className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black"
                onClick={onAddProduct}
                data-testid="add-product-button"
              >
                <Plus className="w-4 h-4" />
                Tambah Produk
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
