"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  Citation,
  PerazziAssistantResponse,
  Archetype,
  ArchetypeBreakdown,
  ArchetypeVector,
} from "@/types/perazzi-assistant";

export type ChatEntry = {
  id: string;
  role: "system" | "assistant" | "user";
  content: string;
  similarity?: number;
  /** Mode used by the assistant when generating this message (if any). */
  mode?: string | null;
  /** Primary archetype used for voice/tone on this message (if any). */
  archetype?: Archetype | null;
  /** Full archetype breakdown vector for this message (if any). */
  archetypeBreakdown?: ArchetypeBreakdown;
};

export type ChatContextShape = {
  pageUrl?: string;
  modelSlug?: string;
  platformSlug?: string;
  mode?: string;
  locale?: string;
  /** Sticky archetype hint from the last response. */
  archetype?: Archetype | null;
  /** Previous archetype vector from the last response, used for smoothing across turns. */
  archetypeVector?: ArchetypeVector | null;
};

export type AssistantResponseMeta = {
  citations?: Citation[];
  guardrail?: PerazziAssistantResponse["guardrail"];
  similarity?: number;
  intents?: string[];
  topics?: string[];
  templates?: string[];
  mode?: PerazziAssistantResponse["mode"];
  archetype?: PerazziAssistantResponse["archetype"];
  archetypeBreakdown?: PerazziAssistantResponse["archetypeBreakdown"];
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
    if (!("localStorage" in globalThis)) return;
    try {
      const stored = globalThis.localStorage.getItem(storageKey);
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
            ...options.initialContext,
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
    skipEcho?: boolean;
  }) => {
    const userEntry: ChatEntry = {
      id: crypto.randomUUID(),
      role: "user",
      content: payload.question,
    };
    if (!payload.skipEcho) {
      addMessage(userEntry);
    }
    setPending(true);
    setIsTyping(true);
    setError(null);
    try {
      const resetRegex = /^please\s+clear\s+your\s+memory\s+of\s+my\s+archetype\.?$/i;
      const isArchetypeReset = resetRegex.test(payload.question.trim());

      const effectiveContext: ChatContextShape = {
        pageUrl: payload.context?.pageUrl ?? context.pageUrl,
        locale: payload.context?.locale ?? context.locale,
        modelSlug: payload.context?.modelSlug ?? context.modelSlug,
        platformSlug: payload.context?.platformSlug ?? context.platformSlug,
        mode: payload.context?.mode ?? context.mode,
        archetype: isArchetypeReset
          ? null
          : payload.context?.archetype ?? context.archetype ?? null,
        archetypeVector: isArchetypeReset
          ? null
          : payload.context?.archetypeVector ?? context.archetypeVector ?? null,
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
      const data: PerazziAssistantResponse = await res.json();
      const assistantEntry: ChatEntry = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.answer,
        similarity: data.similarity,
        mode: data.mode ?? null,
        archetype: data.archetype ?? null,
        archetypeBreakdown: data.archetypeBreakdown,
      };
      addMessage(assistantEntry);
      setContext((prev) => ({
        ...prev,
        archetype: data.archetype ?? prev.archetype ?? null,
        archetypeVector:
          data.archetypeBreakdown?.vector ?? prev.archetypeVector ?? null,
      }));
      options.onResponseMeta?.({
        citations: data.citations,
        guardrail: data.guardrail,
        similarity: data.similarity,
        intents: data.intents,
        topics: data.topics,
        templates: data.templates,
        mode: data.mode,
        archetype: data.archetype,
        archetypeBreakdown: data.archetypeBreakdown,
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
    if (!("localStorage" in globalThis)) return;
    try {
      const payload = JSON.stringify({
        messages,
        context,
      });
      globalThis.localStorage.setItem(storageKey, payload);
    } catch (error) {
      console.warn("Failed to persist chat history", error);
    }
  }, [messages, context, storageKey]);

  const appendLocal = (entry: ChatEntry) => {
    addMessage(entry);
  };

  const clearConversation = useCallback(() => {
    setMessages([]);
    setError(null);
    if ("localStorage" in globalThis) {
      try {
        globalThis.localStorage.removeItem(storageKey);
      } catch (err) {
        console.warn("Failed to clear stored chat history", err);
      }
    }
  }, [storageKey]);

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
    clearConversation,
  };
}
