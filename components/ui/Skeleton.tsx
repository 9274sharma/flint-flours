export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-stone-200 ${className}`}
      aria-hidden="true"
    />
  );
}

export function ReviewSkeleton() {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    </div>
  );
}

export function OrderRowSkeleton() {
  return (
    <tr className="border-b border-gray-200">
      <td className="px-4 py-3 text-sm">
        <Skeleton className="h-4 w-20" />
      </td>
      <td className="px-4 py-3 text-sm">
        <Skeleton className="h-4 w-28" />
      </td>
      <td className="px-4 py-3 text-sm">
        <Skeleton className="h-4 w-16" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-6 w-14 rounded-full" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-6 w-14 rounded-full" />
      </td>
      <td className="px-4 py-3 text-sm">
        <Skeleton className="h-4 w-8" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-8 w-8 rounded-lg" />
      </td>
    </tr>
  );
}
