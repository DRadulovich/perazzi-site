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

function renderInlineMarkdown(text: string): ReactNode[] {
  const out: ReactNode[] = [];
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
      if (m?.index === undefined) continue;
      if (!earliest || m.index < earliest.index) earliest = { type: p.type, match: m, index: m.index };
    }

    if (!earliest) {
      out.push(remaining);
      break;
    }

    if (earliest.index > 0) out.push(remaining.slice(0, earliest.index));

    const full = earliest.match[0] ?? "";

    if (earliest.type === "link") {
      const label = earliest.match[1] ?? "";
      const href = earliest.match[2] ?? "";
      const safeHref = sanitizeHref(href);
      if (!safeHref) {
        out.push(label);
        remaining = remaining.slice(earliest.index + full.length);
        continue;
      }

      const isExternal = /^https?:\/\//i.test(safeHref);
      out.push(
        <a
          key={`md-link-${key++}`}
          href={safeHref}
          className="text-blue-600 underline underline-offset-4 hover:text-blue-700"
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noreferrer noopener" : undefined}
        >
          {label}
        </a>,
      );
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

  const withBreaks: ReactNode[] = [];
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
type MarkdownViewProps = Readonly<{ markdown: string }>;

function parseMarkdownBlocks(markdown: string): MarkdownBlock[] {
  const src = String(markdown ?? "").replace(/\r\n/g, "\n");
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

  const fenceRe = /^```\s*(\w+)?\s*$/;
  const headingRe = /^(#{1,6})\s+(.*)$/;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? "";

    const fenceMatch = fenceRe.exec(line);
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

    const headingMatch = headingRe.exec(line);
    if (headingMatch) {
      flushPara();
      const level = Math.min(6, headingMatch[1]?.length ?? 1);
      blocks.push({ type: "heading", level, text: headingMatch[2] ?? "" });
      i += 1;
      continue;
    }

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

    if (line.trim() === "") {
      flushPara();
      i += 1;
      continue;
    }

    para.push(line);
    i += 1;
  }

  if (inFence) {
    blocks.push({ type: "code", lang: fenceLang, code: fenceLines.join("\n") });
  }

  flushPara();
  return blocks;
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
