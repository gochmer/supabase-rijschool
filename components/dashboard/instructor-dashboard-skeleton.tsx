function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`loading-shimmer rounded-xl border border-white/10 bg-white/[0.06] ${className}`}
    />
  );
}

export function InstructorDashboardSkeleton() {
  return (
    <div className="space-y-3 text-white 2xl:space-y-4">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.045] p-4">
          <SkeletonBlock className="h-4 w-28" />
          <SkeletonBlock className="h-9 w-56 max-w-full" />
          <SkeletonBlock className="h-4 w-96 max-w-full" />
        </div>
        <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.045] p-3.5">
          <SkeletonBlock className="h-5 w-40" />
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            <SkeletonBlock className="h-9" />
            <SkeletonBlock className="h-9" />
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-22" />
        ))}
      </div>

      <SkeletonBlock className="h-64" />

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-3">
          <SkeletonBlock className="h-72" />
          <div className="grid gap-3 lg:grid-cols-2">
            <SkeletonBlock className="h-64" />
            <SkeletonBlock className="h-64" />
          </div>
        </div>
        <div className="space-y-3">
          <SkeletonBlock className="h-48" />
          <SkeletonBlock className="h-48" />
        </div>
      </div>
    </div>
  );
}
