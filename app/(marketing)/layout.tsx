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
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[36rem]">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#040816_0%,#081122_16%,#111a33_34%,rgba(17,24,39,0.56)_54%,rgba(15,23,42,0)_100%)] dark:bg-[linear-gradient(180deg,#020617_0%,#020617_18%,#0b1220_42%,rgba(2,6,23,0.52)_60%,rgba(2,6,23,0)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_10%,rgba(99,102,241,0.18),transparent_24%),radial-gradient(circle_at_84%_12%,rgba(124,58,237,0.16),transparent_24%),radial-gradient(circle_at_52%_26%,rgba(56,189,248,0.08),transparent_28%)] dark:bg-[radial-gradient(circle_at_14%_10%,rgba(99,102,241,0.16),transparent_24%),radial-gradient(circle_at_84%_12%,rgba(56,189,248,0.1),transparent_24%),radial-gradient(circle_at_52%_26%,rgba(245,158,11,0.08),transparent_28%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,rgba(248,250,252,0),rgba(244,247,255,0.82),rgba(244,247,255,0.96))] dark:bg-[linear-gradient(180deg,rgba(2,6,23,0),rgba(2,6,23,0.82),rgba(2,6,23,0.96))]" />
      </div>

      <div className="relative z-10">
        <SiteHeader />
        <main className="relative">{children}</main>
        <SiteFooter />
      </div>
    </div>
  );
}
