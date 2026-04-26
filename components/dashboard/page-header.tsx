import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  eyebrow = "Dashboard",
  tone = "default",
}: {
  title: string;
  description: string;
  actions?: React.ReactNode;
  eyebrow?: string;
  tone?: "default" | "hazard" | "urban";
}) {
  const now = new Intl.DateTimeFormat("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
  const isUrban = tone === "urban";
  const isHazard = tone === "hazard";

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[1.55rem] p-4 xl:p-5",
        isUrban
          ? "border border-white/10 bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(30,41,59,0.9),rgba(17,24,39,0.96))] shadow-[0_28px_90px_-45px_rgba(15,23,42,0.82)]"
          : isHazard
          ? "re-frame-flash re-scanlines border border-red-300/14 bg-[linear-gradient(145deg,rgba(8,10,14,0.98),rgba(18,9,12,0.98),rgba(52,14,18,0.9),rgba(31,22,25,0.9))] shadow-[0_28px_90px_-45px_rgba(0,0,0,0.82)]"
          : "border border-white/70 bg-white/82 shadow-[0_28px_90px_-45px_rgba(15,23,42,0.45)] backdrop-blur dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_28px_90px_-45px_rgba(15,23,42,0.72)]"
      )}
    >
      <div className="flex flex-col gap-3.5 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className={cn(
                "text-[11px] font-semibold tracking-[0.22em] uppercase",
                isUrban
                  ? "text-slate-200"
                  : isHazard
                    ? "text-red-100/86"
                    : "text-primary dark:text-sky-300"
              )}
            >
              {eyebrow}
            </p>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                isUrban
                  ? "border border-white/10 bg-white/6 text-slate-300"
                  : isHazard
                    ? "border border-red-300/12 bg-white/6 text-stone-300"
                  : "bg-slate-100 text-slate-600 dark:border dark:border-white/10 dark:bg-white/6 dark:text-slate-300"
              )}
            >
              {now}
            </span>
          </div>
          <h1
            className={cn(
              "text-[1.85rem] font-semibold tracking-tight sm:text-[2.15rem]",
              isUrban || isHazard ? "text-white" : "text-slate-950 dark:text-white"
            )}
          >
            {title}
          </h1>
          <p
            className={cn(
              "max-w-2xl text-[13px] leading-6 sm:text-sm",
              isUrban
                ? "text-slate-300"
                : isHazard
                  ? "text-stone-300"
                  : "text-muted-foreground dark:text-slate-300"
            )}
          >
            {description}
          </p>
        </div>
        {actions ? (
          <div className="grid gap-1.5 sm:flex sm:flex-wrap [&>*]:w-full sm:[&>*]:w-auto">
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}
