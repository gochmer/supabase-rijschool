function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`loading-shimmer rounded-2xl border border-white/10 bg-white/[0.06] ${className}`}
    />
  );
}

export function InstructorProfileSkeleton() {
  return (
    <div className="space-y-4 text-white">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <SkeletonBlock className="h-8 w-40" />
          <SkeletonBlock className="h-4 w-96 max-w-full" />
        </div>
        <SkeletonBlock className="h-10 w-36" />
      </div>

      <SkeletonBlock className="h-[28rem]" />

      <div className="grid gap-4 xl:grid-cols-[0.78fr_1.22fr]">
        <SkeletonBlock className="h-72" />
        <SkeletonBlock className="h-72" />
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-28" />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SkeletonBlock className="h-64" />
        <SkeletonBlock className="h-64" />
      </div>

      <SkeletonBlock className="h-72" />
    </div>
  );
}
