import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { SiteShell } from "@/components/site-shell";

export default function HeritageLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider initialTheme="dark" forcedTheme="dark">
      <SiteShell mainClassName="flex-1 px-4 py-10 pt-10 sm:px-6 sm:py-12 lg:px-12">
        {children}
      </SiteShell>
    </ThemeProvider>
  );
}