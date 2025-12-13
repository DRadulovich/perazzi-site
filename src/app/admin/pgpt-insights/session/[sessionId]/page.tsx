import Link from "next/link";
import { notFound } from "next/navigation";
import { Pool } from "pg";

type PerazziLogRow = {
  id: string;
  created_at: string;
  env: string;
  endpoint: string;
  archetype: string | null;
  session_id: string | null;
  model: string | null;
  used_gateway: boolean | null;
  prompt: string;
  response: string;
  low_confidence: boolean | null;
  intents: string[] | null;
  topics: string[] | null;
  max_score: string | null;
  guardrail_status: string | null;
  guardrail_reason: string | null;

  // Pass 3: QA
  qa_flag_id?: string | null;
  qa_flag_status?: string | null;
  qa_flag_reason?: string | null;
  qa_flag_notes?: string | null;
  qa_flag_created_at?: string | null;
};

type QaFlagLookupRow = {
  interaction_id: string;
  id: string;
  status: string;
  reason: string | null;
  notes: string | null;
  created_at: string;
};

const LOW_SCORE_THRESHOLD = 0.25;

const QA_REASON_OPTIONS = [
  "hallucination",
  "bad_tone",
  "wrong_retrieval",
  "guardrail_false_positive",
  "guardrail_false_negative",
  "other",
] as const;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function Chevron() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90"
    >
      <path
        fillRule="evenodd"
        d="M7.21 14.77a.75.75 0 0 1 0-1.06L10.94 10 7.21 6.29a.75.75 0 1 1 1.06-1.06l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ChipRow({ items, max = 6 }: { items?: string[] | null; max?: number }) {
  if (!items || items.length === 0) return null;
  const shown = items.slice(0, max);
  const remaining = items.length - shown.length;

  return (
    <div className="flex flex-wrap gap-1">
      {shown.map((item, idx) => (
        <span
          key={`${item}-${idx}`}
          className="inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground"
        >
          {item}
        </span>
      ))}
      {remaining > 0 && (
        <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
          +{remaining}
        </span>
      )}
    </div>
  );
}

function parseScore(score: string | null): number | null {
  if (!score) return null;
  const n = Number(score);
  return Number.isFinite(n) ? n : null;
}

function truncate(text: string, length = 600) {
  if (!text) return "";
  return text.length > length ? `${text.slice(0, length)}...` : text;
}

// --- Minimal Markdown renderer (safe, server-side) ---
function isSafeHref(href: string): boolean {
  const trimmed = href.trim();
  return trimmed.startsWith("https://") || trimmed.startsWith("http://") || trimmed.startsWith("mailto:");
}

function renderInlineMarkdown(text: string): Array<string | JSX.Element> {
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
      const m = remaining.match(p.re);
      if (!m || m.index === undefined) continue;
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

  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? "";

    const fenceMatch = line.match(/^```\s*(\w+)?\s*$/);
    if (fenceMatch) {
      if (!inFence) {
        flushPara();
        inFence = true;
        fenceLang = fenceMatch[1] ?? null;
        fenceLines = [];
      } else {
        blocks.push({ type: "code", lang: fenceLang, code: fenceLines.join("\n") });
        inFence = false;
        fenceLang = null;
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

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
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

function MarkdownView({ markdown }: { markdown: string }) {
  const blocks = parseMarkdownBlocks(markdown);

  if (blocks.length === 0) {
    return <div className="text-muted-foreground">(empty)</div>;
  }

  return (
    <div className="space-y-3">
      {blocks.map((b, idx) => {
        if (b.type === "heading") {
          const base =
            b.level <= 2
              ? "text-sm font-semibold"
              : b.level === 3
                ? "text-xs font-semibold"
                : "text-xs font-medium";

          return (
            <div key={`md-h-${idx}`} className={`${base} text-foreground`}>
              {renderInlineMarkdown(b.text)}
            </div>
          );
        }

        if (b.type === "code") {
          return (
            <pre
              key={`md-codeblock-${idx}`}
              className="overflow-x-auto rounded-lg border border-border bg-muted/30 p-3 text-[11px] leading-snug text-foreground"
            >
              <code className="font-mono">{b.code}</code>
            </pre>
          );
        }

        if (b.type === "ul") {
          return (
            <ul key={`md-ul-${idx}`} className="list-disc space-y-1 pl-5 text-xs leading-relaxed text-foreground">
              {b.items.map((it, j) => (
                <li key={`md-ul-${idx}-${j}`}>{renderInlineMarkdown(it)}</li>
              ))}
            </ul>
          );
        }

        if (b.type === "ol") {
          return (
            <ol key={`md-ol-${idx}`} className="list-decimal space-y-1 pl-5 text-xs leading-relaxed text-foreground">
              {b.items.map((it, j) => (
                <li key={`md-ol-${idx}-${j}`}>{renderInlineMarkdown(it)}</li>
              ))}
            </ol>
          );
        }

        return (
          <p key={`md-p-${idx}`} className="text-xs leading-relaxed text-foreground">
            {renderInlineMarkdown(b.text)}
          </p>
        );
      })}
    </div>
  );
}

function isUuidLike(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function logRowToneClass(log: PerazziLogRow): string {
  if (log.guardrail_status === "blocked") return "border-l-4 border-red-500/50 bg-red-500/5";
  if (log.low_confidence === true) return "border-l-4 border-amber-500/50 bg-amber-500/5";

  const s = parseScore(log.max_score);
  if (log.endpoint === "assistant" && s !== null && s < LOW_SCORE_THRESHOLD)
    return "border-l-4 border-yellow-500/50 bg-yellow-500/5";

  return "border-l-4 border-transparent";
}

async function fetchQaFlagsForInteractions(interactionIds: string[]): Promise<Map<string, QaFlagLookupRow>> {
  const ids = interactionIds.filter(isUuidLike);
  if (ids.length === 0) return new Map();

  const { rows } = await pool.query<QaFlagLookupRow>(
    `
      select distinct on (interaction_id)
        interaction_id::text as interaction_id,
        id,
        status,
        reason,
        notes,
        created_at
      from qa_flags
      where interaction_id = any($1::uuid[])
      order by interaction_id, (status = 'open') desc, created_at desc;
    `,
    [ids],
  );

  const out = new Map<string, QaFlagLookupRow>();
  for (const row of rows) out.set(row.interaction_id, row);
  return out;
}

async function fetchSessionLogs(sessionId: string): Promise<PerazziLogRow[]> {
  const { rows } = await pool.query<PerazziLogRow>(
    `
      select
        id,
        created_at,
        env,
        endpoint,
        archetype,
        session_id,
        model,
        used_gateway,
        prompt,
        response,
        low_confidence,
        intents,
        topics,
        metadata->>'maxScore' as max_score,
        metadata->>'guardrailStatus' as guardrail_status,
        metadata->>'guardrailReason' as guardrail_reason
      from perazzi_conversation_logs
      where session_id = $1
      order by created_at asc;
    `,
    [sessionId],
  );

  return rows;
}

export default async function PgptInsightsSessionPage({
  params,
}: {
  params?: Promise<{ sessionId?: string }>;
}) {
  const resolvedParams = (await params) ?? {};
  const sessionId = resolvedParams.sessionId;

  const env = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development";
  const allowInProd = process.env.PGPT_INSIGHTS_ALLOW_PROD === "true";
  if (env === "production" && !allowInProd) {
    notFound();
  }

  if (!sessionId || typeof sessionId !== "string" || sessionId.trim().length === 0) {
    notFound();
  }

  const logs = await fetchSessionLogs(sessionId);

  const qaFlagMap = await fetchQaFlagsForInteractions(logs.map((l) => l.id));
  const logsWithQa = logs.map((log) => {
    const flag = qaFlagMap.get(log.id);
    return {
      ...log,
      qa_flag_id: flag?.id ?? null,
      qa_flag_status: flag?.status ?? null,
      qa_flag_reason: flag?.reason ?? null,
      qa_flag_notes: flag?.notes ?? null,
      qa_flag_created_at: flag?.created_at ?? null,
    };
  });

  const sessionHref = `/admin/pgpt-insights/session/${encodeURIComponent(sessionId)}`;

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <main className="mx-auto max-w-5xl px-6 py-12 md:py-14 space-y-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Perazzi · Workshop</p>
            <h1 className="text-2xl font-semibold tracking-tight">Session Explorer</h1>
            <p className="text-xs text-muted-foreground">
              Session: <span className="font-medium text-foreground">{sessionId}</span> · {logsWithQa.length} interactions
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/admin/pgpt-insights" className="rounded-md border px-3 py-1 text-xs hover:bg-muted">
              Back to Insights
            </Link>
            <Link href="/admin/pgpt-insights/qa" className="text-xs text-blue-600 underline">
              QA Review
            </Link>
          </div>
        </header>

        <section className="space-y-3">
          {logsWithQa.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card shadow-sm p-6 text-sm text-muted-foreground">
              No interactions found for this session.
            </div>
          ) : (
            logsWithQa.map((log) => {
              const tone = logRowToneClass(log);
              const score = parseScore(log.max_score);
              const viewHref = log.qa_flag_id ? `/admin/pgpt-insights/qa#flag-${log.qa_flag_id}` : "/admin/pgpt-insights/qa";

              const interactionAnchor = `interaction-${log.id}`;
              const returnTo = `${sessionHref}#${interactionAnchor}`;

              return (
                <details
                  key={log.id}
                  id={interactionAnchor}
                  open
                  className={`group rounded-2xl border border-border bg-card shadow-sm p-4 sm:p-5 scroll-mt-24 transition-colors hover:bg-muted/20 ${tone}`}
                >
                  <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground break-words leading-snug">
                          {String(log.created_at)} · {log.env} · {log.endpoint}
                          {log.model ? ` · ${log.model}` : ""}
                          {typeof score === "number" ? ` · maxScore ${score.toFixed(3)}` : ""}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {log.guardrail_status === "blocked" ? (
                            <span className="inline-flex items-center rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-red-700">
                              Guardrail blocked
                            </span>
                          ) : null}

                          {log.low_confidence === true ? (
                            <span className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-700">
                              Low confidence
                            </span>
                          ) : null}

                          {log.qa_flag_status === "open" ? (
                            <span className="inline-flex items-center rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-red-700">
                              QA Open
                            </span>
                          ) : log.qa_flag_status === "resolved" ? (
                            <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-emerald-700">
                              QA Resolved
                            </span>
                          ) : null}

                          {log.archetype ? (
                            <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                              {log.archetype}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <Chevron />
                    </div>
                  </summary>

                  <div className="mt-4 space-y-4">
                    {log.guardrail_status === "blocked" && log.guardrail_reason ? (
                      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs border-l-4 border-red-500/40">
                        <div className="text-[10px] uppercase tracking-wide text-red-700">Guardrail reason</div>
                        <div className="mt-1 text-red-800 break-words">{log.guardrail_reason}</div>
                      </div>
                    ) : null}

                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="space-y-2">
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Prompt</div>
                        <details className="group">
                          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                            <div className="break-words text-xs leading-snug text-foreground">
                              {truncate(log.prompt ?? "", 260)}
                            </div>
                            <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground group-open:hidden">
                              expand
                            </div>
                          </summary>
                          <pre className="mt-2 max-h-[480px] overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-background p-3 text-xs leading-snug text-foreground">
                            {log.prompt ?? ""}
                          </pre>
                        </details>
                      </div>

                      <div className="space-y-2">
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Response</div>
                        <details className="group">
                          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                            <div className="break-words text-xs leading-snug text-foreground">
                              {truncate(log.response ?? "", 260)}
                            </div>
                            <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground group-open:hidden">
                              expand
                            </div>
                          </summary>
                          <div className="mt-2 max-h-[480px] overflow-auto rounded-xl border border-border bg-background p-3 text-xs text-foreground">
                            <MarkdownView markdown={log.response ?? ""} />
                          </div>
                        </details>
                      </div>
                    </div>

                    {(log.intents && log.intents.length > 0) || (log.topics && log.topics.length > 0) ? (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-6">
                        {log.intents && log.intents.length > 0 ? (
                          <div className="space-y-1">
                            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Intents</div>
                            <ChipRow items={log.intents} />
                          </div>
                        ) : null}

                        {log.topics && log.topics.length > 0 ? (
                          <div className="space-y-1">
                            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Topics</div>
                            <ChipRow items={log.topics} />
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="rounded-xl border border-border bg-background p-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">QA</div>

                          {log.qa_flag_status === "open" ? (
                            <div className="flex items-center gap-3 text-xs">
                              <span className="inline-flex items-center rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-red-700">
                                Open
                              </span>
                              {log.qa_flag_reason ? <span className="text-xs text-muted-foreground">{log.qa_flag_reason}</span> : null}
                              <Link href={viewHref} className="text-xs text-blue-600 underline">
                                View flag
                              </Link>
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground">
                              {log.qa_flag_status === "resolved"
                                ? `Resolved${log.qa_flag_reason ? ` · ${log.qa_flag_reason}` : ""}`
                                : "Not flagged"}
                              {log.qa_flag_status === "resolved" ? (
                                <>
                                  {" "}
                                  ·{" "}
                                  <Link href={viewHref} className="text-xs text-blue-600 underline">
                                    View
                                  </Link>
                                </>
                              ) : null}
                            </div>
                          )}
                        </div>

                        {log.qa_flag_status === "open" ? null : (
                          <form method="POST" action="/admin/pgpt-insights/qa/flag" className="flex flex-wrap items-center gap-2">
                            <input type="hidden" name="interactionId" value={log.id} />
                            <input type="hidden" name="returnTo" value={returnTo} />

                            <select name="reason" defaultValue="hallucination" className="h-9 rounded-md border bg-background px-2 text-xs">
                              {QA_REASON_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>

                            <input
                              name="notes"
                              placeholder="notes…"
                              maxLength={200}
                              className="h-9 w-[260px] max-w-full rounded-md border bg-background px-3 text-xs"
                            />

                            <button type="submit" className="inline-flex h-9 items-center rounded-md border border-border bg-background px-4 text-xs hover:bg-muted">
                              {log.qa_flag_status === "resolved" ? "Flag again" : "Flag"}
                            </button>
                          </form>
                        )}
                      </div>
                    </div>

                    <div className="text-[11px] text-muted-foreground">
                      Interaction ID: <span className="font-mono">{log.id}</span>
                      {log.used_gateway !== null ? ` · gateway: ${String(log.used_gateway)}` : ""}
                    </div>
                  </div>
                </details>
              );
            })
          )}
        </section>
      </main>
    </div>
  );
}