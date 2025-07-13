import { Navbar } from '@/features/homepage/component/Navbars'
import HeroSection from '@/features/homepage/component/HeroSection'
import CategoriesSection from '@/features/homepage/component/CategoriesSection'
import FeaturedItemsSection from '@/features/homepage/component/FeaturedItemsSection'
import StoreInfoSection from '@/features/homepage/component/StoreIntoSection'
import ContactSection from '@/features/homepage/component/ContactSection'
import Footer from '@/features/homepage/component/Footer'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
      <Navbar />
      <main>
        <HeroSection />
        <CategoriesSection />
        <FeaturedItemsSection />
        <StoreInfoSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  )
}
