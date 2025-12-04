import type { ThemeMode } from "@/components/theme/ThemeProvider";

type HeaderGetter = {
  get(name: string): string | null;
};

export function resolveInitialTheme(headerList: HeaderGetter): ThemeMode {
  const cookieTheme = getCookieValue(headerList.get("cookie"), "theme");
  const headerTheme =
    headerList.get("sec-ch-prefers-color-scheme") ??
    headerList.get("Sec-CH-Prefers-Color-Scheme");

  if (isTheme(cookieTheme)) return cookieTheme;
  if (isTheme(headerTheme)) return headerTheme;
  return "light";
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
