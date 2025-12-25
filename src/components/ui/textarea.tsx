"use client";

import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full resize-none rounded-2xl border border-border bg-card/70 px-3 py-2 text-sm text-ink shadow-sm outline-none backdrop-blur-sm focus:border-ink/40 focus-ring disabled:cursor-not-allowed disabled:bg-card/40 disabled:text-ink-muted",
      className,
    )}
    {...props}
  />
));

Textarea.displayName = "Textarea";
