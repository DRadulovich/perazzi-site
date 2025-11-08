import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/react";
import { getTranslations } from "next-intl/server";
import { SkipToContent } from "@/components/skip-to-content";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { PrimaryNav } from "@/components/primary-nav";

type SiteShellProps = {
  children: ReactNode;
};

export async function SiteShell({ children }: SiteShellProps) {
  const t = await getTranslations("Header");

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <SkipToContent />
      <header className="border-b border-subtle bg-card px-4 py-6 shadow-sm sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-ink-muted">
                {t("tagline")}
              </p>
              <p className="text-lg font-semibold">{t("brand")}</p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <LocaleSwitcher />
              <ThemeToggle />
            </div>
          </div>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <nav
              aria-label={t("nav.ariaLabel")}
              className="text-sm text-ink-muted"
            >
              <span className="font-medium text-ink">
                {t("nav.layoutShell")}
              </span>{" "}
              <span aria-hidden="true">·</span>{" "}
              <span>{t("nav.routesScaffold")}</span>
            </nav>
            <PrimaryNav />
          </div>
        </div>
      </header>
      <main
        id="site-content"
        className="flex-1 px-4 py-12 sm:px-8 lg:px-12"
      >
        <div className="mx-auto flex max-w-5xl flex-col gap-12">{children}</div>
      </main>
      <footer className="border-t border-subtle bg-card px-4 py-8 text-sm text-ink-muted sm:px-8">
        <div className="mx-auto max-w-6xl">
          Placeholder footer · Service, legal, and contact hooks will live here.
        </div>
      </footer>
      <Analytics />
    </div>
  );
}
