"use client";

import { useState } from "react";

export function CopyButton({
  value,
  label = "Copy",
  ariaLabel,
  className,
  disabled = false,
  title,
}: {
  value: string;
  label?: string;
  ariaLabel?: string;
  className?: string;
  disabled?: boolean;
  title?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    if (disabled) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 900);
    } catch {
      // ignore
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={ariaLabel ?? label}
      aria-disabled={disabled}
      disabled={disabled}
      title={title}
      className={
        className ??
        "rounded-md border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted/30 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-background"
      }
    >
      {copied ? "Copied" : label}
    </button>
  );
}
