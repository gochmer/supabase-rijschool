import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function InsightPanel({
  title,
  description,
  items,
  tone = "default",
}: {
  title: string;
  description: string;
  items: Array<{ label: string; value: string; status?: string }>;
  tone?: "default" | "hazard" | "urban";
}) {
  const isUrban = tone === "urban";
  const isHazard = tone === "hazard";

  return (
    <div
      className={cn(
        "rounded-[1.35rem] p-4",
        isUrban
          ? "border border-white/10 bg-slate-950/84 text-white shadow-[0_24px_72px_-44px_rgba(15,23,42,0.78)]"
          : isHazard
          ? "re-frame-flash border border-red-300/12 bg-[linear-gradient(145deg,rgba(9,11,16,0.98),rgba(22,12,15,0.96),rgba(40,16,19,0.9))] text-white shadow-[0_28px_88px_-46px_rgba(0,0,0,0.72)]"
          : "surface-panel"
      )}
    >
      <h3 className={cn("text-lg font-semibold", isUrban || isHazard ? "text-white" : "text-slate-950 dark:text-white")}>
        {title}
      </h3>
      <p
        className={cn(
          "mt-1.5 text-[13px] leading-6",
          isUrban ? "text-slate-300" : isHazard ? "text-stone-300" : "text-muted-foreground dark:text-slate-300"
        )}
      >
        {description}
      </p>
      <div className="mt-3.5 grid gap-2">
        {items.map((item) => (
          <div
            key={item.label}
            className={cn(
              "flex flex-col items-start gap-2 rounded-[1rem] px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between",
              isUrban
                ? "border border-white/10 bg-white/7"
                : isHazard
                ? "border border-red-300/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.04),rgba(120,22,22,0.12))]"
                : "surface-muted"
            )}
          >
            <div className="min-w-0">
              <p
                className={cn(
                "text-[13px] font-medium",
                  isUrban || isHazard ? "text-white" : "text-slate-950 dark:text-white"
                )}
              >
                {item.label}
              </p>
              <p className={cn("text-[12px]", isUrban ? "text-slate-300" : isHazard ? "text-stone-300" : "text-muted-foreground dark:text-slate-300")}>
                {item.value}
              </p>
            </div>
            {item.status ? <Badge variant="info">{item.status}</Badge> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
