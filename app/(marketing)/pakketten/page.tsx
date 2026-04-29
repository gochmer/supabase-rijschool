import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, PackageCheck } from "lucide-react";

import { Reveal } from "@/components/marketing/homepage-motion";
import { MarketingFaqSection } from "@/components/marketing/marketing-faq-section";
import { RouteCoach } from "@/components/marketing/route-coach";
import { SeoBreadcrumbs } from "@/components/marketing/seo-breadcrumbs";
import { PackageMatchmaker } from "@/components/packages/package-matchmaker";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPublicPackages } from "@/lib/data/packages";
import { formatCurrency } from "@/lib/format";
import { rijlesTypeOptions } from "@/lib/lesson-types";
import { getPackageCoverObjectPosition } from "@/lib/package-covers";
import { getPackageVisualConfig } from "@/lib/package-visuals";
import { seoCityConfigs } from "@/lib/seo-cities";
import { cn } from "@/lib/utils";

const advisorSignals = [
  "Persoonlijk afgestemd op niveau en tempo",
  "Duidelijk aanbod zonder ruis",
  "Sterker keuzegevoel voor nieuwe leerlingen",
];

const packagesFaqItems = [
  {
    question: "Waarom zijn er verschillende rijlespakketten?",
    answer:
      "Niet elke leerling start op hetzelfde niveau. Door pakketten te splitsen op tempo, examendruk en type begeleiding wordt vergelijken duidelijker en eerlijker.",
  },
  {
    question: "Wat zit meestal in een pakket inbegrepen?",
    answer:
      "Meestal een aantal lessen, een duidelijke prijsstructuur en soms extra onderdelen zoals examenfocus of praktijk-examenprijs.",
  },
  {
    question: "Wanneer kies ik beter een proefles dan direct een pakket?",
    answer:
      "Als je eerst wilt voelen of de instructeur en lesstijl passen. Daarna kun je veel gerichter kiezen welk pakket logisch is.",
  },
];

export default async function PakkettenPage() {
  const packages = await getPublicPackages();
  const routeCoachCities = seoCityConfigs.slice(0, 6).map((city) => ({
    slug: city.slug,
    name: city.name,
  }));
  const cheapestPackage = packages
    .filter((pakket) => pakket.prijs > 0)
    .sort((a, b) => a.prijs - b.prijs)[0];
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Pakketten", href: "/pakketten" },
  ];

  return (
    <div className="pb-20">
      <section className="relative overflow-hidden px-4 pt-12 sm:px-6 sm:pt-16 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_12%_14%,rgba(56,189,248,0.2),transparent_24%),radial-gradient(circle_at_82%_16%,rgba(29,78,216,0.16),transparent_24%),radial-gradient(circle_at_56%_60%,rgba(249,115,22,0.1),transparent_24%)]" />
        <div className="site-shell relative mx-auto w-full pb-8">
          <SeoBreadcrumbs items={breadcrumbItems} className="mb-4" />
          <Reveal className="overflow-hidden rounded-[2.55rem] border border-white/80 bg-white/92 shadow-[0_34px_110px_-56px_rgba(15,23,42,0.3)] backdrop-blur dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.94),rgba(30,41,59,0.88),rgba(15,23,42,0.96))]">
            <div className="grid gap-0 xl:grid-cols-[1fr_0.85fr]">
              <div className="p-6 sm:p-8">
                <div className="flex flex-wrap gap-2">
                  {rijlesTypeOptions.map((option) => (
                    <Link
                      key={option.value}
                      href={option.href}
                      className={cn(
                        "rounded-full border px-3.5 py-2 text-xs font-semibold tracking-[0.16em] uppercase transition-all",
                        option.value === "auto"
                          ? "border-slate-950 bg-slate-950 text-white dark:border-sky-300/30 dark:bg-white/10"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-white/16 dark:hover:text-white"
                      )}
                    >
                      {option.label}
                    </Link>
                  ))}
                </div>

                <div className="mt-7 max-w-4xl space-y-5">
                  <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-[10px] font-semibold tracking-[0.22em] text-sky-700 uppercase dark:border-sky-300/16 dark:bg-sky-400/10 dark:text-sky-100">
                    <PackageCheck className="size-3.5" />
                    Pakketten kiezen
                  </div>
                  <div>
                    <p className="text-xs font-semibold tracking-[0.28em] text-primary uppercase">Rijles aanbod</p>
                    <h1 className="mt-4 max-w-[17ch] text-4xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-[3.25rem]">
                      Kies een pakket dat past bij je niveau, tempo en examendoel.
                    </h1>
                    <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
                      Vergelijk pakketten op prijs, aantal lessen, trajecttype en begeleiding. Gebruik daarna de pakketkiezer om sneller te bepalen welke route logisch voelt.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    <Button asChild className="rounded-full"><Link href="#pakketten-aanbod">Bekijk aanbod <ArrowRight className="size-4" /></Link></Button>
                    <Button asChild variant="outline" className="rounded-full"><Link href="#pakketkiezer">Gebruik pakketkiezer</Link></Button>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 bg-slate-50/80 p-6 dark:border-white/10 dark:bg-white/[0.04] sm:p-8 xl:border-l xl:border-t-0">
                <div className="grid h-full content-center gap-4">
                  {[
                    { label: "Actieve pakketten", value: `${packages.length}`, text: "Alle zichtbare pakketten op één plek." },
                    { label: "Vanaf", value: cheapestPackage ? formatCurrency(cheapestPackage.prijs) : "Op aanvraag", text: "Laagste pakketprijs met bekende prijs." },
                    { label: "Keuzehulp", value: "Matchmaker", text: "Laat leerlingen sneller richting kiezen." },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[1.45rem] border border-slate-200 bg-white/90 p-4 shadow-[0_20px_46px_-36px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-white/6">
                      <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-300">{item.label}</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">{item.value}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="pakketten-aanbod" className="site-shell mx-auto w-full px-4 pb-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold tracking-[0.28em] text-primary uppercase">Aanbod</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">Populaire rijlespakketten</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">Rustig vergelijken op prijs, inhoud en begeleiding. De pakketkiezer staat direct onder het aanbod.</p>
          </div>
          <Button asChild variant="outline" className="rounded-full"><Link href="/instructeurs">Bekijk instructeurs <ArrowRight className="size-4" /></Link></Button>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {packages.map((pakket, index) => {
            const visual = getPackageVisualConfig(pakket.icon_key, pakket.visual_theme);
            const coverObjectPosition = getPackageCoverObjectPosition(pakket.cover_position, pakket.cover_focus_x, pakket.cover_focus_y);
            const isLeadCard = pakket.uitgelicht || index === 1;
            const packagePoints = [
              pakket.lessen ? `${pakket.lessen} lessen als duidelijke basis` : "Flexibel opgebouwd rond jouw tempo",
              "Boekingen, betalingen en voortgang blijven gekoppeld",
            ];

            return (
              <Card key={pakket.id} className={cn("group relative flex min-h-[25rem] flex-col overflow-hidden border shadow-[0_24px_80px_-42px_rgba(15,23,42,0.22)] transition-all duration-500 hover:-translate-y-1", isLeadCard ? "border-sky-300/16 bg-[linear-gradient(160deg,rgba(15,23,42,0.98),rgba(30,41,59,0.96),rgba(14,165,233,0.18))] text-white" : "border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(30,41,59,0.88),rgba(15,23,42,0.92))]")}> 
                {pakket.badge || pakket.uitgelicht ? (
                  <div className={cn("absolute right-3 top-3 z-20 rounded-full border px-2.5 py-1 text-[9px] font-semibold tracking-[0.14em] uppercase backdrop-blur-md", isLeadCard ? visual.featuredBadgeClass : visual.softBadgeClass)}>{pakket.uitgelicht ? "Uitgelicht" : pakket.badge}</div>
                ) : null}

                {pakket.cover_url ? (
                  <div className={cn("relative z-10 mx-4 mt-4 h-24 overflow-hidden rounded-[1.1rem] border", isLeadCard ? "border-white/10" : "border-slate-200/80 dark:border-white/10")}>
                    <Image src={pakket.cover_url} alt={`Cover voor ${pakket.naam}`} fill sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" style={{ objectPosition: coverObjectPosition }} />
                    <div className={isLeadCard ? "absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/18 to-transparent" : "absolute inset-0 bg-gradient-to-t from-slate-950/35 via-slate-950/10 to-transparent"} />
                  </div>
                ) : null}

                <CardHeader className="relative z-10 space-y-2 px-4 pb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className={cn("rounded-full border px-2 py-0.5 text-[9px] font-semibold tracking-[0.14em] uppercase", isLeadCard ? "border-white/14 bg-white/10 text-white/78" : visual.softBadgeClass)}>{visual.label}</span>
                    {pakket.uitgelicht ? <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[9px] font-semibold tracking-[0.14em] text-sky-700 uppercase dark:border-sky-300/18 dark:bg-sky-400/12 dark:text-sky-100">Aanbevolen</span> : null}
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className={`flex size-9 items-center justify-center rounded-[1rem] ${isLeadCard ? visual.featuredIconClass : visual.softIconClass}`}><visual.Icon className="size-4" /></div>
                    <div className="min-w-0">
                      <CardTitle className={cn("text-[1rem]", isLeadCard ? "text-white" : "text-slate-950 dark:text-white")}>{pakket.naam}</CardTitle>
                      <CardDescription className={cn("mt-1 line-clamp-2 text-[12px] leading-5", isLeadCard ? "text-white/72" : "text-slate-600 dark:text-slate-300")}>{pakket.beschrijving}</CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="relative z-10 flex flex-1 flex-col space-y-3 px-4 pb-4">
                  <div>
                    <p className={`text-[1.55rem] font-semibold ${isLeadCard ? "text-white" : "text-slate-950 dark:text-white"}`}>{pakket.prijs === 0 ? "Op aanvraag" : formatCurrency(pakket.prijs)}</p>
                    <p className={`mt-1 text-[12px] ${isLeadCard ? "text-white/70" : "text-muted-foreground dark:text-slate-300"}`}>{pakket.lessen ? `${pakket.lessen} lessen inbegrepen` : "Persoonlijk samengesteld"}</p>
                  </div>
                  <div className={cn("grid gap-1.5 rounded-[1rem] p-2.5", isLeadCard ? "border border-white/10 bg-white/8" : "border border-slate-200 bg-slate-50/90 dark:border-white/10 dark:bg-white/6")}> 
                    {packagePoints.map((item) => (
                      <div key={item} className={`flex items-start gap-2 rounded-[0.8rem] px-2.5 py-2 text-[12px] leading-5 ${isLeadCard ? "bg-white/6 text-white/82" : "bg-white text-slate-600 dark:bg-white/6 dark:text-slate-300"}`}>
                        <CheckCircle2 className={`mt-0.5 size-4 shrink-0 ${isLeadCard ? "text-sky-200" : "text-emerald-500 dark:text-emerald-300"}`} />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-auto" />
                  <Button className={cn("h-9 w-full rounded-full text-[13px] transition-all duration-300 hover:-translate-y-0.5", isLeadCard ? "bg-white text-slate-950 hover:bg-white/92" : "bg-[linear-gradient(135deg,#0f172a,#1d4ed8,#38bdf8)] text-white")}>Pakket aanvragen</Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section id="pakketkiezer" className="site-shell mx-auto w-full px-4 pb-4 pt-8 sm:px-6 lg:px-8">
        <div className="mb-7 flex items-center gap-3 sm:mb-8">
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-semibold tracking-[0.18em] text-slate-600 uppercase shadow-[0_14px_30px_-24px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-white/6 dark:text-slate-300">Pakketkiezer</span>
          <div className="h-px flex-1 bg-[linear-gradient(90deg,rgba(56,189,248,0.34),rgba(148,163,184,0.2),transparent)]" />
        </div>
        <PackageMatchmaker packages={packages} />
      </section>

      <section className="site-shell mx-auto w-full px-4 pb-8 pt-8 sm:px-6 lg:px-8">
        <RouteCoach cities={routeCoachCities} />
      </section>

      <section className="site-shell mx-auto w-full px-4 pt-10 sm:px-6 lg:px-8">
        <Reveal>
          <div className="rounded-[2.45rem] border border-white/70 bg-white/90 p-6 shadow-[0_32px_100px_-50px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.9),rgba(30,41,59,0.84),rgba(15,23,42,0.92))] sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-4">
                <p className="text-xs font-semibold tracking-[0.28em] text-primary uppercase">Persoonlijk advies</p>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">We helpen je het pakket kiezen dat past bij jouw niveau, tempo en ambitie.</h2>
                <p className="text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">Zo voelt het aanbod niet alleen mooier, maar ook duidelijker en overtuigender voor nieuwe leerlingen.</p>
                <div className="flex flex-wrap gap-2">{advisorSignals.map((item) => <span key={item} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-slate-300">{item}</span>)}</div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 rounded-full px-6"><Link href="/registreren">Gratis starten</Link></Button>
                <Button asChild variant="outline" size="lg" className="h-12 rounded-full px-6"><Link href="/contact">Advies aanvragen</Link></Button>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <MarketingFaqSection eyebrow="Pakket vragen" title="Veelgestelde vragen over rijlespakketten" description="Sterke pakketpagina's geven niet alleen aanbod, maar beantwoorden ook de twijfels die vaak vlak voor een keuze spelen." items={packagesFaqItems} />
    </div>
  );
}
