import { Skeleton } from "@/components/ui/Skeleton";
import { Header } from "@/components/landing/Header";

export default function AccountLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-cream-100">
      <Header />
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="flex flex-col gap-8">
          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </section>
          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="space-y-4">
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          </section>
          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
