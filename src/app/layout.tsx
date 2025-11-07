import type { Metadata } from "next";
import { headers } from "next/headers";
import { getLocale, getMessages } from "next-intl/server";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import type { ThemeMode } from "@/components/theme/ThemeProvider";

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
    default: "Perazzi Editorial",
    template: "%s · Perazzi Editorial",
  },
  description:
    "Editorial experiences from Perazzi celebrating bespoke shotguns, heritage, and craft.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const headerList = await headers();

  const cookieTheme = getCookieValue(
    headerList.get("cookie"),
    "theme",
  );
  const headerTheme =
    headerList.get("sec-ch-prefers-color-scheme") ??
    headerList.get("Sec-CH-Prefers-Color-Scheme");

  const initialTheme: ThemeMode = isTheme(cookieTheme)
    ? cookieTheme
    : isTheme(headerTheme)
      ? headerTheme
      : "light";

  return (
    <html lang={locale} data-theme={initialTheme} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-canvas text-ink`}
      >
        <Providers
          locale={locale}
          messages={messages}
          initialTheme={initialTheme}
        >
          {children}
        </Providers>
      </body>
    </html>
  );
}

function isTheme(value: string | undefined | null): value is ThemeMode {
  return value === "light" || value === "dark";
}

function getCookieValue(cookieHeader: string | null, key: string) {
  if (!cookieHeader) return undefined;
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .map((part) => part.split("="))
    .find(([name]) => name === key)?.[1];
}
