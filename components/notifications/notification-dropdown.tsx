"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { markAllNotificationsReadAction, markNotificationReadAction } from "@/lib/actions/notifications";
import type { Notificatie } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getBadgeVariant(type: Notificatie["type"]) {
  switch (type) {
    case "succes":
      return "success" as const;
    case "waarschuwing":
      return "warning" as const;
    default:
      return "info" as const;
  }
}

export function NotificationDropdown({
  notifications,
  surface = "default",
}: {
  notifications: Notificatie[];
  surface?: "default" | "urban";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [markedReadIds, setMarkedReadIds] = useState<string[]>([]);
  const [markAllLocal, setMarkAllLocal] = useState(false);

  const items = useMemo(
    () =>
      notifications.map((notification) => ({
        ...notification,
        ongelezen:
          !markAllLocal &&
          notification.ongelezen &&
          !markedReadIds.includes(notification.id),
      })),
    [markAllLocal, markedReadIds, notifications]
  );

  const unreadCount = useMemo(
    () => items.filter((notification) => notification.ongelezen).length,
    [items]
  );

  function markAllRead() {
    startTransition(async () => {
      const result = await markAllNotificationsReadAction();
      if (result.success) {
        setMarkAllLocal(true);
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function markOneRead(id: string) {
    const target = items.find((notification) => notification.id === id);

    if (!target?.ongelezen) {
      return;
    }

    startTransition(async () => {
      const result = await markNotificationReadAction(id);
      if (result.success) {
        setMarkedReadIds((current) =>
          current.includes(id) ? current : [...current, id]
        );
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "relative h-10 rounded-full px-3 shadow-sm",
            surface === "urban"
              ? "border-white/10 bg-white/6 text-white hover:bg-white/10"
              : "border-white/70 bg-white/88 text-slate-900 hover:bg-white dark:border-white/10 dark:bg-white/6 dark:text-white dark:hover:bg-white/10"
          )}
        >
          <Bell className="size-4" />
          <span className="hidden sm:inline">Notificaties</span>
          {unreadCount > 0 ? (
            <span className="absolute -top-1.5 -right-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[24rem] max-w-[calc(100vw-1.5rem)] rounded-[1.2rem] p-0"
      >
        <div className="flex items-start justify-between gap-3 p-4">
          <div>
            <DropdownMenuLabel className="px-0 py-0 text-sm font-semibold text-foreground">
              Notificaties
            </DropdownMenuLabel>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {unreadCount
                ? `${unreadCount} ongelezen melding(en)`
                : "Alles is gelezen"}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={markAllRead}
            disabled={isPending || unreadCount === 0}
            className="h-8 rounded-full"
          >
            {isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <CheckCheck className="size-3.5" />
            )}
            Alles gelezen
          </Button>
        </div>

        <DropdownMenuSeparator className="my-0" />

        <div className="max-h-[26rem] overflow-y-auto p-2">
          {items.length === 0 ? (
            <div className="rounded-[1rem] border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
              Geen notificaties op dit moment.
            </div>
          ) : (
            <div className="grid gap-2">
              {items.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "rounded-[1rem] border px-3 py-3 shadow-[0_14px_34px_-30px_rgba(15,23,42,0.22)]",
                    notification.ongelezen
                      ? "border-sky-200 bg-sky-50/70 dark:border-sky-300/15 dark:bg-sky-400/10"
                      : "border-border bg-background"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {notification.titel}
                        </p>
                        <Badge variant={getBadgeVariant(notification.type)}>
                          {notification.type}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {notification.tekst}
                      </p>
                      <p className="mt-2 text-[11px] font-medium text-muted-foreground">
                        {notification.tijd}
                      </p>
                    </div>
                    {notification.ongelezen ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 shrink-0 rounded-full px-2.5 text-xs"
                        onClick={() => markOneRead(notification.id)}
                        disabled={isPending}
                      >
                        <Check className="size-3.5" />
                        Gelezen
                      </Button>
                    ) : (
                      <span className="mt-1 inline-flex size-2.5 shrink-0 rounded-full bg-emerald-400/80" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
