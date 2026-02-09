import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { ScrollProgress } from "@/components/landing/ScrollProgress";
import { BackToTop } from "@/components/landing/BackToTop";
import Link from "next/link";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";

export const metadata = {
  title: "Why Millets | Flint & Flours",
  description:
    "We chose millets not as a trend, but as a return to resilient grains that have nourished Indian kitchens for generations.",
};

export default function WhyMilletsPage() {
  return (
    <main className="min-h-screen bg-stone-50">
      <ScrollProgress />
      <Header />

      <article className="pb-20 md:pb-28">
        <header className="py-16 md:py-24">
          <div className="mx-auto max-w-3xl px-4">
            <Link
              href="/about"
              className="text-sm font-medium text-stone-500 hover:text-stone-700"
            >
              ← Back to About
            </Link>
            <h1 className="mt-4 font-serif text-4xl font-bold text-stone-900 md:text-5xl">
              Why Millets?
            </h1>
            <p className="mt-4 text-xl text-stone-700">
              We chose millets not as a trend, but as a return.
            </p>
          </div>
        </header>

        <div className="mx-auto max-w-3xl px-4">
          <div className="mb-12">
            <ImagePlaceholder
              description="Millet grains close-up or field of millet. Earthy, natural, nourishing aesthetic."
              aspectRatio="landscape"
            />
          </div>

          <div className="prose prose-lg prose-stone max-w-none space-y-6 text-stone-700">
            <p>
              For generations, millets were part of Indian kitchens—resilient
              grains, naturally diverse, deeply nourishing, and kind to the
              land.
            </p>
            <p>When thoughtfully prepared, millets offer:</p>
            <ul className="list-inside list-disc space-y-2">
              <li>Steady energy</li>
              <li>Natural fibre</li>
              <li>A lighter digestive experience</li>
              <li>Versatility for everyday meals</li>
            </ul>
            <p>
              Our work has been to bring these grains forward—respecting
              tradition, while applying modern food science to create textures,
              flavours, and formats that feel familiar and enjoyable today.
            </p>
            <p className="font-medium italic text-stone-900">
              Millets are not replacements. They are foundations.
            </p>
          </div>
        </div>
      </article>

      <Footer />
      <BackToTop />
    </main>
  );
}
