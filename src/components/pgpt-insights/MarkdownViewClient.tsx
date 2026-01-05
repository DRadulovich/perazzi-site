"use client";

import type { ReactNode } from "react";

// --- Minimal Markdown renderer (safe, client-side) ---
type InlinePatternType = "link" | "code" | "bold" | "italic";

type InlinePattern = { type: InlinePatternType; re: RegExp };

type InlineMatch = { type: InlinePatternType; match: RegExpMatchArray; index: number };

type InlineRenderResult = { node: ReactNode; nextKey: number };

const INLINE_PATTERNS: InlinePattern[] = [
  { type: "link", re: /\[([^\]]+)\]\(([^)]+)\)/ },
  { type: "code", re: /`([^`]+)`/ },
  { type: "bold", re: /\*\*([^*]+)\*\*/ },
  { type: "italic", re: /_([^_]+)_/ },
];

function sanitizeHref(href: string): string | null {
  const trimmed = (href ?? "").trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:")) return null;

  if (lower.startsWith("http://") || lower.startsWith("https://") || lower.startsWith("mailto:")) {
    return trimmed;
  }

  if (trimmed.startsWith("/") || trimmed.startsWith("./") || trimmed.startsWith("../") || trimmed.startsWith("#")) {
    return trimmed;
  }

  return null;
}

function findEarliestInlineMatch(text: string): InlineMatch | null {
  let earliest: InlineMatch | null = null;

  for (const pattern of INLINE_PATTERNS) {
    const match = pattern.re.exec(text);
    if (match?.index === undefined) continue;
    if (!earliest || match.index < earliest.index) {
      earliest = { type: pattern.type, match, index: match.index };
    }
  }

  return earliest;
}

function renderInlineMatch(earliest: InlineMatch, key: number): InlineRenderResult {
  switch (earliest.type) {
    case "link": {
      const label = earliest.match[1] ?? "";
      const href = earliest.match[2] ?? "";
      const safeHref = sanitizeHref(href);
      if (!safeHref) {
        return { node: label, nextKey: key };
      }

      const isExternal = /^https?:\/\//i.test(safeHref);
      return {
        node: (
          <a
            key={`md-link-${key}`}
            href={safeHref}
            className="text-blue-600 underline underline-offset-4 hover:text-blue-700"
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noreferrer noopener" : undefined}
          >
            {label}
          </a>
        ),
        nextKey: key + 1,
      };
    }
    case "code": {
      const code = earliest.match[1] ?? "";
      return {
        node: (
          <code
            key={`md-code-${key}`}
            className="rounded border border-border bg-muted/30 px-1 py-0.5 font-mono text-[11px] text-foreground"
          >
            {code}
          </code>
        ),
        nextKey: key + 1,
      };
    }
    case "bold": {
      const content = earliest.match[1] ?? "";
      return {
        node: (
          <strong key={`md-bold-${key}`} className="font-semibold text-foreground">
            {content}
          </strong>
        ),
        nextKey: key + 1,
      };
    }
    case "italic": {
      const content = earliest.match[1] ?? "";
      return {
        node: (
          <em key={`md-italic-${key}`} className="italic text-foreground">
            {content}
          </em>
        ),
        nextKey: key + 1,
      };
    }
    default:
      return { node: earliest.match[0] ?? "", nextKey: key };
  }
}

function addInlineLineBreaks(nodes: ReactNode[], getKey: () => number): ReactNode[] {
  const withBreaks: ReactNode[] = [];

  for (const node of nodes) {
    if (typeof node !== "string") {
      withBreaks.push(node);
      continue;
    }

    const parts = node.split("\n");
    for (let idx = 0; idx < parts.length; idx++) {
      const part = parts[idx];
      if (part) withBreaks.push(part);
      if (idx < parts.length - 1) withBreaks.push(<br key={`md-br-${getKey()}`} />);
    }
  }

  return withBreaks;
}

function renderInlineMarkdown(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const earliest = findEarliestInlineMatch(remaining);

    if (!earliest) {
      out.push(remaining);
      break;
    }

    if (earliest.index > 0) out.push(remaining.slice(0, earliest.index));

    const full = earliest.match[0] ?? "";

    const result = renderInlineMatch(earliest, key);
    out.push(result.node);
    key = result.nextKey;

    remaining = remaining.slice(earliest.index + full.length);
  }
  return addInlineLineBreaks(out, () => key++);
}

type MarkdownBlock =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "code"; lang: string | null; code: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] };

type ListBlock = { type: "ul" | "ol"; items: string[]; nextIndex: number };

const FENCE_REGEX = /^```\s*(\w+)?\s*$/;
const UL_MARKER = /^\s*[-*]\s+/;
const OL_MARKER = /^\s*\d+\.\s+/;

function normalizeMarkdown(markdown: string): string {
  return String(markdown ?? "").replaceAll("\r\n", "\n");
}

function readFenceBlock(lines: string[], startIndex: number): { code: string; nextIndex: number } {
  const fenceLines: string[] = [];
  let i = startIndex;

  while (i < lines.length) {
    const line = lines[i] ?? "";
    if (FENCE_REGEX.test(line)) {
      return { code: fenceLines.join("\n"), nextIndex: i + 1 };
    }
    fenceLines.push(line);
    i += 1;
  }

  return { code: fenceLines.join("\n"), nextIndex: i };
}

function collectListItems(lines: string[], startIndex: number, marker: RegExp, type: "ul" | "ol"): ListBlock {
  const items: string[] = [];
  let i = startIndex;

  while (i < lines.length && marker.test(lines[i] ?? "")) {
    items.push(String(lines[i]).replace(marker, "").trim());
    i += 1;
  }

  return { type, items, nextIndex: i };
}

function parseListBlock(lines: string[], startIndex: number): ListBlock | null {
  const line = lines[startIndex] ?? "";
  if (UL_MARKER.test(line)) {
    return collectListItems(lines, startIndex, UL_MARKER, "ul");
  }
  if (OL_MARKER.test(line)) {
    return collectListItems(lines, startIndex, OL_MARKER, "ol");
  }
  return null;
}

function parseMarkdownBlocks(markdown: string): MarkdownBlock[] {
  const src = normalizeMarkdown(markdown);
  const lines = src.split("\n");

  const blocks: MarkdownBlock[] = [];
  let para: string[] = [];

  const flushPara = () => {
    const text = para.join("\n").trim();
    if (text) blocks.push({ type: "paragraph", text });
    para = [];
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? "";

    const fenceMatch = FENCE_REGEX.exec(line);
    if (fenceMatch) {
      flushPara();
      const lang = fenceMatch[1] ?? null;
      const { code, nextIndex } = readFenceBlock(lines, i + 1);
      blocks.push({ type: "code", lang, code });
      i = nextIndex;
      continue;
    }

    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(line);
    if (headingMatch) {
      flushPara();
      const level = Math.min(6, headingMatch[1]?.length ?? 1);
      blocks.push({ type: "heading", level, text: headingMatch[2] ?? "" });
      i += 1;
      continue;
    }

    const listBlock = parseListBlock(lines, i);
    if (listBlock) {
      flushPara();
      blocks.push({ type: listBlock.type, items: listBlock.items });
      i = listBlock.nextIndex;
      continue;
    }

    if (line.trim() === "") {
      flushPara();
      i += 1;
      continue;
    }

    para.push(line);
    i += 1;
  }

  flushPara();
  return blocks;
}

function getHeadingClass(level: number): string {
  if (level <= 2) {
    return "text-sm font-semibold";
  }
  if (level === 3) {
    return "text-xs font-semibold";
  }
  return "text-xs font-medium";
}

function generateBlockKey(block: MarkdownBlock): string {
  const contentHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.codePointAt(i) ?? 0;
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  };

  if (block.type === "heading") {
    return `md-h-${block.level}-${contentHash(block.text)}`;
  }
  if (block.type === "code") {
    return `md-code-${block.lang ?? "plain"}-${contentHash(block.code)}`;
  }
  if (block.type === "ul") {
    return `md-ul-${contentHash(block.items.join(""))}`;
  }
  if (block.type === "ol") {
    return `md-ol-${contentHash(block.items.join(""))}`;
  }
  return `md-p-${contentHash(block.text)}`;
}

function generateItemKey(item: string, parentKey: string): string {
  let hash = 0;
  for (let i = 0; i < item.length; i++) {
    const char = item.codePointAt(i) ?? 0;
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `${parentKey}-item-${Math.abs(hash).toString(36)}`;
}

export function MarkdownViewClient({ markdown }: Readonly<{ markdown: string }>) {
  const blocks = parseMarkdownBlocks(markdown);

  if (blocks.length === 0) {
    return <div className="text-muted-foreground">(empty)</div>;
  }

  return (
    <div className="space-y-3">
      {blocks.map((b) => {
        const blockKey = generateBlockKey(b);

        if (b.type === "heading") {
          const base = getHeadingClass(b.level);

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
          return (
            <ul key={blockKey} className="list-disc space-y-1 pl-5 text-xs leading-relaxed text-foreground">
              {b.items.map((it) => (
                <li key={generateItemKey(it, blockKey)}>{renderInlineMarkdown(it)}</li>
              ))}
            </ul>
          );
        }

        if (b.type === "ol") {
          return (
            <ol key={blockKey} className="list-decimal space-y-1 pl-5 text-xs leading-relaxed text-foreground">
              {b.items.map((it) => (
                <li key={generateItemKey(it, blockKey)}>{renderInlineMarkdown(it)}</li>
              ))}
            </ol>
          );
        }

        return (
          <p key={blockKey} className="text-xs leading-relaxed text-foreground">
            {renderInlineMarkdown(b.text)}
          </p>
        );
      })}
    </div>
  );
}
