'use client'

import { Card, CardContent } from '@/components/ui/card'
import { MapPin, Clock, Phone, Truck, Award, Users, Calendar, CreditCard } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

const storeFeatures = [
  {
    icon: Award,
    title: 'Kualitas Premium',
    description: 'Semua pakaian telah melalui quality control ketat',
  },
  {
    icon: Users,
    title: 'Pelayanan Profesional',
    description: 'Tim berpengalaman siap membantu Anda',
  },
  {
    icon: Calendar,
    title: 'Booking Mudah',
    description: 'Sistem reservasi online yang praktis',
  },
  {
    icon: CreditCard,
    title: 'Pembayaran Fleksibel',
    description: 'Berbagai metode pembayaran tersedia',
  },
]

export default function StoreInfoSection() {
  const [activeTab, setActiveTab] = useState('location')

  return (
    <section id="store-info" className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-4">
            <MapPin className="w-4 h-4 mr-2" />
            Informasi Toko
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
            Kunjungi Toko Kami
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
            Lokasi strategis dengan layanan lengkap untuk kemudahan Anda
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Store Image & Features */}
          <div className="space-y-8">
            <div className="relative">
              <div className="relative w-full h-96 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50 to-green-50 shadow-lg">
                <Image
                  src="/products/image.png"
                  alt="Toko RentalBaju - Interior Modern"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

                {/* Store Badge */}
                <div className="absolute bottom-4 left-4 bg-white rounded-lg p-3 shadow-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-semibold text-neutral-900">Buka Sekarang</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4">
              {storeFeatures.map((feature, index) => {
                const IconComponent = feature.icon
                return (
                  <Card
                    key={index}
                    className="border border-neutral-200 rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  >
                    <CardContent className="p-4 text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <IconComponent className="w-6 h-6 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-neutral-900 text-sm mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-xs text-neutral-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Store Information */}
          <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-neutral-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('location')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'location'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Lokasi & Jam
              </button>
              <button
                onClick={() => setActiveTab('contact')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'contact'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Kontak & Delivery
              </button>
            </div>

            {/* Tab Content */}
            <div className="space-y-4">
              {activeTab === 'location' && (
                <>
                  <Card className="border border-neutral-200 rounded-xl">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-neutral-900 mb-2">Alamat Toko</h3>
                          <p className="text-neutral-600 leading-relaxed">
                            <strong>RentalBaju Fashion Center</strong>
                            <br />
                            Jl. Fashion Street No. 123, Blok A-15
                            <br />
                            Kelurahan Menteng, Kecamatan Menteng
                            <br />
                            Jakarta Pusat, DKI Jakarta 10310
                            <br />
                            Indonesia
                          </p>
                          <div className="mt-3">
                            <button className="text-blue-500 hover:text-blue-600 text-sm font-medium transition-colors duration-200">
                              Lihat di Google Maps →
                            </button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-neutral-200 rounded-xl">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Clock className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-neutral-900 mb-3">Jam Operasional</h3>
                          <div className="space-y-2 text-neutral-600">
                            <div className="flex justify-between">
                              <span>Senin - Jumat</span>
                              <span className="font-medium">09:00 - 20:00</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Sabtu - Minggu</span>
                              <span className="font-medium">09:00 - 21:00</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Hari Libur Nasional</span>
                              <span className="font-medium text-red-500">Tutup</span>
                            </div>
                          </div>
                          <div className="mt-3 p-2 bg-green-50 rounded-lg">
                            <p className="text-sm text-green-700">
                              💡 <strong>Tips:</strong> Kunjungi di pagi hari untuk pilihan
                              terlengkap
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {activeTab === 'contact' && (
                <>
                  <Card className="border border-neutral-200 rounded-xl">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Phone className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-neutral-900 mb-3">Hubungi Kami</h3>
                          <div className="space-y-3">
                            <div>
                              <div className="text-sm text-neutral-600">Telepon Toko</div>
                              <div className="font-medium text-neutral-900">+62 21-3456-7890</div>
                            </div>
                            <div>
                              <div className="text-sm text-neutral-600">WhatsApp (24/7)</div>
                              <div className="font-medium text-neutral-900">+62 812-3456-7890</div>
                            </div>
                            <div>
                              <div className="text-sm text-neutral-600">Email</div>
                              <div className="font-medium text-neutral-900">
                                info@rentalbaju.com
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2 mt-4">
                            <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105">
                              Chat WhatsApp
                            </button>
                            <button className="border border-neutral-300 text-neutral-700 hover:bg-neutral-50 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200">
                              Telepon
                            </button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-neutral-200 rounded-xl">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Truck className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-neutral-900 mb-3">Layanan Delivery</h3>
                          <div className="space-y-3">
                            <div>
                              <div className="text-sm text-neutral-600">Area Jangkauan</div>
                              <div className="font-medium text-neutral-900">
                                Jakarta & Sekitarnya (Bogor, Depok, Tangerang, Bekasi)
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-neutral-600">Biaya Delivery</div>
                              <div className="font-medium text-neutral-900">
                                Mulai Rp 25.000 (GRATIS untuk rental &gt;Rp 500.000)
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-neutral-600">Waktu Delivery</div>
                              <div className="font-medium text-neutral-900">
                                Same day (order sebelum 15:00)
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-700">
                              🚚 <strong>Express Delivery:</strong> Tersedia untuk area Jakarta (2-4
                              jam)
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
