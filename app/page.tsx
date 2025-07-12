import { Hero } from '@/features/homepage/component/Heros'
import { Feature } from '@/features/homepage/component/Feature'
import { Courses } from '@/features/homepage/component/Course'
import { Stats } from '@/features/homepage/component/Stat'
import { Testimonials } from '@/features/homepage/component/Testimonial'
import { CTA } from '@/features/homepage/component/Cts'
import { Footer } from '@/features/homepage/component/Footers'
import { Navbar } from '@/features/homepage/component/Navbars'
import CustomCard from '@/features/homepage/component/CustomCard'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent-mint/5">
      <Navbar />
      <Hero />
      <CustomCard title="Welcome to Maguru" actionLabel="Get Started">
        <p>This is a custom card powered by your Tailwind v4 config.</p>
      </CustomCard>
      <Stats />
      <Feature />
      <Courses />
      <Testimonials />
      <CTA />
      <Footer />
    </main>
  )
}
