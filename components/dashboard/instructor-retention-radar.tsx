"use client";

import Link from "next/link";
import { ArrowRight, ShieldAlert, Sparkles, UserRoundX } from "lucide-react";

import type { InstructorDashboardRadarInsights } from "@/lib/data/instructor-dashboard-radar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function renderItems(
  items: InstructorDashboardRadarInsights["reactivation"],
  emptyText: string
) {
  if (!items.length) {
    return (
      <div className="rounded-[1rem] border border-dashed border-slate-300/80 bg-white/80 p-4 text-sm leading-6 text-slate-600 dark:border-white/12 dark:bg-slate-950/20 dark:text-slate-300">
        {emptyText}
      </div>
    );
  }

  return items.map((item) => (
    <Link
      key={`${item.naam}-${item.label}`}
      href={item.href}
      className="group rounded-[1rem] border border-slate-200/80 bg-white/85 p-3 transition-all hover:border-slate-300/80 dark:border-white/10 dark:bg-slate-950/20 dark:hover:bg-white/8"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[14px] font-semibold text-slate-950 dark:text-white">
              {item.naam}
            </p>
            <Badge variant={item.badge}>{item.label}</Badge>
          </div>
          <p className="mt-2 text-[13px] leading-6 text-slate-600 dark:text-slate-300">
            {item.detail}
          </p>
        </div>
        <ArrowRight className="size-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  ));
}

export function InstructorRetentionRadar({
  insights,
}: {
  insights: InstructorDashboardRadarInsights;
}) {
  return (
    <section className="rounded-[1.8rem] border border-white/70 bg-white/90 p-5 shadow-[0_26px_86px_-48px_rgba(15,23,42,0.38)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.9),rgba(30,41,59,0.84),rgba(15,23,42,0.92))]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-primary uppercase dark:text-sky-300">
            Retentie en voortgang
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">
            Heractivatie, examenkans en uitvalsignalen
          </h2>
          <p className="mt-1.5 max-w-3xl text-[13px] leading-6 text-slate-600 dark:text-slate-300">
            Deze radar kijkt niet alleen naar planning, maar ook naar stille trajecten,
            leerlingen die bijna proefexamenklaar zijn en patronen die kunnen wijzen op no-show of afhaken.
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/instructeur/leerlingen">Open leerlingenwerkplek</Link>
        </Button>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <div className="rounded-[1.25rem] border border-slate-200/80 bg-slate-50/88 p-4 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center gap-2">
            <UserRoundX className="size-4 text-slate-500 dark:text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
              Heractivatie radar
            </h3>
          </div>
          <div className="mt-3 grid gap-3">
            {renderItems(
              insights.reactivation,
              "Er springen nu geen stille leerlingen uit. Je actieve werkplek blijft mooi in beweging."
            )}
          </div>
        </div>

        <div className="rounded-[1.25rem] border border-slate-200/80 bg-slate-50/88 p-4 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-slate-500 dark:text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
              Examenklaar kandidaten
            </h3>
          </div>
          <div className="mt-3 grid gap-3">
            {renderItems(
              insights.examReady,
              "Nog geen leerling zit nu duidelijk in de proefexamenzone. Eerst verder bouwen aan stabiliteit en examengerichte ritten."
            )}
          </div>
        </div>

        <div className="rounded-[1.25rem] border border-slate-200/80 bg-slate-50/88 p-4 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-4 text-slate-500 dark:text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
              No-show / uitval voorspelling
            </h3>
          </div>
          <div className="mt-3 grid gap-3">
            {renderItems(
              insights.noShowRisk,
              "Er zijn op dit moment geen sterke signalen dat een leerling dreigt af te haken of vaak niet zal komen opdagen."
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
