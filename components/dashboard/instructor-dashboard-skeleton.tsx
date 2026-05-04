function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`loading-shimmer rounded-xl border border-white/10 bg-white/[0.06] ${className}`}
    />
  );
}

export function InstructorDashboardSkeleton() {
  return (
    <div className="space-y-4 text-white 2xl:space-y-7">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <SkeletonBlock className="h-4 w-28" />
          <SkeletonBlock className="h-9 w-56 max-w-full" />
          <SkeletonBlock className="h-4 w-96 max-w-full" />
        </div>
        <div className="flex gap-2">
          <SkeletonBlock className="h-10 w-36" />
          <SkeletonBlock className="h-10 w-32" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5 2xl:gap-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-24" />
        ))}
      </div>

      <SkeletonBlock className="h-72" />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.8fr)] 2xl:gap-6">
        <div className="space-y-4">
          <SkeletonBlock className="h-80" />
          <div className="grid gap-4 lg:grid-cols-2">
            <SkeletonBlock className="h-64" />
            <SkeletonBlock className="h-64" />
          </div>
        </div>
        <div className="space-y-4">
          <SkeletonBlock className="h-48" />
          <SkeletonBlock className="h-48" />
        </div>
      </div>
    </div>
  );
}
