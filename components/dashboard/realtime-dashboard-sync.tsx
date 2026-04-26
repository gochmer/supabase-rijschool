"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
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

  useEffect(() => {
    const channel = supabase
      .channel(`realtime-${profileLabel}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lesaanvragen" },
        () => {
          setLastUpdate("Aanvragen bijgewerkt");
          startTransition(() => router.refresh());
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lessen" },
        () => {
          setLastUpdate("Planning bijgewerkt");
          startTransition(() => router.refresh());
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notificaties" },
        () => {
          setLastUpdate("Meldingen bijgewerkt");
          startTransition(() => router.refresh());
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
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
