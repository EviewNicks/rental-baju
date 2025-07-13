'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Menu, X, Shirt } from 'lucide-react'

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-200 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-sm shadow-sm border-b border-neutral-200'
          : 'bg-white/80 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
              <Shirt className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-neutral-900 transition-colors duration-200 group-hover:text-blue-500">
              RentalBaju
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="#categories"
              className="text-neutral-700 hover:text-blue-500 transition-all duration-200 relative group"
            >
              Kategori
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-200 group-hover:w-full"></span>
            </Link>
            <Link
              href="#featured"
              className="text-neutral-700 hover:text-blue-500 transition-all duration-200 relative group"
            >
              Koleksi
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-200 group-hover:w-full"></span>
            </Link>
            <Link
              href="#store-info"
              className="text-neutral-700 hover:text-blue-500 transition-all duration-200 relative group"
            >
              Toko
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-200 group-hover:w-full"></span>
            </Link>
            <Link
              href="#contact"
              className="text-neutral-700 hover:text-blue-500 transition-all duration-200 relative group"
            >
              Kontak
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-200 group-hover:w-full"></span>
            </Link>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg">
              Hubungi Kami
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-neutral-100 transition-all duration-200"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden transition-all duration-300 ease-in-out ${
            isMenuOpen
              ? 'max-h-64 opacity-100 py-4 border-t border-neutral-200'
              : 'max-h-0 opacity-0 overflow-hidden'
          }`}
        >
          <div className="flex flex-col space-y-4">
            <Link
              href="#categories"
              className="text-neutral-700 hover:text-blue-500 transition-colors duration-200 py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Kategori
            </Link>
            <Link
              href="#featured"
              className="text-neutral-700 hover:text-blue-500 transition-colors duration-200 py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Koleksi
            </Link>
            <Link
              href="#store-info"
              className="text-neutral-700 hover:text-blue-500 transition-colors duration-200 py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Toko
            </Link>
            <Link
              href="#contact"
              className="text-neutral-700 hover:text-blue-500 transition-colors duration-200 py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Kontak
            </Link>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg w-full transition-all duration-200">
              Hubungi Kami
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
