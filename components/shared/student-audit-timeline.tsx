import type { StudentAuditTimelineEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

const toneClassNames: Record<StudentAuditTimelineEvent["tone"], string> = {
  danger: "bg-red-400 shadow-[0_0_0_4px_rgba(248,113,113,0.16)]",
  info: "bg-sky-400 shadow-[0_0_0_4px_rgba(56,189,248,0.14)]",
  success: "bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.14)]",
  warning: "bg-amber-400 shadow-[0_0_0_4px_rgba(251,191,36,0.16)]",
};

export function StudentAuditTimeline({
  className,
  events = [],
  limit = 6,
  title = "Pakket-tijdlijn",
}: {
  className?: string;
  events?: StudentAuditTimelineEvent[];
  limit?: number;
  title?: string;
}) {
  const visibleEvents = events.slice(0, limit);

  return (
    <section
      className={cn(
        "rounded-[1.25rem] border border-slate-200 bg-slate-50/82 p-4 dark:border-white/10 dark:bg-white/[0.035]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">
            {title}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
            Laatste pakket-, betaling- en planningsacties.
          </p>
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300">
          {events.length}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {visibleEvents.length ? (
          visibleEvents.map((event) => (
            <div
              key={event.id}
              className="grid grid-cols-[0.75rem_minmax(0,1fr)] gap-3"
            >
              <span
                className={cn(
                  "mt-1.5 size-2.5 rounded-full",
                  toneClassNames[event.tone],
                )}
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">
                    {event.title}
                  </p>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-500">
                    {event.createdAtLabel}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                  {event.detail}
                </p>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-500">
                  Door {event.actorLabel}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-3 text-xs leading-5 text-slate-500 dark:border-white/12 dark:bg-white/[0.035] dark:text-slate-400">
            Nog geen pakket-audit. Zodra een pakket wordt gekoppeld, vervangen,
            betaald of losgekoppeld, verschijnt dat hier.
          </div>
        )}
      </div>
    </section>
  );
}
