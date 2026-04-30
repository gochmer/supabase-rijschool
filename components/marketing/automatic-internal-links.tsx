import Link from "next/link";
import { ArrowRight, Link2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { seoCityConfigs } from "@/lib/seo-cities";
import { seoComparisonPages } from "@/lib/seo-comparisons";
import { seoTipArticles } from "@/lib/seo-tips";

type AutomaticInternalLinksProps = {
  title?: string;
  description?: string;
  citySlug?: string;
  currentPath?: string;
  limit?: number;
};

function cityLabel(citySlug?: string) {
  return seoCityConfigs.find((city) => city.slug === citySlug)?.name ?? seoCityConfigs[0]?.name ?? "Rotterdam";
}

export function AutomaticInternalLinks({
  title = "Slim verder lezen",
  description = "Automatisch gekozen interne links die bezoekers en zoekmachines helpen de juiste route te vinden.",
  citySlug,
  currentPath = "",
  limit = 8,
}: AutomaticInternalLinksProps) {
  const city = cityLabel(citySlug);
  const cityRoutes = citySlug
    ? [
        { href: `/rijschool/${citySlug}`, label: `Rijschool ${city}` },
        { href: `/automaat/${citySlug}`, label: `Automaat rijles ${city}` },
        { href: `/schakel/${citySlug}`, label: `Schakel rijles ${city}` },
        { href: `/proefles/${citySlug}`, label: `Proefles ${city}` },
        { href: `/spoedcursus/${citySlug}`, label: `Spoedcursus ${city}` },
        { href: `/faalangst/${citySlug}`, label: `Faalangst rijles ${city}` },
        { href: `/praktijkexamen/${citySlug}`, label: `Praktijkexamen ${city}` },
        { href: `/examengericht/${citySlug}`, label: `Examengericht rijden ${city}` },
        { href: `/opfriscursus/${citySlug}`, label: `Opfriscursus ${city}` },
      ]
    : seoCityConfigs.slice(0, 4).flatMap((entry) => [
        { href: `/rijschool/${entry.slug}`, label: `Rijschool ${entry.name}` },
        { href: `/automaat/${entry.slug}`, label: `Automaat ${entry.name}` },
      ]);

  const comparisonRoutes = seoComparisonPages.slice(0, 3).map((comparison) => ({
    href: `/vergelijk/${comparison.slug}`,
    label: comparison.title,
  }));

  const tipRoutes = seoTipArticles.slice(0, 3).map((article) => ({
    href: `/tips/${article.slug}`,
    label: article.title,
  }));

  const links = [...cityRoutes, ...comparisonRoutes, ...tipRoutes]
    .filter((link) => link.href !== currentPath)
    .slice(0, limit);

  if (!links.length) return null;

  return (
    <Card className="rounded-[2rem] border border-white/80 bg-white/92 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.2)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.9),rgba(30,41,59,0.84),rgba(15,23,42,0.92))]">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-white/10 dark:text-sky-200">
            <Link2 className="size-5" />
          </div>
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group flex items-center justify-between rounded-[1rem] border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm font-semibold text-slate-700 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:text-slate-950 dark:border-white/10 dark:bg-white/6 dark:text-slate-200 dark:hover:border-white/18 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <span>{link.label}</span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
