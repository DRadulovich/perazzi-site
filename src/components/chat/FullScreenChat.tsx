"use client";

import { useState } from "react";
import { ChatPanel } from "@/components/chat/ChatPanel";
import type { ChatTriggerPayload } from "@/lib/chat-trigger";

type FullScreenChatProps = Readonly<{
  initialPrompt?: ChatTriggerPayload | null;
}>;

export function FullScreenChat({ initialPrompt = null }: FullScreenChatProps) {
  const promptKey = initialPrompt ? JSON.stringify(initialPrompt) : "no-initial-prompt";

  return <KeyedFullScreenChat key={promptKey} initialPrompt={initialPrompt} />;
}

type KeyedFullScreenChatProps = {
  readonly initialPrompt: ChatTriggerPayload | null;
};

function KeyedFullScreenChat({ initialPrompt }: KeyedFullScreenChatProps) {
  const [pendingPrompt, setPendingPrompt] = useState<ChatTriggerPayload | null>(initialPrompt);

  return (
    <div className="flex flex-1">
      <ChatPanel
        open
        variant="sheet"
        pendingPrompt={pendingPrompt}
        onPromptConsumed={() => {
          setPendingPrompt(null);
        }}
        className="h-full w-full"
        showResetButton
      />
    </div>
  );
}
