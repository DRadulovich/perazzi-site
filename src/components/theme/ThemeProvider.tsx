"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThemeMode = "light" | "dark";

type ThemeContextValue = {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "theme";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

type ThemeProviderProps = Readonly<{
  children: ReactNode;
  initialTheme: ThemeMode;
  forcedTheme?: ThemeMode;
}>;

export function ThemeProvider({
  children,
  initialTheme,
  forcedTheme,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeMode>(
    forcedTheme ?? initialTheme,
  );

  const applyTheme = useCallback(
    (nextTheme: ThemeMode, persist = true) => {
      const resolvedTheme = forcedTheme ?? nextTheme;

      setTheme(resolvedTheme);

      if (globalThis.document !== undefined) {
        globalThis.document.documentElement.dataset.theme = resolvedTheme;
      }

      // If we're in a forced theme subtree, don't write to storage/cookies.
      if (!forcedTheme && persist && globalThis.window !== undefined) {
        try {
          globalThis.window.localStorage.setItem(STORAGE_KEY, resolvedTheme);
          if (globalThis.document !== undefined) {
            globalThis.document.cookie = `theme=${resolvedTheme}; path=/; max-age=${COOKIE_MAX_AGE}`;
          }
        } catch {
          // swallow storage errors (e.g., private mode)
        }
      }
    },
    [forcedTheme],
  );

  useEffect(() => {
    if (globalThis.window === undefined) {
      return;
    }

    const raf = globalThis.window.requestAnimationFrame(() => {
      // If a forced theme is provided, always use that and bail.
      if (forcedTheme) {
        applyTheme(forcedTheme, false);
        return;
      }

      const stored = globalThis.window.localStorage.getItem(STORAGE_KEY);

      if (stored === "light" || stored === "dark") {
        applyTheme(stored, false);
      } else {
        applyTheme(initialTheme, false);
      }
    });

    return () => {
      globalThis.window.cancelAnimationFrame(raf);
    };
  }, [applyTheme, forcedTheme, initialTheme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme: applyTheme,
    }),
    [applyTheme, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
