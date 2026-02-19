import { HeroBlock } from "@/components/blocks/hero-block"
import { FeaturesGrid } from "@/components/blocks/features-grid"
import { StatsSection } from "@/components/blocks/stats-section"
import { PricingBlock } from "@/components/blocks/pricing-block"
import { TestimonialMarquee } from "@/components/blocks/testimonial-marquee"
import { FAQSection } from "@/components/blocks/faq-section"
import { ContactForm } from "@/components/blocks/contact-form"
import { CTABlock } from "@/components/blocks/cta-block"

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <HeroBlock />
      <StatsSection />
      <FeaturesGrid />
      <PricingBlock />
      <TestimonialMarquee />
      <FAQSection />
      <ContactForm />
      <CTABlock />
    </main>
  )
}
