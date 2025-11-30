"use client";

import clsx from "clsx";
import type { ChatTriggerPayload } from "@/lib/chat-trigger";
import { triggerChat } from "@/lib/chat-trigger";

type ChatTriggerButtonProps = {
  label: string;
  payload: ChatTriggerPayload;
  variant?: "solid" | "outline";
  className?: string;
};

export function ChatTriggerButton({
  label,
  payload,
  variant = "solid",
  className,
}: ChatTriggerButtonProps) {
  return (
    <button
      type="button"
      onClick={() => triggerChat(payload)}
      className={clsx(
        "inline-flex items-center justify-center rounded-full px-4 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.25em] transition focus-ring",
        variant === "solid"
          ? "bg-perazzi-red text-white hover:bg-perazzi-red/90"
          : "border border-border/60 text-ink hover:border-ink",
        className,
      )}
    >
      {label}
    </button>
  );
}
