import type { JSX } from "react";
import Link from "next/link";

export type QaRow = {
  flag_id: string;
  flag_created_at: string;
  flag_status: string;
  flag_reason: string | null;
  flag_notes: string | null;
  interaction_id: string;

  interaction_created_at: string;
  env: string;
  endpoint: string;
  archetype: string | null;
  session_id: string | null;
  prompt: string;
  response: string;

  max_score: string | null;
  guardrail_status: string | null;
  guardrail_reason: string | null;
  low_confidence: boolean | null;
};

function truncate(text: string, length = 220) {
  if (!text) return "";
  return text.length > length ? `${text.slice(0, length)}...` : text;
}

function parseScore(score: string | null): number | null {
  if (!score) return null;
  const n = Number(score);
  return Number.isFinite(n) ? n : null;
}

// --- Minimal Markdown renderer ---
function isSafeHref(href: string): boolean {
  const trimmed = href.trim();
  return (
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("mailto:")
  );
}

function renderInlineMarkdown(text: string): Array<string | JSX.Element> {
  // Minimal inline support: links, bold, inline code, underscores italic.
  // No raw HTML is ever rendered.
  const out: Array<string | JSX.Element> = [];
  let remaining = text;
  let key = 0;

  const patterns: Array<{ type: "link" | "code" | "bold" | "italic"; re: RegExp }> = [
    { type: "link", re: /\[([^\]]+)\]\(([^)]+)\)/ },
    { type: "code", re: /`([^`]+)`/ },
    { type: "bold", re: /\*\*([^*]+)\*\*/ },
    { type: "italic", re: /_([^_]+)_/ },
  ];

  while (remaining.length > 0) {
    let earliest:
      | {
          type: "link" | "code" | "bold" | "italic";
          match: RegExpMatchArray;
          index: number;
        }
      | null = null;

    for (const p of patterns) {
      const m = p.re.exec(remaining);
      if (!m || m.index === undefined) continue;
      if (!earliest || m.index < earliest.index) {
        earliest = { type: p.type, match: m, index: m.index };
      }
    }

    if (!earliest) {
      out.push(remaining);
      break;
    }

    if (earliest.index > 0) {
      out.push(remaining.slice(0, earliest.index));
    }

    const full = earliest.match[0] ?? "";

    if (earliest.type === "link") {
      const label = earliest.match[1] ?? "";
      const href = earliest.match[2] ?? "";
      if (isSafeHref(href)) {
        out.push(
          <a
            key={`md-link-${key++}`}
            href={href}
            className="text-blue-600 underline underline-offset-4 hover:text-blue-700"
            target={href.startsWith("http") ? "_blank" : undefined}
            rel={href.startsWith("http") ? "noreferrer" : undefined}
          >
            {label}
          </a>,
        );
      } else {
        out.push(label);
      }
    } else if (earliest.type === "code") {
      const code = earliest.match[1] ?? "";
      out.push(
        <code
          key={`md-code-${key++}`}
          className="rounded border border-border bg-muted/30 px-1 py-0.5 font-mono text-[11px] text-foreground"
        >
          {code}
        </code>,
      );
    } else if (earliest.type === "bold") {
      const content = earliest.match[1] ?? "";
      out.push(
        <strong key={`md-bold-${key++}`} className="font-semibold text-foreground">
          {content}
        </strong>,
      );
    } else if (earliest.type === "italic") {
      const content = earliest.match[1] ?? "";
      out.push(
        <em key={`md-italic-${key++}`} className="italic text-foreground">
          {content}
        </em>,
      );
    }

    remaining = remaining.slice(earliest.index + full.length);
  }

  // Preserve explicit newlines inside paragraphs.
  const withBreaks: Array<string | JSX.Element> = [];
  for (const node of out) {
    if (typeof node !== "string") {
      withBreaks.push(node);
      continue;
    }
    const parts = node.split("\n");
    parts.forEach((part, idx) => {
      if (part) withBreaks.push(part);
      if (idx < parts.length - 1) withBreaks.push(<br key={`md-br-${key++}`} />);
    });
  }

  return withBreaks;
}

type MarkdownBlock =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "code"; lang: string | null; code: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] };

function parseMarkdownBlocks(markdown: string): MarkdownBlock[] {
  const src = String(markdown ?? "").replaceAll("\r\n", "\n");
  const lines = src.split("\n");

  const blocks: MarkdownBlock[] = [];
  let para: string[] = [];

  let inFence = false;
  let fenceLang: string | null = null;
  let fenceLines: string[] = [];

  const flushPara = () => {
    const text = para.join("\n").trim();
    if (text) blocks.push({ type: "paragraph", text });
    para = [];
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? "";

    const fenceMatch = /^```\s*(\w+)?\s*$/.exec(line);
    if (fenceMatch) {
      if (inFence) {
        blocks.push({ type: "code", lang: fenceLang, code: fenceLines.join("\n") });
        inFence = false;
        fenceLang = null;
        fenceLines = [];
      } else {
        flushPara();
        inFence = true;
        fenceLang = fenceMatch[1] ?? null;
        fenceLines = [];
      }
      i += 1;
      continue;
    }

    if (inFence) {
      fenceLines.push(line);
      i += 1;
      continue;
    }

    // Headings
    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(line);
    if (headingMatch) {
      flushPara();
      const level = Math.min(6, headingMatch[1]?.length ?? 1);
      blocks.push({ type: "heading", level, text: headingMatch[2] ?? "" });
      i += 1;
      continue;
    }

    // Unordered list
    if (/^\s*[-*]\s+/.test(line)) {
      flushPara();
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i] ?? "")) {
        items.push(String(lines[i]).replace(/^\s*[-*]\s+/, "").trim());
        i += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      flushPara();
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i] ?? "")) {
        items.push(String(lines[i]).replace(/^\s*\d+\.\s+/, "").trim());
        i += 1;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    // Blank line -> paragraph break
    if (line.trim() === "") {
      flushPara();
      i += 1;
      continue;
    }

    para.push(line);
    i += 1;
  }

  if (inFence) {
    // Unclosed fence: treat as code.
    blocks.push({ type: "code", lang: fenceLang, code: fenceLines.join("\n") });
  }

  flushPara();
  return blocks;
}

function stableHash(input: string): string {
  // Deterministic, non-cryptographic hash for React keys.
  let hash = 0;

  let i = 0;
  while (i < input.length) {
    const codePoint = input.codePointAt(i) ?? 0;
    hash = (hash << 5) - hash + codePoint;
    hash = Math.trunc(hash);
    i += codePoint > 0xffff ? 2 : 1;
  }

  return (hash >>> 0).toString(36);
}

function markdownBlockKeyString(b: MarkdownBlock): string {
  if (b.type === "heading") return `heading:${b.level}:${b.text}`;
  if (b.type === "paragraph") return `paragraph:${b.text}`;
  if (b.type === "code") return `code:${b.lang ?? ""}:${b.code}`;
  if (b.type === "ul") return `ul:${b.items.join("\n")}`;
  return `ol:${b.items.join("\n")}`;
}

function MarkdownView({ markdown }: Readonly<{ markdown: string }>) {
  const blocks = parseMarkdownBlocks(markdown);

  if (blocks.length === 0) {
    return <div className="text-muted-foreground">(empty)</div>;
  }

  const blockKeyCounts = new Map<string, number>();
  const nextBlockKey = (base: string) => {
    const next = (blockKeyCounts.get(base) ?? 0) + 1;
    blockKeyCounts.set(base, next);
    return `${base}-${next}`;
  };

  const makeNextItemKey = (parentKey: string) => {
    const itemKeyCounts = new Map<string, number>();
    return (item: string) => {
      const base = `${parentKey}-item-${stableHash(item)}`;
      const next = (itemKeyCounts.get(base) ?? 0) + 1;
      itemKeyCounts.set(base, next);
      return `${base}-${next}`;
    };
  };

  return (
    <div className="space-y-3">
      {blocks.map((b) => {
        const keyBase = `md-${b.type}-${stableHash(markdownBlockKeyString(b))}`;
        const blockKey = nextBlockKey(keyBase);

        if (b.type === "heading") {
          const base =
            b.level <= 2
              ? "text-sm font-semibold"
              : b.level === 3
                ? "text-xs font-semibold"
                : "text-xs font-medium";
          return (
            <div key={blockKey} className={`${base} text-foreground`}>
              {renderInlineMarkdown(b.text)}
            </div>
          );
        }

        if (b.type === "code") {
          return (
            <pre
              key={blockKey}
              className="overflow-x-auto rounded-lg border border-border bg-muted/30 p-3 text-[11px] leading-snug text-foreground"
            >
              <code className="font-mono">{b.code}</code>
            </pre>
          );
        }

        if (b.type === "ul") {
          const nextItemKey = makeNextItemKey(blockKey);

          return (
            <ul key={blockKey} className="list-disc space-y-1 pl-5 text-xs leading-relaxed text-foreground">
              {b.items.map((it) => (
                <li key={nextItemKey(it)}>{renderInlineMarkdown(it)}</li>
              ))}
            </ul>
          );
        }

        if (b.type === "ol") {
          const nextItemKey = makeNextItemKey(blockKey);

          return (
            <ol key={blockKey} className="list-decimal space-y-1 pl-5 text-xs leading-relaxed text-foreground">
              {b.items.map((it) => (
                <li key={nextItemKey(it)}>{renderInlineMarkdown(it)}</li>
              ))}
            </ol>
          );
        }

        // paragraph
        return (
          <p key={blockKey} className="text-xs leading-relaxed text-foreground">
            {renderInlineMarkdown(b.text)}
          </p>
        );
      })}
    </div>
  );
}

export function QaTable({ rows, currentHref }: { rows: QaRow[]; currentHref: string }) {
  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm p-4 sm:p-6">
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[1280px] table-fixed border-collapse text-xs">
          <colgroup>
            <col className="w-[240px]" />
            <col className="w-[90px]" />
            <col className="w-[150px]" />
            <col className="w-[220px]" />
            <col className="w-[120px]" />
            <col className="w-[120px]" />
            <col className="w-[210px]" />
            <col className="w-[320px]" />
            <col className="w-[360px]" />
            <col className="w-[180px]" />
            <col className="w-[120px]" />
          </colgroup>
          <thead>
            <tr>
              <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">
                flagged_at
              </th>
              <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">
                status
              </th>
              <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">
                reason
              </th>
              <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">
                notes
              </th>
              <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">
                env
              </th>
              <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">
                endpoint
              </th>
              <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">
                session
              </th>
              <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">
                prompt
              </th>
              <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">
                response
              </th>
              <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">
                signals
              </th>
              <th className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur">
                actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border/60">
            {rows.map((row) => {
              const score = parseScore(row.max_score);
              const isOpen = row.flag_status === "open";
              const rowTone = isOpen
                ? "border-l-4 border-red-500/50 bg-red-500/5"
                : row.flag_status === "resolved"
                  ? "border-l-4 border-emerald-500/30"
                  : "border-l-4 border-transparent";
              const anchorId = `flag-${row.flag_id}`;

              return (
                <tr key={row.flag_id} id={anchorId} className={`${rowTone} scroll-mt-24 hover:bg-muted/20`}>
                  <td className="px-3 py-2 whitespace-normal break-words leading-snug">{String(row.flag_created_at)}</td>
                  <td className="px-3 py-2">
                    {isOpen ? (
                      <span className="inline-flex items-center rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-red-700">
                        open
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-emerald-700">
                        resolved
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">{row.flag_reason ?? "(none)"}</td>
                  <td className="px-3 py-2 break-words">{row.flag_notes ? truncate(row.flag_notes, 120) : ""}</td>
                  <td className="px-3 py-2">{row.env}</td>
                  <td className="px-3 py-2">{row.endpoint}</td>
                  <td className="px-3 py-2">
                    {row.session_id ? (
                      <Link
                        href={`/admin/pgpt-insights/session/${encodeURIComponent(row.session_id)}#interaction-${encodeURIComponent(row.interaction_id)}`}
                        className="text-blue-600 underline"
                      >
                        {row.session_id}
                      </Link>
                    ) : (
                      ""
                    )}
                  </td>
                  <td className="px-3 py-2 align-top">
                    <details className="group">
                      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                        <div className="break-words text-xs leading-snug text-foreground">
                          {truncate(row.prompt ?? "", 180)}
                        </div>
                        <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground group-open:hidden">
                          expand
                        </div>
                      </summary>
                      <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-border bg-background p-2 text-xs leading-snug text-foreground">
                        {row.prompt ?? ""}
                      </pre>
                    </details>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <details className="group">
                      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                        <div className="break-words text-xs leading-snug text-foreground">
                          {truncate(row.response ?? "", 180)}
                        </div>
                        <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground group-open:hidden">
                          expand
                        </div>
                      </summary>
                      <div className="mt-2 max-h-[480px] overflow-auto rounded-lg border border-border bg-background p-3 text-xs text-foreground">
                        <MarkdownView markdown={row.response ?? ""} />
                      </div>
                    </details>
                  </td>
                  <td className="px-3 py-2">
                    <div className="space-y-1 text-[11px]">
                      <div>maxScore: {score === null ? "—" : score.toFixed(3)}</div>
                      {row.low_confidence === true ? <div className="text-amber-700">low_confidence</div> : null}
                      {row.guardrail_status === "blocked" ? (
                        <div className="text-red-700">{`blocked${row.guardrail_reason ? `: ${row.guardrail_reason}` : ""}`}</div>
                      ) : null}
                      {row.archetype ? <div>archetype: {row.archetype}</div> : null}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {isOpen ? (
                      <form method="POST" action="/admin/pgpt-insights/qa/resolve" className="inline-flex"><input type="hidden" name="flagId" value={row.flag_id} /><input type="hidden" name="returnTo" value={currentHref} />
                        <button
                          type="submit"
                          className="inline-flex items-center rounded-md border border-border bg-background px-3 py-1 text-[11px] text-muted-foreground hover:bg-muted"
                        >
                          Resolve
                        </button>
                      </form>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}

            {rows.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-3 py-4 text-center text-xs text-muted-foreground">
                  No QA flags for the current filter.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
