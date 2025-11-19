"use client";

import { useEffect, useState } from "react";
import type { ChatMessage } from "@/types/perazzi-assistant";

export type ChatEntry = {
  id: string;
  role: "system" | "assistant" | "user";
  content: string;
  similarity?: number;
};

const STORAGE_KEY = "perazzi-chat-history";
const MAX_MESSAGES = 40;

class ConciergeRequestError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ConciergeRequestError";
    this.status = status;
  }
}

export function useChatState(initialMessages: ChatEntry[] = []) {
  const [messages, setMessages] = useState<ChatEntry[]>(initialMessages);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [context, setContext] = useState<{
    pageUrl?: string;
    modelSlug?: string;
    mode?: string;
    locale?: string;
  }>({});

  const addMessage = (entry: ChatEntry) => {
    setMessages((prev) => {
      const next = [...prev, entry];
      if (next.length > MAX_MESSAGES) {
        return next.slice(next.length - MAX_MESSAGES);
      }
      return next;
    });
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as {
          messages?: ChatEntry[];
          context?: typeof context;
        };
        if (parsed?.messages?.length) {
          setMessages(parsed.messages.slice(-MAX_MESSAGES));
        }
        if (parsed?.context) {
          setContext(parsed.context);
        }
      }
    } catch (error) {
      console.warn("Failed to load stored chat state", error);
    }
  }, []);

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
    setIsTyping(true);
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
        let message =
          res.status === 503
            ? "The Perazzi workshop is briefly offline. Please try again in a moment."
            : "Something went wrong. Please try again.";
        try {
          const payload = await res.json();
          if (payload?.error) {
            message = payload.error;
          }
        } catch {
          // Ignore body parsing failures; fall back to default message
        }
        throw new ConciergeRequestError(message, res.status);
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
      if (err instanceof ConciergeRequestError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setPending(false);
      setIsTyping(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const payload = JSON.stringify({
        messages,
        context,
      });
      window.localStorage.setItem(STORAGE_KEY, payload);
    } catch (error) {
      console.warn("Failed to persist chat history", error);
    }
  }, [messages, context]);

  return {
    messages,
    pending,
    isTyping,
    error,
    context,
    sendMessage,
  };
}
