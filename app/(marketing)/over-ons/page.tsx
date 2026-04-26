import { CheckCircle2, ShieldCheck, Sparkles, Users } from "lucide-react";

import { Reveal, SignatureLine } from "@/components/marketing/homepage-motion";
import { SectionHeading } from "@/components/section-heading";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const pillars = [
  {
    icon: Sparkles,
    title: "Premium ervaring",
    description:
      "We ontwerpen digitale rijschoolsoftware die net zo verzorgd voelt als een modern SaaS-product.",
    support:
      "Elke laag moet vertrouwen opbouwen: van eerste indruk tot dagelijks dashboardgebruik.",
  },
  {
    icon: Users,
    title: "Menselijke begeleiding",
    description:
      "Leerlingen, instructeurs en admins werken in dezelfde flow zonder dat communicatie versnipperd raakt.",
    support:
      "Zo blijft de ervaring duidelijk voor iedereen die met planning, lessen of support werkt.",
  },
  {
    icon: ShieldCheck,
    title: "Professionele basis",
    description:
      "Auth, rollen, workflows en beheer zijn opgezet om mee te groeien met kwaliteit en controle.",
    support:
      "Rust in processen ontstaat pas echt als de technische basis ook stevig en schaalbaar is.",
  },
];

const brandSignals = [
  { label: "1 platform", value: "Voor leerling, instructeur en admin" },
  { label: "Rust", value: "In planning, support en opvolging" },
  { label: "Schaalbaar", value: "Gebouwd voor groei en kwaliteit" },
];

const brandPromises = [
  {
    eyebrow: "Matching",
    text: "Echte instructeur matching op regio, prijs en stijl zodat het kiezen duidelijker voelt.",
  },
  {
    eyebrow: "Dagelijks gebruik",
    text: "Heldere dashboards voor planning, pakketten en communicatie zonder losse tooling.",
  },
  {
    eyebrow: "Controle",
    text: "Admin grip op kwaliteit, reviews en support zodat het platform professioneel blijft.",
  },
  {
    eyebrow: "Uitstraling",
    text: "Een visuele lijn die vertrouwen opbouwt vanaf de eerste klik tot in de dashboards.",
  },
];

const approachCards = [
  {
    title: "Voor leerlingen",
    text: "Een duidelijke route van instructeur zoeken naar boeken, berichten en voortgang.",
  },
  {
    title: "Voor instructeurs",
    text: "Meer grip op beschikbaarheid, profielkwaliteit, aanvragen en inkomsten.",
  },
  {
    title: "Voor admins",
    text: "Sneller sturen op kwaliteit, support, review-moderatie en platformgroei.",
  },
  {
    title: "Voor het merk",
    text: "Een premium uitstraling die vertrouwen geeft nog voor de eerste les is geboekt.",
  },
];

export default function OverOnsPage() {
  return (
    <div className="pb-20">
      <section className="relative overflow-hidden px-4 pt-12 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(circle_at_14%_18%,rgba(99,102,241,0.24),transparent_24%),radial-gradient(circle_at_84%_16%,rgba(124,58,237,0.18),transparent_26%),radial-gradient(circle_at_56%_58%,rgba(56,189,248,0.08),transparent_30%)]" />
        <div className="site-shell relative mx-auto w-full py-12 lg:py-20">
          <div className="grid gap-10 xl:grid-cols-[0.9fr_1.1fr] xl:items-center">
            <Reveal className="space-y-8 lg:pr-6">
              <SectionHeading
                eyebrow="Over ons"
                title="RijBasis is gebouwd voor rijscholen die kwaliteit willen uitstralen in elke stap van het traject."
                description="Geen losse tools, rommelige communicatie of verouderde interface. Wel een rustige, premium omgeving waarin plannen, begeleiden en beheren logisch aanvoelt."
                tone="inverse"
              />
              <SignatureLine className="h-px w-36 rounded-full" />
              <div className="grid gap-3 sm:grid-cols-3">
                {brandSignals.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[1.65rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] p-4 shadow-[0_24px_48px_-34px_rgba(15,23,42,0.44)] backdrop-blur-xl"
                  >
                    <p className="text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                      {item.label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal
              delay={0.08}
              className="relative overflow-hidden rounded-[2.6rem] bg-[linear-gradient(145deg,rgba(7,12,28,0.98),rgba(17,24,39,0.94),rgba(67,56,202,0.82),rgba(109,40,217,0.72))] px-6 py-6 text-white shadow-[0_40px_110px_-56px_rgba(15,23,42,0.82)] sm:px-7 sm:py-7 xl:min-h-[34rem] xl:px-8 xl:py-8"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.1),transparent_30%)]" />
              <div className="relative flex h-full flex-col justify-between gap-8">
                <div className="max-w-[29rem] space-y-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-semibold tracking-[0.24em] text-violet-200 uppercase">
                      Waar we voor staan
                    </p>
                    <span className="rounded-full border border-white/16 bg-white/10 px-3 py-1 text-[10px] font-semibold tracking-[0.18em] text-white/78 uppercase">
                      Rust en kwaliteit
                    </span>
                  </div>
                  <h2 className="max-w-[13ch] text-3xl font-semibold leading-tight sm:text-[2.15rem]">
                    We bouwen software die dagelijkse rijschoolprocessen kalmer en sterker maakt.
                  </h2>
                  <p className="max-w-[28rem] text-sm leading-8 text-white/74 sm:text-[15px]">
                    Niet door meer lagen toe te voegen, maar juist door planning, communicatie en
                    beheer in een duidelijke premium lijn samen te brengen.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/16 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/78">
                      Minder ruis
                    </span>
                    <span className="rounded-full border border-white/16 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/78">
                      Meer controle
                    </span>
                    <span className="rounded-full border border-white/16 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/78">
                      Professionele uitstraling
                    </span>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {brandPromises.map((item) => (
                    <div
                      key={item.eyebrow}
                      className="flex min-h-[8.75rem] flex-col rounded-[1.65rem] border border-white/12 bg-white/10 p-4 text-white/82 backdrop-blur"
                    >
                      <p className="text-[10px] font-semibold tracking-[0.18em] text-violet-100 uppercase">
                        {item.eyebrow}
                      </p>
                      <p className="mt-3 text-sm leading-7">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="site-shell mx-auto w-full px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {pillars.map((item) => (
            <Reveal key={item.title}>
              <Card className="border-0 bg-white/88 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)] dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.9),rgba(30,41,59,0.84),rgba(15,23,42,0.92))] dark:shadow-[0_24px_80px_-42px_rgba(15,23,42,0.68)]">
                <CardHeader>
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-white/10 dark:text-sky-200">
                    <item.icon className="size-5" />
                  </div>
                  <CardTitle className="pt-4 text-xl">{item.title}</CardTitle>
                  <CardDescription className="text-sm leading-7">
                    {item.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 text-sm leading-7 text-muted-foreground dark:text-slate-300">
                  {item.support}
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="site-shell mx-auto w-full px-4 pt-8 sm:px-6 lg:px-8">
        <Reveal>
          <div className="rounded-[2.45rem] border border-white/70 bg-white/84 p-6 shadow-[0_32px_100px_-50px_rgba(15,23,42,0.35)] backdrop-blur dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.9),rgba(30,41,59,0.84),rgba(15,23,42,0.92))] dark:shadow-[0_32px_100px_-50px_rgba(15,23,42,0.68)] sm:p-8">
            <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-4">
                <p className="text-xs font-semibold tracking-[0.28em] text-primary uppercase">
                  Onze aanpak
                </p>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                  We bouwen een rijschoolplatform dat rust brengt in dagelijkse processen.
                </h2>
                <p className="text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
                  Minder losse communicatie, minder handmatig zoeken, meer overzicht voor alle
                  rollen. Zo voelt de hele ervaring professioneler aan voor zowel leerling als
                  team.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {approachCards.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-[1.7rem] bg-slate-50 p-5 dark:bg-white/6"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-white/10 dark:text-sky-200">
                        <CheckCircle2 className="size-4" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
                          {item.title}
                        </h3>
                        <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                          {item.text}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
