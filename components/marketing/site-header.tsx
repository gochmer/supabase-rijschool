"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, X } from "lucide-react";
import { useState } from "react";

import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { publicNavigation } from "@/lib/navigation";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname.startsWith(href);
}

export function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [mobileOpen, setMobileOpen] = useState(false);
  const headerNavigation = publicNavigation.filter((item) => item.href !== "/contact");

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-4 lg:px-8">
      <div className="site-shell mx-auto w-full">
        <div
          className={cn(
            "relative overflow-hidden rounded-[1.35rem] border px-3.5 py-2.5 backdrop-blur-2xl sm:px-4 sm:py-3",
            "border-white/12 bg-[linear-gradient(135deg,rgba(2,6,23,0.94),rgba(15,23,42,0.9),rgba(30,64,175,0.26))] shadow-[0_22px_70px_-44px_rgba(15,23,42,0.5)]",
            !isHome && "shadow-[0_20px_60px_-42px_rgba(15,23,42,0.38)]",
          )}
        >
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.7),transparent)]" />

          <div className="relative flex items-center justify-between gap-4 xl:grid xl:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_auto] xl:gap-4">
            <div className="flex min-w-0 items-center xl:min-h-[3rem] xl:shrink-0">
              <Logo inverse compact />
            </div>

            <div className="hidden min-w-0 xl:flex xl:justify-center">
              <nav className="flex w-full max-w-fit items-center justify-center gap-1 rounded-[1rem] border border-white/10 bg-white/6 p-1 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.4)]">
                {headerNavigation.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group relative flex items-center justify-center overflow-hidden rounded-[0.82rem] px-3 py-2 text-[0.75rem] font-semibold tracking-[0.1em] uppercase transition-all duration-200",
                        active
                          ? "bg-white text-slate-950 shadow-[0_12px_28px_-18px_rgba(255,255,255,0.3)]"
                          : "text-white/74 hover:bg-white/10 hover:text-white",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute bottom-1.5 left-1/2 h-[2px] -translate-x-1/2 rounded-full transition-all duration-200",
                          active ? "w-8 bg-sky-500" : "w-0 bg-white/70 group-hover:w-6",
                        )}
                      />
                      <span className="relative z-10">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="hidden items-center gap-2 xl:flex xl:min-h-[3rem] xl:justify-end">
              <ThemeToggle surface="dark" compact />
              <Button
                asChild
                variant="ghost"
                className="h-9 rounded-[0.82rem] border border-white/10 bg-white/6 px-3 text-[0.74rem] font-semibold tracking-[0.1em] uppercase text-white/86 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:bg-white/10 hover:text-white"
              >
                <Link href="/inloggen">Inloggen</Link>
              </Button>
              <Button
                asChild
                className="h-9 rounded-[0.82rem] bg-white px-3.5 text-[0.74rem] font-semibold tracking-[0.1em] uppercase text-slate-950 shadow-[0_14px_32px_-20px_rgba(255,255,255,0.32)] hover:bg-white/92"
              >
                <Link href="/registreren">
                  Gratis starten
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-[0.82rem] border-white/10 bg-white/8 text-white shadow-[0_16px_34px_-24px_rgba(15,23,42,0.42)] hover:bg-white/12 xl:hidden"
              onClick={() => setMobileOpen((open) => !open)}
              aria-label={mobileOpen ? "Menu sluiten" : "Menu openen"}
            >
              {mobileOpen ? <X /> : <Menu />}
            </Button>
          </div>

          {mobileOpen ? (
            <div className="mt-4 grid gap-3 border-t border-white/10 pt-4 xl:hidden">
              <div className="flex justify-end">
                <ThemeToggle surface="dark" compact />
              </div>
              <div className="grid gap-2 rounded-[1rem] border border-white/10 bg-white/6 p-2 shadow-[0_18px_42px_-28px_rgba(15,23,42,0.42)]">
                {headerNavigation.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group relative overflow-hidden rounded-[1.1rem] px-4 py-3.5 text-[0.8rem] font-semibold tracking-[0.14em] uppercase transition-all",
                        active
                          ? "bg-white text-slate-950 shadow-[0_16px_30px_-18px_rgba(255,255,255,0.24)]"
                          : "bg-white/6 text-white/82 hover:bg-white/10 hover:text-white",
                      )}
                      onClick={() => setMobileOpen(false)}
                    >
                      <span
                        className={cn(
                          "absolute left-3 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-full transition-all duration-200",
                          active ? "bg-sky-500" : "bg-white/0 group-hover:bg-white/50",
                        )}
                      />
                      <span className="relative z-10 block pl-3">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <Button
                  asChild
                  variant="outline"
                  className="h-11 rounded-full border-white/12 bg-white/6 text-white hover:bg-white/10"
                >
                  <Link href="/inloggen" onClick={() => setMobileOpen(false)}>
                    Inloggen
                  </Link>
                </Button>
                <Button
                  asChild
                  className="h-11 rounded-full bg-white text-slate-950 hover:bg-white/92"
                >
                  <Link href="/registreren" onClick={() => setMobileOpen(false)}>
                    Gratis starten
                  </Link>
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
