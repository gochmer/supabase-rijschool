import Link from "next/link";
import { ArrowRight } from "lucide-react";

type QuickAction = {
  href: string;
  label: string;
  title: string;
  description: string;
};

export function QuickActionGrid({
  items,
}: {
  items: QuickAction[];
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="group min-w-0 rounded-[1.35rem] border border-white/70 bg-white/84 p-4 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.32)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_34px_90px_-42px_rgba(15,23,42,0.42)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_24px_80px_-42px_rgba(15,23,42,0.62)] dark:hover:shadow-[0_34px_90px_-42px_rgba(15,23,42,0.7)]"
        >
          <p className="text-[11px] font-semibold tracking-[0.2em] text-primary uppercase dark:text-sky-300">
            {item.label}
          </p>
          <h3 className="mt-2 text-[1rem] font-semibold text-slate-950 dark:text-white">{item.title}</h3>
          <p className="mt-1.5 text-[13px] leading-6 text-muted-foreground dark:text-slate-300">
            {item.description}
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-950 dark:text-slate-100">
            Openen
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      ))}
    </div>
  );
}
