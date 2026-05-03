function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`loading-shimmer rounded-xl border border-white/10 bg-white/[0.06] ${className}`}
    />
  );
}

export default function InstructeurLessenLoading() {
  return (
    <div className="grid gap-4 text-white xl:grid-cols-[18rem_minmax(0,1fr)]">
      <div className="space-y-3">
        <SkeletonBlock className="h-72" />
        <SkeletonBlock className="h-36" />
        <SkeletonBlock className="h-36" />
      </div>

      <div className="space-y-4">
        <section className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <SkeletonBlock className="h-4 w-28" />
              <SkeletonBlock className="h-8 w-44" />
              <SkeletonBlock className="h-4 w-80 max-w-full" />
            </div>
            <div className="flex gap-2">
              <SkeletonBlock className="h-10 w-36" />
              <SkeletonBlock className="h-10 w-28" />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-[3rem_repeat(7,minmax(5rem,1fr))] gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10">
            {Array.from({ length: 64 }).map((_, index) => (
              <div
                key={index}
                className="loading-shimmer h-10 bg-slate-900/80"
              />
            ))}
          </div>
        </section>

        <div className="grid gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-20" />
          ))}
        </div>

        <SkeletonBlock className="h-72" />
      </div>
    </div>
  );
}
