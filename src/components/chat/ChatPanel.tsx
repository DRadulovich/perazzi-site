"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { useChatState } from "@/components/chat/useChatState";
import { ChatInput } from "@/components/chat/ChatInput";
import type { ChatTriggerPayload } from "@/lib/chat-trigger";

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

type ChatPanelProps = {
  open: boolean;
  onClose?: () => void;
  variant?: "rail" | "sheet";
  className?: string;
  pendingPrompt?: ChatTriggerPayload | null;
  onPromptConsumed?: () => void;
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
  table: (props: React.TableHTMLAttributes<HTMLTableElement>) => (
    <div className="my-4 overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm" {...props} />
    </div>
  ),
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
}: ChatPanelProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const { messages, pending, isTyping, error, sendMessage, context, updateContext } = useChatState();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [showQuickStarts, setShowQuickStarts] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const lastPromptRef = useRef<ChatTriggerPayload | null>(null);

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
      window.setTimeout(() => {
        setCopiedId((current) => (current === id ? null : current));
      }, 2000);
    } catch (error) {
      console.warn("Failed to copy content", error);
    }
  };

  if (!open) return null;

  const rootClasses = [
    "flex h-full w-full flex-col bg-card text-ink shadow-elevated",
    variant === "rail" ? "border-l border-subtle" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      id="perazzi-chat-panel"
      role="dialog"
      aria-label="Perazzi Concierge"
      tabIndex={-1}
      ref={panelRef}
      className={rootClasses}
      style={{ minWidth: variant === "rail" ? "320px" : undefined }}
    >
      <div className="space-y-3 border-b border-subtle px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">Perazzi Concierge</p>
            <h2 className="text-xl font-semibold">Where shall we begin?</h2>
          </div>
          <div className="flex items-center gap-2">
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
        {isTyping && (
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-ink-muted">
            <span className="relative flex h-5 w-5 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-spin rounded-full border-2 border-subtle border-t-transparent" />
              <span className="inline-flex h-2 w-2 rounded-full bg-ink" />
            </span>
            <span className="tracking-[0.08em]">Collecting references…</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-6 py-10 text-sm text-ink">
          <div className="flex flex-col gap-6">
        <div className="rounded-3xl border border-subtle bg-subtle/40 px-5 py-4 text-sm text-ink">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">Guided Questions</p>
            <button
              type="button"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted transition hover:text-ink"
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
                  onClick={() => sendMessage({ question: qs.prompt })}
                  disabled={pending}
                >
                  {qs.label}
                </button>
              ))}
            </div>
          )}
        </div>
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
                    <div className="mb-3 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-white">
                      <div className="flex-1 border-t border-perazzi-red" aria-hidden="true" />
                      <span className="rounded-full bg-perazzi-red px-3 py-1 text-[11px] tracking-[0.3em] text-white">
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
                      {msg.similarity !== undefined && (
                        <p className="mt-2 text-xs text-ink-muted">
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
                </li>
              );
            })}
          </ul>
        )}
      </div>
      </div>
        <div className="border-t border-subtle px-6 py-4">
          {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
          <ChatInput
            pending={pending}
            onSend={(question) =>
              sendMessage({
                question,
                context: {
                  pageUrl: window.location.pathname,
                  locale: navigator.language,
                },
              })
            }
          />
        </div>
      </div>
    </div>
  );
}
