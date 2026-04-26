import {
  CalendarDays,
  Clock3,
  MessageSquareText,
  PackageCheck,
  UserRound,
} from "lucide-react";

import { LearnerRequestActions } from "@/components/dashboard/learner-request-actions";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
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
          <div className="grid gap-3">
            {requests.map((request) => (
              <Card
                key={request.id}
                className={cn(
                  "rounded-[1.45rem] border py-0 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.22)]",
                  isUrban
                    ? "border-white/10 bg-[linear-gradient(140deg,rgba(255,255,255,0.04),rgba(148,163,184,0.08),rgba(15,23,42,0.32))] text-white"
                    : "border-slate-200/85 bg-slate-50/90 text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-white"
                )}
              >
                <CardHeader className="gap-3 border-b border-black/5 pb-4 dark:border-white/10">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex size-11 shrink-0 items-center justify-center rounded-2xl border",
                        isUrban
                          ? "border-white/10 bg-white/6 text-slate-100"
                          : "border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/8 dark:text-slate-100"
                      )}
                    >
                      <UserRound className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle
                        className={cn(
                          "text-base font-semibold",
                          isUrban ? "text-white" : "text-slate-950 dark:text-white"
                        )}
                      >
                        {request.instructeur_naam || "Instructeur"}
                      </CardTitle>
                      <CardDescription
                        className={cn(
                          "mt-1 text-[13px] leading-6",
                          isUrban
                            ? "text-slate-300"
                            : "text-slate-600 dark:text-slate-300"
                        )}
                      >
                        {getRequestSubLabel(request)}
                      </CardDescription>
                    </div>
                  </div>
                  <CardAction className="static sm:absolute sm:top-4 sm:right-4">
                    <Badge
                      variant={getRequestStatusVariant(request.status)}
                      className="whitespace-nowrap"
                    >
                      {getRequestStatusLabel(request.status)}
                    </Badge>
                  </CardAction>
                </CardHeader>

                <CardContent className="space-y-4 py-4">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                      {
                        icon: CalendarDays,
                        label: "Voorkeursdatum",
                        value: request.voorkeursdatum,
                      },
                      {
                        icon: Clock3,
                        label: "Tijdvak",
                        value: request.tijdvak,
                      },
                      {
                        icon: PackageCheck,
                        label: "Type of pakket",
                        value: getRequestTypeLabel(request),
                      },
                      {
                        icon: MessageSquareText,
                        label: "Status",
                        value: getRequestStatusLabel(request.status),
                      },
                    ].map((item) => (
                      <div
                        key={`${request.id}-${item.label}`}
                        className={cn(
                          "rounded-[1.1rem] border p-3",
                          isUrban
                            ? "border-white/10 bg-white/[0.04]"
                            : "border-slate-200/80 bg-white/80 dark:border-white/10 dark:bg-white/[0.04]"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <item.icon
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
                            {item.label}
                          </p>
                        </div>
                        <p
                          className={cn(
                            "mt-2 text-sm leading-6 font-medium",
                            isUrban
                              ? "text-white"
                              : "text-slate-800 dark:text-slate-100"
                          )}
                        >
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div
                    className={cn(
                      "rounded-[1.15rem] border p-4",
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
                        const active = isTimelineStepActive(step.value, request.status);
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

                  {request.bericht.trim() ? (
                    <div
                      className={cn(
                        "rounded-[1.15rem] border p-4",
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

                  <div
                    className={cn(
                      "flex flex-col gap-2 rounded-[1.15rem] border p-4 sm:flex-row sm:items-center sm:justify-between",
                      isUrban
                        ? "border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.03),rgba(148,163,184,0.06),rgba(15,23,42,0.24))]"
                        : "border-slate-200/80 bg-white/80 dark:border-white/10 dark:bg-white/[0.04]"
                    )}
                  >
                    <div>
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
                      <p
                        className={cn(
                          "mt-1 text-sm leading-6",
                          isUrban
                            ? "text-slate-300"
                            : "text-slate-600 dark:text-slate-300"
                        )}
                      >
                        Verplaats of annuleer alleen open aanvragen. Zodra een
                        instructeur reageert, loopt de status hier vanzelf mee.
                      </p>
                    </div>
                    <div className="sm:shrink-0">
                      <LearnerRequestActions
                        requestId={request.id}
                        status={request.status}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
