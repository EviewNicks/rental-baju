import { Zap, Shield, Headphones, Trophy, Users, BookOpen } from 'lucide-react'

export function Feature() {
  const features = [
    {
      icon: Zap,
      title: 'Learning Path Terarah',
      description:
        'Kurikulum terstruktur yang dirancang khusus untuk mengoptimalkan proses pembelajaran Anda.',
      color: 'from-primary to-primary/80',
    },
    {
      icon: Shield,
      title: 'Sertifikat Resmi',
      description:
        'Dapatkan sertifikat yang diakui industri setelah menyelesaikan course dengan nilai memuaskan.',
      color: 'from-secondary to-secondary/80',
    },
    {
      icon: Headphones,
      title: 'Mentor Support 24/7',
      description:
        'Akses langsung ke mentor expert untuk konsultasi dan bantuan kapan saja Anda butuhkan.',
      color: 'from-accent-mint to-accent-mint/80',
    },
    {
      icon: Trophy,
      title: 'Project-Based Learning',
      description:
        'Belajar sambil praktik dengan project nyata yang bisa langsung ditambahkan ke portfolio.',
      color: 'from-accent-orange to-accent-orange/80',
    },
    {
      icon: Users,
      title: 'Community Learning',
      description:
        'Bergabung dengan komunitas learner aktif untuk sharing knowledge dan networking.',
      color: 'from-primary to-secondary',
    },
    {
      icon: BookOpen,
      title: 'Lifetime Access',
      description:
        'Akses selamanya ke semua materi course yang sudah Anda beli, termasuk update terbaru.',
      color: 'from-secondary to-accent-mint',
    },
  ]

  return (
    <section id="features" className="py-20 px-4">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold">
            Kenapa Pilih{' '}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Maguru?
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Platform pembelajaran online terlengkap dengan fitur-fitur canggih yang dirancang khusus
            untuk memaksimalkan hasil belajar Anda.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="glass-panel p-6 rounded-xl hover:shadow-neu transition-all duration-300 group animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="space-y-4">
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
