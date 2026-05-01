"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Command, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { dashboardNavigation } from "@/lib/navigation";
import type { GebruikersRol } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type PaletteAction = {
  id: string;
  title: string;
  description: string;
  href?: string;
  toastMessage?: string;
};

export function CommandPalette({
  role,
  compact = false,
  presentation = "card",
}: {
  role: GebruikersRol;
  compact?: boolean;
  presentation?: "card" | "search";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const tone = role === "leerling" ? "urban" : "default";
  const isUrban = tone === "urban";

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const actions = useMemo<PaletteAction[]>(() => {
    const navActions = dashboardNavigation[role].map((item) => ({
      id: item.href,
      title: item.label,
      description: `Open ${item.label.toLowerCase()} voor ${role}.`,
      href: item.href,
    }));

    const utilityActions: PaletteAction[] = [
      {
        id: "focus",
        title: "Focusmodus activeren",
        description: "Toon een snelle productiviteitshint voor deze sessie.",
        toastMessage: "Focusmodus geactiveerd. Werk stap voor stap vanuit je belangrijkste acties.",
      },
      {
        id: "refresh",
        title: "Dashboard verversen",
        description: "Laad de laatste live data en statusupdates opnieuw in.",
        toastMessage: "Dashboard wordt vernieuwd.",
      },
    ];

    return [...navActions, ...utilityActions];
  }, [role]);

  const filtered = actions.filter((action) => {
    const haystack = `${action.title} ${action.description}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });
  const isSearchPresentation = presentation === "search";

  function runAction(action: PaletteAction) {
    if (action.href) {
      router.push(action.href);
    }

    if (action.toastMessage) {
      toast.success(action.toastMessage);
      if (action.id === "refresh") {
        router.refresh();
      }
    }

    setOpen(false);
    setQuery("");
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className={
          isSearchPresentation
            ? "h-10 w-full justify-between rounded-full border-white/10 bg-[#181818] px-3 text-left text-white shadow-none hover:bg-[#202020]"
            : isUrban
              ? `w-full justify-between rounded-[1.4rem] border-white/10 bg-[linear-gradient(145deg,rgba(15,23,42,0.94),rgba(30,41,59,0.9),rgba(17,24,39,0.94))] text-left text-white shadow-[0_22px_52px_-34px_rgba(15,23,42,0.64)] backdrop-blur ${compact ? "px-3 py-2.5" : "px-4 py-5"}`
              : `w-full justify-between rounded-[1.4rem] border-slate-200 bg-white/82 text-left shadow-[0_18px_45px_-30px_rgba(15,23,42,0.24)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:text-white dark:shadow-[0_22px_52px_-34px_rgba(15,23,42,0.6)] ${compact ? "px-3 py-2.5" : "px-4 py-5"}`
        }
        onClick={() => setOpen(true)}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span
            className={
              isSearchPresentation
                ? "flex size-8 shrink-0 items-center justify-center rounded-full bg-transparent text-slate-300"
                : isUrban
                ? `flex shrink-0 items-center justify-center rounded-xl bg-white/8 text-slate-100 ${compact ? "size-8" : "size-9"}`
                : `flex shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-white/8 dark:text-slate-100 ${compact ? "size-8" : "size-9"}`
            }
          >
            <Search className={compact ? "size-3.5" : "size-4"} />
          </span>
          <span className="min-w-0">
            <span
              className={
                isSearchPresentation
                  ? "block truncate text-sm font-semibold text-slate-300"
                  : isUrban
                  ? "block truncate text-sm font-semibold text-white"
                  : "block truncate text-sm font-semibold text-slate-950 dark:text-white"
              }
            >
              {isSearchPresentation ? "Zoek in dashboard" : "Command palette"}
            </span>
            {compact || isSearchPresentation ? null : (
              <span
                className={
                  isUrban
                    ? "block truncate text-xs text-slate-300"
                    : "block truncate text-xs text-muted-foreground dark:text-slate-300"
                }
              >
                Open snelle acties en pagina&apos;s
              </span>
            )}
          </span>
        </span>
        {compact ? (
          <span
            className={
              isSearchPresentation || isUrban
                ? "shrink-0 text-[11px] font-medium text-slate-300"
                : "shrink-0 text-[11px] font-medium text-slate-600 dark:text-slate-300"
            }
          >
            Ctrl+K
          </span>
        ) : (
          <span
            className={
              isUrban
                ? "shrink-0 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-medium text-slate-200"
                : "shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-slate-200"
            }
          >
            Ctrl/Cmd + K
          </span>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className={
            isUrban
              ? "max-w-2xl rounded-[1.35rem] border border-white/10 bg-slate-950/96 p-6 text-white shadow-[0_24px_72px_-44px_rgba(15,23,42,0.82)]"
              : "surface-panel max-w-2xl rounded-[1.35rem] p-6"
          }
          showCloseButton={false}
        >
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div
                className={
                  isUrban
                    ? "flex size-11 items-center justify-center rounded-2xl bg-white/8 text-slate-100"
                    : "flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-white/8 dark:text-slate-100"
                }
              >
                <Command className="size-5" />
              </div>
              <div>
                <DialogTitle className={isUrban ? "text-xl text-white" : "text-xl dark:text-white"}>
                  Command palette
                </DialogTitle>
                <DialogDescription
                  className={isUrban ? "text-slate-300" : "dark:text-slate-300"}
                >
                  Zoek pagina&apos;s en snelle acties binnen je dashboard.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Zoek op pagina, actie of workflow..."
              className={
                isUrban
                  ? "h-12 rounded-xl border-white/10 bg-white/4 text-white placeholder:text-slate-400 focus-visible:border-slate-300/32 focus-visible:ring-slate-300/18"
                  : "h-12 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/4 dark:text-white dark:placeholder:text-slate-400 dark:focus-visible:border-slate-300/32 dark:focus-visible:ring-slate-300/18"
              }
            />

            <div className="max-h-[24rem] space-y-2 overflow-y-auto pr-1">
              {filtered.length ? (
                filtered.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => runAction(action)}
                    className={
                      isUrban
                        ? "flex w-full items-start justify-between rounded-[1.35rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(148,163,184,0.08),rgba(15,23,42,0.28))] px-4 py-4 text-left transition-all hover:border-white/14 hover:bg-white/8"
                        : "flex w-full items-start justify-between rounded-[1.35rem] border border-slate-200 bg-slate-50/80 px-4 py-4 text-left transition-all hover:border-slate-300 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:border-white/14 dark:hover:bg-white/8"
                    }
                  >
                    <div>
                      <p
                        className={
                          isUrban
                            ? "font-semibold text-white"
                            : "font-semibold text-slate-950 dark:text-white"
                        }
                      >
                        {action.title}
                      </p>
                      <p
                        className={
                          isUrban
                            ? "mt-1 text-sm leading-7 text-slate-300"
                            : "mt-1 text-sm leading-7 text-muted-foreground dark:text-slate-300"
                        }
                      >
                        {action.description}
                      </p>
                    </div>
                    <Sparkles
                      className={
                        isUrban
                          ? "mt-1 size-4 text-slate-300/80"
                          : "mt-1 size-4 text-slate-400 dark:text-slate-300/80"
                      }
                    />
                  </button>
                ))
              ) : (
                <div
                  className={
                    isUrban
                      ? "rounded-[1.5rem] border border-dashed border-white/10 bg-white/4 px-4 py-6 text-sm text-slate-300"
                      : "rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-sm text-muted-foreground dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                  }
                >
                  Geen acties gevonden voor je zoekopdracht.
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
