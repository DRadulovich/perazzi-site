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
        "rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-[0.25em] transition focus-visible:ring-2 focus-visible:ring-perazzi-red",
        variant === "solid"
          ? "bg-perazzi-red text-white hover:bg-perazzi-red/90"
          : "border border-border/70 text-ink hover:border-ink",
        className,
      )}
    >
      {label}
    </button>
  );
}
