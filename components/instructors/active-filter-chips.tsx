"use client";

export function ActiveFilterChips({
  chips,
  isPending,
}: {
  chips: string[];
  isPending?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2 text-xs font-medium text-white/78">
      {chips.map((chip) => (
        <span key={chip} className="rounded-full border border-white/14 bg-white/10 px-3 py-1.5">
          {chip}
        </span>
      ))}
      {isPending ? (
        <span className="rounded-full border border-white/14 bg-white/10 px-3 py-1.5">
          Bijwerken...
        </span>
      ) : null}
    </div>
  );
}
