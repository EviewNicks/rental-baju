import { Star, Quote } from 'lucide-react'
import Image from 'next/image'

export function Testimonials() {
  const testimonials = [
    {
      name: 'Sarah Wijaya',
      role: 'Frontend Developer at Tokopedia',
      content:
        'Maguru benar-benar mengubah karir saya. Dari yang tidak tahu coding sama sekali, sekarang saya sudah bekerja di tech company impian. Mentor-mentornya sangat supportive dan materinya up-to-date.',
      rating: 5,
      avatar: '/globe.svg',
    },
    {
      name: 'Ahmad Rizki',
      role: 'UI/UX Designer at Gojek',
      content:
        'Course UI/UX di Maguru sangat comprehensive. Tidak hanya teori, tapi juga praktik langsung dengan project nyata. Portfolio yang saya buat dari course ini yang membuat saya diterima di Gojek.',
      rating: 5,
      avatar: '/globe.svg',
    },
    {
      name: 'Lisa Chen',
      role: 'Digital Marketing Manager',
      content:
        'Sebagai career changer, saya butuh pembelajaran yang terstruktur. Maguru memberikan roadmap yang jelas dan mentor yang selalu siap membantu. Sekarang saya sudah jadi Digital Marketing Manager.',
      rating: 5,
      avatar: '/globe.svg',
    },
  ]

  return (
    <section id="testimonials" className="py-20 px-4">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold">
            Apa Kata{' '}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Alumni?
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Dengarkan cerita sukses dari ribuan alumni Maguru yang telah berhasil mengubah karir dan
            meraih impian mereka.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="glass-panel p-6 rounded-xl hover:shadow-neu transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="space-y-4">
                {/* Quote Icon */}
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                  <Quote className="w-5 h-5 text-white" />
                </div>

                {/* Rating */}
                <div className="flex items-center space-x-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-accent-orange fill-current" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-gray-700 leading-relaxed">&quot;{testimonial.content}&quot;</p>

                {/* Author */}
                <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
                  <Image
                    src={testimonial.avatar || '/globe.svg'}
                    alt={testimonial.name}
                    className="rounded-full object-cover"
                    width={48}
                    height={48}
                  />
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
