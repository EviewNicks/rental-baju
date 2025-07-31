'use client'

import { Card, CardContent } from '@/components/ui/card'
import { PartyPopper, Shirt, Crown, ArrowRight } from 'lucide-react'
import { useState } from 'react'

const categories = [
  {
    title: 'Pakaian Pesta',
    description:
      'Koleksi pakaian elegan untuk acara pesta dan formal. Dress, gaun malam, dan suit premium.',
    icon: PartyPopper,
    color: 'gold',
    items: '150+ items',
    gradient: 'from-gold-500 to-gold-600',
    bgGradient: 'from-gold-50 to-gold-100',
    popular: ['Dress Pesta', 'Gaun Malam', 'Suit Formal'],
  },
  {
    title: 'Pakaian Casual',
    description:
      'Pakaian nyaman untuk acara santai dan sehari-hari. Kemeja, blouse, dan outfit kasual.',
    icon: Shirt,
    color: 'gold',
    items: '200+ items',
    gradient: 'from-gold-500 to-gold-600',
    bgGradient: 'from-gold-50 to-gold-100',
    popular: ['Kemeja Casual', 'Blouse', 'Kaos Premium'],
  },
  {
    title: 'Pakaian Tradisional',
    description:
      'Koleksi pakaian tradisional untuk acara adat dan budaya. Kebaya, batik, dan busana nusantara.',
    icon: Crown,
    color: 'gold',
    items: '100+ items',
    gradient: 'from-gold-500 to-gold-600',
    bgGradient: 'from-gold-50 to-gold-100',
    popular: ['Kebaya', 'Batik Premium', 'Sarong'],
  },
]

export default function CategoriesSection() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)

  return (
    <section id="categories" className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-gold-100 text-gold-700 rounded-full text-sm font-medium mb-4">
            Kategori Lengkap
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
            Temukan Pakaian Sesuai Kebutuhan
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
            Koleksi lengkap pakaian untuk berbagai acara dan kebutuhan Anda
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {categories.map((category, index) => {
            const IconComponent = category.icon
            const isHovered = hoveredCard === index

            return (
              <Card
                key={index}
                className="group border border-neutral-200 rounded-xl hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer overflow-hidden bg-white"
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <CardContent className="p-0">
                  {/* Header with gradient background */}
                  <div
                    className={`bg-gradient-to-br ${category.bgGradient} p-8 text-center relative overflow-hidden`}
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/20 rounded-full -translate-y-10 translate-x-10"></div>
                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/20 rounded-full translate-y-8 -translate-x-8"></div>

                    <div
                      className={`w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br ${category.gradient} flex items-center justify-center transition-all duration-300 ${
                        isHovered ? 'scale-110 rotate-6' : ''
                      }`}
                    >
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>

                    <h3 className="text-xl font-bold text-neutral-900 mb-2">{category.title}</h3>
                    <div className="text-sm font-semibold text-neutral-700 bg-white/50 rounded-full px-3 py-1 inline-block">
                      {category.items}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <p className="text-neutral-600 mb-4 leading-relaxed">{category.description}</p>

                    {/* Popular Items */}
                    <div className="space-y-2 mb-4">
                      <div className="text-sm font-semibold text-neutral-900">Populer:</div>
                      <div className="flex flex-wrap gap-2">
                        {category.popular.map((item, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-neutral-100 text-neutral-700 px-2 py-1 rounded-full"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* CTA */}
                    <div
                      className={`flex items-center justify-between transition-all duration-300 ${
                        isHovered ? 'translate-x-2' : ''
                      }`}
                    >
                      <span className="text-sm font-semibold text-gold-500">Lihat Koleksi</span>
                      <ArrowRight
                        className={`w-4 h-4 text-gold-500 transition-transform duration-300 ${
                          isHovered ? 'translate-x-1' : ''
                        }`}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <button className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-neutral-900 px-8 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105 hover:shadow-lg">
            Jelajahi Semua Kategori
          </button>
        </div>
      </div>
    </section>
  )
}
