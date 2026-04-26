"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { sendMessageAction } from "@/lib/actions/messages";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

type InboxMessage = {
  id: string;
  afzender: string;
  onderwerp: string;
  preview: string;
  tijd: string;
  ongelezen: boolean;
};

export function MessageCenter({
  inbox,
  recipients,
  recipientLabel,
  tone = "default",
}: {
  inbox: InboxMessage[];
  recipients: Array<{ id: string; label: string }>;
  recipientLabel: string;
  tone?: "default" | "hazard" | "urban";
}) {
  const [isPending, startTransition] = useTransition();
  const [recipientProfileId, setRecipientProfileId] = useState(
    recipients[0]?.id ?? ""
  );
  const [onderwerp, setOnderwerp] = useState("");
  const [inhoud, setInhoud] = useState("");
  const isUrban = tone === "urban";
  const isHazard = tone === "hazard";

  function handleSubmit() {
    startTransition(async () => {
      const result = await sendMessageAction({
        recipientProfileId,
        onderwerp,
        inhoud,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      setOnderwerp("");
      setInhoud("");
      toast.success(result.message);
    });
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
      <Card
        className={cn(
          "shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)]",
          isUrban
            ? "border border-white/10 bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(30,41,59,0.9),rgba(17,24,39,0.96))] text-white shadow-[0_28px_88px_-46px_rgba(15,23,42,0.78)]"
            : isHazard
            ? "re-frame-flash border border-red-300/12 bg-[linear-gradient(145deg,rgba(9,11,16,0.98),rgba(22,12,15,0.96),rgba(40,16,19,0.9))] text-white shadow-[0_28px_88px_-46px_rgba(0,0,0,0.74)]"
            : "border border-white/70 bg-white/90 dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]"
        )}
      >
        <CardHeader>
          <CardTitle className={isUrban || isHazard ? "text-white" : "dark:text-white"}>Nieuw bericht</CardTitle>
          <CardDescription className={isUrban ? "text-slate-300" : isHazard ? "text-stone-300" : "dark:text-slate-300"}>
            Stuur direct een bericht naar {recipientLabel.toLowerCase()}en binnen het platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label
              htmlFor="recipient"
              className={
                isUrban
                  ? "text-[10px] font-semibold tracking-[0.14em] text-slate-300 uppercase"
                  : isHazard
                    ? "text-[10px] font-semibold tracking-[0.14em] text-red-100/76 uppercase"
                    : undefined
              }
            >
              Ontvanger
            </Label>
            <select
              id="recipient"
              value={recipientProfileId}
              onChange={(event) => setRecipientProfileId(event.target.value)}
              className={
                isUrban
                  ? "h-10 w-full appearance-none rounded-[0.9rem] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.05),rgba(148,163,184,0.08),rgba(15,23,42,0.28))] px-3 text-[13px] text-white outline-none transition-colors focus-visible:border-slate-300/32 focus-visible:ring-3 focus-visible:ring-slate-300/18"
                  : isHazard
                  ? "h-10 w-full appearance-none rounded-[0.9rem] border border-red-300/14 bg-[linear-gradient(145deg,rgba(255,255,255,0.05),rgba(120,22,22,0.12))] px-3 text-[13px] text-white outline-none transition-colors focus-visible:border-red-300/30 focus-visible:ring-3 focus-visible:ring-red-400/18"
                  : "native-select h-10 w-full rounded-xl px-3 text-[13px] dark:text-white"
              }
            >
              {recipients.map((recipient) => (
                <option key={recipient.id} value={recipient.id}>
                  {recipient.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="onderwerp"
              className={
                isUrban
                  ? "text-[10px] font-semibold tracking-[0.14em] text-slate-300 uppercase"
                  : isHazard
                    ? "text-[10px] font-semibold tracking-[0.14em] text-red-100/76 uppercase"
                    : undefined
              }
            >
              Onderwerp
            </Label>
            <Input
              id="onderwerp"
              value={onderwerp}
              onChange={(event) => setOnderwerp(event.target.value)}
              placeholder="Waar gaat je bericht over?"
              className={
                isUrban
                  ? "h-10 rounded-[0.9rem] border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.05),rgba(148,163,184,0.08),rgba(15,23,42,0.28))] px-3 text-[13px] text-white placeholder:text-slate-400 focus-visible:border-slate-300/32 focus-visible:ring-slate-300/18"
                  : isHazard
                  ? "h-10 rounded-[0.9rem] border-red-300/14 bg-[linear-gradient(145deg,rgba(255,255,255,0.05),rgba(120,22,22,0.12))] px-3 text-[13px] text-white placeholder:text-stone-500 focus-visible:border-red-300/30 focus-visible:ring-red-400/18"
                  : undefined
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="inhoud"
              className={
                isUrban
                  ? "text-[10px] font-semibold tracking-[0.14em] text-slate-300 uppercase"
                  : isHazard
                    ? "text-[10px] font-semibold tracking-[0.14em] text-red-100/76 uppercase"
                    : undefined
              }
            >
              Bericht
            </Label>
            <Textarea
              id="inhoud"
              value={inhoud}
              onChange={(event) => setInhoud(event.target.value)}
              placeholder="Typ hier je bericht..."
              className={
                isUrban
                  ? "min-h-24 rounded-[1rem] border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.05),rgba(148,163,184,0.08),rgba(15,23,42,0.28))] px-3 py-2.5 text-[13px] text-white placeholder:text-slate-400 focus-visible:border-slate-300/32 focus-visible:ring-slate-300/18"
                  : isHazard
                  ? "min-h-24 rounded-[1rem] border-red-300/14 bg-[linear-gradient(145deg,rgba(255,255,255,0.05),rgba(120,22,22,0.12))] px-3 py-2.5 text-[13px] text-white placeholder:text-stone-500 focus-visible:border-red-300/30 focus-visible:ring-red-400/18"
                  : undefined
              }
            />
          </div>
          <Button
            disabled={isPending}
            onClick={handleSubmit}
            className={
              isUrban
                ? "h-10 rounded-[0.9rem] border border-white/12 bg-[linear-gradient(135deg,#f8fafc,#cbd5e1)] text-[13px] text-slate-950 shadow-[0_18px_40px_-26px_rgba(148,163,184,0.42)] hover:brightness-[1.03]"
                : isHazard
                ? "h-10 rounded-[0.9rem] border border-red-300/16 bg-[linear-gradient(135deg,#7f1d1d,#b91c1c,#ea580c)] text-[13px] text-white shadow-[0_18px_40px_-26px_rgba(185,28,28,0.48)] hover:brightness-105"
                : undefined
            }
          >
            {isPending ? "Versturen..." : "Bericht versturen"}
          </Button>
        </CardContent>
      </Card>

      <Card
        className={cn(
          "shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)]",
          isUrban
            ? "border border-white/10 bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(30,41,59,0.9),rgba(17,24,39,0.96))] text-white shadow-[0_28px_88px_-46px_rgba(15,23,42,0.78)]"
            : isHazard
            ? "re-frame-flash border border-red-300/12 bg-[linear-gradient(145deg,rgba(9,11,16,0.98),rgba(22,12,15,0.96),rgba(40,16,19,0.9))] text-white shadow-[0_28px_88px_-46px_rgba(0,0,0,0.74)]"
            : "border border-white/70 bg-white/90 dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]"
        )}
      >
        <CardHeader>
          <CardTitle className={isUrban || isHazard ? "text-white" : "dark:text-white"}>Inbox</CardTitle>
          <CardDescription className={isUrban ? "text-slate-300" : isHazard ? "text-stone-300" : "dark:text-slate-300"}>
            Laatste gesprekken en ongelezen berichten.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {inbox.length ? (
            inbox.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "rounded-[1.25rem] p-4",
                  isUrban
                    ? "border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(148,163,184,0.08),rgba(15,23,42,0.28))]"
                    : isHazard
                    ? "border border-red-300/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.04),rgba(120,22,22,0.12))]"
                    : "border border-border/70 bg-slate-50/80 dark:border-white/10 dark:bg-white/5"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={cn("font-semibold", isUrban || isHazard ? "text-white" : "dark:text-white")}>
                        {message.onderwerp}
                      </h3>
                      {message.ongelezen ? <Badge variant="info">Nieuw</Badge> : null}
                    </div>
                    <p
                      className={cn(
                        "mt-0.5 text-[12px]",
                        isUrban ? "text-slate-300" : isHazard ? "text-stone-300" : "text-muted-foreground dark:text-slate-300"
                      )}
                    >
                      Van {message.afzender}
                    </p>
                    <p
                      className={cn(
                        "mt-2 text-[13px] leading-6",
                        isUrban ? "text-slate-300" : isHazard ? "text-stone-300" : "text-muted-foreground dark:text-slate-300"
                      )}
                    >
                      {message.preview}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-[11px]",
                      isUrban ? "text-slate-400" : isHazard ? "text-red-100/62" : "text-muted-foreground dark:text-slate-400"
                    )}
                  >
                    {message.tijd}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div
              className={cn(
                "rounded-[1.2rem] p-4",
                isUrban
                  ? "border border-dashed border-white/10 bg-white/4"
                  : isHazard
                    ? "border border-dashed border-red-300/10 bg-white/4"
                  : "border border-dashed border-border bg-slate-50/80 dark:border-white/10 dark:bg-white/5"
              )}
            >
              <h3 className={cn("text-base font-semibold", isUrban || isHazard ? "text-white" : "dark:text-white")}>
                Nog geen berichten
              </h3>
              <p
                className={cn(
                  "mt-1.5 text-[13px] leading-6",
                  isUrban ? "text-slate-300" : isHazard ? "text-stone-300" : "text-muted-foreground dark:text-slate-300"
                )}
              >
                Zodra je met een instructeur of support schakelt, verschijnt je inbox hier automatisch.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
