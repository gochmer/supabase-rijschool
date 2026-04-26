"use client";

import { useEffect, useState } from "react";

import { InstructorCard } from "@/components/instructors/instructor-card";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import type { InstructeurProfiel, Pakket } from "@/lib/types";

export function FeaturedInstructorsCarousel({
  items,
  packagesByInstructorId = {},
}: {
  items: InstructeurProfiel[];
  packagesByInstructorId?: Record<string, Pakket[]>;
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [snapCount, setSnapCount] = useState(0);

  useEffect(() => {
    if (!api) return;

    const update = () => {
      setSelectedIndex(api.selectedScrollSnap());
      setSnapCount(api.scrollSnapList().length);
    };

    update();
    api.on("select", update);
    api.on("reInit", update);

    return () => {
      api.off("select", update);
      api.off("reInit", update);
    };
  }, [api]);

  return (
    <Carousel
      opts={{ align: "start", loop: true }}
      setApi={setApi}
      className="w-full rounded-[2.2rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] p-3 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.94),rgba(30,41,59,0.86),rgba(15,23,42,0.92))] dark:shadow-[0_30px_80px_-50px_rgba(15,23,42,0.56)]"
    >
      <CarouselContent className="-ml-3">
        {items.map((instructor) => (
          <CarouselItem
            key={instructor.id}
            className="pl-3 md:basis-1/2 xl:basis-1/3"
          >
            <InstructorCard
              instructor={instructor}
              packages={packagesByInstructorId[instructor.id] ?? []}
            />
          </CarouselItem>
        ))}
      </CarouselContent>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50/90 px-3 py-1 text-[10px] font-semibold tracking-[0.22em] text-sky-700 uppercase shadow-[0_14px_30px_-24px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-white/6 dark:text-sky-200 dark:shadow-[0_14px_30px_-24px_rgba(15,23,42,0.36)]">
            Uitgelichte instructeurs
          </div>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: snapCount }).map((_, index) => (
              <span
                key={index}
                className={`block h-1.5 rounded-full transition-all duration-300 ${
                  index === selectedIndex
                    ? "w-8 bg-[linear-gradient(90deg,#0ea5e9,#14b8a6)]"
                    : "w-1.5 bg-sky-200/90 dark:bg-slate-500"
                }`}
              />
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <CarouselPrevious className="static size-9 translate-y-0 rounded-[0.95rem] border-white/80 bg-white/88 text-slate-700 shadow-[0_18px_34px_-24px_rgba(15,23,42,0.18)] disabled:opacity-35 dark:border-white/10 dark:bg-white/6 dark:text-slate-100 dark:shadow-[0_18px_34px_-24px_rgba(15,23,42,0.42)]" />
          <CarouselNext className="static size-9 translate-y-0 rounded-[0.95rem] border-white/80 bg-white/88 text-slate-700 shadow-[0_18px_34px_-24px_rgba(15,23,42,0.18)] disabled:opacity-35 dark:border-white/10 dark:bg-white/6 dark:text-slate-100 dark:shadow-[0_18px_34px_-24px_rgba(15,23,42,0.42)]" />
        </div>
      </div>
    </Carousel>
  );
}
