"use client";

import { useState } from "react";

export function CopyButton({
  value,
  label = "Copy",
  ariaLabel,
  className,
}: {
  value: string;
  label?: string;
  ariaLabel?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
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
      className={
        className ??
        "rounded-md border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted/30 hover:text-foreground"
      }
    >
      {copied ? "Copied" : label}
    </button>
  );
}
