import React from "react";

const ORDER = ["Loyalist", "Prestige", "Analyst", "Achiever", "Legacy"] as const;
type ArchetypeKey = (typeof ORDER)[number];

export type ArchetypeScores = Partial<Record<ArchetypeKey, number>>;

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function normalize(scores: ArchetypeScores | null | undefined): Record<ArchetypeKey, number> | null {
  if (!scores) return null;

  const raw = ORDER.map((k) => {
    const v = scores[k];
    const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : 0;
    return clamp01(Number.isFinite(n) ? n : 0);
  });

  const sum = raw.reduce((a, b) => a + b, 0);
  if (!Number.isFinite(sum) || sum <= 0) return null;

  const out: Record<ArchetypeKey, number> = {
    Loyalist: raw[0] / sum,
    Prestige: raw[1] / sum,
    Analyst: raw[2] / sum,
    Achiever: raw[3] / sum,
    Legacy: raw[4] / sum,
  };
  return out;
}

function pct(n: number) {
  return `${(n * 100).toFixed(0)}%`;
}

function colorClass(k: ArchetypeKey) {
  // High-contrast, stable across light/dark
  switch (k) {
    case "Loyalist":
      return "bg-emerald-500/80";
    case "Prestige":
      return "bg-blue-500/80";
    case "Analyst":
      return "bg-violet-500/80";
    case "Achiever":
      return "bg-amber-500/80";
    case "Legacy":
      return "bg-rose-500/80";
  }
}

export function computeWinnerAndRunner(scores: Record<ArchetypeKey, number>) {
  const arr = ORDER.map((k) => ({ k, v: scores[k] }));
  arr.sort((a, b) => b.v - a.v);
  const winner = arr[0];
  const runner = arr[1] ?? null;
  const margin = runner ? winner.v - runner.v : winner.v;
  return { winner, runner, margin };
}

export function ArchetypeStackedBar({
  scores,
  heightClass = "h-2.5",
  showLabels = false,
}: {
  scores: ArchetypeScores | null | undefined;
  heightClass?: string;
  showLabels?: boolean;
}) {
  const normalized = normalize(scores);
  if (!normalized) {
    return <div className="text-xs text-muted-foreground">—</div>;
  }

  const title = ORDER.map((k) => `${k}: ${pct(normalized[k])}`).join(" · ");

  return (
    <div className="space-y-2">
      <div
        className={`flex w-full overflow-hidden rounded-full border border-border bg-muted/20 ${heightClass}`}
        title={title}
        aria-label={title}
        role="img"
      >
        {ORDER.map((k) => {
          const w = normalized[k] * 100;
          return (
            <div
              key={k}
              className={colorClass(k)}
              style={{ width: `${w}%` }}
              aria-hidden="true"
            />
          );
        })}
      </div>

      {showLabels ? (
        <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
          {ORDER.map((k) => (
            <div key={k} className="flex items-center gap-1">
              <span className={`inline-block h-2 w-2 rounded-sm ${colorClass(k)}`} aria-hidden="true" />
              <span className="font-medium text-foreground">{k}</span>
              <span>{pct(normalized[k])}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
