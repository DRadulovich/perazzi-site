import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import type { ChatEntry } from "@/components/chat/useChatState";

interface ConversationViewProps {
  messages: ChatEntry[];
  isTyping?: boolean;
  pending?: boolean;
}

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

export function ConversationView({ messages, isTyping, pending }: ConversationViewProps) {
  const listRef = useRef<HTMLUListElement | null>(null);
  const lastMessageRef = useRef<HTMLLIElement | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (listRef.current) {
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

  const handleCopy = async (id: string, content: string) => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      window.setTimeout(() => {
        setCopiedId((current) => (current === id ? null : current));
      }, 2000);
    } catch {
      // ignore
    }
  };

  const normalizedTyping = pending || isTyping;

  return (
    <ul ref={listRef} className="flex flex-col gap-6">
      {messages.map((msg, index) => {
        const isAssistant = msg.role === "assistant";
        const showMarker =
          isAssistant && (index === 0 || messages[index - 1]?.role !== "assistant");
        const isLast = index === messages.length - 1;
        return (
          <li
            key={msg.id}
            className="relative"
            ref={isLast ? lastMessageRef : undefined}
          >
            {showMarker && (
              <div className="mb-3 flex items-center gap-3 text-[11px] sm:text-xs uppercase tracking-[0.2em] text-white">
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
            {normalizedTyping && index === messages.length - 1 && msg.role === "user" && (
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
      {normalizedTyping && messages.length === 0 ? (
        <li className="text-sm text-ink-muted">Collecting references…</li>
      ) : null}
    </ul>
  );
}
