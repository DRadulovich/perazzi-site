import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { DEFAULT_LOCALE } from "@/i18n/locales";

export const metadata: Metadata = {
  title: {
    default: "Perazzi USA - DRadulovich",
    template: "%s · Perazzi USA - DRadulovich",
  },
  description:
    "Editorial experiences from Perazzi celebrating bespoke shotguns, heritage, and craft.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Perazzi USA",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: [
      {
        url: "/pwa/apple-touch-icon-180.png",
        sizes: "180x180",
        type: "image/png",
      },
      {
        url: "/pwa/apple-touch-icon-167.png",
        sizes: "167x167",
        type: "image/png",
      },
      {
        url: "/pwa/apple-touch-icon-152.png",
        sizes: "152x152",
        type: "image/png",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const locale = DEFAULT_LOCALE;
  const initialTheme = "light";

  return (
    <html lang={locale} data-theme={initialTheme} suppressHydrationWarning>
      <body
        className="font-sans antialiased min-h-screen bg-canvas text-ink overflow-x-hidden"
      >
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
