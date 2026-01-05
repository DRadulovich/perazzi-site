import type { ReactNode } from "react";

// --- Minimal Markdown renderer (safe, server-side) ---
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

type InlineType = "link" | "code" | "bold" | "italic";
type InlineMatch = { type: InlineType; match: RegExpMatchArray; index: number };
type InlineRenderResult = { nodes: ReactNode[]; consumed: number };

const inlinePatterns: Array<{ type: InlineType; re: RegExp }> = [
  { type: "link", re: /\[([^\]]+)\]\(([^)]+)\)/ },
  { type: "code", re: /`([^`]+)`/ },
  { type: "bold", re: /\*\*([^*]+)\*\*/ },
  { type: "italic", re: /_([^_]+)_/ },
];

function findEarliestInlineMatch(text: string): InlineMatch | null {
  let earliest: InlineMatch | null = null;

  for (const p of inlinePatterns) {
    const m = p.re.exec(text);
    if (m?.index === undefined) continue;
    if (!earliest || m.index < earliest.index) earliest = { type: p.type, match: m, index: m.index };
  }

  return earliest;
}

function renderInlineLink(match: RegExpMatchArray, nextKey: () => number): InlineRenderResult {
  const full = match[0] ?? "";
  const label = match[1] ?? "";
  const href = match[2] ?? "";
  const safeHref = sanitizeHref(href);
  if (!safeHref) {
    return { nodes: [label], consumed: full.length };
  }

  const isExternal = /^https?:\/\//i.test(safeHref);
  return {
    nodes: [
      <a
        key={`md-link-${nextKey()}`}
        href={safeHref}
        className="text-blue-600 underline underline-offset-4 hover:text-blue-700"
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noreferrer noopener" : undefined}
      >
        {label}
      </a>,
    ],
    consumed: full.length,
  };
}

function renderInlineCode(match: RegExpMatchArray, nextKey: () => number): InlineRenderResult {
  const full = match[0] ?? "";
  const code = match[1] ?? "";
  return {
    nodes: [
      <code
        key={`md-code-${nextKey()}`}
        className="rounded border border-border bg-muted/30 px-1 py-0.5 font-mono text-[11px] text-foreground"
      >
        {code}
      </code>,
    ],
    consumed: full.length,
  };
}

function renderInlineBold(match: RegExpMatchArray, nextKey: () => number): InlineRenderResult {
  const full = match[0] ?? "";
  const content = match[1] ?? "";
  return {
    nodes: [
      <strong key={`md-bold-${nextKey()}`} className="font-semibold text-foreground">
        {content}
      </strong>,
    ],
    consumed: full.length,
  };
}

function renderInlineItalic(match: RegExpMatchArray, nextKey: () => number): InlineRenderResult {
  const full = match[0] ?? "";
  const content = match[1] ?? "";
  return {
    nodes: [
      <em key={`md-italic-${nextKey()}`} className="italic text-foreground">
        {content}
      </em>,
    ],
    consumed: full.length,
  };
}

function renderInlineMatch(match: InlineMatch, nextKey: () => number): InlineRenderResult {
  switch (match.type) {
    case "link":
      return renderInlineLink(match.match, nextKey);
    case "code":
      return renderInlineCode(match.match, nextKey);
    case "bold":
      return renderInlineBold(match.match, nextKey);
    case "italic":
      return renderInlineItalic(match.match, nextKey);
    default: {
      const _exhaustive: never = match.type;
      return _exhaustive;
    }
  }
}

function addLineBreaks(nodes: ReactNode[], nextKey: () => number): ReactNode[] {
  const withBreaks: ReactNode[] = [];

  for (const node of nodes) {
    if (typeof node !== "string") {
      withBreaks.push(node);
      continue;
    }

    const parts = node.split("\n");
    for (let i = 0; i < parts.length; i += 1) {
      const part = parts[i];
      if (part) withBreaks.push(part);
      if (i < parts.length - 1) withBreaks.push(<br key={`md-br-${nextKey()}`} />);
    }
  }

  return withBreaks;
}

function renderInlineMarkdown(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let remaining = text;
  let key = 0;
  const nextKey = () => key++;

  while (remaining.length > 0) {
    const earliest = findEarliestInlineMatch(remaining);
    if (!earliest) {
      out.push(remaining);
      break;
    }

    if (earliest.index > 0) out.push(remaining.slice(0, earliest.index));

    const { nodes, consumed } = renderInlineMatch(earliest, nextKey);
    out.push(...nodes);
    remaining = remaining.slice(earliest.index + consumed);
  }

  return addLineBreaks(out, nextKey);
}

type MarkdownBlock =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "code"; lang: string | null; code: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] };
type MarkdownViewProps = Readonly<{ markdown: string }>;

type MarkdownParserState = {
  blocks: MarkdownBlock[];
  para: string[];
  inFence: boolean;
  fenceLang: string | null;
  fenceLines: string[];
};

type ListConfig = { type: "ul" | "ol"; testRe: RegExp; stripRe: RegExp };

function normalizeMarkdownSource(markdown: string): string {
  return String(markdown ?? "").replaceAll("\r\n", "\n");
}

function flushParagraph(state: MarkdownParserState): void {
  const text = state.para.join("\n").trim();
  if (text) state.blocks.push({ type: "paragraph", text });
  state.para = [];
}

function openFence(state: MarkdownParserState, lang: string | null): void {
  flushParagraph(state);
  state.inFence = true;
  state.fenceLang = lang;
  state.fenceLines = [];
}

function closeFence(state: MarkdownParserState): void {
  state.blocks.push({ type: "code", lang: state.fenceLang, code: state.fenceLines.join("\n") });
  state.inFence = false;
  state.fenceLang = null;
  state.fenceLines = [];
}

function handleFenceLine(
  lines: string[],
  i: number,
  state: MarkdownParserState,
  fenceRe: RegExp,
): number | null {
  const line = lines[i] ?? "";
  const fenceMatch = fenceRe.exec(line);
  if (fenceMatch) {
    if (state.inFence) {
      closeFence(state);
    } else {
      openFence(state, fenceMatch[1] ?? null);
    }
    return i + 1;
  }

  if (state.inFence) {
    state.fenceLines.push(line);
    return i + 1;
  }

  return null;
}

function handleHeadingLine(
  lines: string[],
  i: number,
  state: MarkdownParserState,
  headingRe: RegExp,
): number | null {
  const line = lines[i] ?? "";
  const headingMatch = headingRe.exec(line);
  if (!headingMatch) return null;

  flushParagraph(state);
  const level = Math.min(6, headingMatch[1]?.length ?? 1);
  state.blocks.push({ type: "heading", level, text: headingMatch[2] ?? "" });
  return i + 1;
}

function handleListBlock(
  lines: string[],
  i: number,
  state: MarkdownParserState,
  config: ListConfig,
): number | null {
  const line = lines[i] ?? "";
  if (!config.testRe.test(line)) return null;

  flushParagraph(state);
  const items: string[] = [];
  let idx = i;
  while (idx < lines.length && config.testRe.test(lines[idx] ?? "")) {
    items.push(String(lines[idx]).replace(config.stripRe, "").trim());
    idx += 1;
  }
  state.blocks.push({ type: config.type, items });
  return idx;
}

function handleBlankLine(lines: string[], i: number, state: MarkdownParserState): number | null {
  const line = lines[i] ?? "";
  if (line.trim() !== "") return null;

  flushParagraph(state);
  return i + 1;
}

function parseMarkdownBlocks(markdown: string): MarkdownBlock[] {
  const src = normalizeMarkdownSource(markdown);
  const lines = src.split("\n");

  const state: MarkdownParserState = {
    blocks: [],
    para: [],
    inFence: false,
    fenceLang: null,
    fenceLines: [],
  };

  const fenceRe = /^```\s*(\w+)?\s*$/;
  const headingRe = /^(#{1,6})\s+(.*)$/;
  const listConfigs: Record<"ul" | "ol", ListConfig> = {
    ul: { type: "ul", testRe: /^\s*[-*]\s+/, stripRe: /^\s*[-*]\s+/ },
    ol: { type: "ol", testRe: /^\s*\d+\.\s+/, stripRe: /^\s*\d+\.\s+/ },
  };

  let i = 0;
  while (i < lines.length) {
    const nextIndex =
      handleFenceLine(lines, i, state, fenceRe) ??
      handleHeadingLine(lines, i, state, headingRe) ??
      handleListBlock(lines, i, state, listConfigs.ul) ??
      handleListBlock(lines, i, state, listConfigs.ol) ??
      handleBlankLine(lines, i, state);

    if (nextIndex !== null) {
      i = nextIndex;
      continue;
    }

    state.para.push(lines[i] ?? "");
    i += 1;
  }

  if (state.inFence) {
    closeFence(state);
  }

  flushParagraph(state);
  return state.blocks;
}

function getBlockKeySuffix(b: MarkdownBlock): string {
  if (b.type === "code") {
    return b.code.slice(0, 50);
  }
  if (b.type === "ul" || b.type === "ol") {
    return b.items.join("-").slice(0, 50);
  }
  if ("text" in b) {
    return b.text.slice(0, 50);
  }
  return "";
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

export function MarkdownView({ markdown }: MarkdownViewProps) {
  const blocks = parseMarkdownBlocks(markdown);

  if (blocks.length === 0) {
    return <div className="text-muted-foreground">(empty)</div>;
  }

  return (
    <div className="space-y-3">
      {blocks.map((b, blockIdx) => {
        const blockKey = `${b.type}-${blockIdx}-${getBlockKeySuffix(b)}`;

        if (b.type === "heading") {
          const base = getHeadingClass(b.level);

          return (
            <div key={`md-h-${blockKey}`} className={`${base} text-foreground`}>
              {renderInlineMarkdown(b.text)}
            </div>
          );
        }

        if (b.type === "code") {
          return (
            <pre
              key={`md-codeblock-${blockKey}`}
              className="overflow-x-auto rounded-lg border border-border bg-muted/30 p-3 text-[11px] leading-snug text-foreground"
            >
              <code className="font-mono">{b.code}</code>
            </pre>
          );
        }

        if (b.type === "ul") {
          return (
            <ul key={`md-ul-${blockKey}`} className="list-disc space-y-1 pl-5 text-xs leading-relaxed text-foreground">
              {b.items.map((it, itemIdx) => (
                <li key={`md-ul-item-${blockIdx}-${itemIdx}-${it.slice(0, 50)}`}>
                  {renderInlineMarkdown(it)}
                </li>
              ))}
            </ul>
          );
        }

        if (b.type === "ol") {
          return (
            <ol key={`md-ol-${blockKey}`} className="list-decimal space-y-1 pl-5 text-xs leading-relaxed text-foreground">
              {b.items.map((it, itemIdx) => (
                <li key={`md-ol-item-${blockIdx}-${itemIdx}-${it.slice(0, 50)}`}>
                  {renderInlineMarkdown(it)}
                </li>
              ))}
            </ol>
          );
        }

        return (
          <p key={`md-p-${blockKey}`} className="text-xs leading-relaxed text-foreground">
            {renderInlineMarkdown(b.text)}
          </p>
        );
      })}
    </div>
  );
}
