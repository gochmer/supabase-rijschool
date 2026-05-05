import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold shadow-xs",
  {
    variants: {
      variant: {
        default:
          "border-border/70 bg-secondary text-secondary-foreground dark:border-white/10 dark:bg-white/[0.075] dark:text-slate-200",
        success:
          "border-emerald-300/45 bg-emerald-100 text-emerald-700 dark:border-emerald-300/22 dark:bg-emerald-400/12 dark:text-emerald-100",
        warning:
          "border-amber-300/45 bg-amber-100 text-amber-700 dark:border-amber-300/22 dark:bg-amber-400/12 dark:text-amber-100",
        danger:
          "border-rose-300/45 bg-rose-100 text-rose-700 dark:border-rose-300/22 dark:bg-rose-400/12 dark:text-rose-100",
        info: "border-sky-300/45 bg-sky-100 text-sky-700 dark:border-sky-300/22 dark:bg-sky-400/12 dark:text-sky-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
