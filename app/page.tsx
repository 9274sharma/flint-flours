"use client";

import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { WhyNoSection } from "@/components/landing/WhyNoSection";
import { TeaserSection } from "@/components/landing/TeaserSection";
import { ReviewsCarousel } from "@/components/landing/ReviewsCarousel";
import { SubBrandsSection } from "@/components/landing/SubBrandsSection";
import { ImageGallery } from "@/components/landing/ImageGallery";
import { Footer } from "@/components/landing/Footer";
import { ScrollProgress } from "@/components/landing/ScrollProgress";
import { BackToTop } from "@/components/landing/BackToTop";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { FeaturedProductsSection } from "@/components/landing/FeaturedProductsSection";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-stone-50">
      <ScrollProgress />
      <Header />
      <HeroSection />

      <WhyNoSection />

      <FeaturedProductsSection />

      {/* Our Story teaser */}
      <section className="border-t border-stone-200 bg-stone-50">
        <TeaserSection
          title="Our Story"
          excerpt="Most health is shaped not in clinics, but in everyday choices. A Doctor. A Kitchen. Everyday Life. How Liora Artisan was born from a simple truth learned over years of medical practice."
          href="/about/story"
          ctaText="Read our story"
          image={
            <ImagePlaceholder
              description="Founder in kitchen or consultation room. Warm, candid shot."
              aspectRatio="landscape"
            />
          }
        />
      </section>

      {/* Why Millets teaser */}
      <section className="border-t border-stone-200 bg-white">
        <TeaserSection
          title="Why Millets?"
          excerpt="We chose millets not as a trend, but as a return. Resilient grains, naturally diverse, deeply nourishing—steady energy, natural fibre, and versatility for everyday meals. Millets are not replacements. They are foundations."
          href="/about/why-millets"
          ctaText="Learn more"
          image={
            <ImagePlaceholder
              description="Millet grains or field. Earthy, natural aesthetic."
              aspectRatio="square"
            />
          }
          reverse
        />
      </section>

      {/* Customer reviews carousel */}
      <ReviewsCarousel />

      {/* Founder teaser */}
      <section className="border-t border-stone-200 bg-stone-50">
        <TeaserSection
          title="Founder's Seal of Science™"
          excerpt="Every ingredient, formulation, and process has been personally reviewed against science-backed clean food standards. If I wouldn't recommend it to my own family, it doesn't leave our kitchen."
          href="/about/founder"
          ctaText="Meet the founder"
          image={
            <ImagePlaceholder
              description="Founder portrait. Warm, professional headshot."
              aspectRatio="portrait"
            />
          }
        />
      </section>

      {/* Sub-brands */}
      <SubBrandsSection />

      {/* Image gallery */}
      <ImageGallery />

      <Footer />
      <BackToTop />
    </main>
  );
}
