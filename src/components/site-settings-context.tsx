"use client";

import type { ReactNode } from "react";
import { createContext, useContext } from "react";
import type { CtaDefaults, JournalUi } from "@/types/site-settings";

type SiteSettingsContextValue = {
  ctaDefaults?: CtaDefaults;
  journalUi?: JournalUi;
};

const SiteSettingsContext = createContext<SiteSettingsContextValue>({});

export function SiteSettingsProvider({
  value,
  children,
}: Readonly<{
  value: SiteSettingsContextValue;
  children: ReactNode;
}>) {
  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
