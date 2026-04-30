import { ArrowUpRight } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function MetricCard({
  label,
  waarde,
  context,
}: {
  label: string;
  waarde: string;
  context: string;
}) {
  return (
    <Card className="surface-panel group relative overflow-hidden transition-transform duration-300 hover:-translate-y-1">
      <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#0f172a,#2563eb,#38bdf8)] dark:bg-[linear-gradient(90deg,#e2e8f0,#38bdf8,#0ea5e9)]" />
      <div className="absolute -right-10 -top-10 size-28 rounded-full bg-sky-100/60 blur-2xl transition-transform duration-500 group-hover:scale-110 dark:bg-sky-400/14" />
      <CardHeader className="relative pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardDescription className="text-[12px] font-medium dark:text-slate-300">{label}</CardDescription>
          <div className="flex size-7 items-center justify-center rounded-full bg-slate-50 text-slate-500 dark:bg-white/8 dark:text-slate-300">
            <ArrowUpRight className="size-3.5" />
          </div>
        </div>
        <CardTitle className="text-[1.5rem] tracking-tight text-slate-950 dark:text-white sm:text-[1.8rem]">
          {waarde}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative pt-0 text-[13px] leading-6 text-muted-foreground dark:text-slate-300">
        {context}
      </CardContent>
    </Card>
  );
}
