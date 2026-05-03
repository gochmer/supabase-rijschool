"use client";

import { useEffect, useState } from "react";

export function DashboardPerformanceMark({
  label,
  route,
}: {
  label: string;
  route: string;
}) {
  const [startedAt] = useState(() =>
    typeof performance === "undefined" ? 0 : performance.now(),
  );

  useEffect(() => {
    if (process.env.NODE_ENV === "production" || !startedAt) {
      return;
    }

    const duration = Math.round(performance.now() - startedAt);
    console.info(`[perf] ${route} component:${label} mounted: ${duration}ms`);
  }, [label, route, startedAt]);

  return null;
}
