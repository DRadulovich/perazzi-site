import type { Metadata } from "next";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import Providers from "@/app/providers";
import { PrimaryNav } from "@/components/primary-nav";
import { AdminShell } from "@/components/admin/AdminShell";
import type { AdminSidebarNavItem } from "@/components/pgpt-insights/nav/AdminSidebarNav";
import { AdminDrawerProvider } from "@/components/admin/AdminDrawerContext";
import { SidebarContentProvider } from "@/components/admin/AdminSidebarContext";
import { SidebarDrawerHost } from "@/components/admin/SidebarDrawerHost";
import { ResizableSidebarProvider } from "@/components/admin/ResizableSidebarContext";
import { ResizableSidebarHost } from "@/components/admin/ResizableSidebarHost";
import { fetchOpenQaFlagCount } from "@/lib/pgpt-insights/queries";
import { resolveInitialTheme } from "@/lib/initial-theme";
import { Activity, AlertTriangle, BarChart2, Clock3, Flag, Grid2X2, ListChecks } from "lucide-react";

export const metadata: Metadata = {
  manifest: "/admin/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "perazzi_admin",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: [
      {
        url: "/pwa-admin/apple-touch-icon-180.png",
        sizes: "180x180",
        type: "image/png",
      },
      {
        url: "/pwa-admin/apple-touch-icon-167.png",
        sizes: "167x167",
        type: "image/png",
      },
      {
        url: "/pwa-admin/apple-touch-icon-152.png",
        sizes: "152x152",
        type: "image/png",
      },
    ],
  },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  const headerList = await headers();
  const initialTheme = resolveInitialTheme(headerList);
  const t = await getTranslations("Header");
  let qaOpenCount: number = 0;
  try {
    qaOpenCount = await fetchOpenQaFlagCount();
  } catch (error) {
    // Fail-soft: keep the admin shell alive even if the count query fails
    console.error("[admin-layout] failed to fetch QA open flag count", error);
  }

  const navItems: AdminSidebarNavItem[] = [
    {
      href: "/admin/pgpt-insights",
      label: "Insights",
      description: "Overview, guardrails, logs",
      icon: <BarChart2 className="h-4 w-4" strokeWidth={2} />,
      matchers: [{ type: "path", path: "/admin/pgpt-insights" }],
    },
    {
      href: "/admin/pgpt-insights/qa",
      label: "QA Review",
      description: "Flags, notes, adjudication",
      icon: <Flag className="h-4 w-4" strokeWidth={2} />,
      badgeCount: qaOpenCount,
      matchers: [{ type: "startsWith", prefix: "/admin/pgpt-insights/qa" }],
    },
    {
      href: "/admin/pgpt-insights/session",
      label: "Sessions",
      description: "Per-session explorer & timelines",
      icon: <Clock3 className="h-4 w-4" strokeWidth={2} />,
      matchers: [
        { type: "startsWith", prefix: "/admin/pgpt-insights/session" },
      ],
    },
    {
      href: "/admin/pgpt-insights/archetype",
      label: "Archetype Trend",
      description: "Stacked mix, margin line, alerts",
      icon: <Activity className="h-4 w-4" strokeWidth={2} />,
      matchers: [{ type: "startsWith", prefix: "/admin/pgpt-insights/archetype" }],
    },
    {
      href: "/admin/pgpt-insights/triggers",
      label: "Trigger Terms",
      description: "Weekly signals driving archetypes",
      icon: <ListChecks className="h-4 w-4" strokeWidth={2} />,
      matchers: [{ type: "startsWith", prefix: "/admin/pgpt-insights/triggers" }],
    },
    {
      href: "/admin/pgpt-insights/templates",
      label: "Template Heat-map",
      description: "Pivot of archetype × intent × template",
      icon: <Grid2X2 className="h-4 w-4" strokeWidth={2} />,
      matchers: [{ type: "startsWith", prefix: "/admin/pgpt-insights/templates" }],
    },
    {
      href: "/admin/pgpt-insights/quality",
      label: "Low-Margin Sessions",
      description: "Streaks with margin < 5%",
      icon: <AlertTriangle className="h-4 w-4" strokeWidth={2} />,
      matchers: [{ type: "startsWith", prefix: "/admin/pgpt-insights/quality" }],
    },
  ];

  return (
    <Providers
      locale={locale}
      messages={messages}
      initialTheme={initialTheme}
    >
      <div className="min-h-screen bg-canvas text-ink">
        <SidebarContentProvider>
          <AdminDrawerProvider>
            <ResizableSidebarProvider>
              {/* Mobile drawer */}
              <SidebarDrawerHost navItems={navItems} />

              {/* Header */}
              <header className="sticky top-0 z-50">
                <PrimaryNav
                  brandLabel={t("brand")}
                  ariaLabel={t("nav.ariaLabel")}
                  variant="transparent"
                />
              </header>

              {/* Desktop resizable layout & page content */}
              <AdminShell>
                <ResizableSidebarHost navItems={navItems}>
                  {children}
                </ResizableSidebarHost>
              </AdminShell>
            </ResizableSidebarProvider>
          </AdminDrawerProvider>
        </SidebarContentProvider>
      </div>
    </Providers>
  );
}
