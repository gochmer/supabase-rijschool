"use client";

import { CalendarClock, ClipboardPenLine, Package2, Sparkles } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { sendMessageAction } from "@/lib/actions/messages";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type InboxMessage = {
  id: string;
  afzender: string;
  onderwerp: string;
  preview: string;
  tijd: string;
  ongelezen: boolean;
};

type MessageRecipientOption = {
  id: string;
  label: string;
};

type MessageSmartTemplate = {
  id: string;
  kind:
    | "package_proposal"
    | "lesson_reminder"
    | "open_slot"
    | "intake_follow_up";
  title: string;
  description: string;
  badgeLabel: string;
  badgeVariant: "info" | "success" | "warning";
  recipientProfileId: string;
  recipientLabel: string;
  subject: string;
  body: string;
};

type MessageSentLogEntry = {
  id: string;
  recipient: string;
  subject: string;
  preview: string;
  time: string;
  originLabel?: string | null;
};

function getTemplateIcon(kind: MessageSmartTemplate["kind"]) {
  switch (kind) {
    case "package_proposal":
      return Package2;
    case "lesson_reminder":
      return CalendarClock;
    case "open_slot":
      return Sparkles;
    case "intake_follow_up":
      return ClipboardPenLine;
    default:
      return Sparkles;
  }
}

function getTemplateButtonLabel(kind: MessageSmartTemplate["kind"]) {
  switch (kind) {
    case "package_proposal":
      return "Gebruik voorstel";
    case "lesson_reminder":
      return "Gebruik herinnering";
    case "open_slot":
      return "Gebruik open moment";
    case "intake_follow_up":
      return "Gebruik opvolging";
    default:
      return "Gebruik template";
  }
}

function canDirectSendTemplate(kind: MessageSmartTemplate["kind"]) {
  return kind === "lesson_reminder" || kind === "intake_follow_up";
}

function formatLogTime(dateValue: Date) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateValue);
}

export function MessageCenter({
  inbox,
  outgoingLog = [],
  recipients,
  recipientLabel,
  tone = "default",
  smartTemplates = [],
}: {
  inbox: InboxMessage[];
  outgoingLog?: MessageSentLogEntry[];
  recipients: MessageRecipientOption[];
  recipientLabel: string;
  tone?: "default" | "hazard" | "urban";
  smartTemplates?: MessageSmartTemplate[];
}) {
  const [isPending, startTransition] = useTransition();
  const [recipientProfileId, setRecipientProfileId] = useState(
    recipients[0]?.id ?? ""
  );
  const [onderwerp, setOnderwerp] = useState("");
  const [inhoud, setInhoud] = useState("");
  const [sentLog, setSentLog] = useState(outgoingLog);
  const isUrban = tone === "urban";
  const isHazard = tone === "hazard";
  const hasComposerValue = Boolean(
    recipientProfileId || onderwerp.trim() || inhoud.trim()
  );

  function applyTemplate(template: MessageSmartTemplate) {
    setRecipientProfileId(template.recipientProfileId);
    setOnderwerp(template.subject);
    setInhoud(template.body);
    toast.success(`Template klaar voor ${template.recipientLabel}.`);
  }

  function prependSentLog(entry: MessageSentLogEntry) {
    setSentLog((current) => [entry, ...current].slice(0, 8));
  }

  function handleDirectTemplateSend(template: MessageSmartTemplate) {
    startTransition(async () => {
      const result = await sendMessageAction({
        recipientProfileId: template.recipientProfileId,
        onderwerp: template.subject,
        inhoud: template.body,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      prependSentLog({
        id: `local-${Date.now()}`,
        recipient: template.recipientLabel,
        subject: template.subject,
        preview: template.body,
        time: formatLogTime(new Date()),
        originLabel: template.title,
      });
      toast.success(`Direct verstuurd naar ${template.recipientLabel}.`);
    });
  }

  function resetComposer() {
    setRecipientProfileId(recipients[0]?.id ?? "");
    setOnderwerp("");
    setInhoud("");
  }

  function handleSubmit() {
    startTransition(async () => {
      const recipientLabelValue =
        recipients.find((recipient) => recipient.id === recipientProfileId)?.label ??
        "Ontvanger";
      const result = await sendMessageAction({
        recipientProfileId,
        onderwerp,
        inhoud,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      prependSentLog({
        id: `local-${Date.now()}`,
        recipient: recipientLabelValue,
        subject: onderwerp.trim(),
        preview: inhoud.trim(),
        time: formatLogTime(new Date()),
        originLabel: "Handmatig bericht",
      });
      resetComposer();
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
          <CardTitle
            className={isUrban || isHazard ? "text-white" : "dark:text-white"}
          >
            Nieuw bericht
          </CardTitle>
          <CardDescription
            className={
              isUrban
                ? "text-slate-300"
                : isHazard
                  ? "text-stone-300"
                  : "dark:text-slate-300"
            }
          >
            Stuur direct een bericht naar {recipientLabel.toLowerCase()}en
            binnen het platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {smartTemplates.length ? (
            <div className="space-y-3 rounded-[1.2rem] border border-white/70 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-white/5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">
                    Slimme templates
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Gebruik een concept en pas het daarna aan als je wilt.
                  </p>
                </div>
                {hasComposerValue ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={resetComposer}
                  >
                    Leeg beginnen
                  </Button>
                ) : null}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {smartTemplates.map((template) => {
                  const TemplateIcon = getTemplateIcon(template.kind);
                  const directSendEnabled = canDirectSendTemplate(template.kind);

                  return (
                    <div
                      key={template.id}
                      className="rounded-[1.1rem] border border-white/80 bg-white/90 p-3 text-left transition hover:border-primary/40 hover:shadow-[0_18px_42px_-28px_rgba(37,99,235,0.38)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.78),rgba(30,41,59,0.62))]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-2.5">
                          <div className="rounded-full bg-primary/10 p-2 text-primary dark:bg-primary/15">
                            <TemplateIcon className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-950 dark:text-white">
                              {template.title}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                              {template.description}
                            </p>
                          </div>
                        </div>
                        <Badge variant={template.badgeVariant}>
                          {template.badgeLabel}
                        </Badge>
                      </div>

                      <div className="mt-3 rounded-[0.95rem] border border-slate-200/80 bg-slate-50/80 p-2.5 dark:border-white/10 dark:bg-white/5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Onderwerp
                        </p>
                        <p className="mt-1 line-clamp-1 text-sm font-medium text-slate-900 dark:text-white">
                          {template.subject}
                        </p>
                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600 dark:text-slate-300">
                          {template.body}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Voor {template.recipientLabel}
                        </span>
                        {directSendEnabled ? (
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            Veilig voor 1-klik
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-primary">
                            Eerst controleren
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => applyTemplate(template)}
                          disabled={isPending}
                        >
                          {getTemplateButtonLabel(template.kind)}
                        </Button>
                        {directSendEnabled ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleDirectTemplateSend(template)}
                            disabled={isPending}
                          >
                            Direct versturen
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

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
            disabled={isPending || !recipients.length}
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
          <CardTitle
            className={isUrban || isHazard ? "text-white" : "dark:text-white"}
          >
            Inbox
          </CardTitle>
          <CardDescription
            className={
              isUrban
                ? "text-slate-300"
                : isHazard
                  ? "text-stone-300"
                  : "dark:text-slate-300"
            }
          >
            Laatste gesprekken en je meest recente verstuurde berichten.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sentLog.length ? (
            <div className="space-y-3 rounded-[1.2rem] border border-white/70 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-white/5">
              <div>
                <p className="text-sm font-semibold text-slate-950 dark:text-white">
                  Verzendlogboek
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Snel overzicht van wat er zojuist en recent is verstuurd.
                </p>
              </div>
              <div className="space-y-2.5">
                {sentLog.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[1rem] border border-slate-200/80 bg-white/85 p-3 dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="line-clamp-1 font-medium text-slate-950 dark:text-white">
                            {item.subject}
                          </p>
                          {item.originLabel ? (
                            <Badge variant="info">{item.originLabel}</Badge>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Naar {item.recipient}
                        </p>
                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600 dark:text-slate-300">
                          {item.preview}
                        </p>
                      </div>
                      <span className="shrink-0 text-[11px] text-slate-500 dark:text-slate-400">
                        {item.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {sentLog.length ? (
            <div className="border-t border-slate-200/70 pt-1 dark:border-white/10" />
          ) : null}

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
                      <h3
                        className={cn(
                          "font-semibold",
                          isUrban || isHazard ? "text-white" : "dark:text-white"
                        )}
                      >
                        {message.onderwerp}
                      </h3>
                      {message.ongelezen ? <Badge variant="info">Nieuw</Badge> : null}
                    </div>
                    <p
                      className={cn(
                        "mt-0.5 text-[12px]",
                        isUrban
                          ? "text-slate-300"
                          : isHazard
                            ? "text-stone-300"
                            : "text-muted-foreground dark:text-slate-300"
                      )}
                    >
                      Van {message.afzender}
                    </p>
                    <p
                      className={cn(
                        "mt-2 text-[13px] leading-6",
                        isUrban
                          ? "text-slate-300"
                          : isHazard
                            ? "text-stone-300"
                            : "text-muted-foreground dark:text-slate-300"
                      )}
                    >
                      {message.preview}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-[11px]",
                      isUrban
                        ? "text-slate-400"
                        : isHazard
                          ? "text-red-100/62"
                          : "text-muted-foreground dark:text-slate-400"
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
              <h3
                className={cn(
                  "text-base font-semibold",
                  isUrban || isHazard ? "text-white" : "dark:text-white"
                )}
              >
                Nog geen berichten
              </h3>
              <p
                className={cn(
                  "mt-1.5 text-[13px] leading-6",
                  isUrban
                    ? "text-slate-300"
                    : isHazard
                      ? "text-stone-300"
                      : "text-muted-foreground dark:text-slate-300"
                )}
              >
                Zodra je met een instructeur of support schakelt, verschijnt je
                inbox hier automatisch.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
