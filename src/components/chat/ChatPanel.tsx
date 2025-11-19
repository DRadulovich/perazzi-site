"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { useChatState } from "@/components/chat/useChatState";
import { ChatInput } from "@/components/chat/ChatInput";

const QUICK_STARTS = [
  {
    label: "Help me choose a gun",
    prompt: "Help me choose the best model for me to use based on the disciplines that I participate in.",
  },
  {
    label: "I already own a Perazzi",
    prompt: "I own an Perazzi. What other information should I know to get the most out of my gun?",
  },
  {
    label: "Service & care",
    prompt: "How should I care for my Perazzi and what is the recommended service schedule?",
  },
];

type ChatPanelProps = {
  open: boolean;
  onClose?: () => void;
  headerActions?: ReactNode;
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
};

export function ChatPanel({ open, onClose, headerActions }: ChatPanelProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const { messages, pending, error, sendMessage } = useChatState();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [showQuickStarts, setShowQuickStarts] = useState(true);

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

  if (!open) return null;

  return (
    <div
      id="perazzi-chat-panel"
      role="dialog"
      aria-label="Perazzi Concierge"
      tabIndex={-1}
      ref={panelRef}
      className="flex h-full w-full flex-col border-l border-subtle bg-card text-ink shadow-elevated"
      style={{ minWidth: "320px" }}
    >
      <div className="flex items-center justify-between border-b border-subtle px-6 py-5">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">Perazzi Concierge</p>
          <h2 className="text-xl font-semibold">How can we help?</h2>
        </div>
        <div className="flex items-center gap-2">
          {headerActions}
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
      <div className="flex flex-1 flex-col overflow-hidden">
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-6 py-10 text-sm text-ink">
          <div className="flex flex-col gap-6">
            <div className="rounded-3xl border border-subtle bg-subtle/40 px-5 py-4 text-sm text-ink">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">Quick start prompts</p>
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
                Ask about platforms, service, or the bespoke process and I’ll respond in the best way that I can.
              </p>
            ) : (
              <ul className="flex flex-col gap-4">
                {messages.map((msg) => (
                  <li key={msg.id} className={msg.role === "user" ? "text-right" : "text-left"}>
                    <div
                      className={`inline-block rounded-2xl px-4 py-3 ${
                        msg.role === "user" ? "bg-ink text-card" : "bg-card border border-subtle text-ink"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <ReactMarkdown
                          rehypePlugins={[rehypeSanitize]}
                          components={markdownComponents}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      ) : (
                        msg.content
                      )}
                      {msg.similarity !== undefined && (
                        <p className="mt-2 text-xs text-ink-muted">Similarity: {(msg.similarity * 100).toFixed(1)}%</p>
                      )}
                    </div>
                  </li>
                ))}
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
          {onClose && (
            <div className="mt-3 flex justify-end">
              <button type="button" onClick={onClose} className="button-secondary text-ink">
                Close for now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
