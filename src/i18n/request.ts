import { headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import type { AbstractIntlMessages } from "next-intl";
import en from "@/messages/en.json";
import { DEFAULT_LOCALE, isLocale, type Locale } from "./locales";

const messagesMap: Record<Locale, AbstractIntlMessages> = {
  en,
};

export default getRequestConfig(async ({ locale, requestLocale }) => {
  const headerStore = await headers();
  const headerLocale = headerStore.get("x-active-locale");
  const candidates = [
    headerLocale,
    locale,
    await requestLocale,
    DEFAULT_LOCALE,
  ];

  let resolvedLocale: Locale = DEFAULT_LOCALE;

  for (const candidate of candidates) {
    const normalized = candidate?.toString().toLowerCase();
    if (isLocale(normalized)) {
      resolvedLocale = normalized;
      break;
    }
  }

  return {
    locale: resolvedLocale,
    timeZone: "Europe/Rome",
    messages: messagesMap[resolvedLocale],
  };
});
