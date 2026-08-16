import { PublicHeader } from '@/components/public/public-header'
import { HeroSection } from '@/components/public/hero-section'
import { HowItWorks } from '@/components/public/how-it-works'
import { FeaturedBike } from '@/components/public/featured-bike'
import { WhyChoose } from '@/components/public/why-choose'
import { PricingSection } from '@/components/public/pricing-section'
import { FaqSection } from '@/components/public/faq-section'
import { ServiceArea } from '@/components/public/service-area'
import { FinalCta } from '@/components/public/final-cta'
import { SiteFooter } from '@/components/public/site-footer'

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main className="flex-1">
        <HeroSection />
        <HowItWorks />
        <FeaturedBike />
        <WhyChoose />
        <PricingSection />
        <ServiceArea />
        <FaqSection />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  )
}
