import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  tone = "default",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  tone?: "default" | "inverse";
}) {
  return (
    <div
      className={cn(
        "space-y-2.5",
        align === "center" && "mx-auto max-w-3xl text-center",
      )}
    >
      {eyebrow ? (
        <p
          className={cn(
            "text-[10px] font-semibold tracking-[0.24em] uppercase",
            tone === "inverse" ? "text-violet-200/90" : "text-primary/90",
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          "text-[1.85rem] font-semibold tracking-tight sm:text-3xl lg:text-4xl",
          tone === "inverse" ? "text-white" : "text-foreground",
          align === "center"
            ? "mx-auto max-w-[16ch] sm:max-w-[18ch]"
            : "max-w-[18ch]",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "text-[15px] leading-7 sm:text-[1.02rem]",
            tone === "inverse" ? "text-slate-300" : "text-muted-foreground",
            align === "center" ? "mx-auto max-w-[38rem]" : "max-w-[38rem]",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
