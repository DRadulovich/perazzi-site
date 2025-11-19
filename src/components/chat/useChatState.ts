"use client";

import { useState } from "react";
import type { ChatMessage } from "@/types/perazzi-assistant";

export type ChatEntry = {
  id: string;
  role: "system" | "assistant" | "user";
  content: string;
  similarity?: number;
};

export function useChatState(initialMessages: ChatEntry[] = []) {
  const [messages, setMessages] = useState<ChatEntry[]>(initialMessages);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<{
    pageUrl?: string;
    modelSlug?: string;
    mode?: string;
    locale?: string;
  }>({});

  const addMessage = (entry: ChatEntry) => {
    setMessages((prev) => [...prev, entry]);
  };

  const sendMessage = async (payload: {
    question: string;
    context?: { pageUrl?: string; modelSlug?: string; mode?: string; locale?: string };
  }) => {
    const userEntry: ChatEntry = {
      id: crypto.randomUUID(),
      role: "user",
      content: payload.question,
    };
    addMessage(userEntry);
    setPending(true);
    setError(null);
    try {
      const effectiveContext = {
        pageUrl: payload.context?.pageUrl ?? context.pageUrl,
        locale: payload.context?.locale ?? context.locale,
        modelSlug: payload.context?.modelSlug ?? context.modelSlug,
        mode: payload.context?.mode ?? context.mode,
      };

      setContext(effectiveContext);

      const fullHistory = [...messages, userEntry].map(({ role, content }) => ({ role, content }));

      const res = await fetch("/api/perazzi-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: fullHistory,
          context: effectiveContext,
        }),
      });
      if (!res.ok) {
        throw new Error(`Request failed with ${res.status}`);
      }
      const data = await res.json();
      const assistantEntry: ChatEntry = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.answer,
        similarity: data.similarity,
      };
      addMessage(assistantEntry);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  };

  return {
    messages,
    pending,
    error,
    context,
    sendMessage,
  };
}
