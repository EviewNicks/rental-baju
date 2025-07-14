'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Menu, X, Shirt } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { SignOutButton, UserButton } from '@clerk/nextjs'
import { useUserRole } from '@/features/auth'
import { useRoleNavigation } from '@/features/auth/hooks/useUserRole'

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { isSignedIn } = useUser()
  const { role } = useUserRole()
  const { getDashboardUrl } = useRoleNavigation()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Handler untuk close menu mobile setelah klik link
  const handleNavClick = () => setIsOpen(false)

  // Handler untuk sign out dengan close mobile menu
  const handleSignOut = () => {
    setIsOpen(false)
  }

  return (
    <nav
      data-testid="navbar"
      className={`sticky top-0 z-50 transition-all duration-200 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-sm shadow-sm border-b border-neutral-200'
          : 'bg-white/80 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group" data-testid="navbar-logo">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
              <Shirt className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-neutral-900 transition-colors duration-200 group-hover:text-blue-500">
              RentalBaju
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8" data-testid="desktop-navigation">
            <Link
              href="#categories"
              className="text-neutral-700 hover:text-blue-500 transition-all duration-200 relative group"
              data-testid="nav-categories"
            >
              Kategori
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-200 group-hover:w-full"></span>
            </Link>
            <Link
              href="#featured"
              className="text-neutral-700 hover:text-blue-500 transition-all duration-200 relative group"
              data-testid="nav-featured"
            >
              Koleksi
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-200 group-hover:w-full"></span>
            </Link>
            <Link
              href="#store-info"
              className="text-neutral-700 hover:text-blue-500 transition-all duration-200 relative group"
              data-testid="nav-store-info"
            >
              Toko
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-200 group-hover:w-full"></span>
            </Link>
            <Link
              href="#contact"
              className="text-neutral-700 hover:text-blue-500 transition-all duration-200 relative group"
              data-testid="nav-contact"
            >
              Kontak
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-200 group-hover:w-full"></span>
            </Link>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-4" data-testid="desktop-auth-buttons">
            {!isSignedIn ? (
              <>
                <Link href="/sign-in" data-testid="desktop-sign-in-link">
                  <Button variant="ghost" className="text-neutral-700 hover:text-blue-500">
                    Masuk
                  </Button>
                </Link>
                <Link href="/sign-up" data-testid="desktop-sign-up-link">
                  <Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg">
                    Daftar Gratis
                  </Button>
                </Link>
              </>
            ) : (
              <>
                {/* Role-based Dashboard Link */}
                <Link href={getDashboardUrl()} data-testid="desktop-dashboard-link">
                  <Button variant="ghost" className="text-sm text-neutral-700 hover:text-blue-500">
                    Dashboard
                    {role && (
                      <span
                        className={`ml-2 text-xs px-2 py-1 rounded-full ${
                          role === 'owner'
                            ? 'bg-red-100 text-red-600'
                            : role === 'producer'
                              ? 'bg-blue-100 text-blue-600'
                              : 'bg-green-100 text-green-600'
                        }`}
                      >
                        {role}
                      </span>
                    )}
                  </Button>
                </Link>

                <SignOutButton
                  signOutOptions={{ redirectUrl: '/' }}
                  data-testid="desktop-sign-out-button"
                >
                  <Button variant="ghost" className="text-neutral-700 hover:text-blue-500">
                    Keluar
                  </Button>
                </SignOutButton>
                <UserButton afterSignOutUrl="/" data-testid="desktop-user-button" />
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-neutral-100 transition-all duration-200"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle Menu"
            data-testid="mobile-menu-button"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          data-testid="mobile-menu"
          className={`md:hidden transition-all duration-300 ease-in-out ${
            isOpen
              ? 'max-h-64 opacity-100 py-4 border-t border-neutral-200'
              : 'max-h-0 opacity-0 overflow-hidden'
          }`}
        >
          <div className="flex flex-col space-y-4">
            <Link
              href="#categories"
              className="text-neutral-700 hover:text-blue-500 transition-colors duration-200 py-2"
              onClick={handleNavClick}
              data-testid="mobile-nav-categories"
            >
              Kategori
            </Link>
            <Link
              href="#featured"
              className="text-neutral-700 hover:text-blue-500 transition-colors duration-200 py-2"
              onClick={handleNavClick}
              data-testid="mobile-nav-featured"
            >
              Koleksi
            </Link>
            <Link
              href="#store-info"
              className="text-neutral-700 hover:text-blue-500 transition-colors duration-200 py-2"
              onClick={handleNavClick}
              data-testid="mobile-nav-store-info"
            >
              Toko
            </Link>
            <Link
              href="#contact"
              className="text-neutral-700 hover:text-blue-500 transition-colors duration-200 py-2"
              onClick={handleNavClick}
              data-testid="mobile-nav-contact"
            >
              Kontak
            </Link>
            <div className="flex flex-col space-y-2 pt-4" data-testid="mobile-auth-buttons">
              {!isSignedIn ? (
                <>
                  <Link href="/sign-in" data-testid="mobile-sign-in-link">
                    <Button
                      variant="ghost"
                      className="justify-start cursor-pointer text-neutral-700 hover:text-blue-500"
                      onClick={handleNavClick}
                    >
                      Masuk
                    </Button>
                  </Link>
                  <Link href="/sign-up" data-testid="mobile-sign-up-link">
                    <Button
                      className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg w-full transition-all duration-200"
                      onClick={handleNavClick}
                    >
                      Daftar Gratis
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  {/* Mobile Role-based Dashboard Link */}
                  <Link href={getDashboardUrl()} data-testid="mobile-dashboard-link">
                    <Button
                      variant="outline"
                      className="justify-start cursor-pointer w-full text-neutral-700 hover:text-blue-500"
                      onClick={handleNavClick}
                    >
                      <span className="flex items-center">
                        Dashboard
                        {role && (
                          <span
                            className={`ml-2 text-xs px-2 py-1 rounded-full ${
                              role === 'owner'
                                ? 'bg-red-100 text-red-600'
                                : role === 'producer'
                                  ? 'bg-blue-100 text-blue-600'
                                  : 'bg-green-100 text-green-600'
                            }`}
                          >
                            {role}
                          </span>
                        )}
                      </span>
                    </Button>
                  </Link>

                  <SignOutButton
                    signOutOptions={{ redirectUrl: '/' }}
                    data-testid="mobile-sign-out-button"
                  >
                    <Button
                      variant="ghost"
                      className="justify-start cursor-pointer text-neutral-700 hover:text-blue-500"
                      onClick={handleSignOut}
                    >
                      Keluar
                    </Button>
                  </SignOutButton>
                  <div className="pt-2">
                    <UserButton afterSignOutUrl="/" data-testid="mobile-user-button" />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
