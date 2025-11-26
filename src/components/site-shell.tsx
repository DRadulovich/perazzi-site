import Link from "next/link";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/react";
import { getTranslations } from "next-intl/server";
import { SkipToContent } from "@/components/skip-to-content";
import { PrimaryNav } from "@/components/primary-nav";
import { ChatWidgetClient } from "@/components/chat";

type SiteShellProps = {
  children: ReactNode;
  showChatWidget?: boolean;
  mainClassName?: string;
  contentClassName?: string;
};

export async function SiteShell({
  children,
  showChatWidget = true,
  mainClassName,
  contentClassName,
}: SiteShellProps) {
  const t = await getTranslations("Header");
  const mainClasses = mainClassName ?? "flex-1 px-4 py-12 sm:px-8 lg:px-12";
  const contentClasses = contentClassName ?? "mx-auto flex max-w-7xl flex-col gap-12";

  const primaryLinks = [
    { label: "Shotguns", href: "/shotguns" },
    { label: "Heritage", href: "/heritage" },
    { label: "Bespoke", href: "/bespoke" },
    { label: "Service", href: "/service" },
    { label: "Owners", href: "/experience" }, // TODO: swap to owners destination when available.
  ];

  const secondaryLinks = [
    { label: "Concierge", href: "/concierge" },
    { label: "Contact", href: "/experience#visit" },
    { label: "Dealer / Locator", href: "/experience#dealers" },
  ];

  const legalLinks = [
    { label: "Privacy Policy", href: "/" }, // TODO: replace with real policy route.
    { label: "Terms", href: "/" }, // TODO: replace with real terms route.
  ];

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <SkipToContent />
      <header className="sticky top-0 z-40 border-b border-subtle bg-card px-0 py-0 shadow-sm">
        <PrimaryNav brandLabel={t("brand")} />
      </header>
      <main
        id="site-content"
        className={mainClasses}
      >
        <div className={contentClasses}>{children}</div>
      </main>
      <footer className="border-t border-subtle bg-card text-sm text-ink-muted">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
            <div className="space-y-3 md:col-span-5">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">Perazzi</p>
              <p className="text-base text-ink">
                Purpose-built competition shotguns, crafted in Botticino to grow with the marksmen who refuse to be ordinary.
              </p>
            </div>
            <div className="space-y-3 md:col-span-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">Explore</p>
              <ul className="grid grid-cols-2 gap-3 text-ink sm:grid-cols-3 md:grid-cols-2">
                {primaryLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="font-semibold text-ink transition-colors hover:text-perazzi-red"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-3 md:col-span-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">Support</p>
              <ul className="space-y-2 text-ink">
                {secondaryLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="font-semibold text-ink transition-colors hover:text-perazzi-red"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-10 flex flex-col gap-3 border-t border-subtle pt-6 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between">
            <span className="text-ink">Perazzi S.p.A · Botticino, Italy</span>
            <div className="flex flex-wrap gap-4">
              {legalLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="transition-colors hover:text-ink"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
      {showChatWidget !== false && <ChatWidgetClient />}
      <Analytics />
    </div>
  );
}
