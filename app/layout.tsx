import type { Metadata } from "next";

import "./globals.css";
import { Providers } from "@/components/providers";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "RijBasis | Premium rijschool webapp",
  description:
    "Moderne rijschool webapp voor leerlingen, instructeurs en beheerders met Supabase, Next.js en een premium dashboardervaring.",
  applicationName: "RijBasis",
  openGraph: {
    title: "RijBasis | Premium rijschool webapp",
    description:
      "Moderne rijschool webapp voor leerlingen, instructeurs en beheerders met Supabase, Next.js en een premium dashboardervaring.",
    url: siteUrl,
    siteName: "RijBasis",
    locale: "nl_NL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RijBasis | Premium rijschool webapp",
    description:
      "Moderne rijschool webapp voor leerlingen, instructeurs en beheerders met Supabase, Next.js en een premium dashboardervaring.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className="h-full scroll-smooth antialiased" suppressHydrationWarning>
      <body className="min-h-full bg-background text-foreground transition-[background-color,color] duration-300">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
