"use client";

const ARCHETYPE_ORDER: { key: string; label: string }[] = [
  { key: "loyalist", label: "Loyalist" },
  { key: "prestige", label: "Prestige" },
  { key: "analyst", label: "Analyst" },
  { key: "achiever", label: "Achiever" },
  { key: "legacy", label: "Legacy" },
];

function formatArchetypePercentages(vector: Record<string, number> | undefined) {
  if (!vector) return [] as { label: string; percent: number }[];
  return ARCHETYPE_ORDER.map(({ key, label }) => {
    const raw = typeof vector[key] === "number" ? vector[key] : 0;
    const percent = Math.round(raw * 100);
    return { label, percent };
  });
}

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { X } from "lucide-react";
import { ChatInput } from "@/components/chat/ChatInput";
import { QuickStartButton } from "@/components/chat/QuickStartButton";
import { Button, Heading, Input, Text } from "@/components/ui";
import { ADMIN_DEBUG_TOKEN_STORAGE_KEY } from "@/components/chat/useChatState";
import type { ChatTriggerPayload } from "@/lib/chat-trigger";
import { cn } from "@/lib/utils";
import { usePerazziAssistant } from "@/hooks/usePerazziAssistant";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import type { PerazziAdminDebugPayload } from "@/types/perazzi-assistant";
import { getRetrievalLabelFromScores } from "@/lib/retrieval-label";

const QUICK_STARTS = [
  {
    label: "Explore My Options",
    prompt: "Help me choose the best model for me to use based on the disciplines that I participate in.",
  },
  {
    label: "I Already Own A Perazzi",
    prompt: "I own a Perazzi. What other information should I know to get the most out of my gun?",
  },
  {
    label: "Care and Preservation",
    prompt: "How should I care for my Perazzi and what is the recommended service schedule?",
  },
];

const SESSION_STORAGE_KEY = "perazzi_session_id";

const normalizeLabel = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9-_]+/g, "-")
    .replaceAll(/(^-+|-+$)/g, "");

let sessionIdCounter = 0;

const createRandomId = () => {
  const cryptoObj = globalThis.crypto;
  if (cryptoObj?.randomUUID) {
    return cryptoObj.randomUUID();
  }
  if (cryptoObj?.getRandomValues) {
    const bytes = new Uint8Array(16);
    cryptoObj.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  sessionIdCounter = (sessionIdCounter + 1) % Number.MAX_SAFE_INTEGER;
  return `${Date.now().toString(36)}-${sessionIdCounter.toString(36)}`;
};

type ChatPanelProps = {
  readonly open: boolean;
  readonly onClose?: () => void;
  readonly variant?: "rail" | "sheet";
  readonly className?: string;
  readonly pendingPrompt?: ChatTriggerPayload | null;
  readonly onPromptConsumed?: () => void;
  readonly showResetButton?: boolean;
};

const markdownComponents = {
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <Text asChild className="mb-3 last:mb-0" leading="relaxed">
      <p {...props} />
    </Text>
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="mb-3 list-disc pl-5 text-left last:mb-0" {...props} />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="mb-3 list-decimal pl-5 text-left last:mb-0" {...props} />
  ),
  li: (props: React.LiHTMLAttributes<HTMLLIElement>) => (
    <li className="mb-1 last:mb-0" {...props} />
  ),
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-semibold" {...props} />
  ),
  table: (props: React.TableHTMLAttributes<HTMLTableElement>) => {
    const { children, ...rest } = props;
    return (
      <div className="my-4 overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm" {...rest}>
          <caption className="sr-only">Assistant response table</caption>
          {children}
        </table>
      </div>
    );
  },
  thead: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className="bg-subtle text-xs uppercase tracking-[0.2em] text-ink-muted" {...props} />
  ),
  th: (props: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th className="border border-border/70 px-3 py-2 font-semibold text-ink" {...props} />
  ),
  td: (props: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td className="border border-border/70 px-3 py-2 text-ink" {...props} />
  ),
  tbody: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <tbody className="divide-y divide-subtle" {...props} />
  ),
};

function formatDebugValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "—";
  if (typeof value === "string") return value.length ? value : "—";
  if (Array.isArray(value)) return value.length ? `[${value.length}]` : "[]";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function DebugRow(props: Readonly<{ label: string; value: unknown }>) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-ink-muted">{props.label}</dt>
      <dd className="text-right font-mono text-[11px] sm:text-xs text-ink">{formatDebugValue(props.value)}</dd>
    </div>
  );
}

function AdminDebugPanel(props: Readonly<{
  debug: PerazziAdminDebugPayload | null;
  onClearToken: () => void;
}>) {
  const debug = props.debug;
  const titles = debug?.retrieval?.top_titles ?? [];

  return (
    <div className="border-b border-border bg-card/80 px-6 py-4 text-[11px] sm:text-xs text-ink backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between gap-3">
        <Text
          size="xs"
          className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.25em] text-ink-muted"
          leading="normal"
        >
          Admin Debug
        </Text>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="rounded-full px-2 py-1 text-[10px] sm:text-[11px] text-ink-muted hover:text-ink"
          onClick={props.onClearToken}
        >
          Clear admin debug token
        </Button>
      </div>
      {debug ? (
        <div className="grid gap-4">
          <section>
            <Text
              size="xs"
              className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-ink-muted"
              leading="normal"
            >
              Thread
            </Text>
            <dl className="mt-2 grid gap-1">
              <DebugRow
                label="previous_response_id_present"
                value={debug.thread.previous_response_id_present}
              />
              <DebugRow label="store_enabled" value={debug.thread.store_enabled} />
              <DebugRow label="thread_reset_required" value={debug.thread.thread_reset_required} />
              <DebugRow label="conversationStrategy" value={debug.thread.conversationStrategy} />
              <DebugRow label="enforced_thread_input" value={debug.thread.enforced_thread_input} />
            </dl>
          </section>

          <section>
            <Text
              size="xs"
              className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-ink-muted"
              leading="normal"
            >
              Retrieval
            </Text>
            <dl className="mt-2 grid gap-1">
              <DebugRow label="attempted" value={debug.retrieval.attempted} />
              <DebugRow label="skipped" value={debug.retrieval.skipped} />
              <DebugRow label="reason" value={debug.retrieval.reason} />
              <DebugRow label="chunk_count" value={debug.retrieval.chunk_count} />
              <DebugRow label="rerank_enabled" value={debug.retrieval.rerank_enabled} />
              <DebugRow
                label="rerank_metrics_present"
                value={debug.retrieval.rerank_metrics_present}
              />
              <div className="mt-2">
                <Text className="text-ink-muted" leading="normal">
                  top_titles
                </Text>
                {titles.length ? (
                  <ul className="mt-1 list-disc space-y-1 pl-5 font-mono text-[11px] sm:text-xs">
                    {titles.map((title) => (
                      <li key={title}>{title}</li>
                    ))}
                  </ul>
                ) : (
                  <Text
                    size="sm"
                    className="mt-1 font-mono text-[11px] sm:text-xs text-ink-muted"
                    leading="normal"
                  >
                    []
                  </Text>
                )}
              </div>
            </dl>
          </section>

          <section>
            <Text
              size="xs"
              className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-ink-muted"
              leading="normal"
            >
              Usage
            </Text>
            <dl className="mt-2 grid gap-1">
              <DebugRow label="input_tokens" value={debug.usage?.input_tokens} />
              <DebugRow label="cached_tokens" value={debug.usage?.cached_tokens} />
              <DebugRow label="output_tokens" value={debug.usage?.output_tokens} />
              <DebugRow label="total_tokens" value={debug.usage?.total_tokens} />
            </dl>
          </section>

          <section>
            <Text
              size="xs"
              className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-ink-muted"
              leading="normal"
            >
              Flags
            </Text>
            <dl className="mt-2 grid gap-1">
              <DebugRow label="convo_strategy" value={debug.flags.convo_strategy} />
              <DebugRow label="retrieval_policy" value={debug.flags.retrieval_policy} />
              <DebugRow label="text_verbosity" value={debug.flags.text_verbosity} />
              <DebugRow label="reasoning_effort" value={debug.flags.reasoning_effort} />
              <DebugRow label="require_general_label" value={debug.flags.require_general_label} />
              <DebugRow label="postvalidate_enabled" value={debug.flags.postvalidate_enabled} />
              <DebugRow label="prompt_cache_retention" value={debug.flags.prompt_cache_retention} />
              <DebugRow
                label="prompt_cache_key_present"
                value={debug.flags.prompt_cache_key_present}
              />
            </dl>
          </section>

          {debug.triggers ? (
            <section>
              <Text
                size="xs"
                className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-ink-muted"
                leading="normal"
              >
                Triggers
              </Text>
              <dl className="mt-2 grid gap-1">
                <DebugRow label="blocked_intent" value={debug.triggers.blocked_intent} />
                <DebugRow label="evidenceMode" value={debug.triggers.evidenceMode} />
                <DebugRow label="evidenceReason" value={debug.triggers.evidenceReason} />
                <DebugRow label="postvalidate" value={debug.triggers.postvalidate} />
              </dl>
            </section>
          ) : null}
        </div>
      ) : (
        <Text className="text-ink-muted" leading="normal">
          No debug payload in the last response (server debug disabled or token not authorized).
        </Text>
      )}
    </div>
  );
}

export function ChatPanel({
  open,
  onClose,
  variant = "rail",
  className,
  pendingPrompt,
  onPromptConsumed,
  showResetButton = false,
}: ChatPanelProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const analyticsRef = useAnalyticsObserver<HTMLDivElement>("ChatPanelSeen");
  const {
    messages,
    pending,
    isTyping,
    error,
    lastAdminDebug,
    sendMessage,
    context,
    updateContext,
    appendLocal,
    clearConversation,
    setContext,
  } = usePerazziAssistant();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [showQuickStarts, setShowQuickStarts] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const lastPromptRef = useRef<ChatTriggerPayload | null>(null);
  const [legacyMode, setLegacyMode] = useState(false);
  const [legacyStep, setLegacyStep] = useState(0);
  const [legacyAnswers, setLegacyAnswers] = useState<string[]>([]);
  const [legacyTriggerSeen, setLegacyTriggerSeen] = useState(false);
  const [sessionPromptOpen, setSessionPromptOpen] = useState(false);
  const [sessionLabel, setSessionLabel] = useState("");
  const sessionInputRef = useRef<HTMLInputElement | null>(null);
  const [hasAdminDebugToken, setHasAdminDebugToken] = useState(() => {
    const browserWindow = globalThis.window;
    if (!browserWindow || !("localStorage" in globalThis)) return false;
    try {
      const url = new URL(browserWindow.location.href);
      const token = url.searchParams.get("adminDebugToken");
      if (token && token.trim().length > 0) {
        globalThis.localStorage.setItem(ADMIN_DEBUG_TOKEN_STORAGE_KEY, token.trim());
        url.searchParams.delete("adminDebugToken");
        browserWindow.history.replaceState({}, "", url.toString());
      } else if (url.searchParams.has("adminDebugToken")) {
        url.searchParams.delete("adminDebugToken");
        browserWindow.history.replaceState({}, "", url.toString());
      }

      return Boolean(globalThis.localStorage.getItem(ADMIN_DEBUG_TOKEN_STORAGE_KEY));
    } catch (error) {
      console.warn("Failed to bootstrap admin debug token", error);
      return false;
    }
  });
  const [adminDebugOpen, setAdminDebugOpen] = useState(false);

  const legacyQuestions = useMemo(
    () => [
      "When you imagine your Perazzi years from now, what moment do you hope it will remember with you?",
      "Who do you picture holding it after you — and what do you want them to understand about you?",
      "What part of yourself do you hope this shotgun will quietly protect and encourage?",
    ],
    [],
  );

  useEffect(() => {
    if (sessionPromptOpen && sessionInputRef.current) {
      sessionInputRef.current.focus();
      sessionInputRef.current.select();
    }
  }, [sessionPromptOpen]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== ADMIN_DEBUG_TOKEN_STORAGE_KEY) return;
      setHasAdminDebugToken(Boolean(event.newValue));
      if (!event.newValue) setAdminDebugOpen(false);
    };
    globalThis.addEventListener?.("storage", handleStorage);
    return () => {
      globalThis.removeEventListener?.("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (open && panelRef.current) {
      panelRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open || !pendingPrompt) return;
    if (lastPromptRef.current === pendingPrompt) return;
    lastPromptRef.current = pendingPrompt;
    if (pendingPrompt.context) {
      updateContext(pendingPrompt.context);
    }
    if (pendingPrompt.question) {
      sendMessage({
        question: pendingPrompt.question,
        context: pendingPrompt.context,
      });
    }
    onPromptConsumed?.();
  }, [open, pendingPrompt, sendMessage, updateContext, onPromptConsumed]);

  useEffect(() => {
    if (!pendingPrompt) {
      lastPromptRef.current = null;
    }
  }, [pendingPrompt]);

  const handleCopy = async (id: string, content: string) => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      globalThis.setTimeout(() => {
        setCopiedId((current) => (current === id ? null : current));
      }, 2000);
    } catch (error) {
      console.warn("Failed to copy content", error);
    }
  };

  const legacyTriggers = [
    "i want this gun to mean something",
    "what will my legacy be",
    "legacy with a perazzi",
  ];

  const startLegacyMode = () => {
    setLegacyMode(true);
    setLegacyStep(0);
    setLegacyAnswers([]);
    setLegacyTriggerSeen(true);
    appendLocal({
      id: crypto.randomUUID(),
      role: "assistant",
      content: legacyQuestions[0],
    });
  };

  const exitLegacyMode = () => {
    setLegacyMode(false);
    setLegacyStep(0);
    setLegacyAnswers([]);
  };

  const handleSessionIdConfirm = () => {
    const browserWindow = globalThis.window;
    if (!browserWindow) return;
    const normalizedLabel = normalizeLabel(sessionLabel);
    const randomId = createRandomId();
    const combined = normalizedLabel ? `${normalizedLabel}_${randomId}` : randomId;

    try {
      browserWindow.localStorage.setItem(SESSION_STORAGE_KEY, combined);
    } catch {
      // ignore storage errors
    }
    setSessionPromptOpen(false);
    setSessionLabel("");
  };

  const handleSessionPromptCancel = () => {
    setSessionPromptOpen(false);
    setSessionLabel("");
  };

  const handleResetVisitor = () => {
    const confirmed = typeof globalThis.confirm === "function"
      ? globalThis.confirm("Reset the concierge and clear all stored data for this site?")
      : true;
    if (!confirmed) return;

    // Clear in-memory chat and context state.
    clearConversation();
    setContext({});
    setShowQuickStarts(true);
    exitLegacyMode();
    setLegacyTriggerSeen(false);
    lastPromptRef.current = null;
    setCopiedId(null);

    // Clear browser storage to simulate a new visitor.
    const browserWindow = globalThis.window;
    if (browserWindow) {
      try {
        browserWindow.localStorage.clear();
      } catch {
        // ignore
      }
      try {
        browserWindow.sessionStorage.clear();
      } catch {
        // ignore
      }
    }
    if (typeof document !== "undefined") {
      try {
        const cookies = document.cookie.split(";");
        cookies.forEach((cookie) => {
          const [name] = cookie.split("=");
          if (!name) return;
          document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        });
      } catch {
        // ignore cookie clear errors
      }
    }

    setSessionLabel("");
    setSessionPromptOpen(true);
  };

  const handleLegacyAnswer = (answer: string) => {
    const updated = [...legacyAnswers, answer];
    setLegacyAnswers(updated);
    const nextStep = legacyStep + 1;
    setLegacyStep(nextStep);
    if (nextStep < legacyQuestions.length) {
      appendLocal({
        id: crypto.randomUUID(),
        role: "assistant",
        content: legacyQuestions[nextStep],
      });
      return;
    }
    const notePrompt = String.raw`Using a quiet, reverent Perazzi voice, write a beautifully composed “Legacy Note” as if it were from the perspective of the user's future self. Base it on these three answers:
1) ${updated[0] ?? ""}
2) ${updated[1] ?? ""}
3) ${updated[2] ?? ""}
Make it deeply reverent and personal: 3-4 paragraphs. At the end, skip a few lines to create some space, then add one line: "Whenever we talk about configurations or specs, we’ll keep this in mind."`;
    sendMessage({ question: notePrompt, context, skipEcho: true });
    exitLegacyMode();
  };

  const handleSend = (question: string) => {
    const normalized = question.toLowerCase().trim();
    const matchesLegacy =
      !legacyTriggerSeen && legacyTriggers.some((phrase) => normalized.includes(phrase));

    if (legacyMode || matchesLegacy) {
      const userEntry = { id: crypto.randomUUID(), role: "user" as const, content: question };
      appendLocal(userEntry);
      if (matchesLegacy && !legacyMode) {
        startLegacyMode();
        return;
      }
      // already in legacy mode
      handleLegacyAnswer(question);
      return;
    }

    sendMessage({
      question,
      context: {
        pageUrl: globalThis.location.pathname,
        locale: navigator.language,
        ...context,
      },
    });
  };

  if (!open) return null;

  const rootClasses = cn(
    "relative z-40 flex h-full w-full flex-col text-ink outline-none",
    variant === "rail"
      ? "border-l border-border bg-card/90 shadow-elevated backdrop-blur-xl"
      : "overflow-hidden rounded-3xl border border-border bg-card/95 shadow-elevated backdrop-blur-xl",
    className,
  );

  const legacyOverlay =
    legacyMode && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-20 bg-black/75 transition-opacity duration-700 ease-out"
            aria-hidden="true"
          />,
          document.body,
        )
      : null;

  return (
    <>
      {legacyOverlay}
      <div
        id="perazzi-chat-panel"
        aria-label="Perazzi Concierge"
        tabIndex={-1}
        ref={(node) => {
          panelRef.current = node;
          analyticsRef.current = node;
        }}
        data-analytics-id="ChatPanelSeen"
        className={rootClasses}
        style={{ minWidth: variant === "rail" ? "320px" : undefined }}
      >
      {sessionPromptOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card/95 p-5 shadow-elevated ring-1 ring-border/70 backdrop-blur-xl">
            <Heading level={3} size="lg" className="text-ink">
              Input New Session ID
            </Heading>
            <Text className="mt-2 text-ink-muted" leading="relaxed">
              We&apos;ll prepend this to a fresh random ID to reduce collisions (example: label_uuid).
            </Text>
            <div className="mt-4 space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-ink-muted">
                Session label
                <Input
                  ref={sessionInputRef}
                  type="text"
                  value={sessionLabel}
                  onChange={(event) => setSessionLabel(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleSessionIdConfirm();
                    }
                  }}
                  className="mt-2"
                  placeholder="e.g., dealer-demo"
                />
              </label>
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="rounded-full px-3 text-ink-muted hover:text-ink"
                  onClick={handleSessionPromptCancel}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-full border-transparent bg-ink px-4 text-card hover:bg-ink-muted disabled:bg-subtle disabled:text-ink-muted"
                  onClick={handleSessionIdConfirm}
                >
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-3 border-b border-border bg-card/80 px-6 py-5 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div>
            <Text size="xs" className="tracking-[0.2em] text-ink-muted" leading="normal">
              {legacyMode ? "Legacy Conversation" : "Perazzi Concierge"}
            </Text>
            <Heading level={2} size="lg" className="text-ink">
              Where shall we begin?
            </Heading>
          </div>
          <div className="flex items-center gap-2">
            {hasAdminDebugToken && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="rounded-full px-3 py-1.5 text-[11px] sm:text-xs text-ink-muted hover:text-ink"
                onClick={() => setAdminDebugOpen((prev) => !prev)}
                aria-expanded={adminDebugOpen}
              >
                Admin Debug
              </Button>
            )}
            {showResetButton && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="rounded-full px-3 py-1.5 text-[11px] sm:text-xs text-ink-muted hover:text-ink"
                onClick={handleResetVisitor}
              >
                Reset visitor
              </Button>
            )}
            {legacyMode && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="rounded-full px-3 py-1.5 text-[11px] sm:text-xs text-ink-muted hover:text-ink"
                onClick={exitLegacyMode}
              >
                Exit
              </Button>
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-muted transition hover:bg-ink/5 focus-ring"
                aria-label="Close chat"
              >
                <X className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>
      {hasAdminDebugToken && adminDebugOpen && (
        <AdminDebugPanel
          debug={lastAdminDebug}
          onClearToken={() => {
            if (!("localStorage" in globalThis)) return;
            try {
              globalThis.localStorage.removeItem(ADMIN_DEBUG_TOKEN_STORAGE_KEY);
            } catch (error) {
              console.warn("Failed to clear admin debug token", error);
            } finally {
              setHasAdminDebugToken(false);
              setAdminDebugOpen(false);
            }
          }}
        />
      )}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto bg-canvas/30 px-6 py-10 text-sm text-ink"
        >
          <div
            className={cn(
              "flex flex-col gap-6",
              legacyMode
                ? "rounded-3xl border border-border/70 bg-card/70 p-4 shadow-soft backdrop-blur-sm"
                : "",
            )}
          >
            {legacyMode ? null : (
              <div className="rounded-2xl border border-border/70 bg-card/60 p-4 text-sm text-ink shadow-soft backdrop-blur-sm sm:rounded-3xl sm:px-5 sm:py-4">
                <div className="flex items-center justify-between gap-4">
                  <Text size="xs" className="tracking-[0.2em] text-ink-muted" leading="normal">
                    Guided Questions
                  </Text>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto px-0 py-0 text-[11px] sm:text-xs text-ink-muted hover:text-ink"
                    onClick={() => setShowQuickStarts((prev) => !prev)}
                  >
                    {showQuickStarts ? "Hide" : "Show"}
                  </Button>
                </div>
                {showQuickStarts && (
                  <div className="mt-4 grid gap-3">
                    {QUICK_STARTS.map((qs) => (
                      <QuickStartButton
                        key={qs.label}
                        label={qs.label}
                        prompt={qs.prompt}
                        disabled={pending}
                        onSelect={(prompt) =>
                          sendMessage({
                            question: prompt,
                            context: { pageUrl: globalThis.location.pathname, locale: navigator.language, ...context },
                          })
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
        {messages.length === 0 ? (
          <Text className="text-ink-muted" leading="relaxed">
            Ask about heritage, platforms, or service, and I’ll help you connect the craft to your own journey.
          </Text>
        ) : (
          <ul className="flex flex-col gap-6">
            {messages.map((msg, index) => {
              const isAssistant = msg.role === "assistant";
              const showMarker =
                isAssistant && (index === 0 || messages[index - 1]?.role !== "assistant");
              return (
                <li key={msg.id} className="relative">
                  {showMarker && (
                    <div className="mb-3 flex items-center gap-3 text-[11px] sm:text-xs uppercase tracking-[0.2em] text-white">
                      <div className="flex-1 border-t border-perazzi-red" aria-hidden="true" />
                      <span className="rounded-full bg-perazzi-red px-3 py-1 text-[11px] sm:text-xs tracking-[0.3em] text-white">
                        Perazzi Insight
                      </span>
                      <div className="flex-1 border-t border-perazzi-red" aria-hidden="true" />
                    </div>
                  )}
                  <div className={isAssistant ? "text-left" : "text-right"}>
                    <div
                      className={`inline-block rounded-2xl px-4 py-3 ${
                        isAssistant
                          ? "bg-card/80 border border-border/70 text-ink shadow-soft backdrop-blur-sm"
                          : "bg-ink text-card shadow-soft"
                      }`}
                    >
                      {isAssistant ? (
                        <ReactMarkdown
                          rehypePlugins={[rehypeSanitize]}
                          remarkPlugins={[remarkGfm]}
                          components={markdownComponents}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      ) : (
                        msg.content
                      )}

                      {isAssistant && msg.archetypeBreakdown && (
                        <div className="mt-3 text-[11px] sm:text-xs text-ink-muted">
                          {msg.archetypeBreakdown.primary && (
                            <Text className="font-semibold" leading="normal">
                              Archetype profile: {msg.archetypeBreakdown.primary.charAt(0).toUpperCase()}
                              {msg.archetypeBreakdown.primary.slice(1)}
                            </Text>
                          )}
                          <Text className="mt-1" leading="normal">
                            {formatArchetypePercentages(msg.archetypeBreakdown.vector).map((item, idx) => (
                              <span key={item.label}>
                                {item.label} {item.percent}%
                                {idx < ARCHETYPE_ORDER.length - 1 ? " • " : ""}
                              </span>
                            ))}
                          </Text>
                        </div>
                      )}

                      {(() => {
                        const hasRetrievalData =
                          (Array.isArray(msg.retrievalScores) && msg.retrievalScores.length > 0) ||
                          typeof msg.retrievalLabel === "string" ||
                          typeof msg.similarity === "number";
                        if (hasRetrievalData) {
                          const fallbackScores =
                            typeof msg.similarity === "number" ? [msg.similarity] : [];
                          const retrievalLabel =
                            msg.retrievalLabel ??
                            getRetrievalLabelFromScores(
                              msg.retrievalScores ?? fallbackScores,
                            );
                          return (
                            <Text size="sm" className="mt-2 text-ink-muted" leading="normal">
                              Retrieval: {retrievalLabel}
                            </Text>
                          );
                        }
                        return null;
                      })()}

                      {isAssistant && (
                        <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.2em]">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="rounded-full px-3 py-1 text-ink-muted hover:text-ink"
                            onClick={() => handleCopy(msg.id, msg.content)}
                          >
                            {copiedId === msg.id ? "Copied" : "Copy"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  {isTyping && index === messages.length - 1 && msg.role === "user" && (
                    <div className="mt-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-ink-muted">
                      <span className="relative flex h-5 w-5 items-center justify-center">
                        <span className="absolute inline-flex h-full w-full animate-spin rounded-full border-2 border-subtle border-t-transparent" />
                        <span className="inline-flex h-2 w-2 rounded-full bg-ink" />
                      </span>
                      <span className="tracking-[0.08em]">Collecting references…</span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      </div>
        <div className="border-t border-border bg-card/80 px-6 py-4 backdrop-blur-md">
          {error && (
            <Text className="mb-2 text-red-600" leading="normal">
              {error}
            </Text>
          )}
          <ChatInput
            pending={pending}
            onSend={handleSend}
            textVerbosity={context.textVerbosity ?? "medium"}
            onTextVerbosityChange={(verbosity) =>
              setContext((prev) => ({
                ...prev,
                textVerbosity: verbosity,
              }))
            }
          />
        </div>
      </div>
      </div>
    </>
  );
}
