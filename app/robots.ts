import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/instructeurs",
        "/rijschool/",
        "/automaat/",
        "/schakel/",
        "/motor/",
        "/vrachtwagen/",
        "/spoedcursus/",
        "/proefles/",
        "/examengericht/",
        "/faalangst/",
        "/opfriscursus/",
        "/praktijkexamen/",
        "/tips",
      ],
      disallow: ["/admin/", "/dashboard/", "/instructeur/", "/leerling/", "/auth/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
