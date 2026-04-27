import { CheckCircle2, Clock3, Mail, MapPin, PhoneCall } from "lucide-react";

import { Reveal, SignatureLine } from "@/components/marketing/homepage-motion";
import { MarketingFaqSection } from "@/components/marketing/marketing-faq-section";
import { SectionHeading } from "@/components/section-heading";
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

const contactItems = [
  {
    icon: Mail,
    title: "E-mail",
    value: "info@rijbasis.nl",
    description: "Voor algemene vragen, samenwerkingen en platforminformatie.",
  },
  {
    icon: PhoneCall,
    title: "Telefoon",
    value: "020 320 44 91",
    description: "Voor direct contact over lessen, pakketten en ondersteuning.",
  },
  {
    icon: MapPin,
    title: "Locatie",
    value: "Nieuwezijds Voorburgwal 120, Amsterdam",
    description: "Ons team werkt centraal aan platform, support en partnerbegeleiding.",
  },
  {
    icon: Clock3,
    title: "Reactietijd",
    value: "Binnen 1 werkdag",
    description: "Snelle opvolging voor leerlingen, instructeurs en rijscholen.",
  },
];

const contactSignals = [
  { label: "Support", value: "Binnen 1 werkdag" },
  { label: "Samenwerking", value: "Persoonlijke opvolging" },
  { label: "Platformvragen", value: "Duidelijk en snel" },
];

const contactReasons = [
  {
    eyebrow: "Onboarding",
    text: "Vragen over instructeurs, pakketten, beschikbaarheid of de beste inrichting van je flow.",
  },
  {
    eyebrow: "Advies",
    text: "Meedenken over branding, presentatie, supportstructuur en dagelijkse inzet van het platform.",
  },
  {
    eyebrow: "Operations",
    text: "Hulp bij betalingen, reviews, beheerflows en praktische keuzes in je rijschoolomgeving.",
  },
  {
    eyebrow: "Groei",
    text: "Sneller schakelen over demos, samenwerkingen en hoe je het platform commercieel inzet.",
  },
];

const supportPoints = [
  "Hulp bij de juiste pakketopbouw voor leerlingen.",
  "Vragen over instructeur onboarding of goedkeuring.",
  "Advies over hoe je de app kunt inzetten voor groei.",
  "Support voor betalingen, reviews of beheerflows.",
];

const formSignals = [
  "Voor leerlingen, instructeurs en rijscholen",
  "Snel opvolgen zonder ruis",
  "Heldere terugkoppeling vanuit een vast team",
];

const contactFaqItems = [
  {
    question: "Hoe snel krijg ik antwoord op mijn bericht?",
    answer:
      "Meestal binnen één werkdag. Voor vragen over onboarding, support of samenwerkingen proberen we zo snel mogelijk een eerste duidelijke reactie te geven.",
  },
  {
    question: "Kan ik ook contact opnemen als ik nog aan het oriënteren ben?",
    answer:
      "Ja, juist dan. We kunnen helpen bij vragen over pakketten, instructeurpresentatie, platforminrichting en wat logisch is voor jouw situatie.",
  },
  {
    question: "Is deze contactpagina alleen voor leerlingen?",
    answer:
      "Nee. Leerlingen, instructeurs, rijscholen en samenwerkingspartners kunnen hier allemaal dezelfde nette supportroute gebruiken.",
  },
];

export default function ContactPage() {
  return (
    <div className="pb-20">
      <section className="relative overflow-hidden px-4 pt-12 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-[30rem] bg-[radial-gradient(circle_at_14%_18%,rgba(99,102,241,0.24),transparent_24%),radial-gradient(circle_at_84%_15%,rgba(124,58,237,0.18),transparent_26%),radial-gradient(circle_at_56%_58%,rgba(56,189,248,0.08),transparent_30%)]" />
        <div className="site-shell relative mx-auto w-full py-12 lg:py-20">
          <div className="grid gap-10 xl:grid-cols-[0.9fr_1.1fr] xl:items-center">
            <Reveal className="space-y-8 lg:pr-6">
              <SectionHeading
                eyebrow="Contact"
                title="Praat met een team dat net zoveel aandacht heeft voor uitstraling als voor gebruiksgemak."
                description="Voor vragen over instructeurs, pakketten, demo&apos;s, samenwerkingen of ondersteuning. We reageren snel en duidelijk."
                tone="inverse"
              />
              <SignatureLine className="h-px w-36 rounded-full" />
              <div className="flex flex-wrap gap-2.5">
                {contactSignals.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm text-slate-200 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.32)] backdrop-blur-xl"
                  >
                    <span className="font-semibold text-white">{item.label}</span>{" "}
                    <span className="text-slate-300">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {contactItems.map((item) => (
                  <div
                    key={item.title}
                    className="flex min-h-[8rem] items-start gap-3 rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] px-4 py-4 shadow-[0_24px_48px_-34px_rgba(15,23,42,0.44)] backdrop-blur-xl"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-sky-100">
                      <item.icon className="size-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold tracking-[0.2em] text-slate-400 uppercase">
                        {item.title}
                      </p>
                      <p className="mt-2 font-semibold text-white">{item.value}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-300">
                        {item.description}
                      </p>
                    </div>
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
                      Persoonlijk contact
                    </p>
                    <span className="rounded-full border border-white/16 bg-white/10 px-3 py-1 text-[10px] font-semibold tracking-[0.18em] text-white/78 uppercase">
                      Premium supportflow
                    </span>
                  </div>
                  <h2 className="max-w-[14ch] text-3xl font-semibold leading-tight sm:text-[2.15rem]">
                    Een premium platform verdient ook een nette supportervaring.
                  </h2>
                  <p className="max-w-[28rem] text-sm leading-8 text-white/74 sm:text-[15px]">
                    We denken mee over onboarding, pakketstructuur, branding, support en dagelijkse
                    operationele keuzes binnen je rijschoolapp.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/16 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/78">
                      Demo&apos;s en samenwerkingen
                    </span>
                    <span className="rounded-full border border-white/16 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/78">
                      Operationele vragen
                    </span>
                    <span className="rounded-full border border-white/16 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/78">
                      Snelle opvolging
                    </span>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {contactReasons.map((item) => (
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
        <div className="grid gap-8 xl:grid-cols-[0.92fr_1.08fr]">
          <Reveal className="space-y-5">
            <div className="rounded-[2rem] border border-white/70 bg-white/88 p-6 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.92))] dark:shadow-[0_24px_80px_-42px_rgba(15,23,42,0.68)]">
              <p className="text-xs font-semibold tracking-[0.28em] text-primary uppercase">
                Waarom contact opnemen
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
                Snelle hulp, nette opvolging en inhoudelijke antwoorden.
              </h3>
              <div className="mt-5 grid gap-3">
                {supportPoints.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-[1.4rem] bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-600 dark:bg-white/6 dark:text-slate-300"
                  >
                    <CheckCircle2 className="mt-1 size-4 shrink-0 text-emerald-500 dark:text-emerald-300" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.9rem] border border-white/70 bg-white/84 p-5 shadow-[0_22px_70px_-42px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.84),rgba(30,41,59,0.78),rgba(15,23,42,0.88))] dark:shadow-[0_22px_70px_-42px_rgba(15,23,42,0.62)]">
              <p className="text-xs font-semibold tracking-[0.28em] text-primary uppercase">
                Wat je mag verwachten
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                {contactSignals.map((item) => (
                  <div key={item.label} className="rounded-[1.3rem] bg-slate-50/90 p-4 dark:bg-white/6">
                    <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
                      {item.label}
                    </p>
                    <p className="mt-2 font-semibold text-slate-950 dark:text-white">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.06}>
            <Card className="border-0 bg-white/92 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)] dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.92),rgba(30,41,59,0.84),rgba(15,23,42,0.94))] dark:shadow-[0_24px_80px_-42px_rgba(15,23,42,0.72)]">
              <CardHeader className="space-y-4">
                <div className="inline-flex w-fit rounded-full border border-sky-100 bg-sky-50/80 px-3 py-1 text-[10px] font-semibold tracking-[0.22em] text-sky-700 uppercase dark:border-white/10 dark:bg-white/6 dark:text-sky-200">
                  Bericht sturen
                </div>
                <div>
                  <CardTitle>Laat je vraag achter en we nemen snel contact met je op</CardTitle>
                  <CardDescription>
                    Geen lange formulieren, wel een duidelijke intake zodat we meteen gericht
                    kunnen reageren.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formSignals.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-slate-300"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <form className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="naam">Naam</Label>
                    <Input id="naam" placeholder="Jouw naam" className="h-11 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mailadres</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="naam@voorbeeld.nl"
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="onderwerp">Onderwerp</Label>
                    <Input
                      id="onderwerp"
                      placeholder="Waar gaat je vraag over?"
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="bericht">Bericht</Label>
                    <Textarea
                      id="bericht"
                      placeholder="Vertel kort waar we je mee kunnen helpen."
                      className="min-h-36 rounded-2xl"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Button className="h-12 w-full rounded-full">Bericht versturen</Button>
                    <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
                      Meestal heb je binnen 1 werkdag een eerste inhoudelijke reactie.
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </section>

      <MarketingFaqSection
        eyebrow="Contact vragen"
        title="Veelgestelde vragen over support en contact"
        description="Deze laag helpt bezoekers sneller te begrijpen wanneer ze contact opnemen, wat ze mogen verwachten en hoe snel er meestal wordt gereageerd."
        items={contactFaqItems}
      />
    </div>
  );
}
