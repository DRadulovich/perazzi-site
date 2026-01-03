"use client";

import { NextIntlClientProvider } from "next-intl";
import type { AbstractIntlMessages } from "next-intl";
import { useMemo, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  ThemeProvider,
  type ThemeMode,
} from "@/components/theme/ThemeProvider";
import { ExpandableSectionControllerProvider } from "@/motion/expandable/context/ExpandableSectionController";

type ProvidersProps = {
  children: ReactNode;
  locale: string;
  messages: AbstractIntlMessages;
  initialTheme: ThemeMode;
};

export default function Providers({
  children,
  locale,
  messages,
  initialTheme,
}: Readonly<ProvidersProps>) {
  const pathname = usePathname();
  const routeSpecOverride = useMemo(() => {
    if (pathname?.startsWith("/experience")) {
      return {
        hover: { enabled: false },
        text: { enableCharReveal: false },
      };
    }
    if (pathname?.startsWith("/bespoke")) {
      return {
        text: { enableCharReveal: false },
      };
    }
    return undefined;
  }, [pathname]);

  return (
    <ThemeProvider initialTheme={initialTheme}>
      <ExpandableSectionControllerProvider routeSpecOverride={routeSpecOverride}>
        <NextIntlClientProvider
          locale={locale}
          messages={messages}
          timeZone="Europe/Rome"
        >
          {children}
        </NextIntlClientProvider>
      </ExpandableSectionControllerProvider>
    </ThemeProvider>
  );
}
