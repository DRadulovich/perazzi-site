"use client";

import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  const handleToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      type="button"
      aria-pressed={isDark}
      onClick={handleToggle}
      className="focus-ring inline-flex items-center gap-2 rounded-full border border-subtle bg-card px-3 py-2 text-sm font-medium text-ink"
    >
      <span aria-hidden="true">{isDark ? "🌙" : "☀️"}</span>
      <span>{isDark ? "Dark mode" : "Light mode"}</span>
    </button>
  );
}
