export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef4ff_52%,#f8fafc_100%)] px-4 py-5 sm:px-6 xl:px-8">
      <div className="mx-auto grid max-w-[1440px] items-start gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
        <div className="surface-panel min-w-0 overflow-hidden rounded-[1.55rem] p-5">
          <div className="loading-shimmer h-12 rounded-2xl bg-slate-100" />
          <div className="mt-6 loading-shimmer h-24 rounded-[1.25rem] bg-slate-100" />
          <div className="mt-6 grid gap-3">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="loading-shimmer h-14 rounded-[1rem] bg-slate-100" />
            ))}
          </div>
        </div>
        <div className="min-w-0 space-y-5 rounded-[1.65rem] border border-white/55 bg-white/45 p-3">
          <div className="loading-shimmer h-40 rounded-[1.25rem] bg-white/80" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="loading-shimmer h-44 rounded-[1.25rem] bg-white/80" />
            ))}
          </div>
          <div className="grid gap-4 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="loading-shimmer h-40 rounded-[1.25rem] bg-white/80" />
            ))}
          </div>
          <div className="loading-shimmer h-96 rounded-[1.25rem] bg-white/80" />
        </div>
      </div>
    </div>
  );
}
