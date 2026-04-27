import type { MetadataRoute } from "next";

import { seoComparisonPages } from "@/lib/seo-comparisons";
import { seoCityConfigs } from "@/lib/seo-cities";
import { seoTipArticles } from "@/lib/seo-tips";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/instructeurs",
    "/pakketten",
    "/motor",
    "/vrachtwagen",
    "/vergelijk",
    "/over-ons",
    "/contact",
  ];

  const cityRoutes = seoCityConfigs.map((city) => `/rijschool/${city.slug}`);
  const automaticCityRoutes = seoCityConfigs.map(
    (city) => `/automaat/${city.slug}`
  );
  const manualCityRoutes = seoCityConfigs.map((city) => `/schakel/${city.slug}`);
  const motorCityRoutes = seoCityConfigs.map((city) => `/motor/${city.slug}`);
  const vrachtwagenCityRoutes = seoCityConfigs.map(
    (city) => `/vrachtwagen/${city.slug}`
  );
  const spoedCityRoutes = seoCityConfigs.map(
    (city) => `/spoedcursus/${city.slug}`
  );
  const proeflesCityRoutes = seoCityConfigs.map((city) => `/proefles/${city.slug}`);
  const examengerichtCityRoutes = seoCityConfigs.map(
    (city) => `/examengericht/${city.slug}`
  );
  const faalangstCityRoutes = seoCityConfigs.map((city) => `/faalangst/${city.slug}`);
  const opfriscursusCityRoutes = seoCityConfigs.map(
    (city) => `/opfriscursus/${city.slug}`
  );
  const praktijkexamenCityRoutes = seoCityConfigs.map(
    (city) => `/praktijkexamen/${city.slug}`
  );
  const comparisonRoutes = seoComparisonPages.map(
    (comparison) => `/vergelijk/${comparison.slug}`
  );
  const tipRoutes = ["/tips", ...seoTipArticles.map((article) => `/tips/${article.slug}`)];

  return [
    ...staticRoutes,
    ...cityRoutes,
    ...automaticCityRoutes,
    ...manualCityRoutes,
    ...motorCityRoutes,
    ...vrachtwagenCityRoutes,
    ...spoedCityRoutes,
    ...proeflesCityRoutes,
    ...examengerichtCityRoutes,
    ...faalangstCityRoutes,
    ...opfriscursusCityRoutes,
    ...praktijkexamenCityRoutes,
    ...comparisonRoutes,
    ...tipRoutes,
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency:
      path.startsWith("/rijschool/") ||
      path.startsWith("/automaat/") ||
      path.startsWith("/schakel/") ||
      path.startsWith("/motor/") ||
      path.startsWith("/vrachtwagen/") ||
      path.startsWith("/spoedcursus/") ||
      path.startsWith("/proefles/") ||
      path.startsWith("/examengericht/") ||
      path.startsWith("/faalangst/") ||
      path.startsWith("/opfriscursus/") ||
      path.startsWith("/praktijkexamen/") ||
      path.startsWith("/vergelijk/") ||
      path.startsWith("/tips/")
        ? "weekly"
        : "monthly",
    priority:
      path === ""
        ? 1
        : path.startsWith("/rijschool/") ||
            path.startsWith("/automaat/") ||
            path.startsWith("/schakel/") ||
            path.startsWith("/motor/") ||
            path.startsWith("/vrachtwagen/") ||
            path.startsWith("/spoedcursus/") ||
            path.startsWith("/proefles/") ||
            path.startsWith("/examengericht/") ||
            path.startsWith("/faalangst/") ||
            path.startsWith("/opfriscursus/") ||
            path.startsWith("/praktijkexamen/") ||
            path.startsWith("/vergelijk/") ||
            path.startsWith("/tips/")
          ? 0.9
          : 0.8,
  }));
}
