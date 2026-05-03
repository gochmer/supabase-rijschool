"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PaymentLinkCopyButton({
  className,
  iconOnly = false,
  label = "Kopieer betaallink",
  value,
}: {
  className?: string;
  iconOnly?: boolean;
  label?: string;
  value: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyPaymentLink() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Betaallink gekopieerd.");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Kopieren lukt hier niet. Open de link en kopieer hem daar.");
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        "h-9 rounded-lg border-white/10 bg-white/7 text-xs text-white hover:bg-white/12",
        className,
      )}
      onClick={copyPaymentLink}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {iconOnly ? (
        <span className="sr-only">{copied ? "Gekopieerd" : label}</span>
      ) : copied ? (
        "Gekopieerd"
      ) : (
        label
      )}
    </Button>
  );
}
