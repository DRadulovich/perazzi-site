import type { Metadata } from "next";
import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import { resolveInitialTheme } from "@/lib/initial-theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Perazzi USA - DRadulovich",
    template: "%s · Perazzi USA - DRadulovich",
  },
  description:
    "Editorial experiences from Perazzi celebrating bespoke shotguns, heritage, and craft.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const locale = await getLocale();
  const headerList = await headers();
  const initialTheme = resolveInitialTheme(headerList);

  return (
    <html lang={locale} data-theme={initialTheme} suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cedarville+Cursive&display=swap"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased min-h-screen bg-canvas text-ink overflow-x-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
