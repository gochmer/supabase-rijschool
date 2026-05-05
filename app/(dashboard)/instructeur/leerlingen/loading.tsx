function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`loading-shimmer rounded-xl border border-white/10 bg-white/[0.055] ${className}`}
    />
  );
}

export default function InstructeurLeerlingenLoading() {
  return (
    <div className="space-y-3 text-white 2xl:space-y-4">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.045] p-4">
          <SkeletonBlock className="h-5 w-36" />
          <SkeletonBlock className="h-9 w-56 max-w-full" />
          <SkeletonBlock className="h-4 w-[34rem] max-w-full" />
        </div>
        <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.045] p-3.5">
          <SkeletonBlock className="h-5 w-32" />
          <SkeletonBlock className="h-4 w-48 max-w-full" />
          <SkeletonBlock className="h-9 w-full" />
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.45fr)]">
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-24" />
            ))}
          </div>
          <SkeletonBlock className="h-72" />
        </div>

        <SkeletonBlock className="h-[30rem]" />
      </div>

      <SkeletonBlock className="h-16" />
      <SkeletonBlock className="h-[34rem]" />
    </div>
  );
}
