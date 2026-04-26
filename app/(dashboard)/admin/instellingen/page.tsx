import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AdminInstellingenPage() {
  return (
    <>
      <PageHeader
        title="Platforminstellingen"
        description="Beheer globale voorkeuren, toegangen en operationele instellingen."
      />
      <Card className="border border-white/70 bg-white/90 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_24px_80px_-42px_rgba(15,23,42,0.62)]">
        <CardHeader>
          <CardTitle className="dark:text-white">Algemene instellingen</CardTitle>
          <CardDescription className="dark:text-slate-300">Hier kunnen later platformbrede toggles en systeeminstellingen komen.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-7 text-muted-foreground dark:text-slate-300">
          Denk aan e-mailtemplates, notificatieregels, commissie-instellingen, support-SLA&apos;s en moderation defaults.
        </CardContent>
      </Card>
    </>
  );
}
