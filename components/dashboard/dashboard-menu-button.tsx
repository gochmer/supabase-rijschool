"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Sparkles, X } from "lucide-react";

import { dashboardNavigation } from "@/lib/navigation";
import type { GebruikersRol } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@/components/sign-out-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function DashboardMenuButton({
  role,
  roleLabel,
  today,
  className,
}: {
  role: GebruikersRol;
  roleLabel: string;
  today: string;
  className?: string;
}) {
  const pathname = usePathname();
  const items = dashboardNavigation[role];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Menu openen"
          className={cn(
            "flex size-9 items-center justify-center rounded-full text-slate-200 transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/35 focus-visible:outline-none",
            className,
          )}
        >
          <Menu className="size-5" />
        </button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="left-0 top-0 h-screen w-[21rem] max-w-[calc(100vw-1rem)] translate-x-0 translate-y-0 rounded-none border-r border-white/10 bg-[#0f0f0f] p-0 text-white shadow-[26px_0_90px_-48px_rgba(0,0,0,0.95)]"
      >
        <div className="flex h-full flex-col">
          <DialogHeader className="border-b border-white/10 px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[10px] font-semibold tracking-[0.2em] text-slate-300 uppercase">
                  <Sparkles className="size-3.5" />
                  {roleLabel}
                </div>
                <DialogTitle className="mt-3 text-xl font-semibold text-white">
                  Dashboardmenu
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm leading-6 text-slate-400">
                  Ga direct naar de juiste instructeurspagina. {today}
                </DialogDescription>
              </div>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-slate-300 hover:bg-white/10 hover:text-white"
                >
                  <X className="size-4" />
                  <span className="sr-only">Menu sluiten</span>
                </Button>
              </DialogClose>
            </div>
          </DialogHeader>

          <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {items.map((item) => {
              const active = pathname === item.href;

              return (
                <DialogClose key={item.href} asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-white/35 focus-visible:outline-none",
                      active
                        ? "bg-white text-slate-950"
                        : "bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    {item.label}
                  </Link>
                </DialogClose>
              );
            })}
          </nav>

          <div className="border-t border-white/10 p-4">
            <SignOutButton className="h-10 w-full rounded-xl border border-white/10 bg-white/10 text-white hover:bg-white/14" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
