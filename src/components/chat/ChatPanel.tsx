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
import { ChatInput } from "@/components/chat/ChatInput";
import type { ChatTriggerPayload } from "@/lib/chat-trigger";
import { cn } from "@/lib/utils";
import { usePerazziAssistant } from "@/hooks/usePerazziAssistant";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";

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
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "");

const createRandomId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
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
    <p className="mb-3 last:mb-0" {...props} />
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
    <th className="border border-subtle px-3 py-2 font-semibold text-ink" {...props} />
  ),
  td: (props: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td className="border border-subtle px-3 py-2 text-ink" {...props} />
  ),
  tbody: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <tbody className="divide-y divide-subtle" {...props} />
  ),
};

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
    if (typeof window === "undefined") return;
    const normalizedLabel = normalizeLabel(sessionLabel);
    const randomId = createRandomId();
    const combined = normalizedLabel ? `${normalizedLabel}_${randomId}` : randomId;

    try {
      window.localStorage.setItem(SESSION_STORAGE_KEY, combined);
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
    if (typeof window !== "undefined") {
      try {
        window.localStorage.clear();
      } catch {
        // ignore
      }
      try {
        window.sessionStorage.clear();
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
    const notePrompt = `Using a quiet, reverent Perazzi voice, write a beautifully composed “Legacy Note” as if it were from the perspective of the user's future self. Base it on these three answers:\\n1) ${updated[0] ?? ""}\\n2) ${updated[1] ?? ""}\\n3) ${updated[2] ?? ""}\\nMake it deeply reverent and personal: 3-4 paragraphs. At the end, skip a few lines to create some space, then add one line: "Whenever we talk about configurations or specs, we’ll keep this in mind."`;
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

  const rootClasses = [
    "flex h-full w-full flex-col bg-card text-ink shadow-elevated",
    variant === "rail" ? "border-l border-subtle" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

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
        className={`${rootClasses} z-40 relative`}
        style={{ minWidth: variant === "rail" ? "320px" : undefined }}
      >
      {sessionPromptOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl border border-subtle bg-card p-5 shadow-elevated">
            <h3 className="text-lg font-semibold text-ink">Input New Session ID</h3>
            <p className="mt-2 text-sm text-ink-muted">
              We&apos;ll prepend this to a fresh random ID to reduce collisions (example: label_uuid).
            </p>
            <div className="mt-4 space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-ink-muted">
                Session label
                <input
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
                  className="mt-2 w-full rounded-xl border border-subtle bg-card px-3 py-2 text-sm text-ink outline-none focus:border-ink focus-ring"
                  placeholder="e.g., dealer-demo"
                />
              </label>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="rounded-full border border-subtle px-3 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted transition hover:border-ink hover:text-ink"
                  onClick={handleSessionPromptCancel}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded-full bg-ink px-4 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-card transition hover:bg-ink-muted disabled:cursor-not-allowed disabled:bg-subtle disabled:text-ink-muted"
                  onClick={handleSessionIdConfirm}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-3 border-b border-subtle px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] sm:text-xs uppercase tracking-[0.2em] text-ink-muted">
              {legacyMode ? "Legacy Conversation" : "Perazzi Concierge"}
            </p>
            <h2 className="text-xl font-semibold">Where shall we begin?</h2>
          </div>
          <div className="flex items-center gap-2">
            {showResetButton && (
              <button
                type="button"
                className="rounded-full border border-subtle px-3 py-1.5 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted transition hover:border-ink hover:text-ink"
                onClick={handleResetVisitor}
              >
                Reset visitor
              </button>
            )}
            {legacyMode && (
              <button
                type="button"
                className="rounded-full border border-subtle px-3 py-1.5 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted transition hover:border-ink hover:text-ink"
                onClick={exitLegacyMode}
              >
                Exit
              </button>
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-2xl leading-none text-ink-muted transition hover:bg-subtle focus-visible:ring-2 focus-visible:ring-brand"
                aria-label="Close chat"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-6 py-10 text-sm text-ink">
          <div className={cn("flex flex-col gap-6", legacyMode ? "bg-subtle/20 rounded-3xl p-4" : "")}>
            {!legacyMode && (
              <div className="rounded-2xl border border-subtle/60 bg-subtle/40 p-4 text-sm text-ink sm:rounded-3xl sm:border-subtle sm:px-5 sm:py-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[11px] sm:text-xs uppercase tracking-[0.2em] text-ink-muted">Guided Questions</p>
                  <button
                    type="button"
                    className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted transition hover:text-ink"
                    onClick={() => setShowQuickStarts((prev) => !prev)}
                  >
                    {showQuickStarts ? "Hide" : "Show"}
                  </button>
                </div>
                {showQuickStarts && (
                  <div className="mt-4 grid gap-3">
                    {QUICK_STARTS.map((qs) => (
                      <button
                        key={qs.label}
                        type="button"
                        className="w-full rounded-2xl border border-subtle bg-card px-4 py-3 text-left font-medium text-ink transition hover:border-ink disabled:cursor-not-allowed"
                        onClick={() =>
                          sendMessage({
                            question: qs.prompt,
                            context: { pageUrl: globalThis.location.pathname, locale: navigator.language, ...context },
                          })
                        }
                        disabled={pending}
                      >
                        {qs.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
        {messages.length === 0 ? (
          <p className="text-ink-muted">
            Ask about heritage, platforms, or service, and I'll help you connect the craft to your own journey.
          </p>
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
                        isAssistant ? "bg-card border border-subtle text-ink" : "bg-ink text-card"
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
                            <p className="font-semibold">
                              Archetype profile: {msg.archetypeBreakdown.primary.charAt(0).toUpperCase()}
                              {msg.archetypeBreakdown.primary.slice(1)}
                            </p>
                          )}
                          <p className="mt-1">
                            {formatArchetypePercentages(msg.archetypeBreakdown.vector).map((item, idx) => (
                              <span key={item.label}>
                                {item.label} {item.percent}%
                                {idx < ARCHETYPE_ORDER.length - 1 ? " • " : ""}
                              </span>
                            ))}
                          </p>
                        </div>
                      )}

                      {msg.similarity !== undefined && (
                        <p className="mt-2 text-[11px] sm:text-xs text-ink-muted">
                          Similarity: {(msg.similarity * 100).toFixed(1)}%
                        </p>
                      )}

                      {isAssistant && (
                        <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.2em]">
                          <button
                            type="button"
                            className="rounded-full border border-subtle px-3 py-1 text-ink-muted transition hover:border-ink hover:text-ink"
                            onClick={() => handleCopy(msg.id, msg.content)}
                          >
                            {copiedId === msg.id ? "Copied" : "Copy"}
                          </button>
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
        <div className="border-t border-subtle px-6 py-4">
          {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
          <ChatInput pending={pending} onSend={handleSend} />
        </div>
      </div>
      </div>
    </>
  );
}
