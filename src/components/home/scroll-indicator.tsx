"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";

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
        className="flex items-center gap-2 type-label-tight text-white/80"
        animate={{ y: [0, 6, 0] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        Scroll
        <ChevronDown className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
      </motion.span>
    </motion.div>
  );
}
