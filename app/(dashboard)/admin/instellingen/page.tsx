import Link from "next/link";
import {
  BellRing,
  CheckCircle2,
  Clock3,
  Database,
  FileClock,
  ShieldCheck,
  TriangleAlert,
  Webhook,
} from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SystemStatusItem = {
  actionHref?: string;
  actionLabel?: string;
  description: string;
  icon: typeof Database;
  label: string;
  status: "ok" | "warning";
  value: string;
};

function hasEnv(name: string) {
  return Boolean(process.env[name]?.trim());
}

function getEnvironmentLabel() {
  if (process.env.NODE_ENV === "production") {
    return "Productie";
  }

  if (process.env.NODE_ENV === "test") {
    return "Test";
  }

  return "Ontwikkeling";
}

function getSystemStatusItems(): SystemStatusItem[] {
  const supabaseConfigured = hasEnv("NEXT_PUBLIC_SUPABASE_URL");
  const publishableKeyConfigured =
    hasEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") ||
    hasEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const lessonCronConfigured =
    hasEnv("LESSON_REMINDER_CRON_SECRET") ||
    process.env.NODE_ENV !== "production";
  const paymentCronConfigured =
    hasEnv("PAYMENT_REMINDER_CRON_SECRET") ||
    process.env.NODE_ENV !== "production";
  const stripeWebhookConfigured = hasEnv("STRIPE_WEBHOOK_SECRET");
  const demoModeEnabled =
    process.env.DEMO_MODE === "true" ||
    process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  return [
    {
      description:
        "De applicatie kan verbinding maken met de ingestelde Supabase project-URL.",
      icon: Database,
      label: "Supabase project",
      status: supabaseConfigured && publishableKeyConfigured ? "ok" : "warning",
      value:
        supabaseConfigured && publishableKeyConfigured
          ? "Geconfigureerd"
          : "Controle nodig",
    },
    {
      description:
        "Demo-data mag alleen bewust in development/test worden gebruikt. In productie hoort dit uit te staan.",
      icon: ShieldCheck,
      label: "Demo mode",
      status: demoModeEnabled ? "warning" : "ok",
      value: demoModeEnabled ? "Ingeschakeld" : "Uit",
    },
    {
      description:
        "Les- en feedbackherinneringen zijn secret-protected. Zonder productie-secret blijven ze geblokkeerd.",
      icon: Clock3,
      label: "Lesherinneringen cron",
      status: lessonCronConfigured ? "ok" : "warning",
      value: lessonCronConfigured ? "Beveiligd" : "Secret ontbreekt",
    },
    {
      description:
        "Betalingsherinneringen zijn secret-protected. Zonder productie-secret blijven ze geblokkeerd.",
      icon: BellRing,
      label: "Betalingsherinneringen cron",
      status: paymentCronConfigured ? "ok" : "warning",
      value: paymentCronConfigured ? "Beveiligd" : "Secret ontbreekt",
    },
    {
      actionHref: "/admin/betalingen",
      actionLabel: "Open betalingen",
      description:
        "Stripe webhooks verwerken betaalupdates. Als de secret ontbreekt, moet betaalstatus extra worden gecontroleerd.",
      icon: Webhook,
      label: "Stripe webhook",
      status: stripeWebhookConfigured ? "ok" : "warning",
      value: stripeWebhookConfigured ? "Geconfigureerd" : "Niet ingesteld",
    },
    {
      actionHref: "/admin/audit",
      actionLabel: "Open audit",
      description:
        "Auditexport is admin-only en schrijft zelf een auditregel wanneer een export wordt gemaakt.",
      icon: FileClock,
      label: "Audit export",
      status: "ok",
      value: "Admin-only",
    },
  ];
}

export default function AdminInstellingenPage() {
  const systemStatusItems = getSystemStatusItems();
  const warningCount = systemStatusItems.filter(
    (item) => item.status === "warning",
  ).length;
  const environmentLabel = getEnvironmentLabel();

  return (
    <div className="space-y-5">
      <PageHeader
        tone="urban"
        title="Platforminstellingen"
        description="Read-only systeemstatus voor productie, demo-modus, cron, webhooks en audit. Geheime waarden worden hier nooit getoond."
        actions={
          <Button asChild className="rounded-full">
            <Link href="/admin/audit">Audit openen</Link>
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="grid gap-3 md:grid-cols-2">
          {systemStatusItems.map((item) => (
            <Card
              key={item.label}
              className="border border-white/70 bg-white/90 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_24px_80px_-42px_rgba(15,23,42,0.62)]"
            >
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-white/8 dark:text-slate-100">
                    <item.icon className="size-5" />
                  </span>
                  <Badge
                    variant={item.status === "ok" ? "success" : "warning"}
                  >
                    {item.value}
                  </Badge>
                </div>
                <div>
                  <CardTitle className="dark:text-white">{item.label}</CardTitle>
                  <CardDescription className="mt-2 leading-6 dark:text-slate-300">
                    {item.description}
                  </CardDescription>
                </div>
              </CardHeader>
              {item.actionHref ? (
                <CardContent>
                  <Button asChild variant="outline" className="rounded-full">
                    <Link href={item.actionHref}>{item.actionLabel}</Link>
                  </Button>
                </CardContent>
              ) : null}
            </Card>
          ))}
        </section>

        <aside className="space-y-4">
          <Card className="border border-white/70 bg-white/90 shadow-sm dark:border-white/10 dark:bg-white/[0.055]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                {warningCount ? (
                  <TriangleAlert className="size-5 text-amber-500" />
                ) : (
                  <CheckCircle2 className="size-5 text-emerald-500" />
                )}
                Statusoverzicht
              </CardTitle>
              <CardDescription className="dark:text-slate-300">
                {warningCount
                  ? `${warningCount} onderdeel${warningCount === 1 ? "" : "en"} vraagt controle.`
                  : "Alle zichtbare systeemchecks staan rustig."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground dark:text-slate-300">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
                <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
                  Omgeving
                </p>
                <p className="mt-1 font-semibold text-slate-950 dark:text-white">
                  {environmentLabel}
                </p>
              </div>
              <p className="leading-7">
                Deze pagina toont alleen veilige statusinformatie. Secrets,
                tokens en databasewachtwoorden worden bewust niet zichtbaar
                gemaakt.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-white/70 bg-white/90 shadow-sm dark:border-white/10 dark:bg-white/[0.055]">
            <CardHeader>
              <CardTitle className="dark:text-white">Veilige beheerlinks</CardTitle>
              <CardDescription className="dark:text-slate-300">
                Gebruik deze plekken voor echte records en supportcontrole.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button asChild variant="outline" className="justify-start">
                <Link href="/admin/support">Supporttickets</Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/admin/reviews">Reviewmoderatie</Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/admin/leerlingen">Leerlingbeheer</Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
