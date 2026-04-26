"use client";

import { useTransition } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";

import { markAllNotificationsReadAction, markNotificationReadAction } from "@/lib/actions/notifications";
import type { Notificatie } from "@/lib/types";
import { Button } from "@/components/ui/button";

export function NotificationDropdown({ notifications }: { notifications: Notificatie[] }) {
  const [isPending, startTransition] = useTransition();

  const unreadCount = notifications.filter((n) => n.ongelezen).length;

  function markAllRead() {
    startTransition(async () => {
      const result = await markAllNotificationsReadAction();
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  function markOneRead(id: string) {
    startTransition(async () => {
      await markNotificationReadAction(id);
    });
  }

  return (
    <div className="relative">
      <div className="relative">
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 rounded-full bg-red-500 px-1.5 text-[10px] text-white">
            {unreadCount}
          </span>
        )}
      </div>

      <div className="absolute right-0 mt-2 w-80 rounded-xl border bg-white shadow-lg dark:bg-slate-900">
        <div className="flex items-center justify-between p-3 border-b">
          <span className="font-semibold">Notificaties</span>
          <Button size="sm" variant="outline" onClick={markAllRead} disabled={isPending}>
            Alles gelezen
          </Button>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Geen notificaties</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3 border-b text-sm cursor-pointer ${n.ongelezen ? "bg-slate-100 dark:bg-slate-800" : ""}`}
                onClick={() => markOneRead(n.id)}
              >
                <p className="font-semibold">{n.titel}</p>
                <p className="text-xs text-muted-foreground">{n.tekst}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{n.tijd}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
