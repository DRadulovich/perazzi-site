import { useEffect, useRef } from "react";
import type { ChatEntry } from "@/components/chat/useChatState";

interface ConversationViewProps {
  messages: ChatEntry[];
}

export function ConversationView({ messages }: ConversationViewProps) {
  const listRef = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <p className="rounded-2xl bg-subtle px-4 py-3 text-sm text-ink-muted">
        Ask about platforms, service, or heritage. I’ll respond in the Perazzi workshop tone.
      </p>
    );
  }

  return (
    <ul ref={listRef} className="flex flex-col gap-4">
      {messages.map((msg) => (
        <li key={msg.id} className={msg.role === "user" ? "text-right" : "text-left"}>
          <div
            className={`inline-block max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === "user" ? "bg-ink text-card" : "bg-card border border-subtle text-ink"}`}
          >
            {msg.content.split(/\n{2,}/).map((paragraph, index) => (
              <p key={index} className="mb-2 whitespace-pre-line last:mb-0">
                {paragraph}
              </p>
            ))}
            {msg.similarity !== undefined && (
              <p className="mt-2 text-xs text-ink-muted">
                Similarity: {(msg.similarity * 100).toFixed(1)}%
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
