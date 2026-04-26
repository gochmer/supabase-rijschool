export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-[2.2rem] border border-white/70 bg-white/82 p-6 shadow-[0_28px_90px_-45px_rgba(15,23,42,0.35)]">
        <div className="loading-shimmer h-10 w-40 rounded-full bg-slate-100" />
        <div className="mt-5 loading-shimmer h-28 rounded-[1.8rem] bg-slate-100" />
        <div className="mt-4 grid gap-3">
          <div className="loading-shimmer h-16 rounded-[1.5rem] bg-slate-100" />
          <div className="loading-shimmer h-16 rounded-[1.5rem] bg-slate-100" />
          <div className="loading-shimmer h-16 rounded-[1.5rem] bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
