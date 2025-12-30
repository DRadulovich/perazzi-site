import { Children, isValidElement, useEffect, useRef, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import type { ChatEntry } from "@/components/chat/useChatState";
import { getRetrievalLabelFromScores } from "@/lib/retrieval-label";
import { Button, Text } from "@/components/ui";

interface ConversationViewProps {
  readonly messages: ReadonlyArray<ChatEntry>;
  readonly isTyping?: boolean;
  readonly pending?: boolean;
}

type ElementWithChildren = ReactElement<{ children?: ReactNode }>;

const isElementWithChildren = (node: ReactNode): node is ElementWithChildren =>
  isValidElement<{ children?: ReactNode }>(node);

const childrenToArray = (node?: ReactNode) => Children.toArray(node);

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
    <strong {...props} />
  ),
  table: ({ children, ...props }: React.TableHTMLAttributes<HTMLTableElement>) => {
    // Provide an accessible header row even when Markdown content omits one.
    const childArray = Children.toArray(children);
    const hasHeader = childArray.some((child) => {
      if (!isElementWithChildren(child)) return false;
      if (child.type === "thead") return true;
      if (child.type === "tr") {
        return childrenToArray(child.props.children).some(
          (cell) => isElementWithChildren(cell) && cell.type === "th",
        );
      }
      return false;
    });

    const columnCount =
      childArray.reduce<number>((count, child) => {
        if (!isElementWithChildren(child)) return count;
        if (child.type === "thead" || child.type === "tbody") {
          const row = childrenToArray(child.props.children).find(
            (rowChild): rowChild is ElementWithChildren =>
              isElementWithChildren(rowChild) && rowChild.type === "tr",
          );
          if (row) {
            const cells = childrenToArray(row.props.children).filter(
              (cell): cell is ElementWithChildren =>
                isElementWithChildren(cell) && (cell.type === "td" || cell.type === "th"),
            );
            return Math.max(count, cells.length);
          }
        }
        if (child.type === "tr") {
          const cells = childrenToArray(child.props.children).filter(
            (cell): cell is ElementWithChildren =>
              isElementWithChildren(cell) && (cell.type === "td" || cell.type === "th"),
          );
          return Math.max(count, cells.length);
        }
        return count;
      }, 0) || 1;

    return (
      <div className="my-4 overflow-x-auto">
        <table className="w-full border-collapse text-left type-body-sm" {...props}>
          {hasHeader ? null : (
            <thead className="sr-only">
              <tr>
                {Array.from({ length: columnCount }, (_, index) => (
                  <th key={index} scope="col">
                    Column {index + 1}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          {children}
        </table>
      </div>
    );
  },
  thead: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className="bg-subtle type-label-tight text-ink-muted" {...props} />
  ),
  th: (props: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th className="border border-border/70 px-3 py-2 text-ink" {...props} />
  ),
  td: (props: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td className="border border-border/70 px-3 py-2 text-ink" {...props} />
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
      <Text
        asChild
        className="rounded-2xl bg-subtle px-4 py-3 text-ink-muted"
        leading="relaxed"
      >
        <p>Ask about platforms, service, or heritage. I’ll respond in the Perazzi workshop tone.</p>
      </Text>
    );
  }

  const handleCopy = async (id: string, content: string) => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      globalThis.setTimeout(() => {
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
              <div className="type-label-tight mb-3 flex items-center gap-3 text-white">
                <div className="flex-1 border-t border-perazzi-red" aria-hidden="true" />
                <span className="rounded-full bg-perazzi-red px-3 py-1 text-white">
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
                  <div className="mt-3 flex flex-wrap gap-2 type-label-tight">
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
            {normalizedTyping && index === messages.length - 1 && msg.role === "user" && (
              <div className="mt-2 flex items-center gap-2 type-label-tight text-ink-muted">
                <span className="relative flex h-5 w-5 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-spin rounded-full border-2 border-subtle border-t-transparent" />
                  <span className="inline-flex h-2 w-2 rounded-full bg-ink" />
                </span>
                <span>Collecting references…</span>
              </div>
            )}
          </li>
        );
      })}
      {normalizedTyping && messages.length === 0 ? (
        <Text asChild className="text-ink-muted" leading="normal">
          <li>Collecting references…</li>
        </Text>
      ) : null}
    </ul>
  );
}
