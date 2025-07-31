'use client'

import Link from 'next/link'
import {
  Shirt,
  MapPin,
  Phone,
  Mail,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Clock,
  Star,
} from 'lucide-react'

export default function Footer() {
  return (
    <footer data-testid="footer" className="bg-neutral-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16 grid md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-6" data-testid="footer-brand">
            <div className="flex items-center space-x-2" data-testid="footer-logo">
              <div className="w-10 h-10 bg-gradient-to-br from-gold-500 to-gold-600 rounded-lg flex items-center justify-center">
                <Shirt className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold">RentalBaju</span>
            </div>

            <p data-testid="footer-description" className="text-neutral-300 leading-relaxed">
              Solusi penyewaan pakaian terpercaya untuk acara spesial Anda. Kualitas premium dengan
              harga terjangkau sejak 2020.
            </p>

            {/* Trust Indicators */}
            <div data-testid="footer-trust-indicators" className="space-y-2">
              <div className="flex items-center space-x-2" data-testid="footer-rating">
                <Star className="w-4 h-4 text-gold-500" />
                <span className="text-sm text-neutral-300">Rating 4.9/5 dari 1000+ pelanggan</span>
              </div>
              <div className="flex items-center space-x-2" data-testid="footer-hours">
                <Clock className="w-4 h-4 text-gold-500" />
                <span className="text-sm text-neutral-300">Buka setiap hari 09:00 - 20:00</span>
              </div>
            </div>

            {/* Social Media */}
            <div data-testid="footer-social-media" className="flex space-x-4">
              <a
                href="#"
                className="w-10 h-10 bg-neutral-800 rounded-lg flex items-center justify-center hover:bg-gold-500 transition-all duration-200 hover:scale-110"
                aria-label="Instagram"
                data-testid="social-instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-neutral-800 rounded-lg flex items-center justify-center hover:bg-gold-500 transition-all duration-200 hover:scale-110"
                aria-label="Facebook"
                data-testid="social-facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-neutral-800 rounded-lg flex items-center justify-center hover:bg-gold-500 transition-all duration-200 hover:scale-110"
                aria-label="Twitter"
                data-testid="social-twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-neutral-800 rounded-lg flex items-center justify-center hover:bg-gold-500 transition-all duration-200 hover:scale-110"
                aria-label="YouTube"
                data-testid="social-youtube"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div data-testid="footer-quick-links">
            <h3 className="font-bold text-lg mb-6">Menu Cepat</h3>
            <div className="space-y-3">
              <Link
                href="#categories"
                className="block text-neutral-300 hover:text-gold-500 transition-colors duration-200 hover:translate-x-1"
                data-testid="footer-link-categories"
              >
                Kategori Pakaian
              </Link>
              <Link
                href="#featured"
                className="block text-neutral-300 hover:text-gold-500 transition-colors duration-200 hover:translate-x-1"
                data-testid="footer-link-featured"
              >
                Koleksi Terpopuler
              </Link>
              <Link
                href="#store-info"
                className="block text-neutral-300 hover:text-gold-500 transition-colors duration-200 hover:translate-x-1"
                data-testid="footer-link-store-info"
              >
                Info Toko
              </Link>
              <Link
                href="#contact"
                className="block text-neutral-300 hover:text-gold-500 transition-colors duration-200 hover:translate-x-1"
                data-testid="footer-link-contact"
              >
                Hubungi Kami
              </Link>
              <Link
                href="#"
                className="block text-neutral-300 hover:text-gold-500 transition-colors duration-200 hover:translate-x-1"
                data-testid="footer-link-ordering"
              >
                Cara Pemesanan
              </Link>
            </div>
          </div>

          {/* Categories */}
          <div data-testid="footer-categories">
            <h3 className="font-bold text-lg mb-6">Kategori</h3>
            <div className="space-y-3">
              <Link
                href="#"
                className="block text-neutral-300 hover:text-gold-500 transition-colors duration-200 hover:translate-x-1"
                data-testid="footer-category-party"
              >
                Pakaian Pesta
              </Link>
              <Link
                href="#"
                className="block text-neutral-300 hover:text-gold-500 transition-colors duration-200 hover:translate-x-1"
                data-testid="footer-category-casual"
              >
                Pakaian Casual
              </Link>
              <Link
                href="#"
                className="block text-neutral-300 hover:text-gold-500 transition-colors duration-200 hover:translate-x-1"
                data-testid="footer-category-traditional"
              >
                Pakaian Tradisional
              </Link>
              <Link
                href="#"
                className="block text-neutral-300 hover:text-gold-500 transition-colors duration-200 hover:translate-x-1"
                data-testid="footer-category-accessories"
              >
                Aksesoris
              </Link>
              <Link
                href="#"
                className="block text-neutral-300 hover:text-gold-500 transition-colors duration-200 hover:translate-x-1"
                data-testid="footer-category-shoes-bags"
              >
                Sepatu & Tas
              </Link>
            </div>
          </div>

          {/* Contact Info */}
          <div data-testid="footer-contact">
            <h3 className="font-bold text-lg mb-6">Kontak & Lokasi</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3" data-testid="contact-address">
                <MapPin className="w-5 h-5 text-gold-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-white mb-1">Alamat Toko</div>
                  <span className="text-neutral-300 text-sm leading-relaxed">
                    Jl. Fashion Street No. 123
                    <br />
                    Jakarta Pusat, Indonesia
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3" data-testid="contact-phone">
                <Phone className="w-5 h-5 text-gold-500 flex-shrink-0" />
                <div>
                  <div className="font-medium text-white mb-1">Telepon</div>
                  <span className="text-neutral-300 text-sm">+62 812-3456-7890</span>
                </div>
              </div>

              <div className="flex items-center space-x-3" data-testid="contact-email">
                <Mail className="w-5 h-5 text-gold-500 flex-shrink-0" />
                <div>
                  <div className="font-medium text-white mb-1">Email</div>
                  <span className="text-neutral-300 text-sm">info@rentalbaju.com</span>
                </div>
              </div>
            </div>

            {/* Quick Contact Buttons */}
            <div data-testid="footer-contact-buttons" className="mt-6 space-y-2">
              <button
                className="w-full bg-gold-500 hover:bg-gold-600 text-neutral-900 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                data-testid="footer-whatsapp-btn"
              >
                Chat WhatsApp
              </button>
              <button
                className="w-full border border-neutral-700 text-neutral-300 hover:bg-gold-100 hover:text-gold-700 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200"
                data-testid="footer-maps-btn"
              >
                Lihat Maps
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div data-testid="footer-bottom" className="border-t border-neutral-800 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-center md:text-left" data-testid="footer-copyright">
              <p className="text-neutral-400 text-sm">
                © {new Date().getFullYear()} RentalBaju. Semua hak dilindungi undang-undang.
              </p>
              <p className="text-neutral-500 text-xs mt-1">
                Terdaftar dan diawasi oleh Kementerian Perdagangan RI
              </p>
            </div>

            <div
              data-testid="footer-legal-links"
              className="flex flex-wrap justify-center md:justify-end space-x-6"
            >
              <Link
                href="#"
                className="text-neutral-400 hover:text-gold-500 text-sm transition-colors duration-200"
                data-testid="footer-link-terms"
              >
                Syarat & Ketentuan
              </Link>
              <Link
                href="#"
                className="text-neutral-400 hover:text-gold-500 text-sm transition-colors duration-200"
                data-testid="footer-link-privacy"
              >
                Kebijakan Privasi
              </Link>
              <Link
                href="#"
                className="text-neutral-400 hover:text-gold-500 text-sm transition-colors duration-200"
                data-testid="footer-link-faq"
              >
                FAQ
              </Link>
              <Link
                href="#"
                className="text-neutral-400 hover:text-gold-500 text-sm transition-colors duration-200"
                data-testid="footer-link-help"
              >
                Bantuan
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
