interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className = "",
  variant = "rectangular",
  width,
  height,
}: SkeletonProps) {
  const variantClasses = {
    text: "h-4 rounded-full",
    circular: "rounded-full",
    rectangular: "rounded-xl",
  };

  return (
    <div
      className={`skeleton-shimmer ${variantClasses[variant]} ${className}`}
      style={{
        width: width ?? "100%",
        height: height ?? (variant === "text" ? "1rem" : "1.5rem"),
      }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="slaky-card p-5 space-y-3" role="status" aria-label="Loading content">
      <Skeleton width="40%" height="1rem" />
      <Skeleton width="100%" />
      <Skeleton width="80%" />
      {lines > 3 && <Skeleton width="60%" />}
      {lines > 4 && <Skeleton width="75%" />}
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="slaky-card p-5 flex items-start justify-between" role="status" aria-label="Loading stat">
      <div className="space-y-2.5">
        <Skeleton variant="text" width="5rem" />
        <Skeleton variant="text" width="3rem" />
      </div>
      <Skeleton variant="circular" width="36px" height="36px" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="slaky-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3" role="status" aria-label="Loading row">
      <div className="space-y-2 flex-1">
        <Skeleton width="60%" />
        <Skeleton width="100%" />
      </div>
      <div className="flex gap-2">
        <Skeleton width="80px" height="32px" />
        <Skeleton width="80px" height="32px" />
      </div>
    </div>
  );
}
