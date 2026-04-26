export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_26%),radial-gradient(circle_at_18%_38%,_rgba(99,102,241,0.12),_transparent_24%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_50%,#f8fafc_100%)] px-4 py-6 sm:px-6 xl:px-8">
      <div className="mx-auto grid max-w-[1440px] items-start gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <div className="min-w-0 overflow-hidden rounded-[2.2rem] border border-white/70 bg-white/72 p-5">
          <div className="loading-shimmer h-12 rounded-2xl bg-slate-100" />
          <div className="mt-6 loading-shimmer h-24 rounded-[1.8rem] bg-slate-100" />
          <div className="mt-6 grid gap-3">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="loading-shimmer h-14 rounded-[1.4rem] bg-slate-100" />
            ))}
          </div>
        </div>
        <div className="min-w-0 space-y-6 rounded-[2.2rem] border border-white/50 bg-white/36 p-3">
          <div className="loading-shimmer h-40 rounded-[2.2rem] bg-white/80" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="loading-shimmer h-44 rounded-[1.8rem] bg-white/80" />
            ))}
          </div>
          <div className="grid gap-4 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="loading-shimmer h-40 rounded-[1.8rem] bg-white/80" />
            ))}
          </div>
          <div className="loading-shimmer h-96 rounded-[2rem] bg-white/80" />
        </div>
      </div>
    </div>
  );
}
