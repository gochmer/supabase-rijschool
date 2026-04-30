import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  Mail,
  MapPin,
  Phone,
  Sparkles,
} from "lucide-react";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { publicNavigation } from "@/lib/navigation";

const footerHighlights = [
  "Slimme instructeur matching",
  "Boekingen, berichten en betalingen",
  "Premium dashboards voor elk type gebruiker",
];

const footerLinks = [
  {
    title: "Platform",
    links: [
      { href: "/instructeurs", label: "Instructeurs zoeken" },
      { href: "/pakketten", label: "Pakketten bekijken" },
      { href: "/contact", label: "Demo aanvragen" },
    ],
  },
  {
    title: "Rollen",
    links: [
      { href: "/registreren", label: "Start als leerling" },
      { href: "/registreren", label: "Start als instructeur" },
      { href: "/inloggen", label: "Admin login" },
    ],
  },
];

const footerSignals = [
  "Rustige premium merklaag",
  "Sterke publieke flow",
  "Duidelijke vervolgstappen",
];

export function SiteFooter() {
  return (
    <footer className="px-3 pb-4 sm:px-6 sm:pb-5 lg:px-8">
      <div className="surface-panel site-shell mx-auto w-full overflow-hidden rounded-[1.65rem]">
        <div className="relative">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(14,165,233,0.32),transparent)] dark:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.16),transparent)]" />
        </div>

        <div className="relative border-b border-white/65 px-4 py-5 dark:border-white/10 sm:px-6">
          <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr] xl:items-center xl:gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50/90 px-2.5 py-1 text-[10px] font-semibold tracking-[0.2em] text-sky-700 uppercase shadow-[0_12px_24px_-18px_rgba(14,165,233,0.18)] dark:border-white/10 dark:bg-white/6 dark:text-sky-200 dark:shadow-[0_12px_24px_-18px_rgba(15,23,42,0.38)]">
                <Sparkles className="size-3.5" />
                Premium platform ervaring
              </div>
              <h2 className="max-w-[23ch] text-[1.35rem] font-semibold tracking-tight text-slate-950 dark:text-white sm:text-[1.5rem]">
                Een rijschoolplatform dat vertrouwen opwekt vanaf de eerste klik.
              </h2>
              <p className="max-w-[46ch] text-[13px] leading-6 text-slate-600 dark:text-slate-300">
                RijBasis combineert design, overzicht en slimme flows zodat je leerlingen aantrekt
                en instructeurs professioneel laat werken.
              </p>
              <div className="flex flex-wrap gap-2">
                {footerSignals.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-[0_12px_24px_-18px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-white/6 dark:text-slate-300 dark:shadow-[0_12px_24px_-18px_rgba(15,23,42,0.36)]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[1.25rem] border border-white/10 bg-[linear-gradient(135deg,#0f172a,#1d4ed8,#38bdf8)] p-4 text-white shadow-[0_18px_52px_-36px_rgba(37,99,235,0.3)] sm:p-4.5">
              <div className="absolute inset-x-0 top-0 h-12 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),transparent)]" />
              <div className="absolute -right-8 bottom-0 h-20 w-20 rounded-full bg-white/10 blur-2xl" />
              <p className="relative text-[12px] text-white/72">Klaar om te starten</p>
              <p className="mt-1 text-[1rem] font-semibold leading-5">
                Geef jouw rijschool een modern digitaal fundament
              </p>
              <div className="mt-3 flex flex-col gap-2 md:flex-row">
                <Button
                  asChild
                  variant="secondary"
                  className="h-9 rounded-full border-0 bg-white px-4 text-[13px] text-slate-950 shadow-[0_16px_32px_-20px_rgba(255,255,255,0.5)] hover:bg-white/90"
                >
                  <Link href="/registreren">
                    Gratis starten
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-9 rounded-full border-white/20 bg-white/8 px-4 text-[13px] text-white hover:bg-white/14 hover:text-white"
                >
                  <Link href="/contact">Plan een demo</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 px-4 py-5 sm:px-6 md:grid-cols-2 xl:grid-cols-[1.05fr_0.72fr_0.72fr_0.72fr_0.82fr] xl:items-start">
          <div className="space-y-3 md:col-span-2 xl:col-span-1">
            <Logo />
            <p className="max-w-md text-[13px] leading-6 text-slate-600 dark:text-slate-300">
              RijBasis helpt leerlingen, instructeurs en beheerders samenwerken in een moderne
              rijschoolomgeving met planning, communicatie en pakketten.
            </p>
            <Separator className="max-w-sm bg-slate-200/70 dark:bg-white/10" />
            <div className="grid gap-2">
              {footerHighlights.map((item) => (
                <div
                  key={item}
                  className="surface-muted px-3.5 py-2 text-[12px] text-slate-600 dark:text-slate-300"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="surface-card p-3">
            <div className="space-y-2">
              <h3 className="text-[12px] font-semibold tracking-[0.16em] text-slate-950 uppercase dark:text-white">
                Navigatie
              </h3>
              <div className="grid gap-1 text-[13px] text-slate-600 dark:text-slate-300">
                {publicNavigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="inline-flex items-center justify-between rounded-full px-2.5 py-1.5 transition-colors hover:bg-slate-50 hover:text-slate-950 dark:hover:bg-white/8 dark:hover:text-white"
                  >
                    {item.label}
                    <ArrowRight className="size-3 opacity-45" />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {footerLinks.map((group) => (
            <div
              key={group.title}
              className="surface-card p-3"
            >
              <div className="space-y-2">
                <h3 className="text-[12px] font-semibold tracking-[0.16em] text-slate-950 uppercase dark:text-white">
                  {group.title}
                </h3>
                <div className="grid gap-1 text-[13px] text-slate-600 dark:text-slate-300">
                  {group.links.map((item) => (
                    <Link
                      key={item.href + item.label}
                      href={item.href}
                      className="inline-flex items-center justify-between rounded-full px-2.5 py-1.5 transition-colors hover:bg-slate-50 hover:text-slate-950 dark:hover:bg-white/8 dark:hover:text-white"
                    >
                      {item.label}
                      <ArrowRight className="size-3 opacity-45" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <div className="surface-card p-3">
            <div className="space-y-2">
              <h3 className="text-[12px] font-semibold tracking-[0.16em] text-slate-950 uppercase dark:text-white">
                Contact
              </h3>
              <div className="grid gap-1.5 text-[13px] text-slate-600 dark:text-slate-300">
                <div className="surface-muted inline-flex items-start gap-2 px-3 py-2">
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-sky-600" />
                  <span>Nieuwezijds Voorburgwal 120, Amsterdam</span>
                </div>
                <div className="surface-muted inline-flex items-center gap-2 px-3 py-2">
                  <Mail className="size-3.5 shrink-0 text-sky-600" />
                  <span>info@rijbasis.nl</span>
                </div>
                <div className="surface-muted inline-flex items-center gap-2 px-3 py-2">
                  <Phone className="size-3.5 shrink-0 text-sky-600" />
                  <span>020 320 44 91</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/65 bg-[linear-gradient(180deg,rgba(255,255,255,0.34),rgba(255,255,255,0.08))] px-4 py-3 dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] sm:px-6">
          <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col gap-2 text-[12px] text-slate-600 dark:text-slate-300 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/75 bg-white/70 px-3 py-1 dark:border-white/10 dark:bg-white/6">
                <Sparkles className="size-3.5 text-sky-600 dark:text-sky-200" />
                Ontworpen voor rust, vertrouwen en groei
              </span>
            </div>

            <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-[9px] font-semibold tracking-[0.18em] text-slate-500 uppercase shadow-[0_12px_24px_-18px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-white/6 dark:text-slate-300 dark:shadow-[0_12px_24px_-18px_rgba(15,23,42,0.42)]">
                <CalendarClock className="size-3.5" />
                Premium rijschool software
              </div>
              <p className="text-[12px] text-slate-500 dark:text-slate-400">
                {"\u00A9"} 2026 RijBasis. Modern platform voor rijscholen.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
