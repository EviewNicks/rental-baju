'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SignOutButton, UserButton } from '@clerk/nextjs'
import { useUserRole } from '@/features/auth'
import { useRoleNavigation } from '@/features/auth/hooks/useUserRole'

interface AuthenticationControlsProps {
  showDashboardLink?: boolean
  showLogo?: boolean
  className?: string
}

export function AuthenticationControls({ 
  showDashboardLink = true,
  showLogo = false,
  className = "" 
}: AuthenticationControlsProps) {
  const { role } = useUserRole()
  const { getDashboardUrl } = useRoleNavigation()

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      {/* Logo/Brand (optional) */}
      {showLogo && (
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="w-8 h-8 bg-gradient-to-br from-gold-500 to-gold-600 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
            <span className="text-white font-bold text-sm">R</span>
          </div>
          <span className="text-xl font-bold text-neutral-900 transition-colors duration-200 group-hover:text-gold-500">
            RentalBaju
          </span>
        </Link>
      )}

      {/* Dashboard Link with Role Badge */}
      {showDashboardLink && (
        <Link href={getDashboardUrl()} data-testid="auth-dashboard-link">
          <Button variant="ghost" className="text-sm text-neutral-700 hover:text-gold-500">
            Dashboard
            {role && (
              <span
                className={`ml-2 text-xs px-2 py-1 rounded-full ${
                  role === 'owner'
                    ? 'bg-red-100 text-red-600'
                    : role === 'producer'
                      ? 'bg-gold-100 text-gold-600'
                      : 'bg-gold-50 text-gold-700'
                }`}
              >
                {role}
              </span>
            )}
          </Button>
        </Link>
      )}

      {/* Sign Out Button */}
      <SignOutButton
        signOutOptions={{ redirectUrl: '/' }}
        data-testid="auth-sign-out-button"
      >
        <Button variant="ghost" className="text-neutral-700 hover:text-gold-500">
          Keluar
        </Button>
      </SignOutButton>

      {/* User Button */}
      <UserButton afterSignOutUrl="/" data-testid="auth-user-button" />
    </div>
  )
}

export function RoleBadge({ role }: { role?: string }) {
  if (!role) return null

  return (
    <span
      className={`text-xs px-2 py-1 rounded-full ${
        role === 'owner'
          ? 'bg-red-100 text-red-600'
          : role === 'producer'
            ? 'bg-gold-100 text-gold-600'
            : 'bg-gold-50 text-gold-700'
      }`}
    >
      {role}
    </span>
  )
}