"use client";

import { NextIntlClientProvider } from "next-intl";
import type { AbstractIntlMessages } from "next-intl";
import type { ReactNode } from "react";
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
  return (
    <ThemeProvider initialTheme={initialTheme}>
      <ExpandableSectionControllerProvider>
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
