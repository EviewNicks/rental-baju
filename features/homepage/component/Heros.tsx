import { Button } from '@/components/ui/button'
import { Play, Star, Users, BookOpen } from 'lucide-react'

export function Hero() {
  return (
    <section className="pt-24 pb-16 px-4 bg-gradient-to-b from-transparent to-primary">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8 animate-slide-up">
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-2 glass-panel px-4 py-2 rounded-full">
                <Star className="w-4 h-4 text-blue-800 fill-current" />
                <span className="text-sm font-medium">Platform #1 di Indonesia</span>
              </div>

              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                Belajar Skill{' '}
                <span className="bg-gradient-to-r from-primary via-secondary to-accent-mint bg-accent-mint bg-clip-text text-transparent">
                  Digital
                </span>{' '}
                Bersama Expert
              </h1>

              <p className="text-lg text-gray-600 leading-relaxed max-w-lg">
                Tingkatkan karir Anda dengan ribuan course berkualitas tinggi. Belajar dari mentor
                berpengalaman dengan metode pembelajaran yang terbukti efektif.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="neu-button bg-gradient-to-r from-primary to-secondary text-white px-8 py-4 text-lg"
              >
                Mulai Belajar Gratis
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="neu-button border-2 border-primary/20 px-8 py-4 text-lg group"
              >
                <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-150" />
                Lihat Demo
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex items-center space-x-8 pt-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">50K+</span> Students
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-secondary" />
                <span className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">500+</span> Courses
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-accent-orange fill-current" />
                <span className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">4.9</span> Rating
                </span>
              </div>
            </div>
          </div>

          {/* Right Content - Hero Image */}
          <div className="relative animate-fade-in">
            <div className="glass-panel p-8 rounded-2xl">
              <div className="aspect-square bg-gradient-to-br from-primary/10 via-secondary/10 to-accent-mint/10 rounded-xl flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto shadow-neu">
                    <BookOpen className="w-12 h-12 text-white" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">Interactive Learning</h3>
                    <p className="text-gray-600 text-sm">
                      Belajar dengan metode interaktif dan praktis
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Cards */}
            <div
              className="absolute -top-4 -right-4 glass-panel p-4 rounded-xl animate-fade-in"
              style={{ animationDelay: '0.2s' }}
            >
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-accent-mint rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">✓</span>
                </div>
                <span className="text-sm font-medium">Course Completed</span>
              </div>
            </div>

            <div
              className="absolute -bottom-4 -left-4 glass-panel p-4 rounded-xl animate-fade-in"
              style={{ animationDelay: '0.4s' }}
            >
              <div className="flex items-center space-x-2">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 bg-primary rounded-full border-2 border-white"></div>
                  <div className="w-6 h-6 bg-secondary rounded-full border-2 border-white"></div>
                  <div className="w-6 h-6 bg-accent-orange rounded-full border-2 border-white"></div>
                </div>
                <span className="text-sm font-medium">1.2K+ Students</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
