import "server-only";

type RuntimeErrorMeta = Record<string, string | number | boolean | null | undefined>;

export function isDemoDataAllowed() {
  return (
    process.env.NODE_ENV !== "production" &&
    (process.env.DEMO_MODE === "true" ||
      process.env.NEXT_PUBLIC_DEMO_MODE === "true")
  );
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
    };
  }

  return error;
}

export function logSupabaseDataError(
  scope: string,
  error: unknown,
  meta: RuntimeErrorMeta = {},
) {
  console.error(`[data:${scope}] Supabase query failed`, {
    error: serializeError(error),
    ...meta,
  });
}

