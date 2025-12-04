import type { ReactNode } from "react";
import { draftMode, headers } from "next/headers";
import { getLocale, getMessages } from "next-intl/server";
import { VisualEditing } from "next-sanity/visual-editing";
import Providers from "@/app/providers";
import { resolveInitialTheme } from "@/lib/initial-theme";
import { SanityLive } from "@/sanity/lib/live";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  const headerList = await headers();
  const { isEnabled: isDraftMode } = await draftMode();
  const initialTheme = resolveInitialTheme(headerList);

  return (
    <Providers
      locale={locale}
      messages={messages}
      initialTheme={initialTheme}
    >
      {children}
      <SanityLive />
      {isDraftMode && <VisualEditing />}
    </Providers>
  );
}
