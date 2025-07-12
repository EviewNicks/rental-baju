import { TrendingUp, Users, Award, Clock } from 'lucide-react'

export function Stats() {
  const stats = [
    {
      icon: Users,
      value: '50,000+',
      label: 'Active Students',
      color: 'text-primary',
    },
    {
      icon: Award,
      value: '500+',
      label: 'Expert Courses',
      color: 'text-secondary',
    },
    {
      icon: TrendingUp,
      value: '95%',
      label: 'Success Rate',
      color: 'text-accent-mint',
    },
    {
      icon: Clock,
      value: '24/7',
      label: 'Learning Support',
      color: 'text-accent-orange',
    },
  ]

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto">
        <div className="glass-panel p-8 rounded-2xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="text-center space-y-4 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div
                  className={`w-12 h-12 ${stat.color} bg-current/10 rounded-xl flex items-center justify-center mx-auto`}
                >
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="space-y-1">
                  <div className="text-2xl lg:text-3xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
