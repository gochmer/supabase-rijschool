import {
  CalendarDays,
  ChevronDown,
  Clock3,
  MessageSquareText,
  PackageCheck,
  UserRound,
} from "lucide-react";

import { LearnerRequestActions } from "@/components/dashboard/learner-request-actions";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getRequestStatusLabel,
  getRequestStatusVariant,
  requestStatusTimeline,
} from "@/lib/lesson-request-flow";
import { getRijlesTypeLabel } from "@/lib/lesson-types";
import type { LesAanvraag } from "@/lib/types";
import { cn } from "@/lib/utils";

function getRequestTypeLabel(request: LesAanvraag) {
  if (request.pakket_naam?.trim()) {
    return request.pakket_naam.trim();
  }

  if (request.aanvraag_type === "proefles") {
    return "Proefles";
  }

  if (request.aanvraag_type === "pakket") {
    return "Pakketaanvraag";
  }

  return "Losse aanvraag";
}

function getRequestSubLabel(request: LesAanvraag) {
  const lessonTypeLabel = request.les_type
    ? getRijlesTypeLabel(request.les_type)
    : null;

  if (request.aanvraag_type === "proefles") {
    return lessonTypeLabel ? `${lessonTypeLabel} proefles` : "Proeflesmoment";
  }

  if (lessonTypeLabel) {
    return `${lessonTypeLabel} traject`;
  }

  return "Lesaanvraag";
}

function isTimelineStepActive(stepValue: LesAanvraag["status"], current: LesAanvraag["status"]) {
  const order = requestStatusTimeline.map((item) => item.value);
  const currentIndex = order.indexOf(current);
  const stepIndex = order.indexOf(stepValue);

  if (current === "geweigerd") {
    return stepValue === "aangevraagd" || stepValue === "geweigerd";
  }

  return stepIndex <= currentIndex;
}

export function LearnerRequestOverview({
  title,
  description,
  requests,
  tone = "default",
  emptyTitle = "Nog geen lesaanvragen",
  emptyDescription = "Zodra je een aanvraag verstuurt, verschijnt hier automatisch je volledige statusoverzicht.",
}: {
  title: string;
  description: string;
  requests: LesAanvraag[];
  tone?: "default" | "urban";
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const isUrban = tone === "urban";
  const openRequestCount = requests.filter(
    (request) => request.status === "aangevraagd"
  ).length;
  const plannedRequestCount = requests.filter((request) =>
    ["geaccepteerd", "ingepland"].includes(request.status)
  ).length;

  return (
    <Card
      className={cn(
        "shadow-[0_24px_80px_-42px_rgba(15,23,42,0.38)]",
        isUrban
          ? "border border-white/10 bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(30,41,59,0.9),rgba(17,24,39,0.96))] text-white shadow-[0_28px_88px_-46px_rgba(15,23,42,0.78)]"
          : "border border-white/70 bg-white/90 dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]"
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className={isUrban ? "text-white" : "text-slate-950 dark:text-white"}>
          {title}
        </CardTitle>
        <CardDescription
          className={cn(
            "text-[13px] leading-6",
            isUrban ? "text-slate-300" : "text-muted-foreground dark:text-slate-300"
          )}
        >
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {requests.length ? (
          <div className="space-y-3">
            <div
              className={cn(
                "flex flex-wrap items-center gap-2 rounded-[1.15rem] border p-3",
                isUrban
                  ? "border-white/10 bg-white/[0.04]"
                  : "border-slate-200/80 bg-slate-50/90 dark:border-white/10 dark:bg-white/[0.04]"
              )}
            >
              <Badge
                className={cn(
                  isUrban
                    ? "border border-white/10 bg-white/8 text-slate-100"
                    : "border border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/8 dark:text-slate-100"
                )}
              >
                {requests.length} totaal
              </Badge>
              <Badge
                variant={openRequestCount > 0 ? "warning" : "success"}
                className={cn(
                  isUrban
                    ? "border border-amber-300/20 bg-amber-400/12 text-amber-100"
                    : "border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-300/20 dark:bg-amber-400/10 dark:text-amber-100"
                )}
              >
                {openRequestCount} open
              </Badge>
              <Badge
                variant="info"
                className={cn(
                  isUrban
                    ? "border border-sky-300/20 bg-sky-400/12 text-sky-100"
                    : "border border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-300/20 dark:bg-sky-400/10 dark:text-sky-100"
                )}
              >
                {plannedRequestCount} in planning
              </Badge>
              <span
                className={cn(
                  "text-xs leading-5",
                  isUrban ? "text-slate-300" : "text-slate-500 dark:text-slate-400"
                )}
              >
                Open een aanvraag alleen wanneer je statusflow, bericht of acties nodig hebt.
              </span>
            </div>

            {requests.map((request) => {
              const requestTypeLabel = getRequestTypeLabel(request);
              const statusLabel = getRequestStatusLabel(request.status);
              const summaryItems = [
                {
                  icon: CalendarDays,
                  label: "Datum",
                  value: request.voorkeursdatum,
                },
                {
                  icon: Clock3,
                  label: "Tijd",
                  value: request.tijdvak,
                },
                {
                  icon: PackageCheck,
                  label: "Type",
                  value: requestTypeLabel,
                },
              ];

              return (
                <details
                  key={request.id}
                  className={cn(
                    "group overflow-hidden rounded-[1.35rem] border shadow-[0_18px_40px_-30px_rgba(15,23,42,0.26)]",
                    isUrban
                      ? "border-white/10 bg-[linear-gradient(140deg,rgba(255,255,255,0.04),rgba(148,163,184,0.08),rgba(15,23,42,0.32))] text-white"
                      : "border-slate-200/85 bg-slate-50/90 text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  )}
                >
                  <summary
                    className={cn(
                      "flex cursor-pointer list-none flex-col gap-3 p-3 outline-none transition sm:flex-row sm:items-center sm:justify-between sm:p-4 [&::-webkit-details-marker]:hidden",
                      isUrban ? "hover:bg-white/[0.04]" : "hover:bg-white/80 dark:hover:bg-white/[0.04]"
                    )}
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <div
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-2xl border",
                          isUrban
                            ? "border-white/10 bg-white/6 text-slate-100"
                            : "border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/8 dark:text-slate-100"
                        )}
                      >
                        <UserRound className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p
                            className={cn(
                              "truncate text-base font-semibold",
                              isUrban ? "text-white" : "text-slate-950 dark:text-white"
                            )}
                          >
                            {request.instructeur_naam || "Instructeur"}
                          </p>
                          <Badge
                            variant={getRequestStatusVariant(request.status)}
                            className="shrink-0 whitespace-nowrap"
                          >
                            {statusLabel}
                          </Badge>
                        </div>
                        <p
                          className={cn(
                            "mt-1 text-[13px] leading-5",
                            isUrban
                              ? "text-slate-300"
                              : "text-slate-600 dark:text-slate-300"
                          )}
                        >
                          {getRequestSubLabel(request)}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {summaryItems.map((item) => (
                            <span
                              key={`${request.id}-${item.label}`}
                              className={cn(
                                "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                                isUrban
                                  ? "border-white/10 bg-white/6 text-slate-100"
                                  : "border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/8 dark:text-slate-100"
                              )}
                            >
                              <item.icon className="size-3.5 shrink-0 opacity-75" />
                              <span className="truncate">{item.value}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <span
                      className={cn(
                        "inline-flex h-9 items-center justify-center gap-2 rounded-full border px-3 text-xs font-semibold transition",
                        isUrban
                          ? "border-white/10 bg-white/6 text-slate-100"
                          : "border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/8 dark:text-slate-100"
                      )}
                    >
                      Details
                      <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
                    </span>
                  </summary>

                  <div
                    className={cn(
                      "space-y-3 border-t p-3 sm:p-4",
                      isUrban ? "border-white/10" : "border-slate-200/80 dark:border-white/10"
                    )}
                  >
                    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.42fr)]">
                      <div
                        className={cn(
                          "rounded-[1.15rem] border p-3",
                          isUrban
                            ? "border-white/10 bg-white/[0.04]"
                            : "border-slate-200/80 bg-white/80 dark:border-white/10 dark:bg-white/[0.04]"
                        )}
                      >
                        <p
                          className={cn(
                            "text-[10px] font-semibold tracking-[0.16em] uppercase",
                            isUrban
                              ? "text-slate-300"
                              : "text-slate-500 dark:text-slate-400"
                          )}
                        >
                          Statusflow
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {requestStatusTimeline.map((step) => {
                            const active = isTimelineStepActive(
                              step.value,
                              request.status
                            );

                            return (
                              <span
                                key={`${request.id}-${step.value}`}
                                className={cn(
                                  "rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] uppercase",
                                  active
                                    ? isUrban
                                      ? "border-sky-300/24 bg-sky-400/12 text-sky-100"
                                      : "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-300/20 dark:bg-sky-400/10 dark:text-sky-100"
                                    : isUrban
                                      ? "border-white/10 bg-white/5 text-slate-400"
                                      : "border-slate-200 bg-slate-50 text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500"
                                )}
                              >
                                {step.label}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      <div
                        className={cn(
                          "rounded-[1.15rem] border p-3",
                          isUrban
                            ? "border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.03),rgba(148,163,184,0.06),rgba(15,23,42,0.24))]"
                            : "border-slate-200/80 bg-white/80 dark:border-white/10 dark:bg-white/[0.04]"
                        )}
                      >
                        <div className="mb-3 flex items-center gap-2">
                          <MessageSquareText
                            className={cn(
                              "size-4",
                              isUrban
                                ? "text-slate-300"
                                : "text-slate-500 dark:text-slate-300"
                            )}
                          />
                          <p
                            className={cn(
                              "text-[10px] font-semibold tracking-[0.16em] uppercase",
                              isUrban
                                ? "text-slate-300"
                                : "text-slate-500 dark:text-slate-400"
                            )}
                          >
                            Acties
                          </p>
                        </div>
                        <LearnerRequestActions
                          requestId={request.id}
                          status={request.status}
                        />
                      </div>
                    </div>

                    {request.bericht.trim() ? (
                      <div
                        className={cn(
                          "rounded-[1.15rem] border p-3",
                          isUrban
                            ? "border-white/10 bg-white/[0.04]"
                            : "border-slate-200/80 bg-white/80 dark:border-white/10 dark:bg-white/[0.04]"
                        )}
                      >
                        <p
                          className={cn(
                            "text-[10px] font-semibold tracking-[0.16em] uppercase",
                            isUrban
                              ? "text-slate-300"
                              : "text-slate-500 dark:text-slate-400"
                          )}
                        >
                          Bericht of toelichting
                        </p>
                        <p
                          className={cn(
                            "mt-2 whitespace-pre-line text-sm leading-7",
                            isUrban
                              ? "text-slate-200"
                              : "text-slate-700 dark:text-slate-200"
                          )}
                        >
                          {request.bericht}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </details>
              );
            })}
          </div>
        ) : (
          <div
            className={cn(
              "rounded-[1.35rem] border border-dashed p-5",
              isUrban
                ? "border-white/10 bg-white/4"
                : "border-border bg-slate-50/80 dark:border-white/10 dark:bg-white/5"
            )}
          >
            <h3
              className={cn(
                "text-base font-semibold",
                isUrban ? "text-white" : "text-slate-950 dark:text-white"
              )}
            >
              {emptyTitle}
            </h3>
            <p
              className={cn(
                "mt-1.5 max-w-xl text-[13px] leading-6",
                isUrban
                  ? "text-slate-300"
                  : "text-muted-foreground dark:text-slate-300"
              )}
            >
              {emptyDescription}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
