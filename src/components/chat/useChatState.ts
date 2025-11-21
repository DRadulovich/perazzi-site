"use client";

import { useCallback, useEffect, useState } from "react";
import type { Citation, PerazziAssistantResponse } from "@/types/perazzi-assistant";

export type ChatEntry = {
  id: string;
  role: "system" | "assistant" | "user";
  content: string;
  similarity?: number;
};

export type ChatContextShape = {
  pageUrl?: string;
  modelSlug?: string;
  platformSlug?: string;
  mode?: string;
  locale?: string;
};

export type AssistantResponseMeta = {
  citations?: Citation[];
  guardrail?: PerazziAssistantResponse["guardrail"];
  similarity?: number;
  intents?: string[];
  topics?: string[];
  templates?: string[];
};

export type UseChatStateOptions = {
  storageKey?: string;
  initialContext?: ChatContextShape;
  onResponseMeta?: (meta: AssistantResponseMeta) => void;
};

const DEFAULT_STORAGE_KEY = "perazzi-chat-history";
const MAX_MESSAGES = 40;

class ConciergeRequestError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ConciergeRequestError";
    this.status = status;
  }
}

export function useChatState(
  initialMessages: ChatEntry[] = [],
  options: UseChatStateOptions = {},
) {
  const [messages, setMessages] = useState<ChatEntry[]>(initialMessages);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [context, setContext] = useState<ChatContextShape>(options.initialContext ?? {});
  const storageKey = options.storageKey ?? DEFAULT_STORAGE_KEY;

  const addMessage = useCallback((entry: ChatEntry) => {
    setMessages((prev) => {
      const next = [...prev, entry];
      if (next.length > MAX_MESSAGES) {
        return next.slice(next.length - MAX_MESSAGES);
      }
      return next;
    });
  }, []);

  const updateContext = useCallback(
    (patch: Partial<ChatContextShape>) => setContext((prev) => ({ ...prev, ...patch })),
    [],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as {
          messages?: ChatEntry[];
          context?: ChatContextShape;
        };
        if (parsed?.messages?.length) {
          setMessages(parsed.messages.slice(-MAX_MESSAGES));
        }
        if (parsed?.context) {
          setContext((prev) => ({
            ...(options.initialContext ?? {}),
            ...prev,
            ...parsed.context,
          }));
        }
      } else if (options.initialContext) {
        setContext((prev) => ({ ...options.initialContext, ...prev }));
      }
    } catch (error) {
      console.warn("Failed to load stored chat state", error);
    }
    // We intentionally omit dependencies to only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = async (payload: {
    question: string;
    context?: ChatContextShape;
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
      const effectiveContext: ChatContextShape = {
        pageUrl: payload.context?.pageUrl ?? context.pageUrl,
        locale: payload.context?.locale ?? context.locale,
        modelSlug: payload.context?.modelSlug ?? context.modelSlug,
        platformSlug: payload.context?.platformSlug ?? context.platformSlug,
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
      options.onResponseMeta?.({
        citations: data.citations,
        guardrail: data.guardrail,
        similarity: data.similarity,
        intents: data.intents,
        topics: data.topics,
        templates: data.templates,
      });
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
      window.localStorage.setItem(storageKey, payload);
    } catch (error) {
      console.warn("Failed to persist chat history", error);
    }
  }, [messages, context, storageKey]);

  const appendLocal = (entry: ChatEntry) => {
    addMessage(entry);
  };

  return {
    messages,
    pending,
    isTyping,
    error,
    context,
    setContext,
    sendMessage,
    updateContext,
    appendLocal,
  };
}
