import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/react";
import { getTranslations } from "next-intl/server";
import { SkipToContent } from "@/components/skip-to-content";
import { PrimaryNav } from "@/components/primary-nav";
import { ChatWidgetClient } from "@/components/chat";

type SiteShellProps = {
  children: ReactNode;
  showChatWidget?: boolean;
};

export async function SiteShell({ children, showChatWidget = true }: SiteShellProps) {
  const t = await getTranslations("Header");

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <SkipToContent />
      <header className="sticky top-0 z-40 border-b border-subtle bg-card px-0 py-0 shadow-sm">
        <PrimaryNav brandLabel={t("brand")} />
      </header>
      <main
        id="site-content"
        className="flex-1 px-4 py-12 sm:px-8 lg:px-12"
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-12">{children}</div>
      </main>
      <footer className="border-t border-subtle bg-card px-4 py-8 text-sm text-ink-muted sm:px-8">
        <div className="mx-auto max-w-6xl">
          Placeholder footer · Service, legal, and contact hooks will live here.
        </div>
      </footer>
      {showChatWidget !== false && <ChatWidgetClient />}
      <Analytics />
    </div>
  );
}
