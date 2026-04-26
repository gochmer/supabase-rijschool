"use client";

import { InstructorCard } from "@/components/instructors/instructor-card";
import { Button } from "@/components/ui/button";
import type { InstructeurProfiel, Pakket } from "@/lib/types";

export function InstructorResultsGrid({
  instructors,
  packagesByInstructorId,
  favoriteInstructorIds,
  detailBasePath,
  animationKey,
  isPending,
  onReset,
}: {
  instructors: InstructeurProfiel[];
  packagesByInstructorId: Record<string, Pakket[]>;
  favoriteInstructorIds: string[];
  detailBasePath: string;
  animationKey: string | number;
  isPending: boolean;
  onReset: () => void;
}) {
  if (!instructors.length) {
    return (
      <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/78 p-10 text-center shadow-[0_24px_70px_-48px_rgba(15,23,42,0.18)] dark:border-white/12 dark:bg-white/6">
        <h3 className="text-xl font-semibold text-slate-950 dark:text-white">
          Geen instructeurs gevonden
        </h3>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground dark:text-slate-300">
          Je filters zijn waarschijnlijk te specifiek. Reset je selectie of zoek op een grotere regio om meer matches te zien.
        </p>
        <Button type="button" onClick={onReset} className="mt-5 rounded-full px-6">
          Reset filters
        </Button>
      </div>
    );
  }

  return (
    <div
      key={animationKey}
      className={`grid gap-6 transition-all duration-300 lg:grid-cols-2 xl:grid-cols-3 ${isPending ? "scale-[0.995] opacity-70 blur-[1px]" : "scale-100 opacity-100 blur-0"}`}
    >
      {instructors.map((instructor, index) => (
        <div
          key={instructor.id}
          className="animate-in fade-in slide-in-from-bottom-3 zoom-in-[0.98] duration-500"
          style={{ animationDelay: `${Math.min(index, 9) * 45}ms` }}
        >
          <InstructorCard
            instructor={instructor}
            packages={packagesByInstructorId[instructor.id] ?? []}
            detailBasePath={detailBasePath}
            isFavorite={favoriteInstructorIds.includes(instructor.id)}
          />
        </div>
      ))}
    </div>
  );
}
