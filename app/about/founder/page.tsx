import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { ScrollProgress } from "@/components/landing/ScrollProgress";
import { BackToTop } from "@/components/landing/BackToTop";
import Link from "next/link";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";

export const metadata = {
  title: "Founder | Flint & Flours",
  description:
    "The Founder's Manifesto and Seal of Science—every ingredient personally reviewed against clean food standards.",
};

export default function FounderPage() {
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
              Founder
            </h1>
            <p className="mt-4 text-xl text-stone-700">
              Founder&apos;s Manifesto & Seal of Science™
            </p>
          </div>
        </header>

        <div className="mx-auto max-w-3xl px-4">
          <div className="mb-12">
            <ImagePlaceholder
              description="Founder portrait. Warm, professional headshot or candid in kitchen. Approachable and trustworthy."
              aspectRatio="portrait"
              className="mx-auto max-w-sm"
            />
          </div>

          <div className="prose prose-lg prose-stone max-w-none space-y-6 text-stone-700">
            <p>
              I started Liora Artisan with a simple belief: food can nourish,
              comfort, and delight—at the same time.
            </p>
            <p>
              Food has always been more than sustenance in our culture. It is
              care. It is routine. It is memory. And it deserves to be made with
              respect.
            </p>
            <p>
              At Liora Artisan, we choose to work with ingredients that have
              stood the test of time—millets, grains, nuts, fruits, and natural
              sweeteners—and bring them forward with modern understanding and
              thoughtful craft.
            </p>
            <p>Every product we create begins with intention:</p>
            <ul className="list-inside list-disc space-y-2">
              <li>To support everyday nourishment</li>
              <li>To be gentle on the body</li>
              <li>To feel good before, during, and after eating</li>
            </ul>
            <p>
              We believe clarity builds confidence. So we keep our labels clean,
              our processes transparent, and our formulations purposeful.
            </p>
            <p>
              We believe taste is essential. Good food should be enjoyed,
              shared, and looked forward to—not treated as a compromise.
            </p>
            <p>
              We believe responsibility matters. Which is why every recipe is
              reviewed with care, balancing tradition, science, and real-life
              eating habits.
            </p>
            <p>
              Above all, we believe trust is built slowly—through consistency,
              honesty, and respect for the people we serve.
            </p>
            <p className="font-medium italic text-stone-900">
              Our food is made to be part of daily life. Thoughtful, balanced,
              and deeply considered. This is our way of working. This is our
              craft. This is Liora Artisan. — Founder
            </p>
          </div>

          <section className="mt-16 rounded-2xl border border-stone-200 bg-white p-8 md:p-12">
            <h2 className="font-serif text-2xl font-semibold text-stone-900">
              Founder Seal of Science™
            </h2>
            <div className="mt-8 space-y-6">
              <p className="font-serif text-lg italic text-stone-700">
                &ldquo;Every ingredient, formulation, and process has been
                personally reviewed against my science-backed clean food
                standards.&rdquo;
              </p>
              <p className="font-serif text-lg italic text-stone-700">
                &ldquo;If I wouldn&apos;t recommend it to my own family, it
                doesn&apos;t leave our kitchen.&rdquo;
              </p>
            </div>
            <p className="mt-6 text-stone-600">— Founder, Liora Artisan</p>
          </section>
        </div>
      </article>

      <Footer />
      <BackToTop />
    </main>
  );
}
