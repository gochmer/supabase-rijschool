import Link from "next/link";

import { cn } from "@/lib/utils";

export function Logo({
  inverse = false,
  compact = false,
}: {
  inverse?: boolean;
  compact?: boolean;
}) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex max-w-full min-w-0 items-center font-semibold tracking-tight",
        compact ? "gap-2.5" : "gap-3",
        inverse ? "text-white" : "text-foreground",
      )}
    >
      <span
        className={cn(
          "relative flex items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#09090b,#7f1d1d,#ea580c)] font-bold text-white shadow-[0_18px_40px_-18px_rgba(185,28,28,0.42)]",
          compact ? "size-10 rounded-[1.15rem] text-[13px]" : "size-12 rounded-[1.35rem] text-sm",
        )}
      >
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.45),transparent_34%)]" />
        <span className="absolute inset-0 bg-[linear-gradient(145deg,transparent,rgba(255,255,255,0.1),transparent)]" />
        <span className="relative">RB</span>
      </span>
      <span className="flex min-w-0 flex-col leading-none">
        <span className={cn("truncate", compact ? "text-[1.02rem]" : "text-lg")}>RijBasis</span>
        {compact ? null : (
          <span
            className={cn(
              "mt-1 truncate text-[11px] font-medium tracking-[0.18em] uppercase",
              inverse ? "text-white/62" : "text-muted-foreground",
            )}
          >
            Premium rijschool software
          </span>
        )}
      </span>
    </Link>
  );
}
