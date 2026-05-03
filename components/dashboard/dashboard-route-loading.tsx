function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`loading-shimmer rounded-xl border border-white/10 bg-white/[0.06] ${className}`}
    />
  );
}

export function DashboardRouteLoading({
  compactSidebar = false,
}: {
  compactSidebar?: boolean;
}) {
  return (
    <div className="grid gap-4 text-white xl:grid-cols-[18rem_minmax(0,1fr)]">
      <div className="hidden space-y-3 xl:block">
        <SkeletonBlock className={compactSidebar ? "h-60" : "h-72"} />
        <SkeletonBlock className="h-32" />
        <SkeletonBlock className="h-32" />
      </div>

      <div className="min-w-0 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="h-8 w-56 max-w-full" />
            <SkeletonBlock className="h-4 w-96 max-w-full" />
          </div>
          <SkeletonBlock className="h-10 w-36" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-24" />
          ))}
        </div>

        <SkeletonBlock className="h-[28rem]" />
      </div>
    </div>
  );
}
