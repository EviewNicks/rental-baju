'use client'

/**
 * Unauthorized Access Page
 *
 * Halaman yang ditampilkan ketika user mencoba mengakses
 * rute yang memerlukan role lebih tinggi dari yang dimiliki
 */

import React, { Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ShieldX, ArrowLeft, MessageCircle, Home } from 'lucide-react'
import { useUserRole } from '@/features/auth'

function UnauthorizedContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { role, isLoading } = useUserRole()

  // Get the attempted path from search params
  const attemptedPath = searchParams.get('from') || 'halaman yang diminta'

  /**
   * Handle going back to previous page
   */
  const handleGoBack = () => {
    // Try to go back, fallback to dashboard
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/dashboard')
    }
  }

  /**
   * Get role-specific message
   */
  const getRoleMessage = () => {
    if (isLoading) return 'Memuat informasi akun...'

    switch (role) {
      case 'admin':
        return 'Sebagai admin, Anda seharusnya memiliki akses ke semua area. Ini mungkin bug sistem.'
      case 'creator':
        return 'Sebagai creator, Anda memiliki akses ke area konten. Halaman ini mungkin khusus untuk admin.'
      case 'user':
        return 'Sebagai user, Anda memiliki akses terbatas. Halaman ini memerlukan role yang lebih tinggi.'
      default:
        return 'Anda perlu masuk terlebih dahulu untuk mengakses halaman ini.'
    }
  }

  /**
   * Get suggested actions based on role
   */
  const getSuggestedActions = () => {
    if (isLoading) return []

    const actions = []

    if (!role) {
      actions.push({
        label: 'Masuk ke Akun',
        href: '/sign-in',
        variant: 'default' as const,
        icon: <Home className="w-4 h-4" />,
      })
    } else {
      actions.push({
        label: 'Kembali ke Dashboard',
        href: '/dashboard',
        variant: 'default' as const,
        icon: <Home className="w-4 h-4" />,
      })

      if (role === 'user') {
        actions.push({
          label: 'Hubungi Admin',
          href: 'mailto:admin@maguru.com?subject=Request%20Access&body=Saya%20memerlukan%20akses%20ke%20halaman%20tertentu.',
          variant: 'outline' as const,
          icon: <MessageCircle className="w-4 h-4" />,
        })
      }
    }

    return actions
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Error Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
            <ShieldX className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Akses Ditolak</h1>
          <p className="text-gray-600">Anda tidak memiliki izin untuk mengakses {attemptedPath}</p>
        </div>

        {/* Role-specific message */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-2">Informasi Akun</h2>
          <p className="text-gray-600 text-sm leading-relaxed">{getRoleMessage()}</p>

          {role && (
            <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              Role saat ini: <span className="ml-1 capitalize font-semibold">{role}</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          {getSuggestedActions().map((action, index) => (
            <Button key={index} asChild variant={action.variant} className="w-full justify-center">
              <Link href={action.href} className="flex items-center gap-2">
                {action.icon}
                {action.label}
              </Link>
            </Button>
          ))}

          {/* Go back button */}
          <Button variant="ghost" onClick={handleGoBack} className="w-full justify-center">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Halaman Sebelumnya
          </Button>
        </div>

        {/* Help text */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Jika Anda yakin ini adalah kesalahan, silakan hubungi administrator sistem.
          </p>
        </div>

        {/* Development info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">🔧 Development Info</h3>
            <div className="text-xs text-yellow-700 space-y-1">
              <p>
                <strong>Attempted Path:</strong> {attemptedPath}
              </p>
              <p>
                <strong>Current Role:</strong> {role || 'None'}
              </p>
              <p>
                <strong>User ID:</strong> {/* You can add user ID here if needed */}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mb-4 mx-auto"></div>
          <div className="h-4 w-32 bg-gray-200 rounded mx-auto"></div>
        </div>
      </div>
    </div>
  )
}

export default function UnauthorizedPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <UnauthorizedContent />
    </Suspense>
  )
}
