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

type ThemeProviderProps = {
  children: ReactNode;
  initialTheme: ThemeMode;
  forcedTheme?: ThemeMode;
};

export function ThemeProvider({
  children,
  initialTheme,
  forcedTheme,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeMode>(
    forcedTheme ?? initialTheme,
  );

  const applyTheme = useCallback(
    (nextTheme: ThemeMode, persist = true) => {
      const resolvedTheme = forcedTheme ?? nextTheme;

      setThemeState(resolvedTheme);

      if (typeof document !== "undefined") {
        document.documentElement.dataset.theme = resolvedTheme;
      }

      // If we're in a forced theme subtree, don't write to storage/cookies.
      if (!forcedTheme && persist && typeof window !== "undefined") {
        try {
          window.localStorage.setItem(STORAGE_KEY, resolvedTheme);
          document.cookie = `theme=${resolvedTheme}; path=/; max-age=${COOKIE_MAX_AGE}`;
        } catch {
          // swallow storage errors (e.g., private mode)
        }
      }
    },
    [forcedTheme],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const raf = window.requestAnimationFrame(() => {
      // If a forced theme is provided, always use that and bail.
      if (forcedTheme) {
        applyTheme(forcedTheme, false);
        return;
      }

      const stored = window.localStorage.getItem(STORAGE_KEY);

      if (stored === "light" || stored === "dark") {
        applyTheme(stored, false);
      } else {
        applyTheme(initialTheme, false);
      }
    });

    return () => { window.cancelAnimationFrame(raf); };
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