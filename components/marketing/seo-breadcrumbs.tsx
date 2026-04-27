import Link from "next/link";
import { ChevronRight } from "lucide-react";

type SeoBreadcrumbItem = {
  label: string;
  href: string;
};

type SeoBreadcrumbsProps = {
  items: SeoBreadcrumbItem[];
  className?: string;
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function toAbsoluteUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export function SeoBreadcrumbs({
  items,
  className,
}: SeoBreadcrumbsProps) {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: toAbsoluteUrl(item.href),
    })),
  };

  return (
    <div className={className}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <div key={`${item.href}-${item.label}`} className="flex items-center gap-2">
              {index > 0 ? (
                <ChevronRight className="size-3.5 text-slate-400 dark:text-slate-500" />
              ) : null}
              {isLast ? (
                <span className="font-semibold text-slate-950 dark:text-white">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-slate-500 transition-colors hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
                >
                  {item.label}
                </Link>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
