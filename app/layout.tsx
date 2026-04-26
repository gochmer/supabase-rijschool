import type { Metadata } from "next";

import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "RijBasis | Premium rijschool webapp",
  description:
    "Moderne rijschool webapp voor leerlingen, instructeurs en beheerders met Supabase, Next.js en een premium dashboardervaring.",
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
