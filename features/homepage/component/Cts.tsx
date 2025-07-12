import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles } from 'lucide-react'

export function CTA() {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <div className="glass-panel p-12 rounded-2xl text-center space-y-8 relative overflow-hidden">
          {/* Background Decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent-mint/5 rounded-2xl"></div>
          <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-xl"></div>
          <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-accent-mint/20 to-accent-orange/20 rounded-full blur-xl"></div>

          <div className="relative z-10 space-y-8">
            {/* Icon */}
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto shadow-neu">
              <Sparkles className="w-8 h-8 text-white" />
            </div>

            {/* Content */}
            <div className="space-y-4">
              <h2 className="text-3xl lg:text-5xl font-bold">
                Siap Mulai{' '}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Perjalanan
                </span>{' '}
                Belajar?
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Bergabunglah dengan 50,000+ students yang telah mempercayai Maguru untuk
                mengembangkan skill dan meraih karir impian mereka.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                className="neu-button bg-gradient-to-r from-primary to-secondary text-white px-8 py-4 text-lg group"
              >
                Daftar Gratis Sekarang
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-150" />
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="neu-button border-2 border-primary/20 px-8 py-4 text-lg"
              >
                Konsultasi Gratis
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center space-x-8 pt-8 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-accent-mint rounded-full"></div>
                <span>Gratis Trial 7 Hari</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-accent-orange rounded-full"></div>
                <span>Garansi 30 Hari</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Sertifikat Resmi</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
