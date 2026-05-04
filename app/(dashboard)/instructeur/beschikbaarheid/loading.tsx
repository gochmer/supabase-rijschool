function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`loading-shimmer rounded-xl border border-white/10 bg-white/[0.06] ${className}`}
    />
  );
}

export default function InstructeurBeschikbaarheidLoading() {
  return (
    <div className="space-y-4 text-white 2xl:space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <SkeletonBlock className="h-8 w-52 max-w-full" />
          <SkeletonBlock className="h-4 w-96 max-w-full" />
        </div>
        <SkeletonBlock className="h-11 w-48" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-24" />
        ))}
      </div>

      <section className="grid gap-4 xl:grid-cols-[0.85fr_1.8fr]">
        <div className="space-y-4">
          <SkeletonBlock className="h-64" />
          <SkeletonBlock className="h-56" />
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <div className="mb-5 space-y-2">
            <SkeletonBlock className="h-6 w-44" />
            <SkeletonBlock className="h-4 w-80 max-w-full" />
          </div>
          <div className="grid grid-cols-[3rem_repeat(7,minmax(5rem,1fr))] gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10">
            {Array.from({ length: 80 }).map((_, index) => (
              <div
                key={index}
                className="loading-shimmer h-9 bg-slate-900/80"
              />
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-56" />
        ))}
      </div>
    </div>
  );
}
