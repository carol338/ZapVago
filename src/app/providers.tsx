"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { OfflineBanner } from "@/components/shared/OfflineBanner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <OfflineBanner />
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
