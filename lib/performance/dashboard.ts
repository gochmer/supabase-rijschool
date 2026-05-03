import "server-only";

const DEFAULT_ROUTE_WARN_MS = 300;
const DEFAULT_DATA_WARN_MS = 150;

function shouldLogDashboardPerformance() {
  return process.env.NODE_ENV !== "production";
}

function logPerformance(
  label: string,
  durationMs: number,
  warnAtMs: number,
) {
  if (!shouldLogDashboardPerformance()) {
    return;
  }

  const rounded = Math.round(durationMs);
  const method = rounded >= warnAtMs ? console.warn : console.info;
  method(`[perf] ${label}: ${rounded}ms`);
}

export async function timedDashboardRoute<T>(
  route: string,
  loader: () => Promise<T>,
  warnAtMs = DEFAULT_ROUTE_WARN_MS,
) {
  const start = performance.now();

  try {
    return await loader();
  } finally {
    logPerformance(`${route} route`, performance.now() - start, warnAtMs);
  }
}

export async function timedDashboardData<T>(
  route: string,
  label: string,
  loader: () => Promise<T>,
  warnAtMs = DEFAULT_DATA_WARN_MS,
) {
  const start = performance.now();

  try {
    return await loader();
  } finally {
    logPerformance(
      `${route} data:${label}`,
      performance.now() - start,
      warnAtMs,
    );
  }
}
