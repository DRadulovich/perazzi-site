export const locales = ["en"] as const;

export type Locale = (typeof locales)[number];

export const DEFAULT_LOCALE: Locale = "en";

const localeSet = new Set(locales);

export function isLocale(value: string | null | undefined): value is Locale {
  return Boolean(value && localeSet.has(value as Locale));
}
