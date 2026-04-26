"use client";

import { useState } from "react";
import { Bell, PanelRightOpen, Sparkles, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type DrawerItem = {
  id: string;
  title: string;
  description: string;
  meta: string;
  tone?: "info" | "success" | "warning";
};

export function ActivityDrawer({
  title,
  description,
  items,
  tone = "default",
  compact = false,
}: {
  title: string;
  description: string;
  items: DrawerItem[];
  tone?: "default" | "hazard" | "urban";
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const isUrban = tone === "urban";
  const isHazard = tone === "hazard";

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className={
          isUrban
            ? `w-full justify-between rounded-[1.4rem] border-white/10 bg-[linear-gradient(145deg,rgba(15,23,42,0.94),rgba(30,41,59,0.9),rgba(17,24,39,0.94))] text-left text-white shadow-[0_22px_52px_-34px_rgba(15,23,42,0.64)] backdrop-blur ${compact ? "px-3 py-2.5" : "px-4 py-5"}`
            : isHazard
            ? `w-full justify-between rounded-[1.4rem] border-red-300/12 bg-[linear-gradient(145deg,rgba(11,12,18,0.9),rgba(32,13,16,0.88),rgba(56,17,19,0.8))] text-left text-white shadow-[0_22px_52px_-34px_rgba(0,0,0,0.56)] backdrop-blur ${compact ? "px-3 py-2.5" : "px-4 py-5"}`
            : `w-full justify-between rounded-[1.4rem] border-slate-200 bg-white/82 text-left shadow-[0_18px_45px_-30px_rgba(15,23,42,0.24)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:text-white dark:shadow-[0_22px_52px_-34px_rgba(15,23,42,0.6)] ${compact ? "px-3 py-2.5" : "px-4 py-5"}`
        }
        onClick={() => setOpen(true)}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span
            className={
              isUrban
                ? `flex shrink-0 items-center justify-center rounded-xl bg-white/8 text-slate-100 ${compact ? "size-8" : "size-9"}`
                : isHazard
                ? `flex shrink-0 items-center justify-center rounded-xl bg-red-500/14 text-red-100 ${compact ? "size-8" : "size-9"}`
                : `flex shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-white/8 dark:text-slate-100 ${compact ? "size-8" : "size-9"}`
            }
          >
            <Bell className={compact ? "size-3.5" : "size-4"} />
          </span>
          <span className="min-w-0">
            <span
              className={
                isUrban || isHazard
                  ? "block truncate text-sm font-semibold text-white"
                  : "block truncate text-sm font-semibold text-slate-950 dark:text-white"
              }
            >
              Activiteitencentrum
            </span>
            {compact ? null : (
              <span
                className={
                  isUrban
                    ? "block truncate text-xs text-slate-300"
                    : isHazard
                      ? "block truncate text-xs text-stone-300"
                    : "block truncate text-xs text-muted-foreground dark:text-slate-300"
                }
              >
                Notificaties en updates in een slide-over
              </span>
            )}
          </span>
        </span>
        <PanelRightOpen
          className={
            isUrban
              ? "size-4 shrink-0 text-slate-300/80"
              : isHazard
                ? "size-4 shrink-0 text-red-200/70"
                : "size-4 shrink-0 text-slate-500 dark:text-slate-300/80"
          }
        />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className={
            isUrban
              ? "left-auto right-0 top-0 h-screen w-full max-w-xl translate-x-0 translate-y-0 rounded-none border-l border-white/10 bg-[linear-gradient(180deg,rgba(9,14,21,0.99),rgba(17,24,39,0.98),rgba(24,32,47,0.98))] p-0 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04),-30px_0_90px_-40px_rgba(15,23,42,0.86)]"
              : isHazard
              ? "left-auto right-0 top-0 h-screen w-full max-w-xl translate-x-0 translate-y-0 rounded-none border-l border-red-300/14 bg-[linear-gradient(180deg,rgba(5,7,11,0.98),rgba(18,10,12,0.98),rgba(39,14,18,0.96))] p-0 text-white shadow-[0_0_0_1px_rgba(248,113,113,0.08),-30px_0_90px_-40px_rgba(0,0,0,0.75)]"
              : "left-auto right-0 top-0 h-screen w-full max-w-xl translate-x-0 translate-y-0 rounded-none border-l border-white/70 bg-white/95 p-0 shadow-[0_0_0_1px_rgba(255,255,255,0.08),-30px_0_80px_-40px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(9,14,21,0.99),rgba(17,24,39,0.98),rgba(24,32,47,0.98))] dark:text-white dark:shadow-[0_0_0_1px_rgba(255,255,255,0.04),-30px_0_90px_-40px_rgba(15,23,42,0.86)]"
          }
          showCloseButton={false}
        >
          <div className="flex h-full flex-col">
            <DialogHeader
              className={
                isUrban
                  ? "border-b border-white/10 px-6 py-5"
                  : isHazard
                  ? "border-b border-red-300/10 px-6 py-5"
                  : "border-b border-slate-100 px-6 py-5 dark:border-white/10"
              }
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className={
                      isUrban
                        ? "flex size-11 items-center justify-center rounded-2xl bg-white/8 text-slate-100"
                        : isHazard
                        ? "flex size-11 items-center justify-center rounded-2xl bg-red-500/14 text-red-100"
                        : "flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-white/8 dark:text-slate-100"
                    }
                  >
                    <Sparkles className="size-5" />
                  </div>
                  <div>
                    <DialogTitle
                      className={isUrban || isHazard ? "text-xl text-white" : "text-xl dark:text-white"}
                    >
                      {title}
                    </DialogTitle>
                    <DialogDescription
                      className={
                        isUrban
                          ? "mt-1 max-w-md leading-7 text-slate-300"
                          : isHazard
                          ? "mt-1 max-w-md leading-7 text-stone-300"
                          : "mt-1 max-w-md leading-7 dark:text-slate-300"
                      }
                    >
                      {description}
                    </DialogDescription>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={
                    isUrban
                      ? "rounded-full text-slate-300 hover:bg-white/8 hover:text-white"
                      : isHazard
                      ? "rounded-full text-stone-300 hover:bg-white/8 hover:text-white"
                      : "rounded-full dark:text-slate-300 dark:hover:bg-white/8 dark:hover:text-white"
                  }
                  onClick={() => setOpen(false)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            </DialogHeader>

            <div className="flex-1 space-y-3 overflow-y-auto px-6 py-5">
              {items.length ? (
                items.map((item) => (
                  <div
                    key={item.id}
                    className={
                      isUrban
                        ? "rounded-[1.5rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(148,163,184,0.08),rgba(15,23,42,0.28))] p-4 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.56)]"
                        : isHazard
                        ? "rounded-[1.5rem] border border-red-300/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.04),rgba(120,22,22,0.12))] p-4 shadow-[0_16px_36px_-28px_rgba(0,0,0,0.48)]"
                        : "rounded-[1.5rem] border border-slate-200 bg-slate-50/78 p-4 dark:border-white/10 dark:bg-white/5"
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p
                          className={
                            isUrban || isHazard
                              ? "font-semibold text-white"
                              : "font-semibold text-slate-950 dark:text-white"
                          }
                        >
                          {item.title}
                        </p>
                        <p
                          className={
                            isUrban
                              ? "mt-2 text-sm leading-7 text-slate-300"
                              : isHazard
                                ? "mt-2 text-sm leading-7 text-stone-300"
                              : "mt-2 text-sm leading-7 text-muted-foreground dark:text-slate-300"
                          }
                        >
                          {item.description}
                        </p>
                      </div>
                      <Badge variant={item.tone ?? "info"}>{item.meta}</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div
                  className={
                    isUrban
                      ? "rounded-[1.5rem] border border-dashed border-white/10 bg-white/4 p-6 text-sm leading-7 text-slate-300"
                      : isHazard
                        ? "rounded-[1.5rem] border border-dashed border-red-300/10 bg-white/4 p-6 text-sm leading-7 text-stone-300"
                      : "rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50/78 p-6 text-sm leading-7 text-muted-foreground dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                  }
                >
                  Er zijn momenteel geen nieuwe updates.
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
