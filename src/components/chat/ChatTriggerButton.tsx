"use client";

import type { ChatTriggerPayload } from "@/lib/chat-trigger";
import { triggerChat } from "@/lib/chat-trigger";
import { Button } from "@/components/ui";

type ChatTriggerButtonProps = Readonly<{
  label: string;
  payload: ChatTriggerPayload;
  variant?: "solid" | "outline";
  className?: string;
}>;

export function ChatTriggerButton({
  label,
  payload,
  variant = "solid",
  className,
}: ChatTriggerButtonProps) {
  return (
    <Button
      type="button"
      onClick={() => triggerChat(payload)}
      variant={variant === "solid" ? "primary" : "secondary"}
      size="sm"
      className={className}
    >
      {label}
    </Button>
  );
}
