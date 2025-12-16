import type { ReactNode } from "react";
import { headers } from "next/headers";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import Providers from "@/app/providers";
import { PrimaryNav } from "@/components/primary-nav";
import { resolveInitialTheme } from "@/lib/initial-theme";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  const headerList = await headers();
  const initialTheme = resolveInitialTheme(headerList);
  const t = await getTranslations("Header");

  return (
    <Providers
      locale={locale}
      messages={messages}
      initialTheme={initialTheme}
    >
      <div className="min-h-screen bg-canvas text-ink">
        <header className="sticky top-0 z-50">
          <PrimaryNav brandLabel={t("brand")} variant="transparent" />
        </header>
        {children}
      </div>
    </Providers>
  );
}
