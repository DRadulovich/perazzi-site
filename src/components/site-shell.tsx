import Link from "next/link";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/react";
import { getTranslations } from "next-intl/server";
import { SkipToContent } from "@/components/skip-to-content";
import { PrimaryNav } from "@/components/primary-nav";
import { ChatWidgetClient } from "@/components/chat";
import { Container, Text } from "@/components/ui";
import { SiteSettingsProvider } from "@/components/site-settings-context";
import { getSiteSettings } from "@/sanity/queries/site-settings";

type SiteShellProps = {
  readonly children: ReactNode;
  readonly showChatWidget?: boolean;
  readonly mainClassName?: string;
  readonly contentClassName?: string;
};

export async function SiteShell({
  children,
  showChatWidget = true,
  mainClassName,
  contentClassName,
}: SiteShellProps) {
  const t = await getTranslations("Header");
  const settings = await getSiteSettings();
  const mainClasses = mainClassName ?? "flex-1 py-10 sm:py-12";
  const contentClasses = contentClassName ?? "flex flex-col gap-8 sm:gap-12";

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

  const sanitizeLinks = (links: Array<{ label?: string; href?: string }>) =>
    links.filter((link): link is { label: string; href: string } => Boolean(link?.label && link?.href));

  const hasFooterColumns = Boolean(settings?.footer?.columns?.length);
  const footerColumns = hasFooterColumns
    ? settings?.footer?.columns ?? []
    : [
        { title: "Explore", links: primaryLinks },
        { title: "Support", links: secondaryLinks },
      ];

  const rawFooterLegalLinks = settings?.footer?.legalLinks?.length
    ? settings?.footer?.legalLinks ?? []
    : legalLinks;
  const footerLegalLinks = sanitizeLinks(rawFooterLegalLinks);

  const journalUiDefaults = {
    heroLabel: "Journal",
    categoryLabel: "Journal",
    featuredLabel: "Featured:",
    search: {
      label: "Search the journal",
      placeholder: "Stories, interviews, news…",
      buttonLabel: "Search",
    },
    newsletter: {
      heading: "Stay in the loop",
      body: "Receive new stories, interviews, and news straight from Botticino.",
      inputLabel: "Email",
      inputPlaceholder: "you@example.com",
      submitLabel: "Subscribe",
      successMessage: "Thank you—check your inbox for confirmation.",
    },
  };

  const journalUi = {
    ...journalUiDefaults,
    ...settings?.journalUi,
    search: {
      ...journalUiDefaults.search,
      ...settings?.journalUi?.search,
    },
    newsletter: {
      ...journalUiDefaults.newsletter,
      ...settings?.journalUi?.newsletter,
    },
  };

  const ctaDefaults = {
    heading: settings?.ctaDefaults?.heading ?? "Begin your fitting",
  };

  const footerBrandLabel =
    settings?.footer?.brandLabel ?? settings?.brandLabel ?? "Perazzi";
  const footerDescription =
    settings?.footer?.description ??
    "Purpose-built competition shotguns, crafted in Botticino to grow with the marksmen who refuse to be ordinary.";
  const footerAddressLine =
    settings?.footer?.addressLine ?? "Perazzi S.p.A · Botticino, Italy";

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <SkipToContent />
      <header className="sticky top-0 z-50 border-b border-subtle bg-card px-0 py-0 shadow-soft">
        <PrimaryNav
          brandLabel={settings?.brandLabel ?? t("brand")}
          ariaLabel={t("nav.ariaLabel")}
          navItems={settings?.nav}
          navFlyouts={settings?.navFlyouts}
          navCtas={settings?.navCtas}
          storeLink={settings?.storeLink}
        />
      </header>
      <main
        id="site-content"
        className={mainClasses}
      >
        <Container size="xl" className={contentClasses}>
          <SiteSettingsProvider value={{ ctaDefaults, journalUi }}>
            {children}
          </SiteSettingsProvider>
        </Container>
      </main>
      <footer className="border-t border-subtle bg-card type-body-sm text-ink-muted">
        <Container size="xl" className="py-8 sm:py-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-10">
            <div className="space-y-3 md:col-span-5">
              <Text size="label-tight" muted>
                {footerBrandLabel}
              </Text>
              <Text className="text-ink">
                {footerDescription}
              </Text>
            </div>
            {footerColumns.map((column, index) => {
              const columnTitle = column.title ?? `footer-column-${index + 1}`;
              let columnSpan = "md:col-span-3";
              if (!hasFooterColumns && column.title === "Explore") {
                columnSpan = "md:col-span-4";
              }
              const listClass = column.title === "Explore"
                ? "grid grid-cols-2 gap-3 text-ink sm:grid-cols-3 md:grid-cols-2"
                : "space-y-2 text-ink";

              return (
                <div key={columnTitle} className={`space-y-3 ${columnSpan}`}>
                <Text size="label-tight" muted>
                  {column.title}
                </Text>
                <ul className={listClass}>
                  {column.links?.map((link) => (
                    <li key={link?.label ?? link?.href ?? "footer-link"}>
                      <Link
                        href={link?.href ?? "/"}
                        className="type-nav text-ink transition-colors hover:text-perazzi-red"
                      >
                        {link?.label ?? ""}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              );
            })}
          </div>
          <div className="mt-10 flex flex-col gap-3 border-t border-subtle pt-6 type-caption text-ink-muted sm:flex-row sm:items-center sm:justify-between">
            <Text asChild size="caption" className="text-ink">
              <span>{footerAddressLine}</span>
            </Text>
            <div className="flex flex-wrap gap-4">
              {footerLegalLinks.map((link) => (
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
        </Container>
      </footer>
      {showChatWidget !== false && <ChatWidgetClient />}
      <Analytics />
    </div>
  );
}
