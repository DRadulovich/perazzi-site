import type { ReactNode } from "react";
import Providers from "@/app/providers";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import en from "@/messages/en.json";
import { SanityLive } from "@/sanity/lib/live";

export const revalidate = 3600;

export default function SiteLayout({ children }: { children: ReactNode }) {
  const locale = DEFAULT_LOCALE;
  const messages = en;
  const initialTheme = "light";

  return (
    <Providers
      locale={locale}
      messages={messages}
      initialTheme={initialTheme}
    >
      {children}
      <SanityLive />
    </Providers>
  );
}
