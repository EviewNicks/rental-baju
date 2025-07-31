'use client'

import { Button } from '@/components/ui/button'
import { MessageCircle, Phone, Calendar, MapPin } from 'lucide-react'
import { useState } from 'react'

export default function ContactSection() {
  const [isHovered, setIsHovered] = useState<string | null>(null)

  return (
    <section
      id="contact"
      className="py-16 md:py-24 bg-gradient-to-b from-white-50 via-gold-50 to-white-50 relative overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-32 -translate-y-32 animate-pulse"></div>
        <div className="absolute top-1/2 right-0 w-48 h-48 bg-white rounded-full translate-x-24 animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-48 translate-y-48 animate-pulse delay-500"></div>
        <div className="absolute bottom-1/4 left-1/4 w-32 h-32 bg-white rounded-full animate-pulse delay-700"></div>
      </div>

      {/* Geometric Shapes */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-16 h-16 border-2 border-white rotate-45"></div>
        <div className="absolute top-40 right-32 w-12 h-12 border-2 border-white rounded-full"></div>
        <div className="absolute bottom-32 left-16 w-20 h-20 border-2 border-white rotate-12"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-white/20 text-neutral-900 rounded-full text-sm font-medium mb-6">
            <MessageCircle className="w-4 h-4 mr-2 text-gold-600" />
            Hubungi Kami Sekarang
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 mb-6">
            Siap Menyewa Pakaian Impian Anda?
          </h2>

          <p className="text-xl text-neutral-600 max-w-3xl mx-auto mb-8 leading-relaxed">
            Hubungi kami sekarang untuk konsultasi gratis dan dapatkan pakaian yang sempurna untuk
            acara spesial Anda. Tim profesional kami siap membantu 24/7.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-gold-700 mb-1">5 Menit</div>
              <div className="text-neutral-600 text-sm">Respon Cepat</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-gold-700 mb-1">24/7</div>
              <div className="text-neutral-600 text-sm">Layanan Online</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-gold-700 mb-1">GRATIS</div>
              <div className="text-neutral-600 text-sm">Konsultasi</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-gold-700 mb-1">1000+</div>
              <div className="text-neutral-600 text-sm">Pelanggan Puas</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button
              size="lg"
              className="bg-white text-gold-700 hover:bg-gold-100 rounded-lg font-semibold transition-all duration-200 hover:scale-105 hover:shadow-xl border-2 border-gold-500"
              onMouseEnter={() => setIsHovered('whatsapp')}
              onMouseLeave={() => setIsHovered(null)}
            >
              <MessageCircle
                className={`w-5 h-5 mr-2 text-gold-600 transition-transform duration-200 ${
                  isHovered === 'whatsapp' ? 'scale-110' : ''
                }`}
              />
              Chat WhatsApp Sekarang
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="border-2 border-gold-500 text-gold-700 hover:bg-gold-100 hover:text-gold-900 rounded-lg font-semibold transition-all duration-200 hover:scale-105 bg-transparent"
              onMouseEnter={() => setIsHovered('phone')}
              onMouseLeave={() => setIsHovered(null)}
            >
              <Phone
                className={`w-5 h-5 mr-2 text-gold-600 transition-transform duration-200 ${isHovered === 'phone' ? 'scale-110' : ''}`}
              />
              Telepon Langsung
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="border-2 border-gold-500 text-gold-700 hover:bg-gold-100 hover:text-gold-900 rounded-lg font-semibold transition-all duration-200 hover:scale-105 bg-transparent"
              onMouseEnter={() => setIsHovered('visit')}
              onMouseLeave={() => setIsHovered(null)}
            >
              <MapPin
                className={`w-5 h-5 mr-2 text-gold-600 transition-transform duration-200 ${isHovered === 'visit' ? 'scale-110' : ''}`}
              />
              Kunjungi Toko
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
              <Calendar className="w-8 h-8 text-gold-600 mx-auto mb-3" />
              <h3 className="font-semibold text-neutral-900 mb-2">Booking Online</h3>
              <p className="text-gold-900 text-sm">Reservasi mudah melalui website</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
              <MessageCircle className="w-8 h-8 text-gold-600 mx-auto mb-3" />
              <h3 className="font-semibold text-neutral-900 mb-2">Konsultasi Gratis</h3>
              <p className="text-gold-900 text-sm">Dapatkan saran dari fashion expert</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
              <Phone className="w-8 h-8 text-gold-600 mx-auto mb-3" />
              <h3 className="font-semibold text-neutral-900 mb-2">Support 24/7</h3>
              <p className="text-gold-900 text-sm">Tim support siap membantu kapan saja</p>
            </div>
          </div>

          {/* Contact Info */}
          <div className="mt-8 text-gold-900">
            <p className="text-sm mb-2">
              📞 <strong>+62 812-3456-7890</strong> • 📧 <strong>info@rentalbaju.com</strong>
            </p>
            <p className="text-xs opacity-80">
              Respon cepat dalam 5 menit • Konsultasi gratis • Layanan profesional
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
