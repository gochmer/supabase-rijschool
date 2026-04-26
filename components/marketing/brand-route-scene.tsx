"use client";

import { motion, useReducedMotion } from "motion/react";
import { Compass, MapPin, Sparkles } from "lucide-react";

export function BrandRouteScene({
  showPanels = true,
}: {
  showPanels?: boolean;
}) {
  const reducedMotion = useReducedMotion();

  const pulseTransition = reducedMotion
    ? undefined
    : {
        duration: 4.2,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut" as const,
      };

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2.6rem]">
      <div className="absolute inset-[4%] rounded-[2.2rem] border border-white/40 bg-[linear-gradient(180deg,rgba(255,255,255,0.24),rgba(255,255,255,0.04))]" />
      <div className="absolute inset-x-[14%] top-[18%] h-px bg-[linear-gradient(90deg,rgba(186,230,253,0),rgba(186,230,253,0.9),rgba(186,230,253,0))]" />

      <svg
        viewBox="0 0 520 520"
        className="absolute inset-0 h-full w-full opacity-70"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="routeStroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(14,165,233,0.95)" />
            <stop offset="60%" stopColor="rgba(20,184,166,0.92)" />
            <stop offset="100%" stopColor="rgba(251,191,36,0.85)" />
          </linearGradient>
          <radialGradient id="routeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>

        <path
          d="M70 385C118 336 152 278 184 244C226 199 274 204 316 170C350 142 371 92 432 76"
          fill="none"
          stroke="url(#routeStroke)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="16 14"
          opacity="0.9"
        />
        <path
          d="M102 430C154 378 194 336 228 296C262 258 298 242 336 220"
          fill="none"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="6 10"
          opacity="0.75"
        />
        <circle cx="92" cy="402" r="28" fill="url(#routeGlow)" opacity="0.55" />
        <circle cx="336" cy="220" r="34" fill="url(#routeGlow)" opacity="0.38" />
        <circle cx="432" cy="76" r="34" fill="url(#routeGlow)" opacity="0.52" />
      </svg>

      <motion.div
        className="absolute left-[12%] top-[64%] flex size-14 items-center justify-center rounded-full border border-white/50 bg-white/16 text-white backdrop-blur"
        animate={reducedMotion ? undefined : { scale: [1, 1.08, 1], opacity: [0.82, 1, 0.82] }}
        transition={pulseTransition}
      >
        <MapPin className="size-5 text-sky-100" />
      </motion.div>

      <motion.div
        className="absolute right-[12%] top-[12%] flex size-16 items-center justify-center rounded-full border border-white/50 bg-white/16 text-white shadow-[0_20px_40px_-28px_rgba(15,23,42,0.55)] backdrop-blur"
        animate={reducedMotion ? undefined : { scale: [1, 1.06, 1], opacity: [0.88, 1, 0.88] }}
        transition={{
          ...pulseTransition,
          delay: reducedMotion ? undefined : 0.8,
        }}
      >
        <Compass className="size-6 text-white" />
      </motion.div>

      {showPanels ? (
        <>
          <div className="absolute left-[10%] top-[14%] rounded-[1.2rem] border border-white/35 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.08))] px-4 py-3 text-white shadow-[0_20px_42px_-28px_rgba(15,23,42,0.35)] backdrop-blur">
            <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.2em] text-sky-100 uppercase">
              <Sparkles className="size-3.5" />
              Match route
            </div>
            <p className="mt-2 text-sm font-semibold">Van regio naar rijles in een rustige flow</p>
          </div>

          <div className="absolute bottom-[10%] right-[8%] w-[11rem] rounded-[1.35rem] border border-white/35 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.06))] p-4 text-white shadow-[0_22px_50px_-32px_rgba(15,23,42,0.38)] backdrop-blur">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold tracking-[0.2em] text-sky-100 uppercase">
                Signatuur
              </span>
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
            </div>
            <p className="mt-2 text-[15px] font-semibold leading-6">
              Premium keuzegevoel vanaf de eerste scroll
            </p>
            <div className="mt-3 flex items-center gap-1.5">
              <span className="h-1.5 w-8 rounded-full bg-[linear-gradient(90deg,#0ea5e9,#14b8a6)]" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
