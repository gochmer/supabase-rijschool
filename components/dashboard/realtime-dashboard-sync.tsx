"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Radio } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

export function RealtimeDashboardSync({
  profileLabel = "dashboard",
}: {
  profileLabel?: string;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [isPending, startTransition] = useTransition();
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const refreshTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const queueRefresh = (message: string) => {
      setLastUpdate(message);

      if (document.visibilityState === "hidden") {
        return;
      }

      if (refreshTimeoutRef.current) {
        return;
      }

      refreshTimeoutRef.current = window.setTimeout(() => {
        refreshTimeoutRef.current = null;
        startTransition(() => router.refresh());
      }, 250);
    };

    const channel = supabase
      .channel(`realtime-${profileLabel}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lesaanvragen" },
        () => {
          queueRefresh("Aanvragen bijgewerkt");
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lessen" },
        () => {
          queueRefresh("Planning bijgewerkt");
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notificaties" },
        () => {
          queueRefresh("Meldingen bijgewerkt");
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");

        if (status === "CHANNEL_ERROR") {
          setLastUpdate("Realtime tijdelijk gestopt");
        }

        if (status === "TIMED_OUT") {
          setLastUpdate("Realtime verbinding vertraagd");
        }
      });

    return () => {
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }

      void supabase.removeChannel(channel);
    };
  }, [profileLabel, router, supabase]);

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/78 backdrop-blur">
      <span className={`relative flex size-2.5 ${isConnected ? "text-emerald-300" : "text-amber-300"}`}>
        <span className="absolute inline-flex size-2.5 animate-ping rounded-full bg-current opacity-35" />
        <span className="relative inline-flex size-2.5 rounded-full bg-current" />
      </span>
      <Radio className="size-3.5" />
      {isConnected ? "Realtime actief" : "Verbinden..."}
      {isPending ? " • verversen" : lastUpdate ? ` • ${lastUpdate}` : null}
    </div>
  );
}
