"use client";

import { useTheme } from "./ThemeProvider";
import type { ComponentProps } from "react";
import { motion } from "framer-motion";

type ThemeToggleProps = {
  variant?: "default" | "inverted" | "ghost";
} & ComponentProps<"button">;

const ringByVariant = {
  default: "focus-ring",
  inverted: "focus-ring focus:ring-white/60",
  ghost: "focus-ring focus:ring-white/50",
} satisfies Record<NonNullable<ThemeToggleProps["variant"]>, string>;

export function ThemeToggle({ variant = "default", className = "", ...props }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  const handleToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const padding = variant === "ghost" ? "p-0" : "p-0.5";
  const ring = ringByVariant[variant];

  return (
    <button
      type="button"
      aria-pressed={isDark}
      onClick={handleToggle}
      className={`${ring} inline-flex rounded-full ${padding} ${className}`}
      {...props}
    >
      <DarkModeThumb mode={isDark ? "dark" : "light"} />
    </button>
  );
}

function DarkModeThumb({ mode }: Readonly<{ mode: "light" | "dark" }>) {
  return (
    <div
      className={`relative flex w-14 items-center rounded-full border border-subtle transition-colors ${
        mode === "light" ? "justify-end bg-white" : "justify-start bg-perazzi-black/90"
      }`}
    >
      <motion.div
        layout
        transition={{ duration: 0.6, type: "spring" }}
        className={`relative m-1 flex h-5 w-5 items-center justify-center rounded-full shadow-elevated ${
          mode === "light" ? "bg-perazzi-black" : "bg-white"
        }`}
      >
        {mode === "light" ? <SunIcon /> : <MoonIcon />}
      </motion.div>
    </div>
  );
}

const SunIcon = () => <div className="h-3 w-3 rounded-full bg-black" />;

const MoonIcon = () => (
  <div className="relative flex h-3 w-3 items-center justify-center">
    <div className="h-full w-full rounded-full bg-perazzi-black" />
    <div className="absolute left-0 h-3 w-3 rounded-full bg-white" />
  </div>
);
