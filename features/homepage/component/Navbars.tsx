'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Menu, X, BookOpen } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { SignOutButton, UserButton } from '@clerk/nextjs'
import { useUserRole } from '@/features/auth'

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { isSignedIn } = useUser()
  const { role, isAdmin, isCreator, isUser } = useUserRole()

  // Handler untuk close menu mobile setelah klik link
  const handleNavClick = () => setIsOpen(false)

  // Handler untuk sign out dengan close mobile menu
  const handleSignOut = () => {
    setIsOpen(false)
  }

  // Get dashboard URL based on role
  const getDashboardUrl = () => {
    if (isAdmin) return '/admin/dashboard'
    if (isCreator) return '/creator/dashboard'
    if (isUser) return '/dashboard'
    return '/dashboard' // Default fallback
  }

  return (
    <nav className="fixed top-0 w-full z-50 glass-panel">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Maguru
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <a
              href="#courses"
              className="text-gray-700 hover:text-primary transition-colors duration-150"
            >
              Courses
            </a>
            <a
              href="#features"
              className="text-gray-700 hover:text-primary transition-colors duration-150"
            >
              Features
            </a>
            <a
              href="#testimonials"
              className="text-gray-700 hover:text-primary transition-colors duration-150"
            >
              Testimonials
            </a>
            <a
              href="#pricing"
              className="text-gray-700 hover:text-primary transition-colors duration-150"
            >
              Pricing
            </a>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-4">
            {!isSignedIn ? (
              <>
                <Link href="/sign-in">
                  <Button variant="ghost">Masuk</Button>
                </Link>
                <Link href="/sign-up">
                  <Button className="neu-button bg-gradient-to-r from-primary to-secondary text-white px-6">
                    Daftar Gratis
                  </Button>
                </Link>
              </>
            ) : (
              <>
                {/* Role-based Dashboard Link */}
                <Link href={getDashboardUrl()}>
                  <Button variant="ghost" className="text-sm">
                    Dashboard
                    {role && (
                      <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        {role}
                      </span>
                    )}
                  </Button>
                </Link>

                <SignOutButton
                  signOutOptions={{ redirectUrl: '/' }}
                  data-testid="desktop-sign-out-button"
                >
                  <Button variant="ghost">Keluar</Button>
                </SignOutButton>
                <UserButton afterSignOutUrl="/" data-testid="desktop-user-button" />
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle Menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-4 animate-fade-in">
            <a
              href="#courses"
              className="block text-gray-700 hover:text-primary transition-colors duration-150"
              onClick={handleNavClick}
            >
              Courses
            </a>
            <a
              href="#features"
              className="block text-gray-700 hover:text-primary transition-colors duration-150"
              onClick={handleNavClick}
            >
              Features
            </a>
            <a
              href="#testimonials"
              className="block text-gray-700 hover:text-primary transition-colors duration-150"
              onClick={handleNavClick}
            >
              Testimonials
            </a>
            <a
              href="#pricing"
              className="block text-gray-700 hover:text-primary transition-colors duration-150"
              onClick={handleNavClick}
            >
              Pricing
            </a>
            <div className="flex flex-col space-y-2 pt-4">
              {!isSignedIn ? (
                <>
                  <Link href="/sign-in">
                    <Button
                      variant="ghost"
                      className="justify-start cursor-pointer"
                      onClick={handleNavClick}
                    >
                      Masuk
                    </Button>
                  </Link>
                  <Link href="/sign-up">
                    <Button
                      className="neu-button bg-gradient-to-r from-primary to-secondary text-white cursor-pointer"
                      onClick={handleNavClick}
                    >
                      Daftar Gratis
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  {/* Mobile Role-based Dashboard Link */}
                  <Link href={getDashboardUrl()}>
                    <Button
                      variant="outline"
                      className="justify-start cursor-pointer w-full"
                      onClick={handleNavClick}
                    >
                      <span className="flex items-center">
                        Dashboard
                        {role && (
                          <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
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
                      className="justify-start cursor-pointer"
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
        )}
      </div>
    </nav>
  )
}
