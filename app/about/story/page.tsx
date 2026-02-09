import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { ScrollProgress } from "@/components/landing/ScrollProgress";
import { BackToTop } from "@/components/landing/BackToTop";
import Link from "next/link";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";

export const metadata = {
  title: "Our Story | Flint & Flours",
  description:
    "A Doctor. A Kitchen. Everyday Life. How Liora Artisan was born from a simple truth learned over years of medical practice.",
};

export default function StoryPage() {
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
              Our Story
            </h1>
            <p className="mt-4 text-xl font-medium text-stone-700">
              A Doctor. A Kitchen. Everyday Life.
            </p>
          </div>
        </header>

        <div className="mx-auto max-w-3xl px-4">
          <div className="mb-12">
            <ImagePlaceholder
              description="Founder in kitchen or consultation room. Warm, approachable portrait or candid shot."
              aspectRatio="landscape"
            />
          </div>

          <div className="prose prose-lg prose-stone max-w-none space-y-6 text-stone-700">
            <p>
              At the heart of Liora Artisan Private Limited is a simple truth
              learned over years of medical practice: Most health is shaped not
              in clinics, but in everyday choices.
            </p>
            <p>
              As a doctor and nutritionist, I met people at every stage of
              life—children, working adults, new parents, elders—all wanting the
              same thing: food that feels good, tastes good, and fits into daily
              life. Not prescriptions. Not extremes. Just better everyday food.
            </p>
            <p>
              That understanding slowly moved from the consultation room into
              the kitchen. Food, I realised, could become a quiet form of
              care—something you don&apos;t have to think about, calculate, or
              avoid. Something that supports the body gently, over time.
            </p>
            <p className="font-medium italic text-stone-900">
              That is how Liora Artisan was born.
            </p>
          </div>

          <section className="mt-16 border-t border-stone-200 pt-12">
            <h2 className="font-serif text-2xl font-semibold text-stone-900">
              From Medicine to Food
            </h2>
            <p className="mt-4 text-stone-700">
              I continue to practise medicine because health is personal. And I
              built this brand because food is universal. The same care that
              goes into a medical consultation goes into every formulation we
              create: ingredients chosen with intention, labels kept clear and
              honest, recipes balanced for real life. No shortcuts. No
              exaggeration. Just thoughtful craft.
            </p>
          </section>

          <section className="mt-12">
            <h2 className="font-serif text-2xl font-semibold text-stone-900">
              A Brand for Everyday Life
            </h2>
            <p className="mt-4 text-stone-700">
              Liora Artisan is not built for special occasions alone. It is
              built for the ordinary moments that shape health over time—morning
              breakfasts, afternoon snacks, shared meals, quiet routines. Food
              that can be part of daily life across ages, across generations,
              across changing times.
            </p>
          </section>
        </div>
      </article>

      <Footer />
      <BackToTop />
    </main>
  );
}
