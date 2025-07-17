'use client'

import { Button } from '@/components/ui/button'
import { Star, Users, Clock, Shield, ArrowDown, CheckCircle, Truck } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'

export default function HeroSection() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <section
      data-testid="hero-section"
      className="relative py-12 md:py-24 lg:py-32 overflow-hidden bg-gradient-to-br from-neutral-50 via-gold-50/30 to-neutral-100"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gold-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-gold-400 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div
            data-testid="hero-content"
            className={`space-y-8 transition-all duration-1000 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="space-y-6">
              <div
                className="inline-flex items-center px-4 py-2 bg-gold-100 text-gold-700 rounded-full text-sm font-medium"
                data-testid="hero-badge"
              >
                <Star className="w-4 h-4 mr-2" />
                Terpercaya sejak 2020
              </div>

              <h1
                data-testid="hero-title"
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 leading-tight"
              >
                <span className="bg-gradient-to-r from-gold-500 to-gold-600 bg-clip-text text-transparent">
                  RentalBaju
                </span>
                <br />
                Solusi Penyewaan Pakaian Terpercaya
              </h1>

              <p
                data-testid="hero-description"
                className="text-xl text-neutral-600 leading-relaxed max-w-2xl"
              >
                Koleksi pakaian pesta, casual, dan tradisional untuk acara spesial Anda. Temukan
                pakaian yang sempurna untuk pesta, foto, dan acara penting lainnya dengan kualitas
                premium dan harga terjangkau.
              </p>
            </div>

            {/* Trust Indicators */}
            <div
              data-testid="hero-trust-indicators"
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              <div
                className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm border border-neutral-200"
                data-testid="trust-rating"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-gold-100 to-gold-200 rounded-lg flex items-center justify-center">
                  <Star className="w-5 h-5 text-gold-600" />
                </div>
                <div>
                  <div className="text-sm font-bold text-neutral-900">4.9/5</div>
                  <div className="text-xs text-neutral-600">Rating</div>
                </div>
              </div>

              <div
                className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm border border-neutral-200"
                data-testid="trust-customers"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-gold-100 to-gold-200 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-gold-600" />
                </div>
                <div>
                  <div className="text-sm font-bold text-neutral-900">1000+</div>
                  <div className="text-xs text-neutral-600">Pelanggan</div>
                </div>
              </div>

              <div
                className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm border border-neutral-200"
                data-testid="trust-hours"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-gold-100 to-gold-200 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-gold-600" />
                </div>
                <div>
                  <div className="text-sm font-bold text-neutral-900">09-20</div>
                  <div className="text-xs text-neutral-600">Jam Buka</div>
                </div>
              </div>

              <div
                className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm border border-neutral-200"
                data-testid="trust-security"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-gold-100 to-gold-200 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-gold-600" />
                </div>
                <div>
                  <div className="text-sm font-bold text-neutral-900">Aman</div>
                  <div className="text-xs text-neutral-600">Terpercaya</div>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div data-testid="hero-cta-buttons" className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-neutral-900 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg font-semibold"
                data-testid="hero-view-collection-btn"
              >
                Lihat Koleksi Lengkap
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-neutral-300 text-neutral-700 hover:bg-neutral-50 hover:border-gold-500 hover:text-gold-500 rounded-lg transition-all duration-200 bg-white"
                data-testid="hero-whatsapp-btn"
              >
                Hubungi WhatsApp
              </Button>
            </div>

            {/* Features List */}
            <div
              data-testid="hero-features"
              className="flex flex-wrap gap-6 text-sm text-neutral-600"
            >
              <div className="flex items-center space-x-2" data-testid="feature-quality">
                <CheckCircle className="w-4 h-4 text-gold-500" />
                <span>Kualitas Premium</span>
              </div>
              <div className="flex items-center space-x-2" data-testid="feature-price">
                <CheckCircle className="w-4 h-4 text-gold-500" />
                <span>Harga Terjangkau</span>
              </div>
              <div className="flex items-center space-x-2" data-testid="feature-delivery">
                <CheckCircle className="w-4 h-4 text-gold-500" />
                <span>Delivery Gratis</span>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div
            data-testid="hero-image"
            className={`relative transition-all duration-1000 delay-300 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="relative w-full h-96 md:h-[500px] rounded-2xl overflow-hidden bg-gradient-to-br from-gold-50 to-gold-100 shadow-2xl">
              <Image
                src="/products/image.png"
                alt="RentalBaju - Koleksi Pakaian Premium"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            </div>

            {/* Floating Cards */}
            <div
              className="absolute -top-4 -left-4 bg-white rounded-xl shadow-lg p-4 border border-neutral-200 animate-pulse"
              data-testid="floating-quality-card"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-gold-500 to-gold-600 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-neutral-900">Kualitas Terjamin</div>
                  <div className="text-xs text-neutral-600">Pakaian berkualitas premium</div>
                </div>
              </div>
            </div>

            <div
              className="absolute -bottom-4 -right-4 bg-white rounded-xl shadow-lg p-4 border border-neutral-200 animate-pulse"
              data-testid="floating-delivery-card"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-gold-500 to-gold-600 rounded-full flex items-center justify-center">
                  <Truck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-neutral-900">Delivery Tersedia</div>
                  <div className="text-xs text-neutral-600">Antar jemput gratis</div>
                </div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-1/2 -right-8 w-16 h-16 bg-gold-500/10 rounded-full blur-xl"></div>
            <div className="absolute bottom-1/4 -left-8 w-20 h-20 bg-gold-400/10 rounded-full blur-xl"></div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="flex justify-center mt-16" data-testid="scroll-indicator">
          <div className="animate-bounce">
            <ArrowDown className="w-6 h-6 text-neutral-400" />
          </div>
        </div>
      </div>
    </section>
  )
}
