import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, NotebookPen } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { InstructorFeedbackTodoLesson } from "@/lib/types";
import { cn } from "@/lib/utils";

function getUrgencyBadge(lesson: InstructorFeedbackTodoLesson) {
  if (lesson.urgency === "urgent") {
    return {
      className: "border-rose-300/25 bg-rose-400/15 text-rose-100",
      label: "Urgent",
    };
  }

  if (lesson.urgency === "attention") {
    return {
      className: "border-amber-300/25 bg-amber-400/15 text-amber-100",
      label: lesson.open_label,
    };
  }

  return {
    className: "border-sky-300/20 bg-sky-400/12 text-sky-100",
    label: lesson.open_label,
  };
}

export function FeedbackTodoCard({
  className,
  items,
  limit = 3,
}: {
  className?: string;
  items: InstructorFeedbackTodoLesson[];
  limit?: number;
}) {
  const visibleItems = items.slice(0, limit);
  const urgentCount = items.filter((lesson) => lesson.urgency === "urgent").length;
  const oldestOpenLabel = items[0]?.open_label ?? null;

  return (
    <section
      className={cn(
        "rounded-xl border border-amber-300/18 bg-[linear-gradient(145deg,rgba(245,158,11,0.12),rgba(15,23,42,0.66),rgba(14,165,233,0.06))] p-4 text-white shadow-[0_20px_70px_-52px_rgba(0,0,0,0.95)]",
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex size-9 items-center justify-center rounded-lg border border-amber-200/20 bg-amber-300/12 text-amber-100">
              <NotebookPen className="size-4" />
            </span>
            <div>
              <p className="text-[10px] font-semibold tracking-[0.2em] text-amber-100/78 uppercase">
                Feedback nog te doen
              </p>
              <h3 className="mt-1 text-base font-semibold text-white">
                {items.length
                  ? `${items.length} afgeronde les${items.length === 1 ? "" : "sen"} zonder verslag`
                  : "Alle lesverslagen zijn bijgewerkt"}
              </h3>
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            {items.length
              ? "Rond deze lessen af met een korte samenvatting, sterk punt en focus voor de volgende keer."
              : "Geen open feedbackactie. Zodra je een les afrondt zonder verslag, verschijnt die hier."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {urgentCount ? (
            <Badge variant="danger">{urgentCount} urgent</Badge>
          ) : null}
          <Badge variant={items.length ? "warning" : "success"}>
            {items.length} open
          </Badge>
        </div>
      </div>

      {oldestOpenLabel ? (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-white/10 bg-slate-950/24 px-3 py-2 text-xs leading-5 text-slate-300">
          <AlertTriangle
            className={cn(
              "mt-0.5 size-4 shrink-0",
              urgentCount ? "text-rose-200" : "text-amber-200",
            )}
          />
          <span>
            Oudste open feedback:{" "}
            <span className="font-semibold text-white">{oldestOpenLabel}</span>.
            {urgentCount
              ? " Werk urgent gemarkeerde lessen eerst af."
              : " Houd je lesverslagen bij terwijl de les nog vers is."}
          </span>
        </div>
      ) : null}

      <div className="mt-4 space-y-2">
        {visibleItems.length ? (
          visibleItems.map((lesson) => {
            const urgencyBadge = getUrgencyBadge(lesson);

            return (
              <Link
                key={lesson.id}
                href={lesson.href}
                className={cn(
                  "grid gap-3 rounded-lg border border-white/10 bg-slate-950/26 p-3 transition hover:border-amber-200/24 hover:bg-amber-300/8 sm:grid-cols-[minmax(0,1fr)_auto]",
                  lesson.urgency === "urgent" &&
                    "border-rose-300/20 bg-rose-500/8 hover:border-rose-200/28 hover:bg-rose-400/10",
                )}
              >
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-semibold text-white">
                      {lesson.leerling_naam}
                    </span>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                        urgencyBadge.className,
                      )}
                    >
                      {urgencyBadge.label}
                    </span>
                  </span>
                  <span className="mt-1 block truncate text-[12px] text-slate-400">
                    {lesson.titel} - {lesson.datum} om {lesson.tijd}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-amber-100">
                  Verslag maken
                  <ArrowRight className="size-3.5" />
                </span>
              </Link>
            );
          })
        ) : (
          <div className="rounded-lg border border-emerald-300/18 bg-emerald-400/10 p-4 text-sm leading-6 text-emerald-100">
            <span className="inline-flex items-center gap-2 font-semibold">
              <CheckCircle2 className="size-4" />
              Geen vergeten feedback
            </span>
            <p className="mt-1 text-emerald-100/75">
              Je leerlingen hebben voor de afgeronde lessen een zichtbaar verslag.
            </p>
          </div>
        )}
      </div>

      {items.length > visibleItems.length ? (
        <p className="mt-3 text-xs text-slate-400">
          Nog {items.length - visibleItems.length} extra les
          {items.length - visibleItems.length === 1 ? "" : "sen"} open.
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4">
        <Button
          asChild
          variant="outline"
          className="h-9 rounded-full border-white/10 bg-white/7 px-3 text-xs text-white hover:bg-white/12"
        >
          <Link href="/instructeur/leerlingen">Voortgang openen</Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-9 rounded-full border-white/10 bg-white/7 px-3 text-xs text-white hover:bg-white/12"
        >
          <Link href="/instructeur/lessen">Lessen bekijken</Link>
        </Button>
      </div>
    </section>
  );
}
