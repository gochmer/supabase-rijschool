function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`loading-shimmer rounded-xl border border-white/10 bg-white/[0.06] ${className}`}
    />
  );
}

export default function InstructeurAanvragenLoading() {
  return (
    <div className="space-y-4 text-white 2xl:space-y-7">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <SkeletonBlock className="h-8 w-44 max-w-full" />
          <SkeletonBlock className="h-4 w-96 max-w-full" />
        </div>
        <SkeletonBlock className="h-12 w-44" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-28" />
        ))}
      </div>

      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <div className="mb-4 space-y-2">
          <SkeletonBlock className="h-6 w-44" />
          <SkeletonBlock className="h-4 w-80 max-w-full" />
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-8 w-28" />
            ))}
          </div>
          <div className="flex gap-3">
            <SkeletonBlock className="h-11 w-72 max-w-full" />
            <SkeletonBlock className="h-11 w-28" />
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <SkeletonBlock className="h-14" />
          {Array.from({ length: 7 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-16" />
          ))}
        </div>
      </section>
    </div>
  );
}
