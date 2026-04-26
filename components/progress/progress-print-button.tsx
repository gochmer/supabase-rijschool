"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ProgressPrintButton({
  className,
  label = "Print / PDF",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      className={cn("print:hidden", className)}
      onClick={() => window.print()}
    >
      <Printer className="size-4" />
      {label}
    </Button>
  );
}
