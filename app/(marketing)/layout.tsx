import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "RijBasis",
    url: siteUrl,
    inLanguage: "nl-NL",
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "RijBasis",
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description:
      "RijBasis is een premium rijschoolplatform voor leerlingen, instructeurs en beheerders met focus op profielkwaliteit, planning en vertrouwen.",
  };

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[34rem]">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#050b18_0%,#0f172a_28%,rgba(15,23,42,0.62)_52%,rgba(15,23,42,0)_100%)] dark:bg-[linear-gradient(180deg,#020617_0%,#020617_24%,rgba(2,6,23,0.58)_58%,rgba(2,6,23,0)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_12%,rgba(56,189,248,0.12),transparent_26%),radial-gradient(circle_at_86%_14%,rgba(29,78,216,0.12),transparent_28%)] dark:bg-[radial-gradient(circle_at_16%_12%,rgba(56,189,248,0.1),transparent_26%),radial-gradient(circle_at_86%_14%,rgba(59,130,246,0.1),transparent_28%)]" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-[linear-gradient(180deg,rgba(248,250,252,0),rgba(244,247,255,0.88),rgba(244,247,255,0.98))] dark:bg-[linear-gradient(180deg,rgba(2,6,23,0),rgba(2,6,23,0.84),rgba(2,6,23,0.98))]" />
      </div>

      <div className="relative z-10">
        <SiteHeader />
        <main className="relative">{children}</main>
        <SiteFooter />
      </div>
    </div>
  );
}
