"use client";

import { useTheme } from "./ThemeProvider";
import type { ComponentProps } from "react";
import { motion } from "framer-motion";
import { BsFillCloudyFill, BsStarFill } from "react-icons/bs";

type ThemeToggleProps = {
  variant?: "default" | "inverted" | "ghost";
} & ComponentProps<"button">;

export function ThemeToggle({ variant = "default", className = "", ...props }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  const handleToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const padding =
    variant === "ghost" ? "p-0" : "p-1";
  const ring =
    variant === "inverted"
      ? "focus-ring focus:ring-white/60"
      : variant === "ghost"
        ? "focus-ring focus:ring-white/50"
        : "focus-ring";

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

function DarkModeThumb({ mode }: { mode: "light" | "dark" }) {
  const lightBg = "from-white via-white to-white";
  const darkBg = "from-perazzi-black to-[#101010]";

  return (
    <div
      className={`relative flex w-18 items-center rounded-full bg-gradient-to-b ${
        mode === "light" ? `justify-end ${lightBg}` : `justify-start ${darkBg}`
      }`}
      style={{ width: "4.5rem" }}
    >
      <motion.div
        layout
        transition={{ duration: 0.6, type: "spring" }}
        className="relative m-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-lg"
      >
        {mode === "light" ? (
          <Sun />
        ) : (
          <Moon />
        )}
      </motion.div>
      {mode === "light" ? <Clouds /> : <Stars />}
    </div>
  );
}

const Sun = () => (
  <div className="relative h-6 w-6 rounded-full bg-perazzi-black" />
);

const Moon = () => (
  <div className="relative h-6 w-6 rounded-full bg-white">
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-white/80"
    />
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="absolute left-1 bottom-1.5 h-2 w-2 rounded-full bg-white/60"
    />
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.35, duration: 0.4 }}
      className="absolute right-2 top-3 h-1 w-1 rounded-full bg-white/70"
    />
  </div>
);

const Stars = () => (
  <>
    <motion.span
      animate={{ scale: [0.8, 1, 0.8], opacity: [0.7, 1, 0.7] }}
      transition={{ repeat: Infinity, duration: 4 }}
      className="absolute left-12 top-2 text-xs text-perazzi-red"
    >
      <BsStarFill />
    </motion.span>
    <motion.span
      animate={{ scale: [1, 0.7, 1], opacity: [0.8, 0.4, 0.8] }}
      transition={{ repeat: Infinity, duration: 3 }}
      className="absolute left-16 top-4 text-lg text-perazzi-red"
    >
      <BsStarFill />
    </motion.span>
    <motion.span
      animate={{ scale: [1, 0.5, 1] }}
      transition={{ repeat: Infinity, duration: 2.5 }}
      className="absolute left-10 top-7 text-sm text-perazzi-red"
    >
      <BsStarFill />
    </motion.span>
  </>
);

const Clouds = () => (
  <>
    <motion.span
      animate={{ x: [-15, 0, 15], opacity: [0, 1, 0] }}
      transition={{ duration: 6, repeat: Infinity }}
      className="absolute left-10 top-1 text-xs text-perazzi-red"
    >
      <BsFillCloudyFill />
    </motion.span>
    <motion.span
      animate={{ x: [-10, 0, 10], opacity: [0, 1, 0] }}
      transition={{ duration: 8, repeat: Infinity, delay: 0.3 }}
      className="absolute left-6 top-4 text-lg text-perazzi-red"
    >
      <BsFillCloudyFill />
    </motion.span>
    <motion.span
      animate={{ x: [-8, 0, 8], opacity: [0, 1, 0] }}
      transition={{ duration: 7, repeat: Infinity, delay: 0.5 }}
      className="absolute left-12 top-7 text-base text-perazzi-red"
    >
      <BsFillCloudyFill />
    </motion.span>
  </>
);
