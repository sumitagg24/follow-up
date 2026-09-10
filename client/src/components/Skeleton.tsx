export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200/70 ${className}`} aria-hidden="true" />;
}

export function SkeletonCard({ lines = 2 }: { lines?: number }) {
  return (
    <div className="bg-white rounded-2xl border p-4 space-y-3" role="status" aria-label="Loading content">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      {lines > 2 && <Skeleton className="h-4 w-1/2" />}
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="bg-white rounded-2xl border p-5 flex items-center justify-between" role="status" aria-label="Loading stat">
      <div className="space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-7 w-10" />
      </div>
      <Skeleton className="h-10 w-10 rounded-xl" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="bg-white rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3" role="status" aria-label="Loading row">
      <div className="space-y-2 flex-1">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}
