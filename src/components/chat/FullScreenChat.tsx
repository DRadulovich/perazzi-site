"use client";

import { useEffect, useState } from "react";
import { ChatPanel } from "@/components/chat/ChatPanel";
import type { ChatTriggerPayload } from "@/lib/chat-trigger";

type FullScreenChatProps = Readonly<{
  initialPrompt?: ChatTriggerPayload | null;
}>;

export function FullScreenChat({ initialPrompt = null }: FullScreenChatProps) {
  const [pendingPrompt, setPendingPrompt] = useState<ChatTriggerPayload | null>(initialPrompt);

  useEffect(() => {
    setPendingPrompt(initialPrompt ?? null);
  }, [initialPrompt]);

  return (
    <div className="flex flex-1">
      <ChatPanel
        open
        variant="sheet"
        pendingPrompt={pendingPrompt}
        onPromptConsumed={() => setPendingPrompt(null)}
        className="h-full w-full"
        showResetButton
      />
    </div>
  );
}
