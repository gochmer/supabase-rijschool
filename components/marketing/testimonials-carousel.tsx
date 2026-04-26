"use client";

import { useEffect, useState } from "react";
import Autoplay from "embla-carousel-autoplay";
import { Quote, Star } from "lucide-react";

import { HoverTilt } from "@/components/marketing/homepage-motion";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

type Testimonial = {
  id: string;
  quote: string;
  name: string;
  subtitle: string;
  score: number;
};

export function TestimonialsCarousel({
  items,
}: {
  items: Testimonial[];
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
      setApi={setApi}
      opts={{ loop: true, align: "start" }}
      plugins={[
        Autoplay({
          delay: 4800,
          stopOnInteraction: true,
          stopOnMouseEnter: true,
        }),
      ]}
      className="w-full"
    >
      <CarouselContent className="-ml-3">
        {items.map((item) => (
          <CarouselItem key={item.id} className="pl-3 md:basis-1/2 xl:basis-1/3">
            <HoverTilt className="relative h-full rounded-[1.65rem] [perspective:1200px]">
              <div className="flex h-full flex-col rounded-[1.65rem] border border-white/85 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] p-5 shadow-[0_20px_48px_-34px_rgba(15,23,42,0.18)]">
                <div className="flex items-start justify-between gap-4">
                  <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                    <Star className="size-3.5 fill-amber-400 text-amber-400" />
                    {item.score.toFixed(1)}
                  </div>
                  <div className="flex size-9 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                    <Quote className="size-4" />
                  </div>
                </div>

                <p className="mt-4 flex-1 text-[15px] leading-7 text-slate-700">
                  &ldquo;{item.quote}&rdquo;
                </p>

                <div className="mt-5 border-t border-slate-100 pt-4">
                  <p className="text-sm font-semibold text-slate-950">{item.name}</p>
                  <p className="mt-1 text-[13px] leading-6 text-slate-500">
                    {item.subtitle}
                  </p>
                </div>
              </div>
            </HoverTilt>
          </CarouselItem>
        ))}
      </CarouselContent>
      <div className="mt-5 flex items-center justify-between gap-4">
        <div className="hidden items-center gap-1.5 sm:inline-flex">
          {Array.from({ length: snapCount }).map((_, index) => (
            <span
              key={index}
              className={`block h-1.5 rounded-full transition-all duration-300 ${
                index === selectedIndex
                  ? "w-8 bg-[linear-gradient(90deg,#0ea5e9,#14b8a6)]"
                  : "w-1.5 bg-sky-200/90"
              }`}
            />
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <CarouselPrevious className="static translate-y-0 rounded-full border-white/80 bg-white/88 text-slate-700 shadow-[0_18px_34px_-24px_rgba(15,23,42,0.18)] disabled:opacity-35" />
          <CarouselNext className="static translate-y-0 rounded-full border-white/80 bg-white/88 text-slate-700 shadow-[0_18px_34px_-24px_rgba(15,23,42,0.18)] disabled:opacity-35" />
        </div>
      </div>
    </Carousel>
  );
}
