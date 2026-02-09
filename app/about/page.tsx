import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { ScrollProgress } from "@/components/landing/ScrollProgress";
import { BackToTop } from "@/components/landing/BackToTop";
import Link from "next/link";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";

export const metadata = {
  title: "About | Flint & Flours",
  description:
    "Liora Artisan Pvt Ltd is building India's most trusted clean-label food science company.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-stone-50">
      <ScrollProgress />
      <Header />

      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="font-serif text-4xl font-bold text-stone-900 md:text-5xl">
            About Flint & Flours
          </h1>
          <p className="mt-6 text-xl text-stone-600">
            Liora Artisan Pvt Ltd is building India&apos;s most trusted
            clean-label food science company—where every product is
            founder-approved, ingredient-honest, and made for everyday
            nourishment without compromise.
          </p>
        </div>
      </section>

      <section className="border-t border-stone-200 bg-white py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-12 md:grid-cols-3">
            <Link
              href="/about/story"
              className="group rounded-2xl border border-stone-200 bg-stone-50 p-8 transition hover:border-stone-400 hover:shadow-lg"
            >
              <h2 className="font-serif text-xl font-semibold text-stone-900">
                Our Story
              </h2>
              <p className="mt-3 text-stone-600">
                A Doctor. A Kitchen. Everyday Life. How Liora Artisan was born
                from a simple truth learned over years of medical practice.
              </p>
              <span className="mt-4 inline-block font-medium text-stone-900 group-hover:underline">
                Read our story →
              </span>
            </Link>
            <Link
              href="/about/why-millets"
              className="group rounded-2xl border border-stone-200 bg-stone-50 p-8 transition hover:border-stone-400 hover:shadow-lg"
            >
              <h2 className="font-serif text-xl font-semibold text-stone-900">
                Why Millets
              </h2>
              <p className="mt-3 text-stone-600">
                We chose millets not as a trend, but as a return to resilient
                grains that have nourished Indian kitchens for generations.
              </p>
              <span className="mt-4 inline-block font-medium text-stone-900 group-hover:underline">
                Learn more →
              </span>
            </Link>
            <Link
              href="/about/founder"
              className="group rounded-2xl border border-stone-200 bg-stone-50 p-8 transition hover:border-stone-400 hover:shadow-lg"
            >
              <h2 className="font-serif text-xl font-semibold text-stone-900">
                Founder
              </h2>
              <p className="mt-3 text-stone-600">
                The Founder&apos;s Manifesto and Seal of Science—every
                ingredient personally reviewed against clean food standards.
              </p>
              <span className="mt-4 inline-block font-medium text-stone-900 group-hover:underline">
                Meet the founder →
              </span>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-stone-200 py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-center font-serif text-2xl font-semibold text-stone-900">
            Our values
          </h2>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {[
              "Clean-label",
              "Daily food",
              "Ingredient honesty",
              "Thoughtfully made",
              "Founder-approved",
              "Balanced indulgence",
              "Modern nourishment",
              "Food with purpose",
            ].map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-stone-200 px-4 py-2 text-stone-800"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-stone-200 bg-white py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-4">
          <ImagePlaceholder
            description="Team photo or bakery/kitchen behind-the-scenes. Warm, candid shot of people at work."
            aspectRatio="landscape"
            className="mx-auto max-w-3xl"
          />
        </div>
      </section>

      <Footer />
      <BackToTop />
    </main>
  );
}
