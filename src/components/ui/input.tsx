"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "w-full rounded-xl border border-border bg-card/70 px-3 py-2 type-body-sm text-ink shadow-soft outline-none backdrop-blur-sm focus:border-ink/40 focus-ring disabled:cursor-not-allowed disabled:bg-card/40 disabled:text-ink-muted",
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";
