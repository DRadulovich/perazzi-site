"use client";

import { motion, useReducedMotion } from "framer-motion";

type ScrollIndicatorProps = Readonly<{
  className?: string;
}>;

export function ScrollIndicator({ className }: ScrollIndicatorProps) {
  const prefersReducedMotion = useReducedMotion();

  // useReducedMotion defaults to false on the server, then updates after hydration,
  // so this still renders initially and disappears for users preferring reduced motion.
  if (prefersReducedMotion) {
    return null;
  }

  return (
    <motion.div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 bottom-6 flex justify-center ${className ?? ""}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6 }}
    >
      <motion.span
        className="flex items-center gap-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.4em] text-white/80"
        animate={{ y: [0, 6, 0] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        Scroll
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.span>
    </motion.div>
  );
}
