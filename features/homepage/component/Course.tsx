import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Star, Clock, Users, Play } from 'lucide-react'
import Image from 'next/image'

export function Courses() {
  const courses = [
    {
      title: 'Full Stack Web Development',
      instructor: 'John Doe',
      rating: 4.9,
      students: 1234,
      duration: '12 weeks',
      level: 'Beginner',
      price: 'Rp 299,000',
      originalPrice: 'Rp 499,000',
      image: '/globe.svg',
      tags: ['React', 'Node.js', 'MongoDB'],
    },
    {
      title: 'UI/UX Design Mastery',
      instructor: 'Jane Smith',
      rating: 4.8,
      students: 987,
      duration: '8 weeks',
      level: 'Intermediate',
      price: 'Rp 249,000',
      originalPrice: 'Rp 399,000',
      image: '/globe.svg',
      tags: ['Figma', 'Design System', 'Prototyping'],
    },
    {
      title: 'Digital Marketing Strategy',
      instructor: 'Mike Johnson',
      rating: 4.9,
      students: 2156,
      duration: '6 weeks',
      level: 'Beginner',
      price: 'Rp 199,000',
      originalPrice: 'Rp 299,000',
      image: '/globe.svg',
      tags: ['SEO', 'Social Media', 'Analytics'],
    },
  ]

  return (
    <section id="courses" className="py-20 px-4 bg-gradient-to-b from-transparent to-primary/50">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold">
            Course{' '}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Terpopuler
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Pilihan course terbaik yang paling diminati oleh ribuan students. Dipandu oleh mentor
            expert dengan pengalaman industri bertahun-tahun.
          </p>
        </div>

        {/* Courses Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {courses.map((course, index) => (
            <div
              key={index}
              className="glass-panel rounded-xl overflow-hidden hover:shadow-neu transition-all duration-300 group animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Course Image */}
              <div className="relative overflow-hidden">
                <Image
                  src={course.image || '/globe.svg'}
                  alt={course.title}
                  className="w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  width={300}
                  height={200}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <Button
                    size="sm"
                    className="neu-button bg-white/20 backdrop-blur-sm text-white border-white/30"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                </div>
                <Badge className="absolute top-4 left-4 bg-accent-orange text-white">
                  {course.level}
                </Badge>
              </div>

              {/* Course Content */}
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary transition-colors duration-300">
                    {course.title}
                  </h3>
                  <p className="text-sm text-gray-600">by {course.instructor}</p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {course.tags.map((tag, tagIndex) => (
                    <Badge key={tagIndex} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Course Stats */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-accent-orange fill-current" />
                    <span className="font-medium">{course.rating}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{course.students.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{course.duration}</span>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="space-y-1">
                    <div className="text-lg font-bold text-primary">{course.price}</div>
                    <div className="text-sm text-gray-500 line-through">{course.originalPrice}</div>
                  </div>
                  <Button className="neu-button bg-gradient-to-r from-primary to-secondary text-white">
                    Daftar Sekarang
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Button
            size="lg"
            variant="outline"
            className="neu-button border-2 border-primary/20 px-8 py-4"
          >
            Lihat Semua Course
          </Button>
        </div>
      </div>
    </section>
  )
}
