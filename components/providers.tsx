"use client";

import dynamic from "next/dynamic";
import { ThemeProvider } from "next-themes";

const Toaster = dynamic(
  () => import("@/components/ui/sonner").then((module) => module.Toaster),
  { ssr: false },
);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      {children}
      <Toaster richColors position="top-right" />
    </ThemeProvider>
  );
}
