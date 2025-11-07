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
};

export function ThemeProvider({
  children,
  initialTheme,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeMode>(initialTheme);

  const applyTheme = useCallback((nextTheme: ThemeMode, persist = true) => {
    setThemeState(nextTheme);

    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = nextTheme;
    }

    if (persist && typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, nextTheme);
        document.cookie = `theme=${nextTheme}; path=/; max-age=${COOKIE_MAX_AGE}`;
      } catch {
        // swallow storage errors (e.g., private mode)
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const raf = window.requestAnimationFrame(() => {
      if (stored === "light" || stored === "dark") {
        applyTheme(stored, false);
      } else {
        applyTheme(initialTheme, false);
      }
    });

    return () => window.cancelAnimationFrame(raf);
  }, [applyTheme, initialTheme]);

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
